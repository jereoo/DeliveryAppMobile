import React from 'react';
import { Text, View } from 'react-native';

import {
  COMPLIANCE_BLOCKER_LABELS,
  VehicleComplianceStatus,
} from '../services/complianceService';

type Theme = {
  text: string;
  textMuted: string;
  error: string;
  border: string;
};

type Styles = {
  itemContainer: object;
  sectionTitle: object;
};

interface VehicleReactivationChecklistProps {
  status: VehicleComplianceStatus | null;
  loading?: boolean;
  theme: Theme;
  styles: Styles;
}

export function VehicleReactivationChecklist({
  status,
  loading = false,
  theme,
  styles,
}: VehicleReactivationChecklistProps) {
  if (loading) {
    return (
      <View style={[styles.itemContainer, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>Reactivation checklist</Text>
        <Text style={{ color: theme.textMuted }}>Loading compliance status…</Text>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const items = [
    { label: 'Vehicle registration', ok: status.registration },
    { label: 'Commercial insurance', ok: status.insurance },
  ];

  return (
    <View style={[styles.itemContainer, { marginTop: 12 }]}>
      <Text style={styles.sectionTitle}>Reactivation checklist</Text>
      {items.map((item) => (
        <Text
          key={item.label}
          style={{ color: item.ok ? '#5cb85c' : theme.error, marginTop: 4 }}
        >
          {item.ok ? '✓' : '✗'} {item.label}
        </Text>
      ))}
      {status.may_reactivate ? (
        <Text style={{ color: '#5cb85c', marginTop: 8 }}>
          Ready to reactivate — verified registration and insurance on file.
        </Text>
      ) : (
        <Text style={{ color: theme.error, marginTop: 8 }}>
          Blocked:{' '}
          {status.blockers
            .map((code) => COMPLIANCE_BLOCKER_LABELS[code] || code)
            .join('; ')}
        </Text>
      )}
    </View>
  );
}
