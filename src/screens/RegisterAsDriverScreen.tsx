import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { AddressFields, emptyAddressFields } from '../components/AddressFields';
import { DriverLicenseFields } from '../components/DriverLicenseFields';
import { VehicleCatalogFields } from '../components/VehicleCatalogFields';
import { theme, styles } from '../theme';
import { formatPhone10, getPhoneDigits } from '../utils/phoneFormatting';
import { validateDriverLicenseNumber } from '../utils/driverLicenseValidation';

export interface RegisterAsDriverScreenProps {
  onBack: () => void;
  API_BASE: string;
}

  export function RegisterAsDriverScreen({ onBack, API_BASE }: RegisterAsDriverScreenProps) {
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      confirm_password: '',
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      license_issuing_region: 'CA-BC',
      license_number: '',
      vehicle_model_spec_id: null as number | null,
      vehicle_license_plate: '',
      vehicle_year: 2000,
      vehicle_vin: '',
      vehicle_capacity: 0,
      vehicle_capacity_unit: 'lb' as 'kg' | 'lb',
      ...emptyAddressFields(),
    });
    const [error, setError] = useState<string | null>(null);
    const [licenseFieldError, setLicenseFieldError] = useState<string | null>(null);
    const [vehicleCatalogError, setVehicleCatalogError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const resetForm = () => {
      setFormData({
        username: '',
        password: '',
        confirm_password: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        license_issuing_region: 'CA-BC',
        license_number: '',
        vehicle_model_spec_id: null as number | null,
        vehicle_license_plate: '',
        vehicle_year: 2000,
        vehicle_vin: '',
        vehicle_capacity: 0,
        vehicle_capacity_unit: 'lb' as 'kg' | 'lb',
      });
      setError(null);
      setLicenseFieldError(null);
      setVehicleCatalogError(null);
    };

    const handleRegister = async () => {
      setLicenseFieldError(null);
      setVehicleCatalogError(null);

      // Check each field individually for better debugging
      const missingFields = [];
      if (!formData.username?.trim()) missingFields.push('username');
      if (!formData.password?.trim()) missingFields.push('password');
      if (!formData.first_name?.trim()) missingFields.push('first_name');
      if (!formData.last_name?.trim()) missingFields.push('last_name');
      if (!formData.license_issuing_region?.trim()) missingFields.push('license_issuing_region');
      if (!formData.license_number?.trim()) missingFields.push('license_number');
      if (!formData.vehicle_model_spec_id) missingFields.push('vehicle_model_spec_id');
      if (!formData.vehicle_license_plate?.trim()) missingFields.push('vehicle_license_plate');
      if (!formData.vehicle_vin?.trim()) missingFields.push('vehicle_vin');

      const phoneDigits = getPhoneDigits(formData.phone_number);
      if (phoneDigits.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return;
      }

      // Validate vehicle year
      if (!formData.vehicle_year || formData.vehicle_year === 2000 || formData.vehicle_year < 2000 || formData.vehicle_year > 2100) {
        missingFields.push('vehicle_year (must be between 2000-2100, not default)');
      }

      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      const licenseValidation = validateDriverLicenseNumber(
        formData.license_issuing_region,
        formData.license_number,
      );
      if (!licenseValidation.ok) {
        setLicenseFieldError(licenseValidation.message);
        setError(licenseValidation.message);
        return;
      }

      if (!formData.vehicle_model_spec_id) {
        setError('Select a vehicle manufacturer and model from the catalog.');
        setVehicleCatalogError('Select a vehicle manufacturer and model from the catalog.');
        return;
      }

      if (!formData.vehicle_capacity || formData.vehicle_capacity <= 0) {
        setError('Vehicle capacity is set automatically when you select a catalog model.');
        return;
      }

      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match');
        return;
      }

      setLocalLoading(true);
      try {
        // Register as driver with vehicle information (backend expects flat structure)
        const registrationData = {
          // Driver information
          username: formData.username,
          password: formData.password,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: phoneDigits,
          license_issuing_region: formData.license_issuing_region,
          license_number: licenseValidation.normalized,
          address_unit: formData.address_unit,
          address_street: formData.address_street,
          address_city: formData.address_city,
          address_state: formData.address_state,
          address_postal_code: formData.address_postal_code,
          address_country: formData.address_country,
          vehicle_model_spec_id: formData.vehicle_model_spec_id,
          // Vehicle information (flat structure as expected by backend)
          vehicle_license_plate: formData.vehicle_license_plate,
          vehicle_year: formData.vehicle_year,
          vehicle_vin: formData.vehicle_vin,
          vehicle_capacity: formData.vehicle_capacity,
          vehicle_capacity_unit: formData.vehicle_capacity_unit,
        };

        const response = await fetch(`${API_BASE}/drivers/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.clone().json();
          } catch (e) {
            errorData = await response.clone().text();
          }
          throw new Error(`Registration failed (${response.status}): ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();

        Alert.alert(
          'Registration submitted',
          result.message
            || 'Your driver account was created and is pending admin approval. You can log in to upload compliance documents while you wait.',
          [{ text: 'OK', onPress: () => onBack() }],
        );

        resetForm();
      } catch (e) {
        setError('Registration failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
      setLocalLoading(false);
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Button title="← Back" onPress={onBack} />
            <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>🚚 Register as Driver</Text>
          </View>

          {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

          <Text style={styles.sectionTitle}>Account Information</Text>

          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter username"
            value={formData.username}
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter email"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter password"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Confirm password"
            value={formData.confirm_password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirm_password: text }))}
            secureTextEntry
          />

          <Text style={styles.sectionTitle}>Driver Information</Text>

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

          <Text style={styles.label}>Phone Number (10 digits) *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder}
            placeholder="(555) 555-5555"
            value={formData.phone_number}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, phone_number: formatPhone10(text) }))}
            keyboardType="phone-pad"
            maxLength={14}
          />

          <DriverLicenseFields
            licenseIssuingRegion={formData.license_issuing_region}
            licenseNumber={formData.license_number}
            onRegionChange={(code) => {
              setLicenseFieldError(null);
              setFormData((prev) => ({ ...prev, license_issuing_region: code }));
            }}
            onLicenseNumberChange={(text) => {
              setLicenseFieldError(null);
              setFormData((prev) => ({ ...prev, license_number: text }));
            }}
            theme={theme}
            styles={styles}
            fieldError={licenseFieldError}
          />

          <AddressFields
            value={{
              address_unit: formData.address_unit,
              address_street: formData.address_street,
              address_city: formData.address_city,
              address_state: formData.address_state,
              address_postal_code: formData.address_postal_code,
              address_country: formData.address_country,
            }}
            onChange={(address) => setFormData((prev) => ({ ...prev, ...address }))}
            apiBase={API_BASE}
            showAutocomplete
          />

          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <Text style={styles.infoText}>As a driver, you must register a vehicle from the approved pickup catalog</Text>

          <VehicleCatalogFields
            apiBase={API_BASE}
            vehicleModelSpecId={formData.vehicle_model_spec_id}
            vehicleYear={formData.vehicle_year === 2000 ? 0 : formData.vehicle_year}
            onSpecChange={(specId) => {
              setVehicleCatalogError(null);
              setFormData((prev) => ({
                ...prev,
                vehicle_model_spec_id: specId,
                vehicle_capacity: 0,
              }));
            }}
            onCatalogCapacityChange={(maxPayloadLb) => {
              setFormData((prev) => ({
                ...prev,
                vehicle_capacity: maxPayloadLb,
                vehicle_capacity_unit: 'lb',
              }));
            }}
            theme={theme}
            styles={styles}
            fieldError={vehicleCatalogError}
          />

          <Text style={styles.label}>Vehicle Year *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle year"
            value={formData.vehicle_year === 2000 ? '' : formData.vehicle_year.toString()}
            onChangeText={(text) => {
              if (text === '') {
                setFormData(prev => ({ ...prev, vehicle_year: 2000 }));
                return;
              }

              const numericText = text.replace(/[^0-9]/g, '');
              if (numericText.length <= 4) {
                const year = parseInt(numericText);
                if (!isNaN(year) && year >= 1999 && year <= 2100) {
                  setFormData(prev => ({ ...prev, vehicle_year: year }));
                } else if (numericText.length < 4) {
                  setFormData(prev => ({ ...prev, vehicle_year: parseInt(numericText) || 2000 }));
                }
              }
            }}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={styles.label}>Vehicle License Plate *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle license plate"
            value={formData.vehicle_license_plate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_license_plate: text.toUpperCase() }))}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Vehicle VIN *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.placeholder} placeholder="Enter vehicle VIN (17 characters)"
            value={formData.vehicle_vin}
            onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_vin: text.toUpperCase() }))}
            autoCapitalize="characters"
            maxLength={17}
          />

          <View style={styles.buttonContainer}>
            {localLoading ? (
              <ActivityIndicator size="large" color="#0066CC" />
            ) : (
              <>
                <Button title="Register as Driver" onPress={handleRegister} />
                <Button title="Cancel" onPress={onBack} />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }
