// CIO DIRECTIVE – PERMANENT LAUNCH FIX – NOV 21 2025
// UPDATED JANUARY 03, 2026: Dynamic tunnel backend URL derivation

/**
 * API Configuration with Dynamic URL Resolution
 * SDK 51+ Compatible - Never use Constants.manifest again
 * Now supports automatic tunnel backend routing via hostUri
 */

import Constants from 'expo-constants';

// CIO DIRECTIVE: Tunnel-only mode - NO LAN fallback for public Wi-Fi compatibility
const getBackendUrl = async (): Promise<string> => {
  console.log('🔧 API Config Debug:', {
    expoConfig: Constants.expoConfig?.extra,
    hostUri: Constants.expoConfig?.hostUri,
    processEnv: process.env.BACKEND_URL,
    backendUrlFromConfig: Constants.expoConfig?.extra?.BACKEND_URL,
  });

  // 1. PRIMARY: Use explicit BACKEND_URL from app.json extra config
  if (Constants.expoConfig?.extra?.BACKEND_URL) {
    console.log('✅ Using Constants.expoConfig.extra.BACKEND_URL:', Constants.expoConfig.extra.BACKEND_URL);
    return Constants.expoConfig.extra.BACKEND_URL;
  }

  // 2. SECONDARY: Derive tunnel backend URL from Expo tunnel (works automatically with --tunnel)
  if (Constants.expoConfig?.hostUri) {
    // hostUri format: exp://u.random-anonymous-8081.exp.direct
    // Extract the domain part after @
    const parts = Constants.expoConfig.hostUri.split('@');
    if (parts.length > 1) {
      const tunnelDomain = parts[1].split(':')[0];
      if (tunnelDomain.includes('exp.direct') || tunnelDomain.includes('ngrok.io')) {
        const tunnelBackendUrl = `https://${tunnelDomain}:8000/api`;
        console.log('✅ Using derived tunnel backend URL:', tunnelBackendUrl);
        return tunnelBackendUrl;
      }
    }
  }

  // 3. Fallback: Use explicit .env variable (if manually set)
  if (process.env.BACKEND_URL) {
    console.log('✅ Using process.env.BACKEND_URL');
    return process.env.BACKEND_URL;
  }

  // ❌ NO LAN FALLBACK - Force tunnel requirement for public Wi-Fi compatibility
  console.log('❌ CRITICAL: No tunnel URL available - public Wi-Fi requires tunnel mode');
  throw new Error(
    'No tunnel URL available. Run start-fullstack.bat to establish tunnel connection, or set BACKEND_URL in .env for public Wi-Fi compatibility.'
  );
};



// Get the base URL for API calls (now async due to LAN detection)
export const getApiBaseUrl = async (): Promise<string> => {
  return await getBackendUrl();
};

// For backward compatibility - will be resolved at runtime
export let API_BASE_URL: string;
getBackendUrl().then(url => { API_BASE_URL = url; });

// Strip trailing slashes for clean concatenation
export const getApiUrl = async (): Promise<string> => {
  const baseUrl = await getBackendUrl();
  return baseUrl.replace(/\/+$/, '');
};

// API endpoints function (async due to dynamic URL resolution)
export const getApiEndpoints = async () => {
  const apiUrl = await getApiUrl();

  return {
    // Authentication
    TOKEN: `${apiUrl}/token/`,
    TOKEN_REFRESH: `${apiUrl}/token/refresh/`,

    // Health check
    HEALTH: `${apiUrl}/health/`,

    // Address validation
    ADDRESS_VALIDATION: `${apiUrl}/address-validation/validate/`,

    // Delivery management
    DELIVERIES: `${apiUrl}/deliveries/`,
    REQUEST_DELIVERY: `${apiUrl}/deliveries/request_delivery/`,

    // Customer management
    CUSTOMERS: `${apiUrl}/customers/`,
    CUSTOMER_REGISTER: `${apiUrl}/customers/register/`,
    CUSTOMER_ME: `${apiUrl}/customers/me/`,
    CUSTOMER_DELIVERIES: `${apiUrl}/customers/my_deliveries/`,

    // Driver management
    DRIVERS: `${apiUrl}/drivers/`,
    DRIVER_REGISTER: `${apiUrl}/drivers/register/`,

    // Vehicle management
    VEHICLES: `${apiUrl}/vehicles/`,
  };
};

// For backward compatibility - will be resolved at runtime
export let API_ENDPOINTS: any;
getApiEndpoints().then(endpoints => { API_ENDPOINTS = endpoints; });

// For backward compatibility - will be resolved at runtime
export let API_URL: string;
getApiUrl().then(url => { API_URL = url; });

// Health check function
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const endpoints = await getApiEndpoints();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoints.HEALTH, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

// Retained for compatibility (currently returns base URL)
export const discoverBackendUrl = async (): Promise<string> => {
  console.log('🔍 Dynamic discovery complete — using resolved URL');
  return await getBackendUrl();
};

// Axios-style config object (async)
export const getApiConfig = async () => {
  const apiUrl = await getApiUrl();
  return {
    baseURL: apiUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

// For backward compatibility - will be resolved at runtime
export let API_CONFIG: any;
getApiConfig().then(config => { API_CONFIG = config; });

// Debug information
export const getApiDebugInfo = async () => {
  const apiUrl = await getApiUrl();
  return {
    currentUrl: apiUrl,
    expoConfigExtra: Constants.expoConfig?.extra,
    processEnv: process.env.BACKEND_URL,
    hostUri: Constants.expoConfig?.hostUri,
    isUsingTunnel: apiUrl.includes('exp.direct') || apiUrl.includes('ngrok.io'),
    isDevelopment: __DEV__,
  };
};

// Print debug info in development
if (__DEV__) {
  getApiDebugInfo().then(debugInfo => {
    console.log('🔧 API Configuration Debug Info:', debugInfo);
  });
}