import { describe, expect, it } from 'vitest';
import { parseSteamDescription } from './parse-steam-item';
import uniqueHat from '../../fixtures/items/unique-team-captain.json';
import unusualHat from '../../fixtures/items/unusual-burning-flames-team-captain.json';
import unknownEffect from '../../fixtures/items/unusual-unknown-effect.json';
import paintedHat from '../../fixtures/items/painted-bills-hat.json';
import spelledUnusual from '../../fixtures/items/spelled-unusual.json';
import strangeParts from '../../fixtures/items/strange-scattergun-parts.json';
import australium from '../../fixtures/items/australium-minigun.json';
import proKs from '../../fixtures/items/pro-ks-flamethrower.json';
import uncraftable from '../../fixtures/items/uncraftable-key.json';
import wikiHat from '../../fixtures/items/wiki-team-captain.json';
import achievementHat from '../../fixtures/items/untradeable-achievement-hat.json';
import scrapMetal from '../../fixtures/items/scrap-metal.json';
import reclaimedMetal from '../../fixtures/items/reclaimed-metal.json';
import refinedMetal from '../../fixtures/items/refined-metal.json';
import scattergun from '../../fixtures/items/unique-scattergun.json';
import crate82 from '../../fixtures/items/mann-co-crate-82.json';
import tourTicket from '../../fixtures/items/tour-of-duty-ticket.json';
import fabricator from '../../fixtures/items/pro-ks-scattergun-kit-fabricator.json';
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

  it('parses unusual effect from HTML description and particle tags', () => {
    const fromHtml = parseSteamDescription({
      name: 'Team Captain',
      market_hash_name: 'Unusual Team Captain',
      tradable: 1,
      app_data: { def_index: '378', quality: '5' },
      tags: [{ category: 'Quality', internal_name: 'rarity4', localized_tag_name: 'Unusual' }],
      descriptions: [{ value: '<font color="#ffd700">★ Unusual Effect: Burning Flames</font>' }],
    } as SteamItemDescription);
    expect(fromHtml.effect).toEqual({ id: 13, name: 'Burning Flames' });
    expect(fromHtml.sku).toBe('378;5;u13');

    const fromTag = parseSteamDescription({
      name: 'Team Captain',
      market_hash_name: 'Unusual Team Captain',
      tradable: 1,
      app_data: { def_index: '378', quality: '5' },
      tags: [
        { category: 'Quality', internal_name: 'rarity4', localized_tag_name: 'Unusual' },
        { category: 'Particle', internal_name: 'particle_13', localized_tag_name: 'Burning Flames' },
      ],
    } as SteamItemDescription);
    expect(fromTag.effect).toEqual({ id: 13, name: 'Burning Flames' });
    expect(fromTag.sku).toBe('378;5;u13');
  });

  it('does not put Community Sparkle on a unique-hat SKU', () => {
    const item = parseSteamDescription({
      name: 'Team Captain',
      market_hash_name: 'Team Captain',
      tradable: 1,
      app_data: { def_index: '378', quality: '6' },
      tags: [{ category: 'Quality', internal_name: 'Unique', localized_tag_name: 'Unique' }],
      descriptions: [{ value: '★ Unusual Effect: Community Sparkle' }],
    } as SteamItemDescription);
    expect(item.effect).toEqual({ id: 4, name: 'Community Sparkle' });
    expect(item.sku).toBe('378;6');
    expect(item.sku).not.toContain(';u');
  });

  it('leaves Showstopper without an id unless Steam sent a particle number', () => {
    const byName = parseSteamDescription({
      name: 'Team Captain',
      market_hash_name: 'Unusual Team Captain',
      tradable: 1,
      app_data: { def_index: '378', quality: '5' },
      tags: [{ category: 'Quality', internal_name: 'rarity4', localized_tag_name: 'Unusual' }],
      descriptions: [{ value: '★ Unusual Effect: Showstopper' }],
    } as SteamItemDescription);
    expect(byName.effect).toEqual({ id: null, name: 'Showstopper' });
    expect(byName.sku).toBe('378;5');
    expect(byName.sku).not.toContain(';u');

    const fromTag = parseSteamDescription({
      name: 'Team Captain',
      market_hash_name: 'Unusual Team Captain',
      tradable: 1,
      app_data: { def_index: '378', quality: '5' },
      tags: [
        { category: 'Quality', internal_name: 'rarity4', localized_tag_name: 'Unusual' },
        { category: 'Particle', internal_name: 'particle_3001', localized_tag_name: 'Showstopper' },
      ],
    } as SteamItemDescription);
    expect(fromTag.effect).toEqual({ id: 3001, name: 'Showstopper' });
    expect(fromTag.sku).toBe('378;5;u3001');
  });

  it('keeps an unknown unusual effect without inventing an id', () => {
    const item = parseSteamDescription(unknownEffect as SteamItemDescription);
    expect(item.quality).toBe('Unusual');
    expect(item.effect).toEqual({ id: null, name: 'Completely Fake Effect' });
    expect(item.sku).toBe('378;5');
    expect(item.sku).not.toContain(';u');
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
    expect(item.sku).toBe('202;11;australium');
  });

  it('detects professional killstreak sheen and killstreaker', () => {
    const item = parseSteamDescription(proKs as SteamItemDescription);
    expect(item.killstreak).toBe(3);
    expect(item.sheen).toBe('Manndarin');
    expect(item.killstreaker).toBe('Fire Horns');
    expect(item.sku).toBe('208;6;kt-3');
    expect(item.targetDefindex).toBeNull();
  });

  it('parses a professional killstreak kit fabricator as a recipe SKU', () => {
    const item = parseSteamDescription(fabricator as SteamItemDescription);
    expect(item.defindex).toBe(20003);
    expect(item.killstreak).toBe(3);
    expect(item.targetName).toBe('Scattergun');
    expect(item.targetDefindex).toBe(200);
    expect(item.outputDefindex).toBe(6526);
    expect(item.outputQuality).toBe(6);
    expect(item.sheen).toBe('Team Shine');
    expect(item.killstreaker).toBe('Fire Horns');
    expect(item.sku).toBe('20003;6;kt-3;td-200;od-6526;oq-6');
  });

  it('marks uncraftable keys', () => {
    const item = parseSteamDescription(uncraftable as SteamItemDescription);
    expect(item.craftable).toBe(false);
    expect(item.sku).toBe('5021;6;uncraftable');
    expect(item.flags).toContain('uncraftable');
  });

  it('reads defindex from the TF wiki action when app_data is missing', () => {
    const item = parseSteamDescription(wikiHat as SteamItemDescription);
    expect(item.defindex).toBe(378);
    expect(item.sku).toBe('378;6');
  });

  it('does not value achievement items that cannot be traded', () => {
    const item = parseSteamDescription(achievementHat as SteamItemDescription);
    expect(item.countsTowardValue).toBe(false);
    expect(item.flags).toContain('untradeable');
  });

  it('maps stock scattergun defindex to the economy SKU', () => {
    const item = parseSteamDescription(scattergun as SteamItemDescription);
    expect(item.defindex).toBe(200);
    expect(item.slot).toBe('primary');
    expect(item.sku).toBe('200;6');
  });

  it('reads crate series into the SKU', () => {
    const item = parseSteamDescription(crate82 as SteamItemDescription);
    expect(item.crateSeries).toBe(82);
    expect(item.sku).toBe('5022;6;c82');
  });

  it('keeps metal and MvM ticket defindexes', () => {
    expect(parseSteamDescription(scrapMetal as SteamItemDescription).defindex).toBe(5000);
    expect(parseSteamDescription(reclaimedMetal as SteamItemDescription).defindex).toBe(5001);
    expect(parseSteamDescription(refinedMetal as SteamItemDescription).defindex).toBe(5002);
    expect(parseSteamDescription(tourTicket as SteamItemDescription).sku).toBe('725;6');
  });
});
