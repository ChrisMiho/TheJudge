# Slice G evidence

## Baseline (tip after slice F, 2026-10-18)

- Backend: 56 files, 896 tests pass; eval fixtures clean.

## The guard first

Commit `86560e60` ("test(codebase-cleanup-pass): add the rule search order snapshot (slice G guard)") adds `apps/backend/src/eval/rules-gate/ruleSearchOrder.test.ts` and its committed snapshot `ruleSearchOrder.snapshot.json`, written on the unmodified scoring code. `git log --oneline` order: `86560e60` (guard) sits right after slice F's commit `3f865b6e` and before every scoring edit below, which are in the slice G commit that follows it.

- For every non-rejected rules-gate case it runs the real `preparePromptInput` with enrichment debug on two paths: the committed frozen vectors (semantic) and no query vector (lexical). Per case and path it records `usedSemantic`, the ordered selected and runner-up rule ids, and a SHA-256 of the full debug output (every selected and runner-up rule id with its exact score, the query tokens, the counts).
- A case whose retrieval query text changed since the snapshot (a card-data refresh) is skipped and not failed, like the rules gate's "awaiting re-freeze"; the test fails if fewer than 90 percent of recorded cases are still compared. Regenerate on purpose with `UPDATE_RULE_SEARCH_ORDER=1 npm --workspace apps/backend run test -- ruleSearchOrder`.
- The guard bites: with a deliberate one-line change to the word-overlap sum (`weight * 1.0000001`), two of its three tests fail; reverted, they pass. It passes unchanged after every step below and on the final tree.

## Changes (in `gameRulesRetrieval.ts` only below the loader block, lines 32-372 untouched)

- K-05: `accumulateWordOverlap(entry, tokens, N, df, start)` is the only word-overlap loop. The hybrid blend passes `start = 0`; `scoreEntry` passes `computeIdBoost(...)`, which builds the boost `0 -> +SCORE_EXACT_RULE_ID -> +SCORE_PARENT_RULE_ID` in the order `scoreEntry` added it before, so every floating-point addition happens in the same order. The stale comment is rewritten.
- K-06 (retrieval part): the hybrid path records each candidate's boost on the scored entry, and `selectSupplemental` reads it instead of recomputing (it recomputes only for an entry without one, which cannot happen on the path that reaches it). Each rule vector's squared length is cached in a `WeakMap` keyed by the vector array, accumulated in index order like `cosineSimilarity`; the query vector's is taken once per query; both per-rule cosine sites (`scoreIndex`, per-card search) use `cosineToRuleVector`, which takes the same square roots of the same sums. Cited rule ids are cached per entry; the compiled obsolete-glossary patterns (and each alternate's single-word token) are cached per glossary array. Not done, as planned: carrying the raw blend instead of `score - boost`, and the concept-terms repeat.
- K-14: `turnStepSearchName` now reads `STEP_SUMMARIES[...].name` through the new `turnStepKeyFor` in `prompt/phaseGuidance.ts`, with three overrides (`main_1`, `main_2`, and a combat with no or an unknown step). New test `gameRulesTurnStepName.test.ts` pins every phase x combat-step pair, plus unknown values, to the strings the old function returned (it passed on the old code before the change). A scan of the backend's non-test import graph finds 0 runtime import cycles.
- K-15 (search part): `escapeRegExp` lives in new `textHelpers.ts` (used by `gameRulesRetrieval.ts`, `commanderSpellbook/intent.ts`, `eval/rules-gate/stateFacts.ts`); `foldApostrophes` lives in `gameRulesStemmer.ts` (that file has no imports on purpose, because `scripts/build-game-rules.mjs` loads it straight from Node, so the shared fold has to sit there) and serves `gameRulesRetrieval.ts`, the stemmer itself, `gameRulesConceptMap.ts` and `prompt/phaseGuidance.ts`. The four apostrophe sites all folded exactly U+2018 and U+2019.
- K-12 (non-owned files): `export` dropped from `selectTriggeredTopicIds`, `SEARCH_STOP_WORDS`, `resolveAnchorCardIds`, `COMBO_INTENT_TERMS`, `COMBO_INSTRUCTION_LINES`, `STACK_ORDER_PREAMBLE_LINE`, `buildPlayerDisplayNameLookup`, `formatPlayerRef`, `toPlayerLabelIndex`, `formatTargets`, `MAX_NAMED_STEP_SUMMARIES`, `TURN_STEP_NAME_TABLE`, `estimatePromptChars`. A grep of every tracked code file (apps, scripts, tests included) found no outside user for each. Types that appear in exported signatures stay exported.

## After

- Backend: 58 files, 902 tests pass (896 plus 3 order-snapshot tests plus 3 turn-step tests). `ruleSearchOrder` passes unchanged. `gameRulesRetrieval.test.ts`, `gameRulesSearchFixes.test.ts`, `rulesGate.test.ts`, the stemmer, concept-map, phase-guidance and intent tests pass inside that run. `npm run test:scripts`: 1066 pass.
- `npm --workspace apps/backend run typecheck`, `npm run lint`, `npm run format:check` exit 0. `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing.
- `git diff origin/main -- apps/backend/src/gameRulesRetrieval.ts` hunks start at lines 5, 669, 722, 813, 851, 863, 898, 914, 958, 1065, 1079, 1097, 1191 and 1299 of the base file: the first is the import block (lines 5-11), every other one is below line 372; no `export` line changed.

## Reverted findings

None.
