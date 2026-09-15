import type { Quote } from '../prices/types';
import type { ItemPassport } from '../tf2/types';

export const INVENTORY_SORT_MODES = [
  'steam',
  'price-desc',
  'unusual',
  'spells',
  'paint',
  'parts',
  'killstreak',
] as const;

export type InventorySortMode = (typeof INVENTORY_SORT_MODES)[number];

export type SortableItem = {
  assetid: string;
  item: ItemPassport;
  quote?: Quote;
};

function isUnusual(item: ItemPassport): boolean {
  return item.quality === 'Unusual' || item.qualityId === 5 || Boolean(item.effect);
}

function priceRef(row: SortableItem): number {
  return row.quote?.midRef ?? -1;
}

function byName(a: SortableItem, b: SortableItem): number {
  return a.item.name.localeCompare(b.item.name, 'en');
}

function byPriceDesc(a: SortableItem, b: SortableItem): number {
  const delta = priceRef(b) - priceRef(a);
  if (delta !== 0) return delta;
  return byName(a, b);
}

export function compareSortable(a: SortableItem, b: SortableItem, mode: InventorySortMode): number {
  if (mode === 'steam' || mode === 'price-desc') return byPriceDesc(a, b);

  if (mode === 'unusual') {
    const ranked = Number(isUnusual(b.item)) - Number(isUnusual(a.item));
    if (ranked !== 0) return ranked;
    const names = (a.item.effect?.name ?? '').localeCompare(b.item.effect?.name ?? '', 'en');
    if (names !== 0) return names;
    return byPriceDesc(a, b);
  }

  if (mode === 'spells') {
    const counted = b.item.spells.length - a.item.spells.length;
    if (counted !== 0) return counted;
    const names = a.item.spells.map((spell) => spell.name).join('|')
      .localeCompare(b.item.spells.map((spell) => spell.name).join('|'), 'en');
    if (names !== 0) return names;
    return byPriceDesc(a, b);
  }

  if (mode === 'paint') {
    const ranked = Number(Boolean(b.item.paint)) - Number(Boolean(a.item.paint));
    if (ranked !== 0) return ranked;
    const names = (a.item.paint?.name ?? '').localeCompare(b.item.paint?.name ?? '', 'en');
    if (names !== 0) return names;
    return byPriceDesc(a, b);
  }

  if (mode === 'parts') {
    const counted = b.item.parts.length - a.item.parts.length;
    if (counted !== 0) return counted;
    return byPriceDesc(a, b);
  }

  const ranked = b.item.killstreak - a.item.killstreak;
  if (ranked !== 0) return ranked;
  return byPriceDesc(a, b);
}

export function sortAssetIds(
  rows: SortableItem[],
  mode: InventorySortMode,
  originalAssetIds: string[] = [],
): string[] {
  if (mode === 'steam') {
    const rank = new Map(originalAssetIds.map((id, index) => [id, index]));
    return [...rows]
      .sort((a, b) => (rank.get(a.assetid) ?? 1e9) - (rank.get(b.assetid) ?? 1e9) || byName(a, b))
      .map((row) => row.assetid);
  }

  return [...rows]
    .sort((a, b) => compareSortable(a, b, mode))
    .map((row) => row.assetid);
}

export function isInventorySortMode(value: string): value is InventorySortMode {
  return (INVENTORY_SORT_MODES as readonly string[]).includes(value);
}

export function assetIdFromElementId(id: string): string | null {
  return id.match(/440_2_(\d+)$/)?.[1] ?? null;
}

export function assetIdFromInventoryNode(node: Element): string | null {
  const item = node.classList.contains('item')
    ? node
    : node.querySelector('.item');
  const marked = (item instanceof HTMLElement && item.dataset.tf2ivAssetid)
    || (node instanceof HTMLElement && node.dataset.tf2ivAssetid);
  if (marked) return marked;
  return assetIdFromElementId(item?.id ?? node.id ?? '');
}

export function findTf2InventoryRoot(): HTMLElement | null {
  return (
    document.getElementById('inventory_440_2')
    ?? document.querySelector<HTMLElement>('#inventories [id^="inventory_440_"]')
  );
}

export function applyInventorySort(sortedAssetIds: string[]): boolean {
  const root = findTf2InventoryRoot() ?? document.getElementById('inventories');
  if (!root) return false;
  const pages = [...root.querySelectorAll<HTMLElement>('.inventory_page')];
  const containers = pages.length > 0 ? pages : [root];

  const holders = containers.flatMap((page) => {
    const direct = [...page.querySelectorAll<HTMLElement>(':scope > .itemHolder')];
    return direct.length > 0 ? direct : [...page.querySelectorAll<HTMLElement>('.itemHolder')];
  });
  if (holders.length === 0) return false;

  const pageSize = Math.max(
    1,
    (pages[0]?.querySelectorAll(':scope > .itemHolder').length ?? holders.length) || 25,
  );

  const byAsset = new Map<string, HTMLElement>();
  const empty: HTMLElement[] = [];
  for (const holder of holders) {
    const assetid = assetIdFromInventoryNode(holder);
    if (assetid) byAsset.set(assetid, holder);
    else empty.push(holder);
  }

  const ordered: HTMLElement[] = [];
  const used = new Set<HTMLElement>();
  for (const assetid of sortedAssetIds) {
    const holder = byAsset.get(assetid);
    if (!holder || used.has(holder)) continue;
    ordered.push(holder);
    used.add(holder);
  }
  for (const holder of holders) {
    if (!used.has(holder) && assetIdFromInventoryNode(holder)) {
      ordered.push(holder);
      used.add(holder);
    }
  }
  ordered.push(...empty.filter((holder) => !used.has(holder)));

  for (let index = 0; index < ordered.length; index += 1) {
    const page = containers[Math.min(containers.length - 1, Math.floor(index / pageSize))];
    page.appendChild(ordered[index]);
  }
  return ordered.length > 0;
}
