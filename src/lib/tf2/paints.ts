/** Paint can defindexes used in SKUs. Names match Steam "Paint Color: …" lines. */
export const PAINT_BY_NAME: Record<string, number> = {
  'A Color Similar to Slate': 5052,
  'A Deep Commitment to Purple': 5031,
  'A Distinctive Lack of Hue': 5040,
  "A Mann's Mint": 5075,
  'After Eight': 5076,
  'Aged Moustache Grey': 5038,
  'An Air of Debonair': 5063,
  'An Extraordinary Abundance of Tinge': 5039,
  'Australium Gold': 5037,
  'Balaclavas Are Forever': 5062,
  'Color No. 216-190-216': 5030,
  'Cream Spirit': 5071,
  'Dark Salmon Injustice': 5056,
  'Drably Olive': 5053,
  'Indubitably Green': 5051,
  "Mann Co. Orange": 5032,
  Muskelmannbraun: 5033,
  "Noble Hatter's Violet": 5029,
  "Operator's Overalls": 5065,
  'Peculiarly Drab Tincture': 5034,
  'Pink as Hell': 5054,
  'Radigan Conagher Brown': 5027,
  'Team Spirit': 5046,
  'The Bitter Taste of Defeat and Lime': 5055,
  "The Color of a Gentlemann's Business Pants": 5036,
  'The Value of Teamwork': 5064,
  'Waterlogged Lab Coat': 5061,
  'Ye Olde Rustic Colour': 5026,
  "Zepheniah's Greed": 5028,
};

const NORMALIZED = new Map(
  Object.entries(PAINT_BY_NAME).map(([name, id]) => [normalizePaintName(name), id]),
);

export function normalizePaintName(name: string): string {
  return name.trim().toLowerCase().replace(/['’]/g, "'");
}

export function paintDefindexFromName(name: string): number | null {
  return NORMALIZED.get(normalizePaintName(name)) ?? PAINT_BY_NAME[name] ?? null;
}
