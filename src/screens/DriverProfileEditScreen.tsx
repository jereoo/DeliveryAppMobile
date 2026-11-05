import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { AddressFields, emptyAddressFields } from '../components/AddressFields';
import { DriverLicenseFields } from '../components/DriverLicenseFields';
import { theme, styles } from '../theme';
import { formatPhone10, formatPhoneForDisplay, getPhoneDigits } from '../utils/phoneFormatting';
import type { AuthenticatedRequest } from './types';

export interface DriverProfileEditScreenProps {
  onBack: () => void;
  API_BASE: string;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

const emptyForm = {
  first_name: '',
  last_name: '',
  phone_number: '',
  license_issuing_region: 'CA-BC',
  license_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  password: '',
  ...emptyAddressFields(),
};

export function DriverProfileEditScreen({ onBack, API_BASE, makeAuthenticatedRequest }: DriverProfileEditScreenProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLocalLoading(true);
      setError(null);
      try {
        const response = await makeAuthenticatedRequest('/drivers/me/');
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || body.detail || 'Failed to load profile');
        }
        const data = await response.json();
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: formatPhoneForDisplay(data.phone_number || ''),
          license_issuing_region: data.license_issuing_region || 'CA-BC',
          license_number: data.license_number || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: formatPhoneForDisplay(data.emergency_contact_phone || ''),
          password: '',
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
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.license_number.trim()) {
      setError('First name, last name, and license number are required');
      return;
    }
    const phoneDigits = getPhoneDigits(formData.phone_number);
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    const emergencyDigits = getPhoneDigits(formData.emergency_contact_phone);
    if (emergencyDigits && emergencyDigits.length !== 10) {
      setError('Emergency contact phone must be exactly 10 digits');
      return;
    }
    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: phoneDigits,
        license_issuing_region: formData.license_issuing_region,
        license_number: formData.license_number,
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: emergencyDigits,
        address_unit: formData.address_unit,
        address_street: formData.address_street,
        address_city: formData.address_city,
        address_state: formData.address_state,
        address_postal_code: formData.address_postal_code,
        address_country: formData.address_country,
      };
      if (formData.password.trim()) {
        payload.password = formData.password;
      }
      const response = await makeAuthenticatedRequest('/drivers/me/', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = body.error || body.detail
          || (typeof body === 'object' && Object.keys(body).length
            ? Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join('\n')
            : 'Failed to update profile');
        throw new Error(msg);
      }
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
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(t) => setFormData({ ...formData, first_name: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Enter first name"
              />
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(t) => setFormData({ ...formData, last_name: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Enter last name"
              />
              <Text style={styles.label}>Phone Number (10 digits, no area code)</Text>
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(t) => setFormData({ ...formData, phone_number: formatPhone10(t) })}
                placeholderTextColor={theme.placeholder}
                placeholder="(555) 555-5555"
                keyboardType="phone-pad"
                maxLength={14}
              />
              <Text style={styles.sectionTitle}>Emergency contact (optional)</Text>
              <Text style={styles.label}>Contact name</Text>
              <TextInput
                style={styles.input}
                value={formData.emergency_contact_name}
                onChangeText={(t) => setFormData({ ...formData, emergency_contact_name: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Name"
              />
              <Text style={styles.label}>Contact phone (10 digits)</Text>
              <TextInput
                style={styles.input}
                value={formData.emergency_contact_phone}
                onChangeText={(t) => setFormData({ ...formData, emergency_contact_phone: formatPhone10(t) })}
                placeholderTextColor={theme.placeholder}
                placeholder="(555) 555-5555"
                keyboardType="phone-pad"
                maxLength={14}
              />

              <Text style={styles.label}>License</Text>
              <DriverLicenseFields
                licenseIssuingRegion={formData.license_issuing_region}
                licenseNumber={formData.license_number}
                onRegionChange={(code) => setFormData({ ...formData, license_issuing_region: code })}
                onLicenseNumberChange={(text) => setFormData({ ...formData, license_number: text })}
                theme={theme}
                styles={styles}
              />

              <Text style={styles.sectionTitle}>Password</Text>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Leave blank to keep current password"
                secureTextEntry
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

              <View style={styles.buttonContainer}>
                <Button title={saving ? 'Saving...' : 'Save Profile'} onPress={handleSave} disabled={saving} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
