import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { AdminFilteredListMeta } from '../components/AdminFilteredListMeta';
import { AdminVehicleListFilters } from '../components/AdminVehicleListFilters';
import { ComplianceDocumentsPanel } from '../components/ComplianceDocumentsPanel';
import { VehicleCapacityFields } from '../components/VehicleCapacityFields';
import { VehicleCatalogFields } from '../components/VehicleCatalogFields';
import { VehicleReactivationChecklist } from '../components/VehicleReactivationChecklist';
import { findModelSpec, fetchVehicleCatalog } from '../services/vehicleCatalogService';
import type { VehicleComplianceStatus } from '../services/complianceService';
import { getVehicleComplianceStatus } from '../services/complianceService';
import { approveVehicleById, requestVehicleResubmit, VEHICLE_APPROVAL_LABELS, type VehicleApprovalStatus, DEFAULT_ADMIN_VEHICLE_LIST_FILTERS, adminVehicleFiltersAreActive, filterAndSortAdminVehicles, type AdminVehicleListFilters as AdminVehicleListFiltersState } from '../services/vehicleService';
import { theme, styles } from '../theme';
import { convertCapacityTextForUnit, nextCapacityAfterInput, validateCapacityText } from '../utils/vehicleCapacity';
import type { AuthenticatedRequest } from './types';

export interface AdminVehiclesScreenProps {
  onBack: () => void;
  API_BASE: string;
  vehicles: any[];
  loadVehicles: () => Promise<void>;
  makeAuthenticatedRequest: AuthenticatedRequest;
  createVehicle: (data: any) => Promise<void>;
  updateVehicle: (id: any, data: any) => Promise<void>;
  deleteVehicle: (id: number) => Promise<void>;
  deactivateVehicle: (id: number) => Promise<void>;
  reactivateVehicle: (id: number) => Promise<void>;
}

  export function AdminVehiclesScreen({ onBack, API_BASE, vehicles, loadVehicles, makeAuthenticatedRequest, createVehicle, updateVehicle, deleteVehicle, deactivateVehicle, reactivateVehicle }: AdminVehiclesScreenProps) {
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [selected, setSelected] = useState<any>(null);
    const [form, setForm] = useState<any>({
      license_plate: '', make: '', model: '', year: 0,
      vin: '', capacity_unit: 'kg', active: true, vehicle_model_spec_id: null as number | null,
    });
    const [capacityText, setCapacityText] = useState('');
    const [capacityFieldError, setCapacityFieldError] = useState<string | null>(null);
    const [resubmitReason, setResubmitReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [vehicleCompliance, setVehicleCompliance] = useState<VehicleComplianceStatus | null>(null);
    const [complianceLoading, setComplianceLoading] = useState(false);
    const [listFilters, setListFilters] = useState<AdminVehicleListFiltersState>(
      DEFAULT_ADMIN_VEHICLE_LIST_FILTERS,
    );

    const filteredVehicles = useMemo(
      () => filterAndSortAdminVehicles(vehicles, listFilters),
      [vehicles, listFilters],
    );

    useEffect(() => {
      let cancelled = false;
      const loadCompliance = async () => {
        if (mode !== 'detail' || !selected?.id) {
          setVehicleCompliance(null);
          return;
        }
        setComplianceLoading(true);
        try {
          const status = await getVehicleComplianceStatus(makeAuthenticatedRequest, selected.id);
          if (!cancelled) {
            setVehicleCompliance(status);
          }
        } catch {
          if (!cancelled) {
            setVehicleCompliance(null);
          }
        } finally {
          if (!cancelled) {
            setComplianceLoading(false);
          }
        }
      };
      loadCompliance();
      return () => {
        cancelled = true;
      };
    }, [mode, selected?.id]);

    const resetVehicleForm = () => {
      setForm({
        license_plate: '', make: '', model: '', year: 0,
        vin: '', capacity_unit: 'kg', active: true, vehicle_model_spec_id: null,
      });
      setCapacityText('');
      setCapacityFieldError(null);
    };

    const handleCatalogSpecChange = async (specId: number | null) => {
      setForm((f: typeof form) => ({ ...f, vehicle_model_spec_id: specId }));
      if (!specId) return;
      try {
        const catalog = await fetchVehicleCatalog(API_BASE);
        const spec = findModelSpec(catalog, specId);
        if (spec) {
          setForm((f: typeof form) => ({
            ...f,
            vehicle_model_spec_id: specId,
            make: spec.manufacturer_name,
            model: spec.name,
            capacity_unit: 'lb',
          }));
          setCapacityText(String(spec.max_capacity_lb));
          setCapacityFieldError(null);
        }
      } catch {
        setError('Could not load catalog details for selected model');
      }
    };

    const handleCapacityChange = (text: string) => {
      const result = nextCapacityAfterInput(text, form.capacity_unit || 'kg');
      if (result.rejected) {
        if (result.error) {
          setCapacityFieldError(result.error);
        }
        return;
      }
      setCapacityText(result.text);
      setCapacityFieldError(result.error);
    };

    const switchCapacityUnit = (nextUnit: 'kg' | 'lb') => {
      if ((form.capacity_unit || 'kg') === nextUnit) {
        return;
      }
      const converted = convertCapacityTextForUnit(capacityText, form.capacity_unit || 'kg', nextUnit);
      setForm((f: typeof form) => ({ ...f, capacity_unit: nextUnit }));
      setCapacityText(converted.text);
      setCapacityFieldError(converted.error);
    };

    const validateVehicleForm = (): boolean => {
      if (!form.license_plate.trim() || !form.make.trim() || !form.model.trim() || !form.vin.trim()) {
        setError('License plate, make, model, and VIN are required');
        return false;
      }
      if (form.vin.length !== 17) {
        setError('VIN must be exactly 17 characters');
        return false;
      }
      if (form.year <= 0 || form.year < 1900 || form.year > 2100) {
        setError('Year must be between 1900 and 2100');
        return false;
      }
      const capacityError = validateCapacityText(capacityText, form.capacity_unit || 'kg');
      if (capacityError) {
        setCapacityFieldError(capacityError);
        setError(capacityError);
        return false;
      }
      return true;
    };

    const buildVehiclePayload = () => ({
      ...form,
      capacity: parseInt(capacityText, 10),
      vin: form.vin.toUpperCase(),
    });

    // Handlers
    const handleSelect = (vehicle: any) => {
      setSelected(vehicle);
      setMode('detail');
    };
    const handleEdit = (vehicle: any) => {
      setSelected(vehicle);
      setForm({
        license_plate: vehicle.license_plate || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || 0,
        vin: vehicle.vin || '',
        capacity_unit: vehicle.capacity_unit || 'kg',
        active: vehicle.active !== undefined ? vehicle.active : true
      });
      setCapacityText(vehicle.capacity != null ? String(vehicle.capacity) : '');
      setCapacityFieldError(null);
      setMode('edit');
    };
    const handleDelete = async (vehicle: any) => {
      Alert.alert(
        'Remove vehicle',
        vehicle.active
          ? 'Delete permanently only works when the vehicle has no assignment history. Otherwise it will be marked inactive.'
          : 'This vehicle is already inactive. Delete permanently only if it has no history.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive', onPress: async () => {
              setLocalLoading(true);
              try {
                await deleteVehicle(vehicle.id);
                setMode('list');
                setSelected(null);
                await loadVehicles();
              } catch (e) {
                setError('Failed to delete vehicle');
              }
              setLocalLoading(false);
            }
          }
        ]
      );
    };
    const handleDeactivate = async (vehicle: any) => {
      setLocalLoading(true);
      setError(null);
      try {
        await deactivateVehicle(vehicle.id);
        setMode('list');
        setSelected(null);
        await loadVehicles();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to deactivate vehicle');
      }
      setLocalLoading(false);
    };
    const handleReactivate = async (vehicle: any) => {
      setLocalLoading(true);
      setError(null);
      try {
        await reactivateVehicle(vehicle.id);
        setMode('list');
        setSelected(null);
        await loadVehicles();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to reactivate vehicle');
      }
      setLocalLoading(false);
    };
    const handleApproveVehicle = async (vehicle: any) => {
      setLocalLoading(true);
      setError(null);
      try {
        const updated = await approveVehicleById(makeAuthenticatedRequest, vehicle.id);
        Alert.alert('Success', 'Vehicle approved.');
        setSelected(updated);
        await loadVehicles();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to approve vehicle');
      }
      setLocalLoading(false);
    };
    const handleRequestVehicleResubmit = async (vehicle: any) => {
      if (!resubmitReason.trim()) {
        setError('Enter a message for the driver explaining what to fix.');
        return;
      }
      setLocalLoading(true);
      setError(null);
      try {
        await requestVehicleResubmit(makeAuthenticatedRequest, vehicle.id, resubmitReason.trim());
        Alert.alert('Success', 'Driver must update and resubmit this vehicle.');
        setResubmitReason('');
        await loadVehicles();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to request resubmit');
      }
      setLocalLoading(false);
    };
    const handleCreate = async () => {
      if (!validateVehicleForm()) {
        return;
      }
      setLocalLoading(true);
      setError(null);
      try {
        await createVehicle(buildVehiclePayload());
        setMode('list');
        resetVehicleForm();
        await loadVehicles();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create vehicle');
      }
      setLocalLoading(false);
    };
    const handleUpdate = async () => {
      if (!selected) return;
      if (!validateVehicleForm()) {
        return;
      }
      setLocalLoading(true);
      setError(null);
      try {
        await updateVehicle(selected.id, buildVehiclePayload());
        setMode('list');
        setSelected(null);
        await loadVehicles();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update vehicle');
      }
      setLocalLoading(false);
    };

    // Render
    if (mode === 'list') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={onBack} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🚛 Admin Vehicles</Text>
            </View>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
            <View style={styles.buttonContainer}>
              <Button title="Add Vehicle" onPress={() => { resetVehicleForm(); setMode('create'); }} />
            </View>

            <AdminVehicleListFilters
              filters={listFilters}
              onChange={setListFilters}
              theme={theme}
              styles={styles}
            />

            {localLoading ? <ActivityIndicator /> : vehicles.length === 0 ? (
              <Text style={styles.emptyText}>No vehicles found.</Text>
            ) : (
              <AdminFilteredListMeta
                totalCount={vehicles.length}
                filteredCount={filteredVehicles.length}
                filteredEmptyMessage="No vehicles match the current filters."
                hasActiveFilters={adminVehicleFiltersAreActive(listFilters)}
                onClearFilters={() => setListFilters(DEFAULT_ADMIN_VEHICLE_LIST_FILTERS)}
                theme={theme}
                styles={styles}
              >
                {filteredVehicles.map((vehicle: any) => (
                  <View key={vehicle.id} style={styles.itemContainer}>
                    <Text style={styles.itemTitle}>{vehicle.make} {vehicle.model} ({vehicle.license_plate})</Text>
                    <Text style={{ color: theme.text }}>Year: {vehicle.year}</Text>
                    <Text style={{ color: theme.text }}>Capacity: {vehicle.capacity} {vehicle.capacity_unit || 'kg'}</Text>
                    <Text style={{ color: theme.text }}>Operational: {vehicle.active ? 'Active' : 'Inactive'}</Text>
                    <Text style={{ color: theme.text }}>
                      Approval: {VEHICLE_APPROVAL_LABELS[vehicle.approval_status as VehicleApprovalStatus] || vehicle.approval_status || 'Unknown'}
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <View style={{ flex: 1, marginRight: 4 }}>
                        <Button title="View" onPress={() => handleSelect(vehicle)} />
                      </View>
                      <View style={{ flex: 1, marginRight: 4 }}>
                        <Button title="Edit" onPress={() => handleEdit(vehicle)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {vehicle.active ? (
                          <Button title="Deactivate" color="#f0ad4e" onPress={() => handleDeactivate(vehicle)} />
                        ) : (
                          <Button title="Reactivate" color="#5cb85c" onPress={() => handleReactivate(vehicle)} />
                        )}
                      </View>
                    </View>
                    {vehicle.active && (
                      <View style={{ marginTop: 4 }}>
                        <Button title="Delete (no history only)" color="#d9534f" onPress={() => handleDelete(vehicle)} />
                      </View>
                    )}
                  </View>
                ))}
              </AdminFilteredListMeta>
            )}
          </View>
        </ScrollView>
      );
    }
    if (mode === 'create' || mode === 'edit') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{mode === 'create' ? 'Add Vehicle' : 'Edit Vehicle'}</Text>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

            {mode === 'create' ? (
              <>
                <Text style={styles.sectionTitle}>Vehicle catalog</Text>
                <VehicleCatalogFields
                  apiBase={API_BASE}
                  vehicleModelSpecId={form.vehicle_model_spec_id}
                  vehicleYear={form.year === 0 ? 0 : form.year}
                  onSpecChange={handleCatalogSpecChange}
                  onCatalogCapacityChange={(maxPayloadLb) => {
                    setCapacityText(String(maxPayloadLb));
                    setForm((f: typeof form) => ({ ...f, capacity_unit: 'lb' }));
                  }}
                  theme={theme}
                  styles={styles}
                />
              </>
            ) : null}

            <Text style={styles.label}>License Plate *</Text>
            <TextInput style={styles.input} value={form.license_plate} onChangeText={t => setForm((f: typeof form) => ({ ...f, license_plate: t.toUpperCase() }))} placeholderTextColor={theme.placeholder} placeholder="Enter license plate" autoCapitalize="characters" />

            <Text style={styles.label}>Make *</Text>
            <TextInput style={styles.input} value={form.make} onChangeText={t => setForm((f: typeof form) => ({ ...f, make: t }))} placeholderTextColor={theme.placeholder} placeholder="e.g., Ford, Toyota" />

            <Text style={styles.label}>Model *</Text>
            <TextInput style={styles.input} value={form.model} onChangeText={t => setForm((f: typeof form) => ({ ...f, model: t }))} placeholderTextColor={theme.placeholder} placeholder="e.g., Transit, Hiace" />

            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              value={form.year === 0 ? '' : form.year.toString()}
              onChangeText={(text) => {
                // Allow empty input while typing
                if (text === '') {
                  setForm((f: typeof form) => ({ ...f, year: 0 }));
                  return;
                }

                // Only allow numeric characters
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 4) {
                  const year = parseInt(numericText);
                  if (!isNaN(year) && year >= 1900 && year <= 2100) {
                    setForm((f: typeof form) => ({ ...f, year }));
                  } else if (numericText.length > 0) {
                    // Allow partial input while typing
                    const partialYear = parseInt(numericText);
                    if (!isNaN(partialYear)) {
                      setForm((f: typeof form) => ({ ...f, year: partialYear }));
                    }
                  }
                }
              }}
              placeholderTextColor={theme.placeholder} placeholder="Enter year"
              keyboardType="numeric"
              maxLength={4}
            />

            <Text style={styles.label}>VIN *</Text>
            <TextInput style={styles.input} value={form.vin} onChangeText={t => setForm((f: typeof form) => ({ ...f, vin: t.toUpperCase() }))} placeholderTextColor={theme.placeholder} placeholder="17 characters" autoCapitalize="characters" maxLength={17} />

            <VehicleCapacityFields
              capacityUnit={form.capacity_unit || 'kg'}
              capacityText={capacityText}
              capacityFieldError={capacityFieldError}
              onCapacityTextChange={handleCapacityChange}
              onSwitchUnit={switchCapacityUnit}
            />
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Active Vehicle</Text>
              <Switch value={form.active} onValueChange={v => setForm((f: typeof form) => ({ ...f, active: v }))} />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title={mode === 'create' ? 'Create' : 'Update'}
                onPress={mode === 'create' ? handleCreate : handleUpdate}
                disabled={localLoading || !capacityText || !!capacityFieldError}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    if (mode === 'detail' && selected) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Vehicle Detail</Text>
            <Text style={styles.itemTitle}>{selected.make} {selected.model}</Text>
            <Text style={{ color: theme.text }}>License Plate: {selected.license_plate}</Text>
            <Text style={{ color: theme.text }}>Year: {selected.year}</Text>
            <Text style={{ color: theme.text }}>VIN: {selected.vin}</Text>
            <Text style={{ color: theme.text }}>Capacity: {selected.capacity} {selected.capacity_unit || 'kg'}</Text>
            <Text style={{ color: theme.text }}>Operational: {selected.active ? 'Active' : 'Inactive'}</Text>
            <Text style={{ color: theme.text }}>
              Approval: {VEHICLE_APPROVAL_LABELS[selected.approval_status as VehicleApprovalStatus] || selected.approval_status || 'Unknown'}
            </Text>
            {selected.resubmit_reason ? (
              <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
                Resubmit note: {selected.resubmit_reason}
              </Text>
            ) : null}
            {(selected.approval_status === 'PENDING' || selected.approval_status === 'RESUBMIT') ? (
              <View style={styles.buttonContainer}>
                <Button title="Approve vehicle" color="#5cb85c" onPress={() => handleApproveVehicle(selected)} />
              </View>
            ) : null}
            {selected.approval_status === 'APPROVED' ? (
              <>
                <Text style={styles.label}>Request driver resubmit</Text>
                <TextInput
                  style={styles.input}
                  value={resubmitReason}
                  onChangeText={setResubmitReason}
                  placeholderTextColor={theme.placeholder}
                  placeholder="Tell the driver which field(s) to fix"
                  multiline
                />
                <View style={styles.buttonContainer}>
                  <Button
                    title="Send resubmit request"
                    color="#f0ad4e"
                    onPress={() => handleRequestVehicleResubmit(selected)}
                  />
                </View>
              </>
            ) : null}
            <ComplianceDocumentsPanel
              subjectType="vehicle"
              subjectId={selected.id}
              request={makeAuthenticatedRequest}
              isAdmin
              canUpload
              theme={theme}
              styles={styles}
              title="Legal documents - Vehicle"
              subtitle={`Vehicle: ${selected.make} ${selected.model} (${selected.license_plate})`}
              onDocumentsChanged={async () => {
                try {
                  const status = await getVehicleComplianceStatus(makeAuthenticatedRequest, selected.id);
                  setVehicleCompliance(status);
                } catch {
                  setVehicleCompliance(null);
                }
              }}
            />
            {!selected.active && (
              <VehicleReactivationChecklist
                status={vehicleCompliance}
                loading={complianceLoading}
                theme={theme}
                styles={styles}
              />
            )}
            <View style={styles.buttonContainer}>
              {selected.approval_status !== 'APPROVED' ? (
                <Button title="Edit" onPress={() => handleEdit(selected)} />
              ) : (
                <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
                  Approved vehicle identity cannot be edited here. Use resubmit request above.
                </Text>
              )}
            </View>
            <View style={styles.buttonContainer}>
              {selected.active ? (
                <Button title="Deactivate" color="#f0ad4e" onPress={() => handleDeactivate(selected)} />
              ) : (
                <Button
                  title="Reactivate"
                  color="#5cb85c"
                  onPress={() => handleReactivate(selected)}
                  disabled={vehicleCompliance !== null && !vehicleCompliance.may_reactivate}
                />
              )}
            </View>
            {selected.active && (
              <View style={styles.buttonContainer}>
                <Button title="Delete (no history only)" color="#d9534f" onPress={() => handleDelete(selected)} />
              </View>
            )}
            <View style={styles.buttonContainer}>
              <Button title="Back to List" onPress={() => { setMode('list'); setSelected(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }
    // fallback
    return (
      <View style={styles.container}><Text style={{ color: theme.text }}>Invalid state</Text></View>
    );
  }
