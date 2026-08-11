/**
 * Assignment API helpers — delivery dispatch and driver-vehicle history.
 */

import {
  compareStringsAsc,
  compareStringsDesc,
  getUniqueSortedStrings,
} from '../utils/adminListFilterUtils';
import { createDeliveryAssignment as createDeliveryAssignmentViaCompliance } from './complianceService';
import type { AuthenticatedRequest } from './vehicleService';

export interface DriverVehicleAssignmentPayload {
  driver_id: number | string;
  vehicle_id: number | string;
  assigned_from: string;
  assigned_to?: string | null;
}

export async function parseAssignmentApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    return JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
  }
}

export async function fetchAssignments(request: AuthenticatedRequest): Promise<any[]> {
  const response = await request('/assignments/');
  if (!response.ok) {
    throw new Error(await parseAssignmentApiError(response));
  }
  const data = await response.json();
  return data.results ?? data;
}

export async function createDeliveryAssignment(
  request: AuthenticatedRequest,
  payload: { delivery: number; driver: number },
): Promise<{ id: number }> {
  return createDeliveryAssignmentViaCompliance(request, payload);
}

export async function fetchDriverVehicles(request: AuthenticatedRequest): Promise<any[]> {
  const response = await request('/driver-vehicles/');
  if (!response.ok) {
    throw new Error(await parseAssignmentApiError(response));
  }
  const data = await response.json();
  return data.results ?? data;
}

export async function createDriverVehicleAssignment(
  request: AuthenticatedRequest,
  assignmentData: DriverVehicleAssignmentPayload,
): Promise<any> {
  const response = await request('/driver-vehicles/', {
    method: 'POST',
    body: JSON.stringify({
      driver: parseInt(String(assignmentData.driver_id), 10),
      vehicle: parseInt(String(assignmentData.vehicle_id), 10),
      assigned_from: assignmentData.assigned_from,
      assigned_to: assignmentData.assigned_to || null,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseAssignmentApiError(response));
  }
  return response.json();
}

export async function updateDriverVehicleAssignment(
  request: AuthenticatedRequest,
  assignmentId: number | string,
  assignmentData: DriverVehicleAssignmentPayload,
): Promise<any> {
  const response = await request(`/driver-vehicles/${assignmentId}/`, {
    method: 'PUT',
    body: JSON.stringify({
      driver: parseInt(String(assignmentData.driver_id), 10),
      vehicle: parseInt(String(assignmentData.vehicle_id), 10),
      assigned_from: assignmentData.assigned_from,
      assigned_to: assignmentData.assigned_to || null,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseAssignmentApiError(response));
  }
  return response.json();
}

export async function deleteDriverVehicleAssignment(
  request: AuthenticatedRequest,
  assignmentId: number | string,
): Promise<void> {
  const response = await request(`/driver-vehicles/${assignmentId}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(await parseAssignmentApiError(response));
  }
}

export type AdminDriverVehicleAssignmentFilter = 'all' | 'active' | 'completed';
export type AdminDriverVehicleSort = 'newest' | 'driver_az' | 'plate_az';

export interface AdminDriverVehicleListFilters {
  assignmentStatus: AdminDriverVehicleAssignmentFilter;
  driverName: string;
  vehiclePlate: string;
  sort: AdminDriverVehicleSort;
}

export const DEFAULT_ADMIN_DRIVER_VEHICLE_LIST_FILTERS: AdminDriverVehicleListFilters = {
  assignmentStatus: 'all',
  driverName: '',
  vehiclePlate: '',
  sort: 'newest',
};

type DriverVehicleListRow = {
  driver_name?: string;
  vehicle_license_plate?: string;
  assigned_from?: string;
  assigned_to?: string | null;
};

export function getUniqueDriverVehicleDriverNames(assignments: DriverVehicleListRow[]): string[] {
  return getUniqueSortedStrings(
    assignments.map((row) => (row.driver_name || '').trim()),
    'desc',
  );
}

export function getUniqueDriverVehiclePlates(assignments: DriverVehicleListRow[]): string[] {
  return getUniqueSortedStrings(
    assignments.map((row) => (row.vehicle_license_plate || '').trim()),
    'asc',
  );
}

export function adminDriverVehicleFiltersAreActive(filters: AdminDriverVehicleListFilters): boolean {
  return (
    filters.assignmentStatus !== 'all'
    || filters.driverName !== ''
    || filters.vehiclePlate !== ''
    || filters.sort !== 'newest'
  );
}

export function filterAndSortAdminDriverVehicles<T extends DriverVehicleListRow>(
  assignments: T[],
  filters: AdminDriverVehicleListFilters,
): T[] {
  let result = [...assignments];

  if (filters.assignmentStatus === 'active') {
    result = result.filter((row) => !row.assigned_to);
  } else if (filters.assignmentStatus === 'completed') {
    result = result.filter((row) => !!row.assigned_to);
  }

  if (filters.driverName) {
    const target = filters.driverName.toLowerCase();
    result = result.filter(
      (row) => (row.driver_name || '').trim().toLowerCase() === target,
    );
  }

  if (filters.vehiclePlate) {
    const target = filters.vehiclePlate.toLowerCase();
    result = result.filter(
      (row) => (row.vehicle_license_plate || '').trim().toLowerCase() === target,
    );
  }

  result.sort((a, b) => {
    if (filters.sort === 'driver_az') {
      return compareStringsAsc(a.driver_name || '', b.driver_name || '');
    }
    if (filters.sort === 'plate_az') {
      return compareStringsAsc(a.vehicle_license_plate || '', b.vehicle_license_plate || '');
    }
    const aDate = a.assigned_from || '';
    const bDate = b.assigned_from || '';
    return compareStringsDesc(aDate, bDate);
  });

  return result;
}
