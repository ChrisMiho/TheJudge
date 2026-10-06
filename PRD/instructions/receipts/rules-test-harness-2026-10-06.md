# Receipt — rules-test-harness — 2026-10-06

**What happened:** The Ask AI feature used to be checked against only 18 hard rules questions, so nobody could tell whether it was giving wrong or invented rulings across the rest of the game. This builds a test backbone for it: a case file format, free offline checks that run on every build and catch a card the player attached never reaching the AI or a deciding rule no longer reaching it, a pay-per-use live grader that only re-pays for cases whose prompt or reference answer changed, and a review command for approving cases. The 18 original cases were migrated, and 375 new cases were drafted: one for each of 255 real mechanics, and 120 hard interactions across twelve rules areas, including both tester cases (63 of the 120 are "does not work" cases). Code PR: https://github.com/ChrisMiho/TheJudge/pull/269 (open, not yet merged).

**What it means for you:** Merge PR #269 to ship this. The 375 new cases are drafts and do not count until you approve them. Approve them in batches with the review commands below. Run the paid live grading only when you want it.

## Summary

- Date: 2026-10-06
- Slug: rules-test-harness
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 8, `close`), run `graph-20261006-181340`, **PR-ready path** — this receipt and the package deletion are committed on the code branch and ride in PR #269, before the owner's merge.
- Package classification: autonomous — `README.md` carries `## Autonomous metadata` (`Autonomous base: origin/main`), so the PR-ready path of the autonomous gate applies.
- PR: https://github.com/ChrisMiho/TheJudge/pull/269

## Pre-merge checks (PR-ready path)

1. Checkout is `.worktrees/implement-rules-test-harness` on `thejudge-auto/rules-test-harness-work`; after `git fetch origin`, `HEAD` equals `origin/thejudge-auto/rules-test-harness-work` (`84b1a63`).
2. PR #269 is open, head `thejudge-auto/rules-test-harness-work`, base `main` (`gh pr view`).
3. `STATUS.ship-ready`; all 77 criteria across `slice-a` to `slice-g.criteria.json` are `true` (15 + 13 + 15 + 7 + 9 + 10 + 11 by file read; zero `false`).
4. Runtime cleanup: the package is backend and script work only. No browser session, dev server, or port was started, and no `.playwright-mcp/` capture folder exists in the package.

## What shipped

- **Slice A — case format v2, shared loader, the 18 migrated.** Format version 2 with the shared loader `scripts/lib/gold-cases.mjs`, the stale comparison, `buildCaseRequest`, and the 18 first-ship cases migrated as `approved`.
- **Slice B — offline prompt gate.** `apps/backend/src/eval/rules-gate/`: attached-card text and rulings must reach the prompt (absolute), deciding rules reach it at least as often as the recorded baseline (ratchet, frozen query vectors; baseline 16 hits), stated game states are valid and reach the prompt.
- **Slice C — live runner.** `--changed` default selection, per-case merge of scores, per-tier headline (tiers 1-2 apart from tier 3), judge usage. REQ-186, REQ-187, REQ-190 applied.
- **Slice D — owner review flow.** `npm run eval:rules-review:render` and `:apply`. An edit verdict lands the case in `needs-edit`.
- **Slice E — coverage and staleness.** `npm run eval:rules-coverage` (writes `coverage.json`) and `npm run eval:rules-staleness`. REQ-189, REQ-222, REQ-224, REQ-225 applied; optional `source.pool` field added.
- **Slice F — 255 mechanic drafts.** One case per real mechanic in the committed rule index (701.45 Assemble and 702.158 Space Sculptor excluded by the owner); the coverage gate is wired into `quality:check` through `scripts/rules-coverage-gate.test.mjs`. REQ-188, REQ-223, NFR-018 applied.
- **Slice G — 120 hard-area drafts.** 60 from unused Comprehensive Rules `Example:` lines, 58 from WotC rulings that name a second card, 2 tester drafts; corpus is 393 cases, 63 of the 120 `does-not-work`; REQ-185 applied.
- All 7 slices `Status: done`; 77/77 criteria true (self-reported by build, see follow-ups). Review APPROVE at `cb9ba45`, no Critical or Important findings.

## Durable truth confirmed present

Applied at build, confirmed here by diff against the run base `2ceaf23`, not re-written:

- `PRD/sections/functional-requirements.md`: REQ-185 to REQ-190 amended; REQ-222, REQ-223, REQ-224, REQ-225 added.
- `PRD/sections/non-functional-requirements.md`: NFR-018 amended.
- `PRD/sections/goals-and-non-goals.md`: the answer-quality gating line now names the rules test corpus and the offline gate.
- `PRD/sections/system-map.md`: `## Eval harness` summary and `### Answer-quality baseline` entry amended; new entry `### Rules test corpus gates and review` added by slice B as `Status: partial`.

Leftover promoted at close: the system-map entry `Rules test corpus gates and review` flipped `partial` to `shipped` (`PRD/sections/system-map.md`). It was `partial` only because the review, coverage, and staleness commands arrived in later slices; all now exist, and slice G's promotion checklist and `GATE-QUESTIONS.md` name this flip as cleanup's job. Nothing else was unapplied.

## Verification

- `npm run quality:check` run fresh at close on the build worktree: exit 0 (script tests 648/648 pass, including the coverage gate on the real corpus).
- `git status --porcelain` clean before the close edits.
- Review (node 19) independently re-ran `quality:check` (exit 0), `eval:worked-solutions` (290/393, 16/18 approved unchanged), `eval:rules-staleness` (0 stale), the coverage command (deep-equals committed `coverage.json`, 256/256, 63/120 does-not-work), and a key-free network-blocked `eval:answer-quality` dry run (18 selected, $0.40).

## Owner follow-ups

Nothing blocks the merge. These are for the owner.

1. **Approve the 375 drafts in batches.** Run `npm run eval:rules-review:render` to produce the review sheet, then `npm run eval:rules-review:apply` with your verdicts. Only approved, non-stale cases count; no agent approves a case.
2. **Run live grading only when wanted.** `npm run eval:answer-quality` is on demand and confirmation-gated; its dry run prints the selected count and estimated cost first. It is never part of `quality:check`.
3. **After the merge, run `npm run graph:prune`** to remove this run's worktree and both branches (`thejudge-auto/rules-test-harness` and `thejudge-auto/rules-test-harness-work`).
4. **Four Minor review findings (ledger row 19), none blocking:**
   - Slice D criterion D4 wording says a changed case becomes a draft, but build writes `needs-edit`, as REQ-224 specifies. The criterion text is stale, not the behavior.
   - Slice C criterion C4 estimates the 18-case run at about $0.35; the real dry-run estimate is $0.40.
   - An empty `OPENAI_API_KEY` in the environment does not stop the loader filling the key from the main checkout's `.secrets/openai-dev.env`, so a plain dry run makes one models-list call (no completion, no cost).
   - 14 of the 58 two-card cases lead with a rule outside the twelve hard areas.
5. **Slice A's disclosed key check.** While building slice A, an `npm run eval:answer-quality` dry run loaded the key from the main checkout `.secrets/openai-dev.env` (by design since commit 549b12c) and issued one models-list access check: no completion, no cost. Later dry runs used a no-key wrapper. This is the same behavior as the third Minor finding above and is the fix to consider there.
6. **Hook evidence log holds 0 entries for this run.** This is the known criteria-root gap: the evidence hook reads criteria from the launch checkout, not the branch-only slice docs in the build worktree. The 77/77 criteria pass was self-reported by build; review (node 19) was the real integrity check and re-verified independently.

## Intake

- `intake/GRAPH-BRIEF.md` — the probe-derived graph-run brief the owner prepared; supplied as one file staged at `.worktrees/.graph-intake/graph-20261006-181340/GRAPH-BRIEF.md` and copied verbatim. It resolves the open questions in the owner's `PRD/work/properRulesTestHarness/gameplanIdeas.md`.
- `intake/jon-rulemancer/1.png`, `2.png`, `3.png` — three screenshots of Jon's Rulemancer app answering tester case Q2, added at the owner's direction on 2026-10-06 ("add it as context/research/assistance for validation of this use case").

## Files

Created, updated, and deleted by the run, summarized by area (the full list is the PR #269 diff, 463 files):

- Created or updated: `apps/backend/src/eval/rules-gate/` (gate, baseline, frozen vectors, staleness report), `apps/backend/src/eval/caseRequest.test.ts`, `apps/backend/src/eval/answer-quality/` (artifact, assertions, judge, rubric, `coverage.json`), `apps/backend/src/eval/worked-solutions/` (393 `*.case.json`, `excluded-mechanics.json`, README), `scripts/` (review, coverage, staleness, baseline, vector-build commands and their libraries and tests), `package.json`, `.gitignore`.
- Updated at close: `PRD/sections/system-map.md` (entry flipped to `shipped`), `PRD/work/STATUS.md` (row removed).
- Created at close: this receipt.
- Deleted at close: `PRD/work/rules-test-harness/` (`git rm -r`).

## Graph run

- Run ID: `graph-20261006-181340` | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/269

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | branch `thejudge-auto/rules-test-harness` pushed (`git ls-remote --heads origin thejudge-auto/rules-test-harness` → `066fbbd`) from `.worktrees/kickoff-rules-test-harness`; launch checkout still on `main` (reflog: no switch); lock `.worktrees/.graph-run.lock` runId `graph-20261006-181340` pid 19738 | 2026-10-06 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/rules-test-harness/IDEA.md` (10 `## Prior run` lines), `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` (`cmp` identical to staging), `PRD/work/STATUS.md` ideation row | 2026-10-06 |
| 3 | define | opus | ok | `0 → 69` | `PRD/work/rules-test-harness/DESIGN-BRIEF.md` (13 measurements, 7 slices A–G, 220-row disposition table), `GATE-QUESTIONS.md` (amend REQ-185–190, NFR-018; new REQ-222–225; Blocker questions Q-007 joke-only list, Q-008 tier-3 count), `measure/` (3 scripts + `mechanics-result.json`), `STATUS.refined`; measured 258 mechanics in the committed rule index, gold deciding-rule hit 16/18 semantic | 2026-10-06 |
| 4 | gate-qc | sonnet | failed | `0 → 42` | FAIL attempt 1 of 3: 8 findings (4 Important: slice E red on its own + stale-compare owner, run-1 size arithmetic/untraced counts, tier-1 `cards` migration, Q-007/Q-008 plain-language default; 4 Minor: disposition rows, REQ-187/189 leftover wording, state-fact test + system-map status, Infinity count); proposed diffs verified exact, IDs unused, 9 measurements reproduced; `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 5 | define | opus | ok | `0 → 79` | attempt 2: 8 gate-qc findings fixed in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (slice E ships gate as tested code, wired in F; slice A owns stale compare; run 1 = 18 + 255 + 120 = 393; 15 tier-1 cards migration measured 16/18 unchanged; Q-007/Q-008 rewritten, Q-007 now keeps the three Attraction mechanics; 220 hits = 220 rows; REQ-187/189 wording; state-fact test + system-map `partial`; Infinity 4 cards); new `measure/migration-cards.mjs` (M15), `measure/depth-pool.mjs` (M16); `STATUS.refined` | 2026-10-06 |
| 6 | gate-qc | sonnet | failed | `0 → 39` | FAIL attempt 2 (2nd FAIL of 3 allowed loops): all 8 attempt-1 findings confirmed resolved; 8 new findings (1 Important: stale approved case has no re-approval path — apply writes only `review.*`, render skips approved; 7 Minor: stack-zone `owner:` line, `gameState` request slice owner, forward REQ-222–225 refs, `coverage.json` drift after review, up-to-13 tier-3 source, Q-007 intake count, hard-area list 8 vs 12); diffs exact, 220 hits = 220 rows, M15/M16 reproduced; `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 7 | define | opus | ok | `0 → 50` | attempt 3: 8 attempt-2 findings fixed in `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `IDEA.md` (review command renders stale approved cases and apply re-records `snapshot`, slice D; stack `owner`/`caster` loader rule; slice A builds the In-Depth request; apply-order rule A21 moves REQ-185→G, REQ-188→F, REQ-189→E, REQ-222→E, REQ-224→E; apply rewrites `coverage.json`; tier-3 ceiling 15 − 2 = 13 sourced; Q-007 intake count 253/252; one twelve-area hard list); M16 re-run with twelve areas (2,651 hard-area two-card rulings, 1,232 negative-phrased); `STATUS.refined` | 2026-10-06 |
| 8 | gate-qc | sonnet | failed | `0 → 56` | FAIL attempt 3 (3rd FAIL; final loop to define): all 8 attempt-2 findings confirmed resolved, no attempt-1 regression; 2 Minor findings (18 migrated cases ship `approved` vs no-agent-approves rule in REQ-185/REQ-224/A19; awaiting-re-freeze state has no owning slice or test); 3 advisories; diffs exact, 220 hits = 220 rows, M1/M7/M8/M15/M16 reproduced; `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 9 | define | opus | ok | `0 → 56` | attempt 4: 2 attempt-3 findings + 2 advisories fixed in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (18 first-ship cases approved by the owner accept of REQ-185 — carve-out in REQ-185, REQ-224, A1, A19; slice B owns the query-text hash re-freeze check, slice E staleness reads it, fixture tests both; slice A names `scripts/eval-answer-quality.mjs`, `eval-worked-solutions.mjs`, `gold-cases.mjs` + tests; stale case excluded from REQ-187 headline with a stale count, A22); no new blocker questions; `STATUS.refined` | 2026-10-06 |
| 10 | gate-qc | sonnet | parked | `0 → 25` | FAIL attempt 4 = 4th FAIL → parked at owner-action per the three-loop cap: 2 Minor findings (re-approved stale case never re-graded under `--changed` when only its reference answer changed — add the reference-answer hash to the trigger and pin when it counts again; `DESIGN-BRIEF.md:125` cites M14, should be M13); 3 advisories; attempt-3 findings and advisories confirmed resolved, no regression; 220 hits = 220 rows, diffs exact, M1/M12/M15/M16 reproduced; `STATUS.owner-action`; findings in README `## Preparation gate` | 2026-10-06 |
| 11 | define | opus | ok | `0 → 57` | attempt 5 (owner-authorized pass 1 of 5): 2 attempt-4 findings + 3 advisories fixed in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (reference-answer hash added to `--changed`; A22 rule — re-approved case counts from re-approval when its answer hash matches, else ungraded until re-graded; slice C tests; M14 → M13; `reviewedOn` = slice A migration date with approval source; slice C names four tests; A3 puts TypeScript-importing tests in backend vitest under `apps/backend/src/eval/`); `STATUS.refined` | 2026-10-06 |
| 12 | gate-qc | sonnet | failed | `0 → 31` | FAIL attempt 5 (5th FAIL; owner-authorized loop to define 6 of 9): both attempt-4 findings + 3 advisories confirmed resolved, no regression; 1 Minor finding (backend vitest cannot import `scripts/lib/gold-cases.mjs` — TS7016 under `rootDir: src`, no `allowJs`, measured in a scratch tsconfig; `gameState` schema parse has no gate test); 1 advisory (records without hashes); 220 hits = 220 rows, diffs exact, M1/M1b/M3/M8/M9/M12 reproduced; `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 13 | define | opus | ok | `0 → 56` | attempt 6 (owner-authorized pass 2 of 5): 1 attempt-5 finding + 1 advisory fixed in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (slice A adds `scripts/lib/gold-cases.d.mts` + `prompt-fidelity.d.mts`; backend vitest imports the `.mjs` statically, one copy; loader checks structural `gameState` rules, slice B vitest parses every `gameState` with `gameContextSchema`; typecheck-green in A and B done-when; records without hashes count as ungraded and are re-graded, ~$0.35 for 18); new M17 `measure/ts-boundary.mjs` (bare import TS7016 exit 2; `.d.mts` tsc exit 0 + vitest 1 pass; variable-path import rejected as untyped); `STATUS.refined` | 2026-10-06 |
| 14 | gate-qc | sonnet | ok | `0 → 37` | PASS attempt 6, findings none (attempt-5 finding + advisory confirmed resolved; M17 re-run, plus a scratch `vitest run --coverage` with the real backend config importing both `.mjs`; 220 hits = 220 rows; 40 removed + 37 context lines exact; M1/M8/M12/M16 reproduced); README `## Preparation gate` PASS; parked `STATUS.owner-action`; docs PR https://github.com/ChrisMiho/TheJudge/pull/268 | 2026-10-06 |
| 15 | gate-review | sonnet | ok | `0 → 13` | build-half claim: `.worktrees/kickoff-rules-test-harness` removed clean, `.worktrees/implement-rules-test-harness` on `thejudge-auto/rules-test-harness-work` cut from `origin/main` 652ed0e, claim commit pushed; lock re-taken (`graph-preflight --take-lock`), graph canary `nohup true` denied; `GRAPH-RUN.md` `## Gate verdicts` 11 accept + Q-007/Q-008 accept, brief reconciliation none; `STATUS.owner-action` → `STATUS.refined`; `PRD/work/STATUS.md` row moved to refined | 2026-10-06 |
| 16 | gate-qc | sonnet | ok | `0 → 28` | PASS attempt 7 (build-half re-grade), findings none; base `origin/main` 652ed0e unchanged since attempt 6; live grep 219 hits all with disposition rows (220th was this package's board row, rewritten at the gate move — advisory only); 15 diff blocks, 40 removed lines exact; REQ-222–225 unused; M17, M6 (16/18), M1 (258), M16, M8, M12 reproduced; README `## Preparation gate` PASS; `STATUS.refined` | 2026-10-06 |
| 17 | plan | sonnet | ok | `0 → 29` | `GAMEPLAN.md`, `slice-a-format-v2-loader.md` … `slice-g-hard-area-depth.md` (7 slices), `slice-a.criteria.json` … `slice-g.criteria.json` (77 criteria, all `false`); `STATUS.refined` → `STATUS.active`; `PRD/work/STATUS.md` row moved refined → active; no provider call in any slice (GAMEPLAN non-goals) | 2026-10-06 |
| 18 | build | sonnet | ok | `0 → 458` | PR https://github.com/ChrisMiho/TheJudge/pull/269 (open, MERGEABLE, head 6a23ee2); slices A–G commits 7724cad 5ed9047 a78c9c1 f9e0ef7 3de528c a61e530 6a23ee2; criteria 77/77 `true` (self-reported — hook evidence log holds 0 entries for this run, the known criteria-root gap: the hook reads criteria from the launch checkout); quality:check exit 0 per build report; launch `git status --porcelain` identical before/after; `classifyBuildWrites` over `git diff --name-only 2ceaf23..HEAD` (462 paths) → ok; `STATUS.ship-ready`; PRD applied: system-map, REQ-185–190, NFR-018, REQ-222–225, goals-and-non-goals. Disclosed deviation: slice A ran `npm run eval:answer-quality` dry run, which (by design since 549b12c) loads the key from the main checkout `.secrets/openai-dev.env` and issued one models-list access check — no completion, no cost; later dry runs used a no-key wrapper | 2026-10-06 |
| 19 | review | opus | ok | `0 → 69` | APPROVE at `cb9ba45`, no Critical or Important; reviewer re-ran `npm run quality:check` (exit 0), `eval:worked-solutions` (290/393, 16/18 approved unchanged), `eval:rules-staleness` (0 stale), coverage command to scratch (deep-equals committed `coverage.json`, 256/256, 63/120 does-not-work), a key-free network-blocked `eval:answer-quality` dry run (18 selected, $0.40); verified each slice's `PRD/sections/` edits against `GATE-QUESTIONS.md`. 4 Minor: D4 wording says draft but build writes `needs-edit` per REQ-224; C4 real estimate $0.40 vs about $0.35; an empty `OPENAI_API_KEY` does not stop the loader filling the key from the main checkout, so a plain dry run makes a models-list call; 14 of 58 two-card cases lead with a rule outside the twelve hard areas. Launch checkout unchanged; worktree clean | 2026-10-06 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Build the rules test harness backbone: a six-layer-ready case format, an offline gate that catches dropped cards and missed rules, a budget-safe on-demand answer grader, an owner review flow, and ~400 cases covering every real mechanic once plus ~120 hard interactions" | answered-once | shape | — |
| "Decisions already made — do not re-litigate" (intake `GRAPH-BRIEF.md`, owner decisions of 2026-10-06) | answered-once | define | — (the owner's stated decisions are input to refinement; each one that becomes product truth still gets its own `GATE-QUESTIONS.md` slot, per `## Intake is evidence, never authority`) |
| "take up to 5 more define passes if needed" | answered-once | gate-qc (park after attempt 4) | — (raises the gate-qc loop budget for this run to attempt 9; a process limit, not a product decision — every product choice still goes to the owner in `GATE-QUESTIONS.md`) |
| "id like to add it as context/research/assistance for validation of this use case, so that i can be sure that the next time this is asked, its correct" | answered-once | owner-action (after gate-qc PASS; no node dispatched) | — (driver added `intake/jon-rulemancer/1–3.png` verbatim, a `### Tester case Q2` subsection to `DESIGN-BRIEF.md`, and a README intake pointer; no slot, slice order or count changed, so gate-qc was not re-run) |
| "accept all your recommendations and fill in the answers. Q007 and Q008, i accept your recommendation for both" | answered-once | owner-action (after gate-qc PASS; no node dispatched) | — (driver wrote `accept` into all 11 verdict slots and both blocker answer slots of `GATE-QUESTIONS.md`, as the owner stated) |
