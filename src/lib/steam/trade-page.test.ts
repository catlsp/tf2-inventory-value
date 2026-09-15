import { describe, expect, it } from 'vitest';
import { assetIdFromElement, steam64FromAccountId, tradeSteamIdsFromHtml } from './trade-page';

describe('trade page parsing', () => {
  it('converts a partner account id to steam64', () => {
    expect(steam64FromAccountId(1)).toBe('76561197960265729');
  });

  it('reads steamids from trade page scripts', () => {
    const html = `
      var g_steamID = "76561198000000000";
      var g_ulTradePartnerSteamID = '76561198000000001';
    `;
    expect(tradeSteamIdsFromHtml(html, '/tradeoffer/new/', '')).toEqual({
      me: '76561198000000000',
      them: '76561198000000001',
    });
  });

  it('parses asset ids from Steam item element ids', () => {
    const item = { id: 'item440_2_998877' } as unknown as Element;
    expect(assetIdFromElement(item)).toBe('998877');
  });
});
