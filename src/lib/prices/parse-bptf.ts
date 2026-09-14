import { isAustraliumSchemaName, schemaLookupKey } from './schema-key';

export type IndexedPrice = {
  value: number;
  valueHigh?: number;
  currency: 'keys' | 'metal' | 'usd' | 'hat';
  lastUpdate: number;
};

export type PriceIndex = Record<string, IndexedPrice>;

type RawPrice = {
  value?: number;
  value_high?: number;
  currency?: string;
  last_update?: number;
};

type CraftableMap = Record<string, RawPrice | RawPrice[] | undefined>;

const CURRENCIES = new Set(['keys', 'metal', 'usd', 'hat']);

function asCurrency(value: string | undefined): IndexedPrice['currency'] | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return CURRENCIES.has(normalized) ? (normalized as IndexedPrice['currency']) : null;
}

function toIndexed(raw: RawPrice): IndexedPrice | null {
  if (typeof raw.value !== 'number' || !Number.isFinite(raw.value)) return null;
  const currency = asCurrency(raw.currency);
  if (!currency) return null;
  const lastUpdate = typeof raw.last_update === 'number' ? raw.last_update : 0;
  const valueHigh =
    typeof raw.value_high === 'number' && Number.isFinite(raw.value_high)
      ? raw.value_high
      : undefined;
  return { value: raw.value, valueHigh, currency, lastUpdate };
}

function eachPrice(
  entry: RawPrice | RawPrice[] | CraftableMap | undefined,
  visit: (priceindex: string, price: IndexedPrice) => void,
): void {
  if (!entry) return;
  if (Array.isArray(entry)) {
    const price = entry[0] ? toIndexed(entry[0]) : null;
    if (price) visit('0', price);
    return;
  }
  if (typeof entry === 'object' && 'value' in entry) {
    const price = toIndexed(entry as RawPrice);
    if (price) visit('0', price);
    return;
  }
  for (const [priceindex, raw] of Object.entries(entry as CraftableMap)) {
    if (!raw) continue;
    const candidate = Array.isArray(raw) ? raw[0] : raw;
    const price = candidate ? toIndexed(candidate) : null;
    if (price) visit(priceindex, price);
  }
}

function defindexesOf(raw: unknown): number[] {
  if (typeof raw === 'number' && Number.isFinite(raw)) return [raw];
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? [parsed] : [];
  }
  if (Array.isArray(raw)) {
    return raw.flatMap((value) => defindexesOf(value));
  }
  return [];
}

export function buildPriceIndex(payload: unknown): PriceIndex {
  const index: PriceIndex = {};
  const root = payload as {
    response?: { items?: Record<string, unknown> };
    items?: Record<string, unknown>;
  };
  const items = root.response?.items ?? root.items;
  if (!items) return index;

  for (const [name, rawItem] of Object.entries(items)) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const item = rawItem as {
      defindex?: unknown;
      prices?: Record<string, { Tradable?: { Craftable?: unknown; 'Non-Craftable'?: unknown } }>;
    };
    const defindexes = defindexesOf(item.defindex);
    if (defindexes.length === 0 || !item.prices) continue;
    const australium = isAustraliumSchemaName(name);

    for (const [qualityId, qualityBlock] of Object.entries(item.prices)) {
      const quality = Number.parseInt(qualityId, 10);
      if (!Number.isFinite(quality) || !qualityBlock?.Tradable) continue;
      const tradable = qualityBlock.Tradable;
      const variants: Array<{ craftable: boolean; block: unknown }> = [
        { craftable: true, block: tradable.Craftable },
        { craftable: false, block: tradable['Non-Craftable'] },
      ];

      for (const variant of variants) {
        eachPrice(variant.block as CraftableMap | RawPrice[] | undefined, (priceindex, price) => {
          const effectId = Number.parseInt(priceindex, 10);
          if (!Number.isFinite(effectId)) return;
          for (const defindex of defindexes) {
            index[
              schemaLookupKey({
                defindex,
                qualityId: quality,
                craftable: variant.craftable,
                effectId,
                australium,
              })
            ] = price;
          }
        });
      }
    }
  }

  return index;
}

export function keyRefFromIndex(index: PriceIndex): number | null {
  const key = index[schemaLookupKey({
    defindex: 5021,
    qualityId: 6,
    craftable: true,
    effectId: 0,
    australium: false,
  })];
  if (!key || key.currency !== 'metal') return key?.currency === 'keys' ? 1 : null;
  return key.value;
}

export function keyRefFromCurrencies(payload: unknown): number | null {
  const currencies = (payload as { response?: { currencies?: Record<string, { price?: { value?: number; currency?: string } }> } })
    .response?.currencies;
  const keys = currencies?.keys?.price;
  if (typeof keys?.value === 'number' && keys.currency === 'metal') return keys.value;
  return null;
}
