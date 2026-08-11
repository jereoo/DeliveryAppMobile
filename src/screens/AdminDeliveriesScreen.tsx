import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { AdminDeliveryListFilters } from '../components/AdminDeliveryListFilters';
import { AdminFilteredListMeta } from '../components/AdminFilteredListMeta';
import { createDeliveryAssignment } from '../services/assignmentService';
import type { DispatchEligibility } from '../services/complianceService';
import { COMPLIANCE_BLOCKER_LABELS, getDriverDispatchEligibility } from '../services/complianceService';
import {
  adminDeliveryFiltersAreActive,
  buildDeliveryAdminPayload,
  DEFAULT_ADMIN_DELIVERY_LIST_FILTERS,
  filterAndSortAdminDeliveries,
  type AdminDeliveryListFilters as AdminDeliveryListFiltersState,
} from '../services/deliveryService';
import { theme, styles } from '../theme';
import type { AuthenticatedRequest } from './types';

const emptyDeliveryForm = () => ({
  customer: null as number | null,
  pickup_location: '',
  dropoff_location: '',
  item_description: '',
  status: 'Pending',
  same_pickup_as_customer: false,
  use_preferred_pickup: false,
  same_dropoff_as_customer: false,
  delivery_date: '',
  delivery_time: '',
  special_instructions: '',
  estimated_cost: '',
});

export interface AdminDeliveriesScreenProps {
  onBack: () => void;
  deliveries: any[];
  customers: any[];
  drivers: any[];
  assignments: any[];
  loadDeliveries: () => Promise<void>;
  loadAssignments: () => Promise<void>;
  makeAuthenticatedRequest: AuthenticatedRequest;
  createDelivery: (data: any) => Promise<void>;
  updateDelivery: (id: any, data: any) => Promise<void>;
  deleteDelivery: (id: any) => Promise<void>;
}

export function AdminDeliveriesScreen({
  onBack,
  deliveries,
  customers,
  drivers,
  assignments,
  loadDeliveries,
  loadAssignments,
  makeAuthenticatedRequest,
  createDelivery,
  updateDelivery,
  deleteDelivery,
}: AdminDeliveriesScreenProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyDeliveryForm());
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState<string>('');
  const [dispatchEligibility, setDispatchEligibility] = useState<DispatchEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [listFilters, setListFilters] = useState<AdminDeliveryListFiltersState>(
    DEFAULT_ADMIN_DELIVERY_LIST_FILTERS,
  );

  const filteredDeliveries = useMemo(
    () => filterAndSortAdminDeliveries(deliveries, listFilters),
    [deliveries, listFilters],
  );

  const selectedCustomer = customers.find((c) => c.id === form.customer);

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

  const handleSelect = (delivery: any) => {
    setSelected(delivery);
    setMode('detail');
  };

  const handleEdit = (delivery: any) => {
    setSelected(delivery);
    setForm({
      customer: delivery.customer ?? null,
      pickup_location: delivery.pickup_location || '',
      dropoff_location: delivery.dropoff_location || '',
      item_description: delivery.item_description || '',
      status: delivery.status || 'Pending',
      same_pickup_as_customer: delivery.same_pickup_as_customer || false,
      use_preferred_pickup: delivery.use_preferred_pickup || false,
      same_dropoff_as_customer: delivery.same_dropoff_as_customer || false,
      delivery_date: delivery.delivery_date || '',
      delivery_time: delivery.delivery_time || '',
      special_instructions: delivery.special_instructions || '',
      estimated_cost: delivery.estimated_cost != null ? String(delivery.estimated_cost) : '',
    });
    setMode('edit');
  };

  const handleDelete = async (delivery: any) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLocalLoading(true);
          try {
            await deleteDelivery(delivery.id);
            setMode('list');
            setSelected(null);
            await loadDeliveries();
          } catch {
            setError('Failed to delete delivery');
          }
          setLocalLoading(false);
        },
      },
    ]);
  };

  const validateForm = () => {
    if (!form.customer) {
      setError('Select a customer');
      return false;
    }
    if (!form.dropoff_location?.trim() && !form.same_dropoff_as_customer) {
      setError('Dropoff location is required unless using customer address');
      return false;
    }
    if (!form.pickup_location?.trim() && !form.same_pickup_as_customer && !form.use_preferred_pickup) {
      setError('Pickup location is required unless using customer address shortcuts');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setLocalLoading(true);
    setError(null);
    try {
      await createDelivery(buildDeliveryAdminPayload(form));
      setMode('list');
      setForm(emptyDeliveryForm());
      await loadDeliveries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create delivery');
    }
    setLocalLoading(false);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    if (!validateForm()) return;
    setLocalLoading(true);
    setError(null);
    try {
      await updateDelivery(selected.id, buildDeliveryAdminPayload(form));
      setMode('list');
      setSelected(null);
      await loadDeliveries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update delivery');
    }
    setLocalLoading(false);
  };

  const renderFormFields = () => (
    <>
      <Text style={styles.sectionTitle}>Customer *</Text>
      <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
        Tap a customer below to select them.
      </Text>
      {customers.length === 0 ? (
        <Text style={{ color: theme.textMuted, marginBottom: 10 }}>No customers loaded.</Text>
      ) : (
        customers.map((customer: any) => {
          const label = customer.display_name || customer.full_name || customer.username;
          const selected = form.customer === customer.id;
          return (
            <Pressable
              key={customer.id}
              onPress={() => setForm((f) => ({ ...f, customer: customer.id }))}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                marginBottom: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selected ? theme.border : theme.textMuted,
                backgroundColor: selected ? '#1e3a5f' : 'transparent',
              }}
            >
              <Text style={{ color: theme.text, fontWeight: selected ? '700' : '400' }}>
                {selected ? '✓ ' : ''}{label}
              </Text>
            </Pressable>
          );
        })
      )}
      {selectedCustomer ? (
        <Text style={{ color: theme.textMuted, marginVertical: 8 }}>
          {selectedCustomer.full_address || selectedCustomer.email || ''}
        </Text>
      ) : null}

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Same pickup as customer address</Text>
        <Switch
          value={form.same_pickup_as_customer}
          onValueChange={(v) => setForm((f) => ({ ...f, same_pickup_as_customer: v }))}
        />
      </View>
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Use preferred pickup address</Text>
        <Switch
          value={form.use_preferred_pickup}
          onValueChange={(v) => setForm((f) => ({ ...f, use_preferred_pickup: v }))}
        />
      </View>
      {!form.same_pickup_as_customer && !form.use_preferred_pickup ? (
        <>
          <Text style={styles.label}>Pickup location *</Text>
          <AddressAutocomplete
            placeholder="Pickup location"
            initialValue={form.pickup_location}
            countryHint="US"
            onAddressSelected={(result) => {
              setForm((f) => ({
                ...f,
                pickup_location: result.formatted_address || result.normalized_address || '',
              }));
            }}
            onValidationStatusChange={() => {}}
          />
          <TextInput
            style={styles.input}
            value={form.pickup_location}
            onChangeText={(t) => setForm((f) => ({ ...f, pickup_location: t }))}
            placeholderTextColor={theme.placeholder}
            placeholder="Or enter pickup manually"
          />
        </>
      ) : null}

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Same dropoff as customer address</Text>
        <Switch
          value={form.same_dropoff_as_customer}
          onValueChange={(v) => setForm((f) => ({ ...f, same_dropoff_as_customer: v }))}
        />
      </View>
      {!form.same_dropoff_as_customer ? (
        <>
          <Text style={styles.label}>Dropoff location *</Text>
          <AddressAutocomplete
            placeholder="Dropoff location"
            initialValue={form.dropoff_location}
            countryHint="US"
            onAddressSelected={(result) => {
              setForm((f) => ({
                ...f,
                dropoff_location: result.formatted_address || result.normalized_address || '',
              }));
            }}
            onValidationStatusChange={() => {}}
          />
          <TextInput
            style={styles.input}
            value={form.dropoff_location}
            onChangeText={(t) => setForm((f) => ({ ...f, dropoff_location: t }))}
            placeholderTextColor={theme.placeholder}
            placeholder="Or enter dropoff manually"
          />
        </>
      ) : null}

      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={form.item_description}
        onChangeText={(t) => setForm((f) => ({ ...f, item_description: t }))}
        placeholderTextColor={theme.placeholder}
        placeholder="Item description"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Delivery date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={form.delivery_date}
        onChangeText={(t) => setForm((f) => ({ ...f, delivery_date: t }))}
        placeholderTextColor={theme.placeholder}
        placeholder="2026-08-15"
      />
      <Text style={styles.label}>Delivery time (HH:MM)</Text>
      <TextInput
        style={styles.input}
        value={form.delivery_time}
        onChangeText={(t) => setForm((f) => ({ ...f, delivery_time: t }))}
        placeholderTextColor={theme.placeholder}
        placeholder="14:30"
      />
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={form.special_instructions}
        onChangeText={(t) => setForm((f) => ({ ...f, special_instructions: t }))}
        placeholderTextColor={theme.placeholder}
        placeholder="Special instructions"
        multiline
        numberOfLines={2}
      />
      <Text style={styles.label}>Estimated cost</Text>
      <TextInput
        style={styles.input}
        value={form.estimated_cost}
        onChangeText={(t) => setForm((f) => ({ ...f, estimated_cost: t }))}
        placeholderTextColor={theme.placeholder}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <Text style={styles.sectionTitle}>Status</Text>
      {['Pending', 'En Route', 'Completed', 'Cancelled'].map((status) => (
        <View key={status} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          <Text style={{ flex: 1, color: theme.text }}>{status}</Text>
          <Switch
            value={form.status === status}
            onValueChange={() => setForm((f) => ({ ...f, status }))}
          />
        </View>
      ))}
    </>
  );

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
            <Button
              title="Add Delivery"
              onPress={() => {
                setMode('create');
                setForm(emptyDeliveryForm());
              }}
            />
          </View>

          <AdminDeliveryListFilters
            deliveries={deliveries}
            filters={listFilters}
            onChange={setListFilters}
            theme={theme}
            styles={styles}
          />

          {localLoading ? (
            <ActivityIndicator />
          ) : deliveries.length === 0 ? (
            <Text style={styles.emptyText}>No deliveries found.</Text>
          ) : (
            <AdminFilteredListMeta
              totalCount={deliveries.length}
              filteredCount={filteredDeliveries.length}
              filteredEmptyMessage="No deliveries match the current filters."
              hasActiveFilters={adminDeliveryFiltersAreActive(listFilters)}
              onClearFilters={() => setListFilters(DEFAULT_ADMIN_DELIVERY_LIST_FILTERS)}
              theme={theme}
              styles={styles}
            >
              {filteredDeliveries.map((delivery: any) => (
                <View key={delivery.id} style={styles.itemContainer}>
                  <Text style={styles.itemTitle}>Delivery #{delivery.id} — {delivery.customer_name}</Text>
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
          <Text style={styles.title}>{mode === 'create' ? 'Add Delivery' : 'Edit Delivery'}</Text>
          {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}
          {renderFormFields()}
          <View style={styles.buttonContainer}>
            <Button
              title={mode === 'create' ? 'Create' : 'Update'}
              onPress={mode === 'create' ? handleCreate : handleUpdate}
              disabled={localLoading}
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
          <Text style={styles.title}>Delivery Detail</Text>
          <Text style={styles.itemTitle}>{selected.customer_name}</Text>
          {selected.customer_email ? (
            <Text style={{ color: theme.text }}>Email: {selected.customer_email}</Text>
          ) : null}
          {selected.customer_phone ? (
            <Text style={{ color: theme.text }}>Phone: {selected.customer_phone}</Text>
          ) : null}
          <Text style={{ color: theme.text }}>Pickup: {selected.pickup_location}</Text>
          <Text style={{ color: theme.text }}>Dropoff: {selected.dropoff_location}</Text>
          <Text style={{ color: theme.text }}>Item: {selected.item_description}</Text>
          <Text style={{ color: theme.text }}>Status: {selected.status}</Text>
          {selected.delivery_date ? (
            <Text style={{ color: theme.text }}>Date: {selected.delivery_date}</Text>
          ) : null}
          {selected.delivery_time ? (
            <Text style={{ color: theme.text }}>Time: {selected.delivery_time}</Text>
          ) : null}
          {selected.special_instructions ? (
            <Text style={{ color: theme.text }}>Instructions: {selected.special_instructions}</Text>
          ) : null}
          <Text style={{ color: theme.text }}>
            Created: {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'}
          </Text>

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
                Only compliant drivers can be assigned.
              </Text>
              {drivers.map((driver: any) => (
                <Button
                  key={driver.id}
                  title={`${assignDriverId === driver.id.toString() ? '✓ ' : ''}${driver.first_name} ${driver.last_name}`}
                  onPress={() => {
                    const id = driver.id.toString();
                    setAssignDriverId(id);
                    loadDispatchEligibility(id);
                  }}
                />
              ))}
              {eligibilityLoading ? (
                <ActivityIndicator size="small" color={theme.border} style={{ marginTop: 8 }} />
              ) : null}
              {dispatchEligibility ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{
                    color: dispatchEligibility.eligible ? '#5cb85c' : theme.error,
                    fontWeight: '600',
                  }}>
                    {dispatchEligibility.eligible ? 'Eligible for dispatch' : 'Not eligible for dispatch'}
                  </Text>
                  {!dispatchEligibility.eligible && dispatchEligibility.blockers.length > 0
                    ? dispatchEligibility.blockers.map((code) => (
                      <Text key={code} style={{ color: theme.error }}>
                        • {COMPLIANCE_BLOCKER_LABELS[code] || code}
                      </Text>
                    ))
                    : null}
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

  return (
    <View style={styles.container}><Text style={{ color: theme.text }}>Invalid state</Text></View>
  );
}
