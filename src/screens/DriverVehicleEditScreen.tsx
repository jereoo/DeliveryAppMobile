import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { ComplianceDocumentsPanel } from '../components/ComplianceDocumentsPanel';
import { ComplianceStatusCard } from '../components/ComplianceStatusCard';
import { DriverVehicleOnboardingForm } from '../components/DriverVehicleOnboardingForm';
import type { ComplianceSummary } from '../services/complianceService';
import { buildVehicleOnboardingPayload, deactivateDriverVehicle, fetchDriverCurrentVehicle, replaceDriverVehicle, resubmitDriverVehicle, updateVehicleById, VEHICLE_APPROVAL_LABELS, type DriverVehicleRecord, type VehicleApprovalStatus } from '../services/vehicleService';
import { theme, styles } from '../theme';
import type { AuthenticatedRequest } from './types';

export interface DriverVehicleEditScreenProps {
  onBack: () => void;
  API_BASE: string;
  makeAuthenticatedRequest: AuthenticatedRequest;
  loadDriverMyVehicle: () => Promise<void>;
  loadDriverCompliance: () => Promise<void>;
  driverComplianceSummary: ComplianceSummary | null;
}

  export function DriverVehicleEditScreen({ onBack, API_BASE, makeAuthenticatedRequest, loadDriverMyVehicle, loadDriverCompliance, driverComplianceSummary }: DriverVehicleEditScreenProps) {
    const [vehicle, setVehicle] = useState<DriverVehicleRecord | null>(null);
    const [mode, setMode] = useState<'view' | 'replace' | 'resubmit'>('view');
    const [inService, setInService] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    const loadVehicle = async () => {
      setLocalLoading(true);
      setError(null);
      try {
        const data = await fetchDriverCurrentVehicle(makeAuthenticatedRequest);
        setVehicle(data);
        if (data) {
          setInService(data.active !== false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load vehicle');
        setVehicle(null);
      }
      setLocalLoading(false);
    };

    useEffect(() => {
      loadVehicle();
    }, []);

    const handleMarkInactive = async () => {
      if (!vehicle) return;
      setSubmitting(true);
      setError(null);
      try {
        await updateVehicleById(makeAuthenticatedRequest, vehicle.id, { active: false });
        Alert.alert('Success', 'Vehicle marked inactive.');
        await loadDriverMyVehicle();
        onBack();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to mark vehicle inactive');
      }
      setSubmitting(false);
    };

    const handleDeactivate = async () => {
      setDeactivating(true);
      setError(null);
      try {
        await deactivateDriverVehicle(makeAuthenticatedRequest);
        Alert.alert('Success', 'Your vehicle has been marked inactive.');
        await loadDriverMyVehicle();
        onBack();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to deactivate vehicle');
      }
      setDeactivating(false);
    };

    const handleOnboardingSubmit = async (
      fields: Parameters<typeof buildVehicleOnboardingPayload>[0],
      action: 'replace' | 'resubmit',
    ) => {
      setSubmitting(true);
      setError(null);
      try {
        const payload = buildVehicleOnboardingPayload(fields);
        const result = action === 'replace'
          ? await replaceDriverVehicle(makeAuthenticatedRequest, payload)
          : await resubmitDriverVehicle(makeAuthenticatedRequest, payload);
        Alert.alert(
          action === 'replace' ? 'Vehicle replaced' : 'Vehicle resubmitted',
          result.detail,
        );
        setMode('view');
        await loadDriverMyVehicle();
        await loadVehicle();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit vehicle');
      }
      setSubmitting(false);
    };

    const approvalLabel = vehicle
      ? (VEHICLE_APPROVAL_LABELS[vehicle.approval_status as VehicleApprovalStatus] || vehicle.approval_status)
      : '';

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={onBack} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>My Vehicle & Compliance</Text>
            </View>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
            {localLoading ? (
              <ActivityIndicator size="large" color={theme.border} />
            ) : !vehicle ? (
              <>
                <Text style={{ color: theme.text, marginBottom: 12 }}>
                  No active vehicle assignment. Register a vehicle or contact admin.
                </Text>
                <View style={styles.buttonContainer}>
                  <Button title="Back" onPress={onBack} />
                </View>
              </>
            ) : mode === 'replace' ? (
              <>
                <Text style={styles.sectionTitle}>Replace vehicle</Text>
                <Text style={{ color: theme.textMuted, marginBottom: 12 }}>
                  Your current truck will be deactivated. The new vehicle stays inactive and pending until admin approves it.
                </Text>
                <DriverVehicleOnboardingForm
                  apiBase={API_BASE}
                  submitLabel="Submit replacement"
                  submitting={submitting}
                  onSubmit={(fields) => handleOnboardingSubmit(fields, 'replace')}
                  theme={theme}
                  styles={styles}
                />
                <View style={styles.buttonContainer}>
                  <Button title="Cancel" onPress={() => setMode('view')} disabled={submitting} />
                </View>
              </>
            ) : mode === 'resubmit' ? (
              <>
                <Text style={styles.sectionTitle}>Resubmit vehicle</Text>
                {vehicle.resubmit_reason ? (
                  <>
                    <Text style={styles.label}>Staff message</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, minHeight: 80 }]}
                      value={vehicle.resubmit_reason}
                      editable={false}
                      multiline
                    />
                  </>
                ) : null}
                <DriverVehicleOnboardingForm
                  apiBase={API_BASE}
                  initialValues={{
                    vehicle_model_spec_id: vehicle.model_spec_id ?? undefined,
                    vehicle_license_plate: vehicle.license_plate,
                    vehicle_year: vehicle.year,
                    vehicle_vin: vehicle.vin,
                    vehicle_capacity: vehicle.capacity,
                    vehicle_capacity_unit: vehicle.capacity_unit,
                  }}
                  lockVinAndPlate={vehicle.registration_verified}
                  submitLabel="Resubmit for approval"
                  submitting={submitting}
                  onSubmit={(fields) => handleOnboardingSubmit(fields, 'resubmit')}
                  theme={theme}
                  styles={styles}
                />
                <View style={styles.buttonContainer}>
                  <Button title="Cancel" onPress={() => setMode('view')} disabled={submitting} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Approval status</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={approvalLabel}
                  editable={false}
                />
                <Text style={styles.label}>Operational status</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={vehicle.active ? 'Active' : 'Inactive (pending approval or out of service)'}
                  editable={false}
                />

                {vehicle.approval_status === 'RESUBMIT' && vehicle.resubmit_reason ? (
                  <>
                    <Text style={styles.label}>Staff correction request</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, minHeight: 80 }]}
                      value={vehicle.resubmit_reason}
                      editable={false}
                      multiline
                    />
                  </>
                ) : null}

                <Text style={styles.sectionTitle}>Vehicle identity</Text>
                <Text style={styles.label}>License plate</Text>
                <TextInput style={[styles.input, { color: theme.text }]} value={vehicle.license_plate} editable={false} />
                <Text style={styles.label}>Make / model</Text>
                <TextInput style={[styles.input, { color: theme.text }]} value={`${vehicle.make} ${vehicle.model}`} editable={false} />
                <Text style={styles.label}>Year</Text>
                <TextInput style={[styles.input, { color: theme.text }]} value={String(vehicle.year)} editable={false} />
                <Text style={styles.label}>VIN</Text>
                <TextInput style={[styles.input, { color: theme.text }]} value={vehicle.vin} editable={false} />
                <Text style={styles.label}>Capacity ({vehicle.capacity_unit})</Text>
                <TextInput style={[styles.input, { color: theme.text }]} value={String(vehicle.capacity)} editable={false} />

                {vehicle.identity_locked ? (
                  <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
                    Identity fields are locked after approval. Staff will send you back with a resubmit request if changes are needed.
                  </Text>
                ) : null}

                {vehicle.approval_status === 'APPROVED' && vehicle.active ? (
                  <>
                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>Vehicle in service</Text>
                      <Switch value={inService} onValueChange={setInService} />
                    </View>
                    {!inService ? (
                      <Text style={{ color: theme.error, marginBottom: 10 }}>
                        Confirm below to mark this vehicle inactive (sold, repair, or out of service).
                      </Text>
                    ) : null}
                    {!inService ? (
                      <View style={styles.buttonContainer}>
                        <Button
                          title={submitting ? 'Working...' : 'Save & Mark Inactive'}
                          onPress={handleMarkInactive}
                          disabled={submitting || deactivating}
                        />
                      </View>
                    ) : null}
                  </>
                ) : null}

                {vehicle.approval_status === 'RESUBMIT' ? (
                  <View style={styles.buttonContainer}>
                    <Button title="Update & resubmit" onPress={() => setMode('resubmit')} />
                  </View>
                ) : null}

                {vehicle.can_replace_vehicle && vehicle.approval_status !== 'RESUBMIT' ? (
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Replace vehicle"
                      color="#f0ad4e"
                      onPress={() => setMode('replace')}
                    />
                  </View>
                ) : null}

                {vehicle.approval_status === 'APPROVED' && vehicle.active && inService ? (
                  <View style={styles.buttonContainer}>
                    <Button
                      title={deactivating ? 'Working...' : 'Mark inactive now'}
                      color="#f0ad4e"
                      onPress={handleDeactivate}
                      disabled={deactivating || submitting}
                    />
                  </View>
                ) : null}

                <ComplianceDocumentsPanel
                  key={`vehicle-docs-${vehicle.id}`}
                  subjectType="vehicle"
                  subjectId={vehicle.id}
                  request={makeAuthenticatedRequest}
                  isAdmin={false}
                  canUpload
                  theme={theme}
                  styles={styles}
                  title="Legal documents - Vehicle"
                  subtitle={
                    vehicle.approval_status === 'PENDING'
                      ? 'Upload registration and insurance while your vehicle awaits admin approval.'
                      : undefined
                  }
                  onDocumentsChanged={loadDriverCompliance}
                />

                <ComplianceStatusCard
                  summary={driverComplianceSummary}
                  theme={theme}
                  styles={styles}
                  title="Vehicle compliance"
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
