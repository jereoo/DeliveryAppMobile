import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Text, View } from 'react-native';
import { cancelDeliveryById } from '../services/deliveryService';
import { theme, styles } from '../theme';
import type { AuthenticatedRequest } from './types';

export interface MyDeliveriesScreenProps {
  onBack: () => void;
  deliveries: any[];
  loadMyDeliveries: () => Promise<void>;
  makeAuthenticatedRequest?: AuthenticatedRequest;
  userType?: string | null;
}

export function MyDeliveriesScreen({
  onBack,
  deliveries,
  loadMyDeliveries,
  makeAuthenticatedRequest,
  userType,
}: MyDeliveriesScreenProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [mode, setMode] = useState<'list' | 'detail'>('list');
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleSelect = (delivery: any) => {
    setSelectedDelivery(delivery);
    setMode('detail');
  };

  const refreshDeliveries = async () => {
    setLocalLoading(true);
    try {
      await loadMyDeliveries();
    } catch {
      setError('Failed to load deliveries');
    }
    setLocalLoading(false);
  };

  useEffect(() => {
    refreshDeliveries();
  }, []);

  const handleCancel = async () => {
    if (!selectedDelivery || !makeAuthenticatedRequest) return;
    Alert.alert('Cancel delivery', 'Cancel this pending delivery request?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel delivery',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          setError(null);
          try {
            await cancelDeliveryById(makeAuthenticatedRequest, selectedDelivery.id);
            Alert.alert('Cancelled', 'Delivery request was cancelled.');
            setMode('list');
            setSelectedDelivery(null);
            await loadMyDeliveries();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to cancel delivery');
          }
          setCancelling(false);
        },
      },
    ]);
  };

  if (mode === 'detail' && selectedDelivery) {
    const canCancel = userType === 'customer'
      && selectedDelivery.status === 'Pending'
      && makeAuthenticatedRequest;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={() => setMode('list')} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Delivery Detail</Text>
          </View>

          <Text style={styles.itemTitle}>Delivery #{selectedDelivery.id}</Text>
          <Text style={{ color: theme.text }}>Pickup: {selectedDelivery.pickup_location}</Text>
          <Text style={{ color: theme.text }}>Dropoff: {selectedDelivery.dropoff_location}</Text>
          <Text style={{ color: theme.text }}>Item: {selectedDelivery.item_description || 'No description'}</Text>
          <Text style={{ color: theme.text }}>Status: {selectedDelivery.status}</Text>
          {selectedDelivery.delivery_date ? (
            <Text style={{ color: theme.text }}>Date: {selectedDelivery.delivery_date}</Text>
          ) : null}
          {selectedDelivery.special_instructions ? (
            <Text style={{ color: theme.text }}>Instructions: {selectedDelivery.special_instructions}</Text>
          ) : null}
          <Text style={{ color: theme.text }}>
            Requested: {selectedDelivery.created_at ? new Date(selectedDelivery.created_at).toLocaleDateString() : 'N/A'}
          </Text>

          {selectedDelivery.driver_name && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.sectionTitle}>Driver Information</Text>
              <Text style={{ color: theme.text }}>Driver: {selectedDelivery.driver_name}</Text>
            </View>
          )}

          {error ? <Text style={{ color: theme.error, marginTop: 8 }}>{error}</Text> : null}

          {canCancel ? (
            <View style={styles.buttonContainer}>
              <Button
                title={cancelling ? 'Cancelling…' : 'Cancel delivery request'}
                color="#d9534f"
                onPress={handleCancel}
                disabled={cancelling}
              />
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button title="Back to List" onPress={() => { setMode('list'); setSelectedDelivery(null); }} />
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
          <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>📋 My Deliveries</Text>
        </View>

        {error && <Text style={{ color: theme.error, marginBottom: 10 }}>{error}</Text>}

        {localLoading ? (
          <ActivityIndicator size="large" color={theme.border} />
        ) : deliveries.length === 0 ? (
          <Text style={styles.emptyText}>No deliveries found.</Text>
        ) : (
          deliveries.map((delivery: any) => (
            <View key={delivery.id} style={styles.itemContainer}>
              <Text style={styles.itemTitle}>Delivery #{delivery.id}</Text>
              <Text style={{ color: theme.text }}>To: {delivery.dropoff_location}</Text>
              <Text style={{ color: theme.text }}>Status: {delivery.status}</Text>
              <View style={{ marginTop: 8 }}>
                <Button title="View Details" onPress={() => handleSelect(delivery)} />
              </View>
            </View>
          ))
        )}

        <View style={styles.buttonContainer}>
          <Button title="Refresh" onPress={refreshDeliveries} />
        </View>
      </View>
    </ScrollView>
  );
}
