import {
  DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
  filterAndSortAdminDrivers,
  getUniqueDriverLastNames,
} from '../services/driverService';

describe('admin driver list filters', () => {
  const sampleDrivers = [
    { id: 1, first_name: 'Alice', last_name: 'Brown', active: true, approval_status: 'APPROVED' as const },
    { id: 2, first_name: 'Bob', last_name: 'Smith', active: false, approval_status: 'PENDING' as const },
    { id: 3, first_name: 'Carol', last_name: 'Smith', active: true, approval_status: 'REJECTED' as const },
    { id: 4, first_name: 'Dan', last_name: 'Adams', active: true, approval_status: 'APPROVED' as const },
  ];

  it('returns unique last names sorted descending', () => {
    expect(getUniqueDriverLastNames(sampleDrivers)).toEqual(['Smith', 'Brown', 'Adams']);
  });

  it('sorts drivers by last name descending', () => {
    const result = filterAndSortAdminDrivers(sampleDrivers, DEFAULT_ADMIN_DRIVER_LIST_FILTERS);
    expect(result.map((d) => d.last_name)).toEqual(['Smith', 'Smith', 'Brown', 'Adams']);
  });

  it('filters by last name', () => {
    const result = filterAndSortAdminDrivers(sampleDrivers, {
      ...DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
      lastName: 'Smith',
    });
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.last_name === 'Smith')).toBe(true);
  });

  it('filters by account status', () => {
    const inactive = filterAndSortAdminDrivers(sampleDrivers, {
      ...DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
      accountStatus: 'inactive',
    });
    expect(inactive).toHaveLength(1);
    expect(inactive[0].first_name).toBe('Bob');

    const active = filterAndSortAdminDrivers(sampleDrivers, {
      ...DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
      accountStatus: 'active',
    });
    expect(active).toHaveLength(3);
  });

  it('filters by approval status', () => {
    const pending = filterAndSortAdminDrivers(sampleDrivers, {
      ...DEFAULT_ADMIN_DRIVER_LIST_FILTERS,
      approvalStatus: 'PENDING',
    });
    expect(pending).toHaveLength(1);
    expect(pending[0].first_name).toBe('Bob');
  });
});
