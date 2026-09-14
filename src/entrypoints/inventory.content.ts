import '@/assets/content.css';
import { TF2_APPID } from '@/lib/tf2/types';

function isTf2InventoryView(): boolean {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith(String(TF2_APPID));
}

function ensureBanner(): HTMLElement {
  const existing = document.getElementById('tf2iv-banner');
  if (existing) return existing;

  const banner = document.createElement('div');
  banner.id = 'tf2iv-banner';
  banner.innerHTML = `
    <div>
      <strong>TF2 Inventory Value</strong>
      <div class="tf2iv-muted">Парсер предметов готов. Цены keys/ref появятся в следующей версии.</div>
    </div>
  `;

  const inventoryPage = document.getElementById('inventory_page_left') ?? document.getElementById('inventories');
  (inventoryPage?.parentElement ?? document.body).prepend(banner);
  return banner;
}

function syncBanner(): void {
  const banner = ensureBanner();
  banner.style.display = isTf2InventoryView() || !window.location.hash ? 'flex' : 'none';
}

export default defineContentScript({
  matches: [
    '*://steamcommunity.com/id/*/inventory*',
    '*://steamcommunity.com/profiles/*/inventory*',
  ],
  runAt: 'document_idle',
  main() {
    syncBanner();
    window.addEventListener('hashchange', syncBanner);
  },
});
