import { storage } from 'wxt/utils/storage';
import type { SkuPrice } from './prices/parse-pricedb';

export const PRICE_CACHE_VERSION = 6;
const CACHE_KEY = 'tf2iv.priceCache';

export type PriceCache = {
  version: number;
  fetchedAt: number;
  keyRef: number;
  index: Record<string, SkuPrice>;
};

export function isUsablePriceCache(cache: PriceCache | null): cache is PriceCache {
  return Boolean(
    cache &&
      cache.version === PRICE_CACHE_VERSION &&
      cache.keyRef > 1 &&
      cache.index['5021;6']?.buy,
  );
}

export async function getPriceCache(): Promise<PriceCache | null> {
  const stored = await storage.getItem<PriceCache>(`local:${CACHE_KEY}`);
  return isUsablePriceCache(stored) ? stored : null;
}

export async function savePriceCache(cache: PriceCache): Promise<void> {
  await storage.setItem(`local:${CACHE_KEY}`, { ...cache, version: PRICE_CACHE_VERSION });
}
