export type Currencies = {
  keys: number;
  metal: number;
};

export type SkuPrice = {
  sku: string;
  name: string;
  buy: Currencies;
  sell: Currencies;
  lastUpdate: number;
};

export type SkuPriceIndex = Record<string, SkuPrice>;

export const KEY_SKU = '5021;6';

function asMoney(raw: unknown): Currencies {
  const value = raw as { keys?: unknown; metal?: unknown } | undefined;
  const keys = typeof value?.keys === 'number' && Number.isFinite(value.keys) ? value.keys : 0;
  const metal = typeof value?.metal === 'number' && Number.isFinite(value.metal) ? value.metal : 0;
  return { keys, metal };
}

export function metalOf(amount: Currencies, keyRef: number): number {
  return amount.keys * keyRef + amount.metal;
}

export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ');
}

function ingestRow(index: SkuPriceIndex, raw: unknown): void {
  if (!raw || typeof raw !== 'object') return;
  const row = raw as { sku?: unknown; name?: unknown; buy?: unknown; sell?: unknown; time?: unknown };
  if (typeof row.sku !== 'string' || !row.sku) return;
  index[row.sku] = {
    sku: row.sku,
    name: typeof row.name === 'string' ? row.name : '',
    buy: asMoney(row.buy),
    sell: asMoney(row.sell),
    lastUpdate: typeof row.time === 'number' ? row.time : 0,
  };
}

function rowsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as { items?: unknown; results?: unknown; data?: unknown; sku?: unknown };
  if (Array.isArray(root.items)) return root.items;
  if (Array.isArray(root.results)) return root.results;
  if (root.data && typeof root.data === 'object') {
    const data = root.data as { items?: unknown; results?: unknown };
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.items)) return data.items;
  }
  if (typeof root.sku === 'string') return [payload];
  return [];
}

export function upsertPrices(payload: unknown, index: SkuPriceIndex = {}): SkuPriceIndex {
  for (const row of rowsFromPayload(payload)) ingestRow(index, row);
  return index;
}

export function buildSkuIndex(payload: unknown): SkuPriceIndex {
  return upsertPrices(payload, {});
}

export function keyRefFromSkuIndex(index: SkuPriceIndex): number | null {
  const key = index[KEY_SKU];
  if (!key) return null;
  const mid = (metalOf(key.buy, 1) + metalOf(key.sell, 1)) / 2;
  return mid > 0 ? mid : null;
}

export function nameIndexFromPrices(index: SkuPriceIndex): Record<string, string[]> {
  const names: Record<string, string[]> = {};
  for (const price of Object.values(index)) {
    if (!price.name) continue;
    const key = normalizeItemName(price.name);
    const list = names[key] ?? [];
    list.push(price.sku);
    names[key] = list;
  }
  return names;
}

function skuDefindex(sku: string): number | null {
  const value = Number.parseInt(sku.split(';')[0] ?? '', 10);
  return Number.isFinite(value) ? value : null;
}

function skuQuality(sku: string): number | null {
  const value = Number.parseInt(sku.split(';')[1] ?? '', 10);
  return Number.isFinite(value) ? value : null;
}

function skuHasPart(sku: string, part: string): boolean {
  return sku.split(';').includes(part);
}

export function pickSkuForName(
  skus: string[],
  item: {
    defindex?: number | null;
    qualityId?: number | null;
    quality?: string;
    effect?: { id: number | null } | null;
    killstreak?: number;
    australium?: boolean;
    crateSeries?: number | null;
    targetDefindex?: number | null;
    outputDefindex?: number | null;
    targetName?: string | null;
  },
): string | null {
  let pool = [...skus];
  if (item.qualityId != null) {
    const matched = pool.filter((sku) => skuQuality(sku) === item.qualityId);
    if (matched.length === 0) return null;
    pool = matched;
  }

  if (item.effect?.id != null) {
    const withEffect = pool.filter((sku) => sku.includes(`;u${item.effect!.id}`));
    if (withEffect.length === 0) return null;
    pool = withEffect;
  } else {
    pool = pool.filter((sku) => !/;u\d/.test(sku));
  }

  if (item.quality !== 'Decorated') {
    pool = pool.filter((sku) => !/;pk/.test(sku) && !/;w\d/.test(sku));
  }

  if (item.crateSeries != null) {
    const withCrate = pool.filter(
      (sku) => sku.includes(`;c${item.crateSeries}`) || sku.includes(`;c-${item.crateSeries}`),
    );
    if (withCrate.length === 0) return null;
    pool = withCrate;
  } else {
    const withoutCrate = pool.filter((sku) => !/;c-?\d/.test(sku));
    if (withoutCrate.length > 0) pool = withoutCrate;
  }

  if (item.killstreak) {
    const withKt = pool.filter((sku) => sku.includes(`;kt-${item.killstreak}`));
    if (withKt.length > 0) pool = withKt;
  } else {
    const withoutKt = pool.filter((sku) => !sku.includes(';kt-'));
    if (withoutKt.length > 0) pool = withoutKt;
  }
  if (item.australium) {
    const au = pool.filter((sku) => sku.includes('australium'));
    if (au.length > 0) pool = au;
  } else {
    const withoutAu = pool.filter((sku) => !sku.includes('australium'));
    if (withoutAu.length > 0) pool = withoutAu;
  }

  if (item.defindex != null) {
    const same = pool.filter((sku) => skuDefindex(sku) === item.defindex);
    if (same.length > 0) pool = same;
  }

  if (item.targetDefindex != null) {
    const withTd = pool.filter((sku) => skuHasPart(sku, `td-${item.targetDefindex}`));
    if (withTd.length === 0) return null;
    pool = withTd;
  } else if (item.targetName) {
    const withTd = pool.filter((sku) => sku.split(';').some((part) => part.startsWith('td-')));
    if (withTd.length === 0) return null;
    pool = withTd;
  }

  if (item.outputDefindex != null) {
    const withOd = pool.filter((sku) => skuHasPart(sku, `od-${item.outputDefindex}`));
    if (withOd.length === 0) return null;
    pool = withOd;
  } else if (item.targetDefindex != null || item.targetName) {
    const withOd = pool.filter((sku) => sku.split(';').some((part) => part.startsWith('od-')));
    if (withOd.length > 0) pool = withOd;
  }

  pool.sort((a, b) => a.length - b.length);
  return pool[0] ?? null;
}
