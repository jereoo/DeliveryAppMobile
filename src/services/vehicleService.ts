/**
 * Vehicle API helpers — onboarding, replace, resubmit, and staff approval.
 */

export type AuthenticatedRequest = (
  endpoint: string,
  options?: Record<string, unknown>,
) => Promise<Response>;

export type VehicleApprovalStatus = 'PENDING' | 'APPROVED' | 'RESUBMIT' | 'REJECTED';

export interface DriverVehicleRecord {
  id: number;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  capacity: number;
  capacity_unit: 'kg' | 'lb';
  active: boolean;
  approval_status: VehicleApprovalStatus;
  resubmit_reason?: string | null;
  model_spec_id?: number | null;
  identity_locked: boolean;
  registration_verified: boolean;
  can_replace_vehicle: boolean;
}

export interface VehicleUpdateFields {
  license_plate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  capacity: number;
  capacity_unit?: 'kg' | 'lb';
  active?: boolean;
}

export interface DriverVehicleUpdateOptions {
  vehicleActive: boolean;
  inService: boolean;
}

export interface VehicleOnboardingFields {
  vehicle_model_spec_id: number;
  vehicle_year: number;
  vehicle_license_plate: string;
  vehicle_vin: string;
  vehicle_capacity: number;
  vehicle_capacity_unit: 'kg' | 'lb';
}

export const VEHICLE_APPROVAL_LABELS: Record<VehicleApprovalStatus, string> = {
  PENDING: 'Pending approval',
  APPROVED: 'Approved',
  RESUBMIT: 'Resubmit required',
  REJECTED: 'Rejected',
};

export function buildVehicleUpdatePayload(
  fields: VehicleUpdateFields,
  options?: DriverVehicleUpdateOptions,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    license_plate: fields.license_plate,
    make: fields.make,
    model: fields.model,
    year: Number(fields.year),
    vin: fields.vin.toUpperCase(),
    capacity: fields.capacity,
    capacity_unit: fields.capacity_unit || 'kg',
  };

  if (options) {
    if (options.vehicleActive && !options.inService) {
      payload.active = false;
    }
  } else if (fields.active !== undefined) {
    payload.active = fields.active;
  }

  return payload;
}

export function buildVehicleOnboardingPayload(
  fields: VehicleOnboardingFields,
): Record<string, unknown> {
  return {
    vehicle_model_spec_id: fields.vehicle_model_spec_id,
    vehicle_year: Number(fields.vehicle_year),
    vehicle_license_plate: fields.vehicle_license_plate.trim().toUpperCase(),
    vehicle_vin: fields.vehicle_vin.trim().toUpperCase(),
    vehicle_capacity: fields.vehicle_capacity,
    vehicle_capacity_unit: fields.vehicle_capacity_unit || 'lb',
  };
}

export async function parseVehicleApiError(
  response: Response,
  fallback = 'Failed to update vehicle',
): Promise<string> {
  const body = await response.json().catch(() => ({} as Record<string, unknown>));
  const msg = body.error || body.detail
    || (typeof body === 'object' && Object.keys(body).length
      ? Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join('\n')
      : fallback);
  return typeof msg === 'string' ? msg : fallback;
}

export async function fetchDriverCurrentVehicle(
  request: AuthenticatedRequest,
): Promise<DriverVehicleRecord | null> {
  const response = await request('/drivers/me/vehicle/');
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response, 'Failed to load vehicle'));
  }
  return response.json();
}

export async function replaceDriverVehicle(
  request: AuthenticatedRequest,
  payload: Record<string, unknown>,
): Promise<{ detail: string; vehicle: DriverVehicleRecord }> {
  const response = await request('/drivers/me/vehicles/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response, 'Failed to replace vehicle'));
  }
  return response.json();
}

export async function resubmitDriverVehicle(
  request: AuthenticatedRequest,
  payload: Record<string, unknown>,
): Promise<{ detail: string; vehicle: DriverVehicleRecord }> {
  const response = await request('/drivers/me/vehicle/resubmit/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response, 'Failed to resubmit vehicle'));
  }
  return response.json();
}

export async function deactivateDriverVehicle(
  request: AuthenticatedRequest,
): Promise<Record<string, unknown>> {
  const response = await request('/drivers/me/vehicle/deactivate/', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response, 'Failed to deactivate vehicle'));
  }
  return response.json().catch(() => ({}));
}

export async function updateVehicleById(
  request: AuthenticatedRequest,
  vehicleId: number,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await request(`/vehicles/${vehicleId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response));
  }

  return response.json();
}

export async function createVehicleByApi(
  request: AuthenticatedRequest,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await request('/vehicles/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response, 'Failed to create vehicle'));
  }

  return response.json();
}

export async function approveVehicleById(
  request: AuthenticatedRequest,
  vehicleId: number,
): Promise<DriverVehicleRecord> {
  const response = await request(`/vehicles/${vehicleId}/approve/`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response, 'Failed to approve vehicle'));
  }
  return response.json();
}

export async function requestVehicleResubmit(
  request: AuthenticatedRequest,
  vehicleId: number,
  resubmitReason: string,
): Promise<DriverVehicleRecord> {
  const response = await request(`/vehicles/${vehicleId}/resubmit/`, {
    method: 'POST',
    body: JSON.stringify({ resubmit_reason: resubmitReason }),
  });
  if (!response.ok) {
    throw new Error(await parseVehicleApiError(response, 'Failed to request resubmit'));
  }
  return response.json();
}
