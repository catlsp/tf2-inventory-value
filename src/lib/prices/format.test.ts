import { describe, expect, it } from 'vitest';
import { formatBptf, formatDelta, formatKeysRef, roundRef } from './format';

describe('backpack.tf currency format', () => {
  it('rounds to weapon / scrap / rec / ref steps', () => {
    expect(roundRef(0.05)).toBe(0.05);
    expect(roundRef(0.11)).toBe(0.11);
    expect(roundRef(0.17)).toBe(0.16);
    expect(roundRef(0.28)).toBe(0.27);
    expect(roundRef(0.33)).toBe(0.33);
    expect(roundRef(0.49)).toBe(0.49);
    expect(roundRef(1)).toBe(1);
    expect(roundRef(1.33)).toBe(1.33);
    expect(roundRef(1.49)).toBe(1.49);
  });

  it('prints metal below a key as ref', () => {
    expect(formatKeysRef(0.11 / 63, 0.11, 63)).toBe('0.11 ref');
    expect(formatKeysRef(0.33 / 63, 0.33, 63)).toBe('0.33 ref');
    expect(formatKeysRef(1 / 63, 1, 63)).toBe('1 ref');
    expect(formatKeysRef(1.33 / 63, 1.33, 63)).toBe('1.33 ref');
    expect(formatKeysRef(0.05 / 63, 0.05, 63)).toBe('0.05 ref');
  });

  it('prints keys plus leftover metal', () => {
    expect(formatBptf(50, 50)).toBe('1 key');
    expect(formatBptf(90, 50)).toBe('1 key 40 ref');
    expect(formatBptf(100, 50)).toBe('2 keys');
    expect(formatKeysRef(1.7, 85, 50)).toBe('1 key 35 ref');
  });

  it('formats trade deltas with a sign', () => {
    expect(formatDelta(0.02, 50)).toBe('+1 ref');
    expect(formatDelta(-0.11 / 50, 50)).toBe('-0.11 ref');
  });
});
