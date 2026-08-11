import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AdminComplianceListFilters } from './AdminComplianceListFilters';
import { AdminFilteredListMeta } from './AdminFilteredListMeta';
import type { AuthenticatedRequest } from '../services/vehicleService';
import {
  AdminComplianceDocumentRow,
  adminComplianceFiltersAreActive,
  DEFAULT_ADMIN_COMPLIANCE_LIST_FILTERS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES_REQUIRING_EXPIRY,
  filterAdminComplianceDocuments,
  FleetComplianceSummary,
  getFleetComplianceSummary,
  listAdminComplianceInbox,
  listAdminExpiringDocuments,
  openDocumentDownload,
  rejectDocument,
  verifyDocument,
  type AdminComplianceListFilters as AdminComplianceListFiltersState,
} from '../services/complianceService';

type Theme = {
  text: string;
  textMuted: string;
  error: string;
  surface: string;
  border: string;
  inputBg: string;
};

type Styles = {
  container: object;
  content: object;
  title: object;
  sectionTitle: object;
  label: object;
  input: object;
  itemContainer: object;
  buttonContainer: object;
};

type Tab = 'inbox' | 'expiring';

interface AdminComplianceScreenProps {
  onBack: () => void;
  request: AuthenticatedRequest;
  theme: Theme;
  styles: Styles;
}

const STATUS_COLOR: Record<string, string> = {
  VERIFIED: '#5cb85c',
  PENDING: '#f0ad4e',
  REJECTED: '#d9534f',
  EXPIRED: '#888888',
};

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  return value.slice(0, 10);
}

function subjectLabel(row: AdminComplianceDocumentRow): string {
  const parts: string[] = [];
  if (row.driver_name) {
    parts.push(row.driver_name);
  }
  if (row.vehicle_plate) {
    parts.push(`Vehicle ${row.vehicle_plate}`);
  }
  return parts.length ? parts.join(' · ') : 'Unassigned';
}

export function AdminComplianceScreen({
  onBack,
  request,
  theme,
  styles,
}: AdminComplianceScreenProps) {
  const [tab, setTab] = useState<Tab>('inbox');
  const [summary, setSummary] = useState<FleetComplianceSummary | null>(null);
  const [inbox, setInbox] = useState<AdminComplianceDocumentRow[]>([]);
  const [expiring, setExpiring] = useState<AdminComplianceDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveExpiryDocId, setApproveExpiryDocId] = useState<number | null>(null);
  const [approveExpiryDate, setApproveExpiryDate] = useState('');
  const [listFilters, setListFilters] = useState<AdminComplianceListFiltersState>(
    DEFAULT_ADMIN_COMPLIANCE_LIST_FILTERS,
  );

  const filteredInbox = useMemo(
    () => filterAdminComplianceDocuments(inbox, listFilters),
    [inbox, listFilters],
  );
  const filteredExpiring = useMemo(
    () => filterAdminComplianceDocuments(expiring, listFilters),
    [expiring, listFilters],
  );
  const activeRows = tab === 'inbox' ? filteredInbox : filteredExpiring;
  const totalRows = tab === 'inbox' ? inbox.length : expiring.length;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, inboxData, expiringData] = await Promise.all([
        getFleetComplianceSummary(request),
        listAdminComplianceInbox(request),
        listAdminExpiringDocuments(request),
      ]);
      setSummary(summaryData);
      setInbox(inboxData);
      setExpiring(expiringData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load compliance data');
    }
    setLoading(false);
  }, [request]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleView = async (documentId: number) => {
    setViewingId(documentId);
    setError(null);
    try {
      await openDocumentDownload(request, documentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open document');
    }
    setViewingId(null);
  };

  const handleVerify = async (row: AdminComplianceDocumentRow) => {
    const needsExpiry = DOCUMENT_TYPES_REQUIRING_EXPIRY.includes(row.document_type);
    if (needsExpiry && !row.expiry_date) {
      if (approveExpiryDocId !== row.document_id) {
        setApproveExpiryDocId(row.document_id);
        setApproveExpiryDate('');
        setRejectingId(null);
        setError(null);
        return;
      }
      if (!approveExpiryDate.trim()) {
        setError('Enter expiry date (YYYY-MM-DD) before approving');
        return;
      }
    }

    setVerifyingId(row.document_id);
    setError(null);
    setSuccessMessage(null);
    try {
      await verifyDocument(request, row.document_id, {
        expiry_date: needsExpiry && !row.expiry_date ? approveExpiryDate.trim() : undefined,
      });
      setApproveExpiryDocId(null);
      setApproveExpiryDate('');
      setInbox((current) => current.filter((item) => item.document_id !== row.document_id));
      setSuccessMessage(`${DOCUMENT_TYPE_LABELS[row.document_type]} approved.`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verify failed');
    }
    setVerifyingId(null);
  };

  const handleReject = async (row: AdminComplianceDocumentRow) => {
    if (rejectingId !== row.document_id) {
      setRejectingId(row.document_id);
      setRejectReason('');
      setApproveExpiryDocId(null);
      setError(null);
      setSuccessMessage(null);
      return;
    }
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setVerifyingId(row.document_id);
    setError(null);
    setSuccessMessage(null);
    try {
      await rejectDocument(request, row.document_id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
      setInbox((current) => current.filter((item) => item.document_id !== row.document_id));
      setSuccessMessage(`${DOCUMENT_TYPE_LABELS[row.document_type]} rejected.`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    }
    setVerifyingId(null);
  };

  const renderSummary = () => {
    if (!summary) {
      return null;
    }
    return (
      <View style={[styles.itemContainer, { marginBottom: 16 }]}>
        <Text style={styles.sectionTitle}>Fleet compliance ({summary.expiring_within_days}-day window)</Text>
        <Text style={{ color: theme.text }}>Pending documents: {summary.documents_pending}</Text>
        <Text style={{ color: theme.text }}>Expired documents: {summary.documents_expired}</Text>
        <Text style={{ color: theme.text }}>Expiring soon: {summary.documents_expiring_soon}</Text>
        <Text style={{ color: theme.text }}>Drivers pending approval: {summary.drivers_pending_approval}</Text>
        {summary.drivers_rejected > 0 ? (
          <Text style={{ color: theme.error }}>Drivers rejected: {summary.drivers_rejected}</Text>
        ) : null}
      </View>
    );
  };

  const renderInboxRow = (row: AdminComplianceDocumentRow) => (
    <View key={row.document_id} style={[styles.itemContainer, { marginBottom: 12 }]}>
      <Text style={{ color: theme.text, fontWeight: '600' }}>
        {DOCUMENT_TYPE_LABELS[row.document_type]}
      </Text>
      <Text style={{ color: theme.textMuted, marginTop: 4 }}>{subjectLabel(row)}</Text>
      <Text style={{ color: STATUS_COLOR[row.status] || theme.textMuted, marginTop: 4 }}>
        Status: {row.status}
      </Text>
      <Text style={{ color: theme.textMuted, marginTop: 2 }}>
        Submitted: {formatDate(row.created_at)}
        {row.expiry_date ? ` · Expires: ${formatDate(row.expiry_date)}` : ''}
      </Text>
      {row.file_name ? (
        <Text style={{ color: theme.textMuted, marginTop: 2 }}>File: {row.file_name}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
        <Button
          title={viewingId === row.document_id ? 'Opening…' : 'View PDF'}
          onPress={() => handleView(row.document_id)}
          disabled={viewingId === row.document_id}
        />
        <Button
          title={verifyingId === row.document_id ? 'Working…' : 'Approve'}
          onPress={() => handleVerify(row)}
          disabled={verifyingId === row.document_id}
        />
        <Button
          title={rejectingId === row.document_id ? 'Confirm reject' : 'Reject'}
          color="#d9534f"
          onPress={() => handleReject(row)}
          disabled={verifyingId === row.document_id}
        />
      </View>

      {approveExpiryDocId === row.document_id ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Expiry date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            value={approveExpiryDate}
            onChangeText={setApproveExpiryDate}
            placeholder="2027-12-31"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
          />
          <Button title="Confirm approve" onPress={() => handleVerify(row)} />
        </View>
      ) : null}

      {rejectingId === row.document_id ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Rejection reason *</Text>
          <TextInput
            style={styles.input}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Reason for rejection"
            placeholderTextColor={theme.textMuted}
          />
          <Button title="Cancel" onPress={() => { setRejectingId(null); setRejectReason(''); }} />
        </View>
      ) : null}
    </View>
  );

  const renderExpiringRow = (row: AdminComplianceDocumentRow) => (
    <View key={`exp-${row.document_id}`} style={[styles.itemContainer, { marginBottom: 12 }]}>
      <Text style={{ color: theme.text, fontWeight: '600' }}>
        {DOCUMENT_TYPE_LABELS[row.document_type]}
      </Text>
      <Text style={{ color: theme.textMuted, marginTop: 4 }}>{subjectLabel(row)}</Text>
      <Text style={{ color: STATUS_COLOR[row.status] || theme.textMuted, marginTop: 4 }}>
        Status: {row.status}
      </Text>
      <Text style={{
        color: row.status === 'EXPIRED' ? theme.error : '#f0ad4e',
        marginTop: 2,
        fontWeight: '600',
      }}
      >
        Expiry: {formatDate(row.expiry_date)}
      </Text>
      {row.file_name ? (
        <Text style={{ color: theme.textMuted, marginTop: 2 }}>File: {row.file_name}</Text>
      ) : null}
      <View style={{ marginTop: 8 }}>
        <Button
          title={viewingId === row.document_id ? 'Opening…' : 'View PDF'}
          onPress={() => handleView(row.document_id)}
          disabled={viewingId === row.document_id}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Button title="← Back" onPress={onBack} />
          <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Compliance ops</Text>
          <Button title="🔄" onPress={loadAll} />
        </View>

        {error ? <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text> : null}
        {successMessage ? (
          <Text style={{ color: '#5cb85c', marginBottom: 10 }}>{successMessage}</Text>
        ) : null}

        {loading && !summary ? (
          <ActivityIndicator size="large" color={theme.border} />
        ) : (
          <>
            {renderSummary()}

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <Button
                title={`Inbox (${inbox.length})`}
                onPress={() => setTab('inbox')}
                color={tab === 'inbox' ? '#007AFF' : '#8E8E93'}
              />
              <Button
                title={`Expiring (${expiring.length})`}
                onPress={() => setTab('expiring')}
                color={tab === 'expiring' ? '#007AFF' : '#8E8E93'}
              />
            </View>

            <AdminComplianceListFilters
              filters={listFilters}
              onChange={setListFilters}
              theme={theme}
              styles={styles}
            />

            {totalRows === 0 ? (
              <Text style={{ color: theme.textMuted }}>
                {tab === 'inbox' ? 'No pending documents.' : 'No expiring or expired documents in window.'}
              </Text>
            ) : (
              <AdminFilteredListMeta
                totalCount={totalRows}
                filteredCount={activeRows.length}
                filteredEmptyMessage="No documents match the current filters."
                hasActiveFilters={adminComplianceFiltersAreActive(listFilters)}
                onClearFilters={() => setListFilters(DEFAULT_ADMIN_COMPLIANCE_LIST_FILTERS)}
                theme={theme}
                styles={styles}
              >
                {tab === 'inbox'
                  ? filteredInbox.map(renderInboxRow)
                  : filteredExpiring.map(renderExpiringRow)}
              </AdminFilteredListMeta>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
