import { getPriceCache, getSettings, savePriceCache } from '@/lib/settings';
import {
  buildPriceIndex,
  keyRefFromCurrencies,
  keyRefFromIndex,
} from '@/lib/prices/parse-bptf';
import { quoteItem } from '@/lib/prices/lookup';
import type { PriceCache } from '@/lib/settings';
import type { PriceStatus, QuoteResponse, Tf2ivRequest } from '@/lib/messages';
import type { Quote } from '@/lib/prices/types';
import type { ItemPassport } from '@/lib/tf2/types';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let fetching = false;
let lastError: string | null = null;
let memoryCache: PriceCache | null = null;

function statusFrom(cache: PriceCache | null, hasApiKey: boolean): PriceStatus {
  return {
    hasApiKey,
    ready: Boolean(cache),
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

async function refreshPrices(force: boolean): Promise<PriceCache> {
  const settings = await getSettings();
  if (!settings.bptfApiKey) {
    throw new Error('Сначала укажите backpack.tf API key в настройках расширения');
  }

  const existing = await loadCache();
  if (!force && existing && Date.now() - existing.fetchedAt < CACHE_TTL_MS) {
    return existing;
  }

  fetching = true;
  lastError = null;
  try {
    const params = new URLSearchParams({ key: settings.bptfApiKey });
    const [pricesRes, currenciesRes] = await Promise.all([
      fetch(`https://backpack.tf/api/IGetPrices/v4?${params}`),
      fetch(`https://backpack.tf/api/IGetCurrencies/v1?${params}`),
    ]);
    if (!pricesRes.ok) {
      throw new Error(`backpack.tf prices HTTP ${pricesRes.status}`);
    }

    const pricesJson = await pricesRes.json() as { response?: { success?: number; message?: string } };
    if (pricesJson.response && pricesJson.response.success !== 1 && pricesJson.response.success !== undefined) {
      throw new Error(pricesJson.response.message ?? 'backpack.tf вернул ошибку прайслиста');
    }
    const index = buildPriceIndex(pricesJson);
    let keyRef = keyRefFromIndex(index);
    if (currenciesRes.ok) {
      keyRef = keyRefFromCurrencies(await currenciesRes.json()) ?? keyRef;
    }
    if (!keyRef) throw new Error('Не удалось получить курс ключа');

    const cache: PriceCache = {
      fetchedAt: Date.now(),
      keyRef,
      index,
    };
    memoryCache = cache;
    await savePriceCache(cache);
    return cache;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    fetching = false;
  }
}

function quoteItems(items: ItemPassport[], cache: PriceCache): QuoteResponse {
  const quotes: Record<string, Quote> = {};
  for (const item of items) {
    const id = item.assetid ?? `${item.classid}_${item.instanceid}`;
    quotes[id] = quoteItem(item, cache.index, cache.keyRef);
  }
  return {
    ok: true,
    status: statusFrom(cache, true),
    quotes,
  };
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: Tf2ivRequest) => {
    return (async () => {
      const settings = await getSettings();
      if (message.type === 'GET_PRICE_STATUS') {
        return { ok: true, status: statusFrom(await loadCache(), Boolean(settings.bptfApiKey)) };
      }

      try {
        const cache = await refreshPrices(message.type === 'REFRESH_PRICES');
        if (message.type === 'REFRESH_PRICES') {
          return { ok: true, status: statusFrom(cache, true) };
        }
        return quoteItems(message.items, cache);
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        return {
          ok: false,
          status: statusFrom(await loadCache(), Boolean(settings.bptfApiKey)),
          error: text,
        };
      }
    })();
  });
});
