import type { ItemPassport } from './types';
import { toSku } from './sku';

function recipeSuffix(item: ItemPassport): string {
  if (item.targetDefindex == null) return '';
  const td = `;td-${item.targetDefindex}`;
  const od = item.outputDefindex != null ? `;od-${item.outputDefindex}` : '';
  const oq = item.outputQuality != null ? `;oq-${item.outputQuality}` : '';
  return `${td}${od}${oq}`;
}

function skuHasPart(sku: string, part: string): boolean {
  return sku.split(';').includes(part);
}

/** SKU variants to try against PriceDB / Autobot lists, most specific first. */
export function skuCandidates(item: ItemPassport): string[] {
  if (item.defindex == null || item.qualityId == null) return [];
  const unusual = item.quality === 'Unusual' || item.qualityId === 5;
  if (unusual && item.effect?.id == null) return [];

  const effect = unusual && item.effect?.id != null ? `;u${item.effect.id}` : '';
  const au = item.australium ? ';australium' : '';
  const uc = item.craftable ? '' : ';uncraftable';
  const festive = item.festivized ? ';festive' : '';
  const festivized = item.festivized ? ';festivized' : '';
  const kt = item.killstreak ? `;kt-${item.killstreak}` : '';
  const strange = item.elevatedStrange ? ';strange' : '';
  const paint = item.paint?.defindex != null ? `;p${item.paint.defindex}` : '';
  const crate = item.crateSeries != null ? `;c${item.crateSeries}` : '';
  const crateDash = item.crateSeries != null ? `;c-${item.crateSeries}` : '';
  const recipe = recipeSuffix(item);
  const head = `${item.defindex};${item.qualityId}`;

  const out = [
    toSku(item),
    `${head}${effect}${au}${uc}${festive}${kt}${paint}${strange}${crate}${recipe}`,
    `${head}${effect}${au}${uc}${festivized}${kt}${paint}${strange}${crate}${recipe}`,
    crateDash ? `${head}${effect}${au}${uc}${kt}${crateDash}` : '',
    crate ? `${head}${crate}` : '',
    `${head}${effect}${au}${uc}${festive}${kt}${paint}${strange}${recipe}`,
    `${head}${effect}${au}${uc}${festivized}${kt}${paint}${strange}${recipe}`,
    `${head}${effect}${au}${uc}${festive}${kt}${strange}${recipe}`,
    `${head}${effect}${au}${uc}${festivized}${kt}${strange}${recipe}`,
    `${head}${effect}${au}${uc}${kt}${strange}${recipe}`,
    `${head}${kt}${recipe}`,
    `${head}${effect}${au}${uc}${strange}`,
    `${head}${effect}${au}${strange}`,
    `${head}${effect}`,
    `${head}${kt}`,
    head,
  ].filter((sku): sku is string => Boolean(sku));

  const unique = [...new Set(out)];
  const withEffect =
    unusual && item.effect?.id != null
      ? unique.filter((sku) => skuHasPart(sku, `u${item.effect!.id}`))
      : unique;
  if (!recipe) return withEffect;

  const required = recipe.split(';').filter(Boolean);
  return withEffect.filter((sku) => {
    const parts = sku.split(';');
    return required.every((part) => parts.includes(part));
  });
}
