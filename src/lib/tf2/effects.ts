/**
 * Unusual particle IDs aligned with backpack.tf priceindex.
 * Unknown names still stay on the passport with id: null.
 */
export const EFFECT_BY_NAME: Record<string, number> = {
  'Community Sparkle': 4,
  'Holy Glow': 5,
  'Green Confetti': 6,
  'Purple Confetti': 7,
  'Haunted Ghosts': 8,
  'Green Energy': 9,
  'Purple Energy': 10,
  'Circling TF Logo': 11,
  'Massed Flies': 12,
  'Burning Flames': 13,
  'Scorching Flames': 14,
  'Searing Plasma': 15,
  'Vivid Plasma': 16,
  Sunbeams: 17,
  'Circling Peace Sign': 18,
  'Circling Heart': 19,
  'Map Stamps': 20,
  'Genteel Smoke': 28,
  Stormy: 29,
  Blizzardy: 30,
  "Nuts n' Bolts": 31,
  'Orbiting Planets': 32,
  'Orbiting Fire': 33,
  Bubbling: 34,
  Smoking: 35,
  Steaming: 36,
  Flaming: 37,
  Cloudy: 38,
  'Kill-a-Watt': 56,
  'Terror-Watt': 57,
  Cloud: 58,
  'Time Warp': 69,
  'Green Black Hole': 70,
  Roboactive: 72,
  'Anti-Freeze': 73,
  Electrostatic: 74,
  'Memory Leak': 75,
  Phosphorous: 76,
  Sulphurous: 77,
  'Death at Dusk': 78,
  'Miami Nights': 99,
  Disco: 100,
  'Starstorm Insomnia': 104,
  'Starstorm Slumber': 105,
  'Harvest Moon': 108,
  "It's a Secret to Everybody": 109,
  "It's a Mystery to Everyone": 111,
  'Cauldron Bubbles': 112,
  'Misty Skull': 88,
  'Open Mind': 141,
  'Dead Presidents': 142,
  'Head of Steam': 143,
  Spellbound: 172,
  Chiroptera: 174,
  Poisoned: 175,
  'Something Burning This Way Comes': 176,
  Hellfire: 178,
  Darkblaze: 179,
  Demonflame: 180,
  Amaranthine: 208,
  Stare: 209,
  Stardust: 250,
};

const byName = new Map<string, number>();
for (const [name, id] of Object.entries(EFFECT_BY_NAME)) {
  byName.set(normalizeEffectName(name), id);
}

export function normalizeEffectName(name: string): string {
  return name.trim().toLowerCase().replace(/['’]/g, "'").replace(/\s+/g, ' ');
}

export function effectIdFromName(name: string): number | null {
  return byName.get(normalizeEffectName(name)) ?? null;
}
