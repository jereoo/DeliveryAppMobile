import React, { useMemo } from 'react';

import type { AdminFilterPickerConfig } from './AdminListFilterBar';
import { AdminListFilterBar } from './AdminListFilterBar';
import {
  AdminComplianceListFilters as AdminComplianceListFiltersState,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
} from '../services/complianceService';

type Theme = { text: string; inputBg: string };
type Styles = { label: object; input: object };

interface Props {
  filters: AdminComplianceListFiltersState;
  onChange: (filters: AdminComplianceListFiltersState) => void;
  theme: Theme;
  styles: Styles;
}

export function AdminComplianceListFilters({
  filters,
  onChange,
  theme,
  styles,
}: Props) {
  const pickers = useMemo((): AdminFilterPickerConfig[] => [
    {
      id: 'documentType',
      label: 'Document type',
      options: [
        { label: 'All document types', value: 'all' },
        ...(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => ({
          label: DOCUMENT_TYPE_LABELS[type],
          value: type,
        })),
      ],
    },
    {
      id: 'subjectType',
      label: 'Subject',
      options: [
        { label: 'All subjects', value: 'all' },
        { label: 'Driver documents', value: 'driver' },
        { label: 'Vehicle documents', value: 'vehicle' },
      ],
    },
    {
      id: 'status',
      label: 'Document status',
      options: [
        { label: 'All statuses', value: 'all' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Verified', value: 'VERIFIED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Expired', value: 'EXPIRED' },
      ],
    },
  ], []);

  return (
    <AdminListFilterBar
      pickers={pickers}
      filters={filters as Record<string, string>}
      onChange={(next) => onChange(next as AdminComplianceListFiltersState)}
      theme={theme}
      styles={styles}
    />
  );
}
