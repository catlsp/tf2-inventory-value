# Firefox Add-ons (AMO) — TF2 Inventory Value

AMO has no developer fee. You need a Mozilla account. Submit yourself; nobody else can publish this add-on id.

Developer Hub: https://addons.mozilla.org/developers/

Gecko id (fixed after first upload): `tf2-inventory-value@catlsp`

Firefox 128 or newer (MV3, MAIN-world content script for inventory sort). The add-on declares `data_collection_permissions.required: ["none"]` — pricelist and inventory stay in the browser.

## 1. Zip to upload

```bash
npm install
npm test
npm run compile
npm run zip:firefox
```

File: `.output/tf2-inventory-value-0.3.2-firefox.zip`

Sources (upload if AMO asks, WXT already packed them): `.output/tf2-inventory-value-0.3.2-sources.zip`

Do not upload the Chrome zip to AMO.

## 2. Submit flow

1. [Submit a new add-on](https://addons.mozilla.org/developers/addon/submit/distribution)
2. Distribution: **On this site** (listed on AMO)
3. Upload the Firefox zip
4. Wait for automated signing / review
5. Fill listing (below), privacy policy, categories
6. Submit for review

## 3. Listing (English)

**Name**

```
TF2 Inventory Value
```

**Summary** (short, ≤ 250 characters)

```
Unofficial TF2 overlay: item values in keys/ref on Steam inventory and trade offers, including unusual effects, paint, and spells.
```

**Categories:** Games & Entertainment (primary). Optional second: Search Tools — skip if only one is allowed; use Games & Entertainment.

**Homepage:** `https://github.com/catlsp/tf2-inventory-value`

**Support email:** `tf2vaulthelper@gmail.com`

**Support site:** `https://github.com/catlsp/tf2-inventory-value/issues`

**Privacy policy**

```
https://github.com/catlsp/tf2-inventory-value/blob/main/PRIVACY.md
```

**Description** (AMO, English)

```
TF2 Inventory Value is an unofficial overlay for Steam Community. It shows Team Fortress 2 item values in keys and refined metal on inventory pages and trade offers.

What you get
• Keys/ref on items in a TF2 backpack you open
• Backpack total at the top of the inventory
• Unusual hats quoted by particle effect, not as a plain hat
• Paint, Halloween spells, and strange parts flagged when they change the item — not silently added as a made-up paint-can price
• Trade offer panel: what you give, what you get, and the difference. If some items have no quote, the difference is not shown as a clean “profit”

How prices work
The add-on downloads a public TF2 pricelist from pricedb.io and matches it to items Steam already shows. It does not invent missing unusual, paint, or spell premiums. Untradable achievement items are skipped.

What it does not do
• No Steam password, Steam Guard, or API key
• No trading bot, no automatic accept/decline
• Not affiliated with Valve, Steam, backpack.tf, or pricedb.io

How to use
1. Install the add-on
2. Open a Team Fortress 2 inventory on steamcommunity.com
3. Wait for the overlay: total at the top, prices on items
4. Open a trade offer to see both sides and the gap

Requires Firefox 128+.
Bugs: tf2vaulthelper@gmail.com
Source: https://github.com/catlsp/tf2-inventory-value
```

## 4. Screenshots and icon

Reuse `store/assets/`:

- `icon-128.png` — listing icon
- `screenshot-inventory.png`, `screenshot-trade.png`, `screenshot-thanks.png` — 1280×800
- Optional: `promo-marquee.png`

AMO prefers at least 1–2 screenshots of the actual UI. Inventory/trade shots in this folder are overlay comps; replace with captures from Firefox on steamcommunity.com if you can.

## 5. Permissions (paste if AMO asks)

**storage / unlimitedStorage**
Cache of the public TF2 pricelist on this device. The JSON can exceed the small default quota.

**https://steamcommunity.com/**
Overlay and inventory JSON on inventory and trade offer pages the user opens.

**https://pricedb.io/**
Download the public pricelist. The add-on does not upload inventory contents to this host.

## 6. Russian listing (optional locale)

**Summary**

```
Неофициальный оверлей TF2: цена предметов в keys/ref в инвентаре Steam и в окне обмена, включая unusual, краску и спеллы.
```

**Описание**

```
TF2 Inventory Value — неофициальный оверлей для Steam Community. На инвентаре Team Fortress 2 и в окне обмена предметы получают цену в keys и refined metal.

Что видно
• keys/ref на предметах в открытом рюкзаке TF2
• сумма рюкзака сверху инвентаря
• unusual по эффекту, не как обычная шляпа
• краска, Halloween spells и strange parts помечаются; к цене не прибавляется выдуманная «банка»
• в трейд-оффере: что отдаёте, что получаете, разница. Если части предметов нет котировки, «профит» зелёным не красится

Откуда цены
Публичный прайслист pricedb.io. Расширение не выдумывает missing unusual/paint/spell. Нетрейдабельные achievement-предметы пропускаются.

Чего нет
Пароль Steam, Steam Guard и API-ключ не нужны. Это не бот и не автопринятие обменов. Не связано с Valve, Steam, backpack.tf и pricedb.io.

Как пользоваться
1. Установите дополнение
2. Откройте инвентарь TF2 на steamcommunity.com
3. Сверху появится сумма, на предметах — цены
4. В окне обмена видно обе стороны и разницу

Нужен Firefox 128+.
Баги: tf2vaulthelper@gmail.com
```
