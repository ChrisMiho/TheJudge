# Slice D — Frontend balancer flow & cleanup

## Status: done

## Note — pricing.ts and pricing.test.ts needed a minimal, forced edit

"pricing.ts is untouched" (D6/D10) holds for its actual pricing math: every
function body in `apps/frontend/src/lib/trade/pricing.ts`
(`entryUnitPrice`/`entryHasMissingPrice`/`entryContribution`/`sideTotal`/
`difference`/`formatUsd`) and the `TradeEntry` type shape are byte-identical
to before this slice. The one line that had to change is the `import type {
CardPrintingPrice } from "./loadCardPrices"` at the top — `loadCardPrices.ts`
is deleted by this same slice (D2), so the import now points at
`./fetchCardPrintings`, which exports a `CardPrintingPrice` with the fields
`pricing.ts` actually reads (`id`, `usd`, `usdFoil`) but without the
`oracleId`/`name`/`imageUrl` fields the new backend route no longer sends
per printing (REQ-066/REQ-175, Slice A/B — already-shipped, real product
truth this slice cannot re-litigate). `pricing.test.ts` needed the matching
import-path fix plus its local `printing()` fixture's three now-nonexistent
fields removed (TypeScript excess-property-checks an object literal against
the new narrower type) — every test case, assertion, and expected value in
that file is unchanged.

## Note — the printing picker gains its first image (not a preservation)

D8 and several upstream docs (DESIGN-BRIEF, GATE-QUESTIONS, `cardImage.ts`'s
own Slice C comment) describe the printing picker as disambiguating by "set,
collector number, and a working image" as if preserving existing behavior.
The actual pre-Slice-D code (`PrintingPicker.tsx`, `TradeEntryRow.tsx`) never
rendered an image anywhere in the Trade Balancer — text-only rows. This slice
adds the image (via `deriveCardImageUrl`, Slice C's helper) to both the
printing picker and the resolved entry row, fulfilling D8 and the documented
intent for real, rather than leaving the doc wrong or skipping the criterion.
Covered by a dedicated test in `TradeBalancer.test.tsx` asserting two
different printings of the same card render two different images.

## Note — manual search now adds immediately, then lets the player change printing

The pre-existing manual-search flow picked a printing from a pre-loaded bulk
list *before* the card was added. Since prices are no longer bulk-loaded
(FLOW-025), that pre-add picker step is gone: a suggestion click adds the card
immediately, defaulting to whichever printing the on-add fetch returns first,
with a brief loading state. The player reaches the same picker afterward via
the entry's existing "Change printing" affordance (unchanged UI, now the only
path to it) if the default isn't the printing they want. This mirrors how
scan already worked (scan always added directly, changeable after) and is
required by fetching per-card on add rather than having all prices in hand
up front.

## Goal

The balancer opens with only the shared `cardMetadata` index up front; adding
a card fetches that card's printings and prices from the new backend route
and caches them per session; the ~38 MB `cardPrintingPrices.json` and its
frontend loader are deleted; every other player-visible behavior (foil
toggle, quantity, $0-plus-caution, printing picker) is unchanged.

## Requirements

1. Add `apps/frontend/src/lib/trade/fetchCardPrintings.ts`, mirroring
   `apps/frontend/src/lib/cardDetail.ts`'s module-level cache pattern exactly:
   a `Map` cache keyed by oracle id, in-flight-promise dedupe, a 404 cached as
   an empty/absent result, and a failed fetch removed from the cache so a
   retry re-fetches. Fetches `${apiBaseUrl}/api/cards/${encodeURIComponent(oracleId)}/prices`.
2. Retire `apps/frontend/src/lib/trade/loadCardPrices.ts` and
   `loadCardPrices.test.ts`; port any assertions still relevant (printing
   lookup by id, per-oracle listing) into tests for the new module.
3. Update `oracleSearch.ts`'s `buildOracleSearchIndex` to build its search
   index from the shared `cardMetadata` list (name, oracle id) instead of
   `CardPrices`/`byOracleId` — search/autocomplete no longer needs price data.
4. Update `useTradeScan.ts`'s scan-preview metadata builder to read name,
   image (via the Slice C image-derive helper), and `colors` directly from
   `cardMetadata` instead of synthesizing them from the price artifact (this
   also fixes today's hardcoded `colors: []` gap, since `cardMetadata` carries
   real colors).
5. Wire the card-add path (wherever a `TradeEntry` is created) to call
   `fetchCardPrintings(oracleId)` on add, show a brief in-place loading state
   on that entry while it resolves, and cache the result for the session
   (FLOW-025). On fetch failure, the entry degrades to the existing
   $0-plus-caution treatment with a retry affordance (mirrors FLOW-024 and
   the existing FLOW-009 load-failure edge) rather than a broken row.
6. Update the printing picker to list every printing from the fetched
   `printings` array (`id, set, setName, collectorNumber, usd, usdFoil`)
   instead of `CardPrices.listPrintingsForOracle`; each printing's displayed
   image derives from its `id` via the Slice C helper. A scanned printing
   still prices directly by matching the scanned printing id against the
   fetched list.
7. Delete `apps/frontend/public/data/cardPrintingPrices.json`. Grep the
   frontend source, tests, and `PRD/sections/trade-balancer/` docs for any
   remaining reference to it or to the retired `loadCardPrices` module and
   resolve every hit.
8. Update the existing trade-balancer tests (`oracleSearch.test.ts`,
   `TradeBalancer.test.tsx`, `TradeBalancer.scan.test.tsx`, and the
   printing-picker test) to the new shared-index + backend-fetch shape,
   asserting: a null `usd`/`usdFoil` still renders $0-plus-caution; the
   picker still disambiguates by set, collector number, and a working
   (derived) image; a failed price fetch degrades to $0-plus-caution with
   retry; `pricing.ts` itself is untouched.
9. Apply the REQ-064, REQ-065, FLOW-009, FLOW-025 (new), NFR-013, and
   NFR-014 diffs from `GATE-QUESTIONS.md` to
   `PRD/sections/functional-requirements.md`, `PRD/sections/user-flows.md`,
   and `PRD/sections/non-functional-requirements.md` verbatim.
10. Update the remaining derived, non-authoritative docs named for this
    layer: `sections/trade-balancer/data/cardPrintingPrices.md` (retire or
    rewrite to describe the backend-served artifact, pointing at REQ-066 /
    REQ-175) and the "Prices and freshness" / "Contract posture" bullets in
    `sections/trade-balancer/README.md`, plus `sections/system-map.md`'s
    trade-balancer file list (drop the deleted frontend file, add the
    backend price artifact — the build-entry half already landed in Slice A).

## Acceptance criteria

- [x] D1: `apps/frontend/src/lib/trade/fetchCardPrintings.ts` exists and
      mirrors `cardDetail.ts`'s cache/dedupe/404/retry-on-failure pattern,
      asserted by a new test suite for the module.
- [x] D2: `apps/frontend/src/lib/trade/loadCardPrices.ts` and its test are
      deleted; `grep -r "loadCardPrices" apps/frontend/src` returns no hits.
- [x] D3: `oracleSearch.ts`'s search index is built from `cardMetadata`, not
      price data — `oracleSearch.test.ts` passes with the updated source.
- [x] D4: `useTradeScan.ts`'s scan-preview metadata reads name/image/colors
      from `cardMetadata` (no hardcoded empty `colors`) — covered by
      `TradeBalancer.scan.test.tsx`.
- [x] D5: Adding a card to a side triggers a `fetchCardPrintings` call, shows
      a brief loading state, and caches the result for the session so
      re-adding the same card makes no second request — asserted by
      `TradeBalancer.test.tsx`.
- [x] D6: A printing with a null `usd`/`usdFoil` for the selected foil mode
      still renders the $0-plus-caution treatment (unchanged `pricing.ts`
      behavior) — asserted by an updated component test. See the Note above:
      `pricing.ts`'s math/type shape is unchanged; only its import path
      (forced by D2's deletion) changed.
- [x] D7: A failed price fetch degrades the entry to $0-plus-caution with a
      retry affordance, and retrying re-fetches (the failed result was not
      cached) — asserted by a component test.
- [x] D8: The printing picker still disambiguates printings by set, collector
      number, and a working (id-derived) image, sourced from the fetched
      printings list — asserted by an updated component test. See the Note
      above: the image is new, not preserved (the prior code rendered none).
- [x] D9: `apps/frontend/public/data/cardPrintingPrices.json` no longer
      exists; `grep -rn "cardPrintingPrices" apps/frontend/src
      apps/frontend/public` returns no hits.
- [x] D10: The frontend test suite (`npm test` in `apps/frontend`) passes in
      full (regression: `pricing.test.ts` unchanged and green — see the Note
      above on its one forced import-path fix).
- [x] D11: `PRD/sections/functional-requirements.md` (REQ-064, REQ-065),
      `PRD/sections/user-flows.md` (FLOW-009, FLOW-025), and
      `PRD/sections/non-functional-requirements.md` (NFR-013, NFR-014) match
      their `GATE-QUESTIONS.md` diffs' `+` lines byte-for-byte.
- [x] D12: `PRD/sections/trade-balancer/README.md`'s "Prices and
      freshness"/"Contract posture" bullets and
      `PRD/sections/system-map.md`'s trade-balancer file list describe the
      backend-served price route, with no live reference remaining to
      `cardPrintingPrices.json` as a current frontend artifact. Also swept
      (beyond this criterion's literal scope, for corpus consistency):
      `sections/overview.md` and `sections/integrations-and-data.md`'s
      `CardPrintingPrice` shape and "Trade Balancer Data Strategy" section,
      which were still describing the deleted frontend artifact.

## Verification

```bash
npm test --workspace apps/frontend
grep -rn "cardPrintingPrices" apps/frontend/src apps/frontend/public
grep -rn "loadCardPrices" apps/frontend/src
```

## Files touched

- `apps/frontend/src/lib/trade/fetchCardPrintings.ts` (new)
- `apps/frontend/src/lib/trade/fetchCardPrintings.test.ts` (new)
- `apps/frontend/src/lib/trade/loadCardPrices.ts` (deleted)
- `apps/frontend/src/lib/trade/loadCardPrices.test.ts` (deleted)
- `apps/frontend/src/lib/trade/pricing.ts` (import path only — see Note above)
- `apps/frontend/src/lib/trade/pricing.test.ts` (import path + fixture fields — see Note above)
- `apps/frontend/src/components/trade/oracleSearch.ts`
- `apps/frontend/src/components/trade/oracleSearch.test.ts`
- `apps/frontend/src/components/trade/useTradeScan.ts`
- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/trade/TradeSide.tsx`
- `apps/frontend/src/components/trade/TradeEntryRow.tsx` (adds the entry image and the loading/error/retry UI)
- `apps/frontend/src/components/trade/PrintingPicker.tsx` (adds the per-printing image)
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.scan.test.tsx`
- `apps/frontend/public/data/cardPrintingPrices.json` (deleted)
- `PRD/sections/functional-requirements.md` (REQ-064, REQ-065)
- `PRD/sections/user-flows.md` (FLOW-009, FLOW-025)
- `PRD/sections/non-functional-requirements.md` (NFR-013, NFR-014)
- `PRD/sections/trade-balancer/README.md`
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
- `PRD/sections/system-map.md`
- `PRD/sections/overview.md` (Trade Balancer paragraph, beyond D12's literal scope — see checklist note)
- `PRD/sections/integrations-and-data.md` (`CardPrintingPrice` shape + "Trade Balancer Data Strategy" section, beyond D12's literal scope)

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change (the new
      `GET /api/cards/:oracleId/prices` route is the scoped addition; the
      rules route and `POST /api/ask-ai` contract are untouched)
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/trade-balancer-price-slim/` ready
      to delete (all ten accepted GATE-QUESTIONS.md ids applied to
      PRD/sections/ across slices A-D; cleanup should find nothing left to
      promote)
