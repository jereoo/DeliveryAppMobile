import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { AdminFilterPickerConfig } from './AdminListFilterBar';
import { AdminListFilterBar } from './AdminListFilterBar';
import { AdminListSearchField } from './AdminListSearchField';
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
  placeholder: string;
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

export function AdminDriverListFilters({
  drivers,
  filters,
  onChange,
  theme,
  styles,
}: AdminDriverListFiltersProps) {
  const pickers = useMemo((): AdminFilterPickerConfig[] => {
    const lastNames = getUniqueDriverLastNames(drivers);
    return [
      {
        id: 'lastName',
        label: 'Last name (sorted A → Z)',
        options: [
          { label: 'All last names', value: '' },
          ...lastNames.map((lastName) => ({ label: lastName, value: lastName })),
        ],
      },
      {
        id: 'accountStatus',
        label: 'Account status',
        options: [
          { label: 'All accounts', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
      {
        id: 'approvalStatus',
        label: 'Approval status',
        options: [
          { label: 'All approval statuses', value: 'all' },
          ...(Object.keys(DRIVER_APPROVAL_LABELS) as DriverApprovalStatus[]).map((status) => ({
            label: DRIVER_APPROVAL_LABELS[status],
            value: status,
          })),
        ],
      },
    ];
  }, [drivers]);

  return (
    <View style={{ marginBottom: 16 }}>
      <AdminListSearchField
        label="Search driver name"
        placeholder="e.g. Smith or partial name"
        value={filters.driverNameSearch}
        onChangeText={(driverNameSearch) => onChange({ ...filters, driverNameSearch })}
        theme={theme}
        styles={styles}
      />
      <AdminListFilterBar
        pickers={pickers}
        filters={filters}
        onChange={onChange}
        theme={theme}
        styles={styles}
      />
    </View>
  );
}
