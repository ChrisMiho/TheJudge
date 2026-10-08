# Receipt — exact-curated-rule-exclusion — 2026-10-08

**What happened:** Before this change, the rule search was barred from ever showing a rule if a curated always-on topic listed its parent. That hid 41 trigger, target, priority and zone sub-rules (603.2a to 603.2h and friends) on every card question, because the topic prints only the parent's one sentence. A player asking "does a becomes-tapped trigger fire when the permanent enters tapped?" or "does a prevented-damage trigger still fire?" got an AI that could not see the rule that answers it. Now the search hides only the exact rule numbers a curated topic carries. Sub-rules compete like any other rule and appear when relevant. Nothing that reached the prompt before is lost. Code PR: https://github.com/ChrisMiho/TheJudge/pull/278 (open, not yet merged).

**What it means for you:** Merge PR #278 to ship this. Both closing cases (603.2e for the tapped-trigger question, 603.2g for the prevented-damage question) now rank first and reach the AI. Rules test cases with every deciding rule in the prompt went from 293 to 295 of 392. Answer recall did not move.

## Summary

- Date: 2026-10-08
- Slug: exact-curated-rule-exclusion
- Status: **shipped**
- PR: https://github.com/ChrisMiho/TheJudge/pull/278
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run `graph-20261008-061643` (spec-forming half `graph-20261008-053030`), **PR-ready path**. This receipt and the package deletion are committed on `thejudge-auto/exact-curated-rule-exclusion-work` and ride in PR #278 before the owner's merge.
- Package classification: autonomous (`README.md` carries `## Autonomous metadata`, `Autonomous base: origin/main`).

## What shipped

- Slice A: exact exclusion in both `scoreIndex` branches of `apps/backend/src/gameRulesRetrieval.ts` (keyword and hybrid). A supplemental rule is skipped only when its exact rule number appears in a selected curated topic's rule list. The evidence-trace provider in `scripts/lib/evidence-trace.mjs` mirrors it. New data test `apps/backend/src/gameRulesTopicData.test.ts` pins that every curated topic excerpt matches the committed index.
- Slice B: three prompt goldens moved, the rules-gate baseline raised without `--allow-regressions`, and the whole change re-measured (values below).
- Slice C: the five accepted proposal slots (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220) applied to `PRD/sections/` together with the code.

## Slice B measured values (carried here because the package and `slice-b.evidence.md` are deleted)

Measured 2026-10-08 in `.worktrees/implement-exact-curated-rule-exclusion`, offline (no network, no model call), local embedder present for hybrid rows.

- B1, PR #273 condition: `git diff --stat f98b8feb HEAD -- apps/backend/data` printed nothing, so the committed game-rules data is identical to the brief's measurement base and nothing was re-measured against a refreshed index. Hybrid runs ranked semantically ("Embedding provider: local (392/392 cases ranked semantically)", no lexical fallback).
- B2, goldens: regenerated with `UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval`, exactly three prompt goldens moved, each the named swap: `commander-spellbook-lookup-attached-intent` (614.10a out, 115.1b in), `commander-spellbook-wrong-zone` (500.10a out, 117.3a in), `upkeep-trigger` (609.7a out, 603.3b in). The `upkeep-trigger.fixture.json` description also changed. No context golden moved. 28 of 31 prompt goldens unchanged.
- B3: `npm --workspace apps/backend run test:eval` without the update flag: 3 tests passed.
- B4, baseline: `npm run eval:rules-gate:baseline` (no `--allow-regressions`): "392 cases, 392 scored (289 hit, 103 missed), 11 with a deciding rule carried by a curated topic, 0 awaiting re-freeze, 0 regressed, 0 failed". Newly recorded hits: `triggers-becomes-tapped-not-entering-tapped` (603.2e) and `triggers-damage-prevented-no-trigger` (603.2g). No accepted regressions. The `baseline.json` diff is exactly those two cases moving from miss to hit. Cases with every deciding rule in the prompt: 293 before, 295 after (target 295). `apps/backend/src/eval/rules-gate/rulesGate.test.ts` pins the committed baseline's no-miss count; it moved from `toBe(287)` to `toBe(289)` with the raise.
- B5, `npm run eval:worked-solutions`: 289 of 392 (before 287; target 289), hybrid, local embedder.
- B6, closing cases under hybrid with frozen vectors: `npm run eval:evidence-trace -- --case triggers-becomes-tapped-not-entering-tapped --case triggers-damage-prevented-no-trigger` on clean commit `eba01255`. Vector source `frozen` for both ("0 ranked with a locally embedded vector"). 603.2e rank 1, selected in System 3, not skipped for curated topic, available to the answer. 603.2g rank 1, same. Trace gate check: "2 cases held against baseline.json, 2 agree, 0 diverge". The trace file is gitignored. The trace refuses a dirty checkout, so the raised `baseline.json` was committed on its own first.
- B7, lexical (recorded, not gated): `EMBEDDING_PROVIDER=mock npm run eval:worked-solutions` ("0/392 cases ranked semantically"): 225 of 392 overall. First-ship cases lexical: 14 of 18 (misses `combat-damage-assignment-order-multiple-blockers`, `panharmonicon-controller-not-entering-permanent`, `sensei-top-leaves-battlefield-ability-on-stack`, `restoration-angel-blink-resets-counters`), same as the earlier 14 of 18. Both closing cases HIT under lexical ranking. First-ship cases hybrid: 16 of 18, the same two misses as before (`panharmonicon-controller-not-entering-permanent` 603.2, `restoration-angel-blink-resets-counters` 400.7).
- B8, benchmark recall@5: `npm run benchmark:rag-retrieval`: lexical-idf clean 0.5833, polluted 0.5769 (n=156). `npm run benchmark:rag-retrieval -- --semantic`: semantic-local clean 0.8974, polluted 0.8910. Both equal the earlier REQ-220 record. Unchanged. The two tracked result files were restored with `git checkout --` after the run.
- Context-evaluation System 3 checks: semantic 14/14 PASS across 9 labelled fixtures; lexical 14/14, checklist-report golden unchanged.
- Not measured: whole-prompt size change (brief: median 0, p95 +79, max +465, mean -30 characters). It was "if cheap"; the brief's number stands.

## Verification

- Review (node 7) approved PR #278 head `70c4a1b4`: all 24 criteria met with re-run evidence. `npm run quality:check` exit 0 (frontend 1559, backend 630, scripts 766), `test:eval` green without the update flag, rules-gate baseline re-run 289 hit / 0 regressed and byte-identical, worked-solutions 289/392 local, evidence-trace 603.2e/603.2g rank 1 from frozen vectors, recall@5 unchanged. 0 Critical, 0 Important, 4 Minor (below).
- This node changed only docs (receipt, board, package deletion); no code path changed after the review's `quality:check`, so it was not re-run here.
- All three `slice-<letter>.criteria.json` files read: 7/7, 9/9, 8/8 true (0 `false` entries).
- Hook evidence log: 0 entries for this run (known evidence-root gap). Criteria flips are self-reported, and review is the integrity gate.

## Durable truth confirmed

Applied at build (slice C), confirmed present on the branch, and not re-written here. `git diff origin/main --stat -- PRD/sections` shows six files: `functional-requirements.md` (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220), `in-depth/README.md`, `quick-lookup/README.md`, `integrations-and-data.md`, `system-map.md`, `system-map/game-rules-retrieval.md`. Nothing left to promote. The `system-map.md` "Supplemental retrieval (System 3)" entry already reads `Status: shipped` (the feature refines an already-shipped capability), so no `planned`/`partial` to `shipped` flip applies.

## Autonomous gate: PR-ready path (pre-merge checks)

1. Checkout is `.worktrees/implement-exact-curated-rule-exclusion` on `thejudge-auto/exact-curated-rule-exclusion-work`; after `git fetch origin`, `HEAD` equals `origin/thejudge-auto/exact-curated-rule-exclusion-work` (`5eb075ca`). Pass.
2. `gh pr view 278`: state OPEN, head `thejudge-auto/exact-curated-rule-exclusion-work`, base `main`. Pass.
3. Package `STATUS.ship-ready`; every criterion in all three criteria files `true`. Pass.
4. Runtime-cleanup criteria: backend/script test work only, no browser, port or dev-server session was started, so there is nothing to clean up. Pass.

Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/278

## Follow-ups (not fixed in this node)

- M1: the module header comment at `scripts/lib/evidence-trace.mjs` lines 11-13 still describes curated parents whose lettered subrules are excluded with them. The code now excludes exact numbers only.
- M2: the three prompt goldens landed in slice A's commit (`f0f16d76`), not slice B's, because the golden test runs inside `quality:check` and fails the moment the scorer changes. Commit order only.
- M3: `slice-b.evidence.md` B7's hybrid 16/18 line names no command of its own; it comes from the B5 worked-solutions run.
- M4: the committed `apps/backend/src/eval/benchmark/results.json` polluted recall@5 is stale (0.5256 committed versus 0.5769 fresh). Pre-existing, not caused by this change.
- Hook evidence log earned 0 entries for this run (known evidence-root gap; criteria flips self-reported, review is the integrity gate).

## Actions taken

- Read the skill, the package, the ledger, `slice-b.evidence.md` and the intake brief; ran the four PR-ready checks above.
- Wrote this receipt before deleting the package, with `## Graph run` carrying both ledger tables verbatim.
- Removed the package row from the `## ship-ready` table in `PRD/work/STATUS.md`.
- `git rm -r PRD/work/exact-curated-rule-exclusion/` (no worktree and no branch removed; `npm run graph:prune` handles those after the owner merges).

## Files

- Created: `PRD/instructions/receipts/exact-curated-rule-exclusion-2026-10-08.md`
- Updated: `PRD/work/STATUS.md`
- Deleted: all of `PRD/work/exact-curated-rule-exclusion/` (DESIGN-BRIEF, GAMEPLAN, GATE-QUESTIONS, GRAPH-RUN, IDEA, QUALITY-CHECK, README, STATUS.ship-ready, three slice docs, three criteria files, `slice-b.evidence.md`, `intake/GRAPH-BRIEF.md`)
- Code and truth files (already on the branch from build): `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/src/gameRulesRetrieval.test.ts`, `apps/backend/src/gameRulesTopicData.test.ts` (new), `apps/backend/src/eval/rules-gate/baseline.json`, `apps/backend/src/eval/rules-gate/rulesGate.test.ts`, three prompt goldens plus `upkeep-trigger.fixture.json` under `apps/backend/src/eval/fixtures/`, `scripts/lib/evidence-trace.mjs`, `scripts/lib/evidence-trace.test.mjs`, and the six `PRD/sections/` files named above.

## Graph run

- Run ID: `graph-20261008-053030` (spec-forming half) and `graph-20261008-061643` (build half) | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/278

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 9` | `npm run graph:preflight -- --branch thejudge-auto/exact-curated-rule-exclusion --slug exact-curated-rule-exclusion --run-id graph-20261008-053030 --pid 19738` exit 0; branch `thejudge-auto/exact-curated-rule-exclusion` pushed from `.worktrees/kickoff-exact-curated-rule-exclusion` (`git ls-remote` → 5a65c91d); lock `.worktrees/.graph-run.lock` runId graph-20261008-053030 pid 19738; launch checkout still on `main` | 2026-10-08 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/exact-curated-rule-exclusion/IDEA.md`, `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` (`cmp` identical to staging); `PRD/work/STATUS.md` ideation row; 6 `## Prior run` lines in IDEA.md; launch checkout `git status --porcelain` unchanged | 2026-10-08 |
| 3 | define | opus | ok | `0 → 42` | `PRD/work/exact-curated-rule-exclusion/DESIGN-BRIEF.md` (270 lines, 46-row line-level amendment set: 19 amend / 27 no change); `GATE-QUESTIONS.md` present → product truth proposed, gates (5 slots: REQ-179, REQ-022, REQ-181, REQ-182, REQ-220; blank verdicts; Blocker questions: none); `STATUS.ideation` → `STATUS.refined`; board row moved ideation → refined; `git diff HEAD -- PRD/sections apps scripts` empty; launch checkout unchanged | 2026-10-08 |
| 4 | gate-qc | sonnet | failed | `0 → 45` | FAIL attempt 1 of 3 — `PRD/work/exact-curated-rule-exclusion/QUALITY-CHECK.md`: 3 must-fix (F1 803-not-926 excerpt size; F2 127 per-topic sum vs 125 distinct; F3 closing-case criterion names no ranking path / evidence-trace provider) + 4 minor; amendment set, verbatim removed lines and block format passed. Driver recorded FAIL in README `## Preparation gate`, `STATUS.refined` → `STATUS.refining`, board row → refining; loops to define | 2026-10-08 |
| 5 | define | opus | ok | `0 → 28` | attempt 2: `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` edited in place — F1 803 chars (measured offline, brief `## Measured at define`); F2 125 distinct / 127 per-topic sum; F3 closing cases bound to hybrid frozen-vector path, lexical recorded at build (new D11); M1–M4 addressed (M3 adds amendment row 47 → 47 rows: 20 amend / 27 no change); verdict slots blank; `STATUS.refining` → `STATUS.refined`, board row → refined; no `PRD/sections/` or code diff; launch checkout unchanged | 2026-10-08 |
| 6 | gate-qc | sonnet | ok | `0 → 33` | PASS attempt 2 — `PRD/work/exact-curated-rule-exclusion/QUALITY-CHECK.md`: F1–F3 and M1–M4 resolved; 0 must-fix; N1/N2 non-blocking for map-out. Observation: the checker traced numbers to the intake-cited probe outputs (`PRD/work/probe-keyword-rule-retrieval/measure-two-fixes.out.txt`, `FINDINGS-missing.md`, launch checkout, read-only) — the contract says intake-cited documents are never opened; no file was written and the proposal is unaffected. Driver recorded PASS in README `## Preparation gate`; `STATUS.refined` → `STATUS.owner-action`; board row → owner-action | 2026-10-08 |
| — | gate-review | sonnet | ok | `0 → 13` | build-half run `graph-20261008-061643`: 5/5 verdicts `accept` (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220); `GATE-QUESTIONS.md` unchanged; `### Brief reconciliation` none; `## Gate verdicts` written; `## Open gate` RESOLVED; `STATUS.owner-action` → `STATUS.refined`; board row → refined; launch checkout `git status --porcelain` unchanged | 2026-10-08 |
| 4 | gate-qc | sonnet | ok | `0 → 17` | PASS (build-half re-grade, run `graph-20261008-061643`) — `PRD/work/exact-curated-rule-exclusion/QUALITY-CHECK.md`: 0 must-fix; 28/28 removed lines verbatim at the brief's line numbers; 47-row amendment set complete; code sites + numbers re-confirmed (803 chars, 125 distinct / 127 sum); PR #273 still open so intake numbers stand; N1/N2 non-blocking for map-out. Driver recorded PASS in README `## Preparation gate`; `STATUS.refined` kept; launch checkout unchanged | 2026-10-08 |
| 5 | plan | sonnet | ok | `0 → 24` | `GAMEPLAN.md` + 3 slices: `slice-a-exact-exclusion-code.md` (exact exclusion in both `scoreIndex` branches, evidence trace, tests, new `apps/backend/src/gameRulesTopicData.test.ts`), `slice-b-goldens-baseline-measure.md` (3 goldens, baseline without `--allow-regressions`, re-measure; 603.2e/603.2g hybrid gate), `slice-c-prd-truth-and-close.md` (apply 5 accepted slots by intent); `slice-{a,b,c}.criteria.json` 7/9/8 criteria all false; `STATUS.refined` → `STATUS.active`; board row → active; no deliverable under `PRD/work/` except bookkeeping `slice-b.evidence.md` (copied into REQ-179 Notes by C); launch checkout unchanged. Driver: copied ignored `apps/backend/data/models/` into the worktree (local embedder) | 2026-10-08 |
| 6 | build | sonnet | ok | `0 → 124` | code PR https://github.com/ChrisMiho/TheJudge/pull/278 (OPEN, MERGEABLE, `thejudge-auto/exact-curated-rule-exclusion-work` → main); commits f0f16d76 (A), eba01255 + 26f74798 (B), f34db0cc (C); criteria 7/7, 9/9, 8/8 true at `origin/thejudge-auto/exact-curated-rule-exclusion-work`; reported quality:check green, backend 630/630, test:scripts 766/766; rules gate 293 → 295 of 392 (baseline 289 hit, 0 regressed, no accepted regressions), worked-solutions 287 → 289, hybrid first-ship 16/18, lexical 14/18, context-eval 14/14 each way, 603.2e/603.2g selected rank 1 under hybrid; 3 prompt goldens swapped. Return-side: launch checkout `git status --porcelain` identical to `.worktrees/.graph-intake/launch-status-before-build-exact-curated-rule-exclusion.txt`; `classifyBuildWrites` over 30 branch paths → ok (all inside `.worktrees/implement-exact-curated-rule-exclusion/`). Hook evidence log: 0 entries for this run (known evidence-root gap; criteria flips self-reported, review is the integrity gate). Deviation: goldens regenerated in slice A's commit (golden test runs in quality:check) | 2026-10-08 |
| 7 | review | opus | ok | `0 → 57` | APPROVE on PR #278 head `70c4a1b4` (no-write `Plan`-type reviewer): all 24 criteria met with re-run evidence — quality:check exit 0 (frontend 1559, backend 630, scripts 766), test:eval green without update flag, rules-gate baseline re-run 289 hit / 0 regressed and byte-identical, worked-solutions 289/392 local, evidence-trace 603.2e/603.2g rank 1 selected from frozen vectors, recall@5 unchanged via direct `runBenchmark`/`scoreBenchmarkSemantic`; 0 Critical, 0 Important; 4 Minor (M1 stale module header `scripts/lib/evidence-trace.mjs:11-13`; M2 goldens in slice A commit, known deviation; M3 evidence B7 16/18 line names no own command; M4 stale committed polluted recall5 in `results.json`, pre-existing); worktree clean after review | 2026-10-08 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Rule search stops hiding curated parents' sub-rules: exclude only the exact rule numbers a curated topic carries (REQ-179)" | answered-once | shape | — |

## Intake

- `intake/GRAPH-BRIEF.md` — supplied at launch of the spec-forming run: staged at `.worktrees/.graph-intake/graph-20261008-053030/GRAPH-BRIEF.md` and copied byte for byte into the package. A self-contained graph-run brief ("rule search stops hiding sub-rules the prompt never shows", measured 2026-10-07 on PR #276's head `f98b8feb`). Evidence only, never authority.
