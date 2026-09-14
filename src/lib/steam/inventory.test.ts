import { describe, expect, it } from 'vitest';
import { steamIdFromInventoryUrl } from './inventory';

describe('steamIdFromInventoryUrl', () => {
  it('reads steamid from /profiles/ URLs', () => {
    expect(steamIdFromInventoryUrl('/profiles/76561198000000000/inventory/', '')).toBe(
      '76561198000000000',
    );
  });

  it('reads steamid from g_rgProfileData on vanity URLs', () => {
    const html = 'var g_rgProfileData = {"url":"https://steamcommunity.com/id/cat/","steamid":"76561198000000001"};';
    expect(steamIdFromInventoryUrl('/id/cat/inventory/', html)).toBe('76561198000000001');
  });
});
