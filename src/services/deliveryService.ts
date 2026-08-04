/**
 * Delivery API helpers — customer requests and admin CRUD.
 */

import type { AuthenticatedRequest } from './vehicleService';

export interface DeliveryRequestFields {
  pickup_location?: string;
  dropoff_location?: string;
  item_description?: string;
  same_pickup_as_customer?: boolean;
  use_preferred_pickup?: boolean;
  same_dropoff_as_customer?: boolean;
  delivery_date?: string;
  delivery_time?: string;
  special_instructions?: string;
}

export interface DeliveryAdminFields extends DeliveryRequestFields {
  customer?: number;
  status?: string;
  estimated_cost?: string | number | null;
}

export function buildDeliveryAdminPayload(form: DeliveryAdminFields): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    customer: form.customer,
    pickup_location: form.pickup_location || '',
    dropoff_location: form.dropoff_location || '',
    item_description: form.item_description || '',
    status: form.status || 'Pending',
    same_pickup_as_customer: form.same_pickup_as_customer || false,
    use_preferred_pickup: form.use_preferred_pickup || false,
    same_dropoff_as_customer: form.same_dropoff_as_customer || false,
    special_instructions: form.special_instructions || '',
  };
  if (form.delivery_date?.trim()) {
    payload.delivery_date = form.delivery_date.trim();
  }
  if (form.delivery_time?.trim()) {
    payload.delivery_time = form.delivery_time.trim();
  }
  if (form.estimated_cost !== undefined && form.estimated_cost !== null && `${form.estimated_cost}`.trim() !== '') {
    payload.estimated_cost = form.estimated_cost;
  }
  return payload;
}

export async function cancelDeliveryById(
  request: AuthenticatedRequest,
  deliveryId: number | string,
): Promise<any> {
  const response = await request(`/deliveries/${deliveryId}/cancel/`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await parseDeliveryApiError(response));
  }
  return response.json();
}

export async function parseDeliveryApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
    return JSON.stringify(data);
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

export async function fetchDeliveries(request: AuthenticatedRequest): Promise<any[]> {
  const response = await request('/deliveries/');
  if (!response.ok) {
    throw new Error(await parseDeliveryApiError(response));
  }
  const data = await response.json();
  return data.results ?? data;
}

export async function requestDeliveryByApi(
  request: AuthenticatedRequest,
  payload: DeliveryRequestFields,
): Promise<any> {
  const response = await request('/deliveries/request_delivery/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseDeliveryApiError(response));
  }
  return response.json();
}

export async function createDeliveryByApi(
  request: AuthenticatedRequest,
  deliveryData: Record<string, unknown>,
): Promise<any> {
  const response = await request('/deliveries/', {
    method: 'POST',
    body: JSON.stringify(deliveryData),
  });
  if (!response.ok) {
    throw new Error(await parseDeliveryApiError(response));
  }
  return response.json();
}

export async function updateDeliveryById(
  request: AuthenticatedRequest,
  deliveryId: number | string,
  deliveryData: Record<string, unknown>,
): Promise<any> {
  const response = await request(`/deliveries/${deliveryId}/`, {
    method: 'PATCH',
    body: JSON.stringify(deliveryData),
  });
  if (!response.ok) {
    throw new Error(await parseDeliveryApiError(response));
  }
  return response.json();
}

export async function deleteDeliveryById(
  request: AuthenticatedRequest,
  deliveryId: number | string,
): Promise<void> {
  const response = await request(`/deliveries/${deliveryId}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(await parseDeliveryApiError(response));
  }
}
