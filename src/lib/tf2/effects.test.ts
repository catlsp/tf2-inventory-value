import { describe, expect, it } from 'vitest';
import { effectIdFromName, effectIdFromParticle } from './effects';

describe('effectIdFromName', () => {
  it('uses schema particle ids, not the old guessed map', () => {
    expect(effectIdFromName('Burning Flames')).toBe(13);
    expect(effectIdFromName('Anti-Freeze')).toBe(69);
    expect(effectIdFromName('Time Warp')).toBe(70);
    expect(effectIdFromName('Harvest Moon')).toBe(45);
    expect(effectIdFromName("It's a Secret to Everybody")).toBe(46);
    expect(effectIdFromName('Spellbound')).toBe(74);
    expect(effectIdFromName('Stormy Storm')).toBe(29);
    expect(effectIdFromName('Cloud 9')).toBe(58);
  });

  it('accepts short aliases that still map to schema ids', () => {
    expect(effectIdFromName('Stormy')).toBe(29);
    expect(effectIdFromName('Cloud')).toBe(58);
    expect(effectIdFromName('The Ooze')).toBe(effectIdFromName('Ooze'));
    expect(effectIdFromName('Showstopper')).toBeNull();
  });

  it('does not invent an id for an unknown effect', () => {
    expect(effectIdFromName('Completely Fake Effect')).toBeNull();
  });
});

describe('effectIdFromParticle', () => {
  it('reads Steam particle tags without guessing RED/BLU pairs', () => {
    expect(effectIdFromParticle('particle_3001')).toBe(3001);
    expect(effectIdFromParticle('3002')).toBe(3002);
    expect(effectIdFromParticle('Showstopper')).toBeNull();
  });
});
