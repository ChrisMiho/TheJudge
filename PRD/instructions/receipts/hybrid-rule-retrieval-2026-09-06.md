# Receipt — hybrid-rule-retrieval

**What happened:** A player asking Ask AI a rules question now gets up to
five official rule excerpts chosen by a blend of "which rule means the same
thing" and "which rule shares this question's rare words," instead of one or
the other. A short Quick Lookup question (a card name, type line, one
keyword) still gets the exact rule it got before; a long question keeps the
meaning-search gain measured in the prior run. A hard automated check now
blocks any change that would regress that blend before it ships, the
Lambda deploy package regained real headroom, and the deployed backend now
turns the meaning-search mode on by default.

**What it means for you:** nothing to do. The feature is live, its gates are
green, and the work package is closed.

- Date: 2026-09-06
- Slug: `hybrid-rule-retrieval`
- Status: shipped

## Actions

- Shipped the hybrid lexical+semantic blend in `apps/backend/src/gameRulesRetrieval.ts`
  (Slice A): a normalised linear blend of cosine similarity and lexical IDF
  score, `alpha = 0.6`, over the full candidate list, with a new
  cross-reference boost (`SCORE_CROSS_REFERENCE = 10`) so a question citing a
  rule number surfaces rules that cite the same number back — including on
  the Quick Lookup path, where two call sites in
  `apps/backend/src/prompt/preparation.ts` were fixed to pass
  `questionRuleIds` (a review-loop Critical finding, resolved and
  re-approved).
- Made the benchmark fail loudly instead of silently reporting a lexical
  number under a semantic label when the embedder is unavailable
  (`scripts/rag-retrieval-benchmark.mjs`, `apps/backend/src/eval/ragRetrievalBenchmark.ts`).
- Turned the two semantic eval checks (`system3-expected-recall`,
  `system3-noise-excluded`) from report-only into a hard `test:eval` gate,
  and added one new labelled fixture for a multi-keyword card (Slice B,
  `apps/backend/src/eval/contextEvaluationHarness.test.ts`,
  `apps/backend/src/eval/fixtures/`).
- Re-encoded the committed rule-embedding vectors from float32-base64 to
  int8-base64, scaled from the corpus's own largest component rather than a
  fixed theoretical bound, shrinking the artifact from 5.650 MB to 1.442 MB
  with no recall regression (Slice C, `scripts/build-rule-embeddings.mjs`,
  `apps/backend/data/gameRulesRuleEmbeddings.json`,
  `scripts/lambda-package-budget.test.mjs`).
- Defined and measured "cold start with the model loaded": 181.2 ms of
  wall-clock model readiness on a warmed local cache, recorded against the
  3-second AI latency target (Slice D, `PRD/sections/non-functional-requirements.md`
  NFR-002).
- Made `EMBEDDING_PROVIDER=local` the deployed Lambda default, the same way
  `ASK_AI_PROVIDER=openai` is already set, and added a test proving
  `scripts/package-lambda.sh` refuses to build without the packaged model
  cache rather than silently degrading (Slice E, `scripts/aws-deploy.sh`,
  `scripts/aws-bootstrap.sh`, `scripts/package-lambda.test.mjs`).
- Applied all 15 `GATE-QUESTIONS.md` proposal blocks to `PRD/sections/` by
  intent, together with the code, across Slices A–E: `REQ-182` (new),
  `REQ-183` (new), `REQ-184` (new), and amendments to `REQ-022`, `REQ-032`,
  `REQ-177`, `REQ-181`, `NFR-002`, `NFR-017` (including the owner's edit
  recording the CUDA-runtime CI fix from PR #194), `system-map.md`,
  `system-map/game-rules-retrieval.md`, `system-map/prompt-layout-spec.md`,
  `quick-lookup/README.md`, `in-depth/README.md`, and
  `integrations-and-data.md`.

## Files created / updated / deleted

Created (durable, this cleanup):
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` (this file)

Updated (this cleanup):
- `PRD/work/STATUS.md` — removed the `hybrid-rule-retrieval` row from
  `## ship-ready`
- `PRD/sections/system-map.md` — already `shipped` for the "Supplemental
  retrieval (System 3)" entry (carried over from the prior
  `rag-rule-retrieval` closeout); already lists `REQ-182`, `REQ-183`, and
  `REQ-184` in its `Backed by:` line and already describes the hybrid blend —
  no flip needed, nothing promoted

Deleted (this cleanup):
- `PRD/work/hybrid-rule-retrieval/` (entire folder: `README.md`,
  `GAMEPLAN.md`, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GRAPH-RUN.md`,
  `IDEA.md`, `STATUS.ship-ready`, five slice docs, five
  `slice-*.criteria.json` files, `intake/`)

Created/updated during the build slices (code PR #197, already merged —
listed here for the record, not written by this cleanup):
- `apps/backend/src/gameRulesRetrieval.ts`,
  `apps/backend/src/prompt/preparation.ts`,
  `apps/backend/src/prompt/preparation.test.ts`
- `scripts/rag-retrieval-benchmark.mjs`,
  `apps/backend/src/eval/ragRetrievalBenchmark.ts`,
  `apps/backend/src/eval/ragRetrievalBenchmark.test.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`,
  `apps/backend/src/eval/fixtures/`
- `scripts/build-rule-embeddings.mjs`,
  `apps/backend/data/gameRulesRuleEmbeddings.json`,
  `scripts/lambda-package-budget.test.mjs`
- `scripts/aws-deploy.sh`, `scripts/aws-bootstrap.sh`,
  `scripts/package-lambda.sh`, `scripts/package-lambda.test.mjs`
- `PRD/sections/functional-requirements.md`,
  `PRD/sections/non-functional-requirements.md`,
  `PRD/sections/system-map.md`,
  `PRD/sections/system-map/game-rules-retrieval.md`,
  `PRD/sections/system-map/prompt-layout-spec.md`,
  `PRD/sections/quick-lookup/README.md`,
  `PRD/sections/in-depth/README.md`,
  `PRD/sections/integrations-and-data.md`

## Verification results

- Slice completion: all five slices (A–E) recorded `## Status: done` in
  their slice docs.
- Acceptance criteria: 33/33 `true` across all five `slice-*.criteria.json`
  files (A 10/10, B 6/6, C 8/8, D 2/2, E 7/7).
- Labelled fixture checks: 14/14 (12 original + 2 from Slice B's new
  multi-keyword-card fixture).
- Benchmark recall@5 (semantic path, hybrid blend, `alpha = 0.6`): clean
  0.8974, polluted (with cards) 0.8910 — both above the accepted floors
  (0.8526 / 0.8333) with headroom.
- Lambda package data budget: 113.887 MB of the 120 MB budget (6.113 MB
  headroom), down from 118.095 MB before the int8 re-encoding.
- Cold-start model readiness: 181.2 ms (wall-clock, process start to first
  System 3 query embedding, warmed on-disk cache, no network call),
  recorded in NFR-002.
- Durable truth confirmed present in `PRD/sections/`: all 15
  `GATE-QUESTIONS.md` blocks (`REQ-182`, `REQ-183`, `REQ-184` new;
  `REQ-022`, `REQ-032`, `REQ-177`, `REQ-181`, `NFR-002`, `NFR-017`,
  `system-map.md`, `system-map/game-rules-retrieval.md`,
  `system-map/prompt-layout-spec.md`, `quick-lookup/README.md`,
  `in-depth/README.md`, `integrations-and-data.md` amended) verified present
  in the live files by this cleanup — none re-written, none missing.
- Autonomous merge-proof gate: current branch `thejudge-auto/hybrid-rule-retrieval`
  matches the recorded autonomous base exactly; PR #197 is `MERGED`
  (`gh pr view 197`), merging into `thejudge-auto/hybrid-rule-retrieval` at
  merge commit `3f0705c`, which is an ancestor of `HEAD`
  (`b4dd257`); the implementation worktree
  `.worktrees/implement-hybrid-rule-retrieval` is clean at `bf74140`, and
  `bf74140` is an ancestor of `HEAD`. No runtime-process-hygiene acceptance
  criteria were recorded in this package's slices (no browser/server session
  work), so that check is not applicable.

## Graph run

- Run ID: `graph-20260905-191535` (build half, `/loop graph-implement`; spec-forming half `graph-20260905-173655`) | Profile: spec-forming half `loaded (env sentinel)`; build half `unverified` | Terminal state: `close` node, run reaches `COMPLETE` on this cleanup

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 4` | branch `thejudge-auto/hybrid-rule-retrieval` created from `main` (`0243e83`, tree `clean`, no stash) and pushed to `origin` (`git ls-remote` confirms); lock `.worktrees/.graph-run.lock` runId `graph-20260905-173655` pid 77812; both canaries denied (2 rows in `.worktrees/.graph-denials.jsonl` for this run); `Profile: loaded (env sentinel)`; base→main guard passed (no open `thejudge-auto/*` PR) | 2026-09-05 |
| 2 | shape | sonnet | ok | `0 → 44` | package `PRD/work/hybrid-rule-retrieval/` created (`IDEA.md` with 8 `## Prior run` receipts, `README.md` `status: ideation`, `STATUS.ideation`, board row under `## ideation`); 2 intake files copied verbatim into `intake/` (`cmp` clean, driver re-checked) from `.worktrees/.graph-intake/graph-20260905-173655/`, staging deleted; 21 tool calls, no subagents; commit `8fc3f8b` pushed | 2026-09-05 |
| — | driver-bookkeeping | — | ok | `n/a (driver)` | `## Autonomous metadata` (`origin/thejudge-auto/hybrid-rule-retrieval`) written to the package README; ledger moved into the package from the driver's scratchpad; committed with the node 3 dispatch prompt recorded | 2026-09-05 |
| 3 | define | opus | ok | `0 → 69` | `STATUS.refined`, board row under `## refined`; `DESIGN-BRIEF.md` (401 lines, four items in one spec, measurement plan) + `GATE-QUESTIONS.md` (865 lines, 14 slots: 3 new REQ-182/183/184, 11 amended — REQ-022/032/177/181, NFR-002/017, system-map.md, game-rules-retrieval.md, quick-lookup/README.md, in-depth/README.md, integrations-and-data.md; 0 blocker questions; 18 `Current:` blocks verified byte-for-byte by script). Measurements reproduced: `test:eval` semantic 9/12 (three fixtures fail, not the intake's two) lexical 12/12; benchmark lexical clean r@5 0.5833, semantic 0.8526/0.8333; budget test 118.095 MB of 120 MB; hybrid probe α=0.52 → 12/12 fixtures + 0.8654/0.8333; cold start 181.2 ms model readiness in-process; int8 vectors 5.650 → 1.442 MB. Finding: `benchmark:rag-retrieval -- --semantic` silently reports lexical numbers under a cold model cache (REQ-177 amendment). Gate signal present (`GATE-QUESTIONS.md`) → continue to `gate-qc`. No `PRD/sections/` or code edits (`git diff --stat` empty); 63 tool calls, no subagents; commit `227eeda` pushed | 2026-09-05 |
| 4 | gate-qc | sonnet | failed → define (loop 1 of 3) | `0 → 40` | FAIL, one finding: `PRD/sections/system-map/prompt-layout-spec.md:36` (row 8, `ADDITIONAL RELEVANT RULE EXCERPTS`) still asserts semantic-primary ranking with keyword fallback and has no `GATE-QUESTIONS.md` block (driver confirmed by grep: 0 mentions of `prompt-layout-spec` in the proposal). Everything else passed: 12 `Current:` blocks byte-identical, amendment-set grep otherwise covered, REQ-182/183/184 unused and next free, all four measurements reproduced exactly (`test:eval` 9/12 semantic, 12/12 lexical; benchmark 0.5833 / 0.8526 / 0.8333; budget 118.095 MB). Node set `STATUS.refining`, board row under `## refining`; 29 tool calls, no subagents; commit `214d184` pushed. Driver wrote `## Preparation gate` FAIL to the README | 2026-09-05 |
| 3 | define (attempt 2) | opus | ok | `0 → 34` | one block added to `GATE-QUESTIONS.md`: `## system-map/prompt-layout-spec.md — the prompt anatomy spec` (row 8 + `Backed by:` line, REQ-182 wording); 16 `## ` headings now (15 stable-id/spec blocks + `## Blocker questions`); 16-term amendment-set re-grep found no further uncovered assertion; 21 `Current:` fences script-verified, 0 mismatches; brief's spec list now names six files; `STATUS.refined`, board row under `## refined`; no `PRD/sections/` or code edits (`git diff --stat` empty); 30 tool calls, no subagents; commit `f13f8d2` pushed | 2026-09-05 |
| 4 | gate-qc (attempt 2) | sonnet | ok | `0 → 35` | PASS, no findings: 21/21 `Current:` excerpts byte-identical by script (incl. the new `prompt-layout-spec.md` block); REQ-182/183/184 unused, REQ-181 highest live; 13-term amendment-set re-grep leaves no uncovered assertion; measurements reproduced once each (`test:eval` semantic 9/12 / lexical 12/12; benchmark 0.5833 lexical, 0.8526/0.8333 semantic; budget 118.095 MB of 120 MB); hybrid gates are measured thresholds with baselines; `STATUS.refined` unchanged, nothing committed; 28 tool calls, no subagents. Driver discarded the benchmark's regenerated `scoredAt` timestamps in `results.json`/`semantic-results.json` (`git checkout --`, timestamp-only) → stop at PASS: docs PR + `owner-action` park | 2026-09-05 |
| — | driver-resume | — | ok | `n/a (driver)` | build half (`/loop graph-implement`, tick 1, 2026-09-05): `git fetch origin`; no stop sentinel; no lock held; ready-spec scan found `hybrid-rule-retrieval` at `STATUS.owner-action` with 15/15 `- Verdict:` slots answered (14 accept, 1 edit on NFR-017), docs PR #195 MERGED 2026-09-05T19:11:26Z at `c0aa52c`, no code built; base `thejudge-auto/hybrid-rule-retrieval` fast-forwarded to `origin/main` (`c0aa52c`); claim commit `b41ec8c` (`STATUS.active`, README `status: active`, board row under `## active`); lock taken (`npm run graph:preflight -- --take-lock --slug hybrid-rule-retrieval --run-id graph-20260905-191535`, pid 13714); graph canary `nohup true` denied | 2026-09-05 |
| — | gate-review | sonnet | ok | `0 → 24` | applied 14 accept / 1 edit / 0 reject inside `GATE-QUESTIONS.md` (NFR-017 gained one `- Notes:` bullet recording the CUDA-runtime CI rejection and PR #194's fix; `git show 334f377 -- GATE-QUESTIONS.md` +7 lines); `git diff -- PRD/sections/` empty; `## Gate verdicts` written (15 rows), `## Open gate` resolved 2026-09-05; `STATUS.active → STATUS.refined`, README `status: refined`, board row under `## refined`; 12 tool calls, no subagents, 0 denials; commit `334f377` (local, not pushed) | 2026-09-05 |
| 4 | gate-qc (build half, attempt 1) | sonnet | ok | `4 → 29` (4 driver calls charged before dispatch) | PASS, no findings: 21/21 `Current:` blocks byte-identical by script against live `PRD/sections/` at `c0aa52c`; REQ-182/183/184 unused, next free after REQ-181; 16-term amendment-set grep (three new terms) found only unrelated hits (UI `hybrid %` bands, `decisions/deployment.md` S3 staging); NFR-017 owner edit consistent with `scripts/package-lambda.sh` lines 43–44 (`ONNXRUNTIME_NODE_INSTALL_CUDA=skip`) and 64–101 (unzipped-size breakdown), `lambda-package-budget.test.mjs` still hardcodes the 130 MB reserve as the edit states; `test:eval` semantic 9/12 (same three fixtures) lexical 12/12; budget test 2/2, 118.095 MB of 120 MB; all 15 verdict slots filled; nothing committed, tree clean; 21 tool calls, no subagents, 0 denials. Driver wrote `## Preparation gate` PASS to the README | 2026-09-05 |
| 5 | plan | sonnet | ok | `0 → 83` (node self-reported 34; the hook counter is the record) | `GAMEPLAN.md` + five slice docs (A `slice-a-hybrid-blend.md`, B `slice-b-eval-gating.md`, C `slice-c-lambda-vector-budget.md`, D `slice-d-cold-start-measurement.md`, E `slice-e-deploy-default.md`) + `slice-{a..e}.criteria.json` (10/6/8/2/7 criteria, driver-checked: all `false`, every one with an `evidence` block; 3 `manual`); all 15 `GATE-QUESTIONS.md` blocks assigned one slice each in the GAMEPLAN's assignment table (A 8, B 1, C 2, D 1, E 3); README slice table + implementation map, `status: active`, `STATUS.refined → STATUS.active` (only marker), board row under `## active`; `## Preparation gate` PASS verified by the node; no subagents, 0 denials; commit `94b3b33`; `git status --porcelain` empty | 2026-09-05 |
| — | driver-bookkeeping | — | ok | `n/a (driver)` | publish before build: ledger + README + GAMEPLAN + slices + `STATUS.active` + board row pushed to `origin/thejudge-auto/hybrid-rule-retrieval` at `fff2df3` (GitHub had deleted the branch after PR #195 merged; re-created); `git status --porcelain` empty; base frozen from here | 2026-09-05 |
| 6 | build | sonnet | failed → parked (decision blocker) | `0 → 219` | worktree `.worktrees/implement-hybrid-rule-retrieval` on `thejudge-auto/hybrid-rule-retrieval-work`; PR #197 https://github.com/ChrisMiho/TheJudge/pull/197 (`-work` → base, head `c9487c1`, MERGEABLE) carrying slice D done (2/2 criteria; cold start 181.2 ms recorded in NFR-002, matching the brief). Slice A blocked at 6/10 criteria (A2/A5/A7/A10 false): built over the full candidate list as REQ-182 requires, no `alpha` in the accepted band `[0.50, 0.70]` passes all 12 fixture checks — `state-based-actions` loses `701.8b` at every alpha from 0.50 to 0.70 (crossover solves to alpha ≈ 0.4787), while the two lookup fixtures the blend exists to fix pass at every alpha; the brief's 12/12 probe fused only the top 15 candidates per ranking. Sweep in `slice-a-hybrid-blend.md` `## Blocker`: 11/12 at every alpha; clean/polluted recall@5 0.8526/0.8205 (0.50), 0.8974/0.8910 (0.60), 0.9167/0.9038 (0.70). Slice A code left uncommitted in the worktree (`gameRulesRetrieval.ts`/`.test.ts`, `ragRetrievalBenchmark.ts`/`.test.ts`, two benchmark result files); no `PRD/sections/` block applied because REQ-182's text asserts the 12/12 figure. B, C, E planned (depend on A). Write scope held: launch-checkout writes only under `PRD/work/hybrid-rule-retrieval/` (README, slice-a/d docs, slice-a/d criteria). `quality:check` exit 0. 1 hook denial (`rm -rf` of two worktree `.tmp/` debug files, universal tier; not retried). Node self-reported 216 calls | 2026-09-05 |
| — | driver-resume | — | ok | `n/a (driver)` | park committed locally `3f38119`; lock released `PARKED`; loop stopped. Owner answered in session the same day: rejected 11/12, chose the cross-reference boost (see `## Open gate` Decision and `## Instruction ledger`); driver investigation grounded it — 701.8b is present in the index and cites 704.5g in its text, only 701.8b and 702.12b cite 704.5g, the question cites 704.5g, and today's boost matches a rule's own id only (`computeIdBoost`), so the miss is a missing signal, not stale data. `STATUS.owner-action → STATUS.active`, README `status: active`, board row under `## active`; lock re-taken with the same run id; graph canary denied again | 2026-09-05 |
| 6 | build (attempt 2, same builder resumed with the owner's decision) | sonnet | ok (bookkeeping follow-up pending) | `0 → 364` | PR #197 https://github.com/ChrisMiho/TheJudge/pull/197 head `e0ec080`, MERGEABLE, checks static/backend/frontend×3/coverage-merge SUCCESS; five slice commits on `thejudge-auto/hybrid-rule-retrieval-work` (`c9487c1` D, `323931e` A, `c97a12f` B, `4a9c0c2` C, `e0ec080` E), `fff2df3..e0ec080` 27 files +1323/−221 incl. 8 `PRD/sections/` files (+159/−67; REQ-182/183/184 live on the head). Cross-reference boost `SCORE_CROSS_REFERENCE = 10`, `HYBRID_BLEND_ALPHA = 0.6`; builder-reported gates: fixture checks 14/14 (12 original + 2 from slice B's new fixture), benchmark recall@5 clean 0.8974 / polluted 0.8910 (bars 0.8526 / 0.8333), Lambda data 113.887 MB of 120 (from 118.095), cold start 181.2 ms; int8 scale computed from the corpus (fixed scale regressed clean recall 0.8974→0.8910); `package-lambda.sh` model-cache check now refuses instead of warning. Criteria 33/33 `true` (driver-read: a 10/10, b 6/6, c 8/8, d 2/2, e 7/7) — **in the launch-checkout copies only**: the PR head's `PRD/work/hybrid-rule-retrieval/` still carries all-planned README, all-`false` criteria, and `STATUS.active`, so the package bookkeeping was never committed to `-work`. Write-scope assertion: launch-checkout writes are `PRD/work/hybrid-rule-retrieval/*` plus `PRD/work/STATUS.md` (board row `## active → ## ship-ready` only, the skill's own ship-ready transition; accepted as that mandated status write, not a product-truth leak). Worktree clean at `e0ec080`; `quality:check` exit 0 (builder); 5 `criterion-flip-without-evidence` denials on `slice-b.criteria.json` (guard working; later earned) + 1 `rm -rf` (universal tier); builder self-reported 360 calls. One scratch stash `slice-b-eval-gating.md B1 evidence note` left in the shared stash list (not the preflight stash; untouched) | 2026-09-05 |
| 6 | build (attempt 2, bookkeeping follow-up) | sonnet | ok | `364 → 380` (same attempt budget) | commit `b45d85d` pushed to `thejudge-auto/hybrid-rule-retrieval-work` (PR #197 head, MERGEABLE): README, five slice docs, five criteria files, `STATUS.active → STATUS.ship-ready`, and `PRD/work/STATUS.md` copied byte-identical from the launch checkout (builder `diff` ×12 identical; driver re-checked README + two criteria files against `origin/…-work`); no code, data, or `PRD/sections/` change; worktree clean; 15 calls. Build node closed `ok` — 33/33 criteria `true` on the PR head | 2026-09-05 |
| 7 | review | opus | failed → build (loop 1 of 2) | `0 → 43` | no-write reviewer (Explore type), 39 self-reported calls, no subagents, 0 denials. Verdict RETURN TO BUILD. 29/33 criteria met; Critical A1: `apps/backend/src/prompt/preparation.ts:223` and `:266` (Quick Lookup path) call `retrieveRulesForQuery(WithDebug)` with eight positional args, so the ninth `questionRuleIds` defaults to `[]` and `computeCrossReferenceBoost` returns 0 in lookup mode while the game path (`retrieveSupplementalRules`) passes it — the live REQ-182 criterion carves out no mode; driver confirmed by reading both call sites and the signature (`gameRulesRetrieval.ts:803`, `:858`). Important A10/E7: `PRD/sections/system-map.md:90` `Backed by:` ends at REQ-183; the finalized block ends `REQ-182, REQ-183, REQ-184` (driver confirmed). Minor, no action: A7 MRR figures in REQ-182 Notes are pre-quantisation (0.7139/0.6928 vs committed 0.7107/0.6931); D2's dated bullet still names the 5.65 MB artifact size. Commands green: `test:eval` 14/14, `gameRulesRetrieval` 65/65, `ragRetrievalBenchmark` 5/5, typecheck, budget test 2/2, data 113.887 MB | 2026-09-05 |
| 6 | build (attempt 3, review loop 1) | sonnet | ok | `0 → 80` (one stream-watchdog stall at 47, resumed in place; 0 denials) | head `bf74140` pushed to `thejudge-auto/hybrid-rule-retrieval-work` (PR #197, MERGEABLE; static/backend SUCCESS, frontend shards pending at record time); `b45d85d..bf74140` 6 files +215/−7. Critical A1 resolved: both lookup call sites in `apps/backend/src/prompt/preparation.ts` now pass `query.questionRuleIds`; new `preparation.test.ts` cases (frozen query embedding, no live model) prove a lookup question citing 704.5g surfaces 701.8b, debug and non-debug lookup paths agree (REQ-177 parity), mock path untouched. Important A10/E7 resolved: `system-map.md:90` ends `REQ-182, REQ-183, REQ-184` (driver confirmed). Both Minors taken: REQ-182 Notes flag the sweep MRR as pre-int8 and record shipped 0.7107/0.6931; NFR-002 bullet names the 1.442 MB post-REQ-183 size. Re-verified by builder: `gameRulesRetrieval` 65/65, `test:eval` 14/14, typecheck clean, `quality:check` exit 0; criteria 33/33 unchanged; worktree clean; PR body gained `## Review loop 1`; 79 self-reported calls | 2026-09-05 |
| 7 | review (attempt 2) | opus | ok — APPROVE | `0 → 43` | fresh no-write reviewer (Explore type), 38 self-reported calls, no subagents, 0 denials. All four loop-1 resolutions confirmed with evidence (`preparation.ts:231`/`:275` pass `query.questionRuleIds`; `preparation.test.ts:189-295` proves 704.5g → 701.8b under a frozen embedding, debug/non-debug parity, mock path untouched; `system-map.md:90` ends REQ-184; REQ-182 Notes carry the shipped MRR 0.7107/0.6931; NFR-002 names 1.442 MB). 33/33 criteria met; cross-reference boost verified on both game and Quick Lookup paths, question-cited ids only, `SCORE_CROSS_REFERENCE = 10` < parent 20 < exact 100, semantic branch only. Three Minors, no action: C6's second clause (budget test has no data figure to update), REQ-182's 12/12-of-eight baseline sentence (dated, still true), a pre-existing REQ-181 warn-once nuance. Commands green: `test:eval` 14/14, `gameRulesRetrieval` 65/65, `preparation` 6/6, `ragRetrievalBenchmark` 5/5, budget test 2/2, typecheck; data 113.887 MB; artifact 1.442 MB | 2026-09-05 |
| 8 | land | — | parked | `n/a (human)` | awaiting the owner's merge of PR #197 https://github.com/ChrisMiho/TheJudge/pull/197 (`thejudge-auto/hybrid-rule-retrieval-work` → `thejudge-auto/hybrid-rule-retrieval`, head `bf74140`, MERGEABLE, all eight checks SUCCESS/SKIPPED). Package on the PR head is `ship-ready`; locally the driver set `STATUS.owner-action` and moved the board row for the park (restored to `ship-ready` at land ok). Lock released with `{"runId":"graph-20260905-191535","state":"PARKED"}`; run-state deleted | 2026-09-05 |
| 8 | land | — | ok | `n/a (human)` | owner merged PR #197 at `3f0705c` (2026-09-06T07:32:05Z) and their own PR #198 (domain typo, into `main`) a few seconds later. Driver resume (`/loop graph-implement` session, 2026-09-06): the launch checkout was on `main` carrying another session's uncommitted `flag-incorrect-ruling` kickoff, so the driver added a dedicated worktree `.worktrees/close-hybrid-rule-retrieval` on the local base branch (`a034e30`) and merged `origin/thejudge-auto/hybrid-rule-retrieval` (`3f0705c`) into it — two conflicts (`PRD/work/STATUS.md`, package `README.md`) resolved by intent to the merged PR's `ship-ready` state, `STATUS.owner-action` removed, `STATUS.ship-ready` the only marker; merge commit `11f1c57`; implement worktree clean at `bf74140`, contained in HEAD. Lock re-taken with the same run id (pid 70883); graph canary `nohup true` denied. `origin/main` (`ef9eae8`, PRs #196/#198) is not yet an ancestor of the base — merged at the base→main step after close | 2026-09-06 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make Ask AI's semantic rule retrieval safe to turn on. The rag-rule-retrieval run shipped an opt-in local embedding model (EMBEDDING_PROVIDER=local) that lifts recall@5 on the 156-pair benchmark from 0.58 to 0.85 but loses the exact rule on short lookup-mode questions: two of eight labelled fixtures drop rule 702.2b from the top five because a card name plus one keyword carries too little meaning for cosine ranking alone. Four items, one spec: (1) a hybrid score that blends lexical and semantic ranking so lookup-mode questions keep the exact rule while long questions keep the semantic gain, measured on the same benchmark and the labelled fixtures; (2) once hybrid holds, make the system3-expected-recall and system3-noise-excluded checks gate test:eval on the semantic path instead of report-only, and add one labelled fixture for a multi-keyword card; (3) relieve the Lambda package budget, which sits at 118.10 of 120 MB data after the 130 MB runtime-and-model reserve, by shrinking the 75 MB combos artifact, loading the model from S3 at cold start, or storing vectors in a smaller number format, decided by measurement before the next data refresh; (4) measure Lambda cold-start latency with the model loaded and record it against the existing latency requirement. Success is a measured case for setting EMBEDDING_PROVIDER=local as the default." | answered-once | shape | — (the owner's launch request, passed to node 2 verbatim as the package's intake; every product question it raises is decided at the `define` gate, not pre-resolved) |
| "graph-implement" (the owner's `/loop graph-implement` launch, 2026-09-05) | answered-once | driver-resume | — (a request to run the build loop; every product decision stays with the owner's recorded verdicts and the gates) |
| "i cant accept 11/12, i realize its a good start, but id rather we keep refining how to make things better, is there a reason we cant hit 12/12, is it the data? do we need to redownload the latest rules?" | answered-once | build (owner-action park) | — (the owner's answer to the slice A gate: 11/12 rejected; driver investigated and reported the miss is a missing cross-reference signal, not stale rules data) |
| "this enhancement sounds like what we need, lets do it, do you need anything approved from me?" | answered-once | build (owner-action park) | — (the owner chose the cross-reference boost; recorded as the gate Decision, applied only to slice A's REQ-182 amendment, not as a standing rule) |
| "merged 197 and 198" | answered-once | land | — (the owner's merge report; the driver confirmed both merges with `gh pr view` and recorded `land` ok) |

## Intake

- `intake/rag-rule-retrieval-2026-09-05.md` — copied byte-for-byte from
  `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` on `main`
  (the receipt of the prior run this request follows on from)
