import {
  buildCustomerAdminPayload,
  parseCustomerApiError,
} from '../services/customerService';

describe('customerService', () => {
  it('builds admin payload with US default country', () => {
    const payload = buildCustomerAdminPayload({
      username: 'cust1',
      email: 'cust1@example.com',
      password: 'secret123',
      first_name: 'Jane',
      last_name: 'Doe',
      phone_number: '555-1234',
    });
    expect(payload.address_country).toBe('US');
    expect(payload.username).toBe('cust1');
  });

  it('parses API error body', async () => {
    const response = {
      json: async () => ({ detail: 'Username already exists.' }),
    } as Response;
    await expect(parseCustomerApiError(response)).resolves.toBe('Username already exists.');
  });
});
