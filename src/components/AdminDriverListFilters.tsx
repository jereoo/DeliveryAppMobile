import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { Platform, Text, View } from 'react-native';

import {
  AdminDriverListFilters as AdminDriverListFiltersState,
  DRIVER_APPROVAL_LABELS,
  DriverApprovalStatus,
  getUniqueDriverLastNames,
} from '../services/driverService';

type Theme = {
  text: string;
  textMuted: string;
  inputBg: string;
  border: string;
};

type Styles = {
  label: object;
  input: object;
};

interface AdminDriverListFiltersProps {
  drivers: Array<{ first_name?: string; last_name?: string; active?: boolean; approval_status?: string }>;
  filters: AdminDriverListFiltersState;
  onChange: (filters: AdminDriverListFiltersState) => void;
  theme: Theme;
  styles: Styles;
}

const ALL_LAST_NAMES = '';

export function AdminDriverListFilters({
  drivers,
  filters,
  onChange,
  theme,
  styles,
}: AdminDriverListFiltersProps) {
  const lastNames = getUniqueDriverLastNames(drivers);

  const pickerStyle = {
    color: theme.text,
    backgroundColor: theme.inputBg,
    ...(Platform.OS === 'web' ? { width: '100%' } : {}),
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>Last name (sorted Z → A)</Text>
      <View style={[styles.input, { padding: 0, overflow: 'hidden' }]}>
        <Picker
          selectedValue={filters.lastName}
          onValueChange={(value) => onChange({ ...filters, lastName: String(value) })}
          style={pickerStyle}
          dropdownIconColor={theme.text}
        >
          <Picker.Item label="All last names" value={ALL_LAST_NAMES} />
          {lastNames.map((lastName) => (
            <Picker.Item key={lastName} label={lastName} value={lastName} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Account status</Text>
      <View style={[styles.input, { padding: 0, overflow: 'hidden' }]}>
        <Picker
          selectedValue={filters.accountStatus}
          onValueChange={(value) => onChange({
            ...filters,
            accountStatus: value as AdminDriverListFiltersState['accountStatus'],
          })}
          style={pickerStyle}
          dropdownIconColor={theme.text}
        >
          <Picker.Item label="All accounts" value="all" />
          <Picker.Item label="Active" value="active" />
          <Picker.Item label="Inactive" value="inactive" />
        </Picker>
      </View>

      <Text style={styles.label}>Approval status</Text>
      <View style={[styles.input, { padding: 0, overflow: 'hidden' }]}>
        <Picker
          selectedValue={filters.approvalStatus}
          onValueChange={(value) => onChange({
            ...filters,
            approvalStatus: value as AdminDriverListFiltersState['approvalStatus'],
          })}
          style={pickerStyle}
          dropdownIconColor={theme.text}
        >
          <Picker.Item label="All approval statuses" value="all" />
          {(Object.keys(DRIVER_APPROVAL_LABELS) as DriverApprovalStatus[]).map((status) => (
            <Picker.Item
              key={status}
              label={DRIVER_APPROVAL_LABELS[status]}
              value={status}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}
