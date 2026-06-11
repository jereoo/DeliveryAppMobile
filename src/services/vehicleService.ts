/**
 * Centralized vehicle update service.
 * Admin and driver screens both PATCH /vehicles/{id}/ with role-based authorization on the backend.
 */

export type AuthenticatedRequest = (
  endpoint: string,
  options?: Record<string, unknown>,
) => Promise<Response>;

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
