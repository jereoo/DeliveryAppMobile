import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAuthSession,
  loadAuthSession,
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
      me: { role: 'admin', user_id: 1, profile_id: null },
    });

    const loaded = await loadAuthSession();
    expect(loaded).toEqual({
      access: 'access-token',
      refresh: 'refresh-token',
      me: { role: 'admin', user_id: 1, profile_id: null },
    });
  });

  it('clears stored auth session', async () => {
    await storeAuthSession({
      access: 'access-token',
      refresh: 'refresh-token',
      me: { role: 'customer', user_id: 2, profile_id: 10 },
    });
    await clearAuthSession();
    await expect(loadAuthSession()).resolves.toBeNull();
  });
});
