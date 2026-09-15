import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseSteamDescription } from '../../src/lib/tf2/parse-steam-item';
import { economyDefindex } from '../../src/lib/tf2/economy';
import { skuCandidates } from '../../src/lib/tf2/sku-candidates';
import { toSku } from '../../src/lib/tf2/sku';
import { quoteItem, sumQuotes } from '../../src/lib/prices/lookup';
import { formatKeysRef } from '../../src/lib/prices/format';
import {
  buildSkuIndex,
  keyRefFromSkuIndex,
  metalOf,
  pickSkuForName,
  upsertPrices,
} from '../../src/lib/prices/parse-pricedb';
import type { SteamItemDescription } from '../../src/lib/tf2/types';
import { repoRoot } from './checks';
import type { ValidationIssue, ValidationReport } from './types';

function issue(
  issues: ValidationIssue[],
  severity: ValidationIssue['severity'],
  field: string,
  message: string,
  extra?: { fixture?: string; actual?: unknown },
): void {
  issues.push({
    severity,
    field,
    message,
    fixture: extra?.fixture,
    actual: extra?.actual === undefined ? undefined : stringify(extra.actual),
  });
}

function stringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function lineValues(item: SteamItemDescription): string[] {
  return [...(item.descriptions ?? []), ...(item.owner_descriptions ?? [])]
    .map((line) => line.value ?? '')
    .filter(Boolean);
}

function knownIndex() {
  return buildSkuIndex({
    success: true,
    items: [
      {
        sku: '5021;6',
        name: 'Mann Co. Supply Crate Key',
        buy: { keys: 0, metal: 50 },
        sell: { keys: 0, metal: 50 },
        time: Math.floor(Date.now() / 1000),
      },
      {
        sku: '378;6',
        name: 'Team Captain',
        buy: { keys: 1, metal: 20 },
        sell: { keys: 2, metal: 0 },
        time: Math.floor(Date.now() / 1000),
      },
      {
        sku: '378;5;u13',
        name: 'Burning Flames Team Captain',
        buy: { keys: 40, metal: 0 },
        sell: { keys: 50, metal: 0 },
        time: Math.floor(Date.now() / 1000),
      },
      {
        sku: '125;6',
        name: "Bill's Hat",
        buy: { keys: 10, metal: 0 },
        sell: { keys: 10, metal: 0 },
        time: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

export async function validateTf2Pipeline(): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const fixtureDir = path.join(repoRoot(), 'src', 'fixtures', 'items');
  const files = (await readdir(fixtureDir)).filter((name) => name.endsWith('.json')).sort();
  const index = knownIndex();
  const keyRef = keyRefFromSkuIndex(index);
  const quotes = [];

  if (keyRef == null) {
    issue(issues, 'error', 'keyRef', 'Key rate missing from the test index; not inventing a key/ref rate.');
  }

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(fixtureDir, file), 'utf8')) as SteamItemDescription;
    const passport = parseSteamDescription(raw);
    const lines = lineValues(raw);

    const rawDef = raw.app_data?.def_index ?? raw.app_data?.defindex;
    if (rawDef != null && rawDef !== '') {
      const expected = economyDefindex(Number.parseInt(rawDef, 10));
      if (Number.isFinite(expected) && passport.defindex !== expected) {
        issue(issues, 'error', 'defindex', 'Parser defindex does not match economy defindex from app_data.', {
          fixture: file,
          actual: { expected, got: passport.defindex },
        });
      }
    } else if (passport.defindex == null) {
      issue(issues, 'warning', 'defindex', 'defindex is missing; SKU will stay null. Not inventing a defindex.', {
        fixture: file,
      });
    }

    if (passport.qualityId == null || passport.quality === 'Unknown') {
      issue(issues, 'warning', 'quality', 'quality/qualityId incomplete. Not inventing a quality.', {
        fixture: file,
        actual: { quality: passport.quality, qualityId: passport.qualityId },
      });
    }

    const effectLine = lines.find((line) => /unusual effect:/i.test(line));
    if (effectLine) {
      if (!passport.effect) {
        issue(issues, 'error', 'effect', 'Unusual effect line present but parser dropped it.', { fixture: file });
      } else if (passport.effect.id == null) {
        issue(issues, 'warning', 'effect.id', `Effect "${passport.effect.name}" has no id in the local map. Leaving null.`, {
          fixture: file,
        });
      }
    }

    const paintLine = lines.find((line) => /^paint(?:ed)? color:/i.test(line));
    if (paintLine) {
      if (!passport.paint) {
        issue(issues, 'error', 'paint', 'Paint line present but parser dropped it.', { fixture: file });
      } else if (passport.paint.defindex == null) {
        issue(issues, 'warning', 'paint.defindex', `Paint "${passport.paint.name}" has no defindex. Leaving null.`, {
          fixture: file,
        });
      }
    }

    for (const spell of passport.spells) {
      if (spell.id == null) {
        issue(issues, 'warning', 'spell.id', `Spell "${spell.name}" has no id. Leaving null.`, { fixture: file });
      }
    }

    const sku = toSku(passport);
    if (passport.defindex == null || passport.qualityId == null) {
      if (sku != null) {
        issue(issues, 'error', 'sku', 'SKU was built without defindex/quality. That invents identity.', {
          fixture: file,
          actual: sku,
        });
      }
    } else if (sku && !sku.startsWith(`${passport.defindex};${passport.qualityId}`)) {
      issue(issues, 'error', 'sku', 'SKU does not start with defindex;quality.', { fixture: file, actual: sku });
    }

    const candidates = skuCandidates(passport);
    const unusualMissingEffect =
      (passport.quality === 'Unusual' || passport.qualityId === 5) && passport.effect?.id == null;
    if (unusualMissingEffect) {
      if (candidates.length > 0) {
        issue(issues, 'error', 'skuCandidates', 'Unusual without effect id must not produce SKU candidates.', {
          fixture: file,
          actual: candidates,
        });
      }
    } else if (passport.defindex != null && passport.qualityId != null && candidates.length === 0) {
      issue(issues, 'error', 'skuCandidates', 'Expected SKU candidates but got none.', { fixture: file });
    }

    const untradeableText = lines.some((line) => /not tradable(?:\s+or\s+marketable)?/i.test(line));
    if ((raw.tradable === 0 || untradeableText) && passport.countsTowardValue) {
      issue(issues, 'error', 'countsTowardValue', 'Untradeable item is still counted toward value.', { fixture: file });
    }

    if (keyRef != null) {
      const quote = quoteItem(passport, index, keyRef);
      quotes.push(quote);

      if (!passport.countsTowardValue) {
        if (!quote.flags.includes('skipped') || quote.midKeys != null || quote.midRef != null) {
          issue(issues, 'error', 'quote.skipped', 'Untradeable item must stay skipped with null mids, not 0.', {
            fixture: file,
            actual: quote,
          });
        }
      } else if (quote.flags.includes('unpriced')) {
        if (quote.midKeys != null || quote.midRef != null) {
          issue(issues, 'error', 'quote.unpriced', 'Unpriced quote invented a numeric mid.', {
            fixture: file,
            actual: quote,
          });
        }
      } else {
        if (!isFiniteNumber(quote.midKeys) || !isFiniteNumber(quote.midRef)) {
          issue(issues, 'error', 'quote.mid', 'Priced quote has non-finite midKeys/midRef.', {
            fixture: file,
            actual: quote,
          });
        }
      }
    }
  }

  const emptyIndex = buildSkuIndex({ items: [] });
  if (Object.keys(emptyIndex).length !== 0) {
    issue(issues, 'error', 'buildSkuIndex', 'Empty payload produced prices. That invents data.');
  }

  const incomplete = upsertPrices({ sku: '999;6', name: 'Incomplete' });
  const incompleteRow = incomplete['999;6'];
  if (
    incompleteRow &&
    incompleteRow.buy.keys === 0 &&
    incompleteRow.buy.metal === 0 &&
    incompleteRow.sell.keys === 0 &&
    incompleteRow.sell.metal === 0
  ) {
    issue(
      issues,
      'info',
      'buy/sell',
      'SKU 999;6 has no buy/sell payload; zeros mean missing data, not a real 0 ref listing.',
    );
  }

  if (formatKeysRef(null, null) !== '—') {
    issue(issues, 'error', 'formatKeysRef', 'Null quote must format as —, not a made-up number.', {
      actual: formatKeysRef(null, null),
    });
  }

  const metal = metalOf({ keys: 1, metal: 20 }, 50);
  if (metal !== 70) {
    issue(issues, 'error', 'metalOf', '1 key + 20 ref at 50 ref/key must be 70.', { actual: metal });
  }

  const picked = pickSkuForName([], { killstreak: 0, australium: false });
  if (picked != null) {
    issue(issues, 'error', 'pickSkuForName', 'Empty SKU list must return null, not an invented SKU.', { actual: picked });
  }

  if (keyRef != null) {
    const totals = sumQuotes(quotes);
    if (!isFiniteNumber(totals.keys) || totals.priced + totals.unpriced + totals.skipped !== quotes.length) {
      issue(issues, 'error', 'sumQuotes', 'Totals are inconsistent with quote flags.', { actual: totals });
    }
  }

  const errors = issues.filter((entry) => entry.severity === 'error');
  const warnings = issues.filter((entry) => entry.severity === 'warning');
  const summary = [
    `fixtures=${files.length}`,
    `errors=${errors.length}`,
    `warnings=${warnings.length}`,
    ...issues.slice(0, 40).map((entry) => {
      const where = entry.fixture ? `${entry.fixture} ` : '';
      return `- [${entry.severity}] ${where}${entry.field}: ${entry.message}${entry.actual ? ` (${entry.actual})` : ''}`;
    }),
    issues.length > 40 ? `… ${issues.length - 40} more` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    ok: errors.length === 0,
    fixtures: files.length,
    issues,
    summary,
  };
}
