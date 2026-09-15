const ORIGINAL_KEY = '__tf2ivOriginalHolders';
const MSG_SOURCE = 'tf2iv';

type SteamInventoryHandle = {
  appid?: number;
  m_appid?: number;
  m_rgItemElements?: unknown[];
  m_bNeedsRepagination?: boolean;
  LayoutPages?: () => void;
  SetActivePage?: (page: number) => void;
  [ORIGINAL_KEY]?: unknown[];
};

type SortMessage = {
  source: string;
  action: 'sort' | 'sort-done';
  assetIds?: string[];
  restore?: boolean;
  ok?: boolean;
};

function activeInventory(): SteamInventoryHandle | null {
  const page = window as unknown as { g_ActiveInventory?: SteamInventoryHandle };
  const inv = page.g_ActiveInventory;
  if (!inv) return null;
  const appid = inv.appid ?? inv.m_appid;
  if (appid != null && Number(appid) !== 440) return null;
  return inv;
}

function asElement(holder: unknown): HTMLElement | null {
  if (!holder || typeof holder !== 'object') return null;
  if (holder instanceof HTMLElement) return holder;
  const record = holder as { jquery?: unknown; 0?: unknown; get?: (index: number) => unknown };
  const node = record[0] ?? record.get?.(0);
  return node instanceof HTMLElement ? node : null;
}

function assetIdOfHolder(holder: unknown): string | null {
  const el = asElement(holder);
  if (!el) return null;
  const marked = el.dataset.tf2ivAssetid || el.querySelector<HTMLElement>('.item')?.dataset.tf2ivAssetid;
  if (marked) return marked;
  const item = el.querySelector('.item');
  const id = item?.id ?? el.id ?? '';
  const match = id.match(/440_2_(\d+)$/);
  return match?.[1] ?? null;
}

function applySteamSort(assetIds: string[] | undefined, restore: boolean): boolean {
  try {
    const inv = activeInventory();
    if (!inv || !Array.isArray(inv.m_rgItemElements)) return false;

    if (!inv[ORIGINAL_KEY]) inv[ORIGINAL_KEY] = inv.m_rgItemElements.slice();
    const original = inv[ORIGINAL_KEY] ?? [];

    if (restore) {
      inv.m_rgItemElements = original.slice();
    } else if (assetIds && assetIds.length > 0) {
      const byId = new Map<string, unknown>();
      for (const holder of inv.m_rgItemElements) {
        const id = assetIdOfHolder(holder);
        if (id && !byId.has(id)) byId.set(id, holder);
      }
      const used = new Set<unknown>();
      const next: unknown[] = [];
      for (const id of assetIds) {
        const holder = byId.get(id);
        if (holder == null || used.has(holder)) continue;
        next.push(holder);
        used.add(holder);
      }
      for (const holder of original) {
        if (holder == null || used.has(holder)) continue;
        next.push(holder);
        used.add(holder);
      }
      inv.m_rgItemElements = next;
    } else {
      return false;
    }

    inv.m_bNeedsRepagination = true;
    inv.LayoutPages?.();
    inv.SetActivePage?.(0);
    return true;
  } catch {
    return false;
  }
}

function onMessage(event: MessageEvent<SortMessage>): void {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== MSG_SOURCE || data.action !== 'sort') return;
  const ok = applySteamSort(data.assetIds, Boolean(data.restore));
  window.postMessage({ source: MSG_SOURCE, action: 'sort-done', ok } satisfies SortMessage, '*');
}

export default defineContentScript({
  matches: [
    '*://steamcommunity.com/id/*/inventory*',
    '*://steamcommunity.com/profiles/*/inventory*',
  ],
  world: 'MAIN',
  runAt: 'document_idle',
  main() {
    window.addEventListener('message', onMessage);
  },
});
