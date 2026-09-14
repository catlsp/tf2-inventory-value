export function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

export function formatKeysRef(midKeys: number | null, midRef: number | null): string {
  if (midKeys == null || midRef == null) return '—';
  if (midKeys >= 1) {
    const label = Math.abs(midKeys - 1) < 0.005 ? 'key' : 'keys';
    return `${formatNumber(midKeys)} ${label}`;
  }
  return `${formatNumber(midRef)} ref`;
}
