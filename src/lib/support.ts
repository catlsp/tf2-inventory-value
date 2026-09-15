import { t, type Locale } from './i18n';

export const SUPPORT_EMAIL = 'tf2vaulthelper@gmail.com';
export const GITHUB_REPO = 'https://github.com/catlsp/tf2-inventory-value';
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues/new`;

export const THANKS_PAGE = '/thanks.html' as const;
export const WHATSNEW_PAGE = '/whatsnew.html' as const;

export function thanksPagePath(): typeof THANKS_PAGE {
  return THANKS_PAGE;
}

export function whatsNewPagePath(): typeof WHATSNEW_PAGE {
  return WHATSNEW_PAGE;
}

export function bugReportMailto(version: string, locale?: Locale): string {
  const subject = t('mail_subject', undefined, locale);
  const body = [
    t('mail_version', { version }, locale),
    '',
    t('mail_what', undefined, locale),
    '',
    t('mail_where', undefined, locale),
    '',
  ].join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
