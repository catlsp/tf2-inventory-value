import type { ItemPassport } from './tf2/types';
import type { Quote } from './prices/types';

export type PriceStatus = {
  hasApiKey: boolean;
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
};

export type StatusRequest = {
  type: 'GET_PRICE_STATUS';
};

export type RefreshRequest = {
  type: 'REFRESH_PRICES';
};

export type Tf2ivRequest = QuoteRequest | StatusRequest | RefreshRequest;

export type QuoteResponse = {
  ok: true;
  status: PriceStatus;
  quotes: Record<string, Quote>;
} | {
  ok: false;
  status: PriceStatus;
  error: string;
};

export type StatusResponse = {
  ok: true;
  status: PriceStatus;
};
