import { describe, expect, it } from 'vitest';
import { quoteItem } from '../../src/lib/prices/lookup';
import { parseSteamDescription } from '../../src/lib/tf2/parse-steam-item';
import type { SteamItemDescription } from '../../src/lib/tf2/types';
import achievementHat from '../../src/fixtures/items/untradeable-achievement-hat.json';
import { validateTf2Pipeline } from './validate-tf2';

describe('TF2 data validator', () => {
  it('runs the Steam → parser → SKU → quote chain on fixtures without inventing prices', async () => {
    const report = await validateTf2Pipeline();
    expect(report.fixtures).toBeGreaterThan(0);
    expect(report.ok, report.summary).toBe(true);
    expect(report.issues.some((entry) => /invent/i.test(entry.message) && entry.severity === 'error')).toBe(false);
  });

  it('keeps untradeable items skipped with null mids', () => {
    const item = parseSteamDescription(achievementHat as SteamItemDescription);
    const quote = quoteItem(item, {}, 50);
    expect(item.countsTowardValue).toBe(false);
    expect(quote.flags).toContain('skipped');
    expect(quote.midKeys).toBeNull();
    expect(quote.midRef).toBeNull();
  });
});
