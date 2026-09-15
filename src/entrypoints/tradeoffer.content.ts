import '@/assets/content.css';
import { fetchTf2Inventory } from '@/lib/steam/inventory';
import { tradeAssetIdsFromDocument, tradeSteamIdsFromHtml } from '@/lib/steam/trade-page';
import { formatDelta, formatKeysRef } from '@/lib/prices/format';
import { sumQuotes } from '@/lib/prices/lookup';
import { renderInventoryPrices } from '@/lib/ui/inventory-overlay';
import type { QuoteResponse } from '@/lib/messages';
import type { ItemPassport } from '@/lib/tf2/types';
import type { Quote } from '@/lib/prices/types';

let lastTradeKey = '';
let lastQuotes: Record<string, Quote> = {};

function ensurePanel(): HTMLElement {
  const existing = document.getElementById('tf2iv-trade-panel');
  if (existing) return existing;

  const panel = document.createElement('div');
  panel.id = 'tf2iv-trade-panel';
  panel.innerHTML = `
    <h3>TF2 Inventory Value</h3>
    <div data-tf2iv-trade-status class="tf2iv-muted">Считаю обмен…</div>
    <div class="tf2iv-trade-rows" hidden>
      <div>Отдаёте: <strong data-tf2iv-yours></strong></div>
      <div>Получаете: <strong data-tf2iv-theirs></strong></div>
      <div data-tf2iv-delta></div>
    </div>
  `;

  const anchor =
    document.querySelector('.trade_box_inventory_and_participants') ??
    document.querySelector('.trade_area') ??
    document.getElementById('trade_yours') ??
    document.body;
  anchor.prepend(panel);
  return panel;
}

function setStatus(text: string): void {
  const status = ensurePanel().querySelector('[data-tf2iv-trade-status]');
  if (status) status.textContent = text;
}

function pick(items: ItemPassport[], assetIds: string[]): ItemPassport[] {
  const wanted = new Set(assetIds);
  return items.filter((item) => item.assetid && wanted.has(item.assetid));
}

async function quotePassports(items: ItemPassport[]): Promise<QuoteResponse> {
  return browser.runtime.sendMessage({
    type: 'QUOTE_ITEMS',
    items,
  }) as Promise<QuoteResponse>;
}

async function refreshTrade(): Promise<void> {
  const panel = ensurePanel();
  const rows = panel.querySelector<HTMLElement>('.tf2iv-trade-rows');
  const ids = tradeSteamIdsFromHtml(document.documentElement.innerHTML, location.pathname, location.search);
  const { yours, theirs } = tradeAssetIdsFromDocument(document);

  if (yours.length === 0 && theirs.length === 0) {
    lastTradeKey = '';
    setStatus('Положите предметы TF2 в окно обмена — покажем keys/ref и разницу.');
    rows?.setAttribute('hidden', '');
    return;
  }

  const tradeKey = `${yours.join(',')}|${theirs.join(',')}`;
  if (tradeKey === lastTradeKey && Object.keys(lastQuotes).length > 0) {
    renderInventoryPrices(lastQuotes);
    return;
  }

  if (!ids.me && yours.length > 0) {
    setStatus('Не удалось определить ваш SteamID. Обновите страницу обмена.');
    return;
  }

  setStatus('Считаю обмен…');
  try {
    const [yourInv, theirInv] = await Promise.all([
      ids.me ? fetchTf2Inventory(ids.me) : Promise.resolve([] as ItemPassport[]),
      ids.them ? fetchTf2Inventory(ids.them) : Promise.resolve([] as ItemPassport[]),
    ]);

    const yourItems = pick(yourInv, yours);
    const theirItems = pick(theirInv, theirs);
    const all = [...yourItems, ...theirItems];
    if (all.length === 0) {
      setStatus('Предметы в обмене не из TF2 или инвентарь ещё грузится.');
      return;
    }

    const response = await quotePassports(all);
    if (!response.ok) {
      setStatus(response.error);
      return;
    }

    lastTradeKey = tradeKey;
    lastQuotes = response.quotes;

    const yourQuotes = yourItems.map((item) => response.quotes[item.assetid ?? '']).filter(Boolean) as Quote[];
    const theirQuotes = theirItems.map((item) => response.quotes[item.assetid ?? '']).filter(Boolean) as Quote[];
    renderInventoryPrices(response.quotes);

    const yourSum = sumQuotes(yourQuotes);
    const theirSum = sumQuotes(theirQuotes);
    const keyRef = response.status.keyRef ?? 0;
    rows?.removeAttribute('hidden');
    panel.querySelector('[data-tf2iv-yours]')!.textContent = formatKeysRef(yourSum.keys, yourSum.ref, keyRef);
    panel.querySelector('[data-tf2iv-theirs]')!.textContent = formatKeysRef(theirSum.keys, theirSum.ref, keyRef);

    const deltaEl = panel.querySelector<HTMLElement>('[data-tf2iv-delta]')!;
    const incomplete = yourSum.unpriced + theirSum.unpriced;
    if (incomplete > 0 || yourSum.priced + theirSum.priced === 0) {
      deltaEl.className = 'is-incomplete';
      deltaEl.textContent = `Профит не считаем: ${incomplete} предмет(ов) без цены.`;
      setStatus('Часть предметов без котировки — не зелёный «профит».');
      return;
    }

    const delta = theirSum.keys - yourSum.keys;
    deltaEl.className = delta >= 0 ? 'is-plus' : 'is-minus';
    deltaEl.textContent = `Δ ${formatDelta(delta, keyRef)}`;
    setStatus('Оценка по buy с pricedb.io. Краска и спеллы не накручены.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
}

export default defineContentScript({
  matches: [
    '*://steamcommunity.com/tradeoffer/*',
    '*://steamcommunity.com/tradeoffers/*',
  ],
  runAt: 'document_idle',
  main() {
    ensurePanel();
    void refreshTrade();
    let timer = 0;
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void refreshTrade();
      }, 400);
    });
    for (const selector of ['#your_slots', '#their_slots', '#trade_yours', '#trade_them']) {
      const node = document.querySelector(selector);
      if (node) observer.observe(node, { childList: true, subtree: true });
    }
  },
});
