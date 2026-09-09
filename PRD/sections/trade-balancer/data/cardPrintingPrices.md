# Printing price corpus — `cardPrintingPricesByOracleId.json.br`

- Status: draft, derived, non-authoritative view. On any conflict, the cited
  `REQ`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #2, a
  historical index. Correct this file against those sources, not the other way
  around.
- Backed by: REQ-066, REQ-175, NFR-013, REQ-195 (and the `CardPrintingPrice`
  shape in `integrations-and-data.md`)
- Feature that consumes it: `PRD/sections/trade-balancer/README.md`, via the
  read-only backend route `GET /api/cards/:oracleId/prices`

This is a **corpus doc**, not a behavior doc. It records the committed price
artifact the backend serves on demand — where it comes from, how it is built,
and what one committed snapshot holds. It is kept separate from the feature
spec so the behavior README describes what a player does, and the artifact's
contents stay a `data/` concern rather than being inlined into that behavior.

## Why it is a corpus, not a feature spec

The docs-refactor `data/` bucket test requires all four clauses; this artifact
passes each one:

- **External upstream source:** Scryfall bulk data
  (`apps/frontend/data/scryfall/default-cards.json`, gitignored — the same
  bulk file the scan/metadata/card-detail pipeline already downloads).
- **Build/refresh command:** `scripts/build-card-detail-by-oracle-id.mjs`,
  wired into `npm run data:build` (unified with the card-detail build, REQ-066
  — the retired `scripts/build-card-prices.mjs` no longer exists); the upstream
  bulk is refreshed via `npm run data:refresh` (the Scryfall download is
  human-approved before it runs).
- **Committed artifact:** `apps/backend/data/cardPrintingPricesByOracleId.json.br`
  (backend-only; there is no frontend copy).
- **Describes Magic, not TheJudge:** the artifact is per-printing card price and
  identity data (prices, sets, collector numbers), not TheJudge product
  configuration or behavior.

## Where it comes from and how it is built

- Built offline by `scripts/build-card-detail-by-oracle-id.mjs` in the same
  streaming pass over the local Scryfall bulk source that emits
  `cardDetailByOracleId.json.br` — no fourth extract of the bulk file. Emitted to
  `apps/backend/data/cardPrintingPricesByOracleId.json.br` and committed. Raw
  bulk input stays gitignored; only the trimmed, brotli-compressed artifact is
  committed (REQ-066).
- A printing is kept when it passes the same inclusion filter the card-detail
  build already applies (`shouldIncludeCard`: English, paper, non-digital, a
  non-empty name) and carries an `oracle_id` — every qualifying printing, not
  deduped the way the rules-text side is (a card has one rules block but
  several printings, each with its own price). A printing with no price is
  **kept**, not dropped — it stays selectable and the pricing layer treats a
  null price as $0 plus a caution flag (REQ-065).
- **Static snapshot, no runtime sync:** the committed file is the only source at
  runtime. There is no live price fetch, no runtime sync, and no scheduled
  runtime refresh. Refresh happens solely through the human-approved pipeline
  (`data:refresh` → `data:build`); its standing cadence is a weekly one-command
  local script the owner runs (`npm run data:refresh-pr`), which runs that
  pipeline and, when an artifact changed, opens a pull request to `main` the
  owner merges — the runtime still reads only the committed artifact (DEC-088,
  NFR-013, REQ-195).
- The build degrades gracefully: a missing or failed source keeps the prior
  committed artifacts (both `cardDetailByOracleId.json.br` and this file) and does
  not break other artifact builds (REQ-066).
- **Committed brotli-compressed, not raw JSON.** The raw shape is ~15.6 MB for the
  current corpus. Brotli-compressed it is ~3.4 MB (re-recorded at build), mirroring
  the brotli committed-artifact pattern the backend data folder now uses across the
  combo blocks (`commanderSpellbookComboBlocks.br`), the combo index
  (`commanderSpellbookComboIndex.json.br`), rulings, and card detail; the backend
  brotli-decodes it once at startup (REQ-175), the same way
  `apps/backend/src/commanderSpellbook/catalog.ts` already reads its blocks. See
  `scripts/lambda-package-budget.test.mjs`.
- **Do not rebuild to read this doc.** These figures are read from the committed
  artifact; regenerating requires the human-approved Scryfall network refresh
  and is out of scope for the spec.

## Artifact shape

Top-level object with two keys:

- `snapshotDate: string` — ISO-8601 timestamp of the source snapshot. Resolved
  from the Scryfall bulk metadata `updated_at` when present, else the source
  file mtime, else the build date. The response the price route serves echoes
  this per request; the UI formats it to date-level copy and never shows the
  raw string (REQ-145).
- `byOracleId: Record<oracleId, { printings: CardPrintingPrice[] }>` — every
  qualifying printing of a card, keyed by Scryfall `oracle_id`. Lets the
  backend serve one card's whole printing list per request (`GET
  /api/cards/:oracleId/prices`, REQ-175).

Each `CardPrintingPrice` (the shape `integrations-and-data.md` also documents,
and the route's wire response echoes verbatim per printing):

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Scryfall printing id; the frontend derives the image url from it (`lib/cardImage.ts`) |
| `set` | string | set code |
| `setName` | string | full set name |
| `collectorNumber` | string | collector number within the set |
| `usd` | number \| null | non-foil USD price; `null` when the source has none |
| `usdFoil` | number \| null | foil USD price; `null` when the source has none |

No `oracleId`, `name`, or `imageUrl` per printing: the oracle id is the map
key the caller already supplied, the card name comes from the shared
`cardMetadata` index (REQ-174), and the image derives from `id`. USD only —
Scryfall `usd` / `usd_foil`. EUR, tix, and etched-foil are not carried. A trade
entry references one `CardPrintingPrice` plus a `foil: boolean` and a
`quantity: number` (≥ 1); the artifact holds no trade state.

## Measured bounds (current committed snapshot)

Read from the committed `cardPrintingPricesByOracleId.json.br`; a future
refresh moves these.

- File size on disk (brotli-compressed): ≈ 3.4 MB (re-recorded at build).
- `byOracleId`: 36,521 oracle ids.
- Printings across all oracle ids: 102,565.
- Price coverage: 82,538 printings have a `usd` price, 56,931 have a `usdFoil`
  price; 8,502 printings have neither — each such printing is still present
  and selectable, priced at $0 with a caution flag for the missing mode
  (REQ-065).

## Runtime posture

- **Backend-only, loaded into memory at startup, served on demand.** No
  up-front frontend download and no lazy-loaded frontend artifact — the
  balancer's only up-front frontend cost is the shared `cardMetadata` index
  (NFR-013, REQ-174). A card's printings and prices are fetched only when that
  card is added to a side, cached per session (FLOW-025). Loader lives in
  `apps/backend/src/cardPrices.ts` (`loadCardPrintingPricesIndex`); the route
  in `apps/backend/src/routes/cardPrices.ts`; the frontend fetch/cache module
  in `apps/frontend/src/lib/trade/fetchCardPrintings.ts`; pure price selectors
  in `apps/frontend/src/lib/trade/pricing.ts` (unchanged).
- Never pushed into `AskAiRequest`, prompt assembly, the provider boundary,
  `POST /api/ask-ai`, or any product-facing endpoint besides its own read-only
  route. Printing identity here is a pricing/display concern only and does not
  reopen the oracle-level scan identity model (DEC-053).

## Where it lives

`scripts/build-card-detail-by-oracle-id.mjs` (build, wired into `npm run
data:build`, unified with the card-detail build) →
`apps/backend/data/cardPrintingPricesByOracleId.json.br` (committed artifact,
brotli-compressed) → `apps/backend/src/cardPrices.ts` (in-memory loader) →
`apps/backend/src/routes/cardPrices.ts` (`GET /api/cards/:oracleId/prices`) →
`apps/frontend/src/lib/trade/fetchCardPrintings.ts` (per-session fetch/cache).
See `PRD/sections/system-map.md`'s `### Printing-price artifact build` entry
for the full machinery detail.
