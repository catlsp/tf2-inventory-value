import { describe, expect, it } from 'vitest';
import { interpolate, t } from './i18n';

describe('i18n', () => {
  it('returns English and Russian for the same key', () => {
    expect(t('thanks_title', undefined, 'en')).toBe('Thanks for installing');
    expect(t('thanks_title', undefined, 'ru')).toBe('Спасибо за установку');
  });

  it('fills placeholders', () => {
    expect(interpolate('Version: $version$', { version: '0.3.2' })).toBe('Version: 0.3.2');
    expect(t('popup_status_ready', { keyRef: '54.11' }, 'en')).toContain('54.11');
  });
});
