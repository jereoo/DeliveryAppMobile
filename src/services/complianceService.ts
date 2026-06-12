/**
 * Legal document / compliance API — mirrors backend Phase 4A endpoints.
 */

import type { AuthenticatedRequest } from './vehicleService';

export type DocumentType =
  | 'DRIVER_LICENSE'
  | 'VEHICLE_REGISTRATION'
  | 'COMMERCIAL_INSURANCE'
  | 'INSPECTION';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type CoverageType = 'COMMERCIAL' | 'PERSONAL' | 'OTHER';

export interface LegalDocument {
  id: number;
  document_type: DocumentType;
  driver: number | null;
  vehicle: number | null;
  policy_number?: string | null;
  issuer?: string | null;
  coverage_type?: CoverageType | null;
  effective_date?: string | null;
  expiry_date?: string | null;
  file_key?: string | null;
  file_name?: string | null;
  status: DocumentStatus;
  verified_by?: number | null;
  verified_by_username?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ComplianceSummary {
  pending: number;
  verified: number;
  rejected: number;
  expired: number;
  expiring_soon: number;
  missing_types: DocumentType[];
  is_fully_compliant: boolean;
}

export interface CreateDocumentPayload {
  document_type: DocumentType;
  policy_number?: string;
  issuer?: string;
  coverage_type?: CoverageType;
  effective_date?: string;
  expiry_date?: string;
  notes?: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DRIVER_LICENSE: 'Driver license',
  VEHICLE_REGISTRATION: 'Vehicle registration',
  COMMERCIAL_INSURANCE: 'Commercial insurance',
  INSPECTION: 'Inspection',
};

export const DRIVER_DOCUMENT_TYPES: DocumentType[] = ['DRIVER_LICENSE'];

export const VEHICLE_DOCUMENT_TYPES: DocumentType[] = [
  'VEHICLE_REGISTRATION',
  'COMMERCIAL_INSURANCE',
  'INSPECTION',
];

export async function parseComplianceError(
  response: Response,
  fallback = 'Compliance request failed',
): Promise<string> {
  const body = await response.json().catch(() => ({} as Record<string, unknown>));
  const msg = body.error || body.detail
    || (typeof body === 'object' && Object.keys(body).length
      ? Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join('\n')
      : fallback);
  return typeof msg === 'string' ? msg : fallback;
}

export async function listDriverDocuments(
  request: AuthenticatedRequest,
  driverId: number,
): Promise<LegalDocument[]> {
  const response = await request(`/drivers/${driverId}/documents/`);
  if (!response.ok) {
    throw new Error(await parseComplianceError(response));
  }
  return response.json();
}

export async function listVehicleDocuments(
  request: AuthenticatedRequest,
  vehicleId: number,
): Promise<LegalDocument[]> {
  const response = await request(`/vehicles/${vehicleId}/documents/`);
  if (!response.ok) {
    throw new Error(await parseComplianceError(response));
  }
  return response.json();
}

export async function createDriverDocument(
  request: AuthenticatedRequest,
  driverId: number,
  payload: CreateDocumentPayload,
): Promise<LegalDocument> {
  const response = await request(`/drivers/${driverId}/documents/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseComplianceError(response));
  }
  return response.json();
}

export async function createVehicleDocument(
  request: AuthenticatedRequest,
  vehicleId: number,
  payload: CreateDocumentPayload,
): Promise<LegalDocument> {
  const response = await request(`/vehicles/${vehicleId}/documents/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseComplianceError(response));
  }
  return response.json();
}

export async function verifyDocument(
  request: AuthenticatedRequest,
  documentId: number,
  notes?: string,
): Promise<LegalDocument> {
  const response = await request(`/documents/${documentId}/verify/`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || '' }),
  });
  if (!response.ok) {
    throw new Error(await parseComplianceError(response));
  }
  return response.json();
}

export async function rejectDocument(
  request: AuthenticatedRequest,
  documentId: number,
  rejectionReason: string,
): Promise<LegalDocument> {
  const response = await request(`/documents/${documentId}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  if (!response.ok) {
    throw new Error(await parseComplianceError(response));
  }
  return response.json();
}

export async function getMyComplianceStatus(
  request: AuthenticatedRequest,
): Promise<ComplianceSummary> {
  const response = await request('/drivers/me/compliance-status/');
  if (!response.ok) {
    throw new Error(await parseComplianceError(response));
  }
  return response.json();
}
