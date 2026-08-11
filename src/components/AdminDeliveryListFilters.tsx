import React, { useMemo } from 'react';

import type { AdminFilterPickerConfig } from './AdminListFilterBar';
import { AdminListFilterBar } from './AdminListFilterBar';
import {
  AdminDeliveryListFilters as AdminDeliveryListFiltersState,
  getUniqueDeliveryCustomerNames,
} from '../services/deliveryService';

type Theme = { text: string; inputBg: string };
type Styles = { label: object; input: object };

interface Props {
  deliveries: Array<{ customer_name?: string }>;
  filters: AdminDeliveryListFiltersState;
  onChange: (filters: AdminDeliveryListFiltersState) => void;
  theme: Theme;
  styles: Styles;
}

export function AdminDeliveryListFilters({
  deliveries,
  filters,
  onChange,
  theme,
  styles,
}: Props) {
  const pickers = useMemo((): AdminFilterPickerConfig[] => {
    const customerNames = getUniqueDeliveryCustomerNames(deliveries);
    return [
      {
        id: 'status',
        label: 'Delivery status',
        options: [
          { label: 'All statuses', value: 'all' },
          { label: 'Pending', value: 'Pending' },
          { label: 'En Route', value: 'En Route' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Cancelled', value: 'Cancelled' },
        ],
      },
      {
        id: 'customerName',
        label: 'Customer (sorted Z → A)',
        options: [
          { label: 'All customers', value: '' },
          ...customerNames.map((name) => ({ label: name, value: name })),
        ],
      },
      {
        id: 'sort',
        label: 'Sort by',
        options: [
          { label: 'Newest first', value: 'newest' },
          { label: 'Oldest first', value: 'oldest' },
          { label: 'Customer name (A → Z)', value: 'customer_az' },
        ],
      },
    ];
  }, [deliveries]);

  return (
    <AdminListFilterBar pickers={pickers} filters={filters} onChange={onChange} theme={theme} styles={styles} />
  );
}
