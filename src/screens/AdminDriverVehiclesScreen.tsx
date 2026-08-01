import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { theme, styles } from '../theme';

export interface AdminDriverVehiclesScreenProps {
  onBack: () => void;
  driverVehicles: any[];
  drivers: any[];
  vehicles: any[];
  loadDriverVehicles: () => Promise<void>;
  loadDrivers: () => Promise<void>;
  loadVehicles: () => Promise<void>;
  createDriverVehicle: (data: any) => Promise<void>;
  updateDriverVehicle: (id: any, data: any) => Promise<void>;
  deleteDriverVehicle: (id: any) => Promise<unknown>;
}

  export function AdminDriverVehiclesScreen({ onBack, driverVehicles, drivers, vehicles, loadDriverVehicles, loadDrivers, loadVehicles, createDriverVehicle, updateDriverVehicle, deleteDriverVehicle }: AdminDriverVehiclesScreenProps) {
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
    const [formData, setFormData] = useState({
      driver_id: '',
      vehicle_id: '',
      assigned_from: new Date().toISOString().split('T')[0],
      assigned_to: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const resetForm = () => {
      setFormData({
        driver_id: '',
        vehicle_id: '',
        assigned_from: new Date().toISOString().split('T')[0],
        assigned_to: ''
      });
      setError(null);
    };

    const handleCreate = async () => {
      if (!formData.driver_id || !formData.vehicle_id || !formData.assigned_from) {
        setError('Driver, vehicle, and assignment date are required');
        return;
      }

      setLocalLoading(true);
      try {
        await createDriverVehicle(formData);
        await loadDriverVehicles();
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Driver-Vehicle assignment created successfully!');
      } catch (e) {
        setError('Failed to create assignment: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleUpdate = async () => {
      if (!selectedAssignment || !formData.driver_id || !formData.vehicle_id || !formData.assigned_from) {
        setError('Driver, vehicle, and assignment date are required');
        return;
      }

      setLocalLoading(true);
      try {
        await updateDriverVehicle(selectedAssignment.id, formData);
        await loadDriverVehicles();
        setMode('list');
        resetForm();
        Alert.alert('Success', 'Assignment updated successfully!');
      } catch (e) {
        setError('Failed to update assignment: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    const handleDelete = (assignment: any) => {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete this driver-vehicle assignment?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLocalLoading(true);
              try {
                await deleteDriverVehicle(assignment.id);
                await loadDriverVehicles();
                Alert.alert('Success', 'Assignment deleted successfully!');
              } catch (e) {
                setError('Failed to delete assignment: ' + (e instanceof Error ? e.message : 'Unknown error'));
              }
              setLocalLoading(false);
            }
          }
        ]
      );
    };

    const handleEdit = (assignment: any) => {
      setSelectedAssignment(assignment);
      setFormData({
        driver_id: assignment.driver_id?.toString() || '',
        vehicle_id: assignment.vehicle_id?.toString() || '',
        assigned_from: assignment.assigned_from || new Date().toISOString().split('T')[0],
        assigned_to: assignment.assigned_to || ''
      });
      setMode('edit');
    };

    const handleDetail = (assignment: any) => {
      setSelectedAssignment(assignment);
      setMode('detail');
    };

    const refreshAssignments = async () => {
      setLocalLoading(true);
      try {
        await Promise.all([loadDriverVehicles(), loadDrivers(), loadVehicles()]);
      } catch (e) {
        setError('Failed to load data');
      }
      setLocalLoading(false);
    };

    // Note: Driver-Vehicle assignments are loaded by parent component, no need for useEffect here

    if (mode === 'create' || mode === 'edit') {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Cancel" onPress={() => { setMode('list'); resetForm(); }} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>
                {mode === 'create' ? 'Assign Vehicle' : 'Edit Assignment'}
              </Text>
            </View>

            {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

            {mode === 'edit' ? (
              <>
                <Text style={styles.label}>Driver (Selected)</Text>
                <View style={{ backgroundColor: theme.surface, borderRadius: 5, padding: 10, marginBottom: 10 }}>
                  {(() => {
                    const selectedDriver = drivers.find((d: any) => d.id.toString() === formData.driver_id);
                    return selectedDriver ? (
                      <Text style={{ fontWeight: 'bold', color: theme.text }}>
                        {selectedDriver.first_name} {selectedDriver.last_name} ({selectedDriver.license_number})
                      </Text>
                    ) : (
                      <Text style={{ color: theme.text }}>Driver ID: {formData.driver_id}</Text>
                    );
                  })()}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Driver *</Text>
                <View style={{ backgroundColor: theme.surface, borderRadius: 5, marginBottom: 10 }}>
                  {drivers.map((driver: any) => (
                    <View key={driver.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 5 }}>
                      <Button
                        title={formData.driver_id === driver.id.toString() ? '●' : '○'}
                        onPress={() => setFormData(prev => ({ ...prev, driver_id: driver.id.toString() }))}
                      />
                      <Text style={{ marginLeft: 10, color: theme.text }}>{driver.first_name} {driver.last_name} ({driver.license_number})</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Vehicle * {mode === 'edit' ? '(Change Assignment)' : ''}</Text>
            <View style={{ backgroundColor: theme.surface, borderRadius: 5, marginBottom: 10 }}>
              {vehicles.map((vehicle: any) => {
                const isSelected = formData.vehicle_id === vehicle.id.toString();
                return (
                  <View key={vehicle.id} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 5,
                    backgroundColor: isSelected ? theme.inputBg : 'transparent',
                    borderRadius: 3
                  }}>
                    <Button
                      title={isSelected ? '●' : '○'}
                      onPress={() => setFormData(prev => ({ ...prev, vehicle_id: vehicle.id.toString() }))}
                    />
                    <Text style={{ marginLeft: 10, fontWeight: isSelected ? 'bold' : 'normal', color: theme.text }}>
                      {vehicle.license_plate} - {vehicle.model}
                      {isSelected && mode === 'edit' ? ' (Currently Assigned)' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.label}>Assigned From *</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="YYYY-MM-DD"
              value={formData.assigned_from}
              onChangeText={(text) => setFormData(prev => ({ ...prev, assigned_from: text }))}
            />

            <Text style={styles.label}>Assigned To (optional)</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={theme.placeholder} placeholder="YYYY-MM-DD (leave empty for ongoing)"
              value={formData.assigned_to}
              onChangeText={(text) => setFormData(prev => ({ ...prev, assigned_to: text }))}
            />

            <View style={styles.buttonContainer}>
              {localLoading ? (
                <ActivityIndicator size="large" color={theme.text} />
              ) : (
                <>
                  <Button
                    title={mode === 'create' ? 'Create Assignment' : 'Update Assignment'}
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

    if (mode === 'detail' && selectedAssignment) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={() => setMode('list')} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Assignment Detail</Text>
              <Button title="Edit" onPress={() => handleEdit(selectedAssignment)} />
            </View>

            <Text style={styles.itemTitle}>Driver-Vehicle Assignment</Text>
            <Text style={{ color: theme.text }}>Driver: {selectedAssignment.driver_name || 'Unknown Driver'}</Text>
            <Text style={{ color: theme.text }}>Vehicle: {selectedAssignment.vehicle_license_plate || 'Unknown Vehicle'} - {selectedAssignment.vehicle_model || ''}</Text>
            <Text style={{ color: theme.text }}>Assigned From: {selectedAssignment.assigned_from}</Text>
            <Text style={{ color: theme.text }}>Assigned To: {selectedAssignment.assigned_to || 'Ongoing'}</Text>
            <Text style={{ color: theme.text }}>Status: {selectedAssignment.assigned_to ? 'Completed' : 'Active'}</Text>

            <View style={styles.buttonContainer}>
              <Button title="Edit Assignment" onPress={() => handleEdit(selectedAssignment)} />
              <Button
                title="Delete Assignment"
                onPress={() => handleDelete(selectedAssignment)}
                color="red"
              />
              <Button title="Back to List" onPress={() => { setMode('list'); setSelectedAssignment(null); }} />
            </View>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🔗 Driver-Vehicles</Text>
            <Button title="+" onPress={() => { resetForm(); setMode('create'); }} />
          </View>

          <Button title="🔄 Refresh" onPress={refreshAssignments} />

          {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

          {localLoading ? (
            <ActivityIndicator size="large" color={theme.text} />
          ) : driverVehicles.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={styles.emptyText}>No driver-vehicle assignments found.</Text>
              <Text style={styles.infoText}>Create your first assignment to get started!</Text>
            </View>
          ) : (
            driverVehicles.map((assignment: any) => (
              <View key={assignment.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>Assignment #{assignment.id}</Text>
                <Text style={{ color: theme.text }}>Driver: {assignment.driver_name || 'Unknown Driver'}</Text>
                <Text style={{ color: theme.text }}>Vehicle: {assignment.vehicle_license_plate || 'Unknown Vehicle'}</Text>
                <Text style={{ color: theme.text }}>From: {assignment.assigned_from}</Text>
                <Text style={{ color: theme.text }}>To: {assignment.assigned_to || 'Ongoing'}</Text>
                <Text style={{ color: theme.text }}>Status: <Text style={{ color: assignment.assigned_to ? theme.textMuted : theme.text }}>
                  {assignment.assigned_to ? 'Completed' : 'Active'}
                </Text></Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                  <Button title="View" onPress={() => handleDetail(assignment)} />
                  <Button title="Edit" onPress={() => handleEdit(assignment)} />
                  <Button title="Delete" onPress={() => handleDelete(assignment)} color="red" />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }
