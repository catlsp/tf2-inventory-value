import { t, type Locale } from './i18n';

export type ChangelogKind = 'fix' | 'new';

export type ChangelogItem = {
  kind: ChangelogKind;
  en: string;
  ru: string;
};

export type ChangelogRelease = {
  version: string;
  items: ChangelogItem[];
};

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: '0.3.2',
    items: [
      {
        kind: 'new',
        en: 'English and Russian UI. Steam pages follow Steam language; popup and this page follow the browser.',
        ru: 'Интерфейс на английском и русском. На Steam — язык Steam, в попапе и на этой странице — язык браузера.',
      },
      {
        kind: 'new',
        en: 'After an update, this What’s new page lists bugfixes and changes.',
        ru: 'После обновления эта страница «Что нового» показывает багфиксы и изменения.',
      },
      {
        kind: 'new',
        en: 'Chrome Web Store updates apply as soon as Chrome downloads them, then this page opens.',
        ru: 'Обновления из Chrome Web Store применяются сразу после загрузки, затем открывается эта страница.',
      },
      {
        kind: 'new',
        en: 'Thank-you page on first install. Bug reports: tf2vaulthelper@gmail.com',
        ru: 'Страница «Спасибо» при первой установке. Баги: tf2vaulthelper@gmail.com',
      },
    ],
  },
];

export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const delta = (left[i] ?? 0) - (right[i] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

export function changelogSince(previousVersion: string): ChangelogRelease[] {
  return CHANGELOG
    .filter((release) => compareVersions(release.version, previousVersion) > 0)
    .sort((a, b) => compareVersions(b.version, a.version));
}

export function changelogItemText(item: ChangelogItem, locale: Locale): string {
  return locale === 'ru' ? item.ru : item.en;
}

export function changelogKindLabel(kind: ChangelogKind, locale?: Locale): string {
  return t(kind === 'fix' ? 'changelog_kind_fix' : 'changelog_kind_new', undefined, locale);
}
