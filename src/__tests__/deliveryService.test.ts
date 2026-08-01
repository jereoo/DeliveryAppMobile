import { parseDeliveryApiError } from '../services/deliveryService';

describe('deliveryService', () => {
  it('parses API error body', async () => {
    const response = {
      json: async () => ({ detail: 'Dropoff location is required.' }),
    } as Response;
    await expect(parseDeliveryApiError(response)).resolves.toBe('Dropoff location is required.');
  });
});
