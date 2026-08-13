import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAuthSession,
  loadAuthSession,
  refreshAccessToken,
  refreshStoredAccessToken,
  storeAuthSession,
} from '../services/authService';

describe('authService storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('stores and loads auth session', async () => {
    await storeAuthSession({
      access: 'access-token',
      refresh: 'refresh-token',
      me: {
        role: 'staff',
        user_id: 5,
        profile_id: 2,
        username: 'reviewer',
        staff_role: 'compliance_reviewer',
        permissions: ['compliance.verify', 'reports.view'],
      },
    });

    const loaded = await loadAuthSession();
    expect(loaded?.me.role).toBe('staff');
    expect(loaded?.me.staff_role).toBe('compliance_reviewer');
    expect(loaded?.me.permissions).toContain('compliance.verify');
  });

  it('clears stored auth session', async () => {
    await storeAuthSession({
      access: 'access-token',
      refresh: 'refresh-token',
      me: { role: 'customer', user_id: 2, profile_id: 10, username: 'demo.customer' },
    });
    await clearAuthSession();
    await expect(loadAuthSession()).resolves.toBeNull();
  });
});

describe('authService refresh', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('refreshAccessToken returns rotated refresh token when provided', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access: 'new-access', refresh: 'new-refresh' }),
    }) as typeof fetch;

    await expect(refreshAccessToken('old-refresh')).resolves.toEqual({
      access: 'new-access',
      refresh: 'new-refresh',
    });
  });

  it('refreshStoredAccessToken persists new tokens', async () => {
    await storeAuthSession({
      access: 'expired-access',
      refresh: 'refresh-token',
      me: { role: 'admin', user_id: 1, profile_id: null, username: 'admin' },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access: 'new-access', refresh: 'new-refresh' }),
    }) as typeof fetch;

    await expect(refreshStoredAccessToken()).resolves.toBe('new-access');
    await expect(loadAuthSession()).resolves.toEqual({
      access: 'new-access',
      refresh: 'new-refresh',
      me: { role: 'admin', user_id: 1, profile_id: null, username: 'admin' },
    });
  });

  it('refreshStoredAccessToken clears session on refresh failure', async () => {
    await storeAuthSession({
      access: 'expired-access',
      refresh: 'refresh-token',
      me: { role: 'driver', user_id: 3, profile_id: 5, username: 'demo.driver' },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Token is invalid or expired' }),
    }) as typeof fetch;

    await expect(refreshStoredAccessToken()).resolves.toBeNull();
    await expect(loadAuthSession()).resolves.toBeNull();
  });
});
