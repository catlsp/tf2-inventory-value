/**
 * Unusual particle IDs from the TF2 schema (tf2-static-schema / items_game).
 * Unknown or ambiguous names stay id: null — never invent or guess a RED/BLU pair.
 */
import schemaEffects from './schema/effects.json';

/** Short Steam/backpack.tf labels that still resolve to a unique schema name. */
const EFFECT_ALIASES: Record<string, string> = {
  stormy: 'Stormy Storm',
  blizzardy: 'Blizzardy Storm',
  flaming: 'Flaming Lantern',
  cloudy: 'Cloudy Moon',
  cloud: 'Cloud 9',
  disco: 'Disco Beat Down',
  chiroptera: 'Chiroptera Venenata',
  poisoned: 'Poisoned Shadows',
  stare: 'Stare from Beyond',
};

const byName = new Map<string, number>();
const byId = new Map<number, string>();
const idsByName = new Map<string, Set<number>>();

export function normalizeEffectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "'")
    .replace(/\s+/g, ' ');
}

function extraNameKeys(name: string): string[] {
  const base = normalizeEffectName(name);
  if (!base) return [];
  const keys = new Set<string>([base]);
  keys.add(base.replace(/^the\s+/, ''));
  keys.add(base.replace(/[!.]+$/g, '').trim());
  keys.add(base.replace(/\s+jr\.?$/i, ' jr'));
  keys.add(base.replace(/\s+junior$/i, ' jr'));
  return [...keys].filter((key) => key.length > 1);
}

function addNameId(key: string, id: number): void {
  const ids = idsByName.get(key) ?? new Set<number>();
  ids.add(id);
  idsByName.set(key, ids);
}

for (const [id, name] of Object.entries(schemaEffects)) {
  const value = Number.parseInt(id, 10);
  if (!Number.isFinite(value) || typeof name !== 'string') continue;
  const key = normalizeEffectName(name);
  if (!key) continue;
  addNameId(key, value);
  if (!byId.has(value)) byId.set(value, name);
}
for (const [key, ids] of idsByName) {
  if (ids.size === 1) byName.set(key, [...ids][0]!);
}

for (const name of Object.values(schemaEffects)) {
  if (typeof name !== 'string') continue;
  const canonical = normalizeEffectName(name);
  const id = byName.get(canonical);
  if (id == null) continue;
  for (const key of extraNameKeys(name)) {
    if (byName.has(key) || (idsByName.get(key)?.size ?? 0) > 1) continue;
    byName.set(key, id);
  }
}
for (const [alias, canonical] of Object.entries(EFFECT_ALIASES)) {
  const id = byName.get(normalizeEffectName(canonical));
  if (id != null) byName.set(normalizeEffectName(alias), id);
}

export function effectIdFromName(name: string): number | null {
  return byName.get(normalizeEffectName(name)) ?? null;
}

export function effectNameFromId(id: number): string | null {
  return byId.get(id) ?? null;
}

export function effectIdFromParticle(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const text = String(raw).trim();
  const tagged = text.match(/^(?:particle[_-])?(\d+)$/i);
  const value = Number.parseInt(tagged?.[1] ?? text, 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
