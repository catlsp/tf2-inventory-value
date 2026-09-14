# TF2 Inventory Value

Неофициальное расширение для Chrome: оценка предметов Team Fortress 2 на страницах Steam — в **keys/ref**, с учётом unusual-эффекта, краски, Halloween spells и strange parts. В окне обмена будет виден профит, только если обе стороны можно оценить честно.

Не связано с Valve, Steam или backpack.tf. Пароль Steam не запрашивается.

Сейчас в репозитории **фаза 2**: каркас MV3, парсер предметов и оценка инвентаря по схеме backpack.tf.

## Возможности сейчас

- Плашка на инвентаре Steam (`/inventory`, TF2) с суммой в keys/ref.
- Цены на плитках: unusual по эффекту, краска/spells — бейдж, без выдуманной наценки.
- Плашка на странице trade offer (калькулятор профита — следующая фаза).
- Парсер Steam JSON → паспорт предмета + SKU (`378;5;u13` и т.п.).
- Спеллы и части хранятся отдельно от базового SKU.

## API key

1. Возьмите ключ на [backpack.tf/developer](https://backpack.tf/developer).
2. В расширении: попап → **Настройки**, вставьте ключ.
3. Он хранится только локально в браузере, в репозиторий не попадает.

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

1. Unusual через classifieds, если схемы мало; paint/spells — компы, не формула.
2. Суммы в трейд-оффере и честный Δ.
3. Скриншоты + публикация в Chrome Web Store.

## Лицензия

MIT. Политика конфиденциальности: [PRIVACY.md](./PRIVACY.md).
