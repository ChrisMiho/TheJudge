# Receipt — prompt-context-retrieval-tuning

- **Date:** 2026-06-18
- **Slug:** `prompt-context-retrieval-tuning`
- **Status:** shipped (`DEC-045`, `DEC-046`, `DEC-047`)

## Summary

Drew the System 2 / System 3 boundary by signal source: System 2 (`gameRulesTopicSelection.ts`) now selects an always-on core plus card-agnostic, game-state-gated conditional topics instead of all 23 curated topics on every request; System 3 (`gameRulesRetrieval.ts`) replaced flat +1-per-shared-word scoring with IDF weighting, question/keyword boosts, and an IDF-then-ruleId tie-break. Extended the eval harness with labeled `expected` recall fixtures and three new relevance checks, and added a `retrieval:report` script for digestible before/after tuning review. All five slices (A–E) shipped; verified green at cleanup.

## Actions taken

- [x] Slice A: `selectGameRulesTopics` (always-on core + 7 conditional buckets) wired into `preparePromptInput`; `gameRulesTopicSelection.test.ts` covers each bucket
- [x] Slice B: IDF-weighted scoring, question boost (×3), keyword boost (×6), retained rule-id/parent-id bonuses, IDF-then-ruleId tie-break; `gameRulesKeywordVocabulary.json` and `gameRulesTokenStats.json` (N=3432) committed; `build-game-rules.mjs` emits token stats
- [x] Slice C: `system2-conditional-selection`, `system3-expected-recall`, `system3-noise-excluded` checks added; 3 new labeled fixtures (`counterspell-stack`, `combat-deathtouch`, `upkeep-trigger`) plus extended `expected` blocks on `cascade-keyword` and `state-based-actions`; goldens regenerated
- [x] Slice D: `scripts/retrieval-relevance-report.mjs` + `buildRelevanceReport()` (shared with harness, no scoring drift) + `npm run retrieval:report`
- [x] Slice E: full ship-gate re-verification run at cleanup (see Verification results)
- [x] PRD section promotion: `DEC-045`/`DEC-046`/`DEC-047`, `REQ-022` (amended), `REQ-032` (new), `Q-001`, and `integrations-and-data.md` game-rules bullets — already landed in commit `d5702ac` prior to this cleanup pass; re-verified for alignment, no further edits needed
- [x] `sections/system-map.md` — "Curated game rules" / "Supplemental retrieval" entries updated to reflect DEC-045/046 behavior and new file locations (`gameRulesTopicSelection.ts`, vocabulary/token-stats artifacts); added a new "Retrieval relevance report" feature entry under Eval harness; all stay `Status: shipped` (no planned→shipped flip needed — these subsystems were already shipped pre-tuning)
- [x] `sections/non-functional-requirements.md` — NFR-002 mitigation note flipped from "planned" to "shipped"; flagged live p50/p95 re-sampling as a pending (non-blocking) follow-up
- [x] `PRD/README.md` — removed shipped row from "Active work packages"; dropped the now-resolved "(re-derive after retrieval work)" qualifier from `consolidate-shared-logic`'s summary
- [x] Receipt written
- [x] `PRD/work/prompt-context-retrieval-tuning/` deleted

## PRD promotion

- [x] `sections/decisions.md` — `DEC-045`, `DEC-046`, `DEC-047` present, `Status: confirmed`, reflect shipped behavior (landed in `d5702ac`; no edit needed at cleanup)
- [x] `sections/functional-requirements.md` — `REQ-022` amended, `REQ-032` added, acceptance criteria match shipped checks (landed in `d5702ac`; no edit needed at cleanup)
- [x] `sections/integrations-and-data.md` — game-rules assembly bullets match DEC-045 selection + DEC-046 scoring (landed in `d5702ac`; no edit needed at cleanup)
- [x] `sections/non-functional-requirements.md` — NFR-002 latency note updated at cleanup (see above)
- [x] `sections/system-map.md` — entries refreshed at cleanup (see above)
- [x] `sections/open-questions.md` — `Q-001` left open (keyword vocabulary remains manually curated; no derivation-strategy change shipped)
- [x] Receipt written at `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md`
- [x] `PRD/work/prompt-context-retrieval-tuning/` deleted after receipt

## Files created

- `apps/backend/src/gameRulesTopicSelection.ts` / `.test.ts` — System 2 selector
- `apps/backend/data/gameRulesKeywordVocabulary.json` — System 3 keyword vocabulary
- `apps/backend/data/gameRulesTokenStats.json` — System 3 IDF token stats (build output)
- `apps/backend/src/eval/fixtures/counterspell-stack.{fixture.json,context.golden.json,prompt.golden.txt}`
- `apps/backend/src/eval/fixtures/combat-deathtouch.{fixture.json,context.golden.json,prompt.golden.txt}`
- `apps/backend/src/eval/fixtures/upkeep-trigger.{fixture.json,context.golden.json,prompt.golden.txt}`
- `apps/backend/src/eval/relevanceReport.test.ts`
- `scripts/retrieval-relevance-report.mjs`
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` — this receipt

## Files updated

- `apps/backend/src/gameRulesRetrieval.ts` / `.test.ts` — DEC-046 scoring, provenance-aware tokens, tie-break
- `apps/backend/src/prompt/preparation.ts` — per-request `selectGameRulesTopics` wiring
- `apps/backend/src/eval/contextEvaluationHarness.ts` / `.test.ts` — `expected` block type, three new checks, `buildRelevanceReport`
- `apps/backend/src/eval/fixtures/README.md` — documents `expected` block schema and new check ids
- `apps/backend/src/eval/fixtures/cascade-keyword.fixture.json`, `state-based-actions.fixture.json` — extended `expected` blocks
- 12 `*.prompt.golden.txt` fixtures + `checklist-report.golden.txt` — regenerated for System 2 slimming / System 3 rescoring
- `scripts/build-game-rules.mjs` — dual-output extended to emit token stats
- `package.json` / `package-lock.json` — `retrieval:report` script, `tsx` devDependency
- `.gitignore` — ignore developer-local `output/retrieval-relevance-report.txt`
- `PRD/sections/system-map.md`, `PRD/sections/non-functional-requirements.md`, `PRD/README.md` — cleanup-time promotion (see above)

## Files deleted

- `PRD/work/prompt-context-retrieval-tuning/` (entire folder: `README.md`, `GAMEPLAN.md`, `IDEA.md`, `DESIGN-BRIEF.md`, `slice-a-system2-conditional-selection.md`, `slice-b-system3-idf-scoring.md`, `slice-c-eval-relevance-harness.md`, `slice-d-relevance-report.md`, `slice-e-ship.md`)

## Verification results

Re-run at cleanup time (not just trusted from slice notes):

- `npm --workspace apps/backend run test:eval` — 2/2 tests passed
- `npm run retrieval:report` — 5/5 labeled scenarios PASS (`cascade-keyword`, `combat-deathtouch`, `counterspell-stack`, `state-based-actions`, `upkeep-trigger`); all expected supplemental ids hit, all forbidden ids excluded
- `npm run quality:check` — exit 0 (typecheck, lint, format:check, full test suite 212/212 backend + frontend, coverage:check)
- No changes under `apps/frontend/`
- No `AskAiRequest`, Zod schema, or public API/UI changes
- `MAX_PROMPT_CHAR_BUDGET` unchanged (`EFFECTIVELY_UNLIMITED_CHARS = 1_000_000`, DEC-042)
- Prompt-size reduction confirmed on phase-irrelevant goldens: zero-cards net −90 lines, simple-interaction −69, full-context −36
- **Open follow-up (non-blocking):** live p50/p95 latency re-sampling under real traffic (NFR-002) not done this pass — prompt-size reduction is a proxy, not a measured latency result

## Related work pointers

- `system-map-detail` (ideation) — was blocked on this package landing before writing deep System 2/System 3 behavior prose; now unblocked
- `consolidate-shared-logic` (active) — duplication findings #2, #4, #7, #8 targeting `gameRulesRetrieval.ts`/`gameRules.ts` were noted stale pending this work; re-run duplication analysis against the new `gameRulesTopicSelection.ts` / rescored `gameRulesRetrieval.ts` before resuming that package
- `Q-001` (open) — keyword vocabulary derivation strategy; revisit if labeled-recall metrics show gaps as fixture coverage grows
