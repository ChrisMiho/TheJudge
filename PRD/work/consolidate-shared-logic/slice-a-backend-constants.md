# Slice A — Backend constants module

## Status: planned

## Goal

Create `apps/backend/src/constants.ts` as the single authoritative source for shared
backend constants, eliminating three copies of `orderedPlayerLabels`, two copies of
`CANONICAL_ZONE_ORDER`/`NON_STACK_CANONICAL_ZONE_ORDER`, and the duplicate `truncateWithSuffix`
implementation in `cardRulings.ts`.

## Requirements

1. Create `apps/backend/src/constants.ts` exporting `orderedPlayerLabels`, `CANONICAL_ZONE_ORDER`,
   and `NON_STACK_CANONICAL_ZONE_ORDER` (derived from `CANONICAL_ZONE_ORDER` via `.filter()`).
2. `apps/backend/src/prompt/normalization.ts`: remove private `PLAYER_LABEL_ORDER` (lines 19–28)
   and private `CANONICAL_ZONE_ORDER` (lines 38–46); import and use the new exports from
   `../constants.js`. No other logic or export changes.
3. `apps/backend/src/validation/askAiRequest.ts`: remove private `orderedPlayerLabels` (lines 15–24);
   import from `../constants.js`. Use it exactly as before in `expectedLabels`.
4. `apps/backend/src/test-utils/requestBuilders.ts`: remove inline labels array (lines 4–13);
   import `orderedPlayerLabels` from `../constants.js`; use `orderedPlayerLabels.slice(0, playerCount)`.
5. `apps/backend/src/cardRulings.ts`:
   a. Remove `NON_STACK_CANONICAL_ZONE_ORDER` (lines 38–45); import from `../constants.js`.
   b. Remove `truncateWithSuffix` (lines 48–64); import `truncateOracleText` from
      `./prompt/normalization.js` and replace all three call sites with `truncateOracleText`.
6. Zero behavior changes — all existing logic operates identically.

## Acceptance criteria

- [ ] `apps/backend/src/constants.ts` exists and exports `orderedPlayerLabels`, `CANONICAL_ZONE_ORDER`,
      `NON_STACK_CANONICAL_ZONE_ORDER` where the last is derived: `CANONICAL_ZONE_ORDER.filter(z => z !== "stack")`
- [ ] `grep -r "truncateWithSuffix" apps/backend/src/` returns no results
- [ ] `grep -rn "PLAYER_LABEL_ORDER" apps/backend/src/` returns no results (private name retired)
- [ ] `NON_STACK_CANONICAL_ZONE_ORDER` defined only in `constants.ts` (grep confirms single definition)
- [ ] `orderedPlayerLabels` defined only in `constants.ts` (grep confirms single definition)
- [ ] `npm run typecheck` exits 0
- [ ] `npm run test` exits 0

## Verification

```bash
grep -r "truncateWithSuffix" apps/backend/src/
grep -r "PLAYER_LABEL_ORDER" apps/backend/src/
grep -rn "NON_STACK_CANONICAL_ZONE_ORDER" apps/backend/src/
grep -rn "orderedPlayerLabels" apps/backend/src/
npm run typecheck
npm run test
```

## Files touched

- NEW `apps/backend/src/constants.ts`
- MOD `apps/backend/src/prompt/normalization.ts`
- MOD `apps/backend/src/validation/askAiRequest.ts`
- MOD `apps/backend/src/test-utils/requestBuilders.ts`
- MOD `apps/backend/src/cardRulings.ts`

## Notes

`truncateOracleText` and `truncateWithSuffix` differ slightly at very small `maxChars` values
(≤ suffix length). This edge case is not exercised by any existing test or realistic call site.
Verify `npm run test` stays green; no behavior fixup needed.
