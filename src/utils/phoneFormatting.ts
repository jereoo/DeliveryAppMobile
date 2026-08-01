/** North America: 10-digit phone (area code 1 assumed). Format: (XXX) XXX-XXXX */
export function formatPhone10(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 10);
  if (d.length >= 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length >= 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return d;
}

export function getPhoneDigits(value: string): string {
  return (value || '').replace(/\D/g, '').slice(0, 10);
}

export function formatPhoneForDisplay(value: string): string {
  const d = (value || '').replace(/\D/g, '').slice(0, 10);
  return d ? formatPhone10(d) : '';
}
