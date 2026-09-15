import { describe, expect, it } from 'vitest';
import { buildSkuIndex, keyRefFromSkuIndex, pickSkuForName, upsertPrices } from './parse-pricedb';
import { quoteItem } from './lookup';
import { formatKeysRef } from './format';
import { parseSteamDescription } from '../tf2/parse-steam-item';
import uniqueHat from '../../fixtures/items/unique-team-captain.json';
import unusualHat from '../../fixtures/items/unusual-burning-flames-team-captain.json';
import paintedHat from '../../fixtures/items/painted-bills-hat.json';
import spelledUnusual from '../../fixtures/items/spelled-unusual.json';
import achievementHat from '../../fixtures/items/untradeable-achievement-hat.json';
import scrapMetal from '../../fixtures/items/scrap-metal.json';
import reclaimedMetal from '../../fixtures/items/reclaimed-metal.json';
import refinedMetal from '../../fixtures/items/refined-metal.json';
import scattergun from '../../fixtures/items/unique-scattergun.json';
import crate82 from '../../fixtures/items/mann-co-crate-82.json';
import tourTicket from '../../fixtures/items/tour-of-duty-ticket.json';
import robotPart from '../../fixtures/items/reinforced-robot-bomb-stabilizer.json';
import fabricator from '../../fixtures/items/pro-ks-scattergun-kit-fabricator.json';
import type { SteamItemDescription } from '../tf2/types';

const payload = {
  success: true,
  items: [
    {
      sku: '5021;6',
      name: 'Mann Co. Supply Crate Key',
      buy: { keys: 0, metal: 50 },
      sell: { keys: 0, metal: 50 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '378;6',
      name: 'Team Captain',
      buy: { keys: 1, metal: 20 },
      sell: { keys: 2, metal: 0 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '378;5;u13',
      buy: { keys: 40, metal: 0 },
      sell: { keys: 50, metal: 0 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '125;6',
      name: "Bill's Hat",
      buy: { keys: 10, metal: 0 },
      sell: { keys: 10, metal: 0 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '5022;6;c82',
      name: 'Mann Co. Supply Crate #82',
      buy: { keys: 0, metal: 1.33 },
      sell: { keys: 0, metal: 1.55 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '725;6',
      name: 'Tour of Duty Ticket',
      buy: { keys: 0, metal: 29 },
      sell: { keys: 0, metal: 29.11 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '200;6',
      name: 'Scattergun',
      buy: { keys: 0, metal: 0.66 },
      sell: { keys: 0, metal: 51.22 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '5704;6',
      name: 'Reinforced Robot Bomb Stabilizer',
      buy: { keys: 0, metal: 0.11 },
      sell: { keys: 0, metal: 0.22 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '20003;6',
      name: 'Professional Killstreak Scattergun Kit Fabricator',
      buy: { keys: 0, metal: 1 },
      sell: { keys: 0, metal: 1 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '20003;6;kt-3;td-200;od-6526;oq-6',
      name: 'Professional Killstreak Scattergun Kit Fabricator',
      buy: { keys: 0, metal: 8 },
      sell: { keys: 0, metal: 12 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '5000;6',
      name: 'Scrap Metal',
      buy: { keys: 0, metal: 0.11 },
      sell: { keys: 0, metal: 0.22 },
      time: Math.floor(Date.now() / 1000),
    },
    {
      sku: '5002;6',
      name: 'Refined Metal',
      buy: { keys: 0, metal: 0 },
      sell: { keys: 0, metal: 0.11 },
      time: Math.floor(Date.now() / 1000),
    },
  ],
};

describe('PriceDB quotes', () => {
  const index = buildSkuIndex(payload);
  const keyRef = keyRefFromSkuIndex(index)!;

  it('reads the key rate from Mann Co. key metal', () => {
    expect(keyRef).toBe(50);
  });

  it('quotes a unique hat in keys', () => {
    const item = parseSteamDescription(uniqueHat as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midRef).toBe(70);
    expect(quote.confidence).toBe('high');
    expect(formatKeysRef(quote.midKeys, quote.midRef, keyRef)).toBe('1 key 20 ref');
  });

  it('quotes unusuals by effect SKU, not the craft hat', () => {
    const item = parseSteamDescription(unusualHat as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midKeys).toBe(40);
    expect(quote.flags).toContain('unusual');
    expect(formatKeysRef(quote.midKeys, quote.midRef, keyRef)).toBe('40 keys');
  });

  it('falls back to unpainted SKU and flags paint', () => {
    const item = parseSteamDescription(paintedHat as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midKeys).toBe(10);
    expect(quote.flags).toContain('paint');
    expect(quote.confidence).toBe('medium');
  });

  it('does not invent a spelled unusual premium', () => {
    const item = parseSteamDescription(spelledUnusual as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midKeys).toBe(40);
    expect(quote.flags).toContain('spelled');
    expect(quote.confidence).toBe('medium');
  });

  it('skips achievement items that are not tradable', () => {
    const item = parseSteamDescription(achievementHat as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.flags).toContain('skipped');
    expect(quote.midKeys).toBeNull();
  });

  it('uses craft face value for metal, not bot buy/sell', () => {
    const scrap = quoteItem(parseSteamDescription(scrapMetal as SteamItemDescription), index, keyRef);
    const rec = quoteItem(parseSteamDescription(reclaimedMetal as SteamItemDescription), index, keyRef);
    const refined = quoteItem(parseSteamDescription(refinedMetal as SteamItemDescription), index, keyRef);
    expect(formatKeysRef(scrap.midKeys, scrap.midRef, keyRef)).toBe('0.11 ref');
    expect(formatKeysRef(rec.midKeys, rec.midRef, keyRef)).toBe('0.33 ref');
    expect(formatKeysRef(refined.midKeys, refined.midRef, keyRef)).toBe('1 ref');
    expect(scrap.source).toBe('craft');
  });

  it('prices ordinary weapons as 0.05 ref even if PriceDB spread is garbage', () => {
    const item = parseSteamDescription(scattergun as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(formatKeysRef(quote.midKeys, quote.midRef, keyRef)).toBe('0.05 ref');
  });

  it('counts crate series SKUs in refined', () => {
    const item = parseSteamDescription(crate82 as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(item.sku).toBe('5022;6;c82');
    expect(formatKeysRef(quote.midKeys, quote.midRef, keyRef)).toBe('1.33 ref');
  });

  it('quotes MvM tour tickets from their SKU, not as 0.05 weapons', () => {
    const item = parseSteamDescription(tourTicket as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(formatKeysRef(quote.midKeys, quote.midRef, keyRef)).toBe('29 ref');
  });

  it('quotes MvM robot parts at buy, not the buy/sell midpoint', () => {
    const item = parseSteamDescription(robotPart as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(item.sku).toBe('5704;6');
    expect(formatKeysRef(quote.midKeys, quote.midRef, keyRef)).toBe('0.11 ref');
  });

  it('quotes professional killstreak kit fabricators from the recipe SKU', () => {
    const item = parseSteamDescription(fabricator as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(item.sku).toBe('20003;6;kt-3;td-200;od-6526;oq-6');
    expect(item.sku).not.toContain('sheen');
    expect(formatKeysRef(quote.midKeys, quote.midRef, keyRef)).toBe('8 ref');
  });

  it('does not quote a generic fabricator when the recipe SKU is missing', () => {
    const genericOnly = buildSkuIndex({
      items: [
        {
          sku: '20003;6',
          name: 'Professional Killstreak Scattergun Kit Fabricator',
          buy: { keys: 0, metal: 1 },
          sell: { keys: 0, metal: 1 },
          time: Math.floor(Date.now() / 1000),
        },
      ],
    });
    const item = parseSteamDescription(fabricator as SteamItemDescription);
    const quote = quoteItem(item, genericOnly, keyRef);
    expect(quote.midKeys).toBeNull();
    expect(quote.midRef).toBeNull();
  });

  it('does not pick an unusual SKU for a unique hat name', () => {
    const sku = pickSkuForName(['378;5;u13', '378;5;u59', '378;6'], {
      qualityId: 6,
      defindex: 378,
    });
    expect(sku).toBe('378;6');
  });

  it('prefers fabricator SKUs that keep td/od instead of the shortest row', () => {
    const sku = pickSkuForName(
      ['20003;6', '20003;6;kt-3;td-200;od-6526;oq-6', '20003;6;kt-3;td-205;od-6526;oq-6'],
      {
        qualityId: 6,
        defindex: 20003,
        killstreak: 3,
        targetDefindex: 200,
        outputDefindex: 6526,
      },
    );
    expect(sku).toBe('20003;6;kt-3;td-200;od-6526;oq-6');
  });

  it('returns null when a recipe item has no td/od row in the name pool', () => {
    expect(
      pickSkuForName(['20003;6'], {
        targetDefindex: 200,
        outputDefindex: 6526,
        defindex: 20003,
        qualityId: 6,
        killstreak: 3,
      }),
    ).toBeNull();
  });

  it('reads PriceDB search payloads nested under data.results', () => {
    const found = upsertPrices({
      success: true,
      data: { results: [{ sku: '725;6', name: 'Tour of Duty Ticket', buy: { keys: 0, metal: 1 }, sell: { keys: 0, metal: 1 } }] },
    });
    expect(found['725;6']?.buy.metal).toBe(1);
  });
});
