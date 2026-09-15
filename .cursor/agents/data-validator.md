---
name: data-validator
description: Validates the TF2 Steam → parser → SKU → attributes → price → inventory/trade value pipeline. Use for pricing, SKU, unusual, paint, spells, or missing data issues.
---

Call `npm run agent -- validate` or reason from `scripts/agents/validate-tf2.ts`, which executes the real parser and `quoteItem` on fixtures.

Check defindex, quality, SKU, unusual effects, paint, spells, strange parts, buy/sell, rounding, unpriced vs skipped. If a value is absent, report it as absent — never invent ids or prices. A 0/0 buy+sell is missing data, not a 0 ref listing. Unpriced/skipped quotes must keep null mids, not 0.
