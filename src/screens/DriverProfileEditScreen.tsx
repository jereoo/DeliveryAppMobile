import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { theme, styles } from '../theme';
import { formatPhone10, getPhoneDigits } from '../utils/phoneFormatting';
import type { AuthenticatedRequest } from './types';

export interface DriverProfileEditScreenProps {
  onBack: () => void;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

  export function DriverProfileEditScreen({ onBack, makeAuthenticatedRequest }: DriverProfileEditScreenProps) {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      phone_number: '',
      license_number: '',
    });
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
      setSaving(true);
      setError(null);
      try {
        const response = await makeAuthenticatedRequest('/drivers/me/', {
          method: 'PATCH',
          body: JSON.stringify({
            ...formData,
            phone_number: phoneDigits,
          }),
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
