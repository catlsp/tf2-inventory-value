/** Halloween spell names as they appear after "Halloween:" on Steam. */
export const SPELL_BY_NAME: Record<string, number> = {
  'Voices from Below': 1004,
  'Pumpkin Bombs': 1005,
  'Halloween Fire': 1006,
  Exorcism: 1007,
  'Headless Horseshoes': 1008,
  'Team Spirit Footprints': 1009,
  'Gangreen Footprints': 1010,
  'Corpse Gray Footprints': 1011,
  'Violent Violet Footprints': 1012,
  'Rotten Orange Footprints': 1013,
  'Bruised Purple Footprints': 1014,
  'Die Job': 1015,
  'Chromatic Corruption': 1016,
  'Putrescent Pigmentation': 1017,
  'Spectral Spectrum': 1018,
  'Sinister Staining': 1019,
};

const byName = new Map(
  Object.entries(SPELL_BY_NAME).map(([name, id]) => [name.trim().toLowerCase(), id]),
);

export function spellIdFromName(name: string): number | null {
  return byName.get(name.trim().toLowerCase()) ?? null;
}
