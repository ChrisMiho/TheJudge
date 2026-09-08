# Slice D — Frontend balancer flow & cleanup

## Status: planned

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

- [ ] D1: `apps/frontend/src/lib/trade/fetchCardPrintings.ts` exists and
      mirrors `cardDetail.ts`'s cache/dedupe/404/retry-on-failure pattern,
      asserted by a new test suite for the module.
- [ ] D2: `apps/frontend/src/lib/trade/loadCardPrices.ts` and its test are
      deleted; `grep -r "loadCardPrices" apps/frontend/src` returns no hits.
- [ ] D3: `oracleSearch.ts`'s search index is built from `cardMetadata`, not
      price data — `oracleSearch.test.ts` passes with the updated source.
- [ ] D4: `useTradeScan.ts`'s scan-preview metadata reads name/image/colors
      from `cardMetadata` (no hardcoded empty `colors`) — covered by
      `TradeBalancer.scan.test.tsx`.
- [ ] D5: Adding a card to a side triggers a `fetchCardPrintings` call, shows
      a brief loading state, and caches the result for the session so
      re-adding the same card makes no second request — asserted by
      `TradeBalancer.test.tsx`.
- [ ] D6: A printing with a null `usd`/`usdFoil` for the selected foil mode
      still renders the $0-plus-caution treatment (unchanged `pricing.ts`
      behavior) — asserted by an updated component test.
- [ ] D7: A failed price fetch degrades the entry to $0-plus-caution with a
      retry affordance, and retrying re-fetches (the failed result was not
      cached) — asserted by a component test.
- [ ] D8: The printing picker still disambiguates printings by set, collector
      number, and a working (id-derived) image, sourced from the fetched
      printings list — asserted by an updated component test.
- [ ] D9: `apps/frontend/public/data/cardPrintingPrices.json` no longer
      exists; `grep -rn "cardPrintingPrices" apps/frontend/src
      apps/frontend/public` returns no hits.
- [ ] D10: The frontend test suite (`npm test` in `apps/frontend`) passes in
      full (regression: `pricing.test.ts` unchanged and green).
- [ ] D11: `PRD/sections/functional-requirements.md` (REQ-064, REQ-065),
      `PRD/sections/user-flows.md` (FLOW-009, FLOW-025), and
      `PRD/sections/non-functional-requirements.md` (NFR-013, NFR-014) match
      their `GATE-QUESTIONS.md` diffs' `+` lines byte-for-byte.
- [ ] D12: `PRD/sections/trade-balancer/README.md`'s "Prices and
      freshness"/"Contract posture" bullets and
      `PRD/sections/system-map.md`'s trade-balancer file list describe the
      backend-served price route, with no live reference remaining to
      `cardPrintingPrices.json` as a current frontend artifact.

## Verification

```bash
npm test --workspace apps/frontend
grep -rn "cardPrintingPrices" apps/frontend/src apps/frontend/public
grep -rn "loadCardPrices" apps/frontend/src
```

## Files touched

- `apps/frontend/src/lib/trade/fetchCardPrintings.ts` (new)
- `apps/frontend/src/lib/trade/loadCardPrices.ts` (deleted)
- `apps/frontend/src/lib/trade/loadCardPrices.test.ts` (deleted)
- `apps/frontend/src/components/trade/oracleSearch.ts`
- `apps/frontend/src/components/trade/oracleSearch.test.ts`
- `apps/frontend/src/components/trade/useTradeScan.ts`
- Printing picker component (path confirmed via grep, e.g.
  `apps/frontend/src/components/trade/PrintingPicker.tsx`)
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.scan.test.tsx`
- `apps/frontend/public/data/cardPrintingPrices.json` (deleted)
- `PRD/sections/functional-requirements.md` (REQ-064, REQ-065)
- `PRD/sections/user-flows.md` (FLOW-009, FLOW-025)
- `PRD/sections/non-functional-requirements.md` (NFR-013, NFR-014)
- `PRD/sections/trade-balancer/README.md`
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
- `PRD/sections/system-map.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change (the new
      `GET /api/cards/:oracleId/prices` route is the scoped addition; the
      rules route and `POST /api/ask-ai` contract are untouched)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/trade-balancer-price-slim/` ready
      to delete
