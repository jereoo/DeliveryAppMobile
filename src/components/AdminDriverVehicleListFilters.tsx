import React, { useMemo } from 'react';

import type { AdminFilterPickerConfig } from './AdminListFilterBar';
import { AdminListFilterBar } from './AdminListFilterBar';
import {
  AdminDriverVehicleListFilters as AdminDriverVehicleListFiltersState,
  getUniqueDriverVehicleDriverNames,
  getUniqueDriverVehiclePlates,
} from '../services/assignmentService';

type Theme = { text: string; inputBg: string };
type Styles = { label: object; input: object };

interface Props {
  assignments: Array<{ driver_name?: string; vehicle_license_plate?: string }>;
  filters: AdminDriverVehicleListFiltersState;
  onChange: (filters: AdminDriverVehicleListFiltersState) => void;
  theme: Theme;
  styles: Styles;
}

export function AdminDriverVehicleListFilters({
  assignments,
  filters,
  onChange,
  theme,
  styles,
}: Props) {
  const pickers = useMemo((): AdminFilterPickerConfig[] => {
    const driverNames = getUniqueDriverVehicleDriverNames(assignments);
    const plates = getUniqueDriverVehiclePlates(assignments);
    return [
      {
        id: 'assignmentStatus',
        label: 'Assignment status',
        options: [
          { label: 'All assignments', value: 'all' },
          { label: 'Active / ongoing', value: 'active' },
          { label: 'Completed', value: 'completed' },
        ],
      },
      {
        id: 'driverName',
        label: 'Driver (sorted Z → A)',
        options: [
          { label: 'All drivers', value: '' },
          ...driverNames.map((name) => ({ label: name, value: name })),
        ],
      },
      {
        id: 'vehiclePlate',
        label: 'Vehicle plate (A → Z)',
        options: [
          { label: 'All plates', value: '' },
          ...plates.map((plate) => ({ label: plate, value: plate })),
        ],
      },
      {
        id: 'sort',
        label: 'Sort by',
        options: [
          { label: 'Assigned from (newest first)', value: 'newest' },
          { label: 'Driver name (A → Z)', value: 'driver_az' },
          { label: 'License plate (A → Z)', value: 'plate_az' },
        ],
      },
    ];
  }, [assignments]);

  return (
    <AdminListFilterBar pickers={pickers} filters={filters} onChange={onChange} theme={theme} styles={styles} />
  );
}
