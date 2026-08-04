import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import AddressAutocomplete from './AddressAutocomplete';
import type { AddressValidationResponse } from '../services/addressValidation';
import { theme, styles } from '../theme';

export interface AddressFieldsValue {
  address_unit: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;
  address_country: 'CA' | 'US';
}

export interface AddressFieldsProps {
  value: AddressFieldsValue;
  onChange: (value: AddressFieldsValue) => void;
  sectionTitle?: string;
  apiBase?: string;
  showAutocomplete?: boolean;
}

export const emptyAddressFields = (): AddressFieldsValue => ({
  address_unit: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_postal_code: '',
  address_country: 'US',
});

function mapValidatedAddress(
  result: AddressValidationResponse,
  current: AddressFieldsValue,
): AddressFieldsValue {
  const streetParts = [result.street_number, result.street_name, result.street_type].filter(Boolean);
  const country = result.country === 'CA' || result.country === 'Canada' ? 'CA' : 'US';
  return {
    address_unit: result.unit || current.address_unit,
    address_street: streetParts.length ? streetParts.join(' ') : (result.formatted_address || current.address_street),
    address_city: result.city || current.address_city,
    address_state: result.state_province || current.address_state,
    address_postal_code: result.postal_code || current.address_postal_code,
    address_country: country,
  };
}

export function AddressFields({
  value,
  onChange,
  sectionTitle = 'Address',
  apiBase,
  showAutocomplete = false,
}: AddressFieldsProps) {
  const countryHint = value.address_country === 'CA' ? 'CA' : 'US';

  return (
    <>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      {showAutocomplete && apiBase ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.label}>Search address (optional)</Text>
          <AddressAutocomplete
            placeholder="Start typing an address…"
            countryHint={countryHint}
            onAddressSelected={(result) => onChange(mapValidatedAddress(result, value))}
            onValidationStatusChange={() => {}}
          />
        </View>
      ) : null}
      <Text style={styles.label}>Unit/Apartment</Text>
      <TextInput
        style={styles.input}
        value={value.address_unit}
        onChangeText={(t) => onChange({ ...value, address_unit: t })}
        placeholderTextColor={theme.placeholder}
        placeholder="Unit/Apartment"
      />
      <Text style={styles.label}>Street Address</Text>
      <TextInput
        style={styles.input}
        value={value.address_street}
        onChangeText={(t) => onChange({ ...value, address_street: t })}
        placeholderTextColor={theme.placeholder}
        placeholder="Street Address"
      />
      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={value.address_city}
        onChangeText={(t) => onChange({ ...value, address_city: t })}
        placeholderTextColor={theme.placeholder}
        placeholder="City"
      />
      <Text style={styles.label}>State/Province</Text>
      <TextInput
        style={styles.input}
        value={value.address_state}
        onChangeText={(t) => onChange({ ...value, address_state: t })}
        placeholderTextColor={theme.placeholder}
        placeholder="State/Province"
      />
      <Text style={styles.label}>Postal/ZIP Code</Text>
      <TextInput
        style={styles.input}
        value={value.address_postal_code}
        onChangeText={(t) => onChange({ ...value, address_postal_code: t })}
        placeholderTextColor={theme.placeholder}
        placeholder="Postal/ZIP Code"
      />
      <Text style={styles.label}>Country *</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 5 }}>
          <Button
            title={value.address_country === 'CA' ? '🇨🇦 Canada' : 'Canada (CA)'}
            onPress={() => onChange({ ...value, address_country: 'CA' })}
            color={value.address_country === 'CA' ? '#007AFF' : '#8E8E93'}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 5 }}>
          <Button
            title={value.address_country === 'US' ? '🇺🇸 USA' : 'USA (US)'}
            onPress={() => onChange({ ...value, address_country: 'US' })}
            color={value.address_country === 'US' ? '#007AFF' : '#8E8E93'}
          />
        </View>
      </View>
    </>
  );
}
