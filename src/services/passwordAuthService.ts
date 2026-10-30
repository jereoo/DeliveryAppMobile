/**
 * Password change and reset API (Phase 4G).
 */

import { getApiUrl } from '../config/api';
import type { AuthenticatedRequest } from './vehicleService';

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

export async function changePassword(
  request: AuthenticatedRequest,
  payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  },
): Promise<void> {
  const response = await request('/auth/password/change/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const base = await getApiUrl();
  const response = await fetch(`${base}/auth/password/forgot/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function resetPasswordWithToken(payload: {
  token: string;
  new_password: string;
  confirm_password: string;
}): Promise<void> {
  const base = await getApiUrl();
  const response = await fetch(`${base}/auth/password/reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}
