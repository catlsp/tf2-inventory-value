# TF2 Inventory Value

Unofficial browser extension: Team Fortress 2 inventories and Steam trade offers show item values in **keys/ref**.

Not affiliated with Valve, Steam, or backpack.tf. No Steam password. No API key.

## What it does

- Prices TF2 items on the backpack and writes keys/ref on each item.
- Unusuals are quoted by effect, not as a plain hat.
- Paint, Halloween spells, and strange parts are flagged. They are not added as a made-up “can” markup unless there is a separate quote.
- Trade offers show what you give, what you get, and the difference. If some items have no quote, profit is not painted green.

Prices come from the public [pricedb.io](https://pricedb.io) TF2 market list.

Privacy policy:

`https://github.com/catlsp/tf2-inventory-value/blob/main/PRIVACY.md`

## Load unpacked (development)

1. Install [Node.js](https://nodejs.org/) 22+.
2. In this folder: `npm install` then `npm run build` (Chrome) or `npm run build:firefox`.
3. Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → `.output/chrome-mv3`.
4. Firefox → `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick `.output/firefox-mv3/manifest.json`.
5. Open a TF2 inventory on steamcommunity.com.

## Privacy

[PRIVACY.md](./PRIVACY.md). Inventory stays in the browser; the pricelist is downloaded from pricedb.io.

## License

MIT.
