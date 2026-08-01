/**
 * Delivery API helpers — customer requests and admin CRUD.
 */

import type { AuthenticatedRequest } from './vehicleService';

export interface DeliveryRequestFields {
  pickup_location?: string;
  dropoff_location: string;
  item_description?: string;
  same_pickup_as_customer?: boolean;
  use_preferred_pickup?: boolean;
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
