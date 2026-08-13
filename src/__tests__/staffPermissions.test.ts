import {
  canAccessAdminScreen,
  hasStaffPermission,
  isOperationalUser,
  PERM_COMPLIANCE_VERIFY,
  PERM_DELIVERIES_ASSIGN,
  PERM_REPORTS_VIEW,
  PERM_RESOURCES_VIEW,
  PERM_STAFF_MANAGE,
} from '../services/staffPermissions';

describe('staffPermissions', () => {
  const reviewerPerms = [
    'compliance.verify',
    'compliance.view',
    'deliveries.view',
    'drivers.view',
    'reports.view',
    'resources.view',
    'vehicles.view',
  ];

  it('treats admin as full access', () => {
    expect(canAccessAdminScreen('admin', [], 'admin_staff')).toBe(true);
    expect(canAccessAdminScreen('admin', [], 'admin_deliveries')).toBe(true);
  });

  it('gates staff screens by permission', () => {
    expect(canAccessAdminScreen('staff', reviewerPerms, 'admin_compliance')).toBe(true);
    expect(canAccessAdminScreen('staff', reviewerPerms, 'admin_deliveries')).toBe(true);
    expect(canAccessAdminScreen('staff', reviewerPerms, 'admin_staff')).toBe(false);
  });

  it('identifies operational users', () => {
    expect(isOperationalUser('admin')).toBe(true);
    expect(isOperationalUser('staff')).toBe(true);
    expect(isOperationalUser('driver')).toBe(false);
  });

  it('checks individual permissions', () => {
    expect(hasStaffPermission(reviewerPerms, PERM_COMPLIANCE_VERIFY)).toBe(true);
    expect(hasStaffPermission(reviewerPerms, PERM_STAFF_MANAGE)).toBe(false);
    expect(hasStaffPermission(reviewerPerms, PERM_DELIVERIES_ASSIGN)).toBe(false);
    expect(hasStaffPermission(reviewerPerms, PERM_REPORTS_VIEW)).toBe(true);
    expect(hasStaffPermission(reviewerPerms, PERM_RESOURCES_VIEW)).toBe(true);
  });
});
