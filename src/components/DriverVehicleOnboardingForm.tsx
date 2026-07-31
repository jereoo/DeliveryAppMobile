import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';

import { VehicleCatalogFields } from './VehicleCatalogFields';
import type { VehicleOnboardingFields } from '../services/vehicleService';

type Theme = {
  text: string;
  textMuted: string;
  placeholder: string;
  error?: string;
};

type Styles = {
  label: object;
  input?: object;
  sectionTitle?: object;
  buttonContainer?: object;
};

interface DriverVehicleOnboardingFormProps {
  apiBase: string;
  initialValues?: Partial<VehicleOnboardingFields>;
  lockVinAndPlate?: boolean;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (fields: VehicleOnboardingFields) => void | Promise<void>;
  theme: Theme;
  styles: Styles;
}

const EMPTY_YEAR = 2000;

export function DriverVehicleOnboardingForm({
  apiBase,
  initialValues,
  lockVinAndPlate = false,
  submitLabel,
  submitting = false,
  onSubmit,
  theme,
  styles,
}: DriverVehicleOnboardingFormProps) {
  const [formData, setFormData] = useState({
    vehicle_model_spec_id: initialValues?.vehicle_model_spec_id ?? null as number | null,
    vehicle_license_plate: initialValues?.vehicle_license_plate ?? '',
    vehicle_year: initialValues?.vehicle_year ?? EMPTY_YEAR,
    vehicle_vin: initialValues?.vehicle_vin ?? '',
    vehicle_capacity: initialValues?.vehicle_capacity ?? 0,
    vehicle_capacity_unit: initialValues?.vehicle_capacity_unit ?? 'lb' as 'kg' | 'lb',
  });
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = (): VehicleOnboardingFields | null => {
    setCatalogError(null);
    setError(null);

    if (!formData.vehicle_model_spec_id) {
      setCatalogError('Select a vehicle manufacturer and model from the catalog.');
      setError('Select a vehicle manufacturer and model from the catalog.');
      return null;
    }
    if (!formData.vehicle_license_plate.trim()) {
      setError('License plate is required.');
      return null;
    }
    if (!formData.vehicle_vin.trim() || formData.vehicle_vin.length !== 17) {
      setError('VIN must be exactly 17 characters.');
      return null;
    }
    if (
      !formData.vehicle_year
      || formData.vehicle_year === EMPTY_YEAR
      || formData.vehicle_year < 2000
      || formData.vehicle_year > 2100
    ) {
      setError('Enter a valid vehicle year.');
      return null;
    }
    if (!formData.vehicle_capacity || formData.vehicle_capacity <= 0) {
      setError('Vehicle capacity is set automatically when you select a catalog model.');
      return null;
    }

    return {
      vehicle_model_spec_id: formData.vehicle_model_spec_id,
      vehicle_year: formData.vehicle_year,
      vehicle_license_plate: formData.vehicle_license_plate,
      vehicle_vin: formData.vehicle_vin,
      vehicle_capacity: formData.vehicle_capacity,
      vehicle_capacity_unit: formData.vehicle_capacity_unit,
    };
  };

  const handleSubmit = async () => {
    const payload = validate();
    if (!payload) return;
    await onSubmit(payload);
  };

  return (
    <View>
      {error ? <Text style={{ color: theme.error || '#d9534f', marginBottom: 10 }}>{error}</Text> : null}

      <VehicleCatalogFields
        apiBase={apiBase}
        vehicleModelSpecId={formData.vehicle_model_spec_id}
        vehicleYear={formData.vehicle_year === EMPTY_YEAR ? 0 : formData.vehicle_year}
        onSpecChange={(specId) => {
          setCatalogError(null);
          setFormData((prev) => ({
            ...prev,
            vehicle_model_spec_id: specId,
            vehicle_capacity: 0,
          }));
        }}
        onCatalogCapacityChange={(maxPayloadLb) => {
          setFormData((prev) => ({
            ...prev,
            vehicle_capacity: maxPayloadLb,
            vehicle_capacity_unit: 'lb',
          }));
        }}
        theme={theme}
        styles={styles}
        fieldError={catalogError}
      />

      <Text style={styles.label}>Vehicle Year *</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.placeholder}
        placeholder="Enter vehicle year"
        value={formData.vehicle_year === EMPTY_YEAR ? '' : String(formData.vehicle_year)}
        onChangeText={(text) => {
          if (text === '') {
            setFormData((prev) => ({ ...prev, vehicle_year: EMPTY_YEAR }));
            return;
          }
          const numericText = text.replace(/[^0-9]/g, '');
          if (numericText.length <= 4) {
            const year = parseInt(numericText, 10);
            if (!isNaN(year) && year >= 1999 && year <= 2100) {
              setFormData((prev) => ({ ...prev, vehicle_year: year }));
            } else if (numericText.length < 4) {
              setFormData((prev) => ({ ...prev, vehicle_year: parseInt(numericText, 10) || EMPTY_YEAR }));
            }
          }
        }}
        keyboardType="numeric"
        maxLength={4}
      />

      <Text style={styles.label}>License Plate *</Text>
      <TextInput
        style={[styles.input, lockVinAndPlate ? { color: theme.text } : undefined]}
        placeholderTextColor={theme.placeholder}
        placeholder="Enter license plate"
        value={formData.vehicle_license_plate}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, vehicle_license_plate: text.toUpperCase() }))}
        autoCapitalize="characters"
        editable={!lockVinAndPlate}
      />

      <Text style={styles.label}>VIN *</Text>
      <TextInput
        style={[styles.input, lockVinAndPlate ? { color: theme.text } : undefined]}
        placeholderTextColor={theme.placeholder}
        placeholder="17 characters"
        value={formData.vehicle_vin}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, vehicle_vin: text.toUpperCase().slice(0, 17) }))}
        autoCapitalize="characters"
        maxLength={17}
        editable={!lockVinAndPlate}
      />
      {lockVinAndPlate ? (
        <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
          Plate and VIN are locked after registration is verified. Contact admin if they are wrong.
        </Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <Button title={submitting ? 'Submitting...' : submitLabel} onPress={handleSubmit} disabled={submitting} />
      </View>
    </View>
  );
}
