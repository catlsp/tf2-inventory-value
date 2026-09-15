/** Craft conversion rates used as face value — not PriceDB bot buy/sell. */
export const SCRAP_DEFINDEX = 5000;
export const RECLAIMED_DEFINDEX = 5001;
export const REFINED_DEFINDEX = 5002;
export const KEY_DEFINDEX = 5021;
export const TOUR_TICKET_DEFINDEX = 725;

export const WEAPON_REF = 0.05;
export const SCRAP_REF = 0.11;
export const RECLAIMED_REF = 0.33;
export const REFINED_REF = 1;

export const CURRENCY_REF: Record<number, number> = {
  [SCRAP_DEFINDEX]: SCRAP_REF,
  [RECLAIMED_DEFINDEX]: RECLAIMED_REF,
  [REFINED_DEFINDEX]: REFINED_REF,
};

/** Stock weapon defindex → economy / "The" defindex used by PriceDB. */
export const STOCK_TO_ECON: Record<number, number> = {
  0: 190,
  1: 191,
  2: 192,
  3: 193,
  4: 194,
  5: 195,
  6: 196,
  7: 197,
  8: 198,
  9: 199,
  10: 199,
  11: 199,
  12: 199,
  13: 200,
  14: 201,
  15: 202,
  16: 203,
  17: 204,
  18: 205,
  19: 206,
  20: 207,
  21: 208,
  22: 209,
  23: 209,
  24: 210,
  25: 737,
  29: 211,
  30: 212,
};

const ECON_WEAPON_DEFINDEXES = new Set(Object.values(STOCK_TO_ECON));
const WEAPON_SLOTS = new Set(['primary', 'secondary', 'melee', 'pda', 'pda2']);

/** Official stock / economy weapon names → PriceDB defindex (STOCK_TO_ECON values only). */
const STOCK_WEAPON_NAME_TO_DEFINDEX: Record<string, number> = {
  bat: 190,
  bottle: 191,
  'fire axe': 192,
  kukri: 193,
  knife: 194,
  fists: 195,
  shovel: 196,
  wrench: 197,
  bonesaw: 198,
  shotgun: 199,
  scattergun: 200,
  'sniper rifle': 201,
  minigun: 202,
  smg: 203,
  'syringe gun': 204,
  'rocket launcher': 205,
  'grenade launcher': 206,
  'stickybomb launcher': 207,
  'flame thrower': 208,
  flamethrower: 208,
  pistol: 209,
  revolver: 210,
  'construction pda': 737,
  'medi gun': 211,
  medigun: 211,
  'invis watch': 212,
};

export function economyDefindex(defindex: number): number {
  return STOCK_TO_ECON[defindex] ?? defindex;
}

export function stockWeaponDefindexFromName(name: string): number | null {
  const key = name.trim().toLowerCase().replace(/^the\s+/, '');
  return STOCK_WEAPON_NAME_TO_DEFINDEX[key] ?? null;
}

export function isCurrencyDefindex(defindex: number | null): boolean {
  return defindex != null && defindex in CURRENCY_REF;
}

export function isMannCoKey(item: { defindex: number | null; qualityId: number | null; craftable: boolean }): boolean {
  return item.defindex === KEY_DEFINDEX && item.qualityId === 6 && item.craftable;
}

const SPECIAL_WEAPON_RE = /\b(festive|botkiller|saxxy|golden frying pan|gold frying pan)\b/i;

export function isPlainCraftWeapon(item: {
  defindex: number | null;
  quality: string;
  qualityId: number | null;
  craftable: boolean;
  australium: boolean;
  festivized: boolean;
  killstreak: number;
  effect: { id: number | null } | null;
  slot: string | null;
  name: string;
  marketHashName: string;
}): boolean {
  if (item.quality !== 'Unique' || item.qualityId !== 6) return false;
  if (!item.craftable) return false;
  if (item.australium || item.festivized || item.killstreak || item.effect) return false;
  if (isCurrencyDefindex(item.defindex) || item.defindex === KEY_DEFINDEX) return false;
  if (item.defindex === TOUR_TICKET_DEFINDEX) return false;
  const label = `${item.name} ${item.marketHashName}`;
  if (SPECIAL_WEAPON_RE.test(label) && !/\bfestivized\b/i.test(label)) return false;

  const slot = item.slot?.replace(/\s+/g, '_');
  if (slot && WEAPON_SLOTS.has(slot)) return true;
  if (item.defindex != null && (item.defindex in STOCK_TO_ECON || ECON_WEAPON_DEFINDEXES.has(item.defindex))) {
    return true;
  }
  return false;
}
