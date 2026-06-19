# GAMEPLAN — Consolidate Shared Logic and Remove Duplication

> Regenerated 2026-06-18 at map-out against current code (supersedes the 2026-06-09 copy with stale line numbers and 3-way split). Aligned with the re-refined `DESIGN-BRIEF.md` / `README.md`.

## Architecture

Pure refactor. Zero behavior, API, or prompt-contract changes (DEC-013, DEC-020, DEC-021, DEC-042). Consolidation happens **within each app's boundary**; cross-app FE↔BE mirroring stays accepted debt (no shared npm package, per `technical-design-rules.md`).

The only durable doc change is one bullet added to `PRD/instructions/technical-design-rules.md` (reuse-before-create). No `sections/` REQ/FLOW/DEC entries change.

### Backend constants module (Slice A)

Create `apps/backend/src/constants.ts` as a **dependency-free leaf** (no `zod`, no `prompt/` imports). Consolidate:

| Symbol | Definition | Replaces |
|--------|-----------|----------|
| `PLAYER_LABELS` | readonly tuple `Player 1`…`Player 8` | `askAiRequest.ts:5-14` enum + `:15-24` `orderedPlayerLabels`; `normalization.ts:20-29` `PLAYER_LABEL_ORDER`; `test-utils/requestBuilders.ts:4-13` |
| `CANONICAL_ZONE_ORDER` | 7 zones incl. `stack` | `normalization.ts:39` |
| `NON_STACK_CANONICAL_ZONE_ORDER` | **derived** `CANONICAL_ZONE_ORDER.filter(z => z !== "stack")` — not re-listed | `cardRulings.ts:38`; `prompt/context.ts:7` |
| `DEFAULT_STACK_QUESTION`, `DEFAULT_BOARD_QUESTION` | backend fallback strings | `prompt/context.ts:4-5` |

Truncation collapse: `cardRulings.ts` imports `truncateOracleText` from `prompt/normalization.ts` and deletes its own `truncateWithSuffix`. The two are **not** identical — `truncateWithSuffix` guards `maxChars <= 0` and `maxChars <= suffix.length`; `truncateOracleText` does not. The single retained helper must carry the **defensive (superset) semantics**, so `truncateOracleText` gains those two guards. Output is unchanged today (all `MAX_*` ≥ 100,000, so guarded branches never fire) — a deliberate safe-superset consolidation, not a behavior change.

> Type-only cycle note: during Slice A (before the Slice B split) `normalization.ts` still type-imports `ResolvedRulings` from `cardRulings.ts` while `cardRulings.ts` runtime-imports `truncateOracleText` from `normalization.ts`. Type-only imports are erased at compile time, so there is no runtime cycle. The split in Slice B removes the type import from `normalization.ts` entirely.

### Backend module split (Slice B — after A)

Split `apps/backend/src/prompt/normalization.ts` (485 lines) into four cohesive files under `apps/backend/src/prompt/`:

| File | Holds |
|------|-------|
| `normalization.ts` | `normalizeWhitespace`, `truncateOracleText`, `normalizeQuestion`, `normalizeCardText`, `truncateConversationHistory`; `MAX_*` / `EFFECTIVELY_UNLIMITED_CHARS` / `PROMPT_BUDGET_NEAR_LIMIT_BUFFER` budget consts; private `TRUNCATION_SUFFIX`. **Stays the export point** for DEC-042 + `technical-design-rules.md` |
| `promptFormatting.ts` | `formatPlayerRef`, `buildPlayerDisplayNameLookup`, `toPlayerLabelIndex`, `formatTargets`, `formatGameContext`, `formatZoneCardMetadataLines`, `formatStackSection`, `formatNonStackZoneSections`, `formatOfficialRulingsSection`, `formatSupplementalRulesSection`, `formatConversationHistorySection`, `buildZoneScopeSentence`, `SYSTEM_ROLE_PREAMBLE_LINES`, `ZONE_SECTION_LABEL`, `ZONE_ITEM_LABEL`, private `formatList` / `truncatePromptLabel` / `SUPPLEMENTAL_RULES_DISCLAIMER` |
| `promptDiagnostics.ts` | `PromptDiagnostics` type, `GetPromptDiagnosticsOptions`, `getPromptDiagnostics`, `estimatePromptChars` |
| `promptAssembly.ts` | `buildPromptText`, `BuildPromptTextOptions` |

**Dependency DAG (no cycles):** `constants.ts` ← `normalization.ts` ← `promptFormatting.ts` / `promptDiagnostics.ts` ← `promptAssembly.ts`.

**Import paths to update** (callers of moved symbols):

- `types/index.ts:16` — `type PromptDiagnostics` → `./promptDiagnostics.js`
- `prompt/preparation.ts:17-27` — split: budget consts + `truncateConversationHistory` stay `./normalization.js`; `formatSupplementalRulesSection` → `./promptFormatting.js`; `getPromptDiagnostics` + `PromptDiagnostics` → `./promptDiagnostics.js`; `buildPromptText` → `./promptAssembly.js`
- `eval/contextEvaluationHarness.ts` + `.test.ts`, `mockAskAi.test.ts`, `app.budget.test.ts`, `prompt/normalization.test.ts`, `prompt/context.test.ts` — repoint each symbol to its new file
- New colocated test files may be added for `promptFormatting` / `promptDiagnostics` / `promptAssembly`; existing `normalization.test.ts` keeps only the pure-helper coverage

### Rulings function collapse (Slice D — after A, parallel to B)

Collapse `resolveRulingsForPrompt` (`cardRulings.ts:154-197`) and `resolveRulingsForPromptWithDebug` (`:199-257`) into one function with an optional debug flag (the debug variant is a strict superset that additionally collects trace). Overload signature so callers keep precise return types:

```typescript
export function resolveRulingsForPrompt(cards, index, limits): ResolvedRulings;
export function resolveRulingsForPrompt(cards, index, limits, debug: true): ResolvedRulingsWithDebug;
```

`prompt/preparation.ts:62` (debug call) and `:90` (non-debug call) update to the single function. `cardRulings.test.ts` retains coverage for both paths.

### Frontend EnrichmentStep extraction (Slice C — parallel to A)

From `apps/frontend/src/components/EnrichmentStep.tsx` (689 lines):

- Embedded utilities `parseManaSpent` (`:47`), `formatContextTarget` (`:54`), `hasOwnerControl` (`:63`) → new `apps/frontend/src/lib/enrichmentFormat.ts`
- Pending-target state cluster (`pendingKindByKey`, `pendingPlayerByKey`, `pendingCardIdByKey`, `pendingOtherByKey` + their getter/add/remove handlers) → new `apps/frontend/src/hooks/useEnrichmentTargets.ts`

Audit all frontend code that displays player names: confirm it imports `lib/playerLabels.ts` rather than inlining the trim/length/fallback algorithm. **Finding-only** — document inline usages; no fixes in this package.

## Data flow

All changes are internal renames/moves. No HTTP contract, `GameContext` model, prompt text, or observable behavior changes anywhere.

## Parallel execution

| Slice | Parallel with | Blocked by |
|-------|--------------|------------|
| A | C | — |
| B | D | A |
| C | A | — |
| D | B | A |
| E | — | B + C + D |

## Verification checklist

- [ ] `npm --workspace apps/backend run typecheck` green after A, B, D
- [ ] `npm --workspace apps/frontend run typecheck` green after C
- [ ] `npm --workspace apps/backend run test` green after A, B, D
- [ ] `npm --workspace apps/frontend run test` green after C
- [ ] `npm run quality:check` fully green after Slice E
- [ ] No new public exports, API shapes, or prompt text added anywhere
- [ ] `truncateWithSuffix` symbol gone from `apps/backend/src/`
- [ ] `resolveRulingsForPromptWithDebug` symbol gone from `apps/backend/src/`
- [ ] `orderedPlayerLabels` / `PLAYER_LABEL_ORDER` symbols gone; only `PLAYER_LABELS` in `constants.ts`
- [ ] `NON_STACK_CANONICAL_ZONE_ORDER` defined once (derived via filter) in `constants.ts`; no copy in `cardRulings.ts` or `prompt/context.ts`
- [ ] `parseManaSpent`, `formatContextTarget`, `hasOwnerControl` not defined inside `EnrichmentStep.tsx`
- [ ] `prompt/normalization.ts` no longer holds formatters, diagnostics, or `buildPromptText`
