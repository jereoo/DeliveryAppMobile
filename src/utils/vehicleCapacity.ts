/** Max vehicle load capacity by unit. */
export const MAX_VEHICLE_CAPACITY_KG = 2000;
export const MAX_VEHICLE_CAPACITY_LB = 4400;
const KG_TO_LB = 2.2046226218;

export function maxVehicleCapacity(unit: string): number {
  return unit === 'lb' ? MAX_VEHICLE_CAPACITY_LB : MAX_VEHICLE_CAPACITY_KG;
}

function convertCapacityBetweenUnits(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit || value <= 0 || Number.isNaN(value)) {
    return value;
  }
  if (fromUnit === 'kg' && toUnit === 'lb') {
    return Math.round(value * KG_TO_LB);
  }
  if (fromUnit === 'lb' && toUnit === 'kg') {
    return Math.round(value / KG_TO_LB);
  }
  return value;
}

export function validateCapacityText(text: string, unit: string): string | null {
  if (!text.trim()) {
    return 'Capacity is required';
  }
  const capacity = parseInt(text, 10);
  if (Number.isNaN(capacity) || capacity < 1) {
    return 'Capacity must be at least 1';
  }
  const capMax = maxVehicleCapacity(unit);
  if (capacity > capMax) {
    return `Maximum capacity is ${capMax} ${unit}`;
  }
  return null;
}

export function clampCapacityText(text: string, unit: string): string {
  const numericText = text.replace(/[^0-9]/g, '');
  if (!numericText) {
    return '';
  }
  const capMax = maxVehicleCapacity(unit);
  const capacity = parseInt(numericText, 10);
  if (Number.isNaN(capacity)) {
    return '';
  }
  if (capacity > capMax) {
    return String(capMax);
  }
  return numericText;
}

export function nextCapacityAfterInput(text: string, unit: string): {
  text: string;
  error: string | null;
  rejected: boolean;
} {
  const numericText = text.replace(/[^0-9]/g, '');
  const capMax = maxVehicleCapacity(unit);
  if (numericText.length > String(capMax).length) {
    return { text: '', error: null, rejected: true };
  }
  if (numericText) {
    const capacity = parseInt(numericText, 10);
    if (!Number.isNaN(capacity) && capacity > capMax) {
      return {
        text: numericText,
        error: `Maximum capacity is ${capMax} ${unit}`,
        rejected: true,
      };
    }
  }
  return {
    text: numericText,
    error: numericText ? validateCapacityText(numericText, unit) : 'Capacity is required',
    rejected: false,
  };
}

export function convertCapacityTextForUnit(
  capacityText: string,
  fromUnit: string,
  toUnit: 'kg' | 'lb',
): { text: string; error: string | null } {
  const current = parseInt(capacityText, 10);
  let nextText = capacityText;
  if (!Number.isNaN(current) && current > 0) {
    nextText = String(convertCapacityBetweenUnits(current, fromUnit, toUnit));
  }
  nextText = clampCapacityText(nextText, toUnit);
  return {
    text: nextText,
    error: nextText ? validateCapacityText(nextText, toUnit) : 'Capacity is required',
  };
}
