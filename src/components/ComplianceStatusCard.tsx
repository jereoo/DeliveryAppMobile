import React from 'react';
import { Text, View } from 'react-native';
import {
  ComplianceSummary,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
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

interface ComplianceStatusCardProps {
  summary: ComplianceSummary | null;
  theme: Theme;
  styles: Styles;
  title?: string;
}

export function ComplianceStatusCard({
  summary,
  theme,
  styles,
  title = 'Compliance status',
}: ComplianceStatusCardProps) {
  if (!summary) {
    return (
      <View style={[styles.itemContainer, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={{ color: theme.textMuted }}>Loading compliance data…</Text>
      </View>
    );
  }

  const missingLabels = summary.missing_types.map(
    (t: DocumentType) => DOCUMENT_TYPE_LABELS[t] || t,
  );

  return (
    <View style={[styles.itemContainer, { marginTop: 12 }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {summary.expired > 0 && (
        <Text style={{ color: theme.error, marginBottom: 6, fontWeight: '600' }}>
          {summary.expired} document{summary.expired === 1 ? '' : 's'} expired — upload and verify replacements.
        </Text>
      )}
      {summary.expiring_soon > 0 && summary.expired === 0 && (
        <Text style={{ color: '#f0ad4e', marginBottom: 6 }}>
          {summary.expiring_soon} document{summary.expiring_soon === 1 ? '' : 's'} expiring within 30 days.
        </Text>
      )}
      <Text style={{ color: theme.text }}>
        Verified: {summary.verified} · Pending: {summary.pending}
        {summary.expired > 0 ? ` · Expired: ${summary.expired}` : ''}
        {summary.expiring_soon > 0 ? ` · Expiring soon: ${summary.expiring_soon}` : ''}
      </Text>
      {summary.is_fully_compliant ? (
        <Text style={{ color: '#5cb85c', marginTop: 6 }}>All required documents verified.</Text>
      ) : (
        <Text style={{ color: theme.error, marginTop: 6 }}>
          Missing or incomplete: {missingLabels.length ? missingLabels.join(', ') : 'review pending items'}
        </Text>
      )}
      <Text style={{ color: theme.textMuted, marginTop: 6, fontSize: 12 }}>
        Record-keeping only — not legal advice. Commercial insurance must cover delivery use.
      </Text>
    </View>
  );
}
