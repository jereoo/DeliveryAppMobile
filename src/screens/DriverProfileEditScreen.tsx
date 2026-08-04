import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { theme, styles } from '../theme';
import { formatPhone10, formatPhoneForDisplay, getPhoneDigits } from '../utils/phoneFormatting';
import type { AuthenticatedRequest } from './types';

export interface DriverProfileEditScreenProps {
  onBack: () => void;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

const emptyForm = {
  first_name: '',
  last_name: '',
  phone_number: '',
  license_number: '',
  password: '',
  address_unit: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_postal_code: '',
  address_country: 'US',
};

export function DriverProfileEditScreen({ onBack, makeAuthenticatedRequest }: DriverProfileEditScreenProps) {
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
          license_number: data.license_number || '',
          password: '',
          address_unit: data.address_unit || '',
          address_street: data.address_street || '',
          address_city: data.address_city || '',
          address_state: data.address_state || '',
          address_postal_code: data.address_postal_code || '',
          address_country: data.address_country || 'US',
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
        license_number: formData.license_number,
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
              <Text style={styles.label}>License Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.license_number}
                onChangeText={(t) => setFormData({ ...formData, license_number: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Enter license number"
                autoCapitalize="characters"
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

              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.label}>Unit/Apartment</Text>
              <TextInput
                style={styles.input}
                value={formData.address_unit}
                onChangeText={(t) => setFormData({ ...formData, address_unit: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Unit/Apartment"
              />
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={formData.address_street}
                onChangeText={(t) => setFormData({ ...formData, address_street: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Street Address"
              />
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.address_city}
                onChangeText={(t) => setFormData({ ...formData, address_city: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="City"
              />
              <Text style={styles.label}>State/Province</Text>
              <TextInput
                style={styles.input}
                value={formData.address_state}
                onChangeText={(t) => setFormData({ ...formData, address_state: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="State/Province"
              />
              <Text style={styles.label}>Postal/ZIP Code</Text>
              <TextInput
                style={styles.input}
                value={formData.address_postal_code}
                onChangeText={(t) => setFormData({ ...formData, address_postal_code: t })}
                placeholderTextColor={theme.placeholder}
                placeholder="Postal/ZIP Code"
              />
              <Text style={styles.label}>Country *</Text>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <Button
                    title={formData.address_country === 'CA' ? '🇨🇦 Canada' : 'Canada (CA)'}
                    onPress={() => setFormData({ ...formData, address_country: 'CA' })}
                    color={formData.address_country === 'CA' ? '#007AFF' : '#8E8E93'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Button
                    title={formData.address_country === 'US' ? '🇺🇸 USA' : 'USA (US)'}
                    onPress={() => setFormData({ ...formData, address_country: 'US' })}
                    color={formData.address_country === 'US' ? '#007AFF' : '#8E8E93'}
                  />
                </View>
              </View>

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
