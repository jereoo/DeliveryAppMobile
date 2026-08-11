export type AdminAccountStatusFilter = 'all' | 'active' | 'inactive';

export function getUniqueSortedStrings(
  values: string[],
  direction: 'asc' | 'desc' = 'desc',
): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }
  return Array.from(unique).sort((a, b) => (
    direction === 'desc'
      ? b.localeCompare(a, undefined, { sensitivity: 'base' })
      : a.localeCompare(b, undefined, { sensitivity: 'base' })
  ));
}

export function compareStringsDesc(a: string, b: string): number {
  return b.localeCompare(a, undefined, { sensitivity: 'base' });
}

export function compareStringsAsc(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

export function matchesAccountStatus(
  active: boolean | undefined,
  filter: AdminAccountStatusFilter,
): boolean {
  if (filter === 'active') {
    return active !== false;
  }
  if (filter === 'inactive') {
    return active === false;
  }
  return true;
}

export function extractLastNameFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

/** Case-insensitive partial match for admin list search boxes. */
export function matchesAdminTextSearch(value: string | number | undefined | null, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  return String(value ?? '').toLowerCase().includes(normalizedQuery);
}
