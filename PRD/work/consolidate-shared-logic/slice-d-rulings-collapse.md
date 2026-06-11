# Slice D — Rulings function collapse

## Status: planned

## Goal

Collapse `resolveRulingsForPrompt` and `resolveRulingsForPromptWithDebug` in
`apps/backend/src/cardRulings.ts` into a single overloaded function with an optional
`debug` flag, eliminating the duplicated resolution algorithm.

## Requirements

1. Replace the two exported functions in `cardRulings.ts` (lines 154–257) with a single
   overloaded implementation:

   ```typescript
   export function resolveRulingsForPrompt(
     cards: PromptRulingCard[],
     index: Map<string, RulingEntry[]>,
     limits: RulingLimits
   ): ResolvedRulings;
   export function resolveRulingsForPrompt(
     cards: PromptRulingCard[],
     index: Map<string, RulingEntry[]>,
     limits: RulingLimits,
     debug: true
   ): ResolvedRulingsWithDebug;
   export function resolveRulingsForPrompt(
     cards: PromptRulingCard[],
     index: Map<string, RulingEntry[]>,
     limits: RulingLimits,
     debug?: true
   ): ResolvedRulings | ResolvedRulingsWithDebug
   ```

   The implementation merges both bodies: always runs the core resolution algorithm;
   when `debug === true`, also collects `cardsConsidered`, `cardsIncluded`,
   `cardsSkippedNoMatch`, and `sectionTruncated`, returning a `ResolvedRulingsWithDebug`.

2. Update `apps/backend/src/prompt/preparation.ts`:
   - Remove `resolveRulingsForPromptWithDebug` from the import list.
   - Replace the debug call (line 60) with `resolveRulingsForPrompt(..., true)`.

3. Update `apps/backend/src/cardRulings.test.ts`:
   - Remove `resolveRulingsForPromptWithDebug` from import if it was imported.
   - Existing tests of the non-debug path require no structural changes.
   - Add or confirm there is at least one test exercising the `debug: true` path to verify
     debug fields are populated.

4. Zero behavior changes to the resolution algorithm.

## Acceptance criteria

- [ ] `grep -r "resolveRulingsForPromptWithDebug" apps/backend/src/` returns no results
- [ ] `preparation.ts` calls `resolveRulingsForPrompt(cardsForRulings, ..., true)` for the
      debug path (manual inspect)
- [ ] `cardRulings.test.ts` exercises the debug path at least once
- [ ] `npm run typecheck` exits 0
- [ ] `npm run test` exits 0

## Verification

```bash
grep -r "resolveRulingsForPromptWithDebug" apps/backend/src/
# Should return 0 lines

grep -n "resolveRulingsForPrompt" apps/backend/src/prompt/preparation.ts
# Should show only one import line and two call sites (debug=true and non-debug)

npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test
```

## Files touched

- MOD `apps/backend/src/cardRulings.ts`
- MOD `apps/backend/src/prompt/preparation.ts`
- MOD `apps/backend/src/cardRulings.test.ts`
