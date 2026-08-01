import React, { useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { theme, styles } from '../theme';
import type { AuthenticatedRequest } from './types';

export interface DeliveryRequestScreenProps {
  onBack: () => void;
  API_BASE: string;
  authToken: string | null;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

  export function DeliveryRequestScreen({ onBack, API_BASE, authToken, makeAuthenticatedRequest }: DeliveryRequestScreenProps) {
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

        const response = await makeAuthenticatedRequest('/deliveries/request_delivery/', {
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
