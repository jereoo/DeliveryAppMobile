import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, Text, View } from 'react-native';

import {
  fetchVehicleCatalog,
  findModelSpec,
  isYearValidForSpec,
  manufacturerIdForSpec,
  modelsForManufacturer,
  type VehicleManufacturer,
} from '../services/vehicleCatalogService';

type Theme = {
  text: string;
  textMuted: string;
  placeholder: string;
};

type Styles = {
  label: object;
  sectionTitle?: object;
};

interface VehicleCatalogFieldsProps {
  apiBase: string;
  vehicleModelSpecId: number | null;
  vehicleYear: number;
  onSpecChange: (specId: number | null) => void;
  onMaxCapacityChange?: (maxKg: number) => void;
  theme: Theme;
  styles: Styles;
  fieldError?: string | null;
}

export function VehicleCatalogFields({
  apiBase,
  vehicleModelSpecId,
  vehicleYear,
  onSpecChange,
  onMaxCapacityChange,
  theme,
  styles,
  fieldError,
}: VehicleCatalogFieldsProps) {
  const [catalog, setCatalog] = useState<VehicleManufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [manufacturerId, setManufacturerId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchVehicleCatalog(apiBase)
      .then((data) => {
        if (!cancelled) {
          setCatalog(data);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load vehicle catalog');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  useEffect(() => {
    if (!catalog.length || manufacturerId != null) return;
    const inferred = manufacturerIdForSpec(catalog, vehicleModelSpecId);
    if (inferred != null) setManufacturerId(inferred);
  }, [catalog, manufacturerId, vehicleModelSpecId]);

  const models = useMemo(
    () => modelsForManufacturer(catalog, manufacturerId),
    [catalog, manufacturerId],
  );
  const selectedSpec = useMemo(
    () => findModelSpec(catalog, vehicleModelSpecId),
    [catalog, vehicleModelSpecId],
  );

  useEffect(() => {
    if (selectedSpec && onMaxCapacityChange) {
      onMaxCapacityChange(selectedSpec.max_capacity_kg);
    }
  }, [selectedSpec, onMaxCapacityChange]);

  const yearWarning = selectedSpec && vehicleYear
    ? (isYearValidForSpec(selectedSpec, vehicleYear)
      ? null
      : `Year must be ${selectedSpec.start_year}${selectedSpec.end_year ? `–${selectedSpec.end_year}` : ' or later'}.`)
    : null;

  if (loading) {
    return <ActivityIndicator size="small" color="#0066CC" />;
  }

  if (loadError) {
    return <Text style={{ color: theme.textMuted }}>{loadError}</Text>;
  }

  return (
    <View>
      <Text style={styles.label}>Vehicle manufacturer *</Text>
      <ScrollView style={{ maxHeight: 120, marginBottom: 8 }} nestedScrollEnabled>
        {catalog.map((manufacturer) => (
          <Button
            key={manufacturer.id}
            title={`${manufacturerId === manufacturer.id ? '✓ ' : ''}${manufacturer.name}`}
            onPress={() => {
              setManufacturerId(manufacturer.id);
              onSpecChange(null);
            }}
          />
        ))}
      </ScrollView>

      {manufacturerId ? (
        <>
          <Text style={styles.label}>Vehicle model *</Text>
          <ScrollView style={{ maxHeight: 160, marginBottom: 8 }} nestedScrollEnabled>
            {models.map((model) => (
              <Button
                key={model.id}
                title={`${vehicleModelSpecId === model.id ? '✓ ' : ''}${model.name}`}
                onPress={() => onSpecChange(model.id)}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {selectedSpec ? (
        <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
          Max payload: {selectedSpec.max_payload_lb} lb ({selectedSpec.max_payload_kg} kg).{' '}
          Fleet limit for registration: {selectedSpec.max_capacity_kg} kg / {selectedSpec.max_capacity_lb} lb.
          {selectedSpec.notes ? ` ${selectedSpec.notes}.` : ''}
        </Text>
      ) : null}

      {yearWarning ? (
        <Text style={{ color: theme.textMuted, marginBottom: 8 }}>{yearWarning}</Text>
      ) : null}

      {fieldError ? (
        <Text style={{ color: theme.textMuted, marginTop: 4 }}>{fieldError}</Text>
      ) : null}
    </View>
  );
}
