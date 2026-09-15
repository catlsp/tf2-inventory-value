export type Locale = 'en' | 'ru';

const en = {
  ext_name: 'TF2 Inventory Value',

  mail_subject: 'TF2 Inventory Value — bug or issue',
  mail_version: 'Version: $version$',
  mail_what: 'What happened:',
  mail_where: 'Where you looked (inventory / trade offer, link if you can):',

  popup_status_loading: 'Loading the price list…',
  popup_status_ready: 'Prices ready · key ≈ $keyRef$ ref',
  popup_status_open: 'Open a TF2 inventory on Steam — prices load on the page.',
  popup_step1: 'Open a Team Fortress 2 inventory on steamcommunity.com',
  popup_step2: 'Items get keys/ref badges; the backpack total is at the top',
  popup_step3: 'On a trade offer you can see who is giving more',
  popup_report_bug: 'Report a bug',
  popup_github: 'GitHub',
  popup_howto: 'How to use',
  popup_whatsnew: "What's new",
  popup_disclaimer:
    'Unofficial tool, not affiliated with Valve, Steam, or backpack.tf. No Steam password needed. Paint and Halloween spells are flagged, not added as a can price.',

  options_document_title: 'TF2 Inventory Value — settings',
  options_pricedb_before: 'Prices load automatically from ',
  options_pricedb_after: '. No backpack.tf API key needed.',
  options_open: 'Open a TF2 inventory or trade offer on Steam — values appear on the page.',
  options_bug_before: 'Found a bug or a weird price: ',
  options_disclaimer:
    'Not affiliated with Valve / Steam / backpack.tf. Inventory data stays in your browser except for the public price list.',

  thanks_document_title: 'Thanks — TF2 Inventory Value',
  thanks_title: 'Thanks for installing',
  thanks_lead:
    'The extension puts keys/ref on Team Fortress 2 inventories and trade offers. No Steam password or API key.',
  thanks_step1: 'Open a TF2 inventory on steamcommunity.com',
  thanks_step2: 'A backpack total appears at the top; items show prices',
  thanks_step3: 'On a trade offer you can see who is giving more',
  thanks_unusual_note:
    'Unusuals are priced by effect. Paint, spells, and strange parts are flagged, but not added like a paint can unless they have their own quote.',
  thanks_write_bug: 'Write about a bug or issue',
  thanks_github_issue: 'GitHub issue',
  thanks_mail_label: 'Email:',
  thanks_version: 'version $version$',
  thanks_disclaimer_before:
    'Unofficial tool, not affiliated with Valve, Steam, or backpack.tf. Source: ',
  thanks_disclaimer_after: '. Mail is sent from your own inbox; the extension does not send it.',

  whatsnew_document_title: "What's new — TF2 Inventory Value",
  whatsnew_title: "What's new",
  whatsnew_intro: 'Version $version$ is installed.',
  whatsnew_since: 'Changes since $from$:',
  whatsnew_continue: 'Continue',
  whatsnew_empty: 'No release notes for this update.',
  changelog_kind_fix: 'Bugfix',
  changelog_kind_new: 'New',

  banner_loading: 'Loading…',
  sort_label: 'Sort',
  refresh: 'Refresh',
  status_updating: 'Refreshing…',
  status_counting: 'Pricing the inventory…',
  status_no_steamid: 'Could not determine the profile SteamID',
  status_counting_items: 'Pricing… $count$ items',
  status_unusual_search: 'Fetching unusuals and recipes… $count$',
  status_unpriced: '$count$ unpriced',
  status_skipped: '$count$ not tradable',
  sort_steam: 'Steam order',
  sort_price_desc: 'by price',
  sort_unusual: 'unusual',
  sort_spells: 'spells',
  sort_paint: 'paint',
  sort_parts: 'strange parts',
  sort_killstreak: 'killstreak',

  trade_counting: 'Pricing the trade…',
  trade_empty: 'Put TF2 items in the trade window — we will show keys/ref and the difference.',
  trade_no_steamid: 'Could not determine your SteamID. Refresh the trade page.',
  trade_not_tf2: 'Items in the trade are not TF2, or the inventory is still loading.',
  trade_yours: 'You give:',
  trade_theirs: 'You receive:',
  trade_incomplete: 'Not counting profit: $count$ item(s) without a quote.',
  trade_incomplete_status: 'Some items have no quote — this is not a green “profit”.',
  trade_buy_note: 'Buy-side estimate (selling to backpack.tf bots). Paint and spells are not marked up.',

  overlay_no_effect: 'No quote for this effect',
  overlay_unusual_effect: 'unusual by effect',
  overlay_spread: 'buy $buy$ / sell $sell$',
  overlay_base_no_markup: 'market base, no markup for: $extras$',
  flag_paint: 'paint',
  flag_spelled: 'spells',
  flag_parts: 'strange parts',
  flag_unusual: 'unusual',
  flag_stale: 'stale',
  flag_no_comps: 'no listings',
  flag_unpriced: 'unpriced',
  flag_skipped: 'skipped',

  err_steam_429: 'Steam temporarily rate-limited requests (429). Wait a few seconds and open the inventory again.',
  err_inventory_hidden: 'Inventory is hidden or unavailable',
  err_key_rate: 'Could not load the key price',
  err_steam_http: 'Steam inventory HTTP $status$',
} as const;

export type MessageKey = keyof typeof en;

const ru: Record<MessageKey, string> = {
  ext_name: 'TF2 Inventory Value',

  mail_subject: 'TF2 Inventory Value — баг или недочёт',
  mail_version: 'Версия: $version$',
  mail_what: 'Что случилось:',
  mail_where: 'Где смотрели (инвентарь / обмен, ссылка если можно):',

  popup_status_loading: 'Загружаю прайслист…',
  popup_status_ready: 'Цены готовы · ключ ≈ $keyRef$ ref',
  popup_status_open: 'Откройте инвентарь TF2 на Steam — цены подтянутся сами.',
  popup_step1: 'Откройте инвентарь Team Fortress 2 на steamcommunity.com',
  popup_step2: 'На предметах появятся keys/ref, сверху — сумма рюкзака',
  popup_step3: 'В окне обмена видно, кто отдаёт дороже',
  popup_report_bug: 'Написать о баге',
  popup_github: 'GitHub',
  popup_howto: 'Как пользоваться',
  popup_whatsnew: 'Что нового',
  popup_disclaimer:
    'Неофициальный инструмент, не связан с Valve, Steam и backpack.tf. Пароль Steam не нужен. Краска и Halloween spells помечаются, но не прибавляются «как банка».',

  options_document_title: 'TF2 Inventory Value — настройки',
  options_pricedb_before: 'Цены подгружаются автоматически с ',
  options_pricedb_after: '. Ключ backpack.tf вводить не нужно.',
  options_open: 'Откройте инвентарь TF2 или окно обмена на Steam — оценка появится на странице.',
  options_bug_before: 'Нашли баг или странную цену: ',
  options_disclaimer:
    'Не связано с Valve / Steam / backpack.tf. Данные инвентаря никуда, кроме вашего браузера и публичного прайслиста, не отправляются.',

  thanks_document_title: 'Спасибо — TF2 Inventory Value',
  thanks_title: 'Спасибо за установку',
  thanks_lead:
    'Расширение ставит keys/ref на инвентарь Team Fortress 2 и в окно обмена. Пароль Steam и ключ API не нужны.',
  thanks_step1: 'Откройте инвентарь TF2 на steamcommunity.com',
  thanks_step2: 'Сверху появится сумма рюкзака, на предметах — цены',
  thanks_step3: 'В трейд-оффере видно, кто отдаёт дороже',
  thanks_unusual_note:
    'Unusual считается по эффекту. Краска, спеллы и strange parts помечаются, но к цене не прибавляются «как банка», если нет своей котировки.',
  thanks_write_bug: 'Написать о баге или недочёте',
  thanks_github_issue: 'Issue на GitHub',
  thanks_mail_label: 'Почта:',
  thanks_version: 'версия $version$',
  thanks_disclaimer_before:
    'Неофициальный инструмент, не связан с Valve, Steam и backpack.tf. Исходники: ',
  thanks_disclaimer_after: '. Письмо уходит с вашей почты, расширение его само не отправляет.',

  whatsnew_document_title: 'Что нового — TF2 Inventory Value',
  whatsnew_title: 'Что нового',
  whatsnew_intro: 'Установлена версия $version$.',
  whatsnew_since: 'Изменения с $from$:',
  whatsnew_continue: 'Продолжить',
  whatsnew_empty: 'Для этого обновления нет списка изменений.',
  changelog_kind_fix: 'Багфикс',
  changelog_kind_new: 'Новое',

  banner_loading: 'Загрузка…',
  sort_label: 'Сортировка',
  refresh: 'Обновить',
  status_updating: 'Обновляю…',
  status_counting: 'Считаю инвентарь…',
  status_no_steamid: 'Не удалось определить SteamID профиля',
  status_counting_items: 'Считаю… $count$ предметов',
  status_unusual_search: 'Добираю unusual и рецепты… $count$',
  status_unpriced: '$count$ без цены',
  status_skipped: '$count$ не в торговле',
  sort_steam: 'как в Steam',
  sort_price_desc: 'по цене',
  sort_unusual: 'unusual',
  sort_spells: 'спеллы',
  sort_paint: 'краска',
  sort_parts: 'strange parts',
  sort_killstreak: 'killstreak',

  trade_counting: 'Считаю обмен…',
  trade_empty: 'Положите предметы TF2 в окно обмена — покажем keys/ref и разницу.',
  trade_no_steamid: 'Не удалось определить ваш SteamID. Обновите страницу обмена.',
  trade_not_tf2: 'Предметы в обмене не из TF2 или инвентарь ещё грузится.',
  trade_yours: 'Отдаёте:',
  trade_theirs: 'Получаете:',
  trade_incomplete: 'Профит не считаем: $count$ предмет(ов) без цены.',
  trade_incomplete_status: 'Часть предметов без котировки — не зелёный «профит».',
  trade_buy_note: 'Оценка по buy (продажа ботам backpack.tf). Краска и спеллы не накручены.',

  overlay_no_effect: 'Нет котировки по этому эффекту',
  overlay_unusual_effect: 'unusual по эффекту',
  overlay_spread: 'buy $buy$ / sell $sell$',
  overlay_base_no_markup: 'база рынка, без наценки за: $extras$',
  flag_paint: 'краска',
  flag_spelled: 'спеллы',
  flag_parts: 'strange parts',
  flag_unusual: 'unusual',
  flag_stale: 'устарело',
  flag_no_comps: 'нет листингов',
  flag_unpriced: 'без цены',
  flag_skipped: 'пропущено',

  err_steam_429: 'Steam временно ограничил запросы (429). Подождите пару секунд и откройте инвентарь снова.',
  err_inventory_hidden: 'Инвентарь скрыт или недоступен',
  err_key_rate: 'Не удалось получить курс ключа',
  err_steam_http: 'Steam inventory HTTP $status$',
};

const tables: Record<Locale, Record<MessageKey, string>> = { en, ru };

export type MessageVars = Record<string, string | number>;

function steamLocale(): Locale | null {
  if (typeof document === 'undefined' || typeof location === 'undefined') return null;
  if (!location.hostname.includes('steamcommunity.com')) return null;
  const param = new URLSearchParams(location.search).get('l')?.toLowerCase();
  if (param === 'russian') return 'ru';
  if (param === 'english') return 'en';
  const cookie = typeof document.cookie === 'string'
    ? document.cookie.match(/(?:^|;\s*)Steam_Language=([^;]+)/)?.[1]
    : undefined;
  if (cookie === 'russian') return 'ru';
  if (cookie === 'english') return 'en';
  return null;
}

function browserLocale(): Locale {
  try {
    if (typeof browser !== 'undefined' && browser.i18n?.getUILanguage) {
      if (browser.i18n.getUILanguage().toLowerCase().startsWith('ru')) return 'ru';
      return 'en';
    }
  } catch {
    // tests / missing i18n API
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function detectLocale(): Locale {
  return steamLocale() ?? browserLocale();
}

export function interpolate(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`$${key}$`, String(value));
  }
  return text;
}

export function t(key: MessageKey, vars?: MessageVars, locale: Locale = detectLocale()): string {
  return interpolate(tables[locale][key] ?? tables.en[key], vars);
}

export function applyPageLocale(titleKey?: MessageKey): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = detectLocale();
  if (titleKey) document.title = t(titleKey);
}
