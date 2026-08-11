import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { AdminFilterPickerConfig } from './AdminListFilterBar';
import { AdminListFilterBar } from './AdminListFilterBar';
import { AdminListSearchField } from './AdminListSearchField';
import {
  AdminVehicleListFilters as AdminVehicleListFiltersState,
  VEHICLE_APPROVAL_LABELS,
  VehicleApprovalStatus,
} from '../services/vehicleService';

type Theme = { text: string; inputBg: string; placeholder: string };
type Styles = { label: object; input: object };

interface Props {
  filters: AdminVehicleListFiltersState;
  onChange: (filters: AdminVehicleListFiltersState) => void;
  theme: Theme;
  styles: Styles;
}

export function AdminVehicleListFilters({
  filters,
  onChange,
  theme,
  styles,
}: Props) {
  const pickers = useMemo((): AdminFilterPickerConfig[] => [
    {
      id: 'operationalStatus',
      label: 'Operational status',
      options: [
        { label: 'All vehicles', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      id: 'approvalStatus',
      label: 'Approval status',
      options: [
        { label: 'All approval statuses', value: 'all' },
        ...(Object.keys(VEHICLE_APPROVAL_LABELS) as VehicleApprovalStatus[]).map((status) => ({
          label: VEHICLE_APPROVAL_LABELS[status],
          value: status,
        })),
      ],
    },
    {
      id: 'sort',
      label: 'Sort by',
      options: [
        { label: 'License plate (A → Z)', value: 'plate_az' },
        { label: 'Make / model (A → Z)', value: 'make_az' },
        { label: 'Year (newest first)', value: 'year_desc' },
      ],
    },
  ], []);

  return (
    <View style={{ marginBottom: 16 }}>
      <AdminListSearchField
        label="Search license plate"
        placeholder="e.g. DEMO001 or partial plate"
        value={filters.licensePlateSearch}
        onChangeText={(licensePlateSearch) => onChange({ ...filters, licensePlateSearch })}
        theme={theme}
        styles={styles}
        autoCapitalize="characters"
      />
      <AdminListFilterBar pickers={pickers} filters={filters} onChange={onChange} theme={theme} styles={styles} />
    </View>
  );
}
