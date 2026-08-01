import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, Text, View } from 'react-native';
import { theme, styles } from '../theme';

export interface MyDeliveriesScreenProps {
  onBack: () => void;
  deliveries: any[];
  loadMyDeliveries: () => Promise<void>;
}

  export function MyDeliveriesScreen({ onBack, deliveries, loadMyDeliveries }: MyDeliveriesScreenProps) {
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [mode, setMode] = useState<'list' | 'detail'>('list');
    const [error, setError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const handleSelect = (delivery: any) => {
      setSelectedDelivery(delivery);
      setMode('detail');
    };

    const refreshDeliveries = async () => {
      setLocalLoading(true);
      try {
        await loadMyDeliveries();
      } catch (e) {
        setError('Failed to load deliveries');
      }
      setLocalLoading(false);
    };

    useEffect(() => {
      refreshDeliveries();
    }, []);

    if (mode === 'detail' && selectedDelivery) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Button title="← Back" onPress={() => setMode('list')} />
              <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Delivery Detail</Text>
            </View>

            <Text style={styles.itemTitle}>Delivery #{selectedDelivery.id}</Text>
            <Text>Pickup: {selectedDelivery.pickup_location}</Text>
            <Text>Dropoff: {selectedDelivery.dropoff_location}</Text>
            <Text>Item: {selectedDelivery.item_description || 'No description'}</Text>
            <Text>Status: {selectedDelivery.status}</Text>
            <Text>Requested: {selectedDelivery.created_at ? new Date(selectedDelivery.created_at).toLocaleDateString() : 'N/A'}</Text>

            {selectedDelivery.driver_name && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.sectionTitle}>Driver Information</Text>
                <Text>Driver: {selectedDelivery.driver_name}</Text>
                {selectedDelivery.driver_phone && <Text>Phone: {selectedDelivery.driver_phone}</Text>}
              </View>
            )}

            {selectedDelivery.vehicle_info && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <Text>Vehicle: {selectedDelivery.vehicle_info}</Text>
              </View>
            )}

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
            <Button title="🔄" onPress={refreshDeliveries} />
          </View>

          {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

          {localLoading ? (
            <ActivityIndicator size="large" color="#0066CC" />
          ) : deliveries.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={styles.emptyText}>No deliveries found.</Text>
              <Text style={styles.infoText}>Request your first delivery to get started!</Text>
            </View>
          ) : (
            deliveries.map((delivery: any) => (
              <View key={delivery.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>Delivery #{delivery.id}</Text>
                <Text>From: {delivery.pickup_location}</Text>
                <Text>To: {delivery.dropoff_location}</Text>
                <Text>Status: <Text style={{
                  fontWeight: 'bold',
                  color: delivery.status === 'Completed' ? 'green' :
                    delivery.status === 'Cancelled' ? 'red' :
                      delivery.status === 'En Route' ? 'orange' : 'blue'
                }}>{delivery.status}</Text></Text>
                <Text>Requested: {delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : 'N/A'}</Text>

                <View style={{ marginTop: 8 }}>
                  <Button title="View Details" onPress={() => handleSelect(delivery)} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }
