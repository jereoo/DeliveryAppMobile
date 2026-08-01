import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { AdminDriverListFilters } from '../components/AdminDriverListFilters';
import { ComplianceDocumentsPanel } from '../components/ComplianceDocumentsPanel';
import { approveDriver, DEFAULT_ADMIN_DRIVER_LIST_FILTERS, DRIVER_APPROVAL_LABELS, filterAndSortAdminDrivers, rejectDriver, type AdminDriverListFilters as AdminDriverListFiltersState, type DriverApprovalStatus } from '../services/driverService';
import { theme, styles } from '../theme';
import { formatPhone10, formatPhoneForDisplay, getPhoneDigits } from '../utils/phoneFormatting';
import type { AuthenticatedRequest } from './types';

export interface AdminDriversScreenProps {
  onBack: () => void;
  drivers: any[];
  loadDrivers: () => Promise<void>;
  makeAuthenticatedRequest: AuthenticatedRequest;
  createDriver: (data: any) => Promise<void>;
  updateDriver: (id: any, data: any) => Promise<void>;
  deleteDriver: (id: any) => Promise<void>;
}

  export function AdminDriversScreen({ onBack, drivers, loadDrivers, makeAuthenticatedRequest, createDriver, updateDriver, deleteDriver }: AdminDriversScreenProps) {
    console.log('[DEBUG] AdminDriversScreen: Component initialized/re-initialized');
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      phone_number: '',
      license_number: '',
      active: true
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [approvalActionLoading, setApprovalActionLoading] = useState(false);
    const [listFilters, setListFilters] = useState<AdminDriverListFiltersState>(
      DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
    );

    const filteredDrivers = useMemo(
      () => filterAndSortAdminDrivers(drivers, listFilters),
      [drivers, listFilters],
    );

    const handleApproveDriver = async (driver: any) => {
      setApprovalActionLoading(true);
      setError(null);
      try {
        const updated = await approveDriver(makeAuthenticatedRequest, driver.id);
        await loadDrivers();
        setSelectedDriver(updated);
        Alert.alert('Approved', `${driver.first_name} ${driver.last_name} can now be assigned deliveries.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Approve failed');
      }
      setApprovalActionLoading(false);
    };

    const handleRejectDriver = async (driver: any) => {
      if (!showRejectForm) {
        setShowRejectForm(true);
        setRejectReason('');
        setError(null);
        return;
      }
      if (!rejectReason.trim()) {
        setError('Rejection reason is required');
        return;
      }
      setApprovalActionLoading(true);
      setError(null);
      try {
        const updated = await rejectDriver(makeAuthenticatedRequest, driver.id, rejectReason.trim());
        await loadDrivers();
        setSelectedDriver(updated);
        setShowRejectForm(false);
        setRejectReason('');
        Alert.alert('Rejected', 'Driver registration was rejected.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Reject failed');
      }
      setApprovalActionLoading(false);
    };

    // Note: Drivers are loaded by parent component, no need for useEffect here

    const resetForm = () => {
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        license_number: '',
        active: true
      });
      setError(null);
    };

    const handleCreate = async () => {
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.license_number.trim()) {
        setError('First name, last name, and license number are required');
        return;
      }
      const phoneDigits = getPhoneDigits(formData.phone_number);
      if (phoneDigits.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return;
      }

      setLocalLoading(true);
      try {
        const payload = { ...formData, phone_number: getPhoneDigits(formData.phone_number) };
        await createDriver(payload);
        await loadDrivers();
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Driver created successfully!');
      } catch (e) {
        setError('Failed to create driver: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleUpdate = async () => {
      if (!selectedDriver || !formData.first_name.trim() || !formData.last_name.trim() || !formData.license_number.trim()) {
        setError('First name, last name, and license number are required');
        return;
      }
      const phoneDigits = getPhoneDigits(formData.phone_number);
      if (phoneDigits.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return;
      }

      setLocalLoading(true);
      try {
        const payload = { ...formData, phone_number: getPhoneDigits(formData.phone_number) };
        await updateDriver(selectedDriver.id, payload);
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Driver updated successfully!');
      } catch (e) {
        setError('Failed to update driver: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleDelete = (driver: any) => {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete driver "${driver.first_name} ${driver.last_name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLocalLoading(true);
              try {
                await deleteDriver(driver.id);
                await loadDrivers();
                Alert.alert('Success', 'Driver deleted successfully!');
              } catch (e) {
                setError('Failed to delete driver: ' + (e instanceof Error ? e.message : 'Unknown error'));
              }
              setLocalLoading(false);
            }
          }
        ]
      );
    };

    const handleEdit = (driver: any) => {
      setSelectedDriver(driver);
      setFormData({
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        phone_number: formatPhoneForDisplay(driver.phone_number || ''),
        license_number: driver.license_number || '',
        active: driver.active ?? true
      });
      setMode('edit');
    };

    const handleDetail = (driver: any) => {
      setSelectedDriver(driver);
      setShowRejectForm(false);
      setRejectReason('');
      setMode('detail');
    };

    const refreshDrivers = async () => {
      console.log('[DEBUG] AdminDriversScreen: Manual refresh triggered');
      if (localLoading) {
        console.log('[DEBUG] AdminDriversScreen: Already loading, skipping refresh');
        return;
      }

      setLocalLoading(true);
      setError(null);
      try {
        await loadDrivers();
        console.log('[DEBUG] AdminDriversScreen: Manual refresh completed, drivers count:', drivers.length);
      } catch (e) {
        console.error('[DEBUG] AdminDriversScreen: Failed to refresh drivers:', e);
        setError('Failed to load drivers: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    if (mode === 'create' || mode === 'edit') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Cancel" onPress={() => { setMode('list'); resetForm(); }} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>
                {mode === 'create' ? 'Add Driver' : 'Edit Driver'}
              </Text>
            </View>

            {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="Enter first name"
              value={formData.first_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="Enter last name"
              value={formData.last_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
            />

            <Text style={styles.label}>Phone Number (10 digits, no area code)</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="(555) 555-5555"
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: formatPhone10(text) }))}
              keyboardType="phone-pad"
              maxLength={14}
            />

            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="Enter license number"
              value={formData.license_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, license_number: text }))}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.label}>Active: </Text>
              <Button
                title={formData.active ? 'Yes' : 'No'}
                onPress={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
              />
            </View>

            <View style={styles.buttonContainer}>
              {localLoading ? (
                <ActivityIndicator size="large" color="#0066CC" />
              ) : (
                <>
                  <Button
                    title={mode === 'create' ? 'Create Driver' : 'Update Driver'}
                    onPress={mode === 'create' ? handleCreate : handleUpdate}
                  />
                  <Button title="Cancel" onPress={() => { setMode('list'); resetForm(); }} />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      );
    }

    if (mode === 'detail' && selectedDriver) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={() => setMode('list')} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Driver Detail</Text>
              <Button title="Edit" onPress={() => handleEdit(selectedDriver)} />
            </View>

            <Text style={styles.itemTitle}>{selectedDriver.first_name} {selectedDriver.last_name}</Text>
            <Text style={{ color: theme.text }}>License: {selectedDriver.license_number}</Text>
            {selectedDriver.phone_number && <Text style={{ color: theme.text }}>Phone: {formatPhoneForDisplay(selectedDriver.phone_number)}</Text>}
            <Text style={{ color: theme.text }}>
              Account: {selectedDriver.active ? 'Active' : 'Inactive'}
            </Text>
            <Text style={{
              color: selectedDriver.approval_status === 'APPROVED'
                ? '#5cb85c'
                : selectedDriver.approval_status === 'PENDING'
                  ? '#f0ad4e'
                  : theme.error,
              fontWeight: '600',
            }}>
              Approval: {DRIVER_APPROVAL_LABELS[selectedDriver.approval_status as DriverApprovalStatus]
                || selectedDriver.approval_status
                || 'Approved'}
            </Text>
            {selectedDriver.approval_rejection_reason ? (
              <Text style={{ color: theme.error }}>
                Rejected: {selectedDriver.approval_rejection_reason}
              </Text>
            ) : null}
            {selectedDriver.approval_status === 'PENDING' ? (
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <Button
                    title={approvalActionLoading ? 'Approving…' : 'Approve driver'}
                    onPress={() => handleApproveDriver(selectedDriver)}
                    disabled={approvalActionLoading}
                  />
                  <Button
                    title={showRejectForm ? 'Confirm reject' : 'Reject'}
                    color="#d9534f"
                    onPress={() => handleRejectDriver(selectedDriver)}
                    disabled={approvalActionLoading}
                  />
                </View>
                {showRejectForm ? (
                  <>
                    <Text style={[styles.label, { marginTop: 8 }]}>Rejection reason</Text>
                    <TextInput
                      style={styles.input}
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      placeholder="Reason for rejection"
                      placeholderTextColor={theme.textMuted}
                    />
                    <Button title="Cancel" onPress={() => { setShowRejectForm(false); setRejectReason(''); }} />
                  </>
                ) : null}
              </View>
            ) : null}

            {selectedDriver.current_vehicle && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionTitle}>Current Vehicle</Text>
                <Text style={{ color: theme.text }}>Plate: {selectedDriver.current_vehicle_plate}</Text>
                <Text style={{ color: theme.text }}>Vehicle: {selectedDriver.current_vehicle}</Text>
              </View>
            )}

            <ComplianceDocumentsPanel
              subjectType="driver"
              subjectId={selectedDriver.id}
              request={makeAuthenticatedRequest}
              isAdmin
              canUpload
              theme={theme}
              styles={styles}
              title="Legal documents - Driver"
            />
            {selectedDriver.current_vehicle ? (
              <ComplianceDocumentsPanel
                subjectType="vehicle"
                subjectId={selectedDriver.current_vehicle}
                request={makeAuthenticatedRequest}
                isAdmin
                canUpload
                theme={theme}
                styles={styles}
                title="Legal documents - Vehicle"
                subtitle={
                  selectedDriver.current_vehicle_plate
                    ? `Assigned vehicle: ${selectedDriver.current_vehicle_model || 'Vehicle'} (${selectedDriver.current_vehicle_plate})`
                    : 'Assigned vehicle'
                }
              />
            ) : null}

            <View style={styles.buttonContainer}>
              <Button title="Edit Driver" onPress={() => handleEdit(selectedDriver)} />
              <Button
                title="Delete Driver"
                onPress={() => handleDelete(selectedDriver)}
                color="red"
              />
              <Button title="Back to List" onPress={() => { setMode('list'); setSelectedDriver(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }

    console.log('[DEBUG] AdminDriversScreen: Rendering list mode');
    console.log('[DEBUG] AdminDriversScreen: localLoading:', localLoading);
    console.log('[DEBUG] AdminDriversScreen: drivers.length:', drivers.length);
    console.log('[DEBUG] AdminDriversScreen: error:', error);
    console.log('[DEBUG] AdminDriversScreen: Component re-render count:', Date.now());

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🚚 Drivers</Text>
            <Button title="+" onPress={() => { resetForm(); setMode('create'); }} />
          </View>

          <Button title="🔄 Refresh" onPress={refreshDrivers} />

          <AdminDriverListFilters
            drivers={drivers}
            filters={listFilters}
            onChange={setListFilters}
            theme={theme}
            styles={styles}
          />

          {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

          {localLoading ? (
            <ActivityIndicator size="large" color="#0066CC" />
          ) : drivers.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={styles.emptyText}>No drivers found.</Text>
              <Text style={styles.infoText}>Add your first driver to get started!</Text>
            </View>
          ) : filteredDrivers.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={styles.emptyText}>No drivers match the current filters.</Text>
              <View style={{ marginTop: 8 }}>
                <Button title="Clear filters" onPress={() => setListFilters(DEFAULT_ADMIN_DRIVER_LIST_FILTERS)} />
              </View>
            </View>
          ) : (
            <>
              <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
                Showing {filteredDrivers.length} of {drivers.length} drivers
              </Text>
              {filteredDrivers.map((driver: any) => (
              <View key={driver.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{driver.first_name} {driver.last_name}</Text>
                <Text style={{ color: theme.text }}>License: {driver.license_number}</Text>
                {driver.phone_number && <Text style={{ color: theme.text }}>Phone: {formatPhoneForDisplay(driver.phone_number)}</Text>}
                <Text style={{ color: theme.text }}>
                  Account: <Text style={{ color: driver.active ? 'green' : 'red' }}>
                    {driver.active ? 'Active' : 'Inactive'}
                  </Text>
                </Text>
                <Text style={{
                  color: driver.approval_status === 'APPROVED'
                    ? '#5cb85c'
                    : driver.approval_status === 'PENDING'
                      ? '#f0ad4e'
                      : theme.error,
                }}>
                  Approval: {DRIVER_APPROVAL_LABELS[driver.approval_status as DriverApprovalStatus]
                    || driver.approval_status
                    || 'Approved'}
                </Text>
                {driver.current_vehicle_plate && (
                  <Text style={{ color: theme.text }}>Vehicle: {driver.current_vehicle_plate}</Text>
                )}
                {driver.current_vehicle_model && (
                  <Text style={{ color: theme.text }}>Model: {driver.current_vehicle_model}</Text>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                  <Button title="View" onPress={() => handleDetail(driver)} />
                  <Button title="Edit" onPress={() => handleEdit(driver)} />
                  <Button title="Delete" onPress={() => handleDelete(driver)} color="red" />
                </View>
              </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    );
  }
