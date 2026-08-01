import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { createDeliveryAssignment } from '../services/assignmentService';
import type { DispatchEligibility } from '../services/complianceService';
import { COMPLIANCE_BLOCKER_LABELS, getDriverDispatchEligibility } from '../services/complianceService';
import { theme, styles } from '../theme';
import type { AuthenticatedRequest } from './types';

export interface AdminDeliveriesScreenProps {
  onBack: () => void;
  deliveries: any[];
  drivers: any[];
  assignments: any[];
  loadDeliveries: () => Promise<void>;
  loadAssignments: () => Promise<void>;
  makeAuthenticatedRequest: AuthenticatedRequest;
  createDelivery: (data: any) => Promise<void>;
  updateDelivery: (id: any, data: any) => Promise<void>;
  deleteDelivery: (id: any) => Promise<void>;
}

  export function AdminDeliveriesScreen({ onBack, deliveries, drivers, assignments, loadDeliveries, loadAssignments, makeAuthenticatedRequest, createDelivery, updateDelivery, deleteDelivery }: AdminDeliveriesScreenProps) {
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [selected, setSelected] = useState<any>(null);
    const [form, setForm] = useState<any>({
      customer_name: '', customer_address: '', pickup_location: '', dropoff_location: '',
      item_description: '', status: 'Pending', same_pickup_as_customer: false, use_preferred_pickup: false
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [assignDriverId, setAssignDriverId] = useState<string>('');
    const [dispatchEligibility, setDispatchEligibility] = useState<DispatchEligibility | null>(null);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const existingAssignment = selected
      ? assignments.find((row: any) => row.delivery === selected.id)
      : null;

    const loadDispatchEligibility = async (driverId: string) => {
      if (!driverId) {
        setDispatchEligibility(null);
        return;
      }
      setEligibilityLoading(true);
      try {
        const result = await getDriverDispatchEligibility(
          makeAuthenticatedRequest,
          parseInt(driverId, 10),
        );
        setDispatchEligibility(result);
        setError(null);
      } catch (e) {
        setDispatchEligibility(null);
        setError(e instanceof Error ? e.message : 'Could not load dispatch eligibility');
      }
      setEligibilityLoading(false);
    };

    const handleAssignDriver = async () => {
      if (!selected || !assignDriverId) {
        setError('Select a driver to assign');
        return;
      }
      if (dispatchEligibility && !dispatchEligibility.eligible) {
        setError('Driver is not eligible for dispatch');
        return;
      }
      setAssigning(true);
      setError(null);
      try {
        await createDeliveryAssignment(makeAuthenticatedRequest, {
          delivery: selected.id,
          driver: parseInt(assignDriverId, 10),
        });
        await loadAssignments();
        Alert.alert('Success', 'Driver assigned to delivery.');
        setAssignDriverId('');
        setDispatchEligibility(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Assignment failed');
      }
      setAssigning(false);
    };

    // Handlers
    const handleSelect = (delivery: any) => {
      setSelected(delivery);
      setMode('detail');
    };
    const handleEdit = (delivery: any) => {
      setSelected(delivery);
      setForm({
        customer_name: delivery.customer_name || '',
        customer_address: delivery.customer_address || '',
        pickup_location: delivery.pickup_location || '',
        dropoff_location: delivery.dropoff_location || '',
        item_description: delivery.item_description || '',
        status: delivery.status || 'Pending',
        same_pickup_as_customer: delivery.same_pickup_as_customer || false,
        use_preferred_pickup: delivery.use_preferred_pickup || false
      });
      setMode('edit');
    };
    const handleDelete = async (delivery: any) => {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this delivery?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setLocalLoading(true);
            try {
              await deleteDelivery(delivery.id);
              setMode('list');
              setSelected(null);
              await loadDeliveries();
            } catch (e) {
              setError('Failed to delete delivery');
            }
            setLocalLoading(false);
          }
        }
      ]);
    };
    const handleCreate = async () => {
      setLocalLoading(true);
      setError(null);
      try {
        await createDelivery(form);
        setMode('list');
        setForm({
          customer_name: '', customer_address: '', pickup_location: '', dropoff_location: '',
          item_description: '', status: 'Pending', same_pickup_as_customer: false, use_preferred_pickup: false
        });
        await loadDeliveries();
      } catch (e) {
        setError('Failed to create delivery');
      }
      setLocalLoading(false);
    };
    const handleUpdate = async () => {
      if (!selected) return;
      setLocalLoading(true);
      setError(null);
      try {
        await updateDelivery(selected.id, form);
        setMode('list');
        setSelected(null);
        await loadDeliveries();
      } catch (e) {
        setError('Failed to update delivery');
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
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>📦 Admin Deliveries</Text>
            </View>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
            <View style={styles.buttonContainer}>
              <Button title="Add Delivery" onPress={() => { setMode('create'); setForm({ customer_name: '', customer_address: '', pickup_location: '', dropoff_location: '', item_description: '', status: 'Pending', same_pickup_as_customer: false, use_preferred_pickup: false }); }} />
            </View>
            {localLoading ? <ActivityIndicator /> : deliveries.length === 0 ? (
              <Text style={styles.emptyText}>No deliveries found.</Text>
            ) : (
              deliveries.map((delivery: any) => (
                <View key={delivery.id} style={styles.itemContainer}>
                  <Text style={styles.itemTitle}>{delivery.customer_name}</Text>
                  <Text style={{ color: theme.text }}>From: {delivery.pickup_location}</Text>
                  <Text style={{ color: theme.text }}>To: {delivery.dropoff_location}</Text>
                  <Text style={{ color: theme.text }}>Status: {delivery.status}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="View" onPress={() => handleSelect(delivery)} />
                    </View>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button title="Edit" onPress={() => handleEdit(delivery)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button title="Delete" color="#d9534f" onPress={() => handleDelete(delivery)} />
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      );
    }
    if (mode === 'create' || mode === 'edit') {
      const statusOptions = ['Pending', 'En Route', 'Completed', 'Cancelled'];
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{mode === 'create' ? 'Add Delivery' : 'Edit Delivery'}</Text>
            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
            <TextInput style={styles.input} value={form.customer_name} onChangeText={t => setForm((f: typeof form) => ({ ...f, customer_name: t }))} placeholderTextColor={theme.placeholder} placeholder="Customer Name *" />
            <TextInput style={styles.input} value={form.customer_address} onChangeText={t => setForm((f: typeof form) => ({ ...f, customer_address: t }))} placeholderTextColor={theme.placeholder} placeholder="Customer Address *" />
            <TextInput style={styles.input} value={form.pickup_location} onChangeText={t => setForm((f: typeof form) => ({ ...f, pickup_location: t }))} placeholderTextColor={theme.placeholder} placeholder="Pickup Location *" />
            <TextInput style={styles.input} value={form.dropoff_location} onChangeText={t => setForm((f: typeof form) => ({ ...f, dropoff_location: t }))} placeholderTextColor={theme.placeholder} placeholder="Dropoff Location *" />
            <TextInput style={[styles.input, styles.multilineInput]} value={form.item_description} onChangeText={t => setForm((f: typeof form) => ({ ...f, item_description: t }))} placeholderTextColor={theme.placeholder} placeholder="Item Description" multiline numberOfLines={3} />
            <Text style={styles.sectionTitle}>Status</Text>
            {statusOptions.map(status => (
              <View key={status} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ flex: 1, color: theme.text }}>{status}</Text>
                <Switch value={form.status === status} onValueChange={() => setForm((f: typeof form) => ({ ...f, status }))} />
              </View>
            ))}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Same pickup as customer address</Text>
              <Switch value={form.same_pickup_as_customer} onValueChange={v => setForm((f: typeof form) => ({ ...f, same_pickup_as_customer: v }))} />
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Use preferred pickup address</Text>
              <Switch value={form.use_preferred_pickup} onValueChange={v => setForm((f: typeof form) => ({ ...f, use_preferred_pickup: v }))} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title={mode === 'create' ? 'Create' : 'Update'} onPress={mode === 'create' ? handleCreate : handleUpdate} disabled={localLoading} />
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
            <Text style={styles.title}>Delivery Detail</Text>
            <Text style={styles.itemTitle}>{selected.customer_name}</Text>
            <Text style={{ color: theme.text }}>Customer Address: {selected.customer_address}</Text>
            <Text style={{ color: theme.text }}>Pickup: {selected.pickup_location}</Text>
            <Text style={{ color: theme.text }}>Dropoff: {selected.dropoff_location}</Text>
            <Text style={{ color: theme.text }}>Item: {selected.item_description}</Text>
            <Text style={{ color: theme.text }}>Status: {selected.status}</Text>
            <Text style={{ color: theme.text }}>Created: {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Assign driver</Text>
            {existingAssignment ? (
              <>
                <Text style={{ color: theme.text }}>
                  Assigned: {existingAssignment.driver_name || `Driver #${existingAssignment.driver}`}
                </Text>
                {existingAssignment.vehicle_license_plate ? (
                  <Text style={{ color: theme.text }}>
                    Vehicle: {existingAssignment.vehicle_license_plate}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
                  Only compliant drivers (verified license, registration, insurance) can be assigned.
                </Text>
                {drivers.length === 0 ? (
                  <Text style={{ color: theme.textMuted }}>No drivers loaded.</Text>
                ) : (
                  drivers.map((driver: any) => (
                    <Button
                      key={driver.id}
                      title={`${assignDriverId === driver.id.toString() ? '✓ ' : ''}${driver.first_name} ${driver.last_name}`}
                      onPress={() => {
                        const id = driver.id.toString();
                        setAssignDriverId(id);
                        loadDispatchEligibility(id);
                      }}
                    />
                  ))
                )}
                {eligibilityLoading ? (
                  <ActivityIndicator size="small" color={theme.border} style={{ marginTop: 8 }} />
                ) : null}
                {dispatchEligibility ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{
                      color: dispatchEligibility.eligible ? '#5cb85c' : theme.error,
                      fontWeight: '600',
                    }}>
                      {dispatchEligibility.eligible
                        ? 'Eligible for dispatch'
                        : 'Not eligible for dispatch'}
                    </Text>
                    {!dispatchEligibility.eligible && dispatchEligibility.blockers.length > 0 ? (
                      dispatchEligibility.blockers.map((code) => (
                        <Text key={code} style={{ color: theme.error }}>
                          • {COMPLIANCE_BLOCKER_LABELS[code] || code}
                        </Text>
                      ))
                    ) : null}
                  </View>
                ) : null}
                <View style={styles.buttonContainer}>
                  <Button
                    title={assigning ? 'Assigning…' : 'Assign driver to delivery'}
                    onPress={handleAssignDriver}
                    disabled={
                      assigning
                      || !assignDriverId
                      || eligibilityLoading
                      || (dispatchEligibility !== null && !dispatchEligibility.eligible)
                    }
                  />
                </View>
              </>
            )}

            {error ? <Text style={{ color: theme.error, marginTop: 8 }}>{error}</Text> : null}
            <View style={styles.buttonContainer}>
              <Button title="Edit" onPress={() => handleEdit(selected)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Delete" color="#d9534f" onPress={() => handleDelete(selected)} />
            </View>
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
