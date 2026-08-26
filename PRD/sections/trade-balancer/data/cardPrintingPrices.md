# Printing price corpus — `cardPrintingPrices.json`

- Status: draft, derived, non-authoritative view. On any conflict, the cited
  `DEC`/`REQ`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1 and
  Read-First #1. Correct this file against those sources, not the other way
  around.
- Backed by: DEC-088, REQ-066, NFR-013 (and the `CardPrintingPrice` shape in
  `integrations-and-data.md`)
- Feature that consumes it: `PRD/sections/trade-balancer/README.md`

This is a **corpus doc**, not a behavior doc. It records the committed price
artifact the Trade Balancer loads — where it comes from, how it is built, and
what one committed snapshot holds. It is kept separate from the feature spec so
the behavior README describes what a player does, and the artifact's contents
stay a `data/` concern rather than being inlined into that behavior.

## Why it is a corpus, not a feature spec

The docs-refactor `data/` bucket test requires all four clauses; this artifact
passes each one:

- **External upstream source:** Scryfall bulk data
  (`apps/frontend/data/scryfall/default-cards.json`, gitignored — the same
  bulk file the scan/metadata pipeline already downloads).
- **Build/refresh command:** `scripts/build-card-prices.mjs`, wired into
  `npm run data:build`; the upstream bulk is refreshed via `npm run data:refresh`
  (the Scryfall download is human-approved before it runs, per DEC-088).
- **Committed artifact:** `apps/frontend/public/data/cardPrintingPrices.json`.
- **Describes Magic, not TheJudge:** the artifact is per-printing card price and
  identity data (prices, sets, collector numbers, images), not TheJudge product
  configuration or behavior.

## Where it comes from and how it is built

- Built offline by `scripts/build-card-prices.mjs` from the local Scryfall bulk
  source; emitted to `apps/frontend/public/data/cardPrintingPrices.json` and
  committed. Raw bulk input stays gitignored; only the trimmed artifact is
  committed (DEC-088, REQ-066).
- The build streams the bulk file object-by-object (it exceeds V8's max string
  length), keeps a printing when it passes the shared scan-printing filter
  (`shouldIncludeScanPrinting`) and carries an `oracle_id`, and trims each card
  to the price/identity fields below. A printing with no price is **kept**, not
  dropped — it stays selectable and the pricing layer treats a null price as $0
  plus a caution flag (DEC-087/REQ-065).
- **Static snapshot, no runtime sync:** the committed file is the only source at
  runtime. There is no live price fetch, no runtime sync, and no scheduled
  refresh. Refresh happens solely through the human-approved pipeline
  (`data:refresh` → `data:build`) (DEC-088, NFR-013).
- The build degrades gracefully: a missing or failed source keeps the prior
  committed artifact and does not break other artifact builds (REQ-066).
- **Do not rebuild to read this doc.** These figures are read from the committed
  artifact; regenerating requires the human-approved Scryfall network refresh
  and is out of scope for the spec.

## Artifact shape

Top-level object with three keys:

- `snapshotDate: string` — ISO-8601 timestamp of the source snapshot. Resolved
  from the Scryfall bulk metadata `updated_at` when present, else the source
  file mtime, else the build date. The UI formats this to date-level copy and
  never shows the raw string (REQ-145).
- `printings: Record<printingId, entry>` — one entry per included paper
  printing, keyed by Scryfall printing id (the key equals `entry.id`). Resolves
  a scanned printing directly.
- `byOracleId: Record<oracleId, printingId[]>` — an index from oracle identity to
  its printing ids, so the manual picker can list every printing of a card.

Each `printings` entry (the `CardPrintingPrice` shape in
`integrations-and-data.md`):

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Scryfall printing id (equals the map key) |
| `oracleId` | string | oracle identity the printing belongs to |
| `name` | string | card name |
| `set` | string | set code |
| `setName` | string | full set name |
| `collectorNumber` | string | collector number within the set |
| `imageUrl` | string | normal (or small) front-face image url; `""` if none |
| `usd` | number \| null | non-foil USD price; `null` when the source has none |
| `usdFoil` | number \| null | foil USD price; `null` when the source has none |

USD only — Scryfall `usd` / `usd_foil`. EUR, tix, and etched-foil are not
carried (DEC-087). A trade entry references one `CardPrintingPrice` plus a
`foil: boolean` and a `quantity: number` (≥ 1); the artifact holds no trade
state.

## Measured bounds (committed 2026-06-05 snapshot)

Read from the committed `cardPrintingPrices.json`; a future refresh moves these.

- `snapshotDate`: `2026-06-05T22:21:13.248Z`.
- File size on disk: ≈ 38 MB (loaded lazily; see runtime posture below).
- `printings`: 95,895 entries.
- `byOracleId`: 32,638 oracle ids.
- Price coverage: 16,225 entries have no `usd`, 38,691 have no `usdFoil`, and
  4,575 have neither — each such entry is still present and selectable, priced
  at $0 with a caution flag for the missing mode (DEC-087/REQ-065).

## Runtime posture

- **Lazy-loaded only when the Trade Balancer is first opened** — app startup and
  the MTG Assistant flow are unaffected for a user who never opens the balancer
  (NFR-013, mirroring the scan-artifact posture). Loader and indexes live in
  `apps/frontend/src/lib/trade/loadCardPrices.ts`; pure price selectors in
  `apps/frontend/src/lib/trade/pricing.ts`.
- Never pushed into `AskAiRequest`, prompt assembly, the provider boundary,
  `POST /api/ask-ai`, or any product-facing endpoint. Printing identity here is
  a pricing/display concern only and does not reopen the oracle-level scan
  identity model (DEC-053, DEC-087).

## Where it lives

`scripts/build-card-prices.mjs` (build, wired into `npm run data:build`) →
`apps/frontend/public/data/cardPrintingPrices.json` (committed artifact);
lazy runtime loader `apps/frontend/src/lib/trade/loadCardPrices.ts`. See
`PRD/sections/system-map.md`'s `### Printing-price artifact build` entry for the
full machinery detail.
