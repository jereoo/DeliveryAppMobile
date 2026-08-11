import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { Platform, Text, View } from 'react-native';

export interface AdminFilterPickerOption {
  label: string;
  value: string;
}

export interface AdminFilterPickerConfig {
  id: string;
  label: string;
  options: AdminFilterPickerOption[];
}

type Theme = {
  text: string;
  inputBg: string;
};

type Styles = {
  label: object;
  input: object;
};

export interface AdminListFilterBarProps<T extends Record<string, string>> {
  pickers: AdminFilterPickerConfig[];
  filters: T;
  onChange: (filters: T) => void;
  theme: Theme;
  styles: Styles;
}

export function AdminListFilterBar<T extends Record<string, string>>({
  pickers,
  filters,
  onChange,
  theme,
  styles,
}: AdminListFilterBarProps<T>) {
  const pickerStyle = {
    color: theme.text,
    backgroundColor: theme.inputBg,
    ...(Platform.OS === 'web' ? { width: '100%' } : {}),
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {pickers.map((picker) => (
        <View key={picker.id}>
          <Text style={styles.label}>{picker.label}</Text>
          <View style={[styles.input, { padding: 0, overflow: 'hidden' }]}>
            <Picker
              selectedValue={filters[picker.id] ?? picker.options[0]?.value ?? ''}
              onValueChange={(value) => onChange({ ...filters, [picker.id]: String(value) })}
              style={pickerStyle}
              dropdownIconColor={theme.text}
            >
              {picker.options.map((option) => (
                <Picker.Item key={`${picker.id}-${option.value}`} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>
      ))}
    </View>
  );
}
