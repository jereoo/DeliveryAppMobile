/**
 * Driver profile and admin approval API helpers.
 */

import type { AuthenticatedRequest } from './vehicleService';
import { matchesAdminTextSearch } from '../utils/adminListFilterUtils';

export type DriverApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DriverProfile {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  license_number: string;
  active: boolean;
  approval_status: DriverApprovalStatus;
  approval_rejection_reason?: string | null;
}

export const DRIVER_APPROVAL_LABELS: Record<DriverApprovalStatus, string> = {
  PENDING: 'Pending admin approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export type AdminDriverAccountFilter = 'all' | 'active' | 'inactive';
export type AdminDriverApprovalFilter = 'all' | DriverApprovalStatus;

export interface AdminDriverListFilters {
  driverNameSearch: string;
  lastName: string;
  accountStatus: AdminDriverAccountFilter;
  approvalStatus: AdminDriverApprovalFilter;
}

export const DEFAULT_ADMIN_DRIVER_LIST_FILTERS: AdminDriverListFilters = {
  driverNameSearch: '',
  lastName: '',
  accountStatus: 'all',
  approvalStatus: 'all',
};

type DriverListRow = Pick<DriverProfile, 'first_name' | 'last_name' | 'active' | 'approval_status'>;

export function getUniqueDriverLastNames(drivers: DriverListRow[]): string[] {
  const names = new Set<string>();
  for (const driver of drivers) {
    const lastName = (driver.last_name || '').trim();
    if (lastName) {
      names.add(lastName);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function filterAndSortAdminDrivers<T extends DriverListRow>(
  drivers: T[],
  filters: AdminDriverListFilters,
): T[] {
  let result = [...drivers];

  if (filters.driverNameSearch.trim()) {
    result = result.filter((driver) => matchesAdminTextSearch(
      `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
      filters.driverNameSearch,
    ));
  }

  if (filters.lastName) {
    const target = filters.lastName.toLowerCase();
    result = result.filter(
      (driver) => (driver.last_name || '').trim().toLowerCase() === target,
    );
  }

  if (filters.accountStatus === 'active') {
    result = result.filter((driver) => driver.active !== false);
  } else if (filters.accountStatus === 'inactive') {
    result = result.filter((driver) => driver.active === false);
  }

  if (filters.approvalStatus !== 'all') {
    result = result.filter(
      (driver) => (driver.approval_status || 'APPROVED') === filters.approvalStatus,
    );
  }

  result.sort((a, b) => {
    const lastCmp = (a.last_name || '').localeCompare(
      b.last_name || '',
      undefined,
      { sensitivity: 'base' },
    );
    if (lastCmp !== 0) {
      return lastCmp;
    }
    return (a.first_name || '').localeCompare(
      b.first_name || '',
      undefined,
      { sensitivity: 'base' },
    );
  });

  return result;
}

export function adminDriverFiltersAreActive(filters: AdminDriverListFilters): boolean {
  return (
    filters.driverNameSearch.trim() !== ''
    || filters.lastName !== ''
    || filters.accountStatus !== 'all'
    || filters.approvalStatus !== 'all'
  );
}

export async function approveDriver(
  request: AuthenticatedRequest,
  driverId: number,
): Promise<DriverProfile> {
  const response = await request(`/drivers/${driverId}/approve/`, { method: 'POST' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({} as Record<string, unknown>));
    throw new Error(
      typeof body.detail === 'string'
        ? body.detail
        : typeof body.approval_status === 'string'
          ? String(body.approval_status)
          : 'Could not approve driver',
    );
  }
  return response.json();
}

export async function rejectDriver(
  request: AuthenticatedRequest,
  driverId: number,
  rejectionReason: string,
): Promise<DriverProfile> {
  const response = await request(`/drivers/${driverId}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({} as Record<string, unknown>));
    throw new Error(
      typeof body.rejection_reason === 'string'
        ? body.rejection_reason
        : typeof body.detail === 'string'
          ? body.detail
          : 'Could not reject driver',
    );
  }
  return response.json();
}
