import { describe, expect, it } from 'vitest';
import { buildPriceIndex, keyRefFromCurrencies, keyRefFromIndex } from './parse-bptf';
import { quoteItem } from './lookup';
import { formatKeysRef } from './format';
import { parseSteamDescription } from '../tf2/parse-steam-item';
import uniqueHat from '../../fixtures/items/unique-team-captain.json';
import unusualHat from '../../fixtures/items/unusual-burning-flames-team-captain.json';
import paintedHat from '../../fixtures/items/painted-bills-hat.json';
import spelledUnusual from '../../fixtures/items/spelled-unusual.json';
import type { SteamItemDescription } from '../tf2/types';

const now = Math.floor(Date.now() / 1000);

const schema = {
  response: {
    items: {
      'Mann Co. Supply Crate Key': {
        defindex: [5021],
        prices: {
          '6': {
            Tradable: {
              Craftable: [{ value: 50, currency: 'metal', last_update: now }],
            },
          },
        },
      },
      'Team Captain': {
        defindex: [378],
        prices: {
          '6': {
            Tradable: {
              Craftable: [{ value: 1.5, value_high: 1.7, currency: 'keys', last_update: now }],
            },
          },
          '5': {
            Tradable: {
              Craftable: {
                '13': { value: 40, value_high: 50, currency: 'keys', last_update: now },
              },
            },
          },
        },
      },
      "Bill's Hat": {
        defindex: [125],
        prices: {
          '6': {
            Tradable: {
              Craftable: [{ value: 10, currency: 'keys', last_update: now }],
            },
          },
        },
      },
    },
  },
};

describe('backpack.tf schema quotes', () => {
  const index = buildPriceIndex(schema);
  const keyRef = keyRefFromIndex(index)!;

  it('reads the key rate from refined metal', () => {
    expect(keyRef).toBe(50);
    expect(keyRefFromCurrencies({
      response: { currencies: { keys: { price: { value: 49.11, currency: 'metal' } } } },
    })).toBe(49.11);
  });

  it('quotes a unique hat in keys', () => {
    const item = parseSteamDescription(uniqueHat as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midKeys).toBeCloseTo(1.6);
    expect(quote.confidence).toBe('high');
    expect(formatKeysRef(quote.midKeys, quote.midRef)).toBe('1.6 keys');
  });

  it('quotes unusuals by effect id, not the craft hat', () => {
    const item = parseSteamDescription(unusualHat as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midKeys).toBe(45);
    expect(quote.flags).toContain('unusual');
    expect(formatKeysRef(quote.midKeys, quote.midRef)).toBe('45 keys');
  });

  it('keeps painted hats on the base price with a paint flag', () => {
    const item = parseSteamDescription(paintedHat as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midKeys).toBe(10);
    expect(quote.flags).toContain('paint');
    expect(quote.confidence).toBe('medium');
  });

  it('does not invent a spelled unusual premium', () => {
    const item = parseSteamDescription(spelledUnusual as SteamItemDescription);
    const quote = quoteItem(item, index, keyRef);
    expect(quote.midKeys).toBe(45);
    expect(quote.flags).toContain('spelled');
    expect(quote.confidence).toBe('medium');
  });
});
