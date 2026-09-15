/** TF2 weapon-unit refined steps: 9 weapons is 0.49, not 0.50. Then +1 per 18 weapons. */
const WEAPON_REF_STEPS = [
  0, 0.05, 0.11, 0.16, 0.22, 0.27, 0.33, 0.38, 0.44, 0.49, 0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94,
] as const;

export function roundRef(ref: number): number {
  if (!Number.isFinite(ref) || ref === 0) return 0;
  const sign = ref < 0 ? -1 : 1;
  const weapons = Math.round(Math.abs(ref) * 18);
  const refined = Math.floor(weapons / 18);
  const remainder = weapons % 18;
  return sign * (refined + WEAPON_REF_STEPS[remainder]!);
}

export function formatRefAmount(ref: number): string {
  const rounded = roundRef(ref);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2);
}

export function formatNumber(value: number): string {
  return formatRefAmount(value);
}

/**
 * backpack.tf-style: `0.11 ref`, `1.33 ref`, `1 key`, `1 key 40 ref`.
 * `keyRef` is refined-per-key; if omitted it is derived from midKeys/midRef.
 */
export function formatKeysRef(midKeys: number | null, midRef: number | null, keyRef?: number): string {
  if (midKeys == null || midRef == null) return '—';
  const rate =
    keyRef != null && keyRef > 1
      ? keyRef
      : Math.abs(midKeys) > 1e-9
        ? midRef / midKeys
        : 0;
  return formatBptf(midRef, rate);
}

export function formatBptf(totalRef: number, keyRef: number): string {
  if (!Number.isFinite(totalRef)) return '—';
  const sign = totalRef < 0 ? '-' : '';
  const abs = roundRef(Math.abs(totalRef));
  const keyPrice = keyRef > 1 ? roundRef(keyRef) : 0;

  if (keyPrice > 0 && abs + 1e-9 >= keyPrice) {
    const keys = Math.floor((abs + 1e-9) / keyPrice);
    const metal = roundRef(abs - keys * keyPrice);
    const keyPart = keys === 1 ? '1 key' : `${keys} keys`;
    if (metal < 0.049) return `${sign}${keyPart}`;
    return `${sign}${keyPart} ${formatRefAmount(metal)} ref`;
  }

  return `${sign}${formatRefAmount(abs)} ref`;
}

export function formatDelta(deltaKeys: number, keyRef: number): string {
  const sign = deltaKeys > 0.004 ? '+' : '';
  const text = formatBptf(deltaKeys * keyRef, keyRef);
  if (sign && !text.startsWith('-') && text !== '—') return sign + text;
  return text;
}
