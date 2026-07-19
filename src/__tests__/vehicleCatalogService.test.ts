import {
  fetchVehicleCatalog,
  findModelSpec,
  isYearValidForSpec,
  manufacturerIdForSpec,
  modelsForManufacturer,
  type VehicleManufacturer,
} from '../services/vehicleCatalogService';

const sampleCatalog: VehicleManufacturer[] = [
  {
    id: 1,
    name: 'Ford',
    models: [
      {
        id: 10,
        manufacturer_name: 'Ford',
        name: 'F-150',
        start_year: 1999,
        end_year: null,
        max_payload_lb: 3325,
        max_payload_kg: 1508,
        max_towing_lb: 14000,
        max_capacity_kg: 1508,
        max_capacity_lb: 3325,
        notes: '',
      },
      {
        id: 11,
        manufacturer_name: 'Ford',
        name: 'Ranger',
        start_year: 1999,
        end_year: 2011,
        max_payload_lb: 1800,
        max_payload_kg: 816,
        max_towing_lb: 7500,
        max_capacity_kg: 816,
        max_capacity_lb: 1800,
        notes: 'Mid-size',
      },
    ],
  },
  {
    id: 2,
    name: 'Toyota',
    models: [
      {
        id: 20,
        manufacturer_name: 'Toyota',
        name: 'Tundra',
        start_year: 2000,
        end_year: null,
        max_payload_lb: 1940,
        max_payload_kg: 880,
        max_towing_lb: 12000,
        max_capacity_kg: 880,
        max_capacity_lb: 1940,
        notes: '',
      },
    ],
  },
];

describe('vehicleCatalogService', () => {
  it('fetchVehicleCatalog parses array response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleCatalog,
    }) as any;

    const catalog = await fetchVehicleCatalog('https://example.com/api');
    expect(catalog).toHaveLength(2);
    expect(catalog[0].models[0].name).toBe('F-150');
  });

  it('fetchVehicleCatalog parses paginated results', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: sampleCatalog }),
    }) as any;

    const catalog = await fetchVehicleCatalog('https://example.com/api');
    expect(catalog[0].name).toBe('Ford');
  });

  it('fetchVehicleCatalog throws on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as any;
    await expect(fetchVehicleCatalog('https://example.com/api')).rejects.toThrow('500');
  });

  it('findModelSpec returns matching model', () => {
    expect(findModelSpec(sampleCatalog, 10)?.name).toBe('F-150');
    expect(findModelSpec(sampleCatalog, 999)).toBeUndefined();
    expect(findModelSpec(sampleCatalog, null)).toBeUndefined();
  });

  it('modelsForManufacturer filters by manufacturer id', () => {
    expect(modelsForManufacturer(sampleCatalog, 1)).toHaveLength(2);
    expect(modelsForManufacturer(sampleCatalog, null)).toEqual([]);
    expect(modelsForManufacturer(sampleCatalog, 99)).toEqual([]);
  });

  it('manufacturerIdForSpec finds parent manufacturer', () => {
    expect(manufacturerIdForSpec(sampleCatalog, 20)).toBe(2);
    expect(manufacturerIdForSpec(sampleCatalog, null)).toBeNull();
    expect(manufacturerIdForSpec(sampleCatalog, 999)).toBeNull();
  });

  it('isYearValidForSpec checks year range', () => {
    const f150 = sampleCatalog[0].models[0];
    const ranger = sampleCatalog[0].models[1];
    expect(isYearValidForSpec(f150, 2020)).toBe(true);
    expect(isYearValidForSpec(f150, 1990)).toBe(false);
    expect(isYearValidForSpec(ranger, 2012)).toBe(false);
    expect(isYearValidForSpec(ranger, 2005)).toBe(true);
  });
});
