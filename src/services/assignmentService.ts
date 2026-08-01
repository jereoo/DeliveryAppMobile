/**
 * Assignment API helpers — delivery dispatch and driver-vehicle history.
 */

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
