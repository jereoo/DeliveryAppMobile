import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, Text, View } from 'react-native';
import { ComplianceDocumentsPanel } from '../components/ComplianceDocumentsPanel';
import { ComplianceStatusCard } from '../components/ComplianceStatusCard';
import type { ComplianceSummary } from '../services/complianceService';
import { fetchDriverCurrentVehicle } from '../services/vehicleService';
import type { DriverApprovalStatus } from '../services/driverService';
import { theme, styles } from '../theme';
import type { AuthenticatedRequest } from './types';

export interface DriverComplianceScreenProps {
  onBack: () => void;
  makeAuthenticatedRequest: AuthenticatedRequest;
  driverMeId: number | null;
  driverMeApproval: { status: DriverApprovalStatus; rejectionReason?: string | null } | null;
  driverComplianceSummary: ComplianceSummary | null;
  loadDriverCompliance: () => Promise<void>;
}

  export function DriverComplianceScreen({ onBack, makeAuthenticatedRequest, driverMeId, driverMeApproval, driverComplianceSummary, loadDriverCompliance }: DriverComplianceScreenProps) {
    const [currentVehicleId, setCurrentVehicleId] = useState<number | null>(null);
    const [currentVehicleLabel, setCurrentVehicleLabel] = useState<string | null>(null);
    const [vehicleLoading, setVehicleLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      const loadCurrentVehicle = async () => {
        setVehicleLoading(true);
        try {
          const vehicle = await fetchDriverCurrentVehicle(makeAuthenticatedRequest);
          if (!cancelled) {
            if (vehicle) {
              setCurrentVehicleId(vehicle.id);
              setCurrentVehicleLabel(
                `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
              );
            } else {
              setCurrentVehicleId(null);
              setCurrentVehicleLabel(null);
            }
          }
        } catch {
          if (!cancelled) {
            setCurrentVehicleId(null);
            setCurrentVehicleLabel(null);
          }
        }
        if (!cancelled) setVehicleLoading(false);
      };
      loadCurrentVehicle();
      return () => {
        cancelled = true;
      };
    }, []);

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Compliance</Text>
          </View>
          <ComplianceStatusCard
            summary={driverComplianceSummary}
            theme={theme}
            styles={styles}
          />
          {driverMeId ? (
            <ComplianceDocumentsPanel
              key={`driver-docs-${driverMeId}`}
              subjectType="driver"
              subjectId={driverMeId}
              request={makeAuthenticatedRequest}
              isAdmin={false}
              canUpload={driverMeApproval?.status !== 'REJECTED'}
              theme={theme}
              styles={styles}
              title="Legal documents - Driver"
              onDocumentsChanged={loadDriverCompliance}
            />
          ) : null}
          {vehicleLoading ? (
            <ActivityIndicator size="small" color={theme.border} style={{ marginTop: 16 }} />
          ) : currentVehicleId ? (
            <ComplianceDocumentsPanel
              key={`vehicle-docs-${currentVehicleId}`}
              subjectType="vehicle"
              subjectId={currentVehicleId}
              request={makeAuthenticatedRequest}
              isAdmin={false}
              canUpload={driverMeApproval?.status !== 'REJECTED'}
              theme={theme}
              styles={styles}
              title="Legal documents - Vehicle"
              subtitle={
                currentVehicleLabel
                  ? `Assigned vehicle: ${currentVehicleLabel}. Upload registration and commercial insurance here.`
                  : 'Assigned vehicle — upload registration and commercial insurance here.'
              }
              onDocumentsChanged={loadDriverCompliance}
            />
          ) : (
            <Text style={{ color: theme.textMuted, marginTop: 16 }}>
              No vehicle assigned — contact admin to assign a vehicle before uploading registration or insurance.
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }
