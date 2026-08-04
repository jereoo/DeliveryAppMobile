import {
  buildCustomerAdminPayload,
  buildCustomerProfilePayload,
  fetchCustomerMe,
  parseCustomerApiError,
  updateCustomerMe,
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

  it('builds profile payload and omits blank password', () => {
    const payload = buildCustomerProfilePayload({
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      phone_number: '6045550100',
      address_country: 'CA',
      password: '   ',
    });
    expect(payload.email).toBe('jane@example.com');
    expect(payload.password).toBeUndefined();
  });

  it('includes password in profile payload when provided', () => {
    const payload = buildCustomerProfilePayload({
      phone_number: '6045550100',
      password: 'NewPass123!',
    });
    expect(payload.password).toBe('NewPass123!');
  });

  it('fetchCustomerMe calls /customers/me/', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, phone_number: '6045550100' }),
    });
    const data = await fetchCustomerMe(request);
    expect(request).toHaveBeenCalledWith('/customers/me/');
    expect(data.phone_number).toBe('6045550100');
  });

  it('updateCustomerMe PATCHes profile', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });
    await updateCustomerMe(request, { phone_number: '6045550199' });
    expect(request).toHaveBeenCalledWith('/customers/me/', {
      method: 'PATCH',
      body: JSON.stringify({ phone_number: '6045550199' }),
    });
  });

  it('parses API error body', async () => {
    const response = {
      json: async () => ({ detail: 'Username already exists.' }),
    } as Response;
    await expect(parseCustomerApiError(response)).resolves.toBe('Username already exists.');
  });
});
