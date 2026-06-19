# Slice D — Rulings function collapse

## Status: planned

## Blocked by: Slice A (truncation helper consolidation lands first; parallel to Slice B)

## Goal

Collapse `resolveRulingsForPrompt` (`cardRulings.ts:154-197`) and `resolveRulingsForPromptWithDebug` (`:199-257`) into a single overloaded function with an optional `debug` flag. The debug variant is a strict superset that additionally collects trace; no change to the resolution algorithm or its output.

## Requirements

1. Replace the two exported functions in `cardRulings.ts` with one overloaded implementation:
   ```typescript
   export function resolveRulingsForPrompt(
     cards: PromptRulingCard[], index: Map<string, RulingEntry[]>, limits: RulingLimits
   ): ResolvedRulings;
   export function resolveRulingsForPrompt(
     cards: PromptRulingCard[], index: Map<string, RulingEntry[]>, limits: RulingLimits, debug: true
   ): ResolvedRulingsWithDebug;
   export function resolveRulingsForPrompt(
     cards: PromptRulingCard[], index: Map<string, RulingEntry[]>, limits: RulingLimits, debug?: true
   ): ResolvedRulings | ResolvedRulingsWithDebug
   ```
   The body always runs the core resolution loop; when `debug === true` it also collects `cardsConsidered`, `cardsIncluded`, `cardsSkippedNoMatch`, `sectionTruncated` and returns `ResolvedRulingsWithDebug`. The non-debug path returns `{ cards, sectionChars }` exactly as today (no `debug` key).
2. Update `prompt/preparation.ts`: drop `resolveRulingsForPromptWithDebug` from the import (`:4`); change the debug call (`:62`) to `resolveRulingsForPrompt(cardsForRulings, options.cardRulingsIndex ?? new Map(), limits, true)`; leave the non-debug call (`:90`) as-is.
3. Update `cardRulings.test.ts`: remove any `resolveRulingsForPromptWithDebug` import; keep non-debug coverage; ensure at least one test exercises the `debug: true` path and asserts the debug fields populate.
4. Zero behavior change to resolution output (debug and non-debug results identical to current functions for the same inputs).

## Acceptance criteria

- [ ] `grep -rn "resolveRulingsForPromptWithDebug" apps/backend/src` returns nothing
- [ ] `preparation.ts:62` calls `resolveRulingsForPrompt(..., true)`; `:90` keeps the 3-arg call
- [ ] `cardRulings.test.ts` exercises both the debug and non-debug paths
- [ ] Non-debug return shape unchanged (no stray `debug` key)
- [ ] Backend typecheck and tests green

## Verification

```bash
npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test
grep -rn "resolveRulingsForPromptWithDebug" apps/backend/src
grep -n "resolveRulingsForPrompt" apps/backend/src/prompt/preparation.ts
```

## Files touched

- `apps/backend/src/cardRulings.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/cardRulings.test.ts`
