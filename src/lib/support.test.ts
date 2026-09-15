import { describe, expect, it } from 'vitest';
import { SUPPORT_EMAIL, bugReportMailto } from './support';

describe('bug report mail', () => {
  it('opens a mailto to the support inbox with the extension version', () => {
    const href = bugReportMailto('0.3.2', 'en');
    expect(SUPPORT_EMAIL).toBe('tf2vaulthelper@gmail.com');
    expect(href.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
    expect(href).toContain(encodeURIComponent('0.3.2'));
    expect(href).toContain(encodeURIComponent('bug or issue'));
  });

  it('uses Russian copy when the locale is ru', () => {
    const href = bugReportMailto('0.3.2', 'ru');
    expect(href).toContain(encodeURIComponent('баг или недочёт'));
  });
});
