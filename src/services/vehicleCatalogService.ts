export type VehicleModelSpec = {
  id: number;
  manufacturer_name: string;
  name: string;
  start_year: number;
  end_year: number | null;
  max_payload_lb: number;
  max_payload_kg: number;
  max_towing_lb: number;
  max_capacity_kg: number;
  max_capacity_lb: number;
  notes: string;
};

export type VehicleManufacturer = {
  id: number;
  name: string;
  models: VehicleModelSpec[];
};

export async function fetchVehicleCatalog(apiBase: string): Promise<VehicleManufacturer[]> {
  const response = await fetch(`${apiBase}/vehicle-catalog/`);
  if (!response.ok) {
    throw new Error(`Failed to load vehicle catalog (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

export function findModelSpec(
  catalog: VehicleManufacturer[],
  specId: number | null | undefined,
): VehicleModelSpec | undefined {
  if (!specId) return undefined;
  for (const manufacturer of catalog) {
    const match = manufacturer.models.find((model) => model.id === specId);
    if (match) return match;
  }
  return undefined;
}

export function modelsForManufacturer(
  catalog: VehicleManufacturer[],
  manufacturerId: number | null,
): VehicleModelSpec[] {
  if (!manufacturerId) return [];
  return catalog.find((item) => item.id === manufacturerId)?.models ?? [];
}

export function manufacturerIdForSpec(
  catalog: VehicleManufacturer[],
  specId: number | null | undefined,
): number | null {
  if (!specId) return null;
  for (const manufacturer of catalog) {
    if (manufacturer.models.some((model) => model.id === specId)) {
      return manufacturer.id;
    }
  }
  return null;
}

export function isYearValidForSpec(spec: VehicleModelSpec, year: number): boolean {
  if (!year || year < spec.start_year) return false;
  if (spec.end_year != null && year > spec.end_year) return false;
  return true;
}
