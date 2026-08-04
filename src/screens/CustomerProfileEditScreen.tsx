import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AddressFields, emptyAddressFields } from '../components/AddressFields';
import AddressAutocomplete from '../components/AddressAutocomplete';
import {
  buildCustomerProfilePayload,
  fetchCustomerMe,
  updateCustomerMe,
} from '../services/customerService';
import { theme, styles } from '../theme';
import { formatPhone10, formatPhoneForDisplay, getPhoneDigits } from '../utils/phoneFormatting';
import type { AuthenticatedRequest } from './types';

export interface CustomerProfileEditScreenProps {
  onBack: () => void;
  API_BASE: string;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

export function CustomerProfileEditScreen({
  onBack,
  API_BASE,
  makeAuthenticatedRequest,
}: CustomerProfileEditScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    company_name: '',
    is_business: false,
    preferred_pickup_address: '',
    ...emptyAddressFields(),
  });
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLocalLoading(true);
      setError(null);
      try {
        const data = await fetchCustomerMe(makeAuthenticatedRequest);
        setFormData({
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: formatPhoneForDisplay(data.phone_number || ''),
          password: '',
          company_name: data.company_name || '',
          is_business: data.is_business || false,
          preferred_pickup_address: data.preferred_pickup_address || '',
          address_unit: data.address_unit || '',
          address_street: data.address_street || '',
          address_city: data.address_city || '',
          address_state: data.address_state || '',
          address_postal_code: data.address_postal_code || '',
          address_country: data.address_country === 'CA' ? 'CA' : 'US',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      }
      setLocalLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }
    const phoneDigits = getPhoneDigits(formData.phone_number);
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildCustomerProfilePayload({
        ...formData,
        phone_number: phoneDigits,
      });
      await updateCustomerMe(makeAuthenticatedRequest, payload);
      Alert.alert('Success', 'Profile updated successfully!');
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    }
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Edit My Profile</Text>
          </View>
          {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
          {localLoading ? (
            <ActivityIndicator size="large" color={theme.border} />
          ) : (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(t) => setFormData({ ...formData, email: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(t) => setFormData({ ...formData, first_name: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="First name"
              />
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(t) => setFormData({ ...formData, last_name: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Last name"
              />
              <Text style={styles.label}>Phone Number (10 digits)</Text>
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(t) => setFormData({ ...formData, phone_number: formatPhone10(t) })}
                placeholderTextColor={theme.placeholder}
                placeholder="(555) 555-5555"
                keyboardType="phone-pad"
                maxLength={14}
              />

              <AddressFields
                value={{
                  address_unit: formData.address_unit,
                  address_street: formData.address_street,
                  address_city: formData.address_city,
                  address_state: formData.address_state,
                  address_postal_code: formData.address_postal_code,
                  address_country: formData.address_country,
                }}
                onChange={(address) => setFormData({ ...formData, ...address })}
                apiBase={API_BASE}
                showAutocomplete
              />

              <Text style={styles.sectionTitle}>Business</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Business customer</Text>
                <Switch
                  value={formData.is_business}
                  onValueChange={(v) => setFormData({ ...formData, is_business: v })}
                />
              </View>
              {formData.is_business ? (
                <TextInput
                  style={styles.input}
                  value={formData.company_name}
                  onChangeText={(t) => setFormData({ ...formData, company_name: t })}
                  placeholderTextColor={theme.placeholder}
                  placeholder="Company name"
                />
              ) : null}

              <Text style={styles.sectionTitle}>Preferred pickup address</Text>
              <AddressAutocomplete
                placeholder="Preferred pickup location (optional)"
                initialValue={formData.preferred_pickup_address}
                countryHint={formData.address_country === 'CA' ? 'CA' : 'US'}
                onAddressSelected={(result) => {
                  setFormData({
                    ...formData,
                    preferred_pickup_address: result.formatted_address || result.normalized_address || '',
                  });
                }}
                onValidationStatusChange={() => {}}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={formData.preferred_pickup_address}
                onChangeText={(t) => setFormData({ ...formData, preferred_pickup_address: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Or enter preferred pickup manually"
              />

              <Text style={styles.sectionTitle}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="New password (leave blank to keep current)"
                secureTextEntry
              />

              <View style={styles.buttonContainer}>
                <Button title={saving ? 'Saving…' : 'Save Profile'} onPress={handleSave} disabled={saving} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
