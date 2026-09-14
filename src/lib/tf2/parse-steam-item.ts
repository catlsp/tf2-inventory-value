import { effectIdFromName } from './effects';
import { paintDefindexFromName } from './paints';
import { qualityFromId, qualityFromTag, qualityIdFromName } from './quality';
import { spellIdFromName } from './spells';
import { killstreakFromName } from './killstreak';
import { toSku } from './sku';
import type {
  ItemPassport,
  KillstreakTier,
  SteamAsset,
  SteamItemDescription,
  StrangePart,
} from './types';

const EFFECT_RE = /^(?:★\s*)?Unusual Effect:\s*(.+)$/i;
const PAINT_RE = /^Paint(?:ed)? Color:\s*(.+)$/i;
const SPELL_RE = /^Halloween(?: Spell)?:\s*(.+)$/i;
const PART_RE = /^Strange Part:\s*(.+?)(?::\s*(\d+))?$/i;
const SHEEN_RE = /^Sheen:\s*(.+)$/i;
const KILLSTREAKER_RE = /^Killstreaker:\s*(.+)$/i;
const UNCRAFTABLE_RE = /not usable in crafting/i;
const GIFTED_RE = /^gifted by\b/i;
const CRAFT_NUMBER_RE = /(?:^|\s)#(\d{1,4})(?:\s|$)/;
const FESTIVIZED_RE = /\bfestivized\b/i;
const AUSTRALIUM_RE = /\baustralium\b/i;

function linesOf(item: SteamItemDescription): string[] {
  return [...(item.descriptions ?? []), ...(item.owner_descriptions ?? [])]
    .map((line) => line.value?.replace(/\u00a0/g, ' ').trim() ?? '')
    .filter((value) => value.length > 0);
}

function parseDefindex(item: SteamItemDescription): number | null {
  const raw = item.app_data?.def_index;
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function parseQuality(item: SteamItemDescription): {
  quality: ItemPassport['quality'];
  qualityId: number | null;
} {
  const rawId = item.app_data?.quality;
  if (rawId != null && rawId !== '') {
    const qualityId = Number.parseInt(rawId, 10);
    if (Number.isFinite(qualityId)) {
      return { quality: qualityFromId(qualityId), qualityId };
    }
  }

  const tag = item.tags?.find((entry) => entry.category === 'Quality');
  if (tag) {
    const quality = qualityFromTag(tag.internal_name, tag.localized_tag_name);
    if (quality) {
      return { quality, qualityId: qualityIdFromName(quality) };
    }
  }

  return { quality: 'Unknown', qualityId: null };
}

function hasStrangeTag(item: SteamItemDescription): boolean {
  return (
    item.tags?.some(
      (tag) =>
        tag.category === 'Quality' &&
        (tag.internal_name === 'Strange' || tag.localized_tag_name === 'Strange'),
    ) ?? false
  );
}

function parseParts(lines: string[]): StrangePart[] {
  const parts: StrangePart[] = [];
  for (const line of lines) {
    const match = line.match(PART_RE);
    if (!match) continue;
    const kills = match[2] ? Number.parseInt(match[2], 10) : undefined;
    parts.push({
      name: match[1].trim(),
      kills: kills != null && Number.isFinite(kills) ? kills : undefined,
    });
  }
  return parts;
}

export function parseSteamDescription(
  item: SteamItemDescription,
  asset?: Pick<SteamAsset, 'assetid' | 'classid' | 'instanceid'>,
): ItemPassport {
  const lines = linesOf(item);
  const marketHashName = item.market_hash_name ?? item.market_name ?? item.name ?? '';
  const name = item.name ?? marketHashName;
  const { quality, qualityId } = parseQuality(item);

  let effectName: string | null = null;
  let paintName: string | null = null;
  const spellNames: string[] = [];
  let sheen: string | null = null;
  let killstreaker: string | null = null;
  let craftable = true;
  let gifted = false;
  let festivized = FESTIVIZED_RE.test(marketHashName) || FESTIVIZED_RE.test(name);
  let killstreak: KillstreakTier = killstreakFromName(marketHashName);

  for (const line of lines) {
    const effectMatch = line.match(EFFECT_RE);
    if (effectMatch) {
      effectName = effectMatch[1].trim();
      continue;
    }

    const paintMatch = line.match(PAINT_RE);
    if (paintMatch) {
      paintName = paintMatch[1].trim();
      continue;
    }

    const spellMatch = line.match(SPELL_RE);
    if (spellMatch) {
      spellNames.push(spellMatch[1].trim());
      continue;
    }

    const sheenMatch = line.match(SHEEN_RE);
    if (sheenMatch) {
      sheen = sheenMatch[1].trim();
      continue;
    }

    const killstreakerMatch = line.match(KILLSTREAKER_RE);
    if (killstreakerMatch) {
      killstreaker = killstreakerMatch[1].trim();
      continue;
    }

    if (UNCRAFTABLE_RE.test(line)) craftable = false;
    if (GIFTED_RE.test(line)) gifted = true;
    if (FESTIVIZED_RE.test(line)) festivized = true;
    if (/^killstreaks active$/i.test(line) && killstreak === 0) killstreak = 1;
  }

  if (killstreaker && killstreak < 3) killstreak = 3;
  else if (sheen && killstreak < 2) killstreak = 2;

  const elevatedStrange =
    quality === 'Unusual' &&
    (hasStrangeTag(item) || /^strange\b/i.test(marketHashName));

  const australium = AUSTRALIUM_RE.test(marketHashName) || AUSTRALIUM_RE.test(name);
  const craftNumberMatch = `${name} ${marketHashName} ${lines.join(' ')}`.match(CRAFT_NUMBER_RE);
  const craftNumber = craftNumberMatch
    ? Number.parseInt(craftNumberMatch[1], 10)
    : null;

  const flags: string[] = [];
  if (effectName) flags.push('unusual');
  if (paintName) flags.push('paint');
  if (spellNames.length > 0) flags.push('spelled');
  if (parseParts(lines).length > 0) flags.push('parts');
  if (gifted) flags.push('gifted');
  if (!craftable) flags.push('uncraftable');
  if (parseDefindex(item) == null) flags.push('missing_defindex');

  const passport: ItemPassport = {
    assetid: asset?.assetid,
    classid: asset?.classid ?? item.classid,
    instanceid: asset?.instanceid ?? item.instanceid,
    defindex: parseDefindex(item),
    quality,
    qualityId,
    elevatedStrange,
    name,
    marketHashName,
    tradable: item.tradable === 1,
    craftable,
    australium,
    festivized,
    effect: effectName
      ? { id: effectIdFromName(effectName), name: effectName }
      : null,
    paint: paintName
      ? { defindex: paintDefindexFromName(paintName), name: paintName }
      : null,
    spells: spellNames.map((spellName) => ({
      id: spellIdFromName(spellName),
      name: spellName,
    })),
    parts: parseParts(lines),
    killstreak,
    sheen,
    killstreaker,
    craftNumber: craftNumber != null && Number.isFinite(craftNumber) ? craftNumber : null,
    gifted,
    sku: null,
    flags,
  };

  passport.sku = toSku(passport);
  return passport;
}

export function mergeInventoryItems(
  assets: SteamAsset[],
  descriptions: SteamItemDescription[],
): ItemPassport[] {
  const byClass = new Map(
    descriptions.map((description) => [
      `${description.classid}_${description.instanceid}`,
      description,
    ]),
  );

  return assets.map((asset) => {
    const description = byClass.get(`${asset.classid}_${asset.instanceid}`);
    if (!description) {
      return parseSteamDescription(
        {
          classid: asset.classid,
          instanceid: asset.instanceid,
          name: 'Unknown item',
          market_hash_name: 'Unknown item',
          tradable: 0,
        },
        asset,
      );
    }
    return parseSteamDescription(description, asset);
  });
}
