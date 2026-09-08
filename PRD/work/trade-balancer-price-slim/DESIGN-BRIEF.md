# DESIGN BRIEF: Trade Balancer price artifact slim (Step 1, frontend-only)

## What the player gets

The Trade Balancer opens fast. Today the first time a player opens it, the app
downloads and parses one ~38 MB price file before the screen is usable — a
multi-second stall on mobile. This shrinks that file so opening the balancer is
quick, and nothing else about the feature changes: scan or search a card, pick
its printing, see per-printing USD prices, foil toggle, totals, the $0-plus-
caution state for a missing price, and the ephemeral trade all stay exactly as
they are. This changes only how the pricing data is delivered, not what the
feature does.

## Scope (committed)

This package is **Step 1 only — the frontend slim**. It keeps the current
frontend-only, no-backend-call posture (DEC-087). It slims the committed
`cardPrintingPrices.json` in three ways, all of which reconstruct the same
runtime data the app uses today:

1. **Derive `imageUrl` at load time from the printing `id`** instead of storing
   it (the single biggest lever — ~44% of the file's value bytes plus its
   repeated key). Scryfall composes every printing's image URL from the printing
   id: `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg`. The
   loader derives this per printing; the field is dropped from disk.
2. **Reconstruct `setName`** from the set code via a compact `set → set name`
   map emitted once by the build, instead of repeating the full set name on all
   95,895 printings.
3. **Reconstruct `name`** from a compact `oracle id → name` map emitted once by
   the build, instead of repeating the card name on every printing.

At runtime the loader rehydrates the full `CardPrintingPrice` shape (with
`name`, `setName`, `imageUrl`) so every consumer — the printing picker, the
entry rows, the manual-search index, the scan flow — is unchanged.

## Decisions this run owns

### Sequencing: ship Step 1, defer Step 2 (the backend lookup)

**Decision: commit Step 1 (frontend slim). Do not take Step 2 (a per-card
backend price lookup) in this package.** Step 2 would reverse the feature's
frontend-only, no-backend-call posture (DEC-087) and touch the runtime-footprint
framing (NFR-013) — a real product-truth reversal, not an implementation detail.
Step 2 is a fallback only *if* the slimmed file is measured and still loads too
slowly, and that measurement does not exist yet. The conservative, reversible
choice is to ship the frontend slim, measure the new size and first-open load
time, and only then decide whether Step 2 is warranted. Deferring Step 2 does
not silently decide the disputed behavior: it preserves the current, shipped
posture. Step 2 is therefore out of scope here and is **not** raised as a gate
blocker; it becomes a fresh decision once Step-1 numbers are in hand.

### `name` reconstruction source: dedupe inside the artifact, not an external fetch

The intake suggested reconstructing `name` "from the oracle metadata the app
already loads." Investigation found the Trade Balancer flow does **not** load
`cardMetadata.json` today — the manual-search index (`oracleSearch.ts`) is built
from the price artifact's own `name` field. Loading `cardMetadata.json` (~6.7 MB)
into the first-open path to source names would add a second large download and
undercut the "opens fast" goal, and its filter differs from the price artifact's
(oracle-coverage mismatch risk). So `name` and `setName` are instead deduplicated
into compact maps **inside the same `cardPrintingPrices.json`**, keeping a single
fetch and no new data source. This is the smallest-reversible, no-new-external-
fetch choice (assumption ladder rungs 4 and 6). See "Material assumptions."

### `oracleId` stays on each printing entry

The intake floated dropping per-entry `oracleId` and rebuilding it from the
`byOracleId` index. That saves ~17% but forces the loader to build and hold a
reverse index at load, adding complexity for a secondary gain. It is left out of
the committed scope; `oracleId` stays on each entry. If Step-1 measurement shows
the slim is still short of the budget, dropping `oracleId` is the first cheap
lever to reconsider before Step 2 — recorded as a future option, not committed.

## The slim artifact shape

```
{
  snapshotDate: string,
  printings: {
    [printingId]: {
      id: string,             // = map key
      oracleId: string,       // kept
      set: string,            // kept (printing identity for the picker)
      collectorNumber: string,// kept (printing identity for the picker)
      usd: number | null,     // the point
      usdFoil: number | null  // the point
      // name, setName, imageUrl NO LONGER stored per printing
    }
  },
  byOracleId: { [oracleId]: printingId[] },   // unchanged
  namesByOracleId: { [oracleId]: string },    // NEW compact map (one name per oracle)
  setNames: { [setCode]: string }             // NEW compact map (one name per set)
}
```

Runtime `CardPrintingPrice` (in `loadCardPrices.ts`) is **unchanged** — the
loader reconstructs `name`, `setName`, and `imageUrl` when it hands a printing to
a consumer.

## Loader / selector design

- `derivePrintingImageUrl(id)` returns
  `https://cards.scryfall.io/normal/front/${id[0]}/${id[1]}/${id}.jpg`.
- `getPrintingPrice(printingId)` and `listPrintingsForOracle(oracleId)` rehydrate
  each returned `CardPrintingPrice` with `name = namesByOracleId[oracleId]`,
  `setName = setNames[set]`, and `imageUrl = derivePrintingImageUrl(id)`.
  Rehydration is on the accessor path, so the whole 95,895-entry set is not
  eagerly transformed — bounded CPU and memory, no jank on open (NFR-013).
- `buildOracleSearchIndex` reads `namesByOracleId` directly for the searchable
  name row, so manual search keeps working with names available.

## Double-faced-card image case

The current build's `getImageUrl` falls back to `card_faces[0].image_uris` for a
double-faced card, because the Scryfall bulk record puts a DFC's images on the
faces, not the top level. But the URL it retrieves is still keyed by the
**printing id** with the `/front/` path segment — Scryfall composes a DFC's
front-face image URL from the printing id exactly like a single-faced card. So
the derived template resolves the front image for both normal and double-faced
printings with no per-face branch at runtime. (The stored URLs also carried a
`?<timestamp>` cache-buster query; the derived URL drops it and still resolves —
Scryfall serves the image without the query string.) The implementation must
**verify the derived URL against a real double-faced printing** as well as a
normal one before this is considered done — a build/verification slice, not an
assumption to ship blind.

## Non-goals

- **No player-facing behavior change.** Scan/search add, printing picker, per-
  printing prices, foil toggle, $0-plus-caution for missing prices, ephemeral
  trade, USD-only — all unchanged (DEC-087, REQ-064, REQ-065, FLOW-009).
- **Missing-price behavior is untouched.** A null `usd`/`usdFoil` still renders
  $0 plus the caution triangle (DEC-087 / REQ-065). Slimming never changes price
  nullability — `usd`/`usdFoil` are the fields that stay.
- **No backend move (Step 2).** Deferred, as decided above.
- **Not the weekly freshness refresh.** Independent track, its own package; this
  run does not touch it and runs no Scryfall network refresh.
- **No new data file and no change to `cardMetadata.json`, `cardScanMap.json`,
  or `cardhashes.bin`** — the compact maps ride inside the existing
  `cardPrintingPrices.json` (REQ-066 constraint preserved).

## Constraints preserved

- The printing picker keeps enough identity to disambiguate printings visually:
  set, collector number, and a working derived image. A rare printing with no
  Scryfall image yields a URL that may 404; the picker/rows must keep a graceful
  broken-image affordance, and set + collector number still disambiguate.
- Mock-default local dev keeps working: Step 1 adds no backend call; the loader
  still fetches the static `/data/cardPrintingPrices.json`.
- Static committed snapshot; no runtime price fetch, no runtime sync (NFR-013,
  DEC-088). The slim is a delivery change only.

## Verification the implementation must produce

- Rebuild the slim artifact and **measure the new file size and first-open load
  time** against the ~38 MB baseline (the "opens fast" outcome).
- Confirm the derived image URL resolves for a normal printing and a double-
  faced printing.
- Confirm manual search, the printing picker, the scan flow, foil toggle,
  totals, and the $0-plus-caution state all behave identically to today.

## Product truth to amend (proposed — see GATE-QUESTIONS.md)

- **REQ-066** — the "per printing carries … card name, set name, image url"
  acceptance criterion. The slim drops those three from per-printing storage and
  reconstructs them at load; REQ-066 must record the slim shape and the compact
  maps, and add a derived-image acceptance line covering double-faced printings.
- **NFR-013** — the footprint/budget framing. Records that the artifact is
  deliberately slimmed (image derived from id, name/set-name deduplicated) to
  keep the first-open download within the mobile budget, while the frontend-only,
  no-runtime-fetch posture (DEC-087) is unchanged.

Both are amendments to existing ids; **no new REQ/FLOW id is required**, and the
decision log is retired so no new DEC is minted. The derived, non-authoritative
docs that must be brought into step when the amendments apply — the corpus doc
`trade-balancer/data/cardPrintingPrices.md` (Artifact shape, Measured bounds,
build description), the `CardPrintingPrice` shape in `integrations-and-data.md`,
the "Adding a card" / "Prices and freshness" bullets in `trade-balancer/README.md`,
and the `### Printing-price artifact build` entry in `system-map.md` — follow
REQ-066/NFR-013 by their own "on conflict, the cited REQ/NFR wins" rule and are
updated by implementation, not gated separately.

## Material assumptions (assumption ladder)

1. **`name`/`setName` are deduplicated into compact maps inside
   `cardPrintingPrices.json`, not sourced from a separate `cardMetadata.json`
   fetch.** Evidence: `oracleSearch.ts` and `useTradeScan.ts` read
   `printing.name` from the price artifact; the trade flow does not fetch
   `cardMetadata.json`; adding a ~6.7 MB fetch to first open fights the goal.
   Ladder rungs 4 (smallest reversible scope) and 6 (no new external fetch).
2. **The Scryfall URL template resolves for double-faced printings via the
   printing id and the `/front/` segment.** Evidence: `cardMetadata.json`
   entries already store id-keyed `.../front/<a>/<b>/<id>.jpg` URLs; the current
   build's face fallback retrieves an id-keyed front URL. To be verified against
   a real DFC in implementation before completion.
3. **`oracleId` stays on each printing entry.** Ladder rung 4 — dropping it adds
   loader complexity for a secondary gain; reconsidered only if measurement
   demands it, before Step 2.
4. **Step 2 (backend lookup) is deferred, not decided.** Ladder rung 5
   (preserve user-visible behavior / posture) and rung 6 (no new endpoint
   without authoritative scope); DEC-087 posture stands until a measured Step-1
   result justifies revisiting it.

## Where it lives (code touched by implementation)

- `scripts/build-card-prices.mjs` — emit the slim per-printing entries plus the
  `namesByOracleId` and `setNames` maps.
- `apps/frontend/src/lib/trade/loadCardPrices.ts` — the slim artifact type, the
  `derivePrintingImageUrl` helper, and accessor-path rehydration of
  `name`/`setName`/`imageUrl`.
- `apps/frontend/src/components/trade/oracleSearch.ts` — read names from
  `namesByOracleId`.
- Tests: `loadCardPrices.test.ts`, `pricing.test.ts`, `oracleSearch.test.ts`,
  `TradeBalancer*.test.tsx` updated to the slim fixtures with reconstruction
  asserted.
