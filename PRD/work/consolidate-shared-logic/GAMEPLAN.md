# GAMEPLAN — Consolidate Shared Logic and Remove Duplication

## Architecture

Pure refactor. No behavior, API, or prompt contract changes.

### Backend constants module (Slice A)

Create `apps/backend/src/constants.ts` as the single authoritative backend constants file.
Consolidate `orderedPlayerLabels` (three copies), `CANONICAL_ZONE_ORDER` (two copies), and
derive `NON_STACK_CANONICAL_ZONE_ORDER` from it via filter. Fix truncation duplication by
having `cardRulings.ts` import `truncateOracleText` from `prompt/normalization.ts` instead
of reimplementing `truncateWithSuffix`.

### Backend module split (Slice B — after A)

Split `apps/backend/src/prompt/normalization.ts` (470 lines, three mixed concerns) into
three focused files:

| File | Content |
|------|---------|
| `normalization.ts` | Exported constants, normalization fns (lines 66–100), conversation history helpers, zone scope/rulings section formatters, `buildPromptText` |
| `promptFormatting.ts` | ZONE_SECTION_LABEL, ZONE_ITEM_LABEL, `buildPlayerDisplayNameLookup`, `formatPlayerRef`, `toPlayerLabelIndex`, `formatTargets`, `formatGameContext`, `formatStackSection`, `formatNonStackZoneSections` |
| `promptDiagnostics.ts` | `PromptDiagnostics` type, `GetPromptDiagnosticsOptions` type, `estimatePromptChars`, `getPromptDiagnostics` |

External callers that import `getPromptDiagnostics` or `PromptDiagnostics` from `normalization.ts`
update their import path to the new `promptDiagnostics.ts`. `buildPromptText` (stays in
`normalization.ts`) gains imports from `promptFormatting.ts` for the display helpers it
delegates to.

### Rulings function collapse (Slice D — after A)

Collapse `resolveRulingsForPrompt` and `resolveRulingsForPromptWithDebug` in `cardRulings.ts`
into a single overloaded function with an optional `debug` flag:

```typescript
export function resolveRulingsForPrompt(cards, index, limits): ResolvedRulings
export function resolveRulingsForPrompt(cards, index, limits, debug: true): ResolvedRulingsWithDebug
export function resolveRulingsForPrompt(cards, index, limits, debug?: true): ResolvedRulings | ResolvedRulingsWithDebug
```

`prompt/preparation.ts` updates its import and call sites. `cardRulings.test.ts` retests
the non-debug path; add a minimal smoke test for the debug path if one is absent.

### Frontend EnrichmentStep extraction (Slice C — parallel to A)

Extract from `apps/frontend/src/components/EnrichmentStep.tsx` (689 lines):
- `parseManaSpent()` (line 47) and `formatContextTarget()` (line 54) → new
  `apps/frontend/src/lib/enrichmentUtils.ts`
- The ~10 `useState` hooks and wizard/card-animation state management → new
  `apps/frontend/src/hooks/useEnrichmentStep.ts`

Audit all frontend files for inline `playerLabel` algorithm usage (finding only; document
any inline usages found; no fixes in scope).

## Data flow

All changes are internal renames and moves. No public API shapes, HTTP contracts, prompt
formats, or observable product behaviors change.

## Parallel execution

| Slice | Parallel with | Blocked by |
|-------|--------------|------------|
| A | C | — |
| B | D | A |
| C | A | — |
| D | B | A |
| E | — | B + C + D |

## Verification checklist

- [ ] `npm run typecheck` green after each slice
- [ ] `npm run test` green after each slice
- [ ] `npm run quality:check` fully green after Slice E
- [ ] No new exports, API shapes, or prompt text added anywhere
- [ ] No remaining `truncateWithSuffix` symbol in `apps/backend/src/`
- [ ] No remaining `resolveRulingsForPromptWithDebug` symbol in `apps/backend/src/`
- [ ] `parseManaSpent` and `formatContextTarget` not defined inside `EnrichmentStep.tsx`
- [ ] `NON_STACK_CANONICAL_ZONE_ORDER` only defined in `constants.ts`; derived via filter
- [ ] `orderedPlayerLabels` only defined in `constants.ts`
