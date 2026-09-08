# GAMEPLAN — Trade Balancer pricing moves to the backend

## What the player gets

The Trade Balancer opens fast. Scan or search still resolves a card instantly
from a small local index; the moment a card is added, the app quietly asks the
backend for that one card's printings and prices, shows a brief loading state
on the entry, then displays its printing, price, foil toggle, and quantity —
exactly as today. A missing price still shows $0 with the caution triangle.
Nothing else the player does changes.

## Architecture

**Before:** one build script (`build-card-prices.mjs`) trims the Scryfall bulk
source into a ~38 MB frontend file (`cardPrintingPrices.json`, 95,895
printings) that the browser downloads whole on first balancer open. The
balancer's search, scan preview, and printing picker all read that one file.

**After:** the price/printing projection folds into the existing card-detail
build (`build-card-detail-by-oracle-id.mjs`), which now emits two backend
artifacts from one pass over the same source: the existing rules map
(`cardDetailByOracleId.json`) and a new price map
(`cardPrintingPricesByOracleId.json`). The backend serves the new map through
a read-only sibling route, `GET /api/cards/:oracleId/prices`, loaded into
memory at startup with no runtime network call — the same posture as the
existing `GET /api/cards/:oracleId` route. The frontend's shared
`cardMetadata.json` index (already used by MTG Assistant and Quick Lookup)
becomes the balancer's source for card identity (name, image, colors) too;
its stored full image URL becomes a stored representative-printing id, and
the browser derives the URL from that id via the Scryfall template. The old
frontend price file and its build script are deleted entirely once nothing
reads them.

## Data flow (after)

1. App start: the browser loads the slim `cardMetadata.json` (name, image id,
   colors per unique card) — the balancer's only up-front data cost.
2. Player scans or searches a card: resolved locally via `cardMetadata`
   (search/autocomplete) or the existing scan map (scan → oracle id).
3. Player adds the card to a side: the balancer calls
   `fetchCardPrintings(oracleId)`, which hits
   `GET /api/cards/:oracleId/prices`, shows a brief in-place loading state,
   and caches the result in a module-level `Map` for the rest of the session
   (mirrors `apps/frontend/src/lib/cardDetail.ts`).
4. The response's printings (`id, set, setName, collectorNumber, usd,
   usdFoil`) populate the entry and the printing picker; each printing's image
   derives from its `id`. A null `usd`/`usdFoil` renders $0-plus-caution
   (`pricing.ts`, untouched).
5. `POST /api/ask-ai` and `GET /api/cards/:oracleId` (the rules route) are
   completely unaffected — they read `cardDetailByOracleId.json` only and
   never touch the price map.

## Slices

| Slice | Title | Depends on | Primary objective |
| --- | --- | --- | --- |
| A | Backend price build & artifact | — | Unify the price projection into the existing card-detail build; commit the backend price artifact; keep the Lambda 250 MB budget green |
| B | Backend price route | A | Serve the new artifact from `GET /api/cards/:oracleId/prices`, in-memory, no runtime network call |
| C | Shared `cardMetadata` index | — (parallel-ready with A/B; must land before D) | Slim `cardMetadata` to a representative-printing id; add the shared image-derive helper both flows use |
| D | Frontend balancer flow & cleanup | A, B, C | Fetch+cache prices on add, wire search/scan to `cardMetadata`, delete the old 38 MB file, preserve all player-visible behavior |

Slice C has no code dependency on A or B — it only touches `cardMetadata` and
its consumers — but it must be done before D, since D's picker and scan
preview import the image-derive helper C introduces. For one agent working
sequentially, the safe order is **A, B, C, D**.

## Product truth (applied alongside the code, not deferred to cleanup)

Ten accepted `GATE-QUESTIONS.md` blocks land with their corresponding code
slice, so no slice ships a behavior change without its matching durable PRD
edit already in place:

| Stable ID | Lands in |
| --- | --- |
| REQ-066 | Slice A |
| REQ-175, NFR-004 | Slice B |
| REQ-174 | Slice C |
| REQ-064, REQ-065, FLOW-009, FLOW-025 (new), NFR-013, NFR-014 | Slice D |

Each slice also updates the derived, non-authoritative docs the design brief
names for its layer (system-map build entry, integrations-and-data.md's API
section, NFR-019's measured figure, the trade-balancer README and corpus doc,
system-map's file list, and NFR-004's ~11 echo homes via grep-before-amend).

## Browser-risk assessment

Per `PRD/instructions/runtime-process-hygiene.md`, Playwright verification is
required only for browser-observable risk component tests can't establish
(responsive geometry, overlays/stacking, hit areas, focus/keyboard, browser
APIs, multi-screen behavior) or on explicit user request. This change adds an
in-place loading state to an existing row and swaps a data source — no new
overlay, no layout change, no new viewport concern. The existing component
test suites (`TradeBalancer.test.tsx`, `TradeBalancer.scan.test.tsx`,
`oracleSearch.test.ts`, `pricing.test.ts`) already cover the picker, foil
toggle, and $0-plus-caution states this design preserves. No slice below
carries a Playwright requirement; each slice's acceptance criteria are
provable by an automated command or, where noted, a targeted grep/inspection.

## Verification checklist (rollup)

```bash
npm run data:build
node --test scripts/build-card-detail-by-oracle-id.test.mjs
node --test scripts/lambda-package-budget.test.mjs
npm run test:scripts
npm test --workspace apps/backend
npm test --workspace apps/frontend
grep -rn "cardPrintingPrices" apps/frontend/src apps/frontend/public
grep -rn "loadCardPrices" apps/frontend/src
```

## Ship gates

See Slice D's `## Ship gates` block — the final slice carries the package-wide
gate checklist.
