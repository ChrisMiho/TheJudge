# Slice B — Backend prompt module split (4-way)

## Status: planned

## Blocked by: Slice A (constants module + truncation collapse must land first)

## Goal

Split `apps/backend/src/prompt/normalization.ts` (485 lines, now the prompt-assembly hub) into four cohesive files, leaving `normalization.ts` a pure text/normalization + budget-constants leaf. No behavior change.

## Requirements

1. Create `apps/backend/src/prompt/promptFormatting.ts` with the section formatters and their private helpers:
   `formatPlayerRef`, `buildPlayerDisplayNameLookup`, `toPlayerLabelIndex`, `formatTargets`, `formatGameContext`, `formatZoneCardMetadataLines`, `formatStackSection`, `formatNonStackZoneSections`, `formatOfficialRulingsSection`, `formatSupplementalRulesSection`, `formatConversationHistorySection`, `buildZoneScopeSentence`, `SYSTEM_ROLE_PREAMBLE_LINES`, `ZONE_SECTION_LABEL`, `ZONE_ITEM_LABEL`, plus the private `formatList`, `truncatePromptLabel`, `SUPPLEMENTAL_RULES_DISCLAIMER`. Imports: `truncateOracleText` + `MAX_*` from `./normalization.js`; `PLAYER_LABELS` + `CANONICAL_ZONE_ORDER` from `../constants.js`; types from `../cardRulings.js`, `../gameRules.js`, `../gameRulesRetrieval.js`, `../types/index.js`.
2. Create `apps/backend/src/prompt/promptDiagnostics.ts` with: `PromptDiagnostics` type, `GetPromptDiagnosticsOptions` type, `getPromptDiagnostics`, `estimatePromptChars`. Imports `MAX_PROMPT_CHAR_BUDGET` + `PROMPT_BUDGET_NEAR_LIMIT_BUFFER` from `./normalization.js`; types from `../cardRulings.js`, `../gameRules.js`, `../gameRulesRetrieval.js`.
3. Create `apps/backend/src/prompt/promptAssembly.ts` with `buildPromptText` + `BuildPromptTextOptions`. Imports formatters + `SYSTEM_ROLE_PREAMBLE_LINES` from `./promptFormatting.js`; `truncateConversationHistory` + `MAX_CONVERSATION_HISTORY_CHARS` from `./normalization.js`; `formatGameRulesSection` from `../gameRules.js`; `getPhaseGuidance` from `./phaseGuidance.js`; `MTG_PROMPT_REFERENCE` from `./mtgReference.js`.
4. Reduce `apps/backend/src/prompt/normalization.ts` to a pure leaf: `normalizeWhitespace`, `truncateOracleText`, `normalizeQuestion`, `normalizeCardText`, `truncateConversationHistory`; the `MAX_*` / `EFFECTIVELY_UNLIMITED_CHARS` / `PROMPT_BUDGET_NEAR_LIMIT_BUFFER` budget consts; private `TRUNCATION_SUFFIX`. Remove the `ResolvedRulings` / `GameRulesTopic` / `RetrievedGameRule` / `PromptContext` type imports that are no longer used here.
5. Update all import sites for moved symbols:
   - `types/index.ts:16` — `type PromptDiagnostics` → `../prompt/promptDiagnostics.js`
   - `prompt/preparation.ts` — `formatSupplementalRulesSection` → `./promptFormatting.js`; `getPromptDiagnostics` + `type PromptDiagnostics` → `./promptDiagnostics.js`; `buildPromptText` → `./promptAssembly.js`; keep budget consts + `truncateConversationHistory` on `./normalization.js`
   - `eval/contextEvaluationHarness.ts` + `.test.ts`, `mockAskAi.test.ts`, `app.budget.test.ts`, `prompt/normalization.test.ts`, `prompt/context.test.ts` — repoint each imported symbol to its new file
6. Optionally add colocated `promptFormatting.test.ts` / `promptDiagnostics.test.ts` / `promptAssembly.test.ts`; leave `normalization.test.ts` covering only the pure helpers it still owns.

**Dependency DAG (must stay acyclic):** `constants.ts` ← `normalization.ts` ← `promptFormatting.ts` / `promptDiagnostics.ts` ← `promptAssembly.ts`.

## Acceptance criteria

- [ ] `promptFormatting.ts`, `promptDiagnostics.ts`, `promptAssembly.ts` exist with the symbols above
- [ ] `prompt/normalization.ts` contains no formatters, no diagnostics, no `buildPromptText` — only text helpers + budget constants
- [ ] `grep -n "getPromptDiagnostics\|buildPromptText\|formatGameContext" apps/backend/src/prompt/normalization.ts` returns nothing
- [ ] No import cycle introduced (typecheck passes; `promptAssembly` → `promptFormatting`/`normalization` only)
- [ ] All backend source and test imports resolve to the new paths
- [ ] Backend typecheck and tests green; prompt output byte-identical (existing snapshot/budget tests unchanged)

## Verification

```bash
npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test
grep -n "getPromptDiagnostics\|buildPromptText\|formatGameContext" apps/backend/src/prompt/normalization.ts
```

## Files touched

- `apps/backend/src/prompt/promptFormatting.ts` (new)
- `apps/backend/src/prompt/promptDiagnostics.ts` (new)
- `apps/backend/src/prompt/promptAssembly.ts` (new)
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/types/index.ts`
- `apps/backend/src/eval/contextEvaluationHarness.ts` + `.test.ts`
- `apps/backend/src/mockAskAi.test.ts`, `apps/backend/src/app.budget.test.ts`
- `apps/backend/src/prompt/normalization.test.ts`, `apps/backend/src/prompt/context.test.ts`
- Optional new test files for the three new modules
