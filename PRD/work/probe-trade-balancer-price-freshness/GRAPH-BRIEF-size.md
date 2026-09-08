# Graph-run brief — Slim the Trade Balancer price data so it opens fast

Self-contained intake for `graph-kickoff`. The investigate-first work is **done
and measured below**; refinement's job is to resolve one sequenced decision
(frontend slim first, backend move only if needed), then go to a DESIGN-BRIEF.

## What the player gets

The Trade Balancer opens fast. Today, the first time a player opens it, the app
downloads and parses a single ~38 MB file before the screen is usable — a
multi-second stall on mobile. This makes the data the balancer needs small enough
that opening it is quick, without changing what the player can do (scan or search
a card, pick its printing, see per-printing USD prices, foil toggle, totals).

## Why (measured — do not re-derive)

**Confirmed load cost.** `apps/frontend/src/lib/trade/loadCardPrices.ts` fetches
the whole artifact in one shot on first open:
`fetch('/data/cardPrintingPrices.json')` then `response.json()` — a ~38 MB
download plus a full parse of 95,895 printings, cached for the session. That is
the slowness.

**Measured field breakdown of the 38 MB file** (value bytes across 95,895
printings; ~5–6 MB more is repeated JSON key strings that shrink as fields drop):

| Field | Value bytes | Share | Slimmable? |
| --- | --- | --- | --- |
| `imageUrl` | 8.6 MB | 44% | **Yes — derivable from `id`** via the Scryfall URL template `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg` |
| `setName` | 1.7 MB | 8% | Yes — from `set` code via a small set→name map |
| `name` | 1.5 MB | 7% | Yes — from oracle metadata the app already loads |
| `id` | 3.3 MB | 17% | No — it is the map key |
| `oracleId` | 3.3 MB | 17% | Maybe — droppable if reconstructed from the `byOracleId` index |
| `usd` / `usdFoil` | 0.8 MB | 4% | No — the whole point |
| `set` / `collectorNumber` | 0.6 MB | 3% | No — printing identity for the picker |

`imageUrl` is the headline lever: 44% of value bytes plus its repeated key, and
it needs **no new data source** — it reconstructs from the `id` already present.
Dropping imageUrl + setName + name and their keys plausibly takes the file from
~38 MB toward ~20–24 MB while staying entirely frontend-side.

## Decisions already made — do not re-litigate

- **This is a size/perf fix, separate from freshness.** The weekly refresh script
  is its own run (`GRAPH-BRIEF.md` in this folder). They are independent.
- **The player-facing behavior does not change.** Scan/search add, printing
  picker with per-printing prices, foil toggle, $0-plus-caution for missing
  prices, ephemeral trade, USD-only — all unchanged (DEC-087, REQ-064/065,
  REQ-145). This changes only how the pricing *data* is delivered, not what the
  feature does.
- **Frontend-slim is tried before any backend move.** The cheap, DEC-087-
  preserving win (imageUrl-from-id first) is measured before considering the
  larger re-architecture. (See the sequenced decision below.)

## Design direction (converged) — one sequenced decision for refinement

**Step 1 — slim the committed frontend artifact (do this first, keeps DEC-087).**
- Derive `imageUrl` at runtime from the printing `id` using the Scryfall URL
  template instead of storing it. Biggest single win (~9 MB with its key).
- Drop `setName` (map from `set` code) and `name` (from the oracle metadata the
  app already loads), reconstructing them in the loader/selectors.
- Consider dropping per-entry `oracleId` (the `byOracleId` index already maps
  oracle → printing ids; the reverse can be derived if needed).
- Update `scripts/build-card-prices.mjs` to emit the slim shape, and
  `loadCardPrices.ts` / `pricing.ts` to rehydrate the derived fields.
- **Measure the resulting file size and first-open load time.**

**Step 2 — backend per-card price lookup (only if Step 1 is not enough).**
- If the slimmed file still loads too slowly, move pricing to a per-card backend
  lookup, following the proven `GET /api/cards/:oracleId` pattern
  (`apps/backend/src/routes/cardDetail.ts`, REQ-175): fetch on card-add, cache
  per session (FLOW-024).
- **Open granularity fork refinement must resolve:** that endpoint is
  **oracle-keyed**, but the balancer is **printing-level**. A price lookup must
  return, per oracle id, the card's full printing list with per-printing
  `usd`/`usdFoil` — a new response shape, not a field added to the oracle block.
- **Scan wrinkle:** a scan resolves to a printing id directly, so the flow must
  map printing → oracle before the lookup (the scan map already resolves oracle
  identity).
- **This step reverses DEC-087** ("frontend-only, no backend call") and touches
  NFR-013's runtime-footprint framing — a real product-truth change refinement
  must own, not a silent implementation choice.

Recommendation: ship Step 1, measure, and only open Step 2 if the numbers demand
it. Refinement makes the call with the Step-1 measurement in hand.

## Current-state PRD truth to amend

- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — update the "Artifact
  shape" table and "Measured bounds" to the slim shape (derived imageUrl/name/
  setName), and record the new size.
- `PRD/sections/integrations-and-data.md` — the `CardPrintingPrice` shape is
  documented there; amend it to the slim fields.
- `PRD/sections/trade-balancer/README.md` — the "Adding a card" / "Prices and
  freshness" bullets reference printing fields (image, set, price); keep them
  correct against the slim shape. **Only if Step 2 is chosen**, amend the
  "frontend-only / no backend call" posture (this is the DEC-087 reversal) and
  the `data/cardPrintingPrices.md` runtime posture.
- `PRD/sections/system-map.md` — `### Printing-price artifact build` entry.
- The decision log is retired — do **not** author a new `DEC`. Amend specs in
  place. Naming files here is not editing them.

## Constraints (don't rediscover)

- Missing-price behavior must survive: a null price still renders $0 + caution
  (DEC-087 / REQ-065). Slimming must not change price nullability.
- The printing picker needs enough identity to disambiguate printings visually
  (set, collector number, and an image) — deriving the image from `id` must still
  yield a working image URL; verify the template against real printings,
  including double-faced cards (the current build already falls back across
  `card_faces` for images, so a derived template must handle cards whose front
  image lives on a face).
- Mock-default local dev must keep working; if Step 2 is taken, the backend
  price data must be committed and served with no runtime network call, exactly
  like `cardDetailByOracleId.json`.
- Do not entangle this with the freshness script; if pricing moves to the backend
  (Step 2), the freshness script's target artifact changes, but that is a later
  re-point, not a dependency to resolve now.

## Evidence + reusable tooling

Full findings: `PRD/work/probe-trade-balancer-price-freshness/FINDINGS-size-and-backend.md`
(measured field breakdown, the endpoint analysis, the slim-vs-move recommendation).
Relevant code: `apps/frontend/src/lib/trade/loadCardPrices.ts`,
`apps/frontend/src/lib/trade/pricing.ts`, `scripts/build-card-prices.mjs`,
`apps/backend/src/routes/cardDetail.ts` (the Step-2 pattern to follow).

## What the graph run should produce

A DESIGN-BRIEF for the slim, the PRD amendments named above, and slices that:
change `build-card-prices.mjs` to emit the slim shape, rehydrate derived fields
in the loader/selectors, verify the derived image URL across normal and
double-faced printings, and measure the new size and load time. The Step-1 vs
Step-2 sequencing is the one decision refinement owns; the frontend-slim design
and the imageUrl-from-id lever are settled by the measurement above.

## How to hand this off

/graph-kickoff "Slim the Trade Balancer price artifact so the balancer opens fast — derive imageUrl from id and reconstruct name/setName, keeping it frontend-only, with a backend per-card lookup only if slimming is not enough" PRD/work/probe-trade-balancer-price-freshness/GRAPH-BRIEF-size.md
