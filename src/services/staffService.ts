/**
 * Staff user admin API (Phase 4G Slice 4).
 */

import type { AuthenticatedRequest } from './vehicleService';

export interface StaffUserRecord {
  id: number;
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  staff_role: string;
  job_title: string;
  phone_number: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StaffUserCreatePayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  staff_role: string;
  job_title?: string;
  phone_number?: string;
}

export interface StaffUserUpdatePayload {
  staff_role?: string;
  job_title?: string;
  phone_number?: string;
  is_active?: boolean;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    const parts: string[] = [];
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          parts.push(`${key}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          parts.push(`${key}: ${value}`);
        }
      }
    }
    return parts.length ? parts.join('\n') : JSON.stringify(data);
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

export async function fetchStaffUsers(
  request: AuthenticatedRequest,
  search?: string,
): Promise<StaffUserRecord[]> {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const response = await request(`/staff/${query}`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function createStaffUser(
  request: AuthenticatedRequest,
  payload: StaffUserCreatePayload,
): Promise<StaffUserRecord> {
  const response = await request('/staff/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function updateStaffUser(
  request: AuthenticatedRequest,
  staffId: number,
  payload: StaffUserUpdatePayload,
): Promise<StaffUserRecord> {
  const response = await request(`/staff/${staffId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}
