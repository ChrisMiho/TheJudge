# Slice A — Build-time newest-first printing order

## Status: done

## Goal

A card's printings sort newest release first when the price artifact is
built, so a picker's first row is a set a player recognizes instead of a
random Scryfall UUID.

## Requirements

1. In `scripts/build-card-detail-by-oracle-id.mjs`, sort each card's
   `printings` array by Scryfall `released_at` descending, then collector
   number (numeric-aware, ascending), then printing `id` as a final
   deterministic tiebreak. A printing with a missing or unparseable
   `released_at` sorts last.
2. `released_at` is read during ingest **only** to sort — it is never added
   to `buildPriceEntry`'s emitted field set (`id`, `set`, `setName`,
   `collectorNumber`, `usd`, `usdFoil`). The artifact's fields and size are
   unchanged.
3. Apply the `REQ-066` block from `GATE-QUESTIONS.md` to
   `PRD/sections/functional-requirements.md`, re-derived against the live
   file text in this worktree rather than replayed verbatim. `REQ-066`'s own
   text is entirely about build order (it also references "the manual picker
   lists every printing … in that emitted newest-first order", which is true
   the moment this slice ships), so it lands here. The
   `PRD/sections/trade-balancer/data/cardPrintingPrices.md` block also names
   this slice's ordering rule, but its second hunk describes the
   suggestion-tap fetch timing that Slice C ships — GAMEPLAN's sequencing
   table assigns that whole block to Slice C, not here.

## Acceptance criteria

- [ ] A1: `finalizePriceTransformState` sorts each oracle's printings by
      `released_at` descending, then numeric-aware collector number, then
      printing id — proven by a new unit test with printings whose
      `released_at`, collector number, and id order disagree.
- [ ] A2: A printing with a missing/unparseable `released_at` sorts last —
      proven by a unit test.
- [ ] A3: `buildPriceEntry`'s emitted field set is unchanged (`id`, `set`,
      `setName`, `collectorNumber`, `usd`, `usdFoil` — no `releasedAt` field)
      — proven by a unit test asserting the exact key set.
- [ ] A4: `scripts/lambda-package-budget.test.mjs` still passes (the sort
      adds no bytes to the committed artifact).
- [ ] A5: `REQ-066` in `PRD/sections/functional-requirements.md` is amended
      per `GATE-QUESTIONS.md`'s `REQ-066` block, re-derived against the live
      file text (Notes gain the rebuild-timing caveat: the committed artifact
      takes the new order at its next `data:build`/`data:refresh-pr`, since
      the Scryfall bulk source is absent from this worktree — A10).
- [ ] A6: `npm run test:scripts` is green.

## Verification

```bash
node --test scripts/build-card-detail-by-oracle-id.test.mjs
node --test scripts/lambda-package-budget.test.mjs
npm run test:scripts
```

## Files touched

- `scripts/build-card-detail-by-oracle-id.mjs`
- `scripts/build-card-detail-by-oracle-id.test.mjs`
- `PRD/sections/functional-requirements.md` (`REQ-066`)
