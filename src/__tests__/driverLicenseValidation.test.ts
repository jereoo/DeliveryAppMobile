import {
  LICENSE_REGIONS,
  listRegionsForCountry,
  normalizeLicenseNumber,
  validateDriverLicenseNumber,
} from '../utils/driverLicenseValidation';

describe('driverLicenseValidation', () => {
  it('includes all Canadian provinces/territories and US states', () => {
    const ca = listRegionsForCountry('CA');
    const us = listRegionsForCountry('US');
    expect(ca).toHaveLength(13);
    expect(us).toHaveLength(51);
    expect(LICENSE_REGIONS).toHaveLength(64);
  });

  it('accepts valid BC license (7 digits)', () => {
    const result = validateDriverLicenseNumber('CA-BC', '1234567');
    expect(result).toEqual({ ok: true, normalized: '1234567' });
  });

  it('normalizes spaces and dashes before validating', () => {
    const result = validateDriverLicenseNumber('CA-BC', '123-45 67');
    expect(result).toEqual({ ok: true, normalized: '1234567' });
  });

  it('accepts valid California license (1 letter + 7 digits)', () => {
    const result = validateDriverLicenseNumber('US-CA', 'a1234567');
    expect(result).toEqual({ ok: true, normalized: 'A1234567' });
  });

  it('rejects invalid BC format', () => {
    const result = validateDriverLicenseNumber('CA-BC', '12345');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('British Columbia');
    }
  });

  it('rejects unknown region', () => {
    const result = validateDriverLicenseNumber('XX-YY', '1234567');
    expect(result).toEqual({ ok: false, message: 'Select a province or state.' });
  });

  it('rejects empty license number', () => {
    const result = validateDriverLicenseNumber('CA-BC', '   ');
    expect(result).toEqual({ ok: false, message: 'Driver license number is required.' });
  });

  it('normalizeLicenseNumber strips whitespace and dashes', () => {
    expect(normalizeLicenseNumber(' ab-12 cd ')).toBe('AB12CD');
  });
});
