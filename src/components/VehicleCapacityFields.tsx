import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { theme, styles } from '../theme';
import {
  MAX_VEHICLE_CAPACITY_KG,
  MAX_VEHICLE_CAPACITY_LB,
  clampCapacityText,
  maxVehicleCapacity,
} from '../utils/vehicleCapacity';

export function VehicleCapacityFields({
  capacityUnit,
  capacityText,
  capacityFieldError,
  onCapacityTextChange,
  onSwitchUnit,
  disabled,
}: {
  capacityUnit: string;
  capacityText: string;
  capacityFieldError: string | null;
  onCapacityTextChange: (text: string) => void;
  onSwitchUnit: (unit: 'kg' | 'lb') => void;
  disabled?: boolean;
}) {
  return (
    <>
      <Text style={styles.label}>Capacity ({capacityUnit}) *</Text>
      <TextInput
        style={[
          styles.input,
          capacityFieldError ? { borderColor: theme.error, borderWidth: 1 } : null,
        ]}
        value={capacityText}
        onChangeText={onCapacityTextChange}
        onBlur={() => {
          const clamped = clampCapacityText(capacityText, capacityUnit);
          if (clamped !== capacityText) {
            onCapacityTextChange(clamped);
          }
        }}
        placeholderTextColor={theme.placeholder}
        placeholder={`1–${maxVehicleCapacity(capacityUnit)} ${capacityUnit}`}
        keyboardType="numeric"
        editable={!disabled}
      />
      {capacityFieldError ? (
        <Text style={{ color: theme.error, marginBottom: 8 }}>{capacityFieldError}</Text>
      ) : (
        <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 8 }}>
          {`Max ${MAX_VEHICLE_CAPACITY_KG} kg or ${MAX_VEHICLE_CAPACITY_LB} lb. Switching units converts the value.`}
        </Text>
      )}
      <Text style={styles.label}>Capacity unit</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 5 }}>
          <Button
            title={capacityUnit === 'kg' ? 'kg (selected)' : 'kg'}
            onPress={() => onSwitchUnit('kg')}
            color={capacityUnit === 'kg' ? '#007AFF' : '#8E8E93'}
            disabled={disabled}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 5 }}>
          <Button
            title={capacityUnit === 'lb' ? 'lb (selected)' : 'lb'}
            onPress={() => onSwitchUnit('lb')}
            color={capacityUnit === 'lb' ? '#007AFF' : '#8E8E93'}
            disabled={disabled}
          />
        </View>
      </View>
    </>
  );
}
