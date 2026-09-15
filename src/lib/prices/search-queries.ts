import type { ItemPassport } from '../tf2/types';

export function searchQueriesForItem(item: ItemPassport): string[] {
  const queries: string[] = [];
  const add = (value: string | null | undefined) => {
    const text = value?.trim();
    if (text) queries.push(text);
  };
  add(item.marketHashName);
  add(item.name);
  if (item.effect?.name) {
    const baseName =
      item.name.replace(/^unusual\s+/i, '').trim()
      || item.marketHashName.replace(/^unusual\s+/i, '').trim();
    add(`Unusual ${baseName}`);
    add(`${item.effect.name} ${baseName}`);
    add(item.effect.name);
  }
  if (item.targetName) {
    const tier =
      item.killstreak === 3
        ? 'Professional Killstreak'
        : item.killstreak === 2
          ? 'Specialized Killstreak'
          : 'Killstreak';
    const fabricator =
      item.outputDefindex != null
      || /kit fabricator/i.test(item.marketHashName)
      || /kit fabricator/i.test(item.name);
    add(
      fabricator
        ? `${tier} ${item.targetName} Kit Fabricator`
        : `${tier} ${item.targetName} Kit`,
    );
  }
  return [...new Set(queries)];
}
