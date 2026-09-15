import { describe, expect, it } from 'vitest';
import { CHANGELOG, changelogSince, compareVersions } from './changelog';

describe('changelog', () => {
  it('orders semver', () => {
    expect(compareVersions('0.3.2', '0.3.1')).toBeGreaterThan(0);
    expect(compareVersions('0.3.1', '0.3.1')).toBe(0);
    expect(compareVersions('0.3.0', '0.3.1')).toBeLessThan(0);
  });

  it('returns notes newer than the previous version', () => {
    const next = CHANGELOG[0]?.version ?? '0.3.2';
    expect(changelogSince('0.0.0').some((release) => release.version === next)).toBe(true);
    expect(changelogSince(next)).toEqual([]);
  });
});
