import { TF2_APPID, TF2_CONTEXT_ID, type SteamInventoryResponse } from '../tf2/types';
import { mergeInventoryItems } from '../tf2/parse-steam-item';
import { fetchWithRetry } from '../net/http';
import type { ItemPassport } from '../tf2/types';

export function steamIdFromInventoryUrl(pathname: string, html: string): string | null {
  const profile = pathname.match(/\/profiles\/(\d{17})(?:\/|$)/);
  if (profile) return profile[1];

  const rg = html.match(/g_rgProfileData\s*=\s*\{[\s\S]{0,400}?"steamid"\s*:\s*"(\d{17})"/);
  if (rg) return rg[1];

  const generic = html.match(/"steamid"\s*:\s*"(\d{17})"/);
  return generic?.[1] ?? null;
}

export async function resolveInventorySteamId(): Promise<string | null> {
  const fromPage = steamIdFromInventoryUrl(location.pathname, document.documentElement.innerHTML);
  if (fromPage) return fromPage;

  const vanity = location.pathname.match(/\/id\/([^/]+)/);
  if (!vanity) return null;
  const cacheKey = `tf2iv.steamid.${vanity[1]}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached && /^\d{17}$/.test(cached)) return cached;
  } catch {
    // sessionStorage can be blocked
  }

  const response = await fetchWithRetry(`https://steamcommunity.com/id/${vanity[1]}/?xml=1`, {
    credentials: 'include',
  });
  if (!response.ok) return null;
  const xml = await response.text();
  const steamId = xml.match(/<steamID64>(\d{17})<\/steamID64>/)?.[1] ?? null;
  if (steamId) {
    try {
      sessionStorage.setItem(cacheKey, steamId);
    } catch {
      // ignore quota
    }
  }
  return steamId;
}

let steamQueue: Promise<unknown> = Promise.resolve();

async function fetchSteamInventoryPage(steamId: string, lastAssetId?: string): Promise<SteamInventoryResponse> {
  const url = new URL(`https://steamcommunity.com/inventory/${steamId}/${TF2_APPID}/${TF2_CONTEXT_ID}`);
  url.searchParams.set('l', 'english');
  url.searchParams.set('count', '2000');
  if (lastAssetId) url.searchParams.set('start_assetid', lastAssetId);

  const response = await fetchWithRetry(url.toString(), { credentials: 'include' });
  if (response.status === 429) {
    throw new Error('Steam временно ограничил запросы (429). Подождите пару секунд и откройте инвентарь снова.');
  }
  if (!response.ok) {
    throw new Error(`Steam inventory HTTP ${response.status}`);
  }
  const payload = (await response.json()) as SteamInventoryResponse;
  if (payload.success === 0) {
    throw new Error('Инвентарь скрыт или недоступен');
  }
  return payload;
}

async function fetchTf2InventoryPages(steamId: string): Promise<ItemPassport[]> {
  const assets = [];
  const descriptions = [];
  let lastAssetId: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const payload = await fetchSteamInventoryPage(steamId, lastAssetId);
    assets.push(...(payload.assets ?? []));
    descriptions.push(...(payload.descriptions ?? []));
    if (!payload.more_items || !payload.last_assetid) break;
    lastAssetId = payload.last_assetid;
  }

  return mergeInventoryItems(assets, descriptions);
}

export async function fetchTf2Inventory(steamId: string, force = false): Promise<ItemPassport[]> {
  return inventoryMemo.get(steamId, force, () => enqueueSteam(() => fetchTf2InventoryPages(steamId)));
}

export async function fetchTf2InventoryPaged(
  steamId: string,
  onPage: (pageItems: ItemPassport[], info: { done: boolean; loaded: number }) => Promise<void>,
  force = false,
): Promise<ItemPassport[]> {
  if (!force) {
    const hit = inventoryMemo.peek(steamId);
    if (hit) {
      await onPage(hit, { done: true, loaded: hit.length });
      return hit;
    }
  }

  let streamed = false;
  const all = await inventoryMemo.get(steamId, force, () => enqueueSteam(async () => {
    const pages: ItemPassport[] = [];
    let lastAssetId: string | undefined;
    for (let page = 0; page < 20; page += 1) {
      const payload = await fetchSteamInventoryPage(steamId, lastAssetId);
      const pageItems = mergeInventoryItems(payload.assets ?? [], payload.descriptions ?? []);
      pages.push(...pageItems);
      const done = !payload.more_items || !payload.last_assetid;
      streamed = true;
      await onPage(pageItems, { done, loaded: pages.length });
      if (done) break;
      lastAssetId = payload.last_assetid;
    }
    return pages;
  }));
  if (!streamed) {
    await onPage(all, { done: true, loaded: all.length });
  }
  return all;
}

export class InventoryMemo {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly items = new Map<string, { at: number; items: ItemPassport[] }>();
  private readonly inflight = new Map<string, Promise<ItemPassport[]>>();

  constructor(ttlMs = 10 * 60 * 1000, maxEntries = 6) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  peek(steamId: string): ItemPassport[] | null {
    const hit = this.items.get(steamId);
    if (hit && Date.now() - hit.at < this.ttlMs) return hit.items;
    return null;
  }

  async get(steamId: string, force: boolean, loader: () => Promise<ItemPassport[]>): Promise<ItemPassport[]> {
    if (!force) {
      const hit = this.items.get(steamId);
      if (hit && Date.now() - hit.at < this.ttlMs) return hit.items;
      const pending = this.inflight.get(steamId);
      if (pending) return pending;
    }

    const pending = loader().then((passports) => {
      this.items.delete(steamId);
      this.items.set(steamId, { at: Date.now(), items: passports });
      while (this.items.size > this.maxEntries) {
        const oldest = this.items.keys().next().value;
        if (oldest) this.items.delete(oldest);
      }
      return passports;
    }).finally(() => {
      this.inflight.delete(steamId);
    });
    this.inflight.set(steamId, pending);
    return pending;
  }
}

function enqueueSteam<T>(work: () => Promise<T>): Promise<T> {
  const run = steamQueue.then(work, work);
  steamQueue = run.then(() => undefined, () => undefined);
  return run;
}

export const inventoryMemo = new InventoryMemo();
