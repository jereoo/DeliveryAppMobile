/**
 * Customer API helpers — registration, admin CRUD, and customer-scoped reads.
 */

import type { AuthenticatedRequest } from './vehicleService';
import {
  compareStringsDesc,
  getUniqueSortedStrings,
  matchesAccountStatus,
} from '../utils/adminListFilterUtils';

export interface CustomerRegistrationFields {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
  address_unit?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  company_name?: string;
  is_business?: boolean;
  preferred_pickup_address?: string;
}

export interface CustomerAdminPayload extends CustomerRegistrationFields {
  password?: string;
}

export interface CustomerProfileFields {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  password?: string;
  address_unit?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  company_name?: string;
  is_business?: boolean;
  preferred_pickup_address?: string;
}

export async function parseCustomerApiError(response: Response): Promise<string> {
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

export function buildCustomerAdminPayload(
  customerData: CustomerAdminPayload,
): Record<string, unknown> {
  return {
    username: customerData.username,
    email: customerData.email,
    password: customerData.password,
    first_name: customerData.first_name,
    last_name: customerData.last_name,
    phone_number: customerData.phone_number,
    address: customerData.address || '',
    address_unit: customerData.address_unit || '',
    address_street: customerData.address_street || '',
    address_city: customerData.address_city || '',
    address_state: customerData.address_state || '',
    address_postal_code: customerData.address_postal_code || '',
    address_country: customerData.address_country || 'US',
    company_name: customerData.company_name || '',
    is_business: customerData.is_business || false,
    preferred_pickup_address: customerData.preferred_pickup_address || '',
  };
}

export async function registerCustomerPublic(
  apiBase: string,
  payload: CustomerRegistrationFields,
): Promise<Response> {
  return fetch(`${apiBase}/customers/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchCustomers(request: AuthenticatedRequest): Promise<any[]> {
  const response = await request('/customers/');
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
  const data = await response.json();
  return data.results ?? data;
}

export async function fetchCustomerMe(request: AuthenticatedRequest): Promise<any> {
  const response = await request('/customers/me/');
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
  return response.json();
}

export function buildCustomerProfilePayload(
  fields: CustomerProfileFields,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    email: fields.email,
    first_name: fields.first_name,
    last_name: fields.last_name,
    phone_number: fields.phone_number,
    address_unit: fields.address_unit || '',
    address_street: fields.address_street || '',
    address_city: fields.address_city || '',
    address_state: fields.address_state || '',
    address_postal_code: fields.address_postal_code || '',
    address_country: fields.address_country || 'US',
    company_name: fields.company_name || '',
    is_business: fields.is_business || false,
    preferred_pickup_address: fields.preferred_pickup_address || '',
  };
  if (fields.password?.trim()) {
    payload.password = fields.password;
  }
  return payload;
}

export async function updateCustomerMe(
  request: AuthenticatedRequest,
  payload: Record<string, unknown>,
): Promise<any> {
  const response = await request('/customers/me/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
  return response.json();
}

export async function fetchMyDeliveries(request: AuthenticatedRequest): Promise<any[]> {
  const response = await request('/customers/my_deliveries/');
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
  const data = await response.json();
  return data.results ?? data;
}

export async function createCustomerByApi(
  request: AuthenticatedRequest,
  customerData: CustomerAdminPayload,
): Promise<any> {
  const response = await request('/customers/', {
    method: 'POST',
    body: JSON.stringify(buildCustomerAdminPayload(customerData)),
  });
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
  return response.json();
}

export async function updateCustomerById(
  request: AuthenticatedRequest,
  customerId: number | string,
  customerData: Record<string, unknown>,
): Promise<any> {
  const response = await request(`/customers/${customerId}/`, {
    method: 'PATCH',
    body: JSON.stringify(customerData),
  });
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
  return response.json();
}

export async function deleteCustomerById(
  request: AuthenticatedRequest,
  customerId: number | string,
): Promise<void> {
  const response = await request(`/customers/${customerId}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
}

export async function fetchCustomerDeliveries(
  request: AuthenticatedRequest,
  customerId: number | string,
): Promise<any[]> {
  const response = await request(`/customers/${customerId}/my_deliveries/`);
  if (!response.ok) {
    throw new Error(await parseCustomerApiError(response));
  }
  const data = await response.json();
  return data.results ?? data;
}

export type AdminCustomerAccountFilter = 'all' | 'active' | 'inactive';
export type AdminCustomerTypeFilter = 'all' | 'business' | 'individual';
export type AdminCustomerCountryFilter = 'all' | 'US' | 'CA';

export interface AdminCustomerListFilters {
  lastName: string;
  accountStatus: AdminCustomerAccountFilter;
  customerType: AdminCustomerTypeFilter;
  country: AdminCustomerCountryFilter;
}

export const DEFAULT_ADMIN_CUSTOMER_LIST_FILTERS: AdminCustomerListFilters = {
  lastName: '',
  accountStatus: 'all',
  customerType: 'all',
  country: 'all',
};

type CustomerListRow = {
  first_name?: string;
  last_name?: string;
  active?: boolean;
  is_business?: boolean;
  address_country?: string;
};

export function getUniqueCustomerLastNames(customers: CustomerListRow[]): string[] {
  return getUniqueSortedStrings(
    customers.map((customer) => (customer.last_name || '').trim()),
    'desc',
  );
}

export function adminCustomerFiltersAreActive(filters: AdminCustomerListFilters): boolean {
  return (
    filters.lastName !== ''
    || filters.accountStatus !== 'all'
    || filters.customerType !== 'all'
    || filters.country !== 'all'
  );
}

export function filterAndSortAdminCustomers<T extends CustomerListRow>(
  customers: T[],
  filters: AdminCustomerListFilters,
): T[] {
  let result = [...customers];

  if (filters.lastName) {
    const target = filters.lastName.toLowerCase();
    result = result.filter(
      (customer) => (customer.last_name || '').trim().toLowerCase() === target,
    );
  }

  if (filters.accountStatus !== 'all') {
    result = result.filter((customer) => matchesAccountStatus(customer.active, filters.accountStatus));
  }

  if (filters.customerType === 'business') {
    result = result.filter((customer) => customer.is_business === true);
  } else if (filters.customerType === 'individual') {
    result = result.filter((customer) => !customer.is_business);
  }

  if (filters.country !== 'all') {
    result = result.filter(
      (customer) => (customer.address_country || 'US').toUpperCase() === filters.country,
    );
  }

  result.sort((a, b) => {
    const lastCmp = compareStringsDesc(a.last_name || '', b.last_name || '');
    if (lastCmp !== 0) {
      return lastCmp;
    }
    return compareStringsDesc(a.first_name || '', b.first_name || '');
  });

  return result;
}
