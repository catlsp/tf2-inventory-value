# TF2 Inventory Value

Неофициальное расширение для Chrome: оценка предметов Team Fortress 2 на страницах Steam — в **keys/ref**, с учётом unusual-эффекта, краски, Halloween spells и strange parts. В окне обмена будет виден профит, только если обе стороны можно оценить честно.

Не связано с Valve, Steam или backpack.tf. Пароль Steam не запрашивается.

Сейчас в репозитории **фаза 0–1**: каркас MV3 (WXT + React) и парсер предметов с тестами. Цены и калькулятор оффера — следующие фазы.

## Возможности сейчас

- Плашка на инвентаре Steam (`/inventory`, TF2).
- Плашка на странице trade offer.
- Парсер Steam JSON → паспорт предмета + SKU (`378;5;u13` и т.п.).
- Спеллы и части хранятся отдельно от базового SKU — их нельзя «добавить как банку краски» к suggested-цене.

## Установка для разработки

Нужны Node.js 22+ и npm.

```bash
npm install
npm test
npm run dev
```

`npm run dev` соберёт расширение и откроет браузер с ним. Либо вручную:

1. `npm run build`
2. Chrome → `chrome://extensions` → Developer mode → Load unpacked
3. Указать папку `.output/chrome-mv3`

Откройте свой инвентарь TF2 на steamcommunity.com — сверху должна быть плашка TF2 Inventory Value.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | режим разработки |
| `npm test` | vitest (парсер) |
| `npm run compile` | проверка TypeScript |
| `npm run build` | production-сборка |
| `npm run zip` | zip для Chrome Web Store |

## Структура

```
src/entrypoints/     popup, background, content scripts
src/lib/tf2/         парсер, SKU, словари effect/paint/spell
src/lib/prices/      типы Quote (движок цен — фаза 2)
src/fixtures/items/  примеры описаний Steam для тестов
```

## Дальше по плану

1. Прайслист backpack.tf + курс ключа, оверлей на плитках.
2. Unusual через classifieds; paint/spells — бейджи, пока нет компов.
3. Суммы в трейд-оффере и честный Δ.
4. Privacy + скриншоты + публикация в Chrome Web Store.

## Лицензия

MIT. Политика конфиденциальности: [PRIVACY.md](./PRIVACY.md).
