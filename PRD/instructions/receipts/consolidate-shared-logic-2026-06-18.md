# Receipt — Consolidate Shared Logic and Remove Duplication

- **Date:** 2026-06-18
- **Slug:** `consolidate-shared-logic`
- **Status:** shipped
- **Type:** pure refactor (zero behavior / API / prompt-contract change; DEC-013, DEC-020, DEC-021, DEC-042 intact)

## Actions taken

- [x] Slice A — backend constants module created; `PLAYER_LABELS`, `CANONICAL_ZONE_ORDER`, derived `NON_STACK_CANONICAL_ZONE_ORDER`, fallback question strings consolidated into `constants.ts`; truncation collapsed to a single defensive `truncateOracleText` (safe-superset guards)
- [x] Slice B — `prompt/normalization.ts` (485 lines) split into `normalization.ts` / `promptFormatting.ts` / `promptDiagnostics.ts` / `promptAssembly.ts`; all import paths repointed
- [x] Slice C — `EnrichmentStep.tsx` utilities extracted to `lib/enrichmentFormat.ts`; pending-target state cluster extracted to `hooks/useEnrichmentTargets.ts`; playerLabels usage audit recorded (one inline finding at `App.tsx:200–201`, finding-only)
- [x] Slice D — `resolveRulingsForPrompt` / `resolveRulingsForPromptWithDebug` collapsed into a single overloaded function with optional debug flag
- [x] Slice E — ship gates verified; reuse-before-create rule confirmed in `technical-design-rules.md`; full quality gate green
- [x] Durable promotion: reuse-before-create bullet present in `PRD/instructions/technical-design-rules.md` (Design Proposal Rules)
- [x] No new `DEC-###` / `REQ-###` / FLOW entries — entirely within existing decisions
- [x] System-map promotion gate: no catalog flip required (pure refactor, no new shipped feature surface); confirmed no `system-map.md` entry corresponds to this package

## Files created

- `apps/backend/src/constants.ts`
- `apps/backend/src/prompt/promptFormatting.ts` (+ `promptFormatting.test.ts`)
- `apps/backend/src/prompt/promptDiagnostics.ts` (+ `promptDiagnostics.test.ts`)
- `apps/backend/src/prompt/promptAssembly.ts` (+ `promptAssembly.test.ts`)
- `apps/frontend/src/lib/enrichmentFormat.ts`
- `apps/frontend/src/hooks/useEnrichmentTargets.ts`
- `PRD/instructions/receipts/consolidate-shared-logic-2026-06-18.md` (this file)

## Files updated

- `apps/backend/src/prompt/normalization.ts` (+ `normalization.test.ts`)
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/cardRulings.ts` (+ `cardRulings.test.ts`)
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/test-utils/requestBuilders.ts`
- `apps/backend/src/types/index.ts`
- `apps/backend/src/app.budget.test.ts`
- `apps/backend/src/mockAskAi.test.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `PRD/instructions/technical-design-rules.md` (reuse-before-create bullet)

## Files deleted

- `PRD/work/consolidate-shared-logic/` (entire ephemeral work folder — README, GAMEPLAN, IDEA, DESIGN-BRIEF, slice-a … slice-e)

## Verification results

- `npm run quality:check` (root, both apps: typecheck + lint + format:check + test + coverage:check) — **exit 0**
- Backend: 21 test files, 215 tests passed
- `grep -rn "truncateWithSuffix\|resolveRulingsForPromptWithDebug\|orderedPlayerLabels\|PLAYER_LABEL_ORDER" apps/backend/src` — **no matches**
- `grep -n "function parseManaSpent\|function formatContextTarget\|function hasOwnerControl" apps/frontend/src/components/EnrichmentStep.tsx` — **no matches**
- Slice C audit section filled in (confirmed importers correct; one finding-only inline duplication)
