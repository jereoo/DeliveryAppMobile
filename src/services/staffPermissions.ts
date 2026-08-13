/**
 * Staff RBAC helpers — mirrors backend permission codes (Phase 4G).
 */

import type { MeResponse, UserRole } from './authService';

export const PERM_STAFF_MANAGE = 'staff.manage';
export const PERM_DRIVERS_APPROVE = 'drivers.approve';
export const PERM_DRIVERS_VIEW = 'drivers.view';
export const PERM_COMPLIANCE_VERIFY = 'compliance.verify';
export const PERM_COMPLIANCE_VIEW = 'compliance.view';
export const PERM_DELIVERIES_ASSIGN = 'deliveries.assign';
export const PERM_DELIVERIES_VIEW = 'deliveries.view';
export const PERM_RESOURCES_WRITE = 'resources.write';
export const PERM_RESOURCES_VIEW = 'resources.view';
export const PERM_VEHICLES_REACTIVATE = 'vehicles.reactivate';
export const PERM_VEHICLES_VIEW = 'vehicles.view';
export const PERM_REPORTS_VIEW = 'reports.view';

export const STAFF_ROLE_OPTIONS = [
  { value: 'operations_admin', label: 'Operations Admin' },
  { value: 'compliance_reviewer', label: 'Compliance Reviewer' },
  { value: 'read_only', label: 'Read Only' },
  { value: 'super_admin', label: 'Super Admin' },
] as const;

export const STAFF_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  operations_admin: 'Operations Admin',
  compliance_reviewer: 'Compliance Reviewer',
  read_only: 'Read Only',
};

export type AdminScreenId =
  | 'admin_compliance'
  | 'admin_customers'
  | 'admin_drivers'
  | 'admin_vehicles'
  | 'admin_deliveries'
  | 'admin_driver_vehicles'
  | 'admin_staff';

const ADMIN_SCREEN_PERMISSIONS: Record<AdminScreenId, string | string[]> = {
  admin_compliance: [PERM_REPORTS_VIEW, PERM_COMPLIANCE_VIEW],
  admin_customers: PERM_RESOURCES_VIEW,
  admin_drivers: PERM_DRIVERS_VIEW,
  admin_vehicles: PERM_VEHICLES_VIEW,
  admin_deliveries: PERM_DELIVERIES_VIEW,
  admin_driver_vehicles: [PERM_DRIVERS_VIEW, PERM_RESOURCES_VIEW],
  admin_staff: PERM_STAFF_MANAGE,
};

export function isOperationalUser(userType: UserRole | null): boolean {
  return userType === 'admin' || userType === 'staff';
}

export function hasStaffPermission(
  permissions: string[] | undefined,
  permission: string,
): boolean {
  return (permissions ?? []).includes(permission);
}

export function hasAnyStaffPermission(
  permissions: string[] | undefined,
  codes: string[],
): boolean {
  return codes.some((code) => hasStaffPermission(permissions, code));
}

export function canAccessAdminScreen(
  userType: UserRole | null,
  permissions: string[] | undefined,
  screen: AdminScreenId,
): boolean {
  if (!isOperationalUser(userType)) {
    return false;
  }
  if (userType === 'admin') {
    return true;
  }
  const required = ADMIN_SCREEN_PERMISSIONS[screen];
  if (Array.isArray(required)) {
    return hasAnyStaffPermission(permissions, required);
  }
  return hasStaffPermission(permissions, required);
}

export function staffRoleLabel(me: Pick<MeResponse, 'staff_role'> | null | undefined): string | null {
  if (!me?.staff_role) {
    return null;
  }
  return STAFF_ROLE_LABELS[me.staff_role] ?? me.staff_role;
}
