/**
 * Driver profile and admin approval API helpers.
 */

import type { AuthenticatedRequest } from './vehicleService';

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
