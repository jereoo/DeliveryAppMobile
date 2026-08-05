import 'react-native-gesture-handler';

// 🚚 DeliveryApp Mobile - KEYBOARD ISSUE FIXED
// Copy this file as App.tsx to your DeliveryAppMobile directory
// FIXES: Virtual keyboard blocking bottom form fields

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Copy this entire file content
 * 2. Paste it as App.tsx in your DeliveryAppMobile directory  
 * 3. Restart Expo server: npx expo start --port 19000
 * 4. Test customer registration on phone - keyboard should no longer block fields
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { theme, styles } from './src/theme';
import {
  login as authLogin,
  logout as authLogout,
  restoreAuthSession,
  type UserRole,
} from './src/services/authService';
import {
  buildCustomerAdminPayload,
  createCustomerByApi,
  deleteCustomerById,
  fetchCustomerDeliveries,
  fetchCustomers,
  fetchMyDeliveries,
  registerCustomerPublic,
  updateCustomerById,
} from './src/services/customerService';
import {
  createDeliveryByApi,
  deleteDeliveryById,
  fetchDeliveries,
  requestDeliveryByApi,
  updateDeliveryById,
} from './src/services/deliveryService';
import {
  createDeliveryAssignment,
  createDriverVehicleAssignment,
  deleteDriverVehicleAssignment,
  fetchAssignments,
  fetchDriverVehicles,
  updateDriverVehicleAssignment,
} from './src/services/assignmentService';
import { AdminComplianceScreen } from './src/components/AdminComplianceScreen';
import { AdminDriverListFilters } from './src/components/AdminDriverListFilters';
import { ComplianceDocumentsPanel } from './src/components/ComplianceDocumentsPanel';
import { ComplianceStatusCard } from './src/components/ComplianceStatusCard';
import { DriverVehicleOnboardingForm } from './src/components/DriverVehicleOnboardingForm';
import { VehicleReactivationChecklist } from './src/components/VehicleReactivationChecklist';
import {
  AdminCustomersScreen,
  AdminDeliveriesScreen,
  AdminDriversScreen,
  AdminDriverVehiclesScreen,
  AdminVehiclesScreen,
  CustomerProfileEditScreen,
  DeliveryRequestScreen,
  DriverComplianceScreen,
  DriverProfileEditScreen,
  DriverVehicleEditScreen,
  MyDeliveriesScreen,
  RegisterAsDriverScreen,
} from './src/screens';
import { formatPhone10, getPhoneDigits } from './src/utils/phoneFormatting';
import { checkBackendHealth, getApiDebugInfo, getApiUrl } from './src/config/api';
import type { ComplianceSummary, DispatchEligibility, FleetComplianceSummary, VehicleComplianceStatus } from './src/services/complianceService';
import {
  COMPLIANCE_BLOCKER_LABELS,
  getDriverDispatchEligibility,
  getFleetComplianceSummary,
  getMyComplianceStatus,
  getVehicleComplianceStatus,
} from './src/services/complianceService';
import {
  approveDriver,
  DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
  DRIVER_APPROVAL_LABELS,
  filterAndSortAdminDrivers,
  rejectDriver,
  type AdminDriverListFilters as AdminDriverListFiltersState,
  type DriverApprovalStatus,
} from './src/services/driverService';
import {
  approveVehicleById,
  buildVehicleOnboardingPayload,
  buildVehicleUpdatePayload,
  createVehicleByApi,
  deactivateDriverVehicle,
  fetchDriverCurrentVehicle,
  replaceDriverVehicle,
  requestVehicleResubmit,
  resubmitDriverVehicle,
  updateVehicleById,
  VEHICLE_APPROVAL_LABELS,
  type DriverVehicleRecord,
  type VehicleApprovalStatus,
} from './src/services/vehicleService';

// ========================================
// NETWORK HEALTH BANNER COMPONENT
// ========================================
const NetworkHealthBanner = async () => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    const resolveApiUrl = async () => {
      try {
        const url = await getApiUrl();
        setApiUrl(url);
      } catch (error) {
        console.error('Failed to resolve API URL:', error);
        setApiUrl('http://127.0.0.1:8000/api'); // fallback
      }
    };

    resolveApiUrl();
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const healthy = await checkBackendHealth();
    setIsBackendHealthy(healthy);
  };

  if (isBackendHealthy === null) {
    return (
      <View style={[styles.healthBanner, styles.healthChecking]}>
        <ActivityIndicator size="small" color="#6B7280" />
        <Text style={styles.healthText}>Checking backend connection...</Text>
      </View>
    );
  }

  if (!isBackendHealthy) {
    return (
      <View style={[styles.healthBanner, styles.healthError]}>
        <Text style={styles.healthErrorText}>❌ BACKEND UNREACHABLE</Text>
        <Text style={styles.healthErrorSubtext}>API: {apiUrl}</Text>
        <Button
          title={showDebug ? "Hide Debug" : "Show Debug"}
          onPress={() => setShowDebug(!showDebug)}
          color="#EF4444"
        />
        {showDebug && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              {JSON.stringify(await getApiDebugInfo(), null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.healthBanner, styles.healthSuccess]}>
      <Text style={styles.healthText}>✅ Backend Connected: {apiUrl}</Text>
    </View>
  );
};

// ========================================
// CUSTOMER DELIVERY HISTORY COMPONENT
// ========================================
const CustomerDeliveryHistory = ({ customerId }: { customerId: any }) => {
  const [deliveryHistory, setDeliveryHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCustomerDeliveries();
  }, [customerId]);

  const loadCustomerDeliveries = async () => {
    try {
      // This would be implemented in the main component's functions
      // For now, filter from existing deliveries
      setLoading(false);
    } catch (error) {
      console.error('Error loading customer deliveries:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>Delivery History</Text>
        <Text style={styles.emptyText}>Loading deliveries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailCardTitle}>Delivery History</Text>
      {deliveryHistory.length === 0 ? (
        <Text style={styles.emptyText}>No deliveries found for this customer</Text>
      ) : (
        deliveryHistory.map((delivery: any, index: number) => (
          <View key={index} style={styles.deliveryItem}>
            <Text style={styles.deliveryTitle}>Delivery #{delivery.id}</Text>
            <Text style={styles.deliveryDetail}>📍 From: {delivery.pickup_location}</Text>
            <Text style={styles.deliveryDetail}>📍 To: {delivery.dropoff_location}</Text>
            <Text style={styles.deliveryDetail}>📊 Status: {delivery.status}</Text>
            <Text style={styles.deliveryDetail}>📅 Date: {delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : 'N/A'}</Text>
          </View>
        ))
      )}
    </View>
  );
};

export default function App() {
  // All constants, useState, useEffect, and helper functions at the top
  // API base from env (LAN only – set by start-fullstack.bat or .env)
  const [API_BASE, setApiBase] = useState<string>('');  // Start empty, resolve async
  const [currentNetwork, setCurrentNetwork] = useState('LAN');
  const [NETWORK_ENDPOINTS, setNetworkEndpoints] = useState([{ url: '', name: 'Unified API URL' }]);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserRole | null>(null);
  const [driverCrudMode, setDriverCrudMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [driverFormState, setDriverFormState] = useState<any>({ name: '', phone_number: '', license_number: '' });
  const [crudMode, setCrudMode] = useState('list'); // 'list', 'create', 'edit', 'delete', 'detail'
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [vehicleCrudMode, setVehicleCrudMode] = useState('list'); // 'list', 'create', 'edit', 'delete', 'detail
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [driverVehicles, setDriverVehicles] = useState<any[]>([]);
  const [driverVehicleSummary, setDriverVehicleSummary] = useState<{
    license_plate: string;
    make: string;
    model: string;
    active: boolean;
  } | null>(null);
  const [driverMeId, setDriverMeId] = useState<number | null>(null);
  const [driverMeApproval, setDriverMeApproval] = useState<{
    status: DriverApprovalStatus;
    rejectionReason?: string | null;
  } | null>(null);
  const [driverVehicleId, setDriverVehicleId] = useState<number | null>(null);
  const [driverComplianceSummary, setDriverComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [fleetComplianceSummary, setFleetComplianceSummary] = useState<FleetComplianceSummary | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [adminScreen, setAdminScreen] = useState<string | null>(null); // e.g. 'driver_vehicles'

  // Form states
  const [customerForm, setCustomerForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '', // Keep legacy field for backward compatibility
    address_unit: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
    address_country: 'US', // Default to US to match backend
    company_name: '',
    is_business: false,
    preferred_pickup_address: ''
  });

  const [vehicleForm, setVehicleForm] = useState({
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    capacity: 1000,
    capacity_unit: 'kg'
  });

  const [deliveryForm, setDeliveryForm] = useState({
    pickup_location: '',
    dropoff_location: '',
    item_description: '',
    same_pickup_as_customer: false,
    use_preferred_pickup: false
  });

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // ========================================
  // NETWORK & BACKEND FUNCTIONS
  // ========================================

  const checkBackend = async () => {
    setBackendStatus('🔄 Checking...');
    const healthy = await checkBackendHealth();
    if (healthy) {
      // API_BASE is already resolved by useEffect, no need to set it again
      setCurrentNetwork('Unified API URL');
      setBackendStatus(`✅ Connected (Unified API)`);
      Alert.alert('Backend Connected', `Successfully connected via ${API_BASE}`);
    } else {
      setBackendStatus('❌ No Backend Found');
      setCurrentNetwork('Not Connected');
      Alert.alert(
        'Backend Connection Failed',
        `Could not connect to ${API_BASE}.\n\nCheck:\n1. Backend server running\n2. Network connection\n3. Tunnel/LAN mode\n\nDebug: ${JSON.stringify(await getApiDebugInfo())}`
      );
    }
  };

  // ========================================
  // API FUNCTIONS
  // ========================================

  const makeAuthenticatedRequest = async (endpoint: string, options: Record<string, any> = {}) => {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: any = {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...((typeof authToken === 'string' && authToken) ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    };

    console.log(`🔗 API Request: ${API_BASE}${endpoint}`);
    console.log(`🔑 Auth Token: ${authToken ? `${authToken.substring(0, 20)}...` : 'NULL/UNDEFINED'}`);
    console.log(`🔑 Auth Header: ${headers.Authorization ? 'Present' : 'Missing'}`);
    console.log(`👤 User Type: ${userType}`);

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const errorText = await response.clone().text();
      console.log(`❌ Error Response: ${errorText}`);
    }

    return response;
  };

  const handleLogout = async () => {
    await authLogout();
    setAuthToken(null);
    setUserType(null);
    setCurrentScreen('main');
  };

  // Authentication Functions
  const login = async () => {
    if (!loginForm.username || !loginForm.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log(`Attempting login to: ${API_BASE}/token/`);
      const result = await authLogin({
        username: loginForm.username,
        password: loginForm.password,
      });

      setAuthToken(result.access);
      setUserType(result.me.role);
      setCurrentScreen('dashboard');
      setLoginForm({ username: '', password: '' });
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Invalid credentials',
      );
    }
    setLoading(false);
  };

  // Registration Functions
  const registerCustomer = async () => {
    if (!customerForm.username || !customerForm.email || !customerForm.password) {
      Alert.alert('Error', 'Please fill in username, email, and password');
      return;
    }
    if (!customerForm.first_name?.trim() || !customerForm.last_name?.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }
    const phoneDigits = getPhoneDigits(customerForm.phone_number);
    if (phoneDigits.length !== 10) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/customers/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...customerForm, phone_number: phoneDigits })
      });

      if (response.ok) {
        Alert.alert('Success', 'Customer registered successfully! You can now login.');
        setCustomerForm({
          username: '', email: '', password: '', first_name: '', last_name: '',
          phone_number: '', address: '', address_unit: '', address_street: '',
          address_city: '', address_state: '', address_postal_code: '',
          address_country: 'US',
          company_name: '', is_business: false,
          preferred_pickup_address: ''
        });
        setCurrentScreen('login');
      } else {
        const errorData = await response.json();
        Alert.alert('Registration Failed', JSON.stringify(errorData));
      }
    } catch (error) {
      Alert.alert('Error', 'Network error during registration');
    }
    setLoading(false);
  };

  // Data Loading Functions
  const loadData = async () => {
    if (!authToken) return;

    setLoading(true);
    try {
      // Load all data based on user type
      if (userType === 'admin' || userType === 'driver') {
        await Promise.all([
          loadDeliveries(),
          loadCustomers(),
          loadDrivers(),
          loadVehicles(),
          loadAssignments(),
          loadDriverVehicles(),
          ...(userType === 'driver' ? [loadDriverMyVehicle(), loadDriverCompliance()] : []),
          ...(userType === 'admin' ? [loadFleetComplianceSummary()] : []),
        ]);
      } else if (userType === 'customer') {
        await loadMyDeliveries();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const loadDeliveries = async () => {
    try {
      setDeliveries(await fetchDeliveries(makeAuthenticatedRequest));
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const loadMyDeliveries = async () => {
    try {
      setDeliveries(await fetchMyDeliveries(makeAuthenticatedRequest));
    } catch (error) {
      console.error('Error loading my deliveries:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      setCustomers(await fetchCustomers(makeAuthenticatedRequest));
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadDrivers = async () => {
    if (driversLoading) {
      console.log('[DEBUG] loadDrivers: Already loading, skipping duplicate call');
      return;
    }

    console.log('[DEBUG] loadDrivers: Starting to load drivers');
    setDriversLoading(true);
    try {
      const response = await makeAuthenticatedRequest('/drivers/');
      console.log('[DEBUG] loadDrivers: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] loadDrivers: Received data:', data);
        setDrivers(data.results || data);
        console.log('[DEBUG] loadDrivers: Set drivers, count:', (data.results || data).length);
      } else {
        console.error('[DEBUG] loadDrivers: Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[DEBUG] loadDrivers: Error loading drivers:', error);
    } finally {
      setDriversLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await makeAuthenticatedRequest('/vehicles/');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.results || data);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      setAssignments(await fetchAssignments(makeAuthenticatedRequest));
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadDriverVehicles = async () => {
    try {
      setDriverVehicles(await fetchDriverVehicles(makeAuthenticatedRequest));
    } catch (error) {
      console.error('Error loading driver vehicles:', error);
    }
  };

  const loadDriverMyVehicle = async () => {
    try {
      const response = await makeAuthenticatedRequest('/drivers/me/vehicle/');
      if (response.ok) {
        const data = await response.json();
        setDriverVehicleId(data.id ?? null);
        setDriverVehicleSummary({
          license_plate: data.license_plate || '',
          make: data.make || '',
          model: data.model || '',
          active: data.active !== false,
        });
      } else {
        setDriverVehicleSummary(null);
        setDriverVehicleId(null);
      }
    } catch (error) {
      console.error('Error loading driver vehicle:', error);
      setDriverVehicleSummary(null);
      setDriverVehicleId(null);
    }
  };

  const loadDriverCompliance = async () => {
    try {
      const profileResponse = await makeAuthenticatedRequest('/drivers/me/');
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setDriverMeId(profile.id ?? null);
        setDriverMeApproval({
          status: profile.approval_status || 'APPROVED',
          rejectionReason: profile.approval_rejection_reason,
        });
      }
      const summary = await getMyComplianceStatus(makeAuthenticatedRequest);
      setDriverComplianceSummary(summary);
    } catch (error) {
      console.error('Error loading driver compliance:', error);
      setDriverComplianceSummary(null);
    }
  };

  const loadFleetComplianceSummary = async () => {
    try {
      const summary = await getFleetComplianceSummary(makeAuthenticatedRequest);
      setFleetComplianceSummary(summary);
    } catch (error) {
      console.error('Error loading fleet compliance summary:', error);
      setFleetComplianceSummary(null);
    }
  };

  // ========================================
  // CUSTOMER CRUD FUNCTIONS
  // ========================================

  const createCustomer = async (customerData: any) => {
    setLoading(true);
    try {
      // Check for valid token
      if (!authToken) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        setCurrentScreen('login');
        setLoading(false);
        return;
      }
      // Use admin endpoint for customer creation
      // Ensure all required fields are present, including address_country
      const payload = buildCustomerAdminPayload(customerData);

      await createCustomerByApi(makeAuthenticatedRequest, payload);

      Alert.alert('Success', 'Customer created successfully!');
      setCrudMode('list');
      await loadCustomers();

      // Reset form
      setCustomerForm({
        username: '', email: '', password: '', first_name: '', last_name: '',
        phone_number: '', address: '', address_unit: '', address_street: '',
        address_city: '', address_state: '', address_postal_code: '',
        address_country: 'US',
        company_name: '', is_business: false,
        preferred_pickup_address: ''
      });

    } catch (error) {
      console.error('Error creating customer:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message || 'Failed to create customer');
      } else {
        Alert.alert('Error', 'Failed to create customer');
      }
    } finally {
      setLoading(false);
    }
  };
  const updateCustomer = async (customerId: any, customerData: any) => {
    setLoading(true);
    try {
      console.log('[DEBUG] updateCustomer called for ID:', customerId);
      console.log('[DEBUG] updateCustomer API_BASE:', API_BASE);
      console.log('[DEBUG] updateCustomer payload:', JSON.stringify(customerData, null, 2));
      console.log('[DEBUG] updateCustomer auth token present:', !!authToken);

      // Always include password field in update, even if blank
      const payload = { ...customerData };
      const endpoint = `/customers/${customerId}/`;
      console.log('[DEBUG] updateCustomer full URL:', API_BASE + endpoint);

      await updateCustomerById(makeAuthenticatedRequest, customerId, payload);
      Alert.alert('Success', 'Customer updated successfully!');
      setCrudMode('list');
      loadCustomers();
    } catch (error) {
      console.error('[DEBUG] updateCustomer exception:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to update customer: ' + JSON.stringify(error);
      console.error('[DEBUG] updateCustomer final error message:', errMsg);
      Alert.alert('Error', errMsg);
      throw error; // Re-throw so handleUpdate can catch it
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId: any) => {
    setLoading(true);
    try {
      await deleteCustomerById(makeAuthenticatedRequest, customerId);

      Alert.alert('Success', 'Customer deleted successfully!');
      setCrudMode('list');
      // Refresh the customer list
      await loadCustomers();

    } catch (error) {
      console.error('Error deleting customer:', error);
      Alert.alert('Error', (error as any).message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerDeliveries = async (customerId: any) => {
    try {
      return await fetchCustomerDeliveries(makeAuthenticatedRequest, customerId);
    } catch (error) {
      console.error('Error loading customer deliveries:', error);
      return [];
    }
  };

  const requestDelivery = async () => {
    if (!deliveryForm.dropoff_location) {
      Alert.alert('Error', 'Please provide dropoff location');
      return;
    }

    setLoading(true);
    try {
      await requestDeliveryByApi(makeAuthenticatedRequest, deliveryForm);
      Alert.alert('Success', 'Delivery requested successfully!');
      setDeliveryForm({
        pickup_location: '', dropoff_location: '', item_description: '',
        same_pickup_as_customer: false, use_preferred_pickup: false
      });
      setCurrentScreen('dashboard');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Network error during delivery request');
    }
    setLoading(false);
  };

  // ========================================
  // DELIVERY CRUD FUNCTIONS
  // ========================================

  const createDelivery = async (deliveryData: any) => {
    setLoading(true);
    try {
      await createDeliveryByApi(makeAuthenticatedRequest, deliveryData);
      Alert.alert('Success', 'Delivery created successfully!');
      await loadDeliveries();

    } catch (error) {
      console.error('Error creating delivery:', error);
      Alert.alert('Error', (error as any).message || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const updateDelivery = async (deliveryId: any, deliveryData: any) => {
    setLoading(true);
    try {
      await updateDeliveryById(makeAuthenticatedRequest, deliveryId, deliveryData);
      Alert.alert('Success', 'Delivery updated successfully!');
      await loadDeliveries();

    } catch (error) {
      console.error('Error updating delivery:', error);
      Alert.alert('Error', (error as any).message || 'Failed to update delivery');
    } finally {
      setLoading(false);
    }
  };

  const deleteDelivery = async (deliveryId: any) => {
    setLoading(true);
    try {
      await deleteDeliveryById(makeAuthenticatedRequest, deliveryId);
      Alert.alert('Success', 'Delivery deleted successfully!');
      await loadDeliveries();

    } catch (error) {
      console.error('Error deleting delivery:', error);
      Alert.alert('Error', (error as any).message || 'Failed to delete delivery');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // DRIVER CRUD FUNCTIONS
  // ========================================

  const createDriver = async (driverData: any) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest('/drivers/', {
        method: 'POST',
        body: JSON.stringify(driverData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create driver';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      Alert.alert('Success', 'Driver created successfully!');
      setDriverCrudMode('list');
      await loadDrivers();
    } catch (error) {
      console.error('Error creating driver:', error);
      Alert.alert('Error', (error as any).message || 'Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  const updateDriver = async (driverId: any, driverData: any) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/drivers/${driverId}/`, {
        method: 'PATCH',
        body: JSON.stringify(driverData)
      });

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const msg = errorBody.detail || errorBody.message
          || (typeof errorBody === 'object' && Object.keys(errorBody).length
            ? Object.entries(errorBody).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join('\n')
            : 'Failed to update driver');
        throw new Error(msg);
      }

      Alert.alert('Success', 'Driver updated successfully!');
      setDriverCrudMode('list');
      loadDrivers();

    } catch (error) {
      console.error('Error updating driver:', error);
      Alert.alert('Error', (error as any).message || 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  };

  const deleteDriver = async (driverId: any) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/drivers/${driverId}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete driver';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response has no JSON, use default message
        }
        throw new Error(errorMessage);
      }

      Alert.alert('Success', 'Driver deleted successfully!');
      setDriverCrudMode('list');
      await loadDrivers();

    } catch (error) {
      console.error('Error deleting driver:', error);
      Alert.alert('Error', (error as any).message || 'Failed to delete driver');
    } finally {
      setLoading(false);
    }
  };

  const assignVehicleToDriver = async (driverId: any, vehicleId: any, assignedFrom: any = null) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/drivers/${driverId}/assign_vehicle/`, {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: vehicleId,
          assigned_from: assignedFrom
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign vehicle');
      }

      const data = await response.json();
      Alert.alert('Success', data.message || 'Vehicle assigned successfully!');
      await loadDrivers();
      await loadDriverVehicles();

    } catch (error) {
      console.error('Error assigning vehicle:', error);
      Alert.alert('Error', (error as any).message || 'Failed to assign vehicle');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableVehicles = async () => {
    try {
      const response = await makeAuthenticatedRequest('/drivers/creation_data/');
      if (response.ok) {
        const data = await response.json();
        return data.available_vehicles || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading available vehicles:', error);
      return [];
    }
  };

  // ========================================
  // DRIVER-VEHICLE CRUD FUNCTIONS
  // ========================================

  const createDriverVehicle = async (assignmentData: any) => {
    setLoading(true);
    try {
      return await createDriverVehicleAssignment(makeAuthenticatedRequest, assignmentData);
    } catch (error) {
      console.error('Error creating driver-vehicle assignment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateDriverVehicle = async (assignmentId: any, assignmentData: any) => {
    setLoading(true);
    try {
      return await updateDriverVehicleAssignment(
        makeAuthenticatedRequest,
        assignmentId,
        assignmentData,
      );
    } catch (error) {
      console.error('Error updating driver-vehicle assignment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteDriverVehicle = async (assignmentId: any) => {
    setLoading(true);
    try {
      await deleteDriverVehicleAssignment(makeAuthenticatedRequest, assignmentId);
      return true;
    } catch (error) {
      console.error('Error deleting driver-vehicle assignment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // VEHICLE CRUD FUNCTIONS
  // ========================================

  /* 
   * PRODUCTION NOTE: Vehicle Data Validation Requirements
   * 
   * For MVP phase, vehicle make/model/capacity are user-input fields.
   * For production implementation, these should be validated against:
   * 
   * 1. **Manufacturer Database**: Official vehicle manufacturer lists (Ford, Toyota, etc.)
   * 2. **Model Validation**: Year-specific model catalogs with accurate specifications
   * 3. **Capacity Verification**: Official manufacturer payload/cargo capacity specs
   * 4. **VIN Integration**: Vehicle Identification Number lookup for automatic data population
   * 5. **Third-party APIs**: 
   *    - NHTSA Vehicle API (US)
   *    - Auto manufacturers' official APIs
   *    - Commercial vehicle databases (Edmunds, KBB, etc.)
   * 
   * Benefits for production:
   * - Prevents data entry errors
   * - Ensures accurate capacity calculations for delivery assignments
   * - Regulatory compliance for commercial vehicles
   * - Insurance verification compatibility
   * - Fleet management accuracy
   * 
   * Current MVP allows manual entry for development/testing purposes only.
   */

  const createVehicle = async (vehicleData: any) => {
    setLoading(true);
    try {
      await createVehicleByApi(makeAuthenticatedRequest, {
        license_plate: vehicleData.license_plate,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        vin: vehicleData.vin,
        capacity: vehicleData.capacity,
        capacity_unit: vehicleData.capacity_unit || 'kg',
        active: vehicleData.active !== undefined ? vehicleData.active : true,
      });

      Alert.alert('Success', 'Vehicle created successfully!');
      setVehicleCrudMode('list');
      setVehicleForm({
        license_plate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        capacity: 1000,
        capacity_unit: 'kg'
      });
      await loadVehicles();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      Alert.alert('Error', (error as any).message || 'Failed to create vehicle');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async (vehicleId: any, vehicleData: any) => {
    setLoading(true);
    try {
      await updateVehicleById(makeAuthenticatedRequest, vehicleId, buildVehicleUpdatePayload({
        license_plate: vehicleData.license_plate,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        vin: vehicleData.vin,
        capacity: vehicleData.capacity,
        capacity_unit: vehicleData.capacity_unit || 'kg',
        active: vehicleData.active !== undefined ? vehicleData.active : true,
      }));

      Alert.alert('Success', 'Vehicle updated successfully!');
      setVehicleCrudMode('list');
      await loadVehicles();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating vehicle:', error.message, error.stack);
      } else {
        console.error('Error updating vehicle:', error);
      }
      Alert.alert('Error', (error as any).message || 'Failed to update vehicle');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (vehicleId: number) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/vehicles/${vehicleId}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorBody.detail || errorBody.message || 'Failed to delete vehicle');
      }

      let message = 'Vehicle deleted successfully!';
      if (response.status !== 204) {
        try {
          const data = await response.json();
          if (data.deactivated) {
            message = data.detail || 'Vehicle marked inactive (history preserved).';
          }
        } catch {
          // 204 or empty body
        }
      }

      Alert.alert('Success', message);
      setVehicleCrudMode('list');
      await loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message || 'Failed to delete vehicle');
      } else {
        Alert.alert('Error', 'Failed to delete vehicle');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deactivateVehicle = async (vehicleId: number) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/vehicles/${vehicleId}/deactivate/`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || errorBody.message || 'Failed to deactivate vehicle');
      }
      await response.json().catch(() => ({}));
      await loadVehicles();
    } catch (error) {
      console.error('Error deactivating vehicle:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reactivateVehicle = async (vehicleId: number) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/vehicles/${vehicleId}/reactivate/`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const complianceMsg = Array.isArray(errorBody.compliance)
          ? errorBody.compliance.join('; ')
          : null;
        throw new Error(
          complianceMsg || errorBody.detail || errorBody.message || 'Failed to reactivate vehicle',
        );
      }
      await response.json().catch(() => ({}));
      await loadVehicles();
    } catch (error) {
      console.error('Error reactivating vehicle:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const driverDeactivateOwnVehicle = async () => {
    const response = await makeAuthenticatedRequest('/drivers/me/vehicle/deactivate/', {
      method: 'POST',
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || errorBody.error || errorBody.message || 'Failed to deactivate vehicle');
    }
    return response.json().catch(() => ({}));
  };

  // Add missing handler stubs at the top of App function if not already defined
  function handleCreateDriver() { }
  function handleEditDriver() { }
  function handleDeleteDriver() { }

  // Stub for DriverAdminList
  function DriverAdminList(props: any) {
    return (
      <View>
        <Text>DriverAdminList Component (stub)</Text>
      </View>
    );
  }

  // Stub for DriverForm
  function DriverForm(props: any) {
    return (
      <View>
        <Text>DriverForm Component (stub)</Text>
      </View>
    );
  }

  // Stub for submitDriverForm
  function submitDriverForm() {
    // TODO: Implement driver form submission logic
  }

  // ========================================
  // EFFECTS
  // ========================================

  // Resolve API URL asynchronously on app start
  useEffect(() => {
    const resolveApiUrl = async () => {
      try {
        const url = await getApiUrl();
        setApiBase(url);
        setNetworkEndpoints([{ url, name: 'Unified API URL' }]);
        console.log('✅ API URL resolved:', url);
      } catch (error) {
        console.error('❌ Failed to resolve API URL:', error);
        // Fallback if BACKEND_URL not set (run start-fullstack.bat or set .env)
        const fallbackUrl = 'http://192.168.1.80:8000/api';
        setApiBase(fallbackUrl);
        setNetworkEndpoints([{ url: fallbackUrl, name: 'LAN Fallback' }]);
      }
    };

    resolveApiUrl();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const session = await restoreAuthSession();
        if (!session || cancelled) {
          return;
        }
        setAuthToken(session.access);
        setUserType(session.me.role);
        setCurrentScreen('dashboard');
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    checkBackend();
  }, []);

  useEffect(() => {
    if (authToken && currentScreen === 'dashboard') {
      loadData();
    }
    // Load customers when entering admin_customers screen
    if (authToken && (currentScreen === 'admin_customers' || currentScreen === 'admin_deliveries')) {
      loadCustomers();
    }
  }, [authToken, currentScreen, userType]);

  // CIO MARCH 2026: Guard admin-only screens - redirect non-admins to dashboard
  useEffect(() => {
    const adminScreens = ['admin_customers', 'admin_vehicles', 'admin_deliveries', 'admin_drivers', 'admin_driver_vehicles', 'admin_compliance'];
    if (adminScreens.includes(currentScreen) && userType !== 'admin' && userType !== null) {
      setCurrentScreen('dashboard');
    }
  }, [currentScreen, userType]);

  // ========================================
  // RENDER FUNCTIONS

  // Admin Customers Screen
  if (currentScreen === 'admin_customers' && userType === 'admin') {
    return <AdminCustomersScreen onBack={() => setCurrentScreen('dashboard')} customers={customers} loadCustomers={loadCustomers} createCustomer={createCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />;
  }

  // Admin Vehicles Screen
  if (currentScreen === 'admin_vehicles' && userType === 'admin') {
    return <AdminVehiclesScreen onBack={() => setCurrentScreen('dashboard')} API_BASE={API_BASE} vehicles={vehicles} loadVehicles={loadVehicles} makeAuthenticatedRequest={makeAuthenticatedRequest} createVehicle={createVehicle} updateVehicle={updateVehicle} deleteVehicle={deleteVehicle} deactivateVehicle={deactivateVehicle} reactivateVehicle={reactivateVehicle} />;
  }

  if (currentScreen === 'admin_deliveries' && userType === 'admin') {
    return <AdminDeliveriesScreen onBack={() => setCurrentScreen('dashboard')} deliveries={deliveries} customers={customers} drivers={drivers} assignments={assignments} loadDeliveries={loadDeliveries} loadAssignments={loadAssignments} makeAuthenticatedRequest={makeAuthenticatedRequest} createDelivery={createDelivery} updateDelivery={updateDelivery} deleteDelivery={deleteDelivery} />;
  }

  if (currentScreen === 'admin_drivers' && userType === 'admin') {
    return <AdminDriversScreen onBack={() => setCurrentScreen('dashboard')} API_BASE={API_BASE} drivers={drivers} loadDrivers={loadDrivers} makeAuthenticatedRequest={makeAuthenticatedRequest} createDriver={createDriver} updateDriver={updateDriver} deleteDriver={deleteDriver} />;
  }

  // Admin Driver-Vehicles Screen
  if (currentScreen === 'admin_driver_vehicles' && userType === 'admin') {
    return <AdminDriverVehiclesScreen onBack={() => setCurrentScreen('dashboard')} driverVehicles={driverVehicles} drivers={drivers} vehicles={vehicles} loadDriverVehicles={loadDriverVehicles} loadDrivers={loadDrivers} loadVehicles={loadVehicles} createDriverVehicle={createDriverVehicle} updateDriverVehicle={updateDriverVehicle} deleteDriverVehicle={deleteDriverVehicle} />;
  }

  // Admin Compliance Ops (Phase 4D)
  if (currentScreen === 'admin_compliance' && userType === 'admin') {
    return (
      <AdminComplianceScreen
        onBack={() => setCurrentScreen('dashboard')}
        request={makeAuthenticatedRequest}
        theme={theme}
        styles={styles}
      />
    );
  }

  // Delivery Request Screen (customer + driver)
  if (currentScreen === 'delivery_request') {
    return <DeliveryRequestScreen onBack={() => setCurrentScreen('dashboard')} API_BASE={API_BASE} authToken={authToken} makeAuthenticatedRequest={makeAuthenticatedRequest} />;
  }

  // My Deliveries Screen
  if (currentScreen === 'my_deliveries') {
    return <MyDeliveriesScreen onBack={() => setCurrentScreen('dashboard')} deliveries={deliveries} loadMyDeliveries={loadMyDeliveries} makeAuthenticatedRequest={makeAuthenticatedRequest} userType={userType} />;
  }

  if (currentScreen === 'customer_profile_edit' && userType === 'customer') {
    return <CustomerProfileEditScreen onBack={() => setCurrentScreen('dashboard')} API_BASE={API_BASE} makeAuthenticatedRequest={makeAuthenticatedRequest} />;
  }

  if (currentScreen === 'driver_profile_edit' && userType === 'driver') {
    return <DriverProfileEditScreen onBack={() => setCurrentScreen('dashboard')} API_BASE={API_BASE} makeAuthenticatedRequest={makeAuthenticatedRequest} />;
  }

  if (currentScreen === 'driver_vehicle_edit' && userType === 'driver') {
    return <DriverVehicleEditScreen onBack={() => setCurrentScreen('dashboard')} API_BASE={API_BASE} makeAuthenticatedRequest={makeAuthenticatedRequest} loadDriverMyVehicle={loadDriverMyVehicle} loadDriverCompliance={loadDriverCompliance} driverComplianceSummary={driverComplianceSummary} />;
  }

  if (currentScreen === 'driver_compliance' && userType === 'driver') {
    return <DriverComplianceScreen onBack={() => setCurrentScreen('dashboard')} makeAuthenticatedRequest={makeAuthenticatedRequest} driverMeId={driverMeId} driverMeApproval={driverMeApproval} driverComplianceSummary={driverComplianceSummary} loadDriverCompliance={loadDriverCompliance} />;
  }

  // Register as Driver Screen
  if (currentScreen === 'register_driver') {
    return <RegisterAsDriverScreen onBack={() => setCurrentScreen('main')} API_BASE={API_BASE} />;
  }
  // ========================================

  // Loading Screen
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color={theme.border} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Main Welcome Screen
  if (currentScreen === 'main') {
    return (
      <ScrollView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.content}>
          <Text style={styles.title}>🚚 DeliveryApp Mobile</Text>
          <Text style={styles.subtitle}>Complete Delivery Management System</Text>

          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Backend Status</Text>
            <Text style={styles.status}>{backendStatus}</Text>
            <Text style={styles.networkLabel}>Network: {currentNetwork}</Text>
            <Text style={styles.networkLabel}>API Base: {API_BASE}</Text>
            <Text style={styles.debugLabel}>Debug: {JSON.stringify(getApiDebugInfo())}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Debug Info</Text>
            <Text style={styles.networkLabel}>Available Endpoints:</Text>
            {NETWORK_ENDPOINTS.map((endpoint, index) => (
              <Text key={index} style={[styles.networkLabel, { fontSize: 12, marginLeft: 10 }]}>
                • {endpoint.name}: {endpoint.url}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔐 Authentication</Text>
            <View style={styles.buttonContainer}>
              <Button title="🔑 Login" onPress={() => setCurrentScreen('login')} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Registration</Text>
            <View style={styles.buttonContainer}>
              <Button title="👤 Register as Customer" onPress={() => setCurrentScreen('customer_register')} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="🚚 Register as Driver" onPress={() => setCurrentScreen('register_driver')} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.buttonContainer}>
              <Button title="🔄 Check Backend" onPress={checkBackend} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🔑 Login</Text>

          <TextInput
            style={styles.input}
            value={loginForm.username}
            onChangeText={(text) => setLoginForm({ ...loginForm, username: text })}
            placeholderTextColor={theme.placeholder} placeholder="Username"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            value={loginForm.password}
            onChangeText={(text) => setLoginForm({ ...loginForm, password: text })}
            placeholderTextColor={theme.placeholder} placeholder="Password"
            secureTextEntry
          />

          <View style={styles.buttonContainer}>
            <Button title="Login" onPress={login} disabled={loading} />
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Back" onPress={() => setCurrentScreen('main')} />
          </View>

          <View style={styles.section}>
            <Text style={styles.infoText}>
              Need an account? Go back and register as a customer or driver first.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Customer Registration Screen - KEYBOARD FIXED!
  if (currentScreen === 'customer_register') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>👤 Customer Registration</Text>

            <Text style={styles.sectionTitle}>Account Information</Text>
            <TextInput
              style={styles.input}
              value={customerForm.username}
              onChangeText={(text) => setCustomerForm({ ...customerForm, username: text })}
              placeholderTextColor={theme.placeholder} placeholder="Username *"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              value={customerForm.email}
              onChangeText={(text) => setCustomerForm({ ...customerForm, email: text })}
              placeholderTextColor={theme.placeholder} placeholder="Email *"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              value={customerForm.password}
              onChangeText={(text) => setCustomerForm({ ...customerForm, password: text })}
              placeholderTextColor={theme.placeholder} placeholder="Password *"
              secureTextEntry
            />

            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TextInput
              style={styles.input}
              value={customerForm.first_name}
              onChangeText={(text) => setCustomerForm({ ...customerForm, first_name: text })}
              placeholderTextColor={theme.placeholder} placeholder="First Name *"
            />

            <TextInput
              style={styles.input}
              value={customerForm.last_name}
              onChangeText={(text) => setCustomerForm({ ...customerForm, last_name: text })}
              placeholderTextColor={theme.placeholder} placeholder="Last Name *"
            />

            <TextInput
              style={styles.input}
              value={customerForm.phone_number}
              onChangeText={(text) => setCustomerForm({ ...customerForm, phone_number: formatPhone10(text) })}
              placeholderTextColor={theme.placeholder} placeholder="Phone Number * (10 digits)"
              keyboardType="phone-pad"
              maxLength={14}
            />

            <Text style={styles.sectionTitle}>📍 Address Information</Text>

            <TextInput
              style={styles.input}
              value={customerForm.address_unit}
              onChangeText={(text) => setCustomerForm({ ...customerForm, address_unit: text })}
              placeholderTextColor={theme.placeholder} placeholder="Unit/Apartment (Optional)"
            />

            <TextInput
              style={styles.input}
              value={customerForm.address_street}
              onChangeText={(text) => setCustomerForm({ ...customerForm, address_street: text })}
              placeholderTextColor={theme.placeholder} placeholder="Street Address"
            />

            <TextInput
              style={styles.input}
              value={customerForm.address_city}
              onChangeText={(text) => setCustomerForm({ ...customerForm, address_city: text })}
              placeholderTextColor={theme.placeholder} placeholder="City"
            />

            <TextInput
              style={styles.input}
              value={customerForm.address_state}
              onChangeText={(text) => setCustomerForm({ ...customerForm, address_state: text })}
              placeholderTextColor={theme.placeholder} placeholder="State/Province"
            />

            <TextInput
              style={styles.input}
              value={customerForm.address_postal_code}
              onChangeText={(text) => setCustomerForm({ ...customerForm, address_postal_code: text })}
              placeholderTextColor={theme.placeholder} placeholder="Postal/ZIP Code"
            />

            <Text style={styles.label}>Country *</Text>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Button
                  title={customerForm.address_country === 'CA' ? '🇨🇦 Canada (CA)' : 'Canada (CA)'}
                  onPress={() => setCustomerForm({ ...customerForm, address_country: 'CA' })}
                  color={customerForm.address_country === 'CA' ? '#007AFF' : '#8E8E93'}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Button
                  title={customerForm.address_country === 'US' ? '🇺🇸 USA (US)' : 'USA (US)'}
                  onPress={() => setCustomerForm({ ...customerForm, address_country: 'US' })}
                  color={customerForm.address_country === 'US' ? '#007AFF' : '#8E8E93'}
                />
              </View>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 10 }}>
              Selected: {customerForm.address_country === 'CA' ? 'Canada' : customerForm.address_country === 'US' ? 'United States' : 'Please select a country'}
            </Text>

            <Text style={styles.sectionTitle}>Business Customer</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Is Business Customer</Text>
              <Switch
                value={customerForm.is_business}
                onValueChange={(value) => setCustomerForm({ ...customerForm, is_business: value })}
              />
            </View>

            {customerForm.is_business && (
              <TextInput
                style={styles.input}
                value={customerForm.company_name}
                onChangeText={(text) => setCustomerForm({ ...customerForm, company_name: text })}
                placeholderTextColor={theme.placeholder} placeholder="Company Name"
              />
            )}

            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={customerForm.preferred_pickup_address}
              onChangeText={(text) => setCustomerForm({ ...customerForm, preferred_pickup_address: text })}
              placeholderTextColor={theme.placeholder} placeholder="Preferred Pickup Address (Optional)"
              multiline
              numberOfLines={2}
            />

            <View style={styles.buttonContainer}>
              <Button title="Register Customer" onPress={registerCustomer} disabled={loading} />
            </View>

            <View style={styles.buttonContainer}>
              <Button title="Back" onPress={() => setCurrentScreen('main')} />
            </View>

            {/* Extra padding to ensure buttons are visible above keyboard */}
            <View style={styles.keyboardPadding} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Dashboard Screen (Post-Login)
  if (currentScreen === 'dashboard') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>📊 Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {typeof userType === 'string' ? userType.toUpperCase() : ''} User!</Text>

          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status: Logged In</Text>
            <Text style={styles.networkLabel}>User Type: {userType}</Text>
          </View>

          {/* Customer Dashboard */}
          {userType === 'customer' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📦 Customer Services</Text>
              <View style={styles.buttonContainer}>
                <Button title="👤 Edit My Profile" onPress={() => setCurrentScreen('customer_profile_edit')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="📋 Request Delivery" onPress={() => setCurrentScreen('delivery_request')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="📋 My Deliveries" onPress={() => setCurrentScreen('my_deliveries')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="🚪 Logout" onPress={handleLogout} />
              </View>
            </View>
          )}

          {/* Driver Dashboard - CIO MARCH 2026 */}
          {userType === 'driver' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚚 Driver Services</Text>
              {driverMeApproval?.status === 'PENDING' ? (
                <View style={[styles.itemContainer, { marginBottom: 12, borderColor: '#f0ad4e' }]}>
                  <Text style={{ color: '#f0ad4e', fontWeight: '600' }}>
                    Registration pending admin approval
                  </Text>
                  <Text style={{ color: theme.textMuted, marginTop: 6 }}>
                    You can upload compliance documents now. You cannot be assigned deliveries until an admin approves your account.
                  </Text>
                </View>
              ) : null}
              {driverMeApproval?.status === 'REJECTED' ? (
                <View style={[styles.itemContainer, { marginBottom: 12, borderColor: theme.error }]}>
                  <Text style={{ color: theme.error, fontWeight: '600' }}>
                    Registration rejected
                  </Text>
                  {driverMeApproval.rejectionReason ? (
                    <Text style={{ color: theme.error, marginTop: 6 }}>
                      {driverMeApproval.rejectionReason}
                    </Text>
                  ) : null}
                  <Text style={{ color: theme.textMuted, marginTop: 6 }}>
                    Contact admin if you need to re-register or appeal this decision.
                  </Text>
                </View>
              ) : null}
              {driverVehicleSummary ? (
                <View style={[styles.itemContainer, { marginBottom: 12 }]}>
                  <Text style={styles.itemTitle}>
                    {driverVehicleSummary.make} {driverVehicleSummary.model} ({driverVehicleSummary.license_plate})
                  </Text>
                  <Text style={{ color: theme.text }}>
                    Vehicle status: {driverVehicleSummary.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: theme.text, marginBottom: 12 }}>No vehicle on file.</Text>
              )}
              <View style={styles.buttonContainer}>
                <Button title="📋 Compliance & Documents" onPress={() => setCurrentScreen('driver_compliance')} />
              </View>
              <ComplianceStatusCard
                summary={driverComplianceSummary}
                theme={theme}
                styles={styles}
              />
              <View style={styles.buttonContainer}>
                <Button title="👤 Edit My Profile" onPress={() => setCurrentScreen('driver_profile_edit')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="🚛 My Vehicle & Compliance" onPress={() => setCurrentScreen('driver_vehicle_edit')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="📦 My Deliveries" onPress={() => setCurrentScreen('my_deliveries')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="🔄" onPress={loadData} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="🚪 Logout" onPress={handleLogout} />
              </View>
            </View>
          )}

          {/* Admin Dashboard */}
          {/* Admin Dashboard (ScrollView only for dashboard, not CRUD screens) */}
          {userType === 'admin' && !adminScreen && (
            <ScrollView style={styles.container}>
              <View style={styles.content}>
                <Text style={styles.sectionTitle}>🛠️ Admin Management</Text>
                {fleetComplianceSummary ? (
                  <View style={[styles.itemContainer, { marginBottom: 16 }]}>
                    <Text style={styles.sectionTitle}>📋 Compliance overview</Text>
                    <Text style={{ color: theme.text }}>
                      Pending docs: {fleetComplianceSummary.documents_pending}
                      {' · '}
                      Expired: {fleetComplianceSummary.documents_expired}
                      {' · '}
                      Expiring soon: {fleetComplianceSummary.documents_expiring_soon}
                    </Text>
                    <Text style={{ color: theme.text, marginTop: 4 }}>
                      Drivers pending approval: {fleetComplianceSummary.drivers_pending_approval}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.buttonContainer}>
                  <Button title="📋 Compliance inbox" onPress={() => setCurrentScreen('admin_compliance')} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="👥 Manage Customers" onPress={() => setCurrentScreen('admin_customers')} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="🚚 Manage Drivers" onPress={() => setCurrentScreen('admin_drivers')} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="🚛 Manage Vehicles" onPress={() => setCurrentScreen('admin_vehicles')} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="📦 Manage Deliveries" onPress={() => setCurrentScreen('admin_deliveries')} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="🔗 Driver Vehicles" onPress={() => setCurrentScreen('admin_driver_vehicles')} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="🔄" onPress={loadData} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="🚪 Logout" onPress={handleLogout} />
                </View>
              </View>
            </ScrollView>
          )}

          {/* Admin Drivers CRUD (no ScrollView) */}
          {userType === 'admin' && adminScreen === 'admin_drivers' && (
            <View style={styles.container}>
              <View style={styles.content}>
                {driverCrudMode === 'list' && (
                  <DriverAdminList
                    drivers={drivers}
                    onCreate={handleCreateDriver}
                    onEdit={handleEditDriver}
                    onDelete={handleDeleteDriver}
                    onBack={() => setAdminScreen(null)}
                  />
                )}
                {(driverCrudMode === 'create' || driverCrudMode === 'edit') && (
                  <DriverForm
                    form={driverFormState}
                    setForm={setDriverFormState}
                    onSubmit={submitDriverForm}
                    onCancel={() => setDriverCrudMode('list')}
                    isEdit={driverCrudMode === 'edit'}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // Default/Fallback Screen
  return (
    <View style={styles.container}>
      <NetworkHealthBanner />
      <Text>Default/Fallback Screen</Text>
    </View>
  );
}

