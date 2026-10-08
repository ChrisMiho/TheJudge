# GAMEPLAN — exact curated rule exclusion

Build half of graph run `graph-20261008-061643`. Intent: `DESIGN-BRIEF.md`.
Proposal, all five IDs accepted unchanged: `GATE-QUESTIONS.md`.

## What the player gets

A player asks "does a 'becomes tapped' trigger fire when the permanent enters
tapped?" Today the AI never sees rule 603.2e. After this change it does. The rule
search (System 3, up to ten scored rule excerpts) skips only the exact rule
numbers a curated topic lists, so sub-rules the topic does not print (603.2a-h,
117.3a-d, and so on) compete like any other rule. Nothing that reaches the
prompt today is lost.

## Architecture and data flow

- Curated topics (System 2) list rule numbers in `gameRulesTopicManifest.json`.
  `collectCuratedRuleIds` (`apps/backend/src/gameRulesRetrieval.ts`) turns the
  selected topics' numbers into the exclusion set.
- `scoreIndex` in the same file has two branches, hybrid and lexical. Each
  drops a candidate when `excludeRuleIds.has(entry.ruleId)` OR any
  `entry.parentRuleIds` is in the set. The change drops the parent clause on
  both branches. One shared path serves lookup and game mode, so nothing else
  branches.
- The evidence trace (`scripts/lib/evidence-trace.mjs`,
  `skippedForCuratedTopic`) mirrors the same rule, so its "skipped for curated
  topic" report stays true (REQ-229).
- Exact exclusion is safe only while each topic's excerpt carries exactly the
  rules it lists. A new data test over `gameRulesByTopic.json` and
  `gameRulesRuleIndex.json` holds that.
- Ranking boosts (REQ-181, REQ-182), topic contents, the cap of ten (REQ-190)
  and the System 2 selection do not change.

## Checked in the code now (gate-qc notes)

- N1, matching method: plain substring. Over the committed data, every listed
  rule's full index text is a substring of its topic's excerpt (0 missing), and
  no unlisted rule's full text is a substring of any topic's excerpt (0 extra),
  across all 24 topics. Slice A uses `excerpt.includes(rule.text)`.
- N2, data test location: `apps/backend/src/gameRulesTopicData.test.ts` (new,
  vitest, backend workspace; it reads `../data/*.json` the way
  `src/prompt/preparation.test.ts` reads data). `scripts/build-game-rules.test.mjs`
  only imports build helpers and has no data-file read, so it is not the home.
  Evidence-trace test file: `scripts/lib/evidence-trace.test.mjs` (the
  `skippedForCuratedTopic` test is at line 143; the 514.3a assertions at 103-109
  and 143-148 flip).
- Other code that mentions the prefix rule, found by grep: only
  `gameRulesRetrieval.ts` (lines 701-705 and 736-740), its test (line 230),
  `evidence-trace.mjs` (lines 49-53), its test, and the
  `upkeep-trigger.fixture.json` description (REQ-179 / 603.3b). Other REQ-179
  code hits are the index-hygiene half (`build-game-rules.mjs`, its test,
  `gameRulesBuildPolicy.test.ts`, `quick-lookup-no-card.fixture.json`) and are
  untouched.

## Slices (sequential)

| Slice | Title | Depends on |
| --- | --- | --- |
| A | Exact exclusion in code, evidence trace, tests, data test | none |
| B | Regenerate three goldens, raise baseline, re-measure | A |
| C | Apply the PRD truth and close | A, B |

B needs A's code. C needs B's measured values for REQ-179's build record.

## Where each deliverable lands (nothing outside the PRD survives in the package)

`PRD/work/exact-curated-rule-exclusion/` is deleted at node 8. Every deliverable
lands elsewhere: code and tests under `apps/backend/` and `scripts/`, the
regenerated goldens under `apps/backend/src/eval/fixtures/`, the raised baseline
under `apps/backend/src/eval/rules-gate/`, and the truth under `PRD/sections/`.
Slice B's measured values go into REQ-179's Notes (slice C) and the cleanup
receipt, not only into the package's evidence log.

## PR #273 condition

If the data-refresh PR #273 has merged into `main` before the build (the
committed game-rules data differs from commit `f98b8feb`), slice B re-measures
every number in the brief's target table, the 41 / 125 blocked-sub-rule counts,
the 803-character `abilities-trigger-basics` excerpt, the two closing cases and
the changed-golden list, and slice C records those values in REQ-179's note
instead of the `f98b8feb` values. If the re-measure shows a recorded rule lost,
stop and report; never pass `--allow-regressions`.

## Verification checklist

- [ ] `npm --workspace apps/backend run test` green (retrieval, data test)
- [ ] `npm run test:scripts` green (evidence trace)
- [ ] Exactly three goldens changed, each as a reviewed consequence
- [ ] `npm run eval:rules-gate:baseline` run without `--allow-regressions`
- [ ] Targets measured: 295 of 392 / 289 / 16 of 18 hybrid / 14 of 14 both
- [ ] 603.2e and 603.2g reach the prompt under hybrid ranking
- [ ] Lexical first-ship count and lexical closing-case result recorded
- [ ] `PRD/sections/` amended per the five accepted slots, no new ids
- [ ] `npm run quality:check` green

## Runtime hygiene

No browser-observable change. No Playwright, dev server or port is used.
