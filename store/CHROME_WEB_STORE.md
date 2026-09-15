# Chrome Web Store — TF2 Inventory Value

Google does not let anyone else publish under your developer account. You sign in, pay the one-time **US$5** fee if this is a new account, upload the zip, paste the fields below, and submit for review.

Dashboard: https://chrome.google.com/webstore/devconsole

## 1. Zip to upload

From the repo root:

```bash
npm install
npm test
npm run compile
npm run zip
```

Upload the Chrome zip in `.output/` (name like `tf2-inventory-value-0.3.2-chrome.zip`). Do not upload a Firefox zip.

Store icon **128×128** is generated into the package from `src/assets/icon.svg`. You can also upload `store/assets/icon-128.png` if the dashboard asks for a listing icon separately.

## 2. Product / store listing (English — default)

**Name** (≤ 75 characters)

```
TF2 Inventory Value
```

**Summary** (short description, ≤ 132 characters; matches `_locales/en`)

```
Unofficial TF2 overlay: item values in keys/ref on Steam inventory and trade offers, including unusual effects, paint, and spells.
```

**Category:** Productivity

**Language:** English (United States). Add Russian as a locale and paste the Russian block at the bottom.

**Homepage:** `https://github.com/catlsp/tf2-inventory-value`

**Support / email:** `tf2vaulthelper@gmail.com`

**Detailed description**

```
TF2 Inventory Value is an unofficial overlay for Steam Community. It shows Team Fortress 2 item values in keys and refined metal on inventory pages and trade offers.

What you get
• Keys/ref on items in a TF2 backpack you open
• Backpack total at the top of the inventory
• Unusual hats quoted by particle effect, not as a plain hat
• Paint, Halloween spells, and strange parts flagged when they change the item — not silently added as a made-up paint-can price
• Trade offer panel: what you give, what you get, and the difference. If some items have no quote, the difference is not shown as a clean “profit”

How prices work
The extension downloads a public TF2 pricelist from pricedb.io and matches it to items Steam already shows. It does not invent missing unusual, paint, or spell premiums. Untradable achievement items are skipped.

What it does not do
• No Steam password, Steam Guard, or API key
• No trading bot, no automatic accept/decline
• Not affiliated with Valve, Steam, backpack.tf, or pricedb.io

How to use
1. Install the extension
2. Open a Team Fortress 2 inventory on steamcommunity.com
3. Wait for the overlay: total at the top, prices on items
4. Open a trade offer to see both sides and the gap

Bugs and questions: tf2vaulthelper@gmail.com
Source: https://github.com/catlsp/tf2-inventory-value
Privacy: https://github.com/catlsp/tf2-inventory-value/blob/main/PRIVACY.md
```

## 3. Images (required sizes)

Put these files from `store/assets/` into the listing:

| File | Size | Dashboard field |
| --- | --- | --- |
| `promo-small.png` | 440×280 | Small promo tile (required) |
| `promo-marquee.png` | 1400×560 | Marquee (optional, helps featuring) |
| `screenshot-inventory.png` | 1280×800 | Screenshot 1 (inventory overlay) |
| `screenshot-trade.png` | 1280×800 | Screenshot 2 (trade offer) |
| `screenshot-thanks.png` | 1280×800 | Screenshot 3 (first-run page) |
| `icon-128.png` | 128×128 | Store icon if asked |

Rules: PNG or JPEG, square corners, no extra padding around a tiny UI. Inventory and trade shots in this folder are **product UI comps** (same overlay chrome as the extension). Before submit, replace them with captures from your own Steam inventory and a real trade offer if you can — reviewers prefer a live steamcommunity.com page.

To regenerate comps after a design change, open the HTML files in `store/assets/` at the listed pixel size and export PNG.

## 4. Privacy practices tab

**Privacy policy URL**

```
https://github.com/catlsp/tf2-inventory-value/blob/main/PRIVACY.md
```

(Must be the GitHub `main` file after you push this repo.)

**Single purpose**

```
Show Team Fortress 2 item values in keys and refined metal on Steam Community inventory and trade offer pages the user opens.
```

**Permission justifications**

`storage`

```
Caches the public TF2 pricelist on this device so inventory and trade pages can show keys/ref without downloading the full list on every page load.
```

`unlimitedStorage`

```
The public pricelist JSON can exceed Chrome’s 5 MB chrome.storage.local quota. This permission keeps the full cache locally. It is not used to store unrelated user files.
```

Host `https://steamcommunity.com/*`

```
The overlay runs on Steam Community inventory and trade offer pages. The extension also fetches TF2 inventory JSON for the page the user already opened, so it can match items to prices. It does not run on other Steam sites.
```

Host `https://pricedb.io/*`

```
Downloads the public TF2 pricelist used for keys/ref display. The extension does not upload inventory contents, SteamIDs, or item lists to this host.
```

**Remote code:** No. All extension logic ships in the zip.

**User data collection:** select that you **do not** collect personally identifiable information, health, financial, authentication, location, web history, user activity, or website content for your servers. Inventory JSON is read in the browser to draw the overlay and is not sent to the developer.

Certify the standard statements (no selling personal data, Limited Use if shown — this item does not use Google user data APIs).

## 5. Distribution

- Visibility: Public
- Regions: All (or wherever you want it listed)
- Pricing: Free

## 6. Submit

1. Pay the developer fee if the dashboard asks (US$5, Google payments, 2-step verification on the Google account).
2. New item → Chrome App / Extension → upload the zip.
3. Fill Store listing + Privacy + Distribution.
4. **Submit for review**.

Review often takes several days. Rejections are usually permission mismatch, missing privacy URL, or screenshots that are the wrong size.

## Russian listing (optional locale)

**Name:** `TF2 Inventory Value`

**Summary**

```
Неофициальный оверлей TF2: цена предметов в keys/ref в инвентаре Steam и в окне обмена, включая unusual, краску и спеллы.
```

**Подробное описание**

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
1. Установите расширение
2. Откройте инвентарь TF2 на steamcommunity.com
3. Сверху появится сумма, на предметах — цены
4. В окне обмена видно обе стороны и разницу

Баги: tf2vaulthelper@gmail.com
Исходники: https://github.com/catlsp/tf2-inventory-value
```
