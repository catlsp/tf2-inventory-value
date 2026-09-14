import type { ItemQuality } from './types';

/** Schema quality IDs used by TF2 / backpack.tf. */
export const QUALITY_BY_ID: Record<number, ItemQuality> = {
  0: 'Normal',
  1: 'Genuine',
  3: 'Vintage',
  5: 'Unusual',
  6: 'Unique',
  7: 'Community',
  8: 'Developer',
  9: 'Self-Made',
  10: 'Customized',
  11: 'Strange',
  12: 'Completed',
  13: 'Haunted',
  14: "Collector's",
  15: 'Decorated',
};

export const QUALITY_ID_BY_NAME: Record<string, number> = {
  Normal: 0,
  Genuine: 1,
  Vintage: 3,
  Unusual: 5,
  Unique: 6,
  Community: 7,
  Developer: 8,
  'Self-Made': 9,
  Customized: 10,
  Strange: 11,
  Completed: 12,
  Haunted: 13,
  "Collector's": 14,
  Decorated: 15,
};

const TAG_QUALITY: Record<string, ItemQuality> = {
  Normal: 'Normal',
  Genuine: 'Genuine',
  Vintage: 'Vintage',
  rarity4: 'Unusual',
  Unusual: 'Unusual',
  Unique: 'Unique',
  Community: 'Community',
  Developer: 'Developer',
  'Self-Made': 'Self-Made',
  Customized: 'Customized',
  Strange: 'Strange',
  Completed: 'Completed',
  Haunted: 'Haunted',
  "Collector's": "Collector's",
  Decorated: 'Decorated',
  'Decorated Weapon': 'Decorated',
};

export function qualityFromId(id: number | null | undefined): ItemQuality {
  if (id == null || Number.isNaN(id)) return 'Unknown';
  return QUALITY_BY_ID[id] ?? 'Unknown';
}

export function qualityIdFromName(name: ItemQuality): number | null {
  return QUALITY_ID_BY_NAME[name] ?? null;
}

export function qualityFromTag(internalName: string, localized?: string): ItemQuality | null {
  return (
    TAG_QUALITY[internalName] ??
    (localized ? TAG_QUALITY[localized] : undefined) ??
    null
  );
}
