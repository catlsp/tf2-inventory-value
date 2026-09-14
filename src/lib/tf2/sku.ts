import type { ItemPassport } from './types';

/**
 * Compact SKU in the tf2autobot-style family:
 * `defindex;quality;u{effect};australium;uncraftable;festive;kt-{n};p{paint};strange`
 *
 * Spells and parts stay on the passport — they are not part of the base SKU.
 */
export function toSku(item: Pick<
  ItemPassport,
  | 'defindex'
  | 'qualityId'
  | 'effect'
  | 'australium'
  | 'craftable'
  | 'festivized'
  | 'killstreak'
  | 'paint'
  | 'elevatedStrange'
>): string | null {
  if (item.defindex == null || item.qualityId == null) return null;

  const parts = [`${item.defindex};${item.qualityId}`];

  if (item.effect?.id != null) parts.push(`u${item.effect.id}`);
  if (item.australium) parts.push('australium');
  if (!item.craftable) parts.push('uncraftable');
  if (item.festivized) parts.push('festive');
  if (item.killstreak) parts.push(`kt-${item.killstreak}`);
  if (item.paint?.defindex != null) parts.push(`p${item.paint.defindex}`);
  if (item.elevatedStrange) parts.push('strange');

  return parts.join(';');
}
