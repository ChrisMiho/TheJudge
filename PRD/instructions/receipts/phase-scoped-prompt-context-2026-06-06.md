---
slug: phase-scoped-prompt-context
date: 2026-06-06
status: shipped
---

# Receipt — Phase-Scoped Prompt Context

## Ship Checklist

- [x] Slice A and Slice B acceptance criteria satisfied and verified
- [x] Tests updated; all 149 backend tests pass; TypeScript compiles clean for both packages
- [x] Public contract unchanged (`POST /api/ask-ai` request shape gains only additive optional `combatStep`; success/error response shapes unchanged)
- [x] No secrets committed
- [x] Durable outcomes already promoted to `sections/decisions.md` (DEC-034, DEC-035, DEC-036, DEC-037; DEC-022 superseded), `sections/functional-requirements.md` (REQ-015, REQ-016, REQ-024), `sections/integrations-and-data.md`

## Actions Taken

- Verified all acceptance criteria against live code before writing receipt
- Wrote receipt
- Deleted `PRD/work/phase-scoped-prompt-context/`

## Files Created

- `apps/backend/src/prompt/phaseGuidance.ts` — new module; `getPhaseGuidance(phase, combatStep?)` maps all 8 `TurnPhase` values + optional `CombatStep` to guidance strings; `main_1`/`main_2` share a base builder; combat is sub-step-specific when `combatStep` is present
- `apps/backend/src/prompt/phaseGuidance.test.ts` — unit tests; non-empty for all phases; `main_2` > `main_1`; each combat sub-step produces a distinct string

## Files Updated

- `apps/frontend/src/types.ts` — removed `"stack_resolving"` from `TurnPhase`; added `CombatStep` type; added `combatStep?: CombatStep` to `GameContext`
- `apps/frontend/src/App.tsx` — removed `stack_resolving` from `TURN_PHASE_OPTIONS`; added inline combat sub-step `<select>` (default `declare_blockers`); wired `combatStep` into assembled `GameContext`
- `apps/frontend/src/lib/contextFlow/flow.ts` — `DEFAULT_TURN_PHASE` changed from `"stack_resolving"` to `"main_1"`
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts` — trimmed to exactly 2 zones per phase; removed `stack_resolving` key
- `apps/backend/src/validation/askAiRequest.ts` — removed `"stack_resolving"` from `turnPhaseSchema`; added `combatStepSchema` and optional `combatStep` on `gameContextSchema`
- `apps/backend/src/types/index.ts` — exported `CombatStep` type; added `combatStep?: CombatStep` to `PromptContext.gameContext`
- `apps/backend/src/prompt/context.ts` — threads `combatStep` from `AskAiRequest` through to `normalizedGameContext`
- `apps/backend/src/prompt/normalization.ts` — imports `getPhaseGuidance`; inserts `PHASE GUIDANCE` section after `GENERAL GAME CONTEXT` block, always present
- `apps/backend/src/prompt/mtgReference.ts` — removed `stack_resolving` from phase list sentence; removed instruction directing users to specify combat sub-steps in their question
- `apps/backend/src/prompt/normalization.test.ts` — added `PHASE GUIDANCE` ordering, content, and combat sub-step specificity tests
- `apps/backend/src/mockAskAi.test.ts` — asserts `PHASE GUIDANCE` present in mock prompt output
- `apps/frontend/src/App.test.tsx` — combat sub-step selector tests
- `apps/frontend/src/App.zoneFlow.test.tsx` — 2-zone defaults per phase tests
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts` — updated for new context shape
- `apps/frontend/src/lib/contextFlow/flow.test.ts` — updated for `main_1` default
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.test.ts` — updated for 2-zone mapping
- `apps/frontend/src/lib/zoneCards.test.ts` — updated for schema changes
- `apps/backend/src/validation/askAiRequest.test.ts` — updated for `combatStep` validation
- `apps/backend/src/eval/fixtures/*.prompt.golden.txt` — regenerated to include `PHASE GUIDANCE` section (8 fixture files updated)
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt` — regenerated

## Files Deleted

- `PRD/work/phase-scoped-prompt-context/README.md`
- `PRD/work/phase-scoped-prompt-context/GAMEPLAN.md`
- `PRD/work/phase-scoped-prompt-context/DESIGN-BRIEF.md`
- `PRD/work/phase-scoped-prompt-context/IDEA.md`
- `PRD/work/phase-scoped-prompt-context/slice-a-frontend-types.md`
- `PRD/work/phase-scoped-prompt-context/slice-b-backend-prompt.md`

## Verification Results

- `npx tsc --noEmit` in `apps/frontend`: clean
- `npx tsc --noEmit` in `apps/backend`: clean
- `npm run test` (root): 149/149 backend tests pass; frontend tests pass
- `UPDATE_CONTEXT_EVAL_FIXTURES=1` used to regenerate golden fixture files after prompt shape change
