import { describe, expect, it } from 'vitest';
import { parseSteamDescription } from '../tf2/parse-steam-item';
import uniqueHat from '../../fixtures/items/unique-team-captain.json';
import unusualHat from '../../fixtures/items/unusual-burning-flames-team-captain.json';
import paintedHat from '../../fixtures/items/painted-bills-hat.json';
import spelledUnusual from '../../fixtures/items/spelled-unusual.json';
import strangeParts from '../../fixtures/items/strange-scattergun-parts.json';
import proKs from '../../fixtures/items/pro-ks-flamethrower.json';
import { sortAssetIds, assetIdFromElementId, type SortableItem } from './inventory-sort';
import type { SteamItemDescription } from '../tf2/types';
import type { Quote } from '../prices/types';

function row(assetid: string, fixture: object, midRef: number | null): SortableItem {
  return {
    assetid,
    item: parseSteamDescription(fixture as SteamItemDescription),
    quote: {
      midKeys: midRef,
      lowKeys: midRef,
      highKeys: midRef,
      midRef,
      confidence: midRef == null ? 'none' : 'high',
      flags: [],
      source: midRef == null ? 'none' : 'pricedb',
    } as Quote,
  };
}

describe('inventory sort', () => {
  const unique = row('1', uniqueHat, 70);
  const unusual = row('2', unusualHat, 2000);
  const painted = row('3', paintedHat, 10);
  const spelled = row('4', spelledUnusual, 2000);
  const parts = row('5', strangeParts, 1);
  const ks = row('6', proKs, 20);

  it('keeps Steam backpack order', () => {
    expect(sortAssetIds([painted, unique, unusual], 'steam', ['1', '2', '3'])).toEqual(['1', '2', '3']);
  });

  it('sorts by price high to low', () => {
    expect(sortAssetIds([painted, unique, unusual], 'price-desc')).toEqual(['2', '1', '3']);
  });

  it('puts unusuals first', () => {
    expect(sortAssetIds([unique, painted, unusual], 'unusual')[0]).toBe('2');
  });

  it('puts spelled items first', () => {
    expect(sortAssetIds([unique, spelled, painted], 'spells')[0]).toBe('4');
  });

  it('puts painted items first', () => {
    expect(sortAssetIds([unique, painted, unusual], 'paint')[0]).toBe('3');
  });

  it('puts strange parts first', () => {
    expect(sortAssetIds([unique, parts, painted], 'parts')[0]).toBe('5');
  });

  it('puts killstreaks first', () => {
    expect(sortAssetIds([unique, ks, painted], 'killstreak')[0]).toBe('6');
  });

  it('reads Steam item ids with and without the item prefix', () => {
    expect(assetIdFromElementId('440_2_123456')).toBe('123456');
    expect(assetIdFromElementId('item440_2_123456')).toBe('123456');
  });
});
