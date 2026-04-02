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

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { checkBackendHealth, getApiDebugInfo, getApiUrl } from './src/config/api';

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
  // North America: 10-digit phone (area code 1 assumed). Format: (XXX) XXX-XXXX
  const formatPhone10 = (text: string) => {
    const d = text.replace(/\D/g, '').slice(0, 10);
    if (d.length >= 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length >= 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return d;
  };
  const getPhoneDigits = (value: string) => (value || '').replace(/\D/g, '').slice(0, 10);
  const formatPhoneForDisplay = (value: string) => {
    const d = (value || '').replace(/\D/g, '').slice(0, 10);
    return d ? formatPhone10(d) : '';
  };

  function AdminCustomersScreen({
    onBack,
    customers,
    loadCustomers
  }: {
    onBack: () => void,
    customers: any[],
    loadCustomers: () => Promise<void>
  }) {
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [selected, setSelected] = useState<any>(null);
    const [form, setForm] = useState<any>({
      username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '',
      address_unit: '', address_street: '', address_city: '', address_state: '', address_postal_code: '', address_country: 'US',
      company_name: '', is_business: false, preferred_pickup_address: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [localLoading, setLocalLoading] = useState(false);

    // Form validation
    const validateForm = () => {
      const errors: Record<string, string> = {};

      if (!form.username?.trim()) {
        errors.username = 'Username is required';
      }

      if (!form.email?.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Please enter a valid email address';
      }

      // Password validation - required for create, optional for edit
      if (mode === 'create' && !form.password?.trim()) {
        errors.password = 'Password is required';
      } else if (form.password && form.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      if (!form.first_name?.trim()) {
        errors.first_name = 'First name is required';
      }

      if (!form.last_name?.trim()) {
        errors.last_name = 'Last name is required';
      }

      const phoneDigits = getPhoneDigits(form.phone_number);
      if (phoneDigits.length !== 10) {
        errors.phone_number = 'Phone must be exactly 10 digits (North America)';
      }

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    };

    // Handlers
    const handleSelect = (customer: any) => {
      setSelected(customer);
      setMode('detail');
    };
    const handleEdit = (customer: any) => {
      setSelected(customer);
      setForm({
        username: customer.username || '',
        email: customer.email || '',
        password: '',
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone_number: formatPhoneForDisplay(customer.phone_number || ''),
        address_unit: customer.address_unit || '',
        address_street: customer.address_street || '',
        address_city: customer.address_city || '',
        address_state: customer.address_state || '',
        address_postal_code: customer.address_postal_code || '',
        address_country: customer.address_country || '',
        company_name: customer.company_name || '',
        is_business: customer.is_business || false,
        preferred_pickup_address: customer.preferred_pickup_address || ''
      });
      setMode('edit');
    };
    const handleDelete = async (customer: any) => {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this customer?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setLocalLoading(true);
            try {
              await deleteCustomer(customer.id);
              setMode('list');
              setSelected(null);
              await loadCustomers();
            } catch (e) {
              setError('Failed to delete customer');
            }
            setLocalLoading(false);
          }
        }
      ]);
    };
    const handleCreate = async () => {
      if (!validateForm()) {
        setError('Please fix the errors below');
        return;
      }

      setLocalLoading(true);
      setError(null);
      setFieldErrors({});
      try {
        const payload = { ...form, phone_number: getPhoneDigits(form.phone_number) };
        await createCustomer(payload);
        setMode('list');
        setForm({
          username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '',
          address_unit: '', address_street: '', address_city: '', address_state: '', address_postal_code: '', address_country: 'US',
          company_name: '', is_business: false, preferred_pickup_address: ''
        });
        await loadCustomers();
      } catch (e) {
        setError('Failed to create customer');
      }
      setLocalLoading(false);
    };
    const handleUpdate = async () => {
      if (!selected) return;

      if (!validateForm()) {
        setError('Please fix the errors below');
        return;
      }

      console.log('[DEBUG] handleUpdate starting for customer:', selected.username || selected.id);
      console.log('[DEBUG] handleUpdate form data:', form);
      setLocalLoading(true);
      setError(null);
      setFieldErrors({});

      try {
        // For updates, if password is empty, don't include it in the payload
        const updatePayload = { ...form, phone_number: getPhoneDigits(form.phone_number) };
        if (!updatePayload.password || updatePayload.password.trim() === '') {
          delete updatePayload.password;
        }

        await updateCustomer(selected.id, updatePayload);
        setMode('list');
        setSelected(null);
        await loadCustomers();
      } catch (e) {
        console.error('[DEBUG] handleUpdate error for customer:', selected.username || selected.id, e);
        const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
        console.error('[DEBUG] handleUpdate error details:', errorMessage);
        setError('Failed to update customer (' + (selected.username || selected.id) + '): ' + errorMessage);
      }
      setLocalLoading(false);
    };

    // Render
    if (mode === 'list') {
      console.log('[DEBUG] AdminCustomersScreen - Rendering list mode');
      console.log('[DEBUG] Customers length:', customers.length);
      console.log('[DEBUG] LocalLoading:', localLoading);
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={onBack} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>👥 Admin Customers</Text>
            </View>

            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

            <View style={styles.buttonContainer}>
              <Button
                title="Add Customer"
                onPress={() => {
                  setMode('create');
                  setForm({
                    username: '',
                    email: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    phone_number: '',
                    address_unit: '',
                    address_street: '',
                    address_city: '',
                    address_state: '',
                    address_postal_code: '',
                    address_country: 'US',
                    company_name: '',
                    is_business: false,
                    preferred_pickup_address: '',
                  });
                }}
              />
            </View>

            {localLoading ? (
              <ActivityIndicator />
            ) : customers.length === 0 ? (
              <Text style={styles.emptyText}>No customers found.</Text>
            ) : (
              customers.map((customer: any) => (
                <View key={customer.id} style={styles.itemContainer}>
                  <Text style={styles.itemTitle}>{customer.first_name} {customer.last_name} ({customer.username})</Text>
                  <Text style={{ color: theme.text }}>Email: {customer.email}</Text>
                  <Text style={{ color: theme.text }}>Phone: {formatPhoneForDisplay(customer.phone_number)}</Text>
                  <Text style={{ color: theme.text }}>Business: {customer.is_business ? 'Yes' : 'No'}</Text>
                  {customer.is_business && <Text style={{ color: theme.text }}>Company: {customer.company_name}</Text>}
                  <Text style={{ color: theme.text }}>Address: {customer.address_unit} {customer.address_street}, {customer.address_city}, {customer.address_state} {customer.address_postal_code}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="View" onPress={() => handleSelect(customer)} />
                    </View>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="Edit" onPress={() => handleEdit(customer)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button title="Delete" color="#d9534f" onPress={() => handleDelete(customer)} />
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      );
    }
    if (mode === 'create' || mode === 'edit') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{mode === 'create' ? 'Add Customer' : 'Edit Customer'}</Text>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={fieldErrors.username ? styles.inputError : styles.input}
              value={form.username}
              onChangeText={t => {
                setForm((f: typeof form) => ({ ...f, username: t }));
                if (fieldErrors.username) {
                  setFieldErrors(prev => ({ ...prev, username: '' }));
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Username *"
              autoCapitalize="none"
            />
            {fieldErrors.username && <Text style={styles.fieldError}>{fieldErrors.username}</Text>}

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={fieldErrors.email ? styles.inputError : styles.input}
              value={form.email}
              onChangeText={t => {
                setForm((f: typeof form) => ({ ...f, email: t }));
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Email *"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

            <Text style={styles.label}>{mode === 'create' ? 'Password *' : 'Password'}</Text>
            <TextInput
              style={fieldErrors.password ? styles.inputError : styles.input}
              value={form.password}
              onChangeText={t => {
                setForm((f: typeof form) => ({ ...f, password: t }));
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder={mode === 'create' ? 'Password *' : 'Password (leave blank to keep current)'}
              secureTextEntry
            />
            {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={fieldErrors.first_name ? styles.inputError : styles.input}
              value={form.first_name}
              onChangeText={t => {
                setForm((f: typeof form) => ({ ...f, first_name: t }));
                if (fieldErrors.first_name) {
                  setFieldErrors(prev => ({ ...prev, first_name: '' }));
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="First Name *"
            />
            {fieldErrors.first_name && <Text style={styles.fieldError}>{fieldErrors.first_name}</Text>}

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={fieldErrors.last_name ? styles.inputError : styles.input}
              value={form.last_name}
              onChangeText={t => {
                setForm((f: typeof form) => ({ ...f, last_name: t }));
                if (fieldErrors.last_name) {
                  setFieldErrors(prev => ({ ...prev, last_name: '' }));
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Last Name *"
            />
            {fieldErrors.last_name && <Text style={styles.fieldError}>{fieldErrors.last_name}</Text>}

            <Text style={styles.label}>Phone Number (10 digits, no area code)</Text>
            <TextInput
              style={styles.input}
              value={form.phone_number}
              onChangeText={(t) => setForm((f: typeof form) => ({ ...f, phone_number: formatPhone10(t) }))}
              placeholderTextColor={theme.placeholder} placeholder="(555) 555-5555"
              keyboardType="phone-pad"
              maxLength={14}
            />
            {fieldErrors.phone_number && <Text style={styles.fieldError}>{fieldErrors.phone_number}</Text>}

            <Text style={styles.label}>Unit/Apartment</Text>
            <TextInput style={styles.input} value={form.address_unit} onChangeText={t => setForm((f: typeof form) => ({ ...f, address_unit: t }))} placeholderTextColor={theme.placeholder} placeholder="Unit/Apartment" />

            <Text style={styles.label}>Street Address</Text>
            <TextInput style={styles.input} value={form.address_street} onChangeText={t => setForm((f: typeof form) => ({ ...f, address_street: t }))} placeholderTextColor={theme.placeholder} placeholder="Street Address" />

            <Text style={styles.label}>City</Text>
            <TextInput style={styles.input} value={form.address_city} onChangeText={t => setForm((f: typeof form) => ({ ...f, address_city: t }))} placeholderTextColor={theme.placeholder} placeholder="City" />

            <Text style={styles.label}>State/Province</Text>
            <TextInput style={styles.input} value={form.address_state} onChangeText={t => setForm((f: typeof form) => ({ ...f, address_state: t }))} placeholderTextColor={theme.placeholder} placeholder="State/Province" />

            <Text style={styles.label}>Postal/ZIP Code</Text>
            <TextInput style={styles.input} value={form.address_postal_code} onChangeText={t => setForm((f: typeof form) => ({ ...f, address_postal_code: t }))} placeholderTextColor={theme.placeholder} placeholder="Postal/ZIP Code" />

            <Text style={styles.label}>Country *</Text>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Button
                  title={form.address_country === 'CA' ? '🇨🇦 Canada' : 'Canada (CA)'}
                  onPress={() => setForm((f: typeof form) => ({ ...f, address_country: 'CA' }))}
                  color={form.address_country === 'CA' ? '#007AFF' : '#8E8E93'}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Button
                  title={form.address_country === 'US' ? '🇺🇸 USA' : 'USA (US)'}
                  onPress={() => setForm((f: typeof form) => ({ ...f, address_country: 'US' }))}
                  color={form.address_country === 'US' ? '#007AFF' : '#8E8E93'}
                />
              </View>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Is Business Customer</Text>
              <Switch value={form.is_business} onValueChange={v => setForm((f: typeof form) => ({ ...f, is_business: v }))} />
            </View>
            {form.is_business && (
              <>
                <Text style={styles.label}>Company Name</Text>
                <TextInput style={styles.input} value={form.company_name} onChangeText={t => setForm((f: typeof form) => ({ ...f, company_name: t }))} placeholderTextColor={theme.placeholder} placeholder="Company Name" />
              </>
            )}

            <Text style={styles.label}>Preferred Pickup Address</Text>
            <TextInput style={[styles.input, styles.multilineInput]} value={form.preferred_pickup_address} onChangeText={t => setForm((f: typeof form) => ({ ...f, preferred_pickup_address: t }))} placeholderTextColor={theme.placeholder} placeholder="Preferred Pickup Address" multiline numberOfLines={2} />
            <View style={styles.buttonContainer}>
              <Button title={mode === 'create' ? 'Create' : 'Update'} onPress={mode === 'create' ? handleCreate : handleUpdate} disabled={localLoading} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    if (mode === 'detail' && selected) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Customer Detail</Text>
            <Text style={styles.itemTitle}>{selected.first_name} {selected.last_name} ({selected.username})</Text>
            <Text style={{ color: theme.text }}>Email: {selected.email}</Text>
            <Text style={{ color: theme.text }}>Phone: {formatPhoneForDisplay(selected.phone_number)}</Text>
            <Text style={{ color: theme.text }}>Business: {selected.is_business ? 'Yes' : 'No'}</Text>
            {selected.is_business && <Text style={{ color: theme.text }}>Company: {selected.company_name}</Text>}
            <Text style={{ color: theme.text }}>Address: {selected.address_unit} {selected.address_street}, {selected.address_city}, {selected.address_state} {selected.address_postal_code}</Text>
            <Text style={{ color: theme.text }}>Preferred Pickup: {selected.preferred_pickup_address}</Text>
            <View style={styles.buttonContainer}>
              <Button title="Edit" onPress={() => handleEdit(selected)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Delete" color="#d9534f" onPress={() => handleDelete(selected)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Back to List" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    // fallback
    return (
      <View style={styles.container}><Text style={{ color: theme.text }}>Invalid state</Text></View>
    );
  }

  function AdminVehiclesScreen({ onBack }: { onBack: () => void }) {
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [selected, setSelected] = useState<any>(null);
    const [form, setForm] = useState<any>({
      license_plate: '', make: '', model: '', year: 0,
      vin: '', capacity: 0, active: true
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Handlers
    const handleSelect = (vehicle: any) => {
      setSelected(vehicle);
      setMode('detail');
    };
    const handleEdit = (vehicle: any) => {
      setSelected(vehicle);
      setForm({
        license_plate: vehicle.license_plate || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || 0,
        vin: vehicle.vin || '',
        capacity: vehicle.capacity || 0,
        active: vehicle.active !== undefined ? vehicle.active : true
      });
      setMode('edit');
    };
    const handleDelete = async (vehicle: any) => {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this vehicle?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setLocalLoading(true);
            try {
              await deleteVehicle(vehicle.id);
              setMode('list');
              setSelected(null);
              await loadVehicles();
            } catch (e) {
              setError('Failed to delete vehicle');
            }
            setLocalLoading(false);
          }
        }
      ]);
    };
    const handleCreate = async () => {
      if (!form.license_plate.trim() || !form.make.trim() || !form.model.trim() || !form.vin.trim() || form.capacity <= 0 || form.year <= 0 || form.year < 1900 || form.year > 2100) {
        setError('All fields are required, capacity must be greater than 0, and year must be between 1900-2100');
        return;
      }
      setLocalLoading(true);
      setError(null);
      try {
        await createVehicle(form);
        setMode('list');
        setForm({
          license_plate: '', make: '', model: '', year: 0,
          vin: '', capacity: 0, active: true
        });
        await loadVehicles();
      } catch (e) {
        setError('Failed to create vehicle');
      }
      setLocalLoading(false);
    };
    const handleUpdate = async () => {
      if (!selected) return;
      if (!form.license_plate.trim() || !form.make.trim() || !form.model.trim() || !form.vin.trim() || form.capacity <= 0 || form.year <= 0 || form.year < 1900 || form.year > 2100) {
        setError('All fields are required, capacity must be greater than 0, and year must be between 1900-2100');
        return;
      }
      setLocalLoading(true);
      setError(null);
      try {
        await updateVehicle(selected.id, form);
        setMode('list');
        setSelected(null);
        await loadVehicles();
      } catch (e) {
        setError('Failed to update vehicle');
      }
      setLocalLoading(false);
    };

    // Render
    if (mode === 'list') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={onBack} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🚛 Admin Vehicles</Text>
            </View>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
            <View style={styles.buttonContainer}>
              <Button title="Add Vehicle" onPress={() => { setMode('create'); setForm({ license_plate: '', make: '', model: '', year: 0, vin: '', capacity: 0, active: true }); }} />
            </View>
            {localLoading ? <ActivityIndicator /> : vehicles.length === 0 ? (
              <Text style={styles.emptyText}>No vehicles found.</Text>
            ) : (
              vehicles.map((vehicle: any) => (
                <View key={vehicle.id} style={styles.itemContainer}>
                  <Text style={styles.itemTitle}>{vehicle.make} {vehicle.model} ({vehicle.license_plate})</Text>
                  <Text style={{ color: theme.text }}>Year: {vehicle.year}</Text>
                  <Text style={{ color: theme.text }}>Capacity: {vehicle.capacity} kg</Text>
                  <Text style={{ color: theme.text }}>Status: {vehicle.active ? 'Active' : 'Inactive'}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="View" onPress={() => handleSelect(vehicle)} />
                    </View>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="Edit" onPress={() => handleEdit(vehicle)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button title="Delete" color="#d9534f" onPress={() => handleDelete(vehicle)} />
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      );
    }
    if (mode === 'create' || mode === 'edit') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{mode === 'create' ? 'Add Vehicle' : 'Edit Vehicle'}</Text>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

            <Text style={styles.label}>License Plate *</Text>
            <TextInput style={styles.input} value={form.license_plate} onChangeText={t => setForm((f: typeof form) => ({ ...f, license_plate: t.toUpperCase() }))} placeholderTextColor={theme.placeholder} placeholder="Enter license plate" autoCapitalize="characters" />

            <Text style={styles.label}>Make *</Text>
            <TextInput style={styles.input} value={form.make} onChangeText={t => setForm((f: typeof form) => ({ ...f, make: t }))} placeholderTextColor={theme.placeholder} placeholder="e.g., Ford, Toyota" />

            <Text style={styles.label}>Model *</Text>
            <TextInput style={styles.input} value={form.model} onChangeText={t => setForm((f: typeof form) => ({ ...f, model: t }))} placeholderTextColor={theme.placeholder} placeholder="e.g., Transit, Hiace" />

            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              value={form.year === 0 ? '' : form.year.toString()}
              onChangeText={(text) => {
                // Allow empty input while typing
                if (text === '') {
                  setForm((f: typeof form) => ({ ...f, year: 0 }));
                  return;
                }

                // Only allow numeric characters
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 4) {
                  const year = parseInt(numericText);
                  if (!isNaN(year) && year >= 1900 && year <= 2100) {
                    setForm((f: typeof form) => ({ ...f, year }));
                  } else if (numericText.length > 0) {
                    // Allow partial input while typing
                    const partialYear = parseInt(numericText);
                    if (!isNaN(partialYear)) {
                      setForm((f: typeof form) => ({ ...f, year: partialYear }));
                    }
                  }
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Enter year"
              keyboardType="numeric"
              maxLength={4}
            />

            <Text style={styles.label}>VIN *</Text>
            <TextInput style={styles.input} value={form.vin} onChangeText={t => setForm((f: typeof form) => ({ ...f, vin: t.toUpperCase() }))} placeholderTextColor={theme.placeholder} placeholder="17 characters" autoCapitalize="characters" maxLength={17} />

            <Text style={styles.label}>Capacity (kg) *</Text>
            <TextInput
              style={styles.input}
              value={form.capacity === 0 ? '' : form.capacity.toString()}
              onChangeText={(text) => {
                // Allow empty input while typing
                if (text === '') {
                  setForm((f: typeof form) => ({ ...f, capacity: 0 }));
                  return;
                }

                // Only allow numeric characters
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 6) {
                  const capacity = parseInt(numericText);
                  if (!isNaN(capacity) && capacity >= 1 && capacity <= 50000) {
                    setForm((f: typeof form) => ({ ...f, capacity }));
                  } else if (numericText.length > 0) {
                    // Allow partial input while typing
                    const partialCapacity = parseInt(numericText);
                    if (!isNaN(partialCapacity)) {
                      setForm((f: typeof form) => ({ ...f, capacity: partialCapacity }));
                    }
                  }
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Enter capacity in kg"
              keyboardType="numeric"
            />
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Active Vehicle</Text>
              <Switch value={form.active} onValueChange={v => setForm((f: typeof form) => ({ ...f, active: v }))} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title={mode === 'create' ? 'Create' : 'Update'} onPress={mode === 'create' ? handleCreate : handleUpdate} disabled={localLoading} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    if (mode === 'detail' && selected) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Vehicle Detail</Text>
            <Text style={styles.itemTitle}>{selected.make} {selected.model}</Text>
            <Text style={{ color: theme.text }}>License Plate: {selected.license_plate}</Text>
            <Text style={{ color: theme.text }}>Year: {selected.year}</Text>
            <Text style={{ color: theme.text }}>VIN: {selected.vin}</Text>
            <Text style={{ color: theme.text }}>Capacity: {selected.capacity} kg</Text>
            <Text style={{ color: theme.text }}>Status: {selected.active ? 'Active' : 'Inactive'}</Text>
            <View style={styles.buttonContainer}>
              <Button title="Edit" onPress={() => handleEdit(selected)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Delete" color="#d9534f" onPress={() => handleDelete(selected)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Back to List" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    // fallback
    return (
      <View style={styles.container}><Text style={{ color: theme.text }}>Invalid state</Text></View>
    );
  }

  function AdminDeliveriesScreen({ onBack }: { onBack: () => void }) {
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [selected, setSelected] = useState<any>(null);
    const [form, setForm] = useState<any>({
      customer_name: '', customer_address: '', pickup_location: '', dropoff_location: '',
      item_description: '', status: 'Pending', same_pickup_as_customer: false, use_preferred_pickup: false
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Handlers
    const handleSelect = (delivery: any) => {
      setSelected(delivery);
      setMode('detail');
    };
    const handleEdit = (delivery: any) => {
      setSelected(delivery);
      setForm({
        customer_name: delivery.customer_name || '',
        customer_address: delivery.customer_address || '',
        pickup_location: delivery.pickup_location || '',
        dropoff_location: delivery.dropoff_location || '',
        item_description: delivery.item_description || '',
        status: delivery.status || 'Pending',
        same_pickup_as_customer: delivery.same_pickup_as_customer || false,
        use_preferred_pickup: delivery.use_preferred_pickup || false
      });
      setMode('edit');
    };
    const handleDelete = async (delivery: any) => {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this delivery?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setLocalLoading(true);
            try {
              await deleteDelivery(delivery.id);
              setMode('list');
              setSelected(null);
              await loadDeliveries();
            } catch (e) {
              setError('Failed to delete delivery');
            }
            setLocalLoading(false);
          }
        }
      ]);
    };
    const handleCreate = async () => {
      setLocalLoading(true);
      setError(null);
      try {
        await createDelivery(form);
        setMode('list');
        setForm({
          customer_name: '', customer_address: '', pickup_location: '', dropoff_location: '',
          item_description: '', status: 'Pending', same_pickup_as_customer: false, use_preferred_pickup: false
        });
        await loadDeliveries();
      } catch (e) {
        setError('Failed to create delivery');
      }
      setLocalLoading(false);
    };
    const handleUpdate = async () => {
      if (!selected) return;
      setLocalLoading(true);
      setError(null);
      try {
        await updateDelivery(selected.id, form);
        setMode('list');
        setSelected(null);
        await loadDeliveries();
      } catch (e) {
        setError('Failed to update delivery');
      }
      setLocalLoading(false);
    };

    // Render
    if (mode === 'list') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={onBack} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>📦 Admin Deliveries</Text>
            </View>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
            <View style={styles.buttonContainer}>
              <Button title="Add Delivery" onPress={() => { setMode('create'); setForm({ customer_name: '', customer_address: '', pickup_location: '', dropoff_location: '', item_description: '', status: 'Pending', same_pickup_as_customer: false, use_preferred_pickup: false }); }} />
            </View>
            {localLoading ? <ActivityIndicator /> : deliveries.length === 0 ? (
              <Text style={styles.emptyText}>No deliveries found.</Text>
            ) : (
              deliveries.map((delivery: any) => (
                <View key={delivery.id} style={styles.itemContainer}>
                  <Text style={styles.itemTitle}>{delivery.customer_name}</Text>
                  <Text style={{ color: theme.text }}>From: {delivery.pickup_location}</Text>
                  <Text style={{ color: theme.text }}>To: {delivery.dropoff_location}</Text>
                  <Text style={{ color: theme.text }}>Status: {delivery.status}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="View" onPress={() => handleSelect(delivery)} />
                    </View>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="Edit" onPress={() => handleEdit(delivery)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button title="Delete" color="#d9534f" onPress={() => handleDelete(delivery)} />
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      );
    }
    if (mode === 'create' || mode === 'edit') {
      const statusOptions = ['Pending', 'En Route', 'Completed', 'Cancelled'];
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{mode === 'create' ? 'Add Delivery' : 'Edit Delivery'}</Text>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
            <TextInput style={styles.input} value={form.customer_name} onChangeText={t => setForm((f: typeof form) => ({ ...f, customer_name: t }))} placeholderTextColor={theme.placeholder} placeholder="Customer Name *" />
            <TextInput style={styles.input} value={form.customer_address} onChangeText={t => setForm((f: typeof form) => ({ ...f, customer_address: t }))} placeholderTextColor={theme.placeholder} placeholder="Customer Address *" />
            <TextInput style={styles.input} value={form.pickup_location} onChangeText={t => setForm((f: typeof form) => ({ ...f, pickup_location: t }))} placeholderTextColor={theme.placeholder} placeholder="Pickup Location *" />
            <TextInput style={styles.input} value={form.dropoff_location} onChangeText={t => setForm((f: typeof form) => ({ ...f, dropoff_location: t }))} placeholderTextColor={theme.placeholder} placeholder="Dropoff Location *" />
            <TextInput style={[styles.input, styles.multilineInput]} value={form.item_description} onChangeText={t => setForm((f: typeof form) => ({ ...f, item_description: t }))} placeholderTextColor={theme.placeholder} placeholder="Item Description" multiline numberOfLines={3} />
            <Text style={styles.sectionTitle}>Status</Text>
            {statusOptions.map(status => (
              <View key={status} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ flex: 1, color: theme.text }}>{status}</Text>
                <Switch value={form.status === status} onValueChange={() => setForm((f: typeof form) => ({ ...f, status }))} />
              </View>
            ))}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Same pickup as customer address</Text>
              <Switch value={form.same_pickup_as_customer} onValueChange={v => setForm((f: typeof form) => ({ ...f, same_pickup_as_customer: v }))} />
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Use preferred pickup address</Text>
              <Switch value={form.use_preferred_pickup} onValueChange={v => setForm((f: typeof form) => ({ ...f, use_preferred_pickup: v }))} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title={mode === 'create' ? 'Create' : 'Update'} onPress={mode === 'create' ? handleCreate : handleUpdate} disabled={localLoading} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    if (mode === 'detail' && selected) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Delivery Detail</Text>
            <Text style={styles.itemTitle}>{selected.customer_name}</Text>
            <Text style={{ color: theme.text }}>Customer Address: {selected.customer_address}</Text>
            <Text style={{ color: theme.text }}>Pickup: {selected.pickup_location}</Text>
            <Text style={{ color: theme.text }}>Dropoff: {selected.dropoff_location}</Text>
            <Text style={{ color: theme.text }}>Item: {selected.item_description}</Text>
            <Text style={{ color: theme.text }}>Status: {selected.status}</Text>
            <Text style={{ color: theme.text }}>Created: {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'}</Text>
            <View style={styles.buttonContainer}>
              <Button title="Edit" onPress={() => handleEdit(selected)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Delete" color="#d9534f" onPress={() => handleDelete(selected)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Back to List" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    // fallback
    return (
      <View style={styles.container}><Text style={{ color: theme.text }}>Invalid state</Text></View>
    );
  }

  function DeliveryRequestScreen({ onBack }: { onBack: () => void }) {
    const [form, setForm] = useState({
      pickup_location: '',
      dropoff_location: '',
      item_description: '',
      same_pickup_as_customer: false,
      use_preferred_pickup: false
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const handleSubmit = async () => {
      if (!form.dropoff_location) {
        setError('Please provide dropoff location');
        return;
      }

      setLocalLoading(true);
      setError(null);
      try {
        console.log('🚚 Delivery Request Debug Info:');
        console.log(`API Base: ${API_BASE}`);
        console.log(`Auth Token: ${typeof authToken === 'string' ? authToken.substring(0, 20) + '...' : 'None'}`);
        console.log(`Form Data:`, form);

        const response = await makeAuthenticatedRequest('/api/deliveries/request_delivery/', {
          method: 'POST',
          body: JSON.stringify(form)
        });

        console.log(`Response Status: ${response.status}`);

        if (response.ok) {
          Alert.alert('Success', 'Delivery requested successfully!');
          setForm({
            pickup_location: '', dropoff_location: '', item_description: '',
            same_pickup_as_customer: false, use_preferred_pickup: false
          });
          onBack();
        } else {
          const errorData = await response.text();
          console.log(`Error Response:`, errorData);
          setError(`Request failed (${response.status}): ${errorData}`);
        }
      } catch (error) {
        console.log(`Network Error:`, error);
        setError(`Network error during delivery request: ${error instanceof Error ? error.message : String(error)}`);
      }
      setLocalLoading(false);
    };

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={onBack} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>📋 Request Delivery</Text>
            </View>

            {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

            <Text style={styles.sectionTitle}>Pickup & Delivery Information</Text>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Use my address as pickup</Text>
              <Switch
                value={form.same_pickup_as_customer}
                onValueChange={(value) => setForm({ ...form, same_pickup_as_customer: value })}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Use preferred pickup address</Text>
              <Switch
                value={form.use_preferred_pickup}
                onValueChange={(value) => setForm({ ...form, use_preferred_pickup: value })}
              />
            </View>

            {!form.same_pickup_as_customer && !form.use_preferred_pickup && (
              <TextInput
                style={styles.input}
                value={form.pickup_location}
                onChangeText={(text) => setForm({ ...form, pickup_location: text })}
                placeholderTextColor={theme.placeholder} placeholder="Pickup Location"
              />
            )}

            <TextInput
              style={styles.input}
              value={form.dropoff_location}
              onChangeText={(text) => setForm({ ...form, dropoff_location: text })}
              placeholderTextColor={theme.placeholder} placeholder="Dropoff Location *"
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={form.item_description}
              onChangeText={(text) => setForm({ ...form, item_description: text })}
              placeholderTextColor={theme.placeholder} placeholder="Item Description (Optional)"
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonContainer}>
              <Button title="Request Delivery" onPress={handleSubmit} disabled={localLoading} />
            </View>

            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={onBack} />
            </View>

            {/* Extra padding to ensure buttons are visible above keyboard */}
            <View style={styles.keyboardPadding} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function MyDeliveriesScreen({ onBack }: { onBack: () => void }) {
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [mode, setMode] = useState<'list' | 'detail'>('list');
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const handleSelect = (delivery: any) => {
      setSelectedDelivery(delivery);
      setMode('detail');
    };

    const refreshDeliveries = async () => {
      setLocalLoading(true);
      try {
        await loadMyDeliveries();
      } catch (e) {
        setError('Failed to load deliveries');
      }
      setLocalLoading(false);
    };

    useEffect(() => {
      refreshDeliveries();
    }, []);

    if (mode === 'detail' && selectedDelivery) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={() => setMode('list')} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Delivery Detail</Text>
            </View>

            <Text style={styles.itemTitle}>Delivery #{selectedDelivery.id}</Text>
            <Text>Pickup: {selectedDelivery.pickup_location}</Text>
            <Text>Dropoff: {selectedDelivery.dropoff_location}</Text>
            <Text>Item: {selectedDelivery.item_description || 'No description'}</Text>
            <Text>Status: {selectedDelivery.status}</Text>
            <Text>Requested: {selectedDelivery.created_at ? new Date(selectedDelivery.created_at).toLocaleDateString() : 'N/A'}</Text>

            {selectedDelivery.driver_name && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.sectionTitle}>Driver Information</Text>
                <Text>Driver: {selectedDelivery.driver_name}</Text>
                {selectedDelivery.driver_phone && <Text>Phone: {selectedDelivery.driver_phone}</Text>}
              </View>
            )}

            {selectedDelivery.vehicle_info && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <Text>Vehicle: {selectedDelivery.vehicle_info}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button title="Back to List" onPress={() => { setMode('list'); setSelectedDelivery(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>📋 My Deliveries</Text>
            <Button title="🔄" onPress={refreshDeliveries} />
          </View>

          {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

          {localLoading ? (
            <ActivityIndicator size="large" color="#0066CC" />
          ) : deliveries.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={styles.emptyText}>No deliveries found.</Text>
              <Text style={styles.infoText}>Request your first delivery to get started!</Text>
            </View>
          ) : (
            deliveries.map((delivery: any) => (
              <View key={delivery.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>Delivery #{delivery.id}</Text>
                <Text>From: {delivery.pickup_location}</Text>
                <Text>To: {delivery.dropoff_location}</Text>
                <Text>Status: <Text style={{
                  fontWeight: 'bold',
                  color: delivery.status === 'Completed' ? 'green' :
                    delivery.status === 'Cancelled' ? 'red' :
                      delivery.status === 'En Route' ? 'orange' : 'blue'
                }}>{delivery.status}</Text></Text>
                <Text>Requested: {delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : 'N/A'}</Text>

                <View style={{ marginTop: 8 }}>
                  <Button title="View Details" onPress={() => handleSelect(delivery)} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  function AdminDriversScreen({
    onBack,
    drivers,
    loadDrivers
  }: {
    onBack: () => void,
    drivers: any[],
    loadDrivers: () => Promise<void>
  }) {
    console.log('[DEBUG] AdminDriversScreen: Component initialized/re-initialized');
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      phone_number: '',
      license_number: '',
      active: true
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Note: Drivers are loaded by parent component, no need for useEffect here

    const resetForm = () => {
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        license_number: '',
        active: true
      });
      setError(null);
    };

    const handleCreate = async () => {
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.license_number.trim()) {
        setError('First name, last name, and license number are required');
        return;
      }
      const phoneDigits = getPhoneDigits(formData.phone_number);
      if (phoneDigits.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return;
      }

      setLocalLoading(true);
      try {
        const payload = { ...formData, phone_number: getPhoneDigits(formData.phone_number) };
        await createDriver(payload);
        await loadDrivers();
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Driver created successfully!');
      } catch (e) {
        setError('Failed to create driver: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleUpdate = async () => {
      if (!selectedDriver || !formData.first_name.trim() || !formData.last_name.trim() || !formData.license_number.trim()) {
        setError('First name, last name, and license number are required');
        return;
      }
      const phoneDigits = getPhoneDigits(formData.phone_number);
      if (phoneDigits.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return;
      }

      setLocalLoading(true);
      try {
        const payload = { ...formData, phone_number: getPhoneDigits(formData.phone_number) };
        await updateDriver(selectedDriver.id, payload);
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Driver updated successfully!');
      } catch (e) {
        setError('Failed to update driver: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleDelete = (driver: any) => {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete driver "${driver.first_name} ${driver.last_name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLocalLoading(true);
              try {
                await deleteDriver(driver.id);
                await loadDrivers();
                Alert.alert('Success', 'Driver deleted successfully!');
              } catch (e) {
                setError('Failed to delete driver: ' + (e instanceof Error ? e.message : 'Unknown error'));
              }
              setLocalLoading(false);
            }
          }
        ]
      );
    };

    const handleEdit = (driver: any) => {
      setSelectedDriver(driver);
      setFormData({
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        phone_number: formatPhoneForDisplay(driver.phone_number || ''),
        license_number: driver.license_number || '',
        active: driver.active ?? true
      });
      setMode('edit');
    };

    const handleDetail = (driver: any) => {
      setSelectedDriver(driver);
      setMode('detail');
    };

    const refreshDrivers = async () => {
      console.log('[DEBUG] AdminDriversScreen: Manual refresh triggered');
      if (localLoading) {
        console.log('[DEBUG] AdminDriversScreen: Already loading, skipping refresh');
        return;
      }

      setLocalLoading(true);
      setError(null);
      try {
        await loadDrivers();
        console.log('[DEBUG] AdminDriversScreen: Manual refresh completed, drivers count:', drivers.length);
      } catch (e) {
        console.error('[DEBUG] AdminDriversScreen: Failed to refresh drivers:', e);
        setError('Failed to load drivers: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    if (mode === 'create' || mode === 'edit') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Cancel" onPress={() => { setMode('list'); resetForm(); }} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>
                {mode === 'create' ? 'Add Driver' : 'Edit Driver'}
              </Text>
            </View>

            {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="Enter first name"
              value={formData.first_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="Enter last name"
              value={formData.last_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
            />

            <Text style={styles.label}>Phone Number (10 digits, no area code)</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="(555) 555-5555"
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: formatPhone10(text) }))}
              keyboardType="phone-pad"
              maxLength={14}
            />

            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="Enter license number"
              value={formData.license_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, license_number: text }))}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.label}>Active: </Text>
              <Button
                title={formData.active ? 'Yes' : 'No'}
                onPress={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
              />
            </View>

            <View style={styles.buttonContainer}>
              {localLoading ? (
                <ActivityIndicator size="large" color="#0066CC" />
              ) : (
                <>
                  <Button
                    title={mode === 'create' ? 'Create Driver' : 'Update Driver'}
                    onPress={mode === 'create' ? handleCreate : handleUpdate}
                  />
                  <Button title="Cancel" onPress={() => { setMode('list'); resetForm(); }} />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      );
    }

    if (mode === 'detail' && selectedDriver) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={() => setMode('list')} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Driver Detail</Text>
              <Button title="Edit" onPress={() => handleEdit(selectedDriver)} />
            </View>

            <Text style={styles.itemTitle}>{selectedDriver.first_name} {selectedDriver.last_name}</Text>
            <Text style={{ color: theme.text }}>License: {selectedDriver.license_number}</Text>
            {selectedDriver.phone_number && <Text style={{ color: theme.text }}>Phone: {formatPhoneForDisplay(selectedDriver.phone_number)}</Text>}
            <Text style={{ color: theme.text }}>Status: {selectedDriver.active ? 'Active' : 'Inactive'}</Text>

            {selectedDriver.current_vehicle && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionTitle}>Current Vehicle</Text>
                <Text style={{ color: theme.text }}>Plate: {selectedDriver.current_vehicle_plate}</Text>
                <Text style={{ color: theme.text }}>Vehicle: {selectedDriver.current_vehicle}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button title="Edit Driver" onPress={() => handleEdit(selectedDriver)} />
              <Button
                title="Delete Driver"
                onPress={() => handleDelete(selectedDriver)}
                color="red"
              />
              <Button title="Back to List" onPress={() => { setMode('list'); setSelectedDriver(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }

    console.log('[DEBUG] AdminDriversScreen: Rendering list mode');
    console.log('[DEBUG] AdminDriversScreen: localLoading:', localLoading);
    console.log('[DEBUG] AdminDriversScreen: drivers.length:', drivers.length);
    console.log('[DEBUG] AdminDriversScreen: error:', error);
    console.log('[DEBUG] AdminDriversScreen: Component re-render count:', Date.now());

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🚚 Drivers</Text>
            <Button title="+" onPress={() => { resetForm(); setMode('create'); }} />
          </View>

          <Button title="🔄 Refresh" onPress={refreshDrivers} />

          {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

          {localLoading ? (
            <ActivityIndicator size="large" color="#0066CC" />
          ) : drivers.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={styles.emptyText}>No drivers found.</Text>
              <Text style={styles.infoText}>Add your first driver to get started!</Text>
            </View>
          ) : (
            drivers.map((driver: any) => (
              <View key={driver.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{driver.first_name} {driver.last_name}</Text>
                <Text style={{ color: theme.text }}>License: {driver.license_number}</Text>
                {driver.phone_number && <Text style={{ color: theme.text }}>Phone: {formatPhoneForDisplay(driver.phone_number)}</Text>}
                <Text style={{ color: theme.text }}>Status: <Text style={{ color: driver.active ? 'green' : 'red' }}>
                  {driver.active ? 'Active' : 'Inactive'}
                </Text></Text>
                {driver.current_vehicle_plate && (
                  <Text style={{ color: theme.text }}>Vehicle: {driver.current_vehicle_plate}</Text>
                )}
                {driver.current_vehicle_model && (
                  <Text style={{ color: theme.text }}>Model: {driver.current_vehicle_model}</Text>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                  <Button title="View" onPress={() => handleDetail(driver)} />
                  <Button title="Edit" onPress={() => handleEdit(driver)} />
                  <Button title="Delete" onPress={() => handleDelete(driver)} color="red" />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  function AdminDriverVehiclesScreen({ onBack }: { onBack: () => void }) {
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [formData, setFormData] = useState({
      driver_id: '',
      vehicle_id: '',
      assigned_from: new Date().toISOString().split('T')[0],
      assigned_to: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const resetForm = () => {
      setFormData({
        driver_id: '',
        vehicle_id: '',
        assigned_from: new Date().toISOString().split('T')[0],
        assigned_to: ''
      });
      setError(null);
    };

    const handleCreate = async () => {
      if (!formData.driver_id || !formData.vehicle_id || !formData.assigned_from) {
        setError('Driver, vehicle, and assignment date are required');
        return;
      }

      setLocalLoading(true);
      try {
        await createDriverVehicle(formData);
        await loadDriverVehicles();
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Driver-Vehicle assignment created successfully!');
      } catch (e) {
        setError('Failed to create assignment: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleUpdate = async () => {
      if (!selectedAssignment || !formData.driver_id || !formData.vehicle_id || !formData.assigned_from) {
        setError('Driver, vehicle, and assignment date are required');
        return;
      }

      setLocalLoading(true);
      try {
        await updateDriverVehicle(selectedAssignment.id, formData);
        await loadDriverVehicles();
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Assignment updated successfully!');
      } catch (e) {
        setError('Failed to update assignment: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleDelete = (assignment: any) => {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete this driver-vehicle assignment?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLocalLoading(true);
              try {
                await deleteDriverVehicle(assignment.id);
                await loadDriverVehicles();
                Alert.alert('Success', 'Assignment deleted successfully!');
              } catch (e) {
                setError('Failed to delete assignment: ' + (e instanceof Error ? e.message : 'Unknown error'));
              }
              setLocalLoading(false);
            }
          }
        ]
      );
    };

    const handleEdit = (assignment: any) => {
      setSelectedAssignment(assignment);
      setFormData({
        driver_id: assignment.driver_id?.toString() || '',
        vehicle_id: assignment.vehicle_id?.toString() || '',
        assigned_from: assignment.assigned_from || new Date().toISOString().split('T')[0],
        assigned_to: assignment.assigned_to || ''
      });
      setMode('edit');
    };

    const handleDetail = (assignment: any) => {
      setSelectedAssignment(assignment);
      setMode('detail');
    };

    const refreshAssignments = async () => {
      setLocalLoading(true);
      try {
        await Promise.all([loadDriverVehicles(), loadDrivers(), loadVehicles()]);
      } catch (e) {
        setError('Failed to load data');
      }
      setLocalLoading(false);
    };

    // Note: Driver-Vehicle assignments are loaded by parent component, no need for useEffect here

    if (mode === 'create' || mode === 'edit') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Cancel" onPress={() => { setMode('list'); resetForm(); }} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>
                {mode === 'create' ? 'Assign Vehicle' : 'Edit Assignment'}
              </Text>
            </View>

            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

            {mode === 'edit' ? (
              <>
                <Text style={styles.label}>Driver (Selected)</Text>
                <View style={{ backgroundColor: theme.surface, borderRadius: 5, padding: 10, marginBottom: 10 }}>
                  {(() => {
                    const selectedDriver = drivers.find((d: any) => d.id.toString() === formData.driver_id);
                    return selectedDriver ? (
                      <Text style={{ fontWeight: 'bold', color: theme.text }}>
                        {selectedDriver.first_name} {selectedDriver.last_name} ({selectedDriver.license_number})
                      </Text>
                    ) : (
                      <Text style={{ color: theme.text }}>Driver ID: {formData.driver_id}</Text>
                    );
                  })()}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Driver *</Text>
                <View style={{ backgroundColor: theme.surface, borderRadius: 5, marginBottom: 10 }}>
                  {drivers.map((driver: any) => (
                    <View key={driver.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 5 }}>
                      <Button
                        title={formData.driver_id === driver.id.toString() ? '●' : '○'}
                        onPress={() => setFormData(prev => ({ ...prev, driver_id: driver.id.toString() }))}
                      />
                      <Text style={{ marginLeft: 10, color: theme.text }}>{driver.first_name} {driver.last_name} ({driver.license_number})</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Vehicle * {mode === 'edit' ? '(Change Assignment)' : ''}</Text>
            <View style={{ backgroundColor: theme.surface, borderRadius: 5, marginBottom: 10 }}>
              {vehicles.map((vehicle: any) => {
                const isSelected = formData.vehicle_id === vehicle.id.toString();
                return (
                  <View key={vehicle.id} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 5,
                    backgroundColor: isSelected ? theme.inputBg : 'transparent',
                    borderRadius: 3
                  }}>
                    <Button
                      title={isSelected ? '●' : '○'}
                      onPress={() => setFormData(prev => ({ ...prev, vehicle_id: vehicle.id.toString() }))}
                    />
                    <Text style={{ marginLeft: 10, fontWeight: isSelected ? 'bold' : 'normal', color: theme.text }}>
                      {vehicle.license_plate} - {vehicle.model}
                      {isSelected && mode === 'edit' ? ' (Currently Assigned)' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.label}>Assigned From *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="YYYY-MM-DD"
              value={formData.assigned_from}
              onChangeText={(text) => setFormData(prev => ({ ...prev, assigned_from: text }))}
            />

            <Text style={styles.label}>Assigned To (optional)</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="YYYY-MM-DD (leave empty for ongoing)"
              value={formData.assigned_to}
              onChangeText={(text) => setFormData(prev => ({ ...prev, assigned_to: text }))}
            />

            <View style={styles.buttonContainer}>
              {localLoading ? (
                <ActivityIndicator size="large" color={theme.text} />
              ) : (
                <>
                  <Button
                    title={mode === 'create' ? 'Create Assignment' : 'Update Assignment'}
                    onPress={mode === 'create' ? handleCreate : handleUpdate}
                  />
                  <Button title="Cancel" onPress={() => { setMode('list'); resetForm(); }} />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      );
    }

    if (mode === 'detail' && selectedAssignment) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={() => setMode('list')} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Assignment Detail</Text>
              <Button title="Edit" onPress={() => handleEdit(selectedAssignment)} />
            </View>

            <Text style={styles.itemTitle}>Driver-Vehicle Assignment</Text>
            <Text style={{ color: theme.text }}>Driver: {selectedAssignment.driver_name || 'Unknown Driver'}</Text>
            <Text style={{ color: theme.text }}>Vehicle: {selectedAssignment.vehicle_license_plate || 'Unknown Vehicle'} - {selectedAssignment.vehicle_model || ''}</Text>
            <Text style={{ color: theme.text }}>Assigned From: {selectedAssignment.assigned_from}</Text>
            <Text style={{ color: theme.text }}>Assigned To: {selectedAssignment.assigned_to || 'Ongoing'}</Text>
            <Text style={{ color: theme.text }}>Status: {selectedAssignment.assigned_to ? 'Completed' : 'Active'}</Text>

            <View style={styles.buttonContainer}>
              <Button title="Edit Assignment" onPress={() => handleEdit(selectedAssignment)} />
              <Button
                title="Delete Assignment"
                onPress={() => handleDelete(selectedAssignment)}
                color="red"
              />
              <Button title="Back to List" onPress={() => { setMode('list'); setSelectedAssignment(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🔗 Driver-Vehicles</Text>
            <Button title="+" onPress={() => { resetForm(); setMode('create'); }} />
          </View>

          <Button title="🔄 Refresh" onPress={refreshAssignments} />

          {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

          {localLoading ? (
            <ActivityIndicator size="large" color={theme.text} />
          ) : driverVehicles.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={styles.emptyText}>No driver-vehicle assignments found.</Text>
              <Text style={styles.infoText}>Create your first assignment to get started!</Text>
            </View>
          ) : (
            driverVehicles.map((assignment: any) => (
              <View key={assignment.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>Assignment #{assignment.id}</Text>
                <Text style={{ color: theme.text }}>Driver: {assignment.driver_name || 'Unknown Driver'}</Text>
                <Text style={{ color: theme.text }}>Vehicle: {assignment.vehicle_license_plate || 'Unknown Vehicle'}</Text>
                <Text style={{ color: theme.text }}>From: {assignment.assigned_from}</Text>
                <Text style={{ color: theme.text }}>To: {assignment.assigned_to || 'Ongoing'}</Text>
                <Text style={{ color: theme.text }}>Status: <Text style={{ color: assignment.assigned_to ? theme.textMuted : theme.text }}>
                  {assignment.assigned_to ? 'Completed' : 'Active'}
                </Text></Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                  <Button title="View" onPress={() => handleDetail(assignment)} />
                  <Button title="Edit" onPress={() => handleEdit(assignment)} />
                  <Button title="Delete" onPress={() => handleDelete(assignment)} color="red" />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  function RegisterAsDriverScreen({ onBack }: { onBack: () => void }) {
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      confirm_password: '',
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      license_number: '',
      // Vehicle information
      vehicle_license_plate: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_year: 2000,
      vehicle_vin: '',
      vehicle_capacity: 1000
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const resetForm = () => {
      setFormData({
        username: '',
        password: '',
        confirm_password: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        license_number: '',
        // Vehicle information
        vehicle_license_plate: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: 2000,
        vehicle_vin: '',
        vehicle_capacity: 1000
      });
      setError(null);
    };

    const handleRegister = async () => {
      console.log('[DEBUG] RegisterAsDriverScreen: Form data before validation:', JSON.stringify(formData, null, 2));

      // Specific debug for license_number
      console.log('[DEBUG] RegisterAsDriverScreen: license_number value:', `"${formData.license_number}"`);
      console.log('[DEBUG] RegisterAsDriverScreen: license_number type:', typeof formData.license_number);
      console.log('[DEBUG] RegisterAsDriverScreen: license_number trimmed:', `"${formData.license_number?.trim()}"`);
      console.log('[DEBUG] RegisterAsDriverScreen: license_number exists?', !!formData.license_number);
      console.log('[DEBUG] RegisterAsDriverScreen: license_number trim exists?', !!formData.license_number?.trim());

      // Check each field individually for better debugging
      const missingFields = [];
      if (!formData.username?.trim()) missingFields.push('username');
      if (!formData.password?.trim()) missingFields.push('password');
      if (!formData.first_name?.trim()) missingFields.push('first_name');
      if (!formData.last_name?.trim()) missingFields.push('last_name');
      if (!formData.license_number?.trim()) missingFields.push('license_number');
      if (!formData.vehicle_license_plate?.trim()) missingFields.push('vehicle_license_plate');
      if (!formData.vehicle_make?.trim()) missingFields.push('vehicle_make');
      if (!formData.vehicle_model?.trim()) missingFields.push('vehicle_model');
      if (!formData.vehicle_vin?.trim()) missingFields.push('vehicle_vin');

      // Validate vehicle year (2000 is treated as empty/default)
      if (!formData.vehicle_year || formData.vehicle_year === 2000 || formData.vehicle_year < 2000 || formData.vehicle_year > 2100) {
        missingFields.push('vehicle_year (must be between 2000-2100, not default)');
      }

      console.log('[DEBUG] RegisterAsDriverScreen: Missing fields:', missingFields);

      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match');
        return;
      }

      console.log('[DEBUG] RegisterAsDriverScreen: Starting registration process');
      setLocalLoading(true);
      try {
        // Register as driver with vehicle information (backend expects flat structure)
        const registrationData = {
          // Driver information
          username: formData.username,
          password: formData.password,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          license_number: formData.license_number,
          // Vehicle information (flat structure as expected by backend)
          vehicle_license_plate: formData.vehicle_license_plate,
          vehicle_make: formData.vehicle_make,
          vehicle_model: formData.vehicle_model,
          vehicle_year: formData.vehicle_year,
          vehicle_vin: formData.vehicle_vin,
          vehicle_capacity: formData.vehicle_capacity,
          vehicle_capacity_unit: 'kg' // Default unit
        };

        console.log('[DEBUG] RegisterAsDriverScreen: Registration payload:', JSON.stringify(registrationData, null, 2));
        console.log('[DEBUG] RegisterAsDriverScreen: API endpoint:', `${API_BASE}/drivers/register/`);

        const response = await fetch(`${API_BASE}/drivers/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData)
        });

        console.log('[DEBUG] RegisterAsDriverScreen: Response status:', response.status);
        console.log('[DEBUG] RegisterAsDriverScreen: Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.clone().json();
            console.log('[DEBUG] RegisterAsDriverScreen: Error response JSON:', errorData);
          } catch (e) {
            errorData = await response.clone().text();
            console.log('[DEBUG] RegisterAsDriverScreen: Error response text:', errorData);
          }
          throw new Error(`Registration failed (${response.status}): ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        console.log('[DEBUG] RegisterAsDriverScreen: Success response:', result);

        Alert.alert(
          'Registration Successful!',
          'Your driver account has been created. You can now login.',
          [
            { text: 'OK', onPress: () => onBack() }
          ]
        );

        resetForm();
      } catch (e) {
        setError('Registration failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🚚 Register as Driver</Text>
          </View>

          {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

          <Text style={styles.sectionTitle}>Account Information</Text>

          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter username"
            value={formData.username}
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter email"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter password"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Confirm password"
            value={formData.confirm_password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirm_password: text }))}
            secureTextEntry
          />

          <Text style={styles.sectionTitle}>Driver Information</Text>

          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter first name"
            value={formData.first_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter last name"
            value={formData.last_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter phone number"
            value={formData.phone_number}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>License Number *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter driver's license number"
            value={formData.license_number}
            onChangeText={(text) => {
              console.log('[DEBUG] RegisterAsDriverScreen: License number changing to:', `"${text}"`);
              setFormData(prev => {
                const newData = { ...prev, license_number: text };
                console.log('[DEBUG] RegisterAsDriverScreen: Updated form data license_number:', `"${newData.license_number}"`);
                return newData;
              });
            }}
          />

          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <Text style={styles.infoText}>As a driver, you must register a vehicle</Text>

          <Text style={styles.label}>Vehicle License Plate *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle license plate"
            value={formData.vehicle_license_plate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_license_plate: text.toUpperCase() }))}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Vehicle Make *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle make (e.g., Ford, Toyota)"
            value={formData.vehicle_make}
            onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_make: text }))}
          />

          <Text style={styles.label}>Vehicle Model *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle model (e.g., Transit, Hiace)"
            value={formData.vehicle_model}
            onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_model: text }))}
          />

          <Text style={styles.label}>Vehicle Year *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle year"
            value={formData.vehicle_year === 2000 ? '' : formData.vehicle_year.toString()}
            onChangeText={(text) => {
              // Allow empty input while typing
              if (text === '') {
                setFormData(prev => ({ ...prev, vehicle_year: 2000 }));
                return;
              }

              // Only allow numeric characters
              const numericText = text.replace(/[^0-9]/g, '');
              if (numericText.length <= 4) {
                const year = parseInt(numericText);
                if (!isNaN(year) && year >= 2000 && year <= 2100) {
                  setFormData(prev => ({ ...prev, vehicle_year: year }));
                } else if (numericText.length < 4) {
                  // Allow partial input while typing (e.g., "20" for "2023")
                  setFormData(prev => ({ ...prev, vehicle_year: parseInt(numericText) || 2000 }));
                }
              }
            }}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={styles.label}>Vehicle VIN *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle VIN (17 characters)"
            value={formData.vehicle_vin}
            onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_vin: text.toUpperCase() }))}
            autoCapitalize="characters"
            maxLength={17}
          />

          <Text style={styles.label}>Vehicle Capacity (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle capacity in kg"
            value={formData.vehicle_capacity.toString()}
            onChangeText={(text) => {
              const capacity = parseInt(text) || 1000;
              if (capacity >= 1 && capacity <= 50000) {
                setFormData(prev => ({ ...prev, vehicle_capacity: capacity }));
              }
            }}
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            {localLoading ? (
              <ActivityIndicator size="large" color="#0066CC" />
            ) : (
              <>
                <Button title="Register as Driver" onPress={handleRegister} />
                <Button title="Cancel" onPress={onBack} />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  // All constants, useState, useEffect, and helper functions at the top
  // API base from env (LAN only – set by start-fullstack.bat or .env)
  const [API_BASE, setApiBase] = useState<string>('');  // Start empty, resolve async
  const [currentNetwork, setCurrentNetwork] = useState('LAN');
  const [NETWORK_ENDPOINTS, setNetworkEndpoints] = useState([{ url: '', name: 'Unified API URL' }]);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<'admin' | 'customer' | 'driver' | null>(null); // 'admin', 'customer', 'driver'
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

  const [driverForm, setDriverForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    license_number: '',
    vehicle_license_plate: '',
    vehicle_make: '',
    vehicle_model: '',
    year: new Date().getFullYear(),
    vehicle_vin: '',
    vehicle_capacity: 1000
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
    const headers: any = {
      'Content-Type': 'application/json',
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
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
    }

    return response;
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
      const response = await fetch(`${API_BASE}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      console.log(`Login response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.access);

        // Determine user type by checking available endpoints
        await determineUserType(data.access);

        setCurrentScreen('dashboard');
        setLoginForm({ username: '', password: '' });
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        const errorData = await response.json();
        console.log('Login error data:', errorData);
        Alert.alert('Login Failed', errorData.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login network error:', error);
      Alert.alert(
        'Network Error',
        `Cannot connect to server at ${API_BASE}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTry:\n1. Check Backend Status\n2. Make sure backend is running\n3. Check network connection`
      );
    }
    setLoading(false);
  };

  // CIO MARCH 2026: Role determination - customer -> driver -> admin heuristic (no backend changes)
  const getUserIdFromToken = (t: string): number | null => {
    try {
      const parts = t.split('.');
      if (parts.length < 2) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      let decoded: string | null = null;
      try {
        decoded = typeof atob === 'function' ? atob(b64) : (globalThis as any)?.atob?.(b64) ?? null;
      } catch { /* atob may be absent in some RN envs */ }
      if (!decoded) return null;
      const payload = JSON.parse(decoded);
      return payload.user_id ?? null;
    } catch {
      return null;
    }
  };

  const determineUserType = async (token: string) => {
    // 1. Try customer profile first
    try {
      const customerResponse = await fetch(`${API_BASE}/customers/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (customerResponse.ok) {
        setUserType('customer');
        return;
      }
    } catch (error) {
      console.log('Not a customer user');
    }

    // 2. Try driver profile via /drivers/ list + JWT user_id
    try {
      const userId = getUserIdFromToken(token);
      if (userId != null) {
        const driversResponse = await fetch(`${API_BASE}/drivers/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (driversResponse.ok) {
          const data = await driversResponse.json();
          const drivers = data.results ?? data;
          const isDriver = Array.isArray(drivers) && drivers.some((d: any) => d.user === userId || d.user_id === userId);
          if (isDriver) {
            setUserType('driver');
            return;
          }
        }
      }
    } catch (error) {
      console.log('Not a driver user');
    }

    // 3. Default to admin (staff/superuser)
    setUserType('admin');
  };

  // Registration Functions
  const registerCustomer = async () => {
    if (!customerForm.username || !customerForm.email || !customerForm.password) {
      Alert.alert('Error', 'Please fill in all required fields (*, username, email, password)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/customers/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
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

  const registerDriver = async () => {
    // Validate required fields
    if (!driverForm.username || !driverForm.email || !driverForm.password ||
      !driverForm.first_name || !driverForm.last_name || !driverForm.phone_number || !driverForm.license_number ||
      !driverForm.vehicle_license_plate || !driverForm.vehicle_make || !driverForm.vehicle_model ||
      !driverForm.year || !driverForm.vehicle_vin) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Must match DriverRegistrationSerializer (vehicle_year, not year)
      const registrationData = {
        username: driverForm.username,
        email: driverForm.email,
        password: driverForm.password,
        first_name: driverForm.first_name,
        last_name: driverForm.last_name,
        phone_number: driverForm.phone_number,
        license_number: driverForm.license_number,
        vehicle_license_plate: driverForm.vehicle_license_plate,
        vehicle_make: driverForm.vehicle_make,
        vehicle_model: driverForm.vehicle_model,
        vehicle_year: driverForm.year ? Number(driverForm.year) : new Date().getFullYear(),
        vehicle_vin: driverForm.vehicle_vin,
        vehicle_capacity: driverForm.vehicle_capacity,
        vehicle_capacity_unit: 'kg',
      };

      const response = await fetch(`${API_BASE}/drivers/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        Alert.alert('Success', 'Driver registered successfully! You can now login.');
        setDriverForm({
          username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '',
          license_number: '', vehicle_license_plate: '', vehicle_make: '', vehicle_model: '',
          year: new Date().getFullYear(), vehicle_vin: '', vehicle_capacity: 1000
        });
        setCurrentScreen('login');
      } else {
        const errorData = await response.json();
        Alert.alert('Registration Failed', JSON.stringify(errorData));
      }
    } catch (error) {
      Alert.alert('Error', 'Network error during driver registration');
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
          loadDriverVehicles()
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
      const response = await makeAuthenticatedRequest('/deliveries/');
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.results || data);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const loadMyDeliveries = async () => {
    try {
      const response = await makeAuthenticatedRequest('/customers/my_deliveries/');
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.results || data);
      }
    } catch (error) {
      console.error('Error loading my deliveries:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await makeAuthenticatedRequest('/customers/');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.results || data);
      }
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
      const response = await makeAuthenticatedRequest('/assignments/');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.results || data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadDriverVehicles = async () => {
    try {
      const response = await makeAuthenticatedRequest('/driver-vehicles/');
      if (response.ok) {
        const data = await response.json();
        setDriverVehicles(data.results || data);
      }
    } catch (error) {
      console.error('Error loading driver vehicles:', error);
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
      const payload = {
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
        preferred_pickup_address: customerData.preferred_pickup_address || ''
      };

      const response = await makeAuthenticatedRequest('/customers/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
        setAuthToken(null);
        setCurrentScreen('login');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to create customer';
        let backendDetails = '';
        try {
          const errorData = await response.json();
          // JWT error handling
          if (errorData.code === 'token_not_valid' || errorData.detail?.includes('token')) {
            Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
            setAuthToken(null);
            setCurrentScreen('login');
            setLoading(false);
            return;
          }
          errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData);
          backendDetails = JSON.stringify(errorData, null, 2);
        } catch (e) {
          // Try to get text response for 500 errors
          try {
            const text = await response.text();
            backendDetails = text;
            errorMessage = `HTTP ${response.status}: ${response.statusText}\n${text}`;
          } catch (e2) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        // Show backend details in Alert if 500 error
        if (response.status === 500) {
          Alert.alert('Server Error', `HTTP 500: Internal Server Error\n${backendDetails}`);
        }
        throw new Error(errorMessage);
      }

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

      const response = await makeAuthenticatedRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      console.log('[DEBUG] updateCustomer response status:', response.status);
      console.log('[DEBUG] updateCustomer response headers:', Object.fromEntries(response.headers.entries()));

      let responseBody;
      try {
        responseBody = await response.clone().json();
        console.log('[DEBUG] updateCustomer response JSON:', responseBody);
      } catch (e) {
        responseBody = await response.clone().text();
        console.log('[DEBUG] updateCustomer response text:', responseBody);
      }

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          body: responseBody
        };
        console.error('[DEBUG] updateCustomer failed:', errorDetails);

        let errorMessage = 'Failed to update customer';
        if (responseBody) {
          if (typeof responseBody === 'object') {
            errorMessage += ': ' + (responseBody.message || responseBody.detail || JSON.stringify(responseBody));
          } else {
            errorMessage += ': ' + responseBody;
          }
        }
        errorMessage += ` (HTTP ${response.status})`;

        throw new Error(errorMessage);
      }

      console.log('[DEBUG] updateCustomer success');
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
      const response = await makeAuthenticatedRequest(`/customers/${customerId}/`, {
        method: 'DELETE'
      });

      // DELETE returns 204 No Content on success
      if (!response.ok) {
        let errorMessage = 'Failed to delete customer';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response has no JSON, use default message
        }
        throw new Error(errorMessage);
      }

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
      const response = await makeAuthenticatedRequest(`/customers/${customerId}/my_deliveries/`);
      if (response.ok) {
        const data = await response.json();
        return data.results || data;
      }
      return [];
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
      const response = await makeAuthenticatedRequest('/deliveries/request_delivery/', {
        method: 'POST',
        body: JSON.stringify(deliveryForm)
      });

      if (response.ok) {
        Alert.alert('Success', 'Delivery requested successfully!');
        setDeliveryForm({
          pickup_location: '', dropoff_location: '', item_description: '',
          same_pickup_as_customer: false, use_preferred_pickup: false
        });
        setCurrentScreen('dashboard');
        await loadData(); // Refresh data
      } else {
        const errorData = await response.json();
        Alert.alert('Error', JSON.stringify(errorData));
      }
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
      const response = await makeAuthenticatedRequest('/deliveries/', {
        method: 'POST',
        body: JSON.stringify(deliveryData)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create delivery';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

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
      const response = await makeAuthenticatedRequest(`/deliveries/${deliveryId}/`, {
        method: 'PATCH',
        body: JSON.stringify(deliveryData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update delivery');
      }

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
      const response = await makeAuthenticatedRequest(`/deliveries/${deliveryId}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete delivery';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response has no JSON, use default message
        }
        throw new Error(errorMessage);
      }

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
        body: JSON.stringify({
          first_name: driverData.first_name,
          last_name: driverData.last_name,
          phone_number: driverData.phone_number,
          license_number: driverData.license_number,
          active: driverData.active !== undefined ? driverData.active : true
        })
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

      // Reset form
      setDriverForm({
        username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '',
        license_number: '', vehicle_license_plate: '', vehicle_make: '', vehicle_model: '',
        year: new Date().getFullYear(), vehicle_vin: '', vehicle_capacity: 1000
      });

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
      const response = await makeAuthenticatedRequest('/api/drivers/creation_data/');
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
      const response = await makeAuthenticatedRequest('/api/driver-vehicles/', {
        method: 'POST',
        body: JSON.stringify({
          driver: parseInt(assignmentData.driver_id),
          vehicle: parseInt(assignmentData.vehicle_id),
          assigned_from: assignmentData.assigned_from,
          assigned_to: assignmentData.assigned_to || null
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create driver-vehicle assignment: ${errorData}`);
      }

      return await response.json();
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
      const response = await makeAuthenticatedRequest(`/api/driver-vehicles/${assignmentId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          driver: parseInt(assignmentData.driver_id),
          vehicle: parseInt(assignmentData.vehicle_id),
          assigned_from: assignmentData.assigned_from,
          assigned_to: assignmentData.assigned_to || null
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update driver-vehicle assignment: ${errorData}`);
      }

      return await response.json();
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
      const response = await makeAuthenticatedRequest(`/api/driver-vehicles/${assignmentId}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to delete driver-vehicle assignment: ${errorData}`);
      }

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
      const response = await makeAuthenticatedRequest('/api/vehicles/', {
        method: 'POST',
        body: JSON.stringify({
          license_plate: vehicleData.license_plate,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          vin: vehicleData.vin,
          capacity: vehicleData.capacity,
          active: true
        })
      });

      if (response) {
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
      }

    } catch (error) {
      console.error('Error creating vehicle:', error);
      Alert.alert('Error', (error as any).message || 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async (vehicleId: any, vehicleData: any) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/api/vehicles/${vehicleId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          license_plate: vehicleData.license_plate,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          vin: vehicleData.vin,
          capacity: vehicleData.capacity,
          active: vehicleData.active !== undefined ? vehicleData.active : true
        })
      });

      if (response) {
        Alert.alert('Success', 'Vehicle updated successfully!');
        setVehicleCrudMode('list');
        await loadVehicles();
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating vehicle:', error.message, error.stack);
      } else {
        console.error('Error updating vehicle:', error);
      }
      Alert.alert('Error', (error as any).message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (vehicleId: number) => {
    setLoading(true);
    try {
      await makeAuthenticatedRequest(`/api/vehicles/${vehicleId}/`, {
        method: 'DELETE'
      });

      Alert.alert('Success', 'Vehicle deleted successfully!');
      setVehicleCrudMode('list');
      await loadVehicles();

    } catch (error) {
      console.error('Error deleting vehicle:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message || 'Failed to delete vehicle');
      } else {
        Alert.alert('Error', 'Failed to delete vehicle');
      }
    } finally {
      setLoading(false);
    }
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
    checkBackend();
  }, []);

  useEffect(() => {
    if (authToken && currentScreen === 'dashboard') {
      loadData();
    }
    // Load customers when entering admin_customers screen
    if (authToken && currentScreen === 'admin_customers') {
      loadCustomers();
    }
  }, [authToken, currentScreen, userType]);

  // CIO MARCH 2026: Guard admin-only screens - redirect non-admins to dashboard
  useEffect(() => {
    const adminScreens = ['admin_customers', 'admin_vehicles', 'admin_deliveries', 'admin_drivers', 'admin_driver_vehicles'];
    if (adminScreens.includes(currentScreen) && userType !== 'admin' && userType !== null) {
      setCurrentScreen('dashboard');
    }
  }, [currentScreen, userType]);

  // ========================================
  // RENDER FUNCTIONS

  // Admin Customers Screen
  if (currentScreen === 'admin_customers' && userType === 'admin') {
    return <AdminCustomersScreen onBack={() => setCurrentScreen('dashboard')} customers={customers} loadCustomers={loadCustomers} />;
  }

  // Admin Vehicles Screen
  if (currentScreen === 'admin_vehicles' && userType === 'admin') {
    return <AdminVehiclesScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  // Admin Deliveries Screen
  if (currentScreen === 'admin_deliveries' && userType === 'admin') {
    return <AdminDeliveriesScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  // Admin Drivers Screen
  if (currentScreen === 'admin_drivers' && userType === 'admin') {
    return <AdminDriversScreen onBack={() => setCurrentScreen('dashboard')} drivers={drivers} loadDrivers={loadDrivers} />;
  }

  // Admin Driver-Vehicles Screen
  if (currentScreen === 'admin_driver_vehicles' && userType === 'admin') {
    return <AdminDriverVehiclesScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  // Delivery Request Screen (customer + driver)
  if (currentScreen === 'delivery_request') {
    return <DeliveryRequestScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  // My Deliveries Screen
  if (currentScreen === 'my_deliveries') {
    return <MyDeliveriesScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  // Register as Driver Screen
  if (currentScreen === 'register_driver') {
    return <RegisterAsDriverScreen onBack={() => setCurrentScreen('main')} />;
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
              placeholderTextColor={theme.placeholder} placeholder="First Name"
            />

            <TextInput
              style={styles.input}
              value={customerForm.last_name}
              onChangeText={(text) => setCustomerForm({ ...customerForm, last_name: text })}
              placeholderTextColor={theme.placeholder} placeholder="Last Name"
            />

            <TextInput
              style={styles.input}
              value={customerForm.phone_number}
              onChangeText={(text) => setCustomerForm({ ...customerForm, phone_number: text })}
              placeholderTextColor={theme.placeholder} placeholder="Phone Number"
              keyboardType="phone-pad"
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

  // Driver Registration Screen - KEYBOARD FIXED!
  if (currentScreen === 'driver_register') {
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
            <Text style={styles.title}>🚚 Driver Registration</Text>

            <TextInput
              style={styles.input}
              value={driverForm.username}
              onChangeText={(text) => setDriverForm({ ...driverForm, username: text })}
              placeholderTextColor={theme.placeholder} placeholder="Username *"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              value={driverForm.email}
              onChangeText={(text) => setDriverForm({ ...driverForm, email: text })}
              placeholderTextColor={theme.placeholder} placeholder="Email *"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              value={driverForm.password}
              onChangeText={(text) => setDriverForm({ ...driverForm, password: text })}
              placeholderTextColor={theme.placeholder} placeholder="Password *"
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              value={driverForm.first_name}
              onChangeText={(text) => setDriverForm({ ...driverForm, first_name: text })}
              placeholderTextColor={theme.placeholder} placeholder="First Name *"
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              value={driverForm.last_name}
              onChangeText={(text) => setDriverForm({ ...driverForm, last_name: text })}
              placeholderTextColor={theme.placeholder} placeholder="Last Name *"
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              value={driverForm.phone_number}
              onChangeText={(text) => setDriverForm({ ...driverForm, phone_number: text })}
              placeholderTextColor={theme.placeholder} placeholder="Phone Number *"
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              value={driverForm.license_number}
              onChangeText={(text) => setDriverForm({ ...driverForm, license_number: text })}
              placeholderTextColor={theme.placeholder} placeholder="Driver License Number *"
            />

            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <TextInput
              style={styles.input}
              value={driverForm.vehicle_license_plate}
              onChangeText={(text) => setDriverForm({ ...driverForm, vehicle_license_plate: text.toUpperCase() })}
              placeholderTextColor={theme.placeholder} placeholder="Vehicle License Plate *"
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              value={driverForm.vehicle_make}
              onChangeText={(text) => setDriverForm({ ...driverForm, vehicle_make: text })}
              placeholderTextColor={theme.placeholder} placeholder="Vehicle Make (e.g., Ford, Toyota) *"
            />

            <TextInput
              style={styles.input}
              value={driverForm.vehicle_model}
              onChangeText={(text) => setDriverForm({ ...driverForm, vehicle_model: text })}
              placeholderTextColor={theme.placeholder} placeholder="Vehicle Model (e.g., Transit, Hiace) *"
            />

            <TextInput
              style={styles.input}
              value={driverForm.year ? driverForm.year.toString() : ''}
              onChangeText={(text) => {
                if (text === '') {
                  setDriverForm({ ...driverForm, year: new Date().getFullYear() });
                } else {
                  const year = parseInt(text);
                  if (!isNaN(year) && year >= 1900 && year <= 2100) {
                    setDriverForm({ ...driverForm, year });
                  }
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Vehicle Year (e.g., 2024) *"
              keyboardType="numeric"
              maxLength={4}
            />

            <TextInput
              style={styles.input}
              value={driverForm.vehicle_vin}
              onChangeText={(text) => setDriverForm({ ...driverForm, vehicle_vin: text.toUpperCase() })}
              placeholderTextColor={theme.placeholder} placeholder="VIN (17 characters) *"
              autoCapitalize="characters"
              maxLength={17}
            />

            <TextInput
              style={styles.input}
              value={driverForm.vehicle_capacity.toString()}
              onChangeText={(text) => {
                const capacity = parseInt(text) || 1000;
                if (capacity >= 1 && capacity <= 50000) {
                  setDriverForm({ ...driverForm, vehicle_capacity: capacity });
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Vehicle Capacity (kg) *"
              keyboardType="numeric"
            />

            <View style={styles.buttonContainer}>
              <Button title="Register Driver & Vehicle" onPress={registerDriver} disabled={loading} />
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
                <Button title="📋 Request Delivery" onPress={() => setCurrentScreen('delivery_request')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="📋 My Deliveries" onPress={() => setCurrentScreen('my_deliveries')} />
              </View>
            </View>
          )}

          {/* Driver Dashboard - CIO MARCH 2026 */}
          {userType === 'driver' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚚 Driver Services</Text>
              <View style={styles.buttonContainer}>
                <Button title="📦 My Deliveries" onPress={() => setCurrentScreen('my_deliveries')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="🔄" onPress={loadData} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="🚪 Logout" onPress={() => {
                  setAuthToken(null);
                  setUserType(null);
                  setCurrentScreen('main');
                }} />
              </View>
            </View>
          )}

          {/* Admin Dashboard */}
          {/* Admin Dashboard (ScrollView only for dashboard, not CRUD screens) */}
          {userType === 'admin' && !adminScreen && (
            <ScrollView style={styles.container}>
              <View style={styles.content}>
                <Text style={styles.sectionTitle}>🛠️ Admin Management</Text>
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
                  <Button title="🚪 Logout" onPress={() => {
                    setAuthToken(null);
                    setUserType(null);
                    setCurrentScreen('main');
                  }} />
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

// Black/grey dark theme: black background, dark grey textboxes, off-white borders
const theme = {
  background: '#000000',
  surface: '#1a1a1a',
  inputBg: '#2a2a2a',
  border: '#e8e8e8',
  text: '#f0f0f0',
  textMuted: '#b0b0b0',
  error: '#ff6b6b',
  placeholder: '#888888',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 20,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.textMuted,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
    color: theme.textMuted,
  },
  itemContainer: {
    padding: 15,
    backgroundColor: theme.surface,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: theme.text,
  },
  statusContainer: {
    padding: 15,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: theme.text,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
  },
  networkLabel: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.textMuted,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.inputBg,
    color: theme.text,
    marginBottom: 10,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.error,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#3a2020',
    color: theme.text,
    marginBottom: 10,
  },
  fieldError: {
    color: theme.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 4,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  detailCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  detailCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  deliveryItem: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: theme.border,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: theme.text,
  },
  deliveryDetail: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  keyboardPadding: {
    height: 200,
  },
  healthBanner: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  healthChecking: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
  },
  healthSuccess: {
    backgroundColor: '#1a2e1a',
    borderColor: '#4ade80',
    borderWidth: 1,
  },
  healthError: {
    backgroundColor: '#2e1a1a',
    borderColor: theme.error,
    borderWidth: 2,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  healthText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  healthErrorText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  healthErrorSubtext: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  debugInfo: {
    backgroundColor: theme.surface,
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  debugText: {
    fontSize: 10,
    color: theme.textMuted,
    fontFamily: 'monospace',
  },
});
