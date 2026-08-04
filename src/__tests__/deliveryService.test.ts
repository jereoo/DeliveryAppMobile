import {
  buildDeliveryAdminPayload,
  cancelDeliveryById,
  parseDeliveryApiError,
} from '../services/deliveryService';

describe('deliveryService', () => {
  it('builds admin payload with customer FK and scheduling fields', () => {
    const payload = buildDeliveryAdminPayload({
      customer: 5,
      pickup_location: 'A',
      dropoff_location: 'B',
      item_description: 'Boxes',
      status: 'Pending',
      delivery_date: '2026-08-15',
      delivery_time: '14:30',
      special_instructions: 'Ring bell',
      estimated_cost: '49.99',
      same_dropoff_as_customer: true,
    });
    expect(payload.customer).toBe(5);
    expect(payload.delivery_date).toBe('2026-08-15');
    expect(payload.same_dropoff_as_customer).toBe(true);
    expect(payload.estimated_cost).toBe('49.99');
  });

  it('cancelDeliveryById posts to cancel action', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'Cancelled' }),
    });
    await cancelDeliveryById(request, 12);
    expect(request).toHaveBeenCalledWith('/deliveries/12/cancel/', { method: 'POST' });
  });

  it('parses API error body', async () => {
    const response = {
      json: async () => ({ detail: 'Dropoff location is required.' }),
    } as Response;
    await expect(parseDeliveryApiError(response)).resolves.toBe('Dropoff location is required.');
  });
});
