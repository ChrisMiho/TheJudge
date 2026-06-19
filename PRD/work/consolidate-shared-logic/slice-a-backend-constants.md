# Slice A — Backend constants module + truncation collapse

## Status: planned

## Goal

Create a single dependency-free `apps/backend/src/constants.ts` and route all duplicated player-label, zone-order, and fallback-question definitions through it; collapse the two truncation helpers into one defensive shared helper. No behavior change.

## Requirements

1. Create `apps/backend/src/constants.ts` as a **leaf module** — no `zod`, no `prompt/` imports — exporting:
   - `PLAYER_LABELS` — `readonly ["Player 1", … "Player 8"]` (`as const` tuple)
   - `CANONICAL_ZONE_ORDER` — `ZoneId[]` of the 7 zones incl. `stack`, in current order (`stack, battlefield, hand, graveyard, exile, library, command`)
   - `NON_STACK_CANONICAL_ZONE_ORDER` — **derived** as `CANONICAL_ZONE_ORDER.filter((z) => z !== "stack")`, typed `Array<Exclude<ZoneId, "stack">>`; do not re-list the zones
   - `DEFAULT_STACK_QUESTION = "Resolve the stack"`
   - `DEFAULT_BOARD_QUESTION = "Explain the interaction with the provided game state"`
2. Rewire `validation/askAiRequest.ts`: `playerLabelSchema = z.enum(PLAYER_LABELS)`; delete the `orderedPlayerLabels` const (`:15-24`) and use `PLAYER_LABELS` at the `expectedLabels` slice (`:173`). Both the enum type and the `superRefine` label check derive from the one array.
3. Rewire `prompt/normalization.ts`: import `CANONICAL_ZONE_ORDER` and `PLAYER_LABELS`; delete the local `CANONICAL_ZONE_ORDER` (`:39`) and `PLAYER_LABEL_ORDER` (`:20-29`). `toPlayerLabelIndex` (`:141`) now indexes `PLAYER_LABELS`.
4. Rewire `cardRulings.ts`: import `NON_STACK_CANONICAL_ZONE_ORDER`; delete the local copy (`:38`).
5. Rewire `prompt/context.ts`: import `NON_STACK_CANONICAL_ZONE_ORDER`, `DEFAULT_STACK_QUESTION`, `DEFAULT_BOARD_QUESTION`; delete the local copies (`:4-5`, `:7`).
6. Rewire `test-utils/requestBuilders.ts`: import `PLAYER_LABELS`; delete the inline label array (`:4-13`) and use `PLAYER_LABELS.slice(0, playerCount)`.
7. Truncation collapse: add the two defensive guards to `truncateOracleText` in `prompt/normalization.ts` so it becomes the superset helper:
   ```typescript
   if (value.length <= maxChars) return value;
   if (maxChars <= 0) return "";
   if (maxChars <= TRUNCATION_SUFFIX.length) return TRUNCATION_SUFFIX.slice(0, maxChars);
   const maxWithoutSuffix = Math.max(0, maxChars - TRUNCATION_SUFFIX.length);
   return `${value.slice(0, maxWithoutSuffix)}${TRUNCATION_SUFFIX}`;
   ```
   Then make `cardRulings.ts` import `truncateOracleText` from `./prompt/normalization.js` and delete `truncateWithSuffix` (`:48-64`); update its two call sites (`:170`, `:184`).
8. `EFFECTIVELY_UNLIMITED_CHARS` and all `MAX_*` budget consts stay exported from `prompt/normalization.ts` (DEC-042 export point untouched).

> The `truncateOracleText` import into `cardRulings.ts` is safe: `normalization.ts` still only **type-imports** `ResolvedRulings` from `cardRulings.ts`, and type imports are erased at compile time, so no runtime cycle is created. Slice B removes that type import from `normalization.ts` entirely.

## Acceptance criteria

- [ ] `apps/backend/src/constants.ts` exists with the five exports; `NON_STACK_CANONICAL_ZONE_ORDER` is a `.filter(...)` derivation, not a literal list
- [ ] `grep -rn "orderedPlayerLabels\|PLAYER_LABEL_ORDER" apps/backend/src` returns nothing
- [ ] `grep -rn "truncateWithSuffix" apps/backend/src` returns nothing
- [ ] `NON_STACK_CANONICAL_ZONE_ORDER` and the `DEFAULT_*_QUESTION` strings appear only in `constants.ts` (no copies in `cardRulings.ts` or `prompt/context.ts`)
- [ ] `playerLabelSchema` is built from `z.enum(PLAYER_LABELS)`
- [ ] `truncateOracleText` carries both the `maxChars <= 0` and `maxChars <= suffix.length` guards
- [ ] `constants.ts` imports neither `zod` nor anything under `prompt/`
- [ ] Backend typecheck and tests green

## Verification

```bash
npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test
grep -rn "orderedPlayerLabels\|PLAYER_LABEL_ORDER\|truncateWithSuffix" apps/backend/src
```

## Files touched

- `apps/backend/src/constants.ts` (new)
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/cardRulings.ts`
- `apps/backend/src/test-utils/requestBuilders.ts`
- Touched test files as needed (`cardRulings.test.ts`, `prompt/context.test.ts`, validation tests)
