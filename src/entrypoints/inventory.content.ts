import '@/assets/content.css';
import { TF2_APPID } from '@/lib/tf2/types';
import { fetchTf2Inventory, resolveInventorySteamId } from '@/lib/steam/inventory';
import { renderInventoryPrices } from '@/lib/ui/inventory-overlay';
import { formatKeysRef } from '@/lib/prices/format';
import { sumQuotes } from '@/lib/prices/lookup';
import type { Quote } from '@/lib/prices/types';
import type { QuoteResponse } from '@/lib/messages';

let cachedQuotes: Record<string, Quote> = {};
let loading = false;

function isTf2InventoryView(): boolean {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith(String(TF2_APPID)) || hash.length === 0;
}

function ensureBanner(): HTMLElement {
  const existing = document.getElementById('tf2iv-banner');
  if (existing) return existing;

  const banner = document.createElement('div');
  banner.id = 'tf2iv-banner';
  banner.innerHTML = `
    <div>
      <strong>TF2 Inventory Value</strong>
      <div class="tf2iv-muted" data-tf2iv-status>Загрузка…</div>
    </div>
    <div class="tf2iv-actions">
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

async function loadPrices(force = false): Promise<void> {
  if (!isTf2InventoryView()) {
    ensureBanner().style.display = 'none';
    return;
  }
  if (loading) return;
  loading = true;
  const banner = ensureBanner();
  banner.style.display = 'flex';
  setStatus(force ? 'Обновляю прайслист…' : 'Считаю инвентарь…');

  try {
    const steamId = await resolveInventorySteamId();
    if (!steamId) {
      setStatus('Не удалось определить SteamID профиля');
      return;
    }

    const items = await fetchTf2Inventory(steamId);
    if (force) {
      await browser.runtime.sendMessage({ type: 'REFRESH_PRICES' });
    }
    const response = await browser.runtime.sendMessage({
      type: 'QUOTE_ITEMS',
      items,
    }) as QuoteResponse;

    if (!response.ok) {
      setStatus(response.error);
      return;
    }

    cachedQuotes = response.quotes;
    paintCachedPrices();
    const totals = sumQuotes(Object.values(response.quotes));
    const keyRef = response.status.keyRef ?? 0;
    const totalText = formatKeysRef(totals.keys, totals.ref, keyRef);
    const parts = [totalText];
    if (totals.unpriced > 0) parts.push(`${totals.unpriced} без цены`);
    if (totals.skipped > 0) parts.push(`${totals.skipped} не в торговле`);
    setStatus(parts.join(' · '));
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
    ensureBanner();
    void loadPrices();
    window.addEventListener('hashchange', () => {
      void loadPrices();
    });

    const root = document.getElementById('inventories') ?? document.body;
    let timer = 0;
    const observer = new MutationObserver((mutations) => {
      const ours = mutations.every((mutation) =>
        Array.from(mutation.addedNodes).every(
          (node) => node instanceof HTMLElement && node.classList.contains('tf2iv-price'),
        ),
      );
      if (ours) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        paintCachedPrices();
      }, 250);
    });
    observer.observe(root, { childList: true, subtree: true });
  },
});
