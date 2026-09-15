import '@/assets/content.css';
import { TF2_APPID } from '@/lib/tf2/types';
import { fetchTf2InventoryPaged, resolveInventorySteamId } from '@/lib/steam/inventory';
import { renderInventoryPrices } from '@/lib/ui/inventory-overlay';
import {
  applyInventorySort,
  INVENTORY_SORT_LABELS,
  INVENTORY_SORT_MODES,
  isInventorySortMode,
  sortAssetIds,
  type InventorySortMode,
  type SortableItem,
} from '@/lib/ui/inventory-sort';
import { formatKeysRef } from '@/lib/prices/format';
import { sumQuotes } from '@/lib/prices/lookup';
import { fillAndQuote, getPriceStatus, chunkItems } from '@/lib/prices/quote-client';
import { searchQueriesForItem } from '@/lib/prices/search-queries';
import type { SkuPriceIndex } from '@/lib/prices/parse-pricedb';
import type { Quote } from '@/lib/prices/types';
import type { ItemPassport } from '@/lib/tf2/types';

let cachedQuotes: Record<string, Quote> = {};
const localIndex: SkuPriceIndex = {};
const cachedItems: Record<string, ItemPassport> = {};
let originalAssetIds: string[] = [];
let currentSort: InventorySortMode = 'steam';
let applyingSort = false;
let loading = false;

const SORT_STORAGE = 'tf2iv.sortMode';

function readStoredSort(): InventorySortMode {
  try {
    const stored = sessionStorage.getItem(SORT_STORAGE);
    if (stored && isInventorySortMode(stored)) return stored;
  } catch {
    // sessionStorage can be blocked
  }
  return 'steam';
}

function rememberSort(mode: InventorySortMode): void {
  currentSort = mode;
  try {
    sessionStorage.setItem(SORT_STORAGE, mode);
  } catch {
    // ignore quota
  }
}

function sortableRows(): SortableItem[] {
  const rows: SortableItem[] = [];
  for (const item of Object.values(cachedItems)) {
    if (!item.assetid) continue;
    rows.push({ assetid: item.assetid, item, quote: cachedQuotes[item.assetid] });
  }
  return rows;
}

function requestInventoryPages(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    let timeout = 0;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      document.removeEventListener('tf2iv-inventory-pages-ready', onReady);
      window.clearTimeout(timeout);
      resolve(ok);
    };
    const onReady = (event: Event) => {
      finish((event as CustomEvent<{ ok?: boolean }>).detail?.ok !== false);
    };
    document.addEventListener('tf2iv-inventory-pages-ready', onReady);
    const ping = () => document.dispatchEvent(new CustomEvent('tf2iv-load-inventory-pages'));
    timeout = window.setTimeout(() => finish(false), 8000);
    ping();
    window.setTimeout(ping, 200);
  });
}

function relayoutSorted(): void {
  const rows = sortableRows();
  if (rows.length === 0) return;
  const ids = sortAssetIds(rows, currentSort, originalAssetIds);
  applyingSort = true;
  applyInventorySort(ids);
  paintCachedPrices();
  window.setTimeout(() => {
    applyingSort = false;
  }, 50);
}

async function applyCurrentSort(): Promise<void> {
  if (sortableRows().length === 0) return;
  await requestInventoryPages();
  relayoutSorted();
}

function isTf2InventoryView(): boolean {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith(String(TF2_APPID)) || hash.length === 0;
}

function sortOptionsHtml(): string {
  return INVENTORY_SORT_MODES.map(
    (mode) => `<option value="${mode}">${INVENTORY_SORT_LABELS[mode]}</option>`,
  ).join('');
}

function bindSortSelect(banner: HTMLElement): void {
  const select = banner.querySelector<HTMLSelectElement>('[data-tf2iv-sort]');
  if (!select || select.dataset.tf2ivBound === '1') return;
  select.dataset.tf2ivBound = '1';
  select.value = currentSort;
  select.addEventListener('change', () => {
    const value = select.value;
    if (!isInventorySortMode(value)) return;
    rememberSort(value);
    void applyCurrentSort();
  });
}

function ensureBanner(): HTMLElement {
  const existing = document.getElementById('tf2iv-banner');
  if (existing) {
    bindSortSelect(existing);
    return existing;
  }

  const banner = document.createElement('div');
  banner.id = 'tf2iv-banner';
  banner.innerHTML = `
    <div>
      <strong>TF2 Inventory Value</strong>
      <div class="tf2iv-muted" data-tf2iv-status>Загрузка…</div>
    </div>
    <div class="tf2iv-actions">
      <label class="tf2iv-sort">
        <span>Сортировка</span>
        <select data-tf2iv-sort>${sortOptionsHtml()}</select>
      </label>
      <button type="button" data-tf2iv-refresh>Обновить</button>
    </div>
  `;

  const inventoryPage =
    document.getElementById('inventory_page_left') ??
    document.getElementById('inventories') ??
    document.getElementById('tabcontent_inventory') ??
    document.querySelector('.inventory_page_right');
  (inventoryPage?.parentElement ?? document.body).prepend(banner);
  banner.querySelector('[data-tf2iv-refresh]')?.addEventListener('click', () => {
    void loadPrices(true);
  });
  bindSortSelect(banner);
  return banner;
}

function setStatus(text: string): void {
  const status = ensureBanner().querySelector('[data-tf2iv-status]');
  if (status) status.textContent = text;
}

function paintCachedPrices(): void {
  if (Object.keys(cachedQuotes).length === 0) return;
  renderInventoryPrices(cachedQuotes);
}

function showTotals(quotes: Record<string, Quote>, keyRef: number): void {
  const totals = sumQuotes(Object.values(quotes));
  const totalText = formatKeysRef(totals.keys, totals.ref, keyRef);
  const parts = [totalText];
  if (totals.unpriced > 0) parts.push(`${totals.unpriced} без цены`);
  if (totals.skipped > 0) parts.push(`${totals.skipped} не в торговле`);
  setStatus(parts.join(' · '));
}

function needsSearch(item: ItemPassport, quote: Quote | undefined): boolean {
  if (!item.countsTowardValue) return false;
  if (quote?.flags.includes('skipped')) return false;
  if (quote?.midKeys != null) return false;
  return Boolean(item.effect || item.targetName || item.quality === 'Unusual' || item.defindex == null);
}

async function loadPrices(force = false): Promise<void> {
  if (!isTf2InventoryView()) {
    ensureBanner().style.display = 'none';
    return;
  }
  if (loading) return;
  loading = true;
  const banner = ensureBanner();
  banner.style.display = 'flex';
  setStatus(force ? 'Обновляю…' : 'Считаю инвентарь…');

  let keyRef = 0;
  if (force) {
    cachedQuotes = {};
    for (const key of Object.keys(cachedItems)) delete cachedItems[key];
    originalAssetIds = [];
  }

  try {
    const steamId = await resolveInventorySteamId();
    if (!steamId) {
      setStatus('Не удалось определить SteamID профиля');
      return;
    }

    if (force) {
      await browser.runtime.sendMessage({ type: 'REFRESH_PRICES' });
    }

    const status = await getPriceStatus();
    keyRef = status.keyRef ?? 0;

    const all: ItemPassport[] = [];
    await fetchTf2InventoryPaged(steamId, async (pageItems, info) => {
      all.push(...pageItems);
      for (const item of pageItems) {
        if (item.assetid) cachedItems[item.assetid] = item;
      }
      setStatus(`Считаю… ${info.loaded} предметов`);
      const result = await fillAndQuote(pageItems, localIndex, [], keyRef, (quotes, nextKeyRef) => {
        keyRef = nextKeyRef;
        Object.assign(cachedQuotes, quotes);
        paintCachedPrices();
      });
      keyRef = result.keyRef;
      Object.assign(cachedQuotes, result.quotes);
      paintCachedPrices();
    }, force);

    originalAssetIds = all.map((item) => item.assetid).filter((id): id is string => Boolean(id));

    const unresolved = all.filter((item) => {
      const id = item.assetid ?? `${item.classid}_${item.instanceid}`;
      return needsSearch(item, cachedQuotes[id]);
    });
    if (unresolved.length > 0) {
      setStatus(`Добираю unusual и рецепты… ${unresolved.length}`);
      const queries = [...new Set(unresolved.flatMap((item) => searchQueriesForItem(item)))].slice(0, 48);
      for (const chunk of chunkItems(queries, 12)) {
        const result = await fillAndQuote(unresolved, localIndex, chunk, keyRef, (quotes, nextKeyRef) => {
          keyRef = nextKeyRef;
          Object.assign(cachedQuotes, quotes);
          paintCachedPrices();
        });
        keyRef = result.keyRef;
        Object.assign(cachedQuotes, result.quotes);
        paintCachedPrices();
      }
    }

    showTotals(cachedQuotes, keyRef);
    if (currentSort !== 'steam') await applyCurrentSort();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  } finally {
    loading = false;
  }
}

export default defineContentScript({
  matches: [
    '*://steamcommunity.com/id/*/inventory*',
    '*://steamcommunity.com/profiles/*/inventory*',
  ],
  runAt: 'document_idle',
  main() {
    currentSort = readStoredSort();
    ensureBanner();
    void loadPrices();
    window.addEventListener('hashchange', () => {
      void loadPrices();
    });

    const root = document.getElementById('inventories') ?? document.body;
    let timer = 0;
    const observer = new MutationObserver((mutations) => {
      if (applyingSort) return;
      const ours = mutations.every((mutation) =>
        Array.from(mutation.addedNodes).every(
          (node) => node instanceof HTMLElement && (
            node.classList.contains('tf2iv-price') || node.id === 'tf2iv-banner'
          ),
        ),
      );
      if (ours) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        paintCachedPrices();
        if (currentSort !== 'steam') relayoutSorted();
      }, 250);
    });
    observer.observe(root, { childList: true, subtree: true });
  },
});
