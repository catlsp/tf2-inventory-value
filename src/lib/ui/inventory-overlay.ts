import { formatKeysRef } from '../prices/format';
import type { Quote } from '../prices/types';

function priceClass(quote: Quote): string {
  if (quote.midKeys == null) return 'tf2iv-price is-unknown';
  if (quote.flags.includes('spelled') || quote.flags.includes('paint')) return 'tf2iv-price is-extra';
  if (quote.flags.includes('unusual')) return 'tf2iv-price is-unusual';
  return 'tf2iv-price';
}

function findItemNode(assetid: string): HTMLElement | null {
  return (
    document.getElementById(`440_2_${assetid}`) ??
    document.querySelector<HTMLElement>(`[id$="_${assetid}"]`)
  );
}

export function renderItemPrice(assetid: string, quote: Quote): void {
  const item = findItemNode(assetid);
  if (!item) return;
  item.style.position = 'relative';

  let badge = item.querySelector<HTMLElement>(':scope > .tf2iv-price');
  if (!badge) {
    badge = document.createElement('div');
    item.appendChild(badge);
  }

  badge.className = priceClass(quote);
  badge.textContent = formatKeysRef(quote.midKeys, quote.midRef);
  const extras = quote.flags.filter((flag) => flag !== 'unusual' && flag !== 'stale');
  badge.title = extras.length > 0
    ? `${badge.textContent} · база схемы, не считая: ${extras.join(', ')}`
    : badge.textContent ?? '';
}

export function renderInventoryPrices(quotes: Record<string, Quote>): void {
  for (const [assetid, quote] of Object.entries(quotes)) {
    renderItemPrice(assetid, quote);
  }
}
