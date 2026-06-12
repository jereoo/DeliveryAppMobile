import {
  DOCUMENT_TYPE_LABELS,
  DRIVER_DOCUMENT_TYPES,
  VEHICLE_DOCUMENT_TYPES,
  listDriverDocuments,
  parseComplianceError,
} from '../services/complianceService';

describe('complianceService constants', () => {
  it('labels all document types', () => {
    expect(DOCUMENT_TYPE_LABELS.DRIVER_LICENSE).toBe('Driver license');
    expect(DOCUMENT_TYPE_LABELS.COMMERCIAL_INSURANCE).toBe('Commercial insurance');
  });

  it('separates driver vs vehicle document types', () => {
    expect(DRIVER_DOCUMENT_TYPES).toEqual(['DRIVER_LICENSE']);
    expect(VEHICLE_DOCUMENT_TYPES).toContain('COMMERCIAL_INSURANCE');
    expect(VEHICLE_DOCUMENT_TYPES).not.toContain('DRIVER_LICENSE');
  });
});

describe('parseComplianceError', () => {
  it('returns error field from response body', async () => {
    const response = {
      json: async () => ({ error: 'Not allowed' }),
    } as Response;
    await expect(parseComplianceError(response)).resolves.toBe('Not allowed');
  });

  it('formats field validation errors', async () => {
    const response = {
      json: async () => ({ issuer: ['This field is required.'] }),
    } as Response;
    await expect(parseComplianceError(response)).resolves.toContain('issuer');
  });

  it('uses fallback when body is empty', async () => {
    const response = {
      json: async () => ({}),
    } as Response;
    await expect(parseComplianceError(response, 'Custom fail')).resolves.toBe('Custom fail');
  });
});

describe('listDriverDocuments', () => {
  it('calls driver documents endpoint', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, document_type: 'DRIVER_LICENSE', status: 'PENDING' }],
    });
    const docs = await listDriverDocuments(request, 42);
    expect(request).toHaveBeenCalledWith('/drivers/42/documents/');
    expect(docs).toHaveLength(1);
  });
});
