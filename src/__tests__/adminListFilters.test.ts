import {
  DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
  filterAndSortAdminDrivers,
} from '../services/driverService';
import {
  DEFAULT_ADMIN_CUSTOMER_LIST_FILTERS,
  filterAndSortAdminCustomers,
  getUniqueCustomerLastNames,
} from '../services/customerService';
import {
  DEFAULT_ADMIN_DELIVERY_LIST_FILTERS,
  filterAndSortAdminDeliveries,
} from '../services/deliveryService';
import {
  DEFAULT_ADMIN_VEHICLE_LIST_FILTERS,
  filterAndSortAdminVehicles,
} from '../services/vehicleService';
import {
  DEFAULT_ADMIN_DRIVER_VEHICLE_LIST_FILTERS,
  filterAndSortAdminDriverVehicles,
} from '../services/assignmentService';
import {
  DEFAULT_ADMIN_COMPLIANCE_LIST_FILTERS,
  filterAdminComplianceDocuments,
} from '../services/complianceService';

describe('admin list filters', () => {
  it('filters customers by last name and business type', () => {
    const customers = [
      { id: 1, first_name: 'A', last_name: 'Smith', is_business: false, active: true, address_country: 'US' },
      { id: 2, first_name: 'B', last_name: 'Jones', is_business: true, active: true, address_country: 'CA' },
    ];
    expect(getUniqueCustomerLastNames(customers)).toEqual(['Smith', 'Jones']);
    const filtered = filterAndSortAdminCustomers(customers, {
      ...DEFAULT_ADMIN_CUSTOMER_LIST_FILTERS,
      customerType: 'business',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].last_name).toBe('Jones');
  });

  it('searches customers by name', () => {
    const customers = [
      { id: 1, first_name: 'Jane', last_name: 'Smith', is_business: false, active: true, address_country: 'US' },
      { id: 2, first_name: 'Bob', last_name: 'Jones', is_business: false, active: true, address_country: 'US' },
    ];
    const result = filterAndSortAdminCustomers(customers, {
      ...DEFAULT_ADMIN_CUSTOMER_LIST_FILTERS,
      customerNameSearch: 'jane sm',
    });
    expect(result).toHaveLength(1);
    expect(result[0].last_name).toBe('Smith');
  });

  it('searches drivers by name', () => {
    const drivers = [
      { first_name: 'Alice', last_name: 'Brown', active: true, approval_status: 'APPROVED' as const },
      { first_name: 'Carl', last_name: 'Smith', active: true, approval_status: 'APPROVED' as const },
    ];
    const result = filterAndSortAdminDrivers(drivers, {
      ...DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
      driverNameSearch: 'smith',
    });
    expect(result).toHaveLength(1);
    expect(result[0].last_name).toBe('Smith');
  });

  it('filters deliveries by status and sorts by customer name', () => {
    const deliveries = [
      { id: 1, customer_name: 'Zed Corp', status: 'Pending', created_at: '2026-08-01T00:00:00Z' },
      { id: 2, customer_name: 'Alpha Co', status: 'Completed', created_at: '2026-08-02T00:00:00Z' },
      { id: 3, customer_name: 'Beta LLC', status: 'Pending', created_at: '2026-08-03T00:00:00Z' },
    ];
    const pending = filterAndSortAdminDeliveries(deliveries, {
      ...DEFAULT_ADMIN_DELIVERY_LIST_FILTERS,
      status: 'Pending',
    });
    expect(pending).toHaveLength(2);

    const byCustomer = filterAndSortAdminDeliveries(deliveries, {
      ...DEFAULT_ADMIN_DELIVERY_LIST_FILTERS,
      sort: 'customer_az',
    });
    expect(byCustomer.map((d) => d.customer_name)).toEqual(['Alpha Co', 'Beta LLC', 'Zed Corp']);
  });

  it('searches deliveries by delivery number (id)', () => {
    const deliveries = [
      { id: 12, customer_name: 'A', status: 'Pending', created_at: '2026-08-01T00:00:00Z' },
      { id: 120, customer_name: 'B', status: 'Pending', created_at: '2026-08-02T00:00:00Z' },
    ];
    const result = filterAndSortAdminDeliveries(deliveries, {
      ...DEFAULT_ADMIN_DELIVERY_LIST_FILTERS,
      deliveryIdSearch: '12',
    });
    expect(result).toHaveLength(2);
    const exact = filterAndSortAdminDeliveries(deliveries, {
      ...DEFAULT_ADMIN_DELIVERY_LIST_FILTERS,
      deliveryIdSearch: '120',
    });
    expect(exact).toHaveLength(1);
    expect(exact[0].id).toBe(120);
  });

  it('filters vehicles by operational and approval status', () => {
    const vehicles = [
      { id: 1, license_plate: 'B123', make: 'Ford', model: 'F-150', year: 2020, active: true, approval_status: 'PENDING' },
      { id: 2, license_plate: 'A123', make: 'Toyota', model: 'Tacoma', year: 2022, active: false, approval_status: 'APPROVED' },
    ];
    const activePending = filterAndSortAdminVehicles(vehicles, {
      ...DEFAULT_ADMIN_VEHICLE_LIST_FILTERS,
      operationalStatus: 'active',
      approvalStatus: 'PENDING',
    });
    expect(activePending).toHaveLength(1);
    expect(activePending[0].license_plate).toBe('B123');
  });

  it('searches vehicles by license plate', () => {
    const vehicles = [
      { id: 1, license_plate: 'DEMO001', make: 'Ford', model: 'F-150', year: 2020, active: true, approval_status: 'APPROVED' },
      { id: 2, license_plate: 'ABC123', make: 'Toyota', model: 'Tacoma', year: 2022, active: true, approval_status: 'APPROVED' },
    ];
    const result = filterAndSortAdminVehicles(vehicles, {
      ...DEFAULT_ADMIN_VEHICLE_LIST_FILTERS,
      licensePlateSearch: 'demo',
    });
    expect(result).toHaveLength(1);
    expect(result[0].license_plate).toBe('DEMO001');
  });

  it('filters driver-vehicle assignments by active status', () => {
    const rows = [
      { id: 1, driver_name: 'Bob Smith', vehicle_license_plate: 'XYZ', assigned_from: '2026-01-01', assigned_to: null },
      { id: 2, driver_name: 'Ann Lee', vehicle_license_plate: 'ABC', assigned_from: '2026-02-01', assigned_to: '2026-03-01' },
    ];
    const active = filterAndSortAdminDriverVehicles(rows, {
      ...DEFAULT_ADMIN_DRIVER_VEHICLE_LIST_FILTERS,
      assignmentStatus: 'active',
    });
    expect(active).toHaveLength(1);
    expect(active[0].driver_name).toBe('Bob Smith');
  });

  it('filters compliance documents by type and subject', () => {
    const rows = [
      { document_id: 1, document_type: 'DRIVER_LICENSE' as const, status: 'PENDING' as const, driver_id: 1, vehicle_id: null },
      { document_id: 2, document_type: 'VEHICLE_REGISTRATION' as const, status: 'EXPIRED' as const, driver_id: null, vehicle_id: 2 },
    ];
    const driverDocs = filterAdminComplianceDocuments(rows, {
      ...DEFAULT_ADMIN_COMPLIANCE_LIST_FILTERS,
      subjectType: 'driver',
    });
    expect(driverDocs).toHaveLength(1);

    const expired = filterAdminComplianceDocuments(rows, {
      ...DEFAULT_ADMIN_COMPLIANCE_LIST_FILTERS,
      status: 'EXPIRED',
    });
    expect(expired).toHaveLength(1);
  });
});
