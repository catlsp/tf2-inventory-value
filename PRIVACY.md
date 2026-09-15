# Privacy policy — TF2 Inventory Value

Last updated: 2026-09-15

TF2 Inventory Value is an unofficial browser extension. It is not affiliated with Valve, Steam, backpack.tf, or pricedb.io.

**Single purpose:** show Team Fortress 2 item values in keys and refined metal on Steam Community inventory and trade offer pages you open.

## Data the extension reads

- Steam Community inventory and trade offer pages you open in the browser.
- Item descriptions needed to identify TF2 items (defindex, quality, unusual effect, paint, spells, and similar attributes already present on the page or in Steam inventory JSON).

The extension does not ask for a Steam password, Steam Guard code, or backpack.tf API key.

## Network requests

- `https://steamcommunity.com` — TF2 inventory JSON for the profile or trade you are viewing. This is the same kind of request the Steam page itself uses.
- `https://pricedb.io` — a public TF2 pricelist. The extension downloads prices; it does not upload your inventory, SteamID, or item list to pricedb.io.

No data is sent to a server operated by the extension author.

## Local storage

On your computer, Chrome `storage` holds a cache of the public pricelist so pages can show values without downloading the full list every time. You can remove it by removing the extension.

## Data the extension does not collect

- Names, email addresses, or other account identifiers for our records (we do not operate a user database).
- Steam passwords, email, or Mobile Authenticator codes.
- Payment or financial account data.
- Location, health, browsing history outside Steam Community inventory/trade pages, or web search activity.
- Analytics, advertising, or crash-reporting beacons.

Support email (`tf2vaulthelper@gmail.com`) is only used if **you** write to us. The extension does not send mail by itself.

## Permissions

- `storage` — pricelist cache on this device.
- `unlimitedStorage` — the pricelist JSON can be larger than Chrome’s 5 MB `storage.local` quota.
- Host access to `steamcommunity.com` — overlay and inventory JSON on inventory and trade offer pages.
- Host access to `pricedb.io` — download the public pricelist.

## Children

The extension is not directed at children and does not knowingly collect personal information from children.

## Changes

If this policy changes, the date at the top will be updated in this file on GitHub.

## Contact

Email [tf2vaulthelper@gmail.com](mailto:tf2vaulthelper@gmail.com) or open an issue on [github.com/catlsp/tf2-inventory-value](https://github.com/catlsp/tf2-inventory-value).
