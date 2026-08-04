import React, { useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { theme, styles } from '../theme';
import type { AuthenticatedRequest } from './types';

export interface DeliveryRequestScreenProps {
  onBack: () => void;
  API_BASE: string;
  authToken: string | null;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

export function DeliveryRequestScreen({
  onBack,
  API_BASE,
  authToken,
  makeAuthenticatedRequest,
}: DeliveryRequestScreenProps) {
  const [form, setForm] = useState({
    pickup_location: '',
    dropoff_location: '',
    item_description: '',
    same_pickup_as_customer: false,
    use_preferred_pickup: false,
    same_dropoff_as_customer: false,
    delivery_date: '',
    delivery_time: '',
    special_instructions: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.dropoff_location && !form.same_dropoff_as_customer) {
      setError('Please provide a dropoff location or use your address');
      return;
    }
    if (!form.same_pickup_as_customer && !form.use_preferred_pickup && !form.pickup_location) {
      setError('Please provide a pickup location or use an address shortcut');
      return;
    }

    setLocalLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        pickup_location: form.pickup_location || undefined,
        dropoff_location: form.dropoff_location || undefined,
        delivery_date: form.delivery_date.trim() || undefined,
        delivery_time: form.delivery_time.trim() || undefined,
        special_instructions: form.special_instructions.trim() || undefined,
      };
      const response = await makeAuthenticatedRequest('/deliveries/request_delivery/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Success', 'Delivery requested successfully!');
        setForm({
          pickup_location: '',
          dropoff_location: '',
          item_description: '',
          same_pickup_as_customer: false,
          use_preferred_pickup: false,
          same_dropoff_as_customer: false,
          delivery_date: '',
          delivery_time: '',
          special_instructions: '',
        });
        onBack();
      } else {
        const errorData = await response.text();
        setError(`Request failed (${response.status}): ${errorData}`);
      }
    } catch (err) {
      setError(`Network error during delivery request: ${err instanceof Error ? err.message : String(err)}`);
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

          <Text style={styles.sectionTitle}>Pickup & Delivery</Text>

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
            <>
              <AddressAutocomplete
                placeholder="Pickup location"
                initialValue={form.pickup_location}
                countryHint="US"
                onAddressSelected={(result) => {
                  setForm({
                    ...form,
                    pickup_location: result.formatted_address || result.normalized_address || '',
                  });
                }}
                onValidationStatusChange={() => {}}
              />
              <TextInput
                style={styles.input}
                value={form.pickup_location}
                onChangeText={(text) => setForm({ ...form, pickup_location: text })}
                placeholderTextColor={theme.placeholder}
                placeholder="Or enter pickup manually"
              />
            </>
          )}

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Use my address as dropoff</Text>
            <Switch
              value={form.same_dropoff_as_customer}
              onValueChange={(value) => setForm({ ...form, same_dropoff_as_customer: value })}
            />
          </View>

          {!form.same_dropoff_as_customer && (
            <>
              <AddressAutocomplete
                placeholder="Dropoff location *"
                initialValue={form.dropoff_location}
                countryHint="US"
                onAddressSelected={(result) => {
                  setForm({
                    ...form,
                    dropoff_location: result.formatted_address || result.normalized_address || '',
                  });
                }}
                onValidationStatusChange={() => {}}
              />
              <TextInput
                style={styles.input}
                value={form.dropoff_location}
                onChangeText={(text) => setForm({ ...form, dropoff_location: text })}
                placeholderTextColor={theme.placeholder}
                placeholder="Or enter dropoff manually *"
              />
            </>
          )}

          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={form.item_description}
            onChangeText={(text) => setForm({ ...form, item_description: text })}
            placeholderTextColor={theme.placeholder}
            placeholder="Item description"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Preferred date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.delivery_date}
            onChangeText={(text) => setForm({ ...form, delivery_date: text })}
            placeholderTextColor={theme.placeholder}
            placeholder="2026-08-15"
          />
          <Text style={styles.label}>Preferred time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={form.delivery_time}
            onChangeText={(text) => setForm({ ...form, delivery_time: text })}
            placeholderTextColor={theme.placeholder}
            placeholder="14:30"
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={form.special_instructions}
            onChangeText={(text) => setForm({ ...form, special_instructions: text })}
            placeholderTextColor={theme.placeholder}
            placeholder="Special instructions (optional)"
            multiline
            numberOfLines={2}
          />

          <View style={styles.buttonContainer}>
            <Button title="Request Delivery" onPress={handleSubmit} disabled={localLoading} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onBack} />
          </View>
          <View style={styles.keyboardPadding} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
