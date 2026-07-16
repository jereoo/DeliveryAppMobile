import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
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
  PdfFileSelection,
  VEHICLE_DOCUMENT_TYPES,
  createDriverDocument,
  createVehicleDocument,
  listDriverDocuments,
  listVehicleDocuments,
  openDocumentDownload,
  rejectDocument,
  uploadCompliancePdf,
  validatePdfSelection,
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
  title?: string;
  subtitle?: string;
  onDocumentsChanged?: () => void | Promise<void>;
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
  title = 'Legal documents',
  subtitle,
  onDocumentsChanged,
}: ComplianceDocumentsPanelProps) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPdf, setSelectedPdf] = useState<PdfFileSelection | null>(null);
  const [viewingFileId, setViewingFileId] = useState<number | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const refreshDocuments = useCallback(async () => {
    await loadDocuments();
    if (onDocumentsChanged) {
      await onDocumentsChanged();
    }
  }, [loadDocuments, onDocumentsChanged]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const resetForm = () => {
    setShowForm(false);
    setSelectedPdf(null);
    setForm({
      document_type: allowedTypes[0],
      issuer: '',
      policy_number: '',
      coverage_type: 'COMMERCIAL',
      expiry_date: '',
      notes: '',
    });
  };

  const handleChoosePdf = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('PDF upload', 'Attach PDFs using the web app (Vercel) for now.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      try {
        validatePdfSelection({
          name: file.name,
          size: file.size,
          type: file.type,
        });
        setSelectedPdf({
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          blob: file,
        });
        setError(null);
      } catch (e) {
        setSelectedPdf(null);
        setError(e instanceof Error ? e.message : 'Invalid PDF file');
      }
    };
    input.click();
  };

  const handleViewFile = async (doc: LegalDocument) => {
    setViewingFileId(doc.id);
    setError(null);
    try {
      await openDocumentDownload(request, doc.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open file');
    }
    setViewingFileId(null);
  };

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
      let fileMeta: { file_key: string; file_name: string } | undefined;
      if (selectedPdf) {
        fileMeta = await uploadCompliancePdf(request, selectedPdf);
      }
      const payload: CreateDocumentPayload = {
        document_type: form.document_type,
        issuer: form.issuer?.trim() || undefined,
        policy_number: form.policy_number?.trim() || undefined,
        coverage_type: form.coverage_type,
        expiry_date: form.expiry_date?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        file_key: fileMeta?.file_key,
        file_name: fileMeta?.file_name,
      };
      if (subjectType === 'driver') {
        await createDriverDocument(request, subjectId, payload);
      } else {
        await createVehicleDocument(request, subjectId, payload);
      }
      resetForm();
      await refreshDocuments();
      Alert.alert('Success', fileMeta
        ? 'Document and PDF submitted for review.'
        : 'Document submitted for review.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit document');
    }
    setSaving(false);
  };

  const handleVerify = async (doc: LegalDocument) => {
    setVerifyingId(doc.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await verifyDocument(request, doc.id);
      await refreshDocuments();
      setSuccessMessage(`${DOCUMENT_TYPE_LABELS[doc.document_type]} approved.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    }
    setVerifyingId(null);
  };

  const handleReject = async (doc: LegalDocument) => {
    if (rejectingId !== doc.id) {
      setRejectingId(doc.id);
      setRejectReason('');
      setSuccessMessage(null);
      return;
    }
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    try {
      await rejectDocument(request, doc.id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
      await refreshDocuments();
      setSuccessMessage(`${DOCUMENT_TYPE_LABELS[doc.document_type]} rejected.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    }
  };

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: theme.textMuted, marginBottom: 8 }}>{subtitle}</Text>
      ) : null}
      {error ? <Text style={{ color: theme.error, marginBottom: 8 }}>{error}</Text> : null}
      {successMessage ? (
        <Text style={{ color: '#5cb85c', marginBottom: 8 }}>{successMessage}</Text>
      ) : null}
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
            {doc.file_name ? (
              <Text style={{ color: theme.textMuted }}>File: {doc.file_name}</Text>
            ) : null}
            {doc.file_key ? (
              <View style={{ marginTop: 6 }}>
                <Button
                  title={viewingFileId === doc.id ? 'Opening…' : 'View file'}
                  onPress={() => handleViewFile(doc)}
                  disabled={viewingFileId === doc.id}
                />
              </View>
            ) : null}
            {doc.rejection_reason ? (
              <Text style={{ color: theme.error }}>Rejected: {doc.rejection_reason}</Text>
            ) : null}
            {isAdmin && doc.status === 'PENDING' ? (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <Button
                    title={verifyingId === doc.id ? 'Approving…' : 'Approve'}
                    onPress={() => handleVerify(doc)}
                    disabled={verifyingId === doc.id}
                  />
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
              <Text style={styles.label}>Attach PDF (optional)</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8 }}>
                PDF only, max 10 MB. From your insurer or DMV — not Word documents.
              </Text>
              <View style={styles.buttonContainer}>
                <Button title="Choose PDF" onPress={handleChoosePdf} />
              </View>
              {selectedPdf ? (
                <Text style={{ color: theme.text, marginBottom: 8 }}>
                  Selected: {selectedPdf.name} ({Math.ceil(selectedPdf.size / 1024)} KB)
                </Text>
              ) : (
                <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
                  No file selected — metadata only
                </Text>
              )}
              {selectedPdf ? (
                <View style={styles.buttonContainer}>
                  <Button title="Remove PDF" onPress={() => setSelectedPdf(null)} />
                </View>
              ) : null}
              <View style={styles.buttonContainer}>
                <Button
                  title={saving ? 'Submitting…' : 'Submit for review'}
                  onPress={handleCreate}
                  disabled={saving}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="Cancel" onPress={resetForm} />
              </View>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}
