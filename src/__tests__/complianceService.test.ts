import {
  DOCUMENT_TYPE_LABELS,
  DRIVER_DOCUMENT_TYPES,
  MAX_COMPLIANCE_PDF_BYTES,
  VEHICLE_DOCUMENT_TYPES,
  getDocumentDownloadUrl,
  getPresignedUploadUrl,
  listDriverDocuments,
  parseComplianceError,
  uploadCompliancePdf,
  uploadPdfToPresignedUrl,
  validatePdfSelection,
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

describe('validatePdfSelection', () => {
  it('accepts valid pdf', () => {
    expect(() => validatePdfSelection({
      name: 'policy.pdf',
      size: 1024,
      type: 'application/pdf',
    })).not.toThrow();
  });

  it('rejects non-pdf extension', () => {
    expect(() => validatePdfSelection({ name: 'policy.docx', size: 1024 }))
      .toThrow(/PDF/);
  });

  it('rejects oversize files', () => {
    expect(() => validatePdfSelection({
      name: 'big.pdf',
      size: MAX_COMPLIANCE_PDF_BYTES + 1,
    })).toThrow(/10 MB/);
  });
});

describe('getPresignedUploadUrl', () => {
  it('posts pdf metadata to presigned endpoint', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        upload_url: 'https://s3.example/upload',
        file_key: 'compliance/staging/1/x.pdf',
        file_name: 'policy.pdf',
        content_type: 'application/pdf',
        expires_in: 900,
        max_size_bytes: MAX_COMPLIANCE_PDF_BYTES,
      }),
    });
    const result = await getPresignedUploadUrl(request, {
      file_name: 'policy.pdf',
      file_size: 2048,
    });
    expect(request).toHaveBeenCalledWith('/documents/presigned-upload/', {
      method: 'POST',
      body: JSON.stringify({
        file_name: 'policy.pdf',
        content_type: 'application/pdf',
        file_size: 2048,
      }),
    });
    expect(result.file_key).toContain('compliance/');
  });
});

describe('uploadPdfToPresignedUrl', () => {
  it('puts blob to presigned url', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as typeof fetch;
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    await uploadPdfToPresignedUrl('https://s3.example/upload', blob);
    expect(fetchMock).toHaveBeenCalledWith('https://s3.example/upload', {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'application/pdf' },
    });
  });
});

describe('uploadCompliancePdf', () => {
  it('uploads pdf through backend proxy endpoint', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        file_key: 'compliance/staging/1/policy.pdf',
        file_name: 'policy.pdf',
      }),
    });
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const result = await uploadCompliancePdf(request, {
      name: 'policy.pdf',
      size: blob.size,
      type: 'application/pdf',
      blob,
    });
    expect(request).toHaveBeenCalledWith('/documents/upload/', expect.objectContaining({
      method: 'POST',
    }));
    expect(result.file_key).toContain('compliance/');
  });
});

describe('getDocumentDownloadUrl', () => {
  it('calls document download endpoint', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        download_url: 'https://s3.example/download',
        file_name: 'policy.pdf',
        expires_in: 900,
      }),
    });
    const result = await getDocumentDownloadUrl(request, 99);
    expect(request).toHaveBeenCalledWith('/documents/99/download/');
    expect(result.download_url).toContain('s3.example');
  });
});
