/**
 * API Configuration – LAN only (no tunnel).
 * MARCH 2026: Tunnel/ngrok/exp.direct logic removed.
 */

import Constants from 'expo-constants';

const getBackendUrl = async (): Promise<string> => {
  // 1. Production build (Vercel etc.)
  const publicUrl = typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_BACKEND_URL;
  if (publicUrl && typeof publicUrl === 'string' && publicUrl.trim().startsWith('http')) {
    return publicUrl.trim().replace(/\/+$/, '');
  }

  // 2. app.json extra (LAN URL – avoids Metro .env cache issues)
  const extraUrl = Constants.expoConfig?.extra?.BACKEND_URL;
  if (extraUrl && typeof extraUrl === 'string' && extraUrl.startsWith('http')) {
    return extraUrl.replace(/\/+$/, '');
  }

  // 3. .env BACKEND_URL (set by start-fullstack.bat)
  if (process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith('http')) {
    return process.env.BACKEND_URL.replace(/\/+$/, '');
  }

  // 4. LAN fallback: same machine
  return 'http://localhost:8000/api';
};

export const getApiBaseUrl = async (): Promise<string> => {
  return await getBackendUrl();
};

export let API_BASE_URL: string;
getBackendUrl().then(url => { API_BASE_URL = url; });

export const getApiUrl = async (): Promise<string> => {
  const baseUrl = await getBackendUrl();
  return baseUrl.replace(/\/+$/, '');
};

export const getApiEndpoints = async () => {
  const apiUrl = await getApiUrl();
  return {
    TOKEN: `${apiUrl}/token/`,
    TOKEN_REFRESH: `${apiUrl}/token/refresh/`,
    HEALTH: `${apiUrl}/health/`,
    ADDRESS_VALIDATION: `${apiUrl}/address-validation/validate/`,
    DELIVERIES: `${apiUrl}/deliveries/`,
    REQUEST_DELIVERY: `${apiUrl}/deliveries/request_delivery/`,
    CUSTOMERS: `${apiUrl}/customers/`,
    CUSTOMER_REGISTER: `${apiUrl}/customers/register/`,
    CUSTOMER_ME: `${apiUrl}/customers/me/`,
    CUSTOMER_DELIVERIES: `${apiUrl}/customers/my_deliveries/`,
    DRIVERS: `${apiUrl}/drivers/`,
    DRIVER_REGISTER: `${apiUrl}/drivers/register/`,
    VEHICLES: `${apiUrl}/vehicles/`,
  };
};

export let API_ENDPOINTS: any;
getApiEndpoints().then(endpoints => { API_ENDPOINTS = endpoints; });

export let API_URL: string;
getApiUrl().then(url => { API_URL = url; });

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const endpoints = await getApiEndpoints();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(endpoints.HEALTH, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export const discoverBackendUrl = async (): Promise<string> => {
  return await getBackendUrl();
};

export const getApiConfig = async () => {
  const apiUrl = await getApiUrl();
  return { baseURL: apiUrl, timeout: 10000, headers: { 'Content-Type': 'application/json' } };
};

export let API_CONFIG: any;
getApiConfig().then(config => { API_CONFIG = config; });

export const getApiDebugInfo = async () => {
  const apiUrl = await getApiUrl();
  return {
    currentUrl: apiUrl,
    processEnv: process.env.BACKEND_URL,
    isDevelopment: __DEV__,
  };
};
