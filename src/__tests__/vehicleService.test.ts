import {
  buildVehicleOnboardingPayload,
  buildVehicleUpdatePayload,
  parseVehicleApiError,
  VEHICLE_APPROVAL_LABELS,
} from '../services/vehicleService';

describe('vehicleService', () => {
  it('builds onboarding payload with normalized plate and vin', () => {
    const payload = buildVehicleOnboardingPayload({
      vehicle_model_spec_id: 2,
      vehicle_year: 2022,
      vehicle_license_plate: ' abc123 ',
      vehicle_vin: '1testvin00000001',
      vehicle_capacity: 3500,
      vehicle_capacity_unit: 'lb',
    });
    expect(payload).toEqual({
      vehicle_model_spec_id: 2,
      vehicle_year: 2022,
      vehicle_license_plate: 'ABC123',
      vehicle_vin: '1TESTVIN00000001',
      vehicle_capacity: 3500,
      vehicle_capacity_unit: 'lb',
    });
  });

  it('marks vehicle inactive when in service is turned off', () => {
    const payload = buildVehicleUpdatePayload(
      {
        license_plate: 'X',
        make: 'Ford',
        model: 'Transit',
        year: 2021,
        vin: '1ABCDEFGHIJKLMNOP',
        capacity: 1500,
        capacity_unit: 'kg',
      },
      { vehicleActive: true, inService: false },
    );
    expect(payload.active).toBe(false);
  });

  it('parses API error body', async () => {
    const response = {
      json: async () => ({ detail: 'Vehicle identity is locked.' }),
    } as Response;
    await expect(parseVehicleApiError(response)).resolves.toBe('Vehicle identity is locked.');
  });

  it('exposes approval labels for all statuses', () => {
    expect(VEHICLE_APPROVAL_LABELS.PENDING).toBe('Pending approval');
    expect(VEHICLE_APPROVAL_LABELS.RESUBMIT).toBe('Resubmit required');
  });
});
