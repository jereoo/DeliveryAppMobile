import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { AdminFilterPickerConfig } from './AdminListFilterBar';
import { AdminListFilterBar } from './AdminListFilterBar';
import { AdminListSearchField } from './AdminListSearchField';
import {
  AdminCustomerListFilters as AdminCustomerListFiltersState,
  getUniqueCustomerLastNames,
} from '../services/customerService';

type Theme = { text: string; inputBg: string; placeholder: string };
type Styles = { label: object; input: object };

interface Props {
  customers: Array<{ first_name?: string; last_name?: string }>;
  filters: AdminCustomerListFiltersState;
  onChange: (filters: AdminCustomerListFiltersState) => void;
  theme: Theme;
  styles: Styles;
}

export function AdminCustomerListFilters({
  customers,
  filters,
  onChange,
  theme,
  styles,
}: Props) {
  const pickers = useMemo((): AdminFilterPickerConfig[] => {
    const lastNames = getUniqueCustomerLastNames(customers);
    return [
      {
        id: 'lastName',
        label: 'Last name (sorted Z → A)',
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
        id: 'customerType',
        label: 'Customer type',
        options: [
          { label: 'All types', value: 'all' },
          { label: 'Business', value: 'business' },
          { label: 'Individual', value: 'individual' },
        ],
      },
      {
        id: 'country',
        label: 'Country',
        options: [
          { label: 'All countries', value: 'all' },
          { label: 'United States', value: 'US' },
          { label: 'Canada', value: 'CA' },
        ],
      },
    ];
  }, [customers]);

  return (
    <View style={{ marginBottom: 16 }}>
      <AdminListSearchField
        label="Search customer name"
        placeholder="e.g. Smith or partial name"
        value={filters.customerNameSearch}
        onChangeText={(customerNameSearch) => onChange({ ...filters, customerNameSearch })}
        theme={theme}
        styles={styles}
      />
      <AdminListFilterBar pickers={pickers} filters={filters} onChange={onChange} theme={theme} styles={styles} />
    </View>
  );
}
