import type { ItemPassport } from '../tf2/types';
import type { GetPricesRequest, GetPricesResponse, PriceStatus, StatusResponse } from '../messages';
import { quoteItem } from './lookup';
import { isCurrencyDefindex, isMannCoKey, isPlainCraftWeapon } from '../tf2/economy';
import { toSku } from '../tf2/sku';
import type { SkuPriceIndex } from './parse-pricedb';
import type { Quote } from './types';

export const SKU_BATCH = 100;

export function chunkItems<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function send<T>(payload: object): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt > 0) {
        await browser.runtime.sendMessage({ type: 'GET_PRICE_STATUS' });
      }
      return await browser.runtime.sendMessage(payload) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function getPrices(skus: string[], searchQueries: string[] = []): Promise<GetPricesResponse> {
  return send<GetPricesResponse>({
    type: 'GET_PRICES',
    skus: [...new Set(skus.filter(Boolean))],
    searchQueries,
  } satisfies GetPricesRequest);
}

export async function getPriceStatus(): Promise<PriceStatus> {
  const ping = await send<StatusResponse>({ type: 'GET_PRICE_STATUS' });
  return ping.status;
}

export function quoteLocal(
  items: ItemPassport[],
  index: SkuPriceIndex,
  keyRef: number,
): Record<string, Quote> {
  const quotes: Record<string, Quote> = {};
  for (const item of items) {
    const id = item.assetid ?? `${item.classid}_${item.instanceid}`;
    quotes[id] = quoteItem(item, index, keyRef);
  }
  return quotes;
}

export async function fillAndQuote(
  items: ItemPassport[],
  localIndex: SkuPriceIndex,
  searchQueries: string[] = [],
  knownKeyRef = 0,
  onPartial?: (quotes: Record<string, Quote>, keyRef: number, status: PriceStatus) => void,
): Promise<{ quotes: Record<string, Quote>; keyRef: number; status: PriceStatus }> {
  const skus = [...new Set(
    items
      .filter((item) => (
        item.countsTowardValue
        && !isCurrencyDefindex(item.defindex)
        && !isMannCoKey(item)
        && !isPlainCraftWeapon(item)
      ))
      .map((item) => toSku(item))
      .filter((sku): sku is string => Boolean(sku)),
  )];
  const missing = skus.filter((sku) => !localIndex[sku]);
  let keyRef = knownKeyRef;
  let status: PriceStatus = {
    ready: keyRef > 1,
    fetching: false,
    error: null,
    fetchedAt: null,
    keyRef: keyRef > 1 ? keyRef : null,
    itemCount: Object.keys(localIndex).length,
  };

  const emit = (): Record<string, Quote> => {
    const quotes = quoteLocal(items, localIndex, keyRef);
    onPartial?.(quotes, keyRef, status);
    return quotes;
  };

  if (keyRef <= 1) {
    status = await getPriceStatus();
    keyRef = status.keyRef ?? keyRef;
  }
  if (keyRef > 1) emit();

  const skuChunks = chunkItems(missing, SKU_BATCH);
  if (skuChunks.length === 0 && searchQueries.length === 0 && keyRef <= 1) {
    skuChunks.push([]);
  }

  for (const chunk of skuChunks) {
    const response = await getPrices(chunk);
    if (!response.ok) throw new Error(response.error);
    Object.assign(localIndex, response.prices);
    keyRef = response.status.keyRef ?? keyRef;
    status = response.status;
    emit();
  }

  if (searchQueries.length > 0) {
    const response = await getPrices([], searchQueries);
    if (!response.ok) throw new Error(response.error);
    Object.assign(localIndex, response.prices);
    keyRef = response.status.keyRef ?? keyRef;
    status = response.status;
    emit();
  }

  return {
    quotes: quoteLocal(items, localIndex, keyRef),
    keyRef,
    status,
  };
}
