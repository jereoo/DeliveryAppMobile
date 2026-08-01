import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { theme, styles } from '../theme';
import { formatPhone10, formatPhoneForDisplay, getPhoneDigits } from '../utils/phoneFormatting';

export interface AdminCustomersScreenProps {
  onBack: () => void;
  customers: any[];
  loadCustomers: () => Promise<void>;
  createCustomer: (data: any) => Promise<void>;
  updateCustomer: (id: any, data: any) => Promise<void>;
  deleteCustomer: (id: any) => Promise<void>;
}

  export function AdminCustomersScreen({ onBack, customers, loadCustomers, createCustomer, updateCustomer, deleteCustomer }: AdminCustomersScreenProps) {
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
