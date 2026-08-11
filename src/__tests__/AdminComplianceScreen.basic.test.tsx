import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AdminComplianceScreen } from '../components/AdminComplianceScreen';

jest.mock('../services/complianceService', () => ({
  DOCUMENT_TYPE_LABELS: { DRIVER_LICENSE: 'Driver licence' },
  DOCUMENT_TYPES_REQUIRING_EXPIRY: [],
  DEFAULT_ADMIN_COMPLIANCE_LIST_FILTERS: {
    documentType: 'all',
    subjectType: 'all',
    status: 'all',
  },
  adminComplianceFiltersAreActive: jest.fn(() => false),
  filterAdminComplianceDocuments: jest.fn((rows: unknown[]) => rows),
  getFleetComplianceSummary: jest.fn().mockResolvedValue({
    documents_pending: 1,
    documents_expired: 0,
    documents_expiring_soon: 2,
    drivers_pending_approval: 0,
    drivers_rejected: 0,
    expiring_within_days: 30,
  }),
  listAdminComplianceInbox: jest.fn().mockResolvedValue([]),
  listAdminExpiringDocuments: jest.fn().mockResolvedValue([]),
  openDocumentDownload: jest.fn(),
  rejectDocument: jest.fn(),
  verifyDocument: jest.fn(),
}));

const theme = {
  text: '#111',
  textMuted: '#666',
  error: '#c00',
  surface: '#fff',
  border: '#ccc',
  inputBg: '#f5f5f5',
};

const styles = {
  container: {},
  content: {},
  title: {},
  sectionTitle: {},
  label: {},
  input: {},
  itemContainer: {},
  buttonContainer: {},
  emptyText: {},
};

describe('AdminComplianceScreen', () => {
  it('renders compliance ops title and summary after load', async () => {
    const request = jest.fn();
    const { getByText } = render(
      <AdminComplianceScreen
        onBack={jest.fn()}
        request={request}
        theme={theme}
        styles={styles}
      />,
    );

    await waitFor(() => {
      expect(getByText('Compliance ops')).toBeTruthy();
      expect(getByText(/Pending documents: 1/)).toBeTruthy();
    });
  });
});
