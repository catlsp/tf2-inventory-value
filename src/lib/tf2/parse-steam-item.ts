import { effectIdFromName, effectIdFromParticle, effectNameFromId } from './effects';
import { paintDefindexFromName } from './paints';
import { qualityFromId, qualityFromTag, qualityIdFromName } from './quality';
import { spellIdFromName } from './spells';
import { killstreakFromName } from './killstreak';
import { toSku } from './sku';
import { economyDefindex, stockWeaponDefindexFromName } from './economy';
import type {
  ItemPassport,
  KillstreakTier,
  SteamAsset,
  SteamItemDescription,
  StrangePart,
} from './types';

const EFFECT_RE = /unusual effect:\s*(.+)$/i;
const PAINT_RE = /^Paint(?:ed)? Color:\s*(.+)$/i;
const SPELL_RE = /^Halloween(?: Spell)?:\s*(.+)$/i;
const PART_RE = /^Strange Part:\s*(.+?)(?::\s*(\d+))?$/i;
const SHEEN_RE = /^Sheen:\s*(.+)$/i;
const KILLSTREAKER_RE = /^Killstreaker:\s*(.+)$/i;
const UNCRAFTABLE_RE = /not usable in crafting/i;
const UNTRADEABLE_RE = /not tradable(?:\s+or\s+marketable)?/i;
const GIFTED_RE = /^gifted by\b/i;
const CRAFT_NUMBER_RE = /(?:^|\s)#(\d{1,4})(?:\s|$)/;
const FESTIVIZED_RE = /\bfestivized\b/i;
const AUSTRALIUM_RE = /\baustralium\b/i;
const KIT_FABRICATOR_RE =
  /^(?:Non-Craftable )?(?:Professional |Specialized )?Killstreak (.+) Kit Fabricator$/i;
const KIT_RE = /^(?:Non-Craftable )?(?:Professional |Specialized )?Killstreak (.+) Kit$/i;
const RECEIVE_OUTPUT_RE = /you will receive all of (?:this|the following)/i;
const KILLSTREAK_KIT_DEFINDEX = 6527;
const SPECIALIZED_KILLSTREAK_KIT_DEFINDEX = 6523;
const PROFESSIONAL_KILLSTREAK_KIT_DEFINDEX = 6526;

function cleanDescriptionLine(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function linesOf(item: SteamItemDescription): string[] {
  return [...(item.descriptions ?? []), ...(item.owner_descriptions ?? [])]
    .map((line) => cleanDescriptionLine(line.value ?? ''))
    .filter((value) => value.length > 0);
}

function effectFromTags(item: SteamItemDescription): { id: number | null; name: string } | null {
  const tag = item.tags?.find((entry) => (
    /particle|unusual.?effect/i.test(entry.category)
    || /particle|unusual.?effect/i.test(entry.internal_name)
  ));
  if (!tag) return null;
  const name = (tag.localized_tag_name ?? '').trim();
  const fromInternal = effectIdFromParticle(tag.internal_name);
  const fromName = name ? effectIdFromName(name) : null;
  const id = fromInternal ?? fromName;
  if (!name && id == null) return null;
  return { id, name: name || effectNameFromId(id ?? 0) || tag.internal_name };
}

function effectFromAppData(item: SteamItemDescription): number | null {
  const data = item.app_data;
  if (!data) return null;
  for (const [key, raw] of Object.entries(data)) {
    if (key === 'def_index' || key === 'defindex' || key === 'quality') continue;
    if (!/particle|effect/i.test(key) || raw == null) continue;
    const id = effectIdFromParticle(raw);
    if (id != null) return id;
  }
  return null;
}

function resolveUnusualEffect(
  item: SteamItemDescription,
  effectName: string | null,
): { id: number | null; name: string } | null {
  const fromTags = effectFromTags(item);
  const particleId = effectFromAppData(item) ?? fromTags?.id ?? null;
  const name = effectName || fromTags?.name || (particleId != null ? effectNameFromId(particleId) : null);
  if (!name && particleId == null) return null;
  const id = particleId ?? (name ? effectIdFromName(name) : null);
  return {
    id,
    name: name || effectNameFromId(id ?? 0) || `Particle ${id}`,
  };
}

function parseDefindex(item: SteamItemDescription): number | null {
  const raw = item.app_data?.def_index ?? item.app_data?.defindex;
  if (raw) {
    const value = Number.parseInt(raw, 10);
    if (Number.isFinite(value)) return economyDefindex(value);
  }

  const links = [...(item.actions ?? []), ...(item.market_actions ?? [])]
    .map((action) => action.link ?? '')
    .join('\n');
  const wiki = links.match(/itemredirect\.php\?id=(\d+)/i);
  if (wiki) {
    const value = Number.parseInt(wiki[1], 10);
    if (Number.isFinite(value)) return economyDefindex(value);
  }
  return null;
}

function parseSlot(item: SteamItemDescription): string | null {
  const tag = item.tags?.find((entry) => entry.category === 'Type');
  const raw = tag?.internal_name ?? tag?.localized_tag_name;
  if (!raw) return null;
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

function isCrateItem(item: SteamItemDescription, slot: string | null, name: string): boolean {
  if (slot === 'supply_crate') return true;
  return /crate|case/i.test(item.type ?? '') || /crate|case/i.test(name);
}

function parseCrateSeries(
  item: SteamItemDescription,
  lines: string[],
  slot: string | null,
  name: string,
  marketHashName: string,
): number | null {
  if (!isCrateItem(item, slot, `${name} ${marketHashName}`)) return null;
  const texts = [...lines, marketHashName, name];
  for (const text of texts) {
    const match =
      text.match(/(?:crate|case)\s*series\s*#(\d+)/i) ??
      text.match(/series\s*#(\d+)/i);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value)) return value;
    }
  }
  const trailing = marketHashName.match(/#(\d+)\s*$/);
  if (trailing) {
    const value = Number.parseInt(trailing[1], 10);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function isUntradeable(item: SteamItemDescription, lines: string[]): boolean {
  if (lines.some((line) => UNTRADEABLE_RE.test(line))) return true;
  return item.tradable === 0;
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

function capturedWeaponName(match: RegExpMatchArray | null): string | null {
  const value = match?.[1]?.trim();
  return value ? value : null;
}

function parseKitRecipe(
  name: string,
  marketHashName: string,
  lines: string[],
): { fabricator: boolean; kit: boolean; targetName: string | null } {
  const labels = [marketHashName, name];
  let fabricator = labels.some((label) => /kit fabricator$/i.test(label));
  let targetName: string | null = null;

  for (const label of labels) {
    const fabricatorMatch = label.match(KIT_FABRICATOR_RE);
    if (fabricatorMatch) {
      fabricator = true;
      targetName = capturedWeaponName(fabricatorMatch);
      break;
    }
  }

  let kit = false;
  if (!fabricator) {
    for (const label of labels) {
      const kitMatch = label.match(KIT_RE);
      if (kitMatch) {
        kit = true;
        targetName = capturedWeaponName(kitMatch);
        break;
      }
    }
  }

  if (!targetName) {
    let afterReceive = false;
    for (const line of lines) {
      if (RECEIVE_OUTPUT_RE.test(line)) {
        afterReceive = true;
        continue;
      }
      const fabricatorMatch = line.match(KIT_FABRICATOR_RE);
      if (fabricatorMatch) {
        fabricator = true;
        targetName = capturedWeaponName(fabricatorMatch);
        break;
      }
      const kitMatch = line.match(KIT_RE);
      if (kitMatch && (fabricator || kit || afterReceive)) {
        targetName = capturedWeaponName(kitMatch);
        break;
      }
    }
  }

  if (!kit && !fabricator && targetName) kit = true;
  return { fabricator, kit, targetName };
}

function outputForFabricator(
  fabricator: boolean,
  killstreak: KillstreakTier,
  targetDefindex: number | null,
): { outputDefindex: number | null; outputQuality: number | null } {
  if (!fabricator || targetDefindex == null || !killstreak) {
    return { outputDefindex: null, outputQuality: null };
  }
  if (killstreak === 3) return { outputDefindex: PROFESSIONAL_KILLSTREAK_KIT_DEFINDEX, outputQuality: 6 };
  if (killstreak === 2) return { outputDefindex: SPECIALIZED_KILLSTREAK_KIT_DEFINDEX, outputQuality: 6 };
  return { outputDefindex: KILLSTREAK_KIT_DEFINDEX, outputQuality: 6 };
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
  if (killstreak === 0) killstreak = killstreakFromName(name);
  const recipe = parseKitRecipe(name, marketHashName, lines);

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
    if (/^killstreaks active$/i.test(line) && killstreak === 0 && !recipe.fabricator && !recipe.kit) {
      killstreak = 1;
    }
  }

  if (!recipe.fabricator && !recipe.kit) {
    if (killstreaker && killstreak < 3) killstreak = 3;
    else if (sheen && killstreak < 2) killstreak = 2;
  }

  const effect = resolveUnusualEffect(item, effectName);

  const targetName = recipe.targetName;
  const targetDefindex = targetName ? stockWeaponDefindexFromName(targetName) : null;
  const { outputDefindex, outputQuality } = outputForFabricator(
    recipe.fabricator,
    killstreak,
    targetDefindex,
  );

  const elevatedStrange =
    quality === 'Unusual' &&
    (hasStrangeTag(item) || /^strange\b/i.test(marketHashName));

  const australium = AUSTRALIUM_RE.test(marketHashName) || AUSTRALIUM_RE.test(name);
  const craftNumberMatch = `${name} ${marketHashName} ${lines.join(' ')}`.match(CRAFT_NUMBER_RE);
  const craftNumber = craftNumberMatch
    ? Number.parseInt(craftNumberMatch[1], 10)
    : null;

  const untradeable = isUntradeable(item, lines);
  const slot = parseSlot(item);
  const crateSeries = parseCrateSeries(item, lines, slot, name, marketHashName);
  const flags: string[] = [];
  if (effect || quality === 'Unusual') flags.push('unusual');
  if (paintName) flags.push('paint');
  if (spellNames.length > 0) flags.push('spelled');
  if (parseParts(lines).length > 0) flags.push('parts');
  if (gifted) flags.push('gifted');
  if (!craftable) flags.push('uncraftable');
  if (untradeable) flags.push('untradeable');
  if (parseDefindex(item) == null) flags.push('missing_defindex');
  if (crateSeries != null) flags.push('crate');

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
    effect,
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
    targetDefindex,
    outputDefindex,
    outputQuality,
    targetName,
    craftNumber: craftNumber != null && Number.isFinite(craftNumber) ? craftNumber : null,
    gifted,
    countsTowardValue: !untradeable,
    slot,
    crateSeries,
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
  const byClassOnly = new Map<string, SteamItemDescription>();
  for (const description of descriptions) {
    if (description.classid && !byClassOnly.has(description.classid)) {
      byClassOnly.set(description.classid, description);
    }
  }

  return assets.map((asset) => {
    const description =
      byClass.get(`${asset.classid}_${asset.instanceid}`) ?? byClassOnly.get(asset.classid);
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
