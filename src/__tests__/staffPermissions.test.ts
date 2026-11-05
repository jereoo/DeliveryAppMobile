import {
  canAccessAdminScreen,
  canAccessParticipantScreen,
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

  it('blocks staff from customer and driver participant screens', () => {
    expect(canAccessParticipantScreen('staff', 'delivery_request')).toBe(false);
    expect(canAccessParticipantScreen('staff', 'driver_compliance')).toBe(false);
    expect(canAccessParticipantScreen('staff', 'customer_register')).toBe(false);
    expect(canAccessParticipantScreen('driver', 'delivery_request')).toBe(true);
    expect(canAccessParticipantScreen('driver', 'customer_register')).toBe(false);
    expect(canAccessParticipantScreen('customer', 'delivery_request')).toBe(true);
    expect(canAccessParticipantScreen('customer', 'register_driver')).toBe(false);
    expect(canAccessParticipantScreen(null, 'customer_register')).toBe(true);
  });
});
