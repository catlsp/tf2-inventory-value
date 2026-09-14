import type { KillstreakTier } from './types';

export const SHEENS = [
  'Team Shine',
  'Deadly Daffodil',
  'Manndarin',
  'Mean Green',
  'Agonizing Emerald',
  'Villainous Violet',
  'Hot Rod',
] as const;

export const KILLSTREAKERS = [
  'Fire Horns',
  'Cerebral Discharge',
  'Tornado',
  'Flames',
  'Singularity',
  'Incinerator',
  'Hypno-Beam',
] as const;

export function killstreakFromName(marketHashName: string): KillstreakTier {
  const n = marketHashName.toLowerCase();
  if (n.includes('professional killstreak')) return 3;
  if (n.includes('specialized killstreak')) return 2;
  if (/(^| )killstreak /.test(n) || n.startsWith('killstreak ')) return 1;
  return 0;
}
