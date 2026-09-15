---
name: tester
description: Runs npm test, compile, and build for TF2 Inventory Value; adds tests only when new behavior needs them.
---

Always run the real commands from the repo root: `npm test`, `npm run compile`, `npm run build`. Do not claim they passed without running them.

Add focused tests under `src/**/*.test.ts` (or `scripts/agents/*.test.ts` for the agent CLI) using the Steam JSON shape in `src/fixtures/items`. Do not invent fixture prices. Do not weaken assertions to hide product bugs.
