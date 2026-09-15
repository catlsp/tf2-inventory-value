type SteamInventoryHandle = {
  m_cPageSize?: number;
  pageSize?: number;
  m_cItems?: number;
  rgInventory?: Record<string, unknown>;
  EnsurePage?: (page: number) => void;
  LoadPage?: (page: number) => void;
};

function activeInventory(): SteamInventoryHandle | null {
  const page = window as unknown as { g_ActiveInventory?: SteamInventoryHandle };
  return page.g_ActiveInventory ?? null;
}

function itemCount(inv: SteamInventoryHandle): number {
  if (typeof inv.m_cItems === 'number' && inv.m_cItems > 0) return inv.m_cItems;
  if (inv.rgInventory) return Object.keys(inv.rgInventory).length;
  return 0;
}

async function ensurePages(): Promise<boolean> {
  const inv = activeInventory();
  if (!inv) return false;
  const pageSize = inv.m_cPageSize || inv.pageSize || 25;
  const total = itemCount(inv);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const load = inv.EnsurePage ?? inv.LoadPage;
  if (!load) return false;
  for (let page = 0; page < pages; page += 1) {
    load.call(inv, page);
    if (page % 5 === 4) await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  return true;
}

export default defineContentScript({
  matches: [
    '*://steamcommunity.com/id/*/inventory*',
    '*://steamcommunity.com/profiles/*/inventory*',
  ],
  world: 'MAIN',
  runAt: 'document_idle',
  main() {
    document.documentElement.dataset.tf2ivMain = '1';
    document.addEventListener('tf2iv-load-inventory-pages', () => {
      void ensurePages()
        .then((ok) => {
          document.dispatchEvent(new CustomEvent('tf2iv-inventory-pages-ready', { detail: { ok } }));
        })
        .catch(() => {
          document.dispatchEvent(new CustomEvent('tf2iv-inventory-pages-ready', { detail: { ok: false } }));
        });
    });
  },
});
