/**
 * Driver license format validation — mirrors backend delivery/driver_license_validation.py
 */

export type LicenseRegion = {
  code: string;
  name: string;
  country: 'CA' | 'US';
  patterns: string[];
  hint: string;
};

export const LICENSE_REGIONS: LicenseRegion[] = [
  { code: 'CA-AB', name: 'Alberta', country: 'CA', patterns: ['^\\d{5,9}$', '^\\d{6}\\d{3}$'], hint: '5-9 digits' },
  { code: 'CA-BC', name: 'British Columbia', country: 'CA', patterns: ['^\\d{7}$'], hint: '7 digits' },
  { code: 'CA-MB', name: 'Manitoba', country: 'CA', patterns: ['^[A-Z0-9]{7,12}$'], hint: '7-12 letters or digits' },
  { code: 'CA-NB', name: 'New Brunswick', country: 'CA', patterns: ['^\\d{5,7}$'], hint: '5-7 digits' },
  { code: 'CA-NL', name: 'Newfoundland and Labrador', country: 'CA', patterns: ['^[A-Z]\\d{9}$'], hint: '1 letter + 9 digits' },
  { code: 'CA-NS', name: 'Nova Scotia', country: 'CA', patterns: ['^[A-Z0-9]{10,12}$'], hint: '10-12 letters or digits' },
  { code: 'CA-NT', name: 'Northwest Territories', country: 'CA', patterns: ['^\\d{6}$'], hint: '6 digits' },
  { code: 'CA-NU', name: 'Nunavut', country: 'CA', patterns: ['^\\d{5,6}$'], hint: '5-6 digits' },
  { code: 'CA-ON', name: 'Ontario', country: 'CA', patterns: ['^[A-Z]\\d{14}$', '^[A-Z0-9]{15,17}$'], hint: '1 letter + 14 digits (dashes optional)' },
  { code: 'CA-PE', name: 'Prince Edward Island', country: 'CA', patterns: ['^\\d{5,6}$'], hint: '5-6 digits' },
  { code: 'CA-QC', name: 'Quebec', country: 'CA', patterns: ['^[A-Z]\\d{12}$', '^[A-Z0-9]{8,13}$'], hint: 'Letter(s) + digits' },
  { code: 'CA-SK', name: 'Saskatchewan', country: 'CA', patterns: ['^\\d{8}$'], hint: '8 digits' },
  { code: 'CA-YT', name: 'Yukon', country: 'CA', patterns: ['^\\d{1,6}$'], hint: '1-6 digits' },
  { code: 'US-AL', name: 'Alabama', country: 'US', patterns: ['^\\d{1,8}$'], hint: '1-8 digits' },
  { code: 'US-AK', name: 'Alaska', country: 'US', patterns: ['^\\d{1,7}$'], hint: '1-7 digits' },
  { code: 'US-AZ', name: 'Arizona', country: 'US', patterns: ['^[A-Z0-9]\\d{8}$', '^\\d{9}$'], hint: '1 letter/digit + 8 digits' },
  { code: 'US-AR', name: 'Arkansas', country: 'US', patterns: ['^\\d{4,9}$'], hint: '4-9 digits' },
  { code: 'US-CA', name: 'California', country: 'US', patterns: ['^[A-Z]\\d{7}$'], hint: '1 letter + 7 digits' },
  { code: 'US-CO', name: 'Colorado', country: 'US', patterns: ['^\\d{9}$', '^[A-Z]\\d{3,6}$', '^[A-Z]{2}\\d{2,5}$'], hint: '9 digits or letter(s) + digits' },
  { code: 'US-CT', name: 'Connecticut', country: 'US', patterns: ['^\\d{9}$'], hint: '9 digits' },
  { code: 'US-DE', name: 'Delaware', country: 'US', patterns: ['^\\d{1,7}$'], hint: '1-7 digits' },
  { code: 'US-DC', name: 'District of Columbia', country: 'US', patterns: ['^\\d{7}$', '^\\d{9}$'], hint: '7 or 9 digits' },
  { code: 'US-FL', name: 'Florida', country: 'US', patterns: ['^[A-Z]\\d{12}$'], hint: '1 letter + 12 digits' },
  { code: 'US-GA', name: 'Georgia', country: 'US', patterns: ['^\\d{7,9}$'], hint: '7-9 digits' },
  { code: 'US-HI', name: 'Hawaii', country: 'US', patterns: ['^[A-Z]\\d{8}$', '^\\d{9}$'], hint: '1 letter + 8 digits or 9 digits' },
  { code: 'US-ID', name: 'Idaho', country: 'US', patterns: ['^[A-Z]{2}\\d{6}[A-Z]$', '^\\d{9}$'], hint: '2 letters + 6 digits + letter, or 9 digits' },
  { code: 'US-IL', name: 'Illinois', country: 'US', patterns: ['^[A-Z]\\d{11,12}$'], hint: '1 letter + 11-12 digits' },
  { code: 'US-IN', name: 'Indiana', country: 'US', patterns: ['^[A-Z]\\d{9}$', '^\\d{10}$'], hint: '1 letter + 9 digits or 10 digits' },
  { code: 'US-IA', name: 'Iowa', country: 'US', patterns: ['^\\d{9}$', '^\\d{3}[A-Z]{2}\\d{4}$'], hint: '9 digits or 3 digits + 2 letters + 4 digits' },
  { code: 'US-KS', name: 'Kansas', country: 'US', patterns: ['^[A-Z]\\d[A-Z]\\d[A-Z]$', '^[A-Z]\\d{8}$', '^\\d{9}$'], hint: 'Letter/digit pattern or 9 digits' },
  { code: 'US-KY', name: 'Kentucky', country: 'US', patterns: ['^[A-Z]\\d{8,9}$', '^\\d{9}$'], hint: '1 letter + 8-9 digits or 9 digits' },
  { code: 'US-LA', name: 'Louisiana', country: 'US', patterns: ['^\\d{1,9}$'], hint: '1-9 digits' },
  { code: 'US-ME', name: 'Maine', country: 'US', patterns: ['^\\d{7}$', '^\\d{7}[A-Z]$', '^\\d{8}$'], hint: '7-8 digits' },
  { code: 'US-MD', name: 'Maryland', country: 'US', patterns: ['^[A-Z]\\d{12}$'], hint: '1 letter + 12 digits' },
  { code: 'US-MA', name: 'Massachusetts', country: 'US', patterns: ['^[A-Z]\\d{8}$', '^\\d{9}$', '^SA\\d{7}$'], hint: '1 letter + 8 digits, 9 digits, or SA + 7 digits' },
  { code: 'US-MI', name: 'Michigan', country: 'US', patterns: ['^[A-Z]\\d{10}$', '^[A-Z]\\d{12}$'], hint: '1 letter + 10 or 12 digits' },
  { code: 'US-MN', name: 'Minnesota', country: 'US', patterns: ['^[A-Z]\\d{12}$'], hint: '1 letter + 12 digits' },
  { code: 'US-MS', name: 'Mississippi', country: 'US', patterns: ['^\\d{9}$'], hint: '9 digits' },
  { code: 'US-MO', name: 'Missouri', country: 'US', patterns: ['^\\d{3}[A-Z]\\d{6}$', '^[A-Z]\\d{5,9}$', '^\\d{8}[A-Z]{2}$', '^\\d{9}[A-Z]?$'], hint: 'Mixed letter/digit formats' },
  { code: 'US-MT', name: 'Montana', country: 'US', patterns: ['^[A-Z]\\d{8}$', '^\\d{9}$', '^\\d{13,14}$'], hint: 'Letter + digits or 9-14 digits' },
  { code: 'US-NE', name: 'Nebraska', country: 'US', patterns: ['^[A-Z]\\d{6,8}$'], hint: '1 letter + 6-8 digits' },
  { code: 'US-NV', name: 'Nevada', country: 'US', patterns: ['^\\d{9,10}$', '^\\d{12}$', '^X\\d{8}$'], hint: '9-12 digits or X + 8 digits' },
  { code: 'US-NH', name: 'New Hampshire', country: 'US', patterns: ['^\\d{2}[A-Z]{3}\\d{5}$'], hint: '2 digits + 3 letters + 5 digits' },
  { code: 'US-NJ', name: 'New Jersey', country: 'US', patterns: ['^[A-Z]\\d{14}$'], hint: '1 letter + 14 digits' },
  { code: 'US-NM', name: 'New Mexico', country: 'US', patterns: ['^\\d{8,9}$'], hint: '8-9 digits' },
  { code: 'US-NY', name: 'New York', country: 'US', patterns: ['^[A-Z]\\d{7}$', '^[A-Z]\\d{18}$', '^\\d{8,9}$', '^\\d{16}$', '^[A-Z]{8}$'], hint: 'Multiple NY formats' },
  { code: 'US-NC', name: 'North Carolina', country: 'US', patterns: ['^\\d{1,12}$'], hint: '1-12 digits' },
  { code: 'US-ND', name: 'North Dakota', country: 'US', patterns: ['^[A-Z]{3}\\d{6}$', '^\\d{9}$'], hint: '3 letters + 6 digits or 9 digits' },
  { code: 'US-OH', name: 'Ohio', country: 'US', patterns: ['^[A-Z]\\d{4,8}$', '^[A-Z]{2}\\d{3,7}$', '^\\d{8}$'], hint: 'Letter(s) + digits or 8 digits' },
  { code: 'US-OK', name: 'Oklahoma', country: 'US', patterns: ['^[A-Z]?\\d{9}$'], hint: 'Optional letter + 9 digits' },
  { code: 'US-OR', name: 'Oregon', country: 'US', patterns: ['^\\d{1,9}$'], hint: '1-9 digits' },
  { code: 'US-PA', name: 'Pennsylvania', country: 'US', patterns: ['^\\d{8}$'], hint: '8 digits' },
  { code: 'US-RI', name: 'Rhode Island', country: 'US', patterns: ['^\\d{7}$', '^[A-Z]\\d{6}$'], hint: '7 digits or 1 letter + 6 digits' },
  { code: 'US-SC', name: 'South Carolina', country: 'US', patterns: ['^\\d{5,11}$'], hint: '5-11 digits' },
  { code: 'US-SD', name: 'South Dakota', country: 'US', patterns: ['^\\d{6,10}$', '^\\d{12}$'], hint: '6-12 digits' },
  { code: 'US-TN', name: 'Tennessee', country: 'US', patterns: ['^\\d{7,9}$'], hint: '7-9 digits' },
  { code: 'US-TX', name: 'Texas', country: 'US', patterns: ['^\\d{7,8}$'], hint: '7-8 digits' },
  { code: 'US-UT', name: 'Utah', country: 'US', patterns: ['^\\d{4,10}$'], hint: '4-10 digits' },
  { code: 'US-VT', name: 'Vermont', country: 'US', patterns: ['^\\d{8}$', '^\\d{7}A$'], hint: '8 digits or 7 digits + A' },
  { code: 'US-VA', name: 'Virginia', country: 'US', patterns: ['^[A-Z]\\d{8,11}$', '^\\d{9}$'], hint: '1 letter + 8-11 digits or 9 digits' },
  { code: 'US-WA', name: 'Washington', country: 'US', patterns: ['^[A-Z0-9]{12}$'], hint: '12 letters or digits' },
  { code: 'US-WV', name: 'West Virginia', country: 'US', patterns: ['^\\d{7}$', '^[A-Z]{1,2}\\d{5,6}$'], hint: '7 digits or letter(s) + digits' },
  { code: 'US-WI', name: 'Wisconsin', country: 'US', patterns: ['^[A-Z]\\d{13}$'], hint: '1 letter + 13 digits' },
  { code: 'US-WY', name: 'Wyoming', country: 'US', patterns: ['^\\d{9,10}$'], hint: '9-10 digits' },
];

const REGION_BY_CODE = Object.fromEntries(LICENSE_REGIONS.map((region) => [region.code, region]));

export function normalizeLicenseNumber(value: string): string {
  return (value || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

export function getLicenseRegionHint(regionCode: string): string {
  return REGION_BY_CODE[regionCode]?.hint || '';
}

export function validateDriverLicenseNumber(
  regionCode: string,
  licenseNumber: string,
): { ok: true; normalized: string } | { ok: false; message: string } {
  const region = REGION_BY_CODE[regionCode];
  if (!region) {
    return { ok: false, message: 'Select a province or state.' };
  }

  const normalized = normalizeLicenseNumber(licenseNumber);
  if (!normalized) {
    return { ok: false, message: 'Driver license number is required.' };
  }

  const matches = region.patterns.some((pattern) => new RegExp(pattern).test(normalized));
  if (!matches) {
    return {
      ok: false,
      message: `Invalid ${region.name} driver license format. Expected: ${region.hint}.`,
    };
  }

  return { ok: true, normalized };
}

export function listRegionsForCountry(country: 'CA' | 'US'): LicenseRegion[] {
  return LICENSE_REGIONS.filter((region) => region.country === country);
}
