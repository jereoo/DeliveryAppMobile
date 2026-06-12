import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AuthenticatedRequest } from '../services/vehicleService';
import {
  CreateDocumentPayload,
  DOCUMENT_TYPE_LABELS,
  DRIVER_DOCUMENT_TYPES,
  LegalDocument,
  VEHICLE_DOCUMENT_TYPES,
  createDriverDocument,
  createVehicleDocument,
  listDriverDocuments,
  listVehicleDocuments,
  rejectDocument,
  verifyDocument,
  DocumentType,
  CoverageType,
} from '../services/complianceService';

type Theme = {
  text: string;
  textMuted: string;
  error: string;
  inputBg: string;
  border: string;
};

type Styles = {
  sectionTitle: object;
  label: object;
  input: object;
  itemContainer: object;
  buttonContainer: object;
};

interface ComplianceDocumentsPanelProps {
  subjectType: 'driver' | 'vehicle';
  subjectId: number;
  request: AuthenticatedRequest;
  isAdmin: boolean;
  canUpload: boolean;
  theme: Theme;
  styles: Styles;
}

const STATUS_COLOR: Record<string, string> = {
  VERIFIED: '#5cb85c',
  PENDING: '#f0ad4e',
  REJECTED: '#d9534f',
  EXPIRED: '#888888',
};

export function ComplianceDocumentsPanel({
  subjectType,
  subjectId,
  request,
  isAdmin,
  canUpload,
  theme,
  styles,
}: ComplianceDocumentsPanelProps) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState<CreateDocumentPayload>({
    document_type: subjectType === 'driver' ? 'DRIVER_LICENSE' : 'COMMERCIAL_INSURANCE',
    issuer: '',
    policy_number: '',
    coverage_type: 'COMMERCIAL',
    expiry_date: '',
    notes: '',
  });

  const allowedTypes = subjectType === 'driver' ? DRIVER_DOCUMENT_TYPES : VEHICLE_DOCUMENT_TYPES;

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = subjectType === 'driver'
        ? await listDriverDocuments(request, subjectId)
        : await listVehicleDocuments(request, subjectId);
      setDocuments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    }
    setLoading(false);
  }, [request, subjectId, subjectType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCreate = async () => {
    if (!form.document_type) {
      setError('Document type is required');
      return;
    }
    if (form.document_type === 'COMMERCIAL_INSURANCE') {
      if (!form.issuer?.trim() || !form.policy_number?.trim()) {
        setError('Carrier and policy number are required for commercial insurance');
        return;
      }
      if (form.coverage_type !== 'COMMERCIAL') {
        setError('Coverage type must be COMMERCIAL for delivery use');
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateDocumentPayload = {
        document_type: form.document_type,
        issuer: form.issuer?.trim() || undefined,
        policy_number: form.policy_number?.trim() || undefined,
        coverage_type: form.coverage_type,
        expiry_date: form.expiry_date?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };
      if (subjectType === 'driver') {
        await createDriverDocument(request, subjectId, payload);
      } else {
        await createVehicleDocument(request, subjectId, payload);
      }
      setShowForm(false);
      setForm({
        document_type: allowedTypes[0],
        issuer: '',
        policy_number: '',
        coverage_type: 'COMMERCIAL',
        expiry_date: '',
        notes: '',
      });
      await loadDocuments();
      Alert.alert('Success', 'Document submitted for review.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit document');
    }
    setSaving(false);
  };

  const handleVerify = (doc: LegalDocument) => {
    Alert.alert('Verify document', `Mark ${DOCUMENT_TYPE_LABELS[doc.document_type]} as verified?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify',
        onPress: async () => {
          try {
            await verifyDocument(request, doc.id);
            await loadDocuments();
            Alert.alert('Success', 'Document verified.');
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Verify failed');
          }
        },
      },
    ]);
  };

  const handleReject = async (doc: LegalDocument) => {
    if (rejectingId !== doc.id) {
      setRejectingId(doc.id);
      setRejectReason('');
      return;
    }
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    try {
      await rejectDocument(request, doc.id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
      await loadDocuments();
      Alert.alert('Success', 'Document rejected.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Reject failed');
    }
  };

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>Legal documents</Text>
      {error ? <Text style={{ color: theme.error, marginBottom: 8 }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="small" color={theme.border} />
      ) : documents.length === 0 ? (
        <Text style={{ color: theme.textMuted, marginBottom: 8 }}>No documents on file.</Text>
      ) : (
        documents.map((doc) => (
          <View key={doc.id} style={[styles.itemContainer, { marginBottom: 8 }]}>
            <Text style={{ color: theme.text, fontWeight: '600' }}>
              {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
            </Text>
            <Text style={{ color: STATUS_COLOR[doc.status] || theme.text }}>
              Status: {doc.status}
            </Text>
            {doc.issuer ? <Text style={{ color: theme.text }}>Issuer: {doc.issuer}</Text> : null}
            {doc.policy_number ? (
              <Text style={{ color: theme.text }}>Policy #: {doc.policy_number}</Text>
            ) : null}
            {doc.expiry_date ? (
              <Text style={{ color: theme.text }}>Expires: {doc.expiry_date}</Text>
            ) : null}
            {doc.rejection_reason ? (
              <Text style={{ color: theme.error }}>Rejected: {doc.rejection_reason}</Text>
            ) : null}
            {isAdmin && doc.status === 'PENDING' ? (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <Button title="Verify" onPress={() => handleVerify(doc)} />
                  <Button
                    title={rejectingId === doc.id ? 'Confirm reject' : 'Reject'}
                    color="#d9534f"
                    onPress={() => handleReject(doc)}
                  />
                </View>
                {rejectingId === doc.id ? (
                  <>
                    <Text style={[styles.label, { marginTop: 8 }]}>Rejection reason</Text>
                    <TextInput
                      style={styles.input}
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      placeholder="Reason for rejection"
                      placeholderTextColor={theme.textMuted}
                    />
                    <Button title="Cancel" onPress={() => setRejectingId(null)} />
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        ))
      )}
      {canUpload ? (
        <>
          {!showForm ? (
            <View style={styles.buttonContainer}>
              <Button title="Add document" onPress={() => setShowForm(true)} />
            </View>
          ) : (
            <View style={[styles.itemContainer, { marginTop: 8 }]}>
              <Text style={styles.label}>Document type</Text>
              {allowedTypes.map((type) => (
                <Button
                  key={type}
                  title={`${form.document_type === type ? '✓ ' : ''}${DOCUMENT_TYPE_LABELS[type]}`}
                  onPress={() => setForm((f) => ({ ...f, document_type: type as DocumentType }))}
                />
              ))}
              <Text style={styles.label}>Issuer / carrier</Text>
              <TextInput
                style={styles.input}
                value={form.issuer || ''}
                onChangeText={(t) => setForm((f) => ({ ...f, issuer: t }))}
                placeholder="DMV, insurance carrier…"
                placeholderTextColor={theme.textMuted}
              />
              {(form.document_type === 'COMMERCIAL_INSURANCE'
                || form.document_type === 'VEHICLE_REGISTRATION') && (
                <>
                  <Text style={styles.label}>Policy / registration #</Text>
                  <TextInput
                    style={styles.input}
                    value={form.policy_number || ''}
                    onChangeText={(t) => setForm((f) => ({ ...f, policy_number: t }))}
                    placeholderTextColor={theme.textMuted}
                  />
                </>
              )}
              {form.document_type === 'COMMERCIAL_INSURANCE' && (
                <>
                  <Text style={styles.label}>Coverage type (must be COMMERCIAL)</Text>
                  <Button
                    title={`Coverage: ${form.coverage_type || 'COMMERCIAL'}`}
                    onPress={() => setForm((f) => ({
                      ...f,
                      coverage_type: (f.coverage_type === 'COMMERCIAL' ? 'PERSONAL' : 'COMMERCIAL') as CoverageType,
                    }))}
                  />
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8 }}>
                    I confirm this policy covers commercial delivery use (not personal auto only).
                  </Text>
                </>
              )}
              <Text style={styles.label}>Expiry date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.expiry_date || ''}
                onChangeText={(t) => setForm((f) => ({ ...f, expiry_date: t }))}
                placeholder="2026-12-31"
                placeholderTextColor={theme.textMuted}
              />
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.notes || ''}
                onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
                placeholderTextColor={theme.textMuted}
                multiline
              />
              <View style={styles.buttonContainer}>
                <Button
                  title={saving ? 'Submitting…' : 'Submit for review'}
                  onPress={handleCreate}
                  disabled={saving}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="Cancel" onPress={() => setShowForm(false)} />
              </View>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}
