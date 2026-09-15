import { emptyQuote, type Quote, type QuoteFlag } from './types';
import {
  metalOf,
  nameIndexFromPrices,
  normalizeItemName,
  pickSkuForName,
  type SkuPrice,
  type SkuPriceIndex,
} from './parse-pricedb';
import { skuCandidates } from '../tf2/sku-candidates';
import {
  CURRENCY_REF,
  WEAPON_REF,
  isCurrencyDefindex,
  isMannCoKey,
  isPlainCraftWeapon,
} from '../tf2/economy';
import { roundRef } from './format';
import type { ItemPassport } from '../tf2/types';

const STALE_AFTER_SEC = 60 * 60 * 24 * 30;

function flagsFor(item: ItemPassport, matched: SkuPrice): QuoteFlag[] {
  const flags: QuoteFlag[] = [];
  if (item.quality === 'Unusual' || item.effect) flags.push('unusual');
  if (item.paint && !matched.sku.includes(';p')) flags.push('paint');
  if (item.spells.length > 0) flags.push('spelled');
  if (item.parts.length > 0) flags.push('parts');
  const nowSec = Math.floor(Date.now() / 1000);
  if (matched.lastUpdate > 0 && nowSec - matched.lastUpdate > STALE_AFTER_SEC) {
    flags.push('stale');
  }
  return flags;
}

function isReliablePremiumWeapon(matched: SkuPrice, keyRef: number): boolean {
  const buyMetal = metalOf(matched.buy, keyRef);
  const sellMetal = metalOf(matched.sell, keyRef);
  if (buyMetal <= 0.33 || sellMetal <= 0.33) return false;
  if (sellMetal > buyMetal * 3) return false;
  return true;
}

function suggestedMetal(matched: SkuPrice, keyRef: number): number {
  const buyM = metalOf(matched.buy, keyRef);
  if (buyM > 0) return buyM;
  return 0;
}

function quoteMetal(
  item: ItemPassport,
  metal: number,
  keyRef: number,
  flags: QuoteFlag[],
  source: Quote['source'],
  confidence: Quote['confidence'] = 'high',
): Quote {
  const midMetal = roundRef(metal);
  return {
    midKeys: midMetal / keyRef,
    lowKeys: midMetal / keyRef,
    highKeys: midMetal / keyRef,
    midRef: midMetal,
    confidence,
    flags,
    source,
  };
}

function quoteFromPrice(item: ItemPassport, matched: SkuPrice, keyRef: number): Quote {
  const buyMetal = metalOf(matched.buy, keyRef);
  const sellMetal = metalOf(matched.sell, keyRef);
  const midMetal = suggestedMetal(matched, keyRef);
  if (midMetal <= 0) return emptyQuote(['unpriced']);
  const flags = flagsFor(item, matched);
  const extras = flags.some((flag) => flag === 'paint' || flag === 'spelled' || flag === 'parts');
  const rounded = roundRef(midMetal);
  return {
    midKeys: rounded / keyRef,
    lowKeys: buyMetal / keyRef,
    highKeys: sellMetal / keyRef,
    midRef: rounded,
    confidence: extras || flags.includes('stale') ? 'medium' : 'high',
    flags,
    source: 'pricedb',
  };
}

function isRecipeItem(item: ItemPassport): boolean {
  return item.targetDefindex != null || Boolean(item.targetName) || item.outputDefindex != null;
}

function skuFitsRecipe(item: ItemPassport, sku: string): boolean {
  const parts = sku.split(';');
  if (item.targetDefindex != null && !parts.includes(`td-${item.targetDefindex}`)) return false;
  if (item.outputDefindex != null && !parts.includes(`od-${item.outputDefindex}`)) return false;
  if (item.targetDefindex == null && item.targetName && !parts.some((part) => part.startsWith('td-'))) {
    return false;
  }
  return true;
}

function matchByExactName(item: ItemPassport, index: SkuPriceIndex): SkuPrice | undefined {
  const names = nameIndexFromPrices(index);
  for (const label of [item.marketHashName, item.name]) {
    const key = normalizeItemName(label);
    if (!key) continue;
    const skus = names[key];
    if (!skus?.length) continue;
    const sku = pickSkuForName(skus, item);
    const matched = sku ? index[sku] : undefined;
    if (matched && normalizeItemName(matched.name) === key && skuFitsRecipe(item, matched.sku)) {
      return matched;
    }
  }
  return undefined;
}

function matchPrice(item: ItemPassport, index: SkuPriceIndex): SkuPrice | undefined {
  if (isRecipeItem(item)) {
    const named = matchByExactName(item, index);
    if (named) return named;
  }

  for (const sku of skuCandidates(item)) {
    const matched = index[sku];
    if (matched && skuFitsRecipe(item, matched.sku)) return matched;
  }

  return matchByExactName(item, index);
}

export function quoteItem(item: ItemPassport, index: SkuPriceIndex, keyRef: number): Quote {
  if (!item.countsTowardValue) return emptyQuote(['skipped']);
  if (keyRef <= 0) return emptyQuote(['unpriced']);

  if (isCurrencyDefindex(item.defindex)) {
    return quoteMetal(item, CURRENCY_REF[item.defindex!], keyRef, [], 'craft');
  }
  if (isMannCoKey(item)) {
    return quoteMetal(item, keyRef, keyRef, [], 'craft');
  }

  if (isPlainCraftWeapon(item)) {
    const matched = matchPrice(item, index);
    if (matched && isReliablePremiumWeapon(matched, keyRef)) {
      return quoteFromPrice(item, matched, keyRef);
    }
    return quoteMetal(item, WEAPON_REF, keyRef, [], 'craft');
  }

  if ((item.quality === 'Unusual' || item.qualityId === 5) && item.effect?.id == null) {
    return emptyQuote(['unpriced', 'unusual', 'no_comps']);
  }

  const matched = matchPrice(item, index);
  if (matched) return quoteFromPrice(item, matched, keyRef);

  const flags: QuoteFlag[] = ['unpriced'];
  if (item.quality === 'Unusual' || item.effect) flags.push('unusual', 'no_comps');
  if (item.paint) flags.push('paint');
  if (item.spells.length > 0) flags.push('spelled');
  return emptyQuote(flags);
}

export function sumQuotes(quotes: Quote[]): {
  keys: number;
  ref: number;
  unpriced: number;
  priced: number;
  skipped: number;
} {
  let keys = 0;
  let ref = 0;
  let unpriced = 0;
  let priced = 0;
  let skipped = 0;
  for (const quote of quotes) {
    if (quote.flags.includes('skipped')) {
      skipped += 1;
      continue;
    }
    if (quote.midKeys == null || quote.midRef == null) {
      unpriced += 1;
      continue;
    }
    keys += quote.midKeys;
    ref += quote.midRef;
    priced += 1;
  }
  return { keys, ref, unpriced, priced, skipped };
}
