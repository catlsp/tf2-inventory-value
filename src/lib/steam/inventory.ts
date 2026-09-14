import { TF2_APPID, TF2_CONTEXT_ID, type SteamInventoryResponse } from '../tf2/types';
import { mergeInventoryItems } from '../tf2/parse-steam-item';
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
  const response = await fetch(`https://steamcommunity.com/id/${vanity[1]}/?xml=1`, {
    credentials: 'include',
  });
  if (!response.ok) return null;
  const xml = await response.text();
  return xml.match(/<steamID64>(\d{17})<\/steamID64>/)?.[1] ?? null;
}

export async function fetchTf2Inventory(steamId: string): Promise<ItemPassport[]> {
  const assets = [];
  const descriptions = [];
  let lastAssetId: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const url = new URL(`https://steamcommunity.com/inventory/${steamId}/${TF2_APPID}/${TF2_CONTEXT_ID}`);
    url.searchParams.set('l', 'english');
    url.searchParams.set('count', '2000');
    if (lastAssetId) url.searchParams.set('start_assetid', lastAssetId);

    const response = await fetch(url.toString(), { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Steam inventory HTTP ${response.status}`);
    }
    const payload = (await response.json()) as SteamInventoryResponse;
    if (payload.success === 0) {
      throw new Error('Инвентарь скрыт или недоступен');
    }
    assets.push(...(payload.assets ?? []));
    descriptions.push(...(payload.descriptions ?? []));
    if (!payload.more_items || !payload.last_assetid) break;
    lastAssetId = payload.last_assetid;
  }

  return mergeInventoryItems(assets, descriptions);
}
