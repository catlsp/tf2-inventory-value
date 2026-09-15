import type { ItemPassport } from './tf2/types';
import type { Quote } from './prices/types';
import type { SkuPriceIndex } from './prices/parse-pricedb';

export type PriceStatus = {
  ready: boolean;
  fetching: boolean;
  error: string | null;
  fetchedAt: number | null;
  keyRef: number | null;
  itemCount: number;
};

export type QuoteRequest = {
  type: 'QUOTE_ITEMS';
  items: ItemPassport[];
  search?: boolean;
};

export type GetPricesRequest = {
  type: 'GET_PRICES';
  skus: string[];
  searchQueries?: string[];
};

export type StatusRequest = {
  type: 'GET_PRICE_STATUS';
};

export type RefreshRequest = {
  type: 'REFRESH_PRICES';
};

export type Tf2ivRequest = QuoteRequest | GetPricesRequest | StatusRequest | RefreshRequest;

export type QuoteResponse = {
  ok: true;
  status: PriceStatus;
  quotes: Record<string, Quote>;
} | {
  ok: false;
  status: PriceStatus;
  error: string;
};

export type GetPricesResponse = {
  ok: true;
  status: PriceStatus;
  prices: SkuPriceIndex;
} | {
  ok: false;
  status: PriceStatus;
  error: string;
};

export type StatusResponse = {
  ok: true;
  status: PriceStatus;
};
