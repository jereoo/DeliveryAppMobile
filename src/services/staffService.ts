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
  password?: string;
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
  const body: Record<string, unknown> = { ...payload };
  if (!payload.password?.trim()) {
    delete body.password;
  }
  const response = await request('/staff/', {
    method: 'POST',
    body: JSON.stringify(body),
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

export interface StaffAuditEventRecord {
  id: number;
  created_at: string;
  event_type: string;
  actor_username: string;
  target_username: string;
  target_email: string;
  old_role: string;
  new_role: string;
  detail: string;
}

export interface StaffInviteCreatePayload {
  email: string;
  staff_role: string;
  first_name?: string;
  last_name?: string;
}

export interface StaffInviteValidateResult {
  valid: boolean;
  email?: string;
  staff_role?: string;
  first_name?: string;
  last_name?: string;
  expires_at?: string;
}

export async function fetchStaffAuditEvents(
  request: AuthenticatedRequest,
): Promise<StaffAuditEventRecord[]> {
  const response = await request('/staff-audit-events/');
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function sendStaffInvite(
  request: AuthenticatedRequest,
  payload: StaffInviteCreatePayload,
): Promise<void> {
  const response = await request('/staff-invites/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function validateStaffInvite(
  apiBase: string,
  token: string,
): Promise<StaffInviteValidateResult> {
  const base = apiBase.replace(/\/+$/, '');
  const response = await fetch(
    `${base}/staff-invites/public/?token=${encodeURIComponent(token)}`,
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.token === 'string' ? data.token : 'Invalid invite.');
  }
  return data;
}

export async function acceptStaffInvite(
  apiBase: string,
  payload: {
    token: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  },
): Promise<{ username: string; staff_role: string }> {
  const base = apiBase.replace(/\/+$/, '');
  const response = await fetch(`${base}/staff-invites/public/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}
