const STEAM64_BASE = 76561197960265728n;

export function steam64FromAccountId(accountId: string | number): string | null {
  try {
    const value = BigInt(accountId);
    if (value < 0n) return null;
    return (value + STEAM64_BASE).toString();
  } catch {
    return null;
  }
}

export function tradeSteamIdsFromHtml(html: string, pathname: string, search: string): {
  me: string | null;
  them: string | null;
} {
  const me =
    html.match(/g_steamID\s*=\s*["'](\d{17})["']/)?.[1] ??
    html.match(/"steamid"\s*:\s*"(\d{17})"/)?.[1] ??
    null;

  const themFromVar = html.match(/g_ulTradePartnerSteamID\s*=\s*['"](\d{17})['"]/)?.[1];
  const partner = new URLSearchParams(search).get('partner') ?? pathname.match(/partner=(\d+)/)?.[1];
  const them = themFromVar ?? (partner ? steam64FromAccountId(partner) : null);

  return { me, them };
}

export function assetIdFromElement(element: Element): string | null {
  const id = element.id || element.closest('[id]')?.id || '';
  return id.match(/(?:item)?440_2_(\d+)/)?.[1] ?? null;
}

export function tradeAssetIdsFromDocument(root: ParentNode): { yours: string[]; theirs: string[] } {
  const yours = [
    ...root.querySelectorAll('#your_slots .item, #trade_yours .item, .trade_item_box:first-of-type .item'),
  ]
    .map(assetIdFromElement)
    .filter((id): id is string => Boolean(id));

  const theirs = [
    ...root.querySelectorAll('#their_slots .item, #trade_them .item, .trade_item_box:last-of-type .item'),
  ]
    .map(assetIdFromElement)
    .filter((id): id is string => Boolean(id));

  return { yours: [...new Set(yours)], theirs: [...new Set(theirs)] };
}
