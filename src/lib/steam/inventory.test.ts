import { describe, expect, it } from 'vitest';
import { InventoryMemo, steamIdFromInventoryUrl } from './inventory';

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

describe('InventoryMemo', () => {
  it('reuses a fresh inventory instead of hitting Steam again', async () => {
    const memo = new InventoryMemo(60_000);
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return [];
    };
    await memo.get('76561198000000000', false, loader);
    await memo.get('76561198000000000', false, loader);
    expect(calls).toBe(1);
  });

  it('refetches when force is set', async () => {
    const memo = new InventoryMemo(60_000);
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return [];
    };
    await memo.get('76561198000000000', false, loader);
    await memo.get('76561198000000000', true, loader);
    expect(calls).toBe(2);
  });

  it('returns a cached backpack from peek', async () => {
    const memo = new InventoryMemo(60_000);
    await memo.get('76561198000000000', false, async () => []);
    expect(memo.peek('76561198000000000')).toEqual([]);
    expect(memo.peek('76561198000000001')).toBeNull();
  });
});
