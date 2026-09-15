import { formatKeysRef } from '../prices/format';
import { t } from '../i18n';
import type { Quote, QuoteFlag } from '../prices/types';

function priceClass(quote: Quote): string {
  if (quote.midKeys == null) return 'tf2iv-price is-unknown';
  if (quote.flags.includes('spelled') || quote.flags.includes('paint')) return 'tf2iv-price is-extra';
  if (quote.flags.includes('unusual')) return 'tf2iv-price is-unusual';
  return 'tf2iv-price';
}

function unusualSpreadLabel(quote: Quote): string | null {
  const { lowKeys, highKeys, midKeys, midRef } = quote;
  if (
    lowKeys == null ||
    highKeys == null ||
    midKeys == null ||
    midRef == null ||
    !(lowKeys > 0 && highKeys > 0) ||
    midKeys === 0
  ) {
    return null;
  }
  if (lowKeys === midKeys && highKeys === midKeys) return null;
  const rate = midRef / midKeys;
  return t('overlay_spread', {
    buy: formatKeysRef(lowKeys, lowKeys * rate),
    sell: formatKeysRef(highKeys, highKeys * rate),
  });
}

function flagLabel(flag: QuoteFlag): string {
  const keys = {
    paint: 'flag_paint',
    spelled: 'flag_spelled',
    parts: 'flag_parts',
    unusual: 'flag_unusual',
    stale: 'flag_stale',
    no_comps: 'flag_no_comps',
    unpriced: 'flag_unpriced',
    skipped: 'flag_skipped',
  } as const;
  return t(keys[flag]);
}

function priceTitle(quote: Quote, label: string): string {
  if (quote.flags.includes('unusual') && quote.midKeys == null) {
    return t('overlay_no_effect');
  }

  const bits = [label];
  if (quote.flags.includes('unusual')) {
    bits.push(t('overlay_unusual_effect'));
    const spread = unusualSpreadLabel(quote);
    if (spread) bits.push(spread);
  }

  const extras = quote.flags.filter((flag) => flag !== 'unusual' && flag !== 'stale');
  if (extras.length > 0) {
    bits.push(t('overlay_base_no_markup', { extras: extras.map(flagLabel).join(', ') }));
  }

  return bits.join(' · ');
}

export function findItemNode(assetid: string): HTMLElement | null {
  const exact = [
    document.getElementById(`440_2_${assetid}`),
    document.getElementById(`item440_2_${assetid}`),
  ];
  for (const node of exact) {
    if (node) return (node.closest('.item') as HTMLElement | null) ?? node;
  }

  const suffix = document.querySelector<HTMLElement>(`[id$="_${assetid}"]`);
  if (suffix) return (suffix.closest('.item') as HTMLElement | null) ?? suffix;
  return null;
}

export function renderItemPrice(assetid: string, quote: Quote): void {
  const item = findItemNode(assetid);
  if (!item) return;
  item.dataset.tf2ivAssetid = assetid;
  item.closest('.itemHolder')?.setAttribute('data-tf2iv-assetid', assetid);
  item.style.position = 'relative';

  let badge = item.querySelector<HTMLElement>(':scope > .tf2iv-price');
  if (!badge) {
    badge = document.createElement('div');
    item.appendChild(badge);
  }

  badge.className = priceClass(quote);
  badge.textContent = formatKeysRef(quote.midKeys, quote.midRef);
  badge.title = priceTitle(quote, badge.textContent ?? '');
}

export function renderInventoryPrices(quotes: Record<string, Quote>): void {
  for (const [assetid, quote] of Object.entries(quotes)) {
    if (quote.flags.includes('skipped')) continue;
    renderItemPrice(assetid, quote);
  }
}
