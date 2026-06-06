# Receipt — supplemental-game-rules-retrieval

- **Date:** 2026-06-05
- **Slug:** `supplemental-game-rules-retrieval`
- **Status:** shipped
- **Credit:** retrieval scoring concept spiked by Joey

## Actions taken

- [x] Slice A–D acceptance criteria verified against codebase
- [x] Eval harness checklist IDs added: `supplemental-rules-section-present`, `supplemental-rules-after-game-rules`, `supplemental-rules-before-rulings`
- [x] Eval fixtures added: `state-based-actions` (704.5g SBA scenario), `cascade-keyword` (cascade + prowess interaction)
- [x] Golden prompt fixtures regenerated deterministically (all 11 fixtures, 16/16 checks each)
- [x] `npm run quality:check` passed — 14 backend test files (127 tests), 20 frontend test files (180 tests); all green
- [x] DEC-032 promoted in `sections/decisions.md`
- [x] REQ-022 extended in `sections/functional-requirements.md` with supplemental retrieval criteria
- [x] `sections/integrations-and-data.md` updated with rule index artifact and dual-output build documentation
- [x] Receipt written
- [x] PR #30 closed with credit to Joey's retrieval spike
- [x] `PRD/work/supplemental-game-rules-retrieval/` deleted

## PRD promotion

- [x] `PRD/sections/decisions.md` — DEC-032 (supplemental CR retrieval, prompt-only, backend-only)
- [x] `PRD/sections/functional-requirements.md` — REQ-022 extended with supplemental retrieval acceptance criteria
- [x] `PRD/sections/integrations-and-data.md` — Game Rules Data Strategy updated: dual-output build, `gameRulesRuleIndex.json` artifact documented; AI Prompt Context Rules updated with supplemental line

## Files created

- `apps/backend/src/gameRulesRetrieval.ts` — rule index loader, scorer, and retrieval function
- `apps/backend/src/gameRulesRetrieval.test.ts` — 14 unit tests for loader, scorer, retrieval, dedup, edge cases
- `apps/backend/data/gameRulesRuleIndex.json` — committed rule index artifact (24,025 lines, ~24k entries)
- `apps/backend/src/eval/fixtures/state-based-actions.fixture.json` — SBA eval fixture
- `apps/backend/src/eval/fixtures/state-based-actions.context.golden.json`
- `apps/backend/src/eval/fixtures/state-based-actions.prompt.golden.txt`
- `apps/backend/src/eval/fixtures/cascade-keyword.fixture.json` — cascade + prowess eval fixture
- `apps/backend/src/eval/fixtures/cascade-keyword.context.golden.json`
- `apps/backend/src/eval/fixtures/cascade-keyword.prompt.golden.txt`
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md`

## Files updated

- `scripts/build-game-rules.mjs` — extended with dual-output: topic JSON + rule index JSON
- `apps/backend/src/index.ts` — loads rule index artifact at startup, logs entry count
- `apps/backend/src/app/createApp.ts` — threads rule index into app context
- `apps/backend/src/routes/askAi.ts` — retrieves supplemental rules per request and threads into prompt build
- `apps/backend/src/prompt/preparation.ts` — passes supplemental rules to `buildPromptText`
- `apps/backend/src/prompt/normalization.ts` — `formatSupplementalRulesSection` renders `ADDITIONAL RELEVANT RULE EXCERPTS` section; `getPromptDiagnostics` extended with supplemental rule metrics
- `apps/backend/src/prompt/normalization.test.ts` — updated for supplemental rules section tests
- `apps/backend/src/eval/contextEvaluationHarness.ts` — 3 new check IDs and check functions added
- `apps/backend/src/eval/contextEvaluationHarness.test.ts` — loads rule index, computes supplemental rules per fixture, passes to `buildPromptText`
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt` — updated: 11 fixtures, 16/16 checks each
- `apps/backend/src/eval/fixtures/*.prompt.golden.txt` — all 9 existing fixtures regenerated (supplemental rules appear in fixtures with relevant content; section correctly omitted when no rules score above 0)
- `PRD/sections/decisions.md` — DEC-032 added
- `PRD/sections/functional-requirements.md` — REQ-022 extended
- `PRD/sections/integrations-and-data.md` — Game Rules Data Strategy and AI Prompt Context Rules updated

## Files deleted

- `PRD/work/supplemental-game-rules-retrieval/` (entire folder)

## Verification results

- **Tests:** 14 backend test files (127 tests) + 20 frontend test files (180 tests) — all passed
- **Eval goldens:** all 11 fixtures regenerated deterministically; `state-based-actions` and `cascade-keyword` fixtures each show `ADDITIONAL RELEVANT RULE EXCERPTS` section with scored out-of-manifest rules; all 16 checks pass per fixture
- **Dedup confirmed:** supplemental rules exclude rule IDs already in the curated baseline (`gameRulesTopicManifest.json`)
- **Section ordering:** supplemental appears after `GAME RULES (reference)` and before `OFFICIAL RULINGS` per DEC-032
- **Public contract:** `AskAiRequest`, API response shape, and frontend unchanged
