import { getPriceCache, PRICE_CACHE_VERSION, savePriceCache } from '@/lib/settings';
import {
  KEY_SKU,
  keyRefFromSkuIndex,
  upsertPrices,
  type SkuPriceIndex,
} from '@/lib/prices/parse-pricedb';
import { quoteItem } from '@/lib/prices/lookup';
import { toSku } from '@/lib/tf2/sku';
import { mapPool } from '@/lib/net/http';
import type { PriceCache } from '@/lib/settings';
import type { GetPricesResponse, PriceStatus, QuoteResponse, Tf2ivRequest } from '@/lib/messages';
import type { Quote } from '@/lib/prices/types';
import type { ItemPassport } from '@/lib/tf2/types';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const KEY_URL = `https://pricedb.io/api/autob/items/${KEY_SKU}`;
const BULK_URL = 'https://pricedb.io/api/items-bulk';
const SEARCH_URL = 'https://pricedb.io/api/search';

let fetching = false;
let lastError: string | null = null;
let memoryCache: PriceCache | null = null;

function emptyCache(keyRef = 0): PriceCache {
  return {
    version: PRICE_CACHE_VERSION,
    fetchedAt: 0,
    keyRef,
    index: {},
  };
}

function statusFrom(cache: PriceCache | null): PriceStatus {
  return {
    ready: Boolean(cache && cache.keyRef > 0),
    fetching,
    error: lastError,
    fetchedAt: cache?.fetchedAt ?? null,
    keyRef: cache?.keyRef ?? null,
    itemCount: cache ? Object.keys(cache.index).length : 0,
  };
}

async function loadCache(): Promise<PriceCache | null> {
  if (memoryCache) return memoryCache;
  memoryCache = await getPriceCache();
  return memoryCache;
}

async function persist(cache: PriceCache): Promise<void> {
  memoryCache = cache;
  try {
    await savePriceCache(cache);
  } catch {
    // Quota: keep prices in memory for this session.
  }
}

async function fetchKeyRate(): Promise<number> {
  const response = await fetch(KEY_URL);
  if (!response.ok) throw new Error(`pricedb.io key HTTP ${response.status}`);
  const index = upsertPrices(await response.json());
  const keyRef = keyRefFromSkuIndex(index);
  if (!keyRef) throw new Error('Не удалось получить курс ключа');
  return keyRef;
}

async function fetchBulk(skus: string[]): Promise<SkuPriceIndex> {
  const index: SkuPriceIndex = {};
  for (let i = 0; i < skus.length; i += 100) {
    const chunk = skus.slice(i, i + 100);
    const response = await fetch(BULK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ skus: chunk }),
    });
    if (!response.ok) throw new Error(`pricedb.io bulk HTTP ${response.status}`);
    upsertPrices(await response.json(), index);
  }
  return index;
}

async function searchName(query: string): Promise<SkuPriceIndex> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '50');
  const response = await fetch(url);
  if (!response.ok) return {};
  return upsertPrices(await response.json());
}

async function ensureKey(cache: PriceCache, force: boolean): Promise<PriceCache> {
  if (!force && cache.keyRef > 1 && Date.now() - cache.fetchedAt < CACHE_TTL_MS && cache.index[KEY_SKU]) {
    return cache;
  }
  const keyRef = await fetchKeyRate();
  const keyPrices = await fetchBulk([KEY_SKU]);
  const next: PriceCache = {
    version: PRICE_CACHE_VERSION,
    fetchedAt: Date.now(),
    keyRef,
    index: { ...cache.index, ...keyPrices },
  };
  await persist(next);
  return next;
}

async function fillPrices(cache: PriceCache, skus: string[]): Promise<PriceCache> {
  const missing = [...new Set(skus)].filter((sku) => sku && !cache.index[sku]);
  if (missing.length === 0) return cache;
  const fetched = await fetchBulk(missing);
  const next: PriceCache = {
    ...cache,
    fetchedAt: Date.now(),
    index: { ...cache.index, ...fetched },
  };
  await persist(next);
  return next;
}

function slicePrices(cache: PriceCache, skus: string[], extra: SkuPriceIndex = {}): SkuPriceIndex {
  const prices: SkuPriceIndex = { ...extra };
  if (cache.index[KEY_SKU]) prices[KEY_SKU] = cache.index[KEY_SKU];
  for (const sku of skus) {
    if (cache.index[sku]) prices[sku] = cache.index[sku];
  }
  return prices;
}

function quoteItems(items: ItemPassport[], cache: PriceCache): QuoteResponse {
  const quotes: Record<string, Quote> = {};
  for (const item of items) {
    const id = item.assetid ?? `${item.classid}_${item.instanceid}`;
    quotes[id] = quoteItem(item, cache.index, cache.keyRef);
  }
  return {
    ok: true,
    status: statusFrom(cache),
    quotes,
  };
}

async function handleGetPrices(skus: string[], searchQueries: string[]): Promise<GetPricesResponse> {
  let cache = (await loadCache()) ?? emptyCache();
  cache = await ensureKey(cache, false);
  cache = await fillPrices(cache, skus);
  let extra: SkuPriceIndex = {};
  if (searchQueries.length > 0) {
    const found = await mapPool([...new Set(searchQueries)].slice(0, 24), 6, searchName);
    extra = {};
    for (const row of found) Object.assign(extra, row);
    cache = {
      ...cache,
      fetchedAt: Date.now(),
      index: { ...cache.index, ...extra },
    };
    await persist(cache);
  }
  return {
    ok: true,
    status: statusFrom(cache),
    prices: slicePrices(cache, skus, extra),
  };
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: Tf2ivRequest) => {
    return (async () => {
      if (message.type === 'GET_PRICE_STATUS') {
        return { ok: true, status: statusFrom(await loadCache()) };
      }

      fetching = true;
      lastError = null;
      try {
        if (message.type === 'REFRESH_PRICES') {
          let cache = (await loadCache()) ?? emptyCache();
          cache = await ensureKey(cache, true);
          return { ok: true, status: statusFrom(cache) };
        }

        if (message.type === 'GET_PRICES') {
          return await handleGetPrices(message.skus, message.searchQueries ?? []);
        }

        if (message.type !== 'QUOTE_ITEMS') {
          return { ok: false, status: statusFrom(await loadCache()), error: 'Unknown message' };
        }

        let cache = (await loadCache()) ?? emptyCache();
        cache = await ensureKey(cache, false);
        const wantedSkus = [...new Set(message.items
          .filter((item) => item.countsTowardValue)
          .map((item) => toSku(item))
          .filter((sku): sku is string => Boolean(sku)))];
        cache = await fillPrices(cache, wantedSkus);
        return quoteItems(message.items, cache);
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        lastError = text;
        return {
          ok: false,
          status: statusFrom(await loadCache()),
          error: text,
        };
      } finally {
        fetching = false;
      }
    })();
  });
});
