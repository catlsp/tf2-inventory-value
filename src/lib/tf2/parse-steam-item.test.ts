import { describe, expect, it } from 'vitest';
import { parseSteamDescription } from './parse-steam-item';
import uniqueHat from '../../fixtures/items/unique-team-captain.json';
import unusualHat from '../../fixtures/items/unusual-burning-flames-team-captain.json';
import paintedHat from '../../fixtures/items/painted-bills-hat.json';
import spelledUnusual from '../../fixtures/items/spelled-unusual.json';
import strangeParts from '../../fixtures/items/strange-scattergun-parts.json';
import australium from '../../fixtures/items/australium-minigun.json';
import proKs from '../../fixtures/items/pro-ks-flamethrower.json';
import uncraftable from '../../fixtures/items/uncraftable-key.json';
import type { SteamItemDescription } from './types';

describe('parseSteamDescription', () => {
  it('parses a unique craft hat', () => {
    const item = parseSteamDescription(uniqueHat as SteamItemDescription);
    expect(item.defindex).toBe(378);
    expect(item.quality).toBe('Unique');
    expect(item.craftable).toBe(true);
    expect(item.effect).toBeNull();
    expect(item.sku).toBe('378;6');
  });

  it('parses unusual effect id and SKU', () => {
    const item = parseSteamDescription(unusualHat as SteamItemDescription);
    expect(item.quality).toBe('Unusual');
    expect(item.effect).toEqual({ id: 13, name: 'Burning Flames' });
    expect(item.sku).toBe('378;5;u13');
    expect(item.flags).toContain('unusual');
  });

  it('parses paint on a unique hat', () => {
    const item = parseSteamDescription(paintedHat as SteamItemDescription);
    expect(item.paint).toEqual({ defindex: 5054, name: 'Pink as Hell' });
    expect(item.sku).toBe('125;6;p5054');
    expect(item.flags).toContain('paint');
  });

  it('keeps spells off the SKU but on the passport', () => {
    const item = parseSteamDescription(spelledUnusual as SteamItemDescription);
    expect(item.spells).toEqual([
      { id: 1004, name: 'Voices from Below' },
      { id: 1008, name: 'Headless Horseshoes' },
    ]);
    expect(item.sku).toBe('378;5;u13');
    expect(item.flags).toContain('spelled');
  });

  it('parses strange parts', () => {
    const item = parseSteamDescription(strangeParts as SteamItemDescription);
    expect(item.quality).toBe('Strange');
    expect(item.parts).toEqual([
      { name: 'Headshot Kills', kills: 12 },
      { name: 'Damage Dealt' },
    ]);
    expect(item.flags).toContain('parts');
  });

  it('detects australium strange weapons', () => {
    const item = parseSteamDescription(australium as SteamItemDescription);
    expect(item.australium).toBe(true);
    expect(item.quality).toBe('Strange');
    expect(item.sku).toBe('15;11;australium');
  });

  it('detects professional killstreak sheen and killstreaker', () => {
    const item = parseSteamDescription(proKs as SteamItemDescription);
    expect(item.killstreak).toBe(3);
    expect(item.sheen).toBe('Manndarin');
    expect(item.killstreaker).toBe('Fire Horns');
    expect(item.sku).toBe('208;6;kt-3');
  });

  it('marks uncraftable keys', () => {
    const item = parseSteamDescription(uncraftable as SteamItemDescription);
    expect(item.craftable).toBe(false);
    expect(item.sku).toBe('5021;6;uncraftable');
    expect(item.flags).toContain('uncraftable');
  });
});
