import { emptyQuote, type Quote, type QuoteFlag } from './types';
import { schemaLookupKey } from './schema-key';
import type { IndexedPrice, PriceIndex } from './parse-bptf';
import type { ItemPassport } from '../tf2/types';

const STALE_AFTER_SEC = 60 * 60 * 24 * 30;
const HAT_IN_REF = 1.33;

function midValue(price: IndexedPrice): number {
  if (price.valueHigh == null) return price.value;
  return (price.value + price.valueHigh) / 2;
}

function toKeysRef(
  amount: number,
  currency: IndexedPrice['currency'],
  keyRef: number,
): { keys: number; ref: number } | null {
  if (keyRef <= 0) return null;
  let metal: number;
  if (currency === 'metal') metal = amount;
  else if (currency === 'keys') metal = amount * keyRef;
  else if (currency === 'hat') metal = amount * HAT_IN_REF;
  else return null;
  return { keys: metal / keyRef, ref: metal };
}

export function quoteItem(item: ItemPassport, index: PriceIndex, keyRef: number): Quote {
  if (item.defindex == null || item.qualityId == null) {
    return emptyQuote(['unpriced']);
  }

  const unusual = item.quality === 'Unusual' || item.effect != null;
  const effectId = unusual ? (item.effect?.id ?? null) : 0;
  if (unusual && effectId == null) {
    return emptyQuote(['unusual', 'no_comps', 'unpriced']);
  }

  const priced = index[schemaLookupKey({
    defindex: item.defindex,
    qualityId: item.qualityId,
    craftable: item.craftable,
    effectId: effectId ?? 0,
    australium: item.australium,
  })];

  if (!priced) {
    const flags: QuoteFlag[] = ['unpriced'];
    if (unusual) flags.push('unusual', 'no_comps');
    return emptyQuote(flags);
  }

  const converted = toKeysRef(midValue(priced), priced.currency, keyRef);
  const low = toKeysRef(priced.value, priced.currency, keyRef);
  const high = toKeysRef(priced.valueHigh ?? priced.value, priced.currency, keyRef);
  if (!converted || !low || !high) return emptyQuote(['unpriced']);

  const flags: QuoteFlag[] = [];
  if (unusual) flags.push('unusual');
  if (item.paint) flags.push('paint');
  if (item.spells.length > 0) flags.push('spelled');
  if (item.parts.length > 0) flags.push('parts');
  const nowSec = Math.floor(Date.now() / 1000);
  if (priced.lastUpdate > 0 && nowSec - priced.lastUpdate > STALE_AFTER_SEC) {
    flags.push('stale');
  }

  const extras = flags.some((flag) => flag === 'paint' || flag === 'spelled' || flag === 'parts');
  const confidence = extras || flags.includes('stale') ? 'medium' : 'high';

  return {
    midKeys: converted.keys,
    lowKeys: low.keys,
    highKeys: high.keys,
    midRef: converted.ref,
    confidence,
    flags,
    source: 'schema',
  };
}

export function sumQuotes(quotes: Quote[]): { keys: number; unpriced: number; priced: number } {
  let keys = 0;
  let unpriced = 0;
  let priced = 0;
  for (const quote of quotes) {
    if (quote.midKeys == null) {
      unpriced += 1;
      continue;
    }
    keys += quote.midKeys;
    priced += 1;
  }
  return { keys, unpriced, priced };
}
