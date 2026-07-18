import React, { useMemo, useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';

import {
  getLicenseRegionHint,
  listRegionsForCountry,
  type LicenseRegion,
} from '../utils/driverLicenseValidation';

type Theme = {
  text: string;
  textMuted: string;
  inputBg: string;
  border: string;
  placeholder: string;
};

type Styles = {
  label: object;
  input: object;
  sectionTitle?: object;
};

interface DriverLicenseFieldsProps {
  licenseIssuingRegion: string;
  licenseNumber: string;
  onRegionChange: (code: string) => void;
  onLicenseNumberChange: (value: string) => void;
  theme: Theme;
  styles: Styles;
  fieldError?: string | null;
}

export function DriverLicenseFields({
  licenseIssuingRegion,
  licenseNumber,
  onRegionChange,
  onLicenseNumberChange,
  theme,
  styles,
  fieldError,
}: DriverLicenseFieldsProps) {
  const [country, setCountry] = useState<'CA' | 'US'>(licenseIssuingRegion.startsWith('US-') ? 'US' : 'CA');
  const regions = useMemo(() => listRegionsForCountry(country), [country]);
  const selectedRegion = regions.find((region) => region.code === licenseIssuingRegion)
    || LICENSE_REGIONS_FALLBACK(country).find((region) => region.code === licenseIssuingRegion);
  const hint = licenseIssuingRegion ? getLicenseRegionHint(licenseIssuingRegion) : '';

  const handleCountryChange = (nextCountry: 'CA' | 'US') => {
    setCountry(nextCountry);
    const first = listRegionsForCountry(nextCountry)[0];
    if (first) {
      onRegionChange(first.code);
    }
  };

  return (
    <View>
      <Text style={styles.label}>Driver license issuing region *</Text>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <Button
          title={country === 'CA' ? '✓ Canada' : 'Canada'}
          onPress={() => handleCountryChange('CA')}
        />
        <Button
          title={country === 'US' ? '✓ United States' : 'United States'}
          onPress={() => handleCountryChange('US')}
        />
      </View>
      <ScrollView style={{ maxHeight: 140, marginBottom: 8 }} nestedScrollEnabled>
        {regions.map((region) => (
          <Button
            key={region.code}
            title={`${licenseIssuingRegion === region.code ? '✓ ' : ''}${region.name}`}
            onPress={() => onRegionChange(region.code)}
          />
        ))}
      </ScrollView>
      {selectedRegion ? (
        <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
          Format: {selectedRegion.hint}
        </Text>
      ) : null}
      <Text style={styles.label}>Driver license number *</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.placeholder}
        placeholder={hint ? `e.g. ${hint}` : 'Enter driver license number'}
        value={licenseNumber}
        onChangeText={onLicenseNumberChange}
        autoCapitalize="characters"
      />
      {fieldError ? (
        <Text style={{ color: theme.textMuted, marginTop: 4 }}>{fieldError}</Text>
      ) : null}
    </View>
  );
}

function LICENSE_REGIONS_FALLBACK(country: 'CA' | 'US'): LicenseRegion[] {
  return listRegionsForCountry(country);
}
