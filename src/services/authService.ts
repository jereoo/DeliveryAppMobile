/**
 * Authentication — login, token persistence, refresh, and /me role resolution.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiEndpoints, getApiUrl } from '../config/api';

export type UserRole = 'admin' | 'staff' | 'customer' | 'driver';

export type StaffRoleCode =
  | 'super_admin'
  | 'operations_admin'
  | 'compliance_reviewer'
  | 'read_only';

export interface MeResponse {
  role: UserRole;
  user_id: number;
  profile_id: number | null;
  username?: string;
  staff_role?: StaffRoleCode | string;
  permissions?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResult extends AuthTokens {
  me: MeResponse;
}

export interface StoredAuthSession extends AuthTokens {
  me: MeResponse;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_ME_KEY = 'auth_me';

export async function storeAuthSession(session: StoredAuthSession): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, session.access],
    [REFRESH_TOKEN_KEY, session.refresh],
    [AUTH_ME_KEY, JSON.stringify(session.me)],
  ]);
}

export async function loadAuthSession(): Promise<StoredAuthSession | null> {
  const pairs = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    AUTH_ME_KEY,
  ]);
  const access = pairs[0][1];
  const refresh = pairs[1][1];
  const meRaw = pairs[2][1];

  if (!access || !refresh || !meRaw) {
    return null;
  }

  try {
    const me = JSON.parse(meRaw) as MeResponse;
    if (!me?.role || typeof me.user_id !== 'number') {
      return null;
    }
    return { access, refresh, me };
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    AUTH_ME_KEY,
  ]);
}

export async function parseAuthError(response: Response): Promise<string> {
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

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const endpoints = await getApiEndpoints();
  const response = await fetch(endpoints.ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(await parseAuthError(response));
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const endpoints = await getApiEndpoints();
  const response = await fetch(endpoints.TOKEN_REFRESH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error(await parseAuthError(response));
  }

  const data = await response.json();
  if (!data?.access) {
    throw new Error('Refresh response did not include an access token.');
  }

  return {
    access: data.access as string,
    refresh: (data.refresh as string | undefined) ?? refreshToken,
  };
}

/** Refresh access token from AsyncStorage; persists rotated refresh token when returned. */
export async function refreshStoredAccessToken(): Promise<string | null> {
  const session = await loadAuthSession();
  if (!session?.refresh) {
    return null;
  }

  try {
    const tokens = await refreshAccessToken(session.refresh);
    await storeAuthSession({
      access: tokens.access,
      refresh: tokens.refresh,
      me: session.me,
    });
    return tokens.access;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const endpoints = await getApiEndpoints();
  const response = await fetch(endpoints.TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await parseAuthError(response));
  }

  const data = await response.json();
  const access = data.access as string;
  const refresh = data.refresh as string;
  const me = await fetchMe(access);

  await storeAuthSession({ access, refresh, me });
  return { access, refresh, me };
}

export async function restoreAuthSession(): Promise<StoredAuthSession | null> {
  const session = await loadAuthSession();
  if (!session) {
    return null;
  }

  try {
    const me = await fetchMe(session.access);
    const restored = { ...session, me };
    await storeAuthSession(restored);
    return restored;
  } catch {
    try {
      const tokens = await refreshAccessToken(session.refresh);
      const me = await fetchMe(tokens.access);
      const restored = { access: tokens.access, refresh: tokens.refresh, me };
      await storeAuthSession(restored);
      return restored;
    } catch {
      await clearAuthSession();
      return null;
    }
  }
}

export async function logout(): Promise<void> {
  await clearAuthSession();
}
