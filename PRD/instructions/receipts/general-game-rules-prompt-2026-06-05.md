# Receipt — general-game-rules-prompt

- **Date:** 2026-06-05
- **Slug:** `general-game-rules-prompt`
- **Status:** shipped

## Actions taken

- [x] Slice A–D acceptance criteria verified against codebase
- [x] `npm run quality:check` passed — 17 test files (153 tests) backend, 13 test files (104 tests) frontend; all green
- [x] Public contract unchanged — no `AskAiRequest`, Zod schema, or frontend changes
- [x] No secrets committed — `apps/backend/data/cr/source.txt` and `.tmp` are gitignored
- [x] Durable outcomes confirmed already promoted in `sections/` (see PRD promotion checklist below)
- [x] Receipt written
- [x] `PRD/work/general-game-rules-prompt/` deleted

## PRD promotion status (all confirmed pre-existing)

All durable outcomes were promoted during refinement/implementation. No new promotions required at cleanup.

- [x] `PRD/sections/decisions.md` — DEC-030 (general game rules prompt enrichment)
- [x] `PRD/sections/functional-requirements.md` — REQ-022 (general game rules prompt enrichment)
- [x] `PRD/sections/integrations-and-data.md` — Game Rules Data Strategy section
- [x] `PRD/sections/non-functional-requirements.md` — NFR-002 product-risk note (latency)

## Files created

- `scripts/build-game-rules.mjs`
- `apps/backend/data/gameRulesTopicManifest.json`
- `apps/backend/data/gameRulesByTopic.json` (committed artifact — 23 topics, 21,962 excerpt chars)
- `apps/backend/src/gameRules.ts`
- `apps/backend/src/gameRules.test.ts`
- `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts`

## Files updated

- `.gitignore` — added `apps/backend/data/cr/source.txt` and `.tmp`
- `package.json` — `data:build` chain includes `build-game-rules.mjs`
- `scripts/refresh-scryfall-data.mjs` — added WotC CR TXT download with graceful skip
- `apps/backend/src/index.ts` — loads game rules artifact at startup, logs topic count
- `apps/backend/src/app/createApp.ts` — threads game rules into app context
- `apps/backend/src/routes/askAi.ts` — threads game rules into request handling
- `apps/backend/src/prompt/preparation.ts` — passes game rules to `buildPromptText`
- `apps/backend/src/prompt/normalization.ts` — renders GAME RULES section; `MAX_PROMPT_CHAR_BUDGET = 35000`
- `apps/backend/src/prompt/normalization.test.ts` — updated for new section order and 35k budget
- `apps/backend/src/eval/contextEvaluationHarness.ts` — added `game-rules-section-present`, `game-rules-before-rulings`, `prompt-under-budget` checks
- `apps/backend/src/eval/contextEvaluationHarness.test.ts` — updated for new checklist IDs
- `apps/backend/src/eval/fixtures/*.prompt.golden.txt` — all regenerated with full GAME RULES block
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt` — updated for new checks
- `apps/backend/src/app.contract.test.ts` — updated for game rules in prompt
- `apps/frontend/src/lib/scryfallRefreshPolicy.test.ts` — extended for CR download target
- `apps/frontend/public/data/cardMetadata.json` — updated (data pipeline)
- `apps/frontend/tsconfig.json` — updated

## Files deleted

- `PRD/work/general-game-rules-prompt/` (entire folder)

## Verification results

- **Tests:** 17 backend test files (153 tests) + 13 frontend test files (104 tests) — all passed
- **Eval goldens:** all fixtures regenerated deterministically with GAME RULES block present; all under 35k char budget
- **Secret check:** `cr/source.txt` gitignored; no secrets in git status
- **Public contract:** `AskAiRequest`, API response shape, and frontend unchanged

## Latency readout

Manual latency sampling was not captured (dev:openai not run during this cleanup session). Product-risk status per slice D doc: latency risk is **active** — prompt size ~25–32k chars typical/worst case against NFR-002 3s target. Monitor post-ship; context-driven topic selection is the primary mitigation path per DEC-030.
