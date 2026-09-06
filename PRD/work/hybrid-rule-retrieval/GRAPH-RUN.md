# Graph run — hybrid-rule-retrieval

- Run ID: `graph-20260905-191535` (build half, `/loop graph-implement`; spec-forming half `graph-20260905-173655`)
- Profile: spec-forming half `loaded (env sentinel)` (observed by the preflight script at node 1); build half `unverified` (launch command not stated in the session)
- Build-half canary: `denied — hook live (graph tier: nohup true → "[graph-boundary] `nohup` is denied while a graph run holds the lock")`, 2026-09-05, lock `graph-20260905-191535`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "[graph-boundary] `rm -rf` is denied in every session."; graph tier: nohup true → "[graph-boundary] `nohup` is denied while a graph run holds the lock")`
- Autonomous base: `origin/thejudge-auto/hybrid-rule-retrieval`
- Staging: `.worktrees/.graph-intake/graph-20260905-173655/`
- Current node: `land` (parked — the owner merges PR #197)
- Next action: merge PR #197, then `/graph-implement PRD/work/hybrid-rule-retrieval/` (records `land` ok, runs `close`)

## Node ledger

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

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-182` | accept | — |
| `REQ-183` | accept | — |
| `REQ-184` | accept | — |
| `REQ-032` | accept | — |
| `REQ-177` | accept | — |
| `REQ-181` | accept | — |
| `REQ-022` | accept | — |
| `NFR-002` | accept | — |
| `NFR-017` | edit | "add one more Notes bullet recording the 2026-09-05 deploy rejection: the 130 MB non-data reserve was measured on macOS, but on the linux/x64 CI runner onnxruntime-node's postinstall downloaded the CUDA runtime (which the Lambda CPU runtime never loads) and AWS rejected the package as over 250 MB unzipped even though the budget test passed. Fixed on main in PR #194: `scripts/package-lambda.sh` now sets `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` for the packaging install and measures the real unzipped bytes with a per-entry breakdown, failing before upload when over quota. The reserve figure is to be re-measured on the CI runner, not a laptop." |
| `system-map.md` | accept | — |
| `system-map/game-rules-retrieval.md` | accept | — |
| `quick-lookup/README.md` | accept | — |
| `in-depth/README.md` | accept | — |
| `integrations-and-data.md` | accept | — |
| `system-map/prompt-layout-spec.md` | accept | — |

## Open gate

Parked 2026-09-05 at `land` (`owner-action`). Gate: node 8 is the human PR merge; the driver never merges.

- **Ask:** merge PR #197 https://github.com/ChrisMiho/TheJudge/pull/197 — `thejudge-auto/hybrid-rule-retrieval-work` → `thejudge-auto/hybrid-rule-retrieval`, head `bf74140`. Merge only this one; the base→main hop comes after `close`.
- **In plain terms:** this PR makes Ask AI pick its five rule excerpts by a blend of meaning and rare-word overlap, with a nudge for rules that cite a rule number the player named (your 2026-09-05 decision); turns the two semantic eval checks into a hard gate with a new multi-keyword-card fixture; shrinks the committed rule vectors to int8 so the Lambda data budget goes from 1.9 MB to 6.1 MB of headroom; records cold-start model readiness (181.2 ms) in NFR-002; and makes `EMBEDDING_PROVIDER=local` the deployed default with a packaging step that refuses to ship without the model cache. All 15 approved product-truth blocks are applied to `PRD/sections/` on the PR head. Reviewed twice by a no-write reviewer: one loop (the boost was dead in Quick Lookup mode; fixed and proven by test), then APPROVE with 33/33 criteria met.
- **What happens if you say no:** nothing ships; `EMBEDDING_PROVIDER` stays `mock` in production and the semantic checks stay report-only. Close the PR and the package stays `owner-action` for a decision on what to change.
- **Evidence:** node ledger rows 6–8 above; PR checks all green at `bf74140`; the reviewer's per-criterion table is in this run's transcript and summarised in row 7 (attempt 2).
- **Resume:** after the merge, `/graph-implement PRD/work/hybrid-rule-retrieval/` (or `/loop graph-implement`): the driver confirms PR #197 is merged, records `land` ok, reconciles the local base with `origin/thejudge-auto/hybrid-rule-retrieval` (restoring `ship-ready`), and dispatches `close` (`thejudge-cleanup`), which writes the receipt and deletes the package folder. Then you merge the fresh base→main PR the driver opens, last.
- Run `graph-20260905-191535` released its lock with state `PARKED`.

### Prior gate (resolved 2026-09-05): slice A decision

Parked 2026-09-05 at `build`, slice A (`owner-action`). Gate trigger: a `build` blocker that is a genuine product decision — two acceptance criteria the owner accepted in REQ-182 cannot both hold in the built code, and the assumption ladder's first rung (active requirements) is exactly what conflicts, so nothing below it can resolve it.

- **What this decides:** whether Ask AI's new blended rule ranking ships with one known miss on one test scenario, or whether the accepted blend-weight range is widened to recover that rule at a cost to the benchmark.
- **In plain terms:** REQ-182 (the accepted rule that System 3 scores each candidate rule by a blend of meaning-similarity and rare-word overlap) requires both that the blend weight `alpha` sit inside `[0.50, 0.70]` and that all 12 labelled fixture checks pass. Built the way REQ-182 mandates — blending over the full candidate pool, not a top-15 sample — no weight in that band gets 12/12. The `state-based-actions` scenario (a creature dying from damage) always drops one of its three expected rules, `701.8b`, because three other rules outscore it at every weight from 0.50 to 0.70; the crossover where it would win is `alpha ≈ 0.48`, outside the band. The two Quick Lookup scenarios the blend was built to fix pass at every weight. The brief's 12/12 came from a throwaway probe that only fused the top 15 candidates per ranking, which is why it did not see this. Full table: `slice-a-hybrid-blend.md` `## Blocker`.
- **What happens if you say no (leave both criteria as accepted):** slice A stays blocked, and slices B, C, and E, which depend on it, never start. Slice D (cold start measured and recorded) is already done on PR #197.
- **Options:**
  1. Accept 11/12 and amend REQ-182 to record `state-based-actions` / `701.8b` as a known accepted miss, with `alpha = 0.60` (clean recall@5 0.8974, polluted 0.8910, both clear the accepted floors of 0.8526 / 0.8333 with headroom). **Recommended.**
  2. Widen the accepted `alpha` band below 0.50 so `701.8b` wins; recall and MRR at that weight are unmeasured and polluted recall was already below its floor at 0.50 (0.8205).
  3. Something else, stated here (for example, revisit the fixture's expected rules).
- **Decision (owner, in session, 2026-09-05):** keep the 12/12 fixture gate and the `[0.50, 0.70]` alpha band; add a cross-reference boost (a candidate rule whose text cites a rule number the question cites, e.g. 701.8b cites 704.5g), amend REQ-182 to record it, then re-sweep alpha. Owner's words, quoted in `## Instruction ledger`: rejected 11/12 and chose the cross-reference enhancement. Duplicate-collapsing not included. Gate resolved; build resumes at attempt 2.
- **Evidence:** node 6 row above; `PRD/work/hybrid-rule-retrieval/slice-a-hybrid-blend.md` `## Blocker` (score table and alpha sweep); PR #197 blocker comment `thejudge-auto:v1:blocker:hybrid-rule-retrieval:A:req-182-alpha-band-vs-fixture-gate`; slice A code uncommitted in `.worktrees/implement-hybrid-rule-retrieval` (kept).
- **PR:** https://github.com/ChrisMiho/TheJudge/pull/197 (`thejudge-auto/hybrid-rule-retrieval-work` → `thejudge-auto/hybrid-rule-retrieval`, head `c9487c1`, slice D only; open, not merged).
- **Resume:** fill the `- Decision:` line above (option number, or your own wording), then `/graph-implement PRD/work/hybrid-rule-retrieval/` or restart `/loop graph-implement`. The driver re-enters at `build` (`GAMEPLAN.md` exists), passes your decision to the builder, which amends REQ-182's proposal block to match before applying it, and finishes A, B, C, E. A blank `- Decision:` re-parks.
- Run `graph-20260905-191535` released its lock with state `PARKED`.

Prior gate on this package: the `define` gate (15 verdict slots) was resolved 2026-09-05 by `graph-gate-review`; see `## Gate verdicts`.

## Dispatch prompts

### preflight

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `graph-preflight` skill with the Skill tool (skill name `graph-preflight`) and follow it exactly. Read `.claude/skills/graph-preflight/SKILL.md` and `PRD/instructions/graph-workflow-contract.md` before acting.

Inputs (fixed by the driver; do not change them):
- `--branch thejudge-auto/hybrid-rule-retrieval`
- `--run-id graph-20260905-173655`
- `--slug hybrid-rule-retrieval`
- `--pid 77812` (the driver session's own long-lived pid, so the lock does not read stale)
- Base: the checkout is on `main`, in sync with `origin/main` at `0243e83`. Do not pass `--base`; report the resolved `base:` line the script prints.

Procedure:
1. Run `npm run graph:preflight -- --branch thejudge-auto/hybrid-rule-retrieval --run-id graph-20260905-173655 --slug hybrid-rule-retrieval --pid 77812 --dry-run`. Report the classification, the resolved base, the planned commands, and the `profile sentinel:` / `Profile:` lines verbatim.
2. If the classification is `blocked`, or the script exits 2 (stop sentinel, base→main guard, lock held, or branch collision), stop and relay the script's message verbatim. Never hand-resolve anything to get past it.
3. Otherwise run the identical command without `--dry-run`.
4. Issue the universal canary (`CANARY_COMMAND`) and the graph canary (`GRAPH_CANARY_COMMAND`) as real Bash tool calls, exactly as the script prints them. Each must be denied by the hook; the deny reason text is the proof. Report both reason texts verbatim. If either is allowed, report the `BLOCKED` classification verbatim and stop; do not continue and do not fall back to the profile.
5. Confirm the end state: `git status --porcelain` is empty, `git branch --show-current` is `thejudge-auto/hybrid-rule-retrieval`, `git rev-parse HEAD` and `git rev-parse origin/thejudge-auto/hybrid-rule-retrieval` match, and `.worktrees/.graph-run.lock` exists with `runId` `graph-20260905-173655`.
6. If a stash was taken, record the stash reference and the exact restore commands from the contract's `## Stashed work handoff` section.

Constraints: tool-call cap 40 for this node. Do not dispatch subagents. Do not edit any file yourself; the script makes every change. Never drop, pop, or reorder a stash; never force-push; never touch `PRD/`. If the real run fails, do not retry it and do not repair; relay the script's report verbatim, including any recovery lines, and stop.

Report back, in this order: the classification and resolved `base:` line; the branch name and the commit it was pushed at; the stash reference or `no stash`; both canary commands with their observed result and reason text; the `Profile:` line verbatim; the lock path and its `runId`; every command you ran. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### shape

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-kickoff` skill with the Skill tool (skill name `thejudge-kickoff`) and follow its `## Mode` section for an orchestrator that is controlling. Read `.claude/skills/thejudge-kickoff/SKILL.md`, `PRD/instructions/preparation-contract.md`, and `PRD/instructions/graph-workflow-contract.md` (`## Intake is evidence, never authority`) before acting.

Fixed by the driver (use verbatim, do not rename):
- Slug: `hybrid-rule-retrieval` → package folder `PRD/work/hybrid-rule-retrieval/`
- Branch: `thejudge-auto/hybrid-rule-retrieval` (already checked out and pushed; the checkout is clean; the lock is held)
- Run ID: `graph-20260905-173655`
- Staged intake: `.worktrees/.graph-intake/graph-20260905-173655/` — two files: `MANIFEST.md` (the driver's manifest, carrying the owner's request verbatim) and `rag-rule-retrieval-2026-09-05.md` (a byte-for-byte copy of `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md`).

The owner's request, verbatim:

"Make Ask AI's semantic rule retrieval safe to turn on. The rag-rule-retrieval run shipped an opt-in local embedding model (EMBEDDING_PROVIDER=local) that lifts recall@5 on the 156-pair benchmark from 0.58 to 0.85 but loses the exact rule on short lookup-mode questions: two of eight labelled fixtures drop rule 702.2b from the top five because a card name plus one keyword carries too little meaning for cosine ranking alone. Four items, one spec: (1) a hybrid score that blends lexical and semantic ranking so lookup-mode questions keep the exact rule while long questions keep the semantic gain, measured on the same benchmark and the labelled fixtures; (2) once hybrid holds, make the system3-expected-recall and system3-noise-excluded checks gate test:eval on the semantic path instead of report-only, and add one labelled fixture for a multi-keyword card; (3) relieve the Lambda package budget, which sits at 118.10 of 120 MB data after the 130 MB runtime-and-model reserve, by shrinking the 75 MB combos artifact, loading the model from S3 at cold start, or storing vectors in a smaller number format, decided by measurement before the next data refresh; (4) measure Lambda cold-start latency with the model loaded and record it against the existing latency requirement. Success is a measured case for setting EMBEDDING_PROVIDER=local as the default."

What to produce (the skill's normal outputs, under the supplied slug):
1. `PRD/work/hybrid-rule-retrieval/IDEA.md` — 3–5 sentences: problem, outcome, non-goals, in game terms first (what a player asking Ask AI experiences), then the four items. Before writing it, grep `PRD/instructions/receipts/` for slug and keyword matches (retrieval, rag, semantic, embedding, rule, prompt-context, lookup) against the request and the intake, and write one `## Prior run` line per match naming the receipt path. Offer matches as input, never as scope.
2. `PRD/work/hybrid-rule-retrieval/README.md` with `status: ideation` at the top.
3. The empty marker `PRD/work/hybrid-rule-retrieval/STATUS.ideation` (exactly one `STATUS.*`).
4. A row for the package under `## ideation` in `PRD/work/STATUS.md`.
5. Only after the package folder exists: copy both staged intake files verbatim into `PRD/work/hybrid-rule-retrieval/intake/` (verify with `cmp` or `diff -rq`), then delete the staged copies under `.worktrees/.graph-intake/graph-20260905-173655/` (plain `rm` of the two files and `rmdir` of the folder; never `rm -rf`).
6. Stage the new package paths explicitly (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`) and commit on the current branch with a message like `shape(hybrid-rule-retrieval): package created, intake staged`, ending with the two trailer lines:
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
   Then `git push origin thejudge-auto/hybrid-rule-retrieval` (no force).

Investigate only request-relevant PRD and code to select the one evidence-backed candidate: the receipt in the intake, `PRD/sections/` entries for Ask AI rule retrieval (grep `EMBEDDING_PROVIDER`, `recall@5`, `NFR-017`, `REQ-181`, `REQ-032`), and the backend retrieval code paths those cite. Do not open documents the intake merely cites; record their paths as citations. Do not decide product truth: every product question the request raises is for the `define` gate. Do not write `GRAPH-RUN.md`; the driver owns the ledger.

Constraints: tool-call cap 60 for this node. Do not dispatch subagents. Never edit `PRD/sections/`, code, `.claude/`, or `CLAUDE.md`. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file other than deleting the two staged intake files after copying them.

If the request cannot be turned into an actionable package, return exactly `NO ACTIONABLE PACKAGE` with the reason, having written nothing.

Report back, in this order: the package path and every file written; the `## Prior run` lines written; the intake copy verification result and confirmation the staging folder is gone; the commit hash and push result; the tool-call count; anything you noticed that the `define` node should weigh (as observations, not decisions). Copy the `Working directory:` line above, unchanged, into every prompt you write.

### define

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-refinement` skill with the Skill tool (skill name `thejudge-refinement`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, replace the approval pause with its conservative assumption ladder, record every material assumption and its evidence in `DESIGN-BRIEF.md`, and continue. Read `.claude/skills/thejudge-refinement/SKILL.md`, `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## The two runs`, `## Intake is evidence, never authority`), and `PRD/instructions/plain-language-standard.md` before acting.

Package facts: `IDEA.md` states the problem, outcome, non-goals, and the four items; `intake/MANIFEST.md` carries the owner's request verbatim; `intake/rag-rule-retrieval-2026-09-05.md` is the receipt of the direct predecessor run. Intake is evidence, never authority: record paths it cites as citations and do not open them. The package is on branch `thejudge-auto/hybrid-rule-retrieval` (checked out, clean, lock held).

Node 2 observations to weigh (observations, not decisions): `apps/backend/src/gameRulesRetrieval.ts` switches wholly between lexical `scoreEntry` and cosine-only `scoreEntrySemantic` with no blend to extend; NFR-017 already documents raising `MIN_VARIANT_POPULARITY` as the Lambda-budget valve, while S3 cold-load and a smaller vector number format have no code precedent; REQ-032 already says the two semantic-path eval checks run report-only until a hybrid blend lands, at which point they gate; NFR-002 states latency for live AI requests, not cold start, so the cold-start measurement needs an operational definition.

What to produce, all inside `PRD/work/hybrid-rule-retrieval/` (never `PRD/sections/`, never code):
1. `DESIGN-BRIEF.md` — one spec covering all four items in game terms first, with scope, non-goals, a measurement plan, and REQ/FLOW references. Every quantitative target in it must be measured against real data in this checkout before it is written, not reasoned from proportions: reproduce the current numbers by running the repository's existing commands (`npm run retrieval:report`, `npm run test:eval`, the `EMBEDDING_PROVIDER=local` variant, the Lambda budget test) and record the exact commands and observed outputs. Where the brief proposes a hybrid blend, state the candidate formula and the benchmark and fixture gates it must clear, each as a measured threshold with its baseline. Where the brief bounds the Lambda-budget and cold-start items, state what will be measured, with what command, and what result decides each lever.
2. `GATE-QUESTIONS.md` — whenever the change needs durable product truth, one `## <STABLE-ID>` block per new or amended stable id, each opening with the three-line plain-language block (*What this decides · In plain terms · What happens if you say no*, with every cited REQ/NFR inlined and every technical term defined in the same breath), then that id's complete proposed `PRD/sections/` diff (a `Current:` block copied byte-for-byte from the live file, then the proposed replacement; never a summary), then `- Verdict:` and `- Reason:` slots. Enumerate the amendment set by grep, not memory: search `PRD/sections/` for every live assertion the change touches (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`) and give each touched id its own block. New ids are named and reserved (next free `REQ-###` after the highest live one), never written into live files. The whole proposal gates, so every new and amended id gets a slot, not the headline ones alone. Any genuine decision blocker under the contract's three-condition test goes under `## Blocker questions` with a stable `Q-###` id, to the same plain-language standard; preserve the furthest valid artifacts and return it rather than guessing.
3. Status: set `status: refining` while in flux, and on completion of the brief and proposal set `status: refined` in `README.md`, replace the marker with `STATUS.refined` (exactly one `STATUS.*`), and move the board row in `PRD/work/STATUS.md` from `## ideation` to `## refined` (remove the old row, add the new one).
4. Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`), message `define(hybrid-rule-retrieval): design brief and gate proposal`, ending with the two trailer lines:
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
   Then `git push origin thejudge-auto/hybrid-rule-retrieval` (no force). Leave `GRAPH-RUN.md` alone; the driver owns the ledger. Leave `README.md`'s `## Autonomous metadata` section unchanged.

Constraints: tool-call cap 150 for this node, and it counts every call you make. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior run exhausted its cap that way. Long-running measurement commands are fine, but run each once and record the output. Never edit `PRD/sections/`, code, tests, `.claude/`, or `CLAUDE.md`. Never run `npm run data:refresh` or any Scryfall network refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. No new dependency, endpoint, data contract, or external integration without authoritative scope; propose such things as gate questions instead.

Report back, in this order: the status marker and board row after the node; the files written; the number of `## <STABLE-ID>` blocks in `GATE-QUESTIONS.md` (new vs amended) and the count of blocker questions; the commit hash and push result; the commands you ran to reproduce measurements with their key numbers; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-qc (attempt 1)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-quality-check` skill with the Skill tool (skill name `thejudge-quality-check`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict with the complete findings, and return it to the driver, which records it in the package README's `## Preparation gate` section. Read `.claude/skills/thejudge-quality-check/SKILL.md`, `PRD/instructions/technical-design-rules.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`) before acting.

What to check, beyond the skill's own checklist:
1. `DESIGN-BRIEF.md` against the current-state feature specs it touches (`PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`, `PRD/sections/system-map/game-rules-retrieval.md`, `PRD/sections/system-map.md`, `PRD/sections/integrations-and-data.md`) and the `REQ`/`NFR` entries it cites: no contradictions, current vocabulary, stack ordering preserved, technical-design-rules respected, scope implementable without hidden assumptions, no user-visible screen change (so no `screen-layout.md` row is required; confirm that claim).
2. `GATE-QUESTIONS.md`: every `## <STABLE-ID>` block opens with the three-line plain-language block, inlines every cited id, defines its technical terms, carries a complete diff (not a summary), and has `- Verdict:` / `- Reason:` slots. Verify every `Current:` block byte-for-byte against the live `PRD/sections/` file by script, not by eye. Confirm the new ids (REQ-182, REQ-183, REQ-184) are unused in live `PRD/sections/` and are the next free numbers. Re-grep the amendment set yourself (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`, `MIN_VARIANT_POPULARITY`, `float32`) and FAIL if a live assertion the change would falsify has no block.
3. Every quantitative target in the brief must rest on a recorded measurement. Reproduce the cheap ones once each and compare: `npm --workspace apps/backend run test:eval` (expect the semantic path at 9 of 12 labelled checks, lexical 12/12), `npm run benchmark:rag-retrieval` and `npm run benchmark:rag-retrieval -- --semantic` (expect lexical clean recall@5 0.5833, semantic clean 0.8526 / polluted 0.8333), and `node --test scripts/lambda-package-budget.test.mjs` (expect 118.095 MB of 120 MB). A number in the brief that the checkout does not reproduce is a FAIL finding with both values. Confirm the hybrid gates in the brief are stated as measured thresholds with baselines, not proportions.
4. Confirm the package state: `STATUS.refined` is the only marker, `README.md` reads `status: refined`, the board row sits under `## refined`, and `README.md` carries `## Autonomous metadata`.

Verdict handling: on PASS, change nothing (leave `STATUS.refined`; do not write `GAMEPLAN.md`, slice docs, or code; do not edit the README, the driver writes the gate section). On FAIL, set `status: refining` in `README.md`, replace the marker with `STATUS.refining`, move the board row under `## refining`, commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`, never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
and push `origin thejudge-auto/hybrid-rule-retrieval` (no force). Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or `GRAPH-RUN.md`.

Constraints: tool-call cap 60 for this node, counting every call. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior gate-qc exhausted its cap that way. Run each measurement command once. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the one-word verdict (PASS or FAIL); the complete findings list, or `none`; the `Current:` block verification result (count checked, count identical); the amendment-set grep result; each reproduced measurement with the brief's value beside it; the package state after the node; the commit hash if you committed; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### define (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`), attempt 2, of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. The quality check (node 4, attempt 1) returned FAIL with one finding, and the package is back at `STATUS.refining`. Invoke the `thejudge-refinement` skill with the Skill tool (skill name `thejudge-refinement`) on the package `PRD/work/hybrid-rule-retrieval/`, following its `## Mode` section for an orchestrator that is controlling, and correct the finding. Read `.claude/skills/thejudge-refinement/SKILL.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`) before acting.

The finding, verbatim from the quality check:

> `PRD/sections/system-map/prompt-layout-spec.md`, row 8 of the prompt-section table, has no gate block. It says Ask AI's rule excerpts are 'ranked by meaning against committed per-rule embeddings with a keyword-overlap fallback' (citing REQ-181) — the same semantic-primary-with-lexical-fallback description that GATE-QUESTIONS.md does correct in `system-map.md`, `system-map/game-rules-retrieval.md`, `quick-lookup/README.md`, and `in-depth/README.md`. REQ-182's hybrid blend falsifies this row exactly the way it falsifies the other four, and it was missed.

What to do:
1. Add one `## system-map/prompt-layout-spec.md — <plain title>` block to `GATE-QUESTIONS.md`, in the same shape as the existing amended-spec blocks: the three-line plain-language block (*What this decides · In plain terms · What happens if you say no*, cited ids inlined, terms defined), a `Current:` block copied byte-for-byte from the live file (row 8 of the table at `PRD/sections/system-map/prompt-layout-spec.md:36`, and any other line in that file the change falsifies — grep it for `REQ-181`, `meaning`, `embedding`, `fallback`, `hybrid`), the proposed replacement consistent with the REQ-182 wording already used in the sibling blocks, and `- Verdict:` / `- Reason:` slots. Place it beside the other amended-spec blocks, before `## Blocker questions`.
2. Re-run the amendment-set grep across `PRD/sections/` once more (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`, `MIN_VARIANT_POPULARITY`, `float32`, `ranked by meaning`, `keyword-overlap fallback`, `per-rule embeddings`) and add a block for any other live assertion the change falsifies that still has none. Verify every `Current:` block in the file byte-for-byte against live `PRD/sections/` by script before committing.
3. Update the brief only where it lists the amended specs, so `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` name the same set. Do not re-run the measurements; the checkout reproduced all of them at gate-qc.
4. Status: set `status: refined` in `README.md`, replace `STATUS.refining` with `STATUS.refined` (exactly one `STATUS.*`), and move the board row in `PRD/work/STATUS.md` from `## refining` to `## refined` (remove the old row, add the new one). Leave the README's `## Autonomous metadata` and `## Preparation gate` sections unchanged; the driver rewrites the gate section after the re-check.
5. Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`), message `define(hybrid-rule-retrieval): gate block for prompt-layout-spec row 8`, ending with the two trailer lines:
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
   Then `git push origin thejudge-auto/hybrid-rule-retrieval` (no force). Leave `GRAPH-RUN.md` alone.

Constraints: tool-call cap 150 for this node, counting every call. Do not dispatch subagents. Never edit `PRD/sections/`, code, tests, `.claude/`, or `CLAUDE.md`. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. Do not widen scope beyond the finding and what the re-grep surfaces.

Report back, in this order: the status marker and board row after the node; the blocks added (ids and titles) and the new total block count; the re-grep result; the `Current:` verification result; the commit hash and push result; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-qc (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`), attempt 2 (re-check after define attempt 2 corrected the one finding: a block for `system-map/prompt-layout-spec.md` row 8 was added), of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-quality-check` skill with the Skill tool (skill name `thejudge-quality-check`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict with the complete findings, and return it to the driver, which records it in the package README's `## Preparation gate` section. Read `.claude/skills/thejudge-quality-check/SKILL.md`, `PRD/instructions/technical-design-rules.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`) before acting.

What to check, beyond the skill's own checklist:
1. `DESIGN-BRIEF.md` against the current-state feature specs it touches (`PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`, `PRD/sections/system-map/game-rules-retrieval.md`, `PRD/sections/system-map.md`, `PRD/sections/integrations-and-data.md`) and the `REQ`/`NFR` entries it cites: no contradictions, current vocabulary, stack ordering preserved, technical-design-rules respected, scope implementable without hidden assumptions, no user-visible screen change (so no `screen-layout.md` row is required; confirm that claim).
2. `GATE-QUESTIONS.md`: every `## <STABLE-ID>` block opens with the three-line plain-language block, inlines every cited id, defines its technical terms, carries a complete diff (not a summary), and has `- Verdict:` / `- Reason:` slots. Verify every `Current:` block byte-for-byte against the live `PRD/sections/` file by script, not by eye. Confirm the `system-map/prompt-layout-spec.md` block now exists with byte-identical `Current:` excerpts and a replacement consistent with REQ-182. Confirm the new ids (REQ-182, REQ-183, REQ-184) are unused in live `PRD/sections/` and are the next free numbers. Re-grep the amendment set yourself (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`, `MIN_VARIANT_POPULARITY`, `float32`) and FAIL if a live assertion the change would falsify has no block.
3. Every quantitative target in the brief must rest on a recorded measurement. Reproduce the cheap ones once each and compare: `npm --workspace apps/backend run test:eval` (expect the semantic path at 9 of 12 labelled checks, lexical 12/12), `npm run benchmark:rag-retrieval` and `npm run benchmark:rag-retrieval -- --semantic` (expect lexical clean recall@5 0.5833, semantic clean 0.8526 / polluted 0.8333), and `node --test scripts/lambda-package-budget.test.mjs` (expect 118.095 MB of 120 MB). A number in the brief that the checkout does not reproduce is a FAIL finding with both values. Confirm the hybrid gates in the brief are stated as measured thresholds with baselines, not proportions.
4. Confirm the package state: `STATUS.refined` is the only marker, `README.md` reads `status: refined`, the board row sits under `## refined`, and `README.md` carries `## Autonomous metadata`.

Verdict handling: on PASS, change nothing (leave `STATUS.refined`; do not write `GAMEPLAN.md`, slice docs, or code; do not edit the README, the driver writes the gate section). On FAIL, set `status: refining` in `README.md`, replace the marker with `STATUS.refining`, move the board row under `## refining`, commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`, never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
and push `origin thejudge-auto/hybrid-rule-retrieval` (no force). Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or `GRAPH-RUN.md`.

Constraints: tool-call cap 60 for this node, counting every call. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior gate-qc exhausted its cap that way. Run each measurement command once. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the one-word verdict (PASS or FAIL); the complete findings list, or `none`; the `Current:` block verification result (count checked, count identical); the amendment-set grep result; each reproduced measurement with the brief's value beside it; the package state after the node; the commit hash if you committed; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-review

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are the gate-review step of graph run `graph-20260905-191535`, the build half driven by `graph-implement` (the spec-forming half was run `graph-20260905-173655`). Invoke the `graph-gate-review` skill with the Skill tool (skill name `graph-gate-review`) on the package `PRD/work/hybrid-rule-retrieval/`. Read `.claude/skills/graph-gate-review/SKILL.md` and `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## The two runs`) before acting.

Context: the owner answered all 15 `- Verdict:` slots in `GATE-QUESTIONS.md` (14 accept, 1 edit on the NFR-017 block) and merged the docs PR #195 to `main` on 2026-09-05. The package currently carries `STATUS.active` and `status: active` — the build loop's claim marker; the skill restores `STATUS.refined` as the lifecycle position after a resolved define gate. The current branch is `thejudge-auto/hybrid-rule-retrieval`, already fast-forwarded to `main`.

What to do, per the skill: parse every `## <STABLE-ID>` block; confirm each Verdict slot is filled and every edit or reject carries a Reason; apply each verdict inside that ID's proposed diff in `GATE-QUESTIONS.md` only (accept: nothing; edit: apply the owner's Reason as the correction to that ID's proposed diff — for NFR-017 that means adding the extra Notes bullet the owner's Reason describes, worded from the Reason and the PR #194 facts it cites; reject: remove the proposed diff). Never edit `PRD/sections/`, `DESIGN-BRIEF.md`, code, or any `thejudge-*` skill. Then write `## Gate verdicts` in `GRAPH-RUN.md` (one row per stable ID, the owner's Reason quoted for the edit), mark `## Open gate` resolved with the date and the verdict count, replace `STATUS.active` with `STATUS.refined` (exactly one marker), set `status: refined` in `README.md`, and move the board row in `PRD/work/STATUS.md` from `## active` to `## refined`. Do not touch the `## Node ledger`, `## Dispatch prompts`, or `## Instruction ledger` sections of `GRAPH-RUN.md`; the driver owns those.

Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`) on the current branch, with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Do not push. Do not dispatch subagents. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. Never run `npm run data:refresh` or any Scryfall refresh.

Report back, in this order: the verdict split (accept / edit / reject counts); for the edit, the exact text you added to the proposal; `git diff --stat` of `GATE-QUESTIONS.md` for your commit and confirmation that `git diff -- PRD/sections/` is empty; the package state after the node (marker, README status line, board heading); the commit hash; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-qc (build half, attempt 1)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`), attempt 1 of the build half, graph run `graph-20260905-191535` driven by `graph-implement` (the spec-forming half, run `graph-20260905-173655`, already passed gate-qc on this brief on 2026-09-05 at commit `f13f8d2`; this is the re-check after the owner's verdicts were applied by `graph-gate-review`, commit `334f377`, which added one Notes bullet to the NFR-017 block of `GATE-QUESTIONS.md`). Invoke the `thejudge-quality-check` skill with the Skill tool (skill name `thejudge-quality-check`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict with the complete findings, and return it to the driver, which records it in the package README's `## Preparation gate` section. Read `.claude/skills/thejudge-quality-check/SKILL.md`, `PRD/instructions/technical-design-rules.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`, `## Propose / apply / close`) before acting.

What to check, beyond the skill's own checklist:
1. `DESIGN-BRIEF.md` against the current-state feature specs it touches (`PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`, `PRD/sections/system-map/game-rules-retrieval.md`, `PRD/sections/system-map/prompt-layout-spec.md`, `PRD/sections/system-map.md`, `PRD/sections/integrations-and-data.md`, `PRD/sections/non-functional-requirements.md`, `PRD/sections/functional-requirements.md`) and the `REQ`/`NFR` entries it cites: no contradictions, current vocabulary, technical-design-rules respected, scope implementable without hidden assumptions, no user-visible screen change.
2. `GATE-QUESTIONS.md` as finalized by the owner: all 15 `- Verdict:` slots read accept or edit (none blank, none reject); the NFR-017 block's owner edit (the added Notes bullet about the CUDA runtime download on the linux/x64 CI runner and PR #194's fix in `scripts/package-lambda.sh`) is consistent with the brief, with the live NFR-017 text, and with what `scripts/package-lambda.sh` on this checkout actually does (read it; confirm `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` and the unzipped-size measurement exist). Verify every `Current:` block byte-for-byte against the live `PRD/sections/` file by script, not by eye — `main` moved since the spec-forming gate-qc (PRs #193, #194, #195 merged), so drift is possible. Confirm REQ-182, REQ-183, REQ-184 are still unused in live `PRD/sections/` and are the next free numbers.
3. Quantitative targets: reproduce once each `npm --workspace apps/backend run test:eval` (brief expects the semantic path at 9 of 12 labelled checks, lexical 12/12) and `node --test scripts/lambda-package-budget.test.mjs` (brief records 118.095 MB of 120 MB data; PR #194 may have changed what this test measures — report the current figure beside the brief's, and treat a changed figure as a finding only if the brief's gates no longer hold). Do not run `npm run benchmark:rag-retrieval` in either mode: both were reproduced at the spec-forming gate-qc on the same corpus and they rewrite tracked result files.
4. Package state: `STATUS.refined` is the only marker, `README.md` reads `status: refined`, the board row sits under `## refined`, `README.md` carries `## Autonomous metadata`, and `GRAPH-RUN.md` `## Open gate` reads resolved.

Verdict handling: on PASS, change nothing (leave `STATUS.refined`; do not write `GAMEPLAN.md`, slice docs, or code; do not edit the README, the driver writes the gate section). On FAIL, set `status: refining` in `README.md`, replace the marker with `STATUS.refining`, move the board row under `## refining`, commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`, never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Do not push. Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or `GRAPH-RUN.md`.

Constraints: tool-call cap 60 for this node, counting every call. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior gate-qc exhausted its cap that way. Run each measurement command once. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the one-word verdict (PASS or FAIL); the complete findings list, or `none`; the `Current:` block verification result (count checked, count identical); the NFR-017 edit consistency result; each reproduced measurement with the brief's value beside it; the package state after the node; the commit hash if you committed; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### plan

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 5 (`plan`) of graph run `graph-20260905-191535`, the build half driven by `graph-implement`. Invoke the `thejudge-map-out` skill with the Skill tool (skill name `thejudge-map-out`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, require `Quality-check: PASS` in the package README's `## Preparation gate` section (it is there; you cannot self-certify one), create the GAMEPLAN and slice contract, and return control to the driver. Read `.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md` (slice template, Ship gates block, and the `slice-<letter>.criteria.json` schema with its worked example), `PRD/instructions/doc-lifecycle.md`, `PRD/instructions/workflow-reference.md`, `PRD/instructions/runtime-process-hygiene.md`, `PRD/instructions/requirement-format.md`, and `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## Acceptance criteria are earned, not written`) before acting.

Inputs: `PRD/work/hybrid-rule-retrieval/DESIGN-BRIEF.md` (the four items and the measurement plan) and the finalized `GATE-QUESTIONS.md` (15 blocks, 14 accept + 1 edit, 0 reject; the NFR-017 block carries an owner-added Notes bullet). The brief's `## Measurement plan` and the proposal's stated gates are the acceptance bar: every quantitative target in a slice must be the measured threshold with its baseline from the brief, never a proportion or a guess.

Slicing requirements:
- The `build` node applies the finalized `GATE-QUESTIONS.md` proposal to `PRD/sections/` by intent, together with the code, in the slice PR. Assign every one of the 15 proposal blocks to exactly one slice as an explicit deliverable of that slice (name the block and the target file), so no product-truth edit is orphaned. A block whose code lands in slice X is applied in slice X.
- One primary objective per slice; explicit dependencies in the README slice table; each slice carries Status, Goal, Requirements, Files touched, Tests, Acceptance criteria.
- Every acceptance criterion gets an entry in that slice's `slice-<letter>.criteria.json`, `value` initialised `false`, with an `evidence` block naming the exact command pattern, file path(s), or `manual: true`. Author each block beside its criterion in the same pass. Prefer command evidence (the eval, benchmark, and budget commands the brief names) over manual.
- The Lambda budget item is decided by measurement per the brief; the slice must state the measurement and the decision rule already recorded there, not reopen the choice.
- No user-visible screen change is in scope; do not add UI slices.
- Never run `npm run data:refresh` or any Scryfall refresh; never run `npm run benchmark:rag-retrieval` (it rewrites tracked result files; the numbers are already recorded in the brief).

Writes: `GAMEPLAN.md`, `slice-<letter>-<name>.md` docs, `slice-<letter>.criteria.json` files, the package `README.md` (slice table, implementation map, `status: active`; keep `## Autonomous metadata` and `## Preparation gate` intact), the marker `STATUS.active` (replacing `STATUS.refined`; exactly one marker), and the board row moved to `## active` in `PRD/work/STATUS.md`. Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GRAPH-RUN.md`, `PRD/sections/`, or code.

Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`) on the current branch `thejudge-auto/hybrid-rule-retrieval`, with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Do not push; the driver publishes before `build`.

Constraints: tool-call cap 120 for this node, counting every call. Do not dispatch subagents. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the slice list (letter, file name, one-line goal, the proposal blocks it applies, dependencies); the criteria count per slice and how many are `manual`; the `## Preparation gate` line you verified; the package state after the node (marker, README status, board heading); the commit hash; `git status --porcelain` output (expect empty); the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### build

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 6 (`build`) of graph run `graph-20260905-191535`, the build half driven by `graph-implement`. Invoke the `thejudge-implement-all` skill with the Skill tool (skill name `thejudge-implement-all`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## Acceptance criteria are earned, not written`, `## Boundaries`), take the recorded autonomous base from the package README's `## Autonomous metadata` section (`origin/thejudge-auto/hybrid-rule-retrieval`), and treat every stop as a park reported back to the driver, never as a question to a user. Read `.claude/skills/thejudge-implement-all/SKILL.md` and its `reference.md`, `PRD/instructions/workflow-reference.md`, `PRD/instructions/runtime-process-hygiene.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/technical-design-rules.md` before acting.

Branch and worktree (fixed by the driver): create the worktree at `.worktrees/implement-hybrid-rule-retrieval` (inside the repo-local `.worktrees/` root, nowhere else) from the latest fetched `origin/thejudge-auto/hybrid-rule-retrieval`, and use the explicit shared remote branch `thejudge-auto/hybrid-rule-retrieval-work` — distinct from the base, so the PR is `thejudge-auto/hybrid-rule-retrieval-work` → `thejudge-auto/hybrid-rule-retrieval`. Open that PR with `gh pr create` after the first milestone push (base `thejudge-auto/hybrid-rule-retrieval`, never `main`); its body opens with the plain-language block `PRD/instructions/plain-language-standard.md` requires and ends with the lines
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Never merge or close the PR. Never push to the base branch or to `main`. Never force-push in any form.

The work: `GAMEPLAN.md` and the five slice docs A–E, in dependency order (A, then B and C and D in any order that respects the table, then E). Slice A is where the hybrid blend lands; treat its measured gates in `DESIGN-BRIEF.md` `## Measurement plan` as the bar. Each slice's `slice-<letter>.criteria.json` is the gate: a criterion is set `true` only after the boundary hook has observed its evidence (the hook denies a premature flip and names the evidence still missing; a denied call is never retried verbatim — earn the evidence first, then flip). A `manual` criterion is earned by a dated observation line naming its id, written in the slice doc. Report `ok` only when every criterion in every slice's file is `true`; any `false` fails the node.

Apply product truth by intent: every one of the 15 finalized `GATE-QUESTIONS.md` blocks is applied to `PRD/sections/` in the slice the GAMEPLAN's assignment table names, re-derived against the current text of the target file (never a blind replay of the frozen patch), committed together with that slice's code. The NFR-017 block carries an owner-added `- Notes:` bullet (the CUDA-runtime CI rejection and PR #194's fix) — apply it with the rest of that block in slice C. No block was rejected, so nothing is burned. Apply each block exactly once.

Verification per slice: the slice's own `## Tests` and `## Acceptance criteria`, then `npm run quality:check`, with the non-ignored worktree matching the index before and after; commit `feat(hybrid-rule-retrieval): complete slice <letter>` and push `HEAD` to the shared branch without force. Commit with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
`npm run benchmark:rag-retrieval` (both modes) rewrites the tracked `apps/backend/src/eval/benchmark/results.json` and `semantic-results.json`; where a slice legitimately changes those numbers, commit them as that slice's output, and where only `scoredAt` moved, restore them with `git checkout --` before committing.

Write scope: write only inside `.worktrees/implement-hybrid-rule-retrieval/` and `PRD/work/hybrid-rule-retrieval/`. The driver asserts this on return and a write anywhere else fails the node. Never edit the launch checkout's code, `PRD/sections/`, `CLAUDE.md`, `.claude/settings*.json`, `.claude/graph-profile.json`, or any `thejudge-*` skill. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. Never run `npm run data:refresh` or any Scryfall refresh. Never use `nohup`, a background `&`, `pkill`, or `killall`. Slices C and E touch deploy scripts and the Lambda budget test only; do not run `scripts/aws-deploy.sh` or `scripts/aws-bootstrap.sh` against AWS — deploying is not in scope, the tests are.

When every slice is `done`: set `status: ship-ready` in the package README, replace the marker with `STATUS.ship-ready` (exactly one marker), move the board row under `## ship-ready` in `PRD/work/STATUS.md`, commit and push those with the last slice, and run the READY loop from `reference.md`.

Constraints: tool-call cap 1200 for this node, counting every call you and any helper make. Do not dispatch implementation subagents; a helper's calls charge this node's own budget. If a slice is blocked, an acceptance gate cannot be made green from the confirmed decisions and tests, or a rebase conflict's intent is not derivable, stop: leave the slice `blocked` with the evidence in its doc, push nothing further for it, and report `failed` with the reason — never guess a product decision.

Report back, in this order: `ok` or `failed`; the PR URL and its head commit; the worktree path; each slice's final status with its criteria count true/total; the list of every path you wrote outside the worktree (expect only `PRD/work/hybrid-rule-retrieval/` entries, or none); the measured numbers for the brief's gates (fixtures passing under the blend, benchmark recall@5 clean and polluted, Lambda data MB of 120, cold-start figure) beside the brief's values; the package state (marker, README status, board heading); `npm run quality:check` result; `git status --porcelain` of the worktree (expect empty); the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### build (attempt 2, owner decision on slice A)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 6 (`build`), attempt 2, of graph run `graph-20260905-191535`, resumed after the owner answered the slice A blocker. The owner's decision, recorded under `## Open gate` in `PRD/work/hybrid-rule-retrieval/GRAPH-RUN.md`: keep the 12/12 fixture gate and the `[0.50, 0.70]` alpha band; add a cross-reference boost — a candidate rule whose text cites a rule number the question cites (for example 701.8b cites 704.5g) receives a boost, alongside the existing exact-rule-id and parent-rule-id boosts — and amend REQ-182's proposal block in `GATE-QUESTIONS.md` to record it before applying it to `PRD/sections/`; then re-sweep alpha within the band against the gates. Duplicate-collapsing of cross-referencing rules is not included. Continue the `thejudge-implement-all` run you started (same worktree `.worktrees/implement-hybrid-rule-retrieval`, same shared branch `thejudge-auto/hybrid-rule-retrieval-work`, PR #197); every constraint from your original dispatch still holds.

Slice A: implement the boost in `apps/backend/src/gameRulesRetrieval.ts` as one named constant, extracted from the rule text with the same rule-id pattern `extractRuleIds` uses, matched against the question's cited ids only (never oracle-sourced text), merged into the blended score the way the id boost is; size it by measurement so it is smaller than the exact-rule-id boost and record the value and rationale in REQ-182's Notes. Keep the mock/lexical path byte-identical (A4). Re-run the alpha sweep with the boost in place, pick alpha, and record the full sweep (fixtures, clean/polluted recall@5 and MRR per alpha) in REQ-182's Notes. Amend the REQ-182 block in `GATE-QUESTIONS.md` first — the 12/12 sentence, the acceptance criterion describing the score, and the Notes — so that the block you apply by intent to `functional-requirements.md` is true; note in the block that the cross-reference boost was added at build by owner decision on 2026-09-05. Then finish A2/A5/A7/A10, mark slice A done, commit and push it, and continue B, C, E in dependency order to ship-ready as originally dispatched. If the boost still cannot reach 12/12 inside the band, stop again with the same evidence shape and report `failed`; do not widen the band or accept 11/12.

Everything else from the original dispatch is unchanged: commit with explicit paths and the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
never force-push, never push to the base or `main`, never merge or close the PR, write only inside the worktree and `PRD/work/hybrid-rule-retrieval/`, never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file, no subagents, no `npm run data:refresh`, no AWS deploy. Tool-call cap 1200 for this attempt, counting every call.

Report back in the same order as before: `ok` or `failed`; PR URL and head; worktree path; per-slice status with criteria true/total; paths written outside the worktree; the measured gates (fixtures, recall@5 clean/polluted, Lambda MB, cold start) beside the brief's values, plus the chosen alpha and boost value; package state; `npm run quality:check` result; worktree `git status --porcelain`; tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### build (attempt 2, bookkeeping follow-up)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Node 6 (`build`), attempt 2 of graph run `graph-20260905-191535`, one follow-up before the driver dispatches `review`. Your return-side assertion passed, but the package bookkeeping you wrote lives only in the launch checkout: on the PR head `e0ec080`, `PRD/work/hybrid-rule-retrieval/README.md` still lists every slice as `planned`, every `slice-<letter>.criteria.json` is all `false`, the marker is still `STATUS.active`, and `PRD/work/STATUS.md` still has the row under `## active`. The launch-checkout copies (README, the five slice docs, the five criteria files, `STATUS.ship-ready`, the board row under `## ship-ready`) are the earned state — `thejudge-implement-all` stages every intended slice output with the slice, so they belong on `thejudge-auto/hybrid-rule-retrieval-work` too.

Do exactly this, nothing else: in the worktree `.worktrees/implement-hybrid-rule-retrieval`, make `PRD/work/hybrid-rule-retrieval/README.md`, `slice-a-hybrid-blend.md`, `slice-b-eval-gating.md`, `slice-c-lambda-vector-budget.md`, `slice-d-cold-start-measurement.md`, `slice-e-deploy-default.md`, the five `slice-<letter>.criteria.json` files, and `PRD/work/STATUS.md` byte-identical to the launch-checkout copies at `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/hybrid-rule-retrieval/` and `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/STATUS.md` (copy them; do not re-derive), replace `STATUS.active` with `STATUS.ship-ready` in the worktree (exactly one marker), leave `GATE-QUESTIONS.md` and `GRAPH-RUN.md` untouched, and confirm with `diff` that each copied file matches its launch-checkout source. Do not change code, tests, data, or `PRD/sections/`. The criteria files you copy are already earned — the hook logged their evidence under this run — so no criterion is being flipped here. Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`) as `chore(hybrid-rule-retrieval): record slice statuses, earned criteria, and ship-ready on the work branch`, with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
and push `HEAD` to `thejudge-auto/hybrid-rule-retrieval-work` without force. Never push to the base or `main`; never merge or close the PR; never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file; no subagents. This continues your attempt-2 budget (cap 1200, 364 used).

Report back: the commit hash and the pushed head; the `diff` result per copied file (expect identical); `ls PRD/work/hybrid-rule-retrieval/STATUS.*` in the worktree (expect only `STATUS.ship-ready`); worktree `git status --porcelain` (expect empty); the tool-call count for this follow-up. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### review (attempt 1)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 7 (`review`) of graph run `graph-20260905-191535`: a fresh-context, no-write reviewer. You hold no Write, Edit, or NotebookEdit tool and must not modify, commit, push, stash, or delete anything; do not run any command that changes tracked files (in particular never run `npm run benchmark:rag-retrieval`, `npm run data:refresh`, `eval:build-frozen-query-embeddings`, or any deploy script). Do not dispatch subagents. Tool-call cap 120, counting every call. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

What you are grading: PR #197 https://github.com/ChrisMiho/TheJudge/pull/197, branch `thejudge-auto/hybrid-rule-retrieval-work` at head `b45d85d`, against its base `thejudge-auto/hybrid-rule-retrieval` at `fff2df3`. The checked-out copy of the head is the worktree `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-hybrid-rule-retrieval` (read there; run read-only test commands there). The diff is `git diff fff2df3..b45d85d` (27 code/data/spec files plus the package bookkeeping commit). Package artifacts, in the worktree under `PRD/work/hybrid-rule-retrieval/`: `DESIGN-BRIEF.md` (intent and `## Measurement plan`), `GATE-QUESTIONS.md` (the finalized product-truth proposal, 15 blocks, 14 accept + 1 owner edit on NFR-017; REQ-182's block was amended at build by owner decision to add a cross-reference boost), `GAMEPLAN.md` (slice and proposal-block assignment tables), the five slice docs, and their `slice-<letter>.criteria.json` files. Read `PRD/instructions/graph-workflow-contract.md` `## Node 7 — the no-write reviewer` and `## Propose / apply / close` first.

The rubric is the slices' own acceptance criteria, quoted here verbatim, and nothing else:

Slice A (`slice-a-hybrid-blend.md`):
- A1 — under `EMBEDDING_PROVIDER=local`, each candidate's score is the normalised linear blend above, with the boost merged into the blended score
- A2 — `alpha` is a single named constant in `[0.50, 0.70]`; the chosen value and the full sweep are recorded in REQ-182's Notes
- A3 — the blend is scored over the full candidate list, never a truncated top-N of either ranking
- A4 — under `mock`, and on any embedding failure, scoring is byte-identical to the prior lexical-only path: benchmark clean recall@5 0.5833 / MRR 0.4249, polluted recall@5 0.5256 / MRR 0.3872
- A5 — all 12 labelled fixture checks pass under the semantic path (`system3-expected-recall`, `system3-noise-excluded` across the eight labelled fixtures), against the 2026-09-05 baseline of 9/12
- A6 — benchmark clean recall@5 ≥ 0.8526 and polluted recall@5 ≥ 0.8333
- A7 — clean/polluted MRR are recorded in REQ-182's Notes alongside recall (reported, not gated)
- A8 — System 3 stays capped at 5 excerpts, still deduplicated against the System 2 selection by rule-number prefix, prompt section placement unchanged
- A9 — `scripts/rag-retrieval-benchmark.mjs --semantic` (via `scoreBenchmarkSemantic`) fails loudly rather than silently reporting a lexical result as semantic when the embedder is unavailable
- A10 — the six documentation blocks in Requirement 3 are applied, byte-matching the finalized `GATE-QUESTIONS.md` diff by intent, across `functional-requirements.md`, `system-map.md`, `system-map/game-rules-retrieval.md`, `in-depth/README.md`, and `system-map/prompt-layout-spec.md`

Slice B (`slice-b-eval-gating.md`):
- B1 — Slice A is `done` before this slice's code lands
- B2 — `system3-expected-recall` and `system3-noise-excluded` fail `npm run test:eval` on a genuine semantic-path regression (a failing check fails the run; no report-only `console.log`-only path remains for the labelled-fixture assertion)
- B3 — one new labelled fixture exists for a multi-keyword card (two or more real Scryfall keywords), with hand-labelled expected/forbidden supplemental rule ids
- B4 — the new fixture's frozen query embedding is committed via `npm run eval:build-frozen-query-embeddings`
- B5 — `npm run test:eval` passes with the new fixture included and the checks gating
- B6 — the REQ-032 documentation block is applied by intent, matching the finalized `GATE-QUESTIONS.md` diff, in `PRD/sections/functional-requirements.md`

Slice C (`slice-c-lambda-vector-budget.md`):
- C1 — the artifact's `encoding` field names the shipped format, and the loader reads that field rather than assuming one
- C2 — the committed artifact is measurably smaller: from 5.650 MB (`float32-base64`) to about 1.442 MB (int8)
- C3 — tracked `apps/backend/data` total drops from the 2026-09-05 measurement of 118.095 MB; the new figure and headroom are recorded in NFR-017
- C4 — retrieval quality does not regress after the format change: benchmark clean recall@5 at or above the value REQ-182 records, polluted recall@5 likewise, and all 12 labelled fixture checks still pass
- C5 — the vector-loading path degrades exactly as REQ-181 requires: a missing, malformed, or unrecognised-encoding artifact disables the semantic path with one diagnostic warning and System 3 falls back to lexical retrieval
- C6 — `node --test scripts/lambda-package-budget.test.mjs` passes with the new artifact, and the test's recorded figures are updated in the same change
- C7 — `MIN_VARIANT_POPULARITY` stays at 0 (the combo corpus is not trimmed) and no new dependency or external service is introduced
- C8 — the REQ-183 and NFR-017 documentation blocks are applied by intent, matching the finalized `GATE-QUESTIONS.md` diff (including the owner's CI/CUDA edit), in `PRD/sections/functional-requirements.md` and `PRD/sections/non-functional-requirements.md`

Slice D (`slice-d-cold-start-measurement.md`):
- D1 — `PRD/sections/non-functional-requirements.md`'s NFR-002 defines cold-start model readiness (wall-clock, process start to first System 3 query embedding, packaged on-disk cache, no network call) and requires it to stay a small enough share of the 3-second answer target
- D2 — NFR-002's Notes record the 2026-09-05 local measurement (181.2 ms cold-start model readiness; 1.05 ms steady-state) and require the deployed figure to be read from the Lambda function's own cold-start log line, not assumed from the local number

Slice E (`slice-e-deploy-default.md`):
- E1 — Slices A, B, and C are all `done` before this slice's code and doc changes land
- E2 — the deployed Lambda's environment sets `EMBEDDING_PROVIDER=local` explicitly, recorded in the same places `ASK_AI_PROVIDER` is set (`scripts/aws-deploy.sh`, `scripts/aws-bootstrap.sh`)
- E3 — `EMBEDDING_PROVIDER` unset still resolves to `mock` and never auto-switches on `NODE_ENV` or deploy target (existing coverage: `apps/backend/src/config/index.test.ts`)
- E4 — a test asserts the deploy fails, rather than silently degrading, when the packaged model cache is absent
- E5 — a local `npm run dev` with no warmed model cache and no network still answers, using lexical retrieval, with the single diagnostic warning REQ-181 requires (existing coverage; confirmed, not re-built)
- E6 — the REQ-184 (new), `quick-lookup/README.md`, and `integrations-and-data.md` documentation blocks are applied by intent, matching the finalized `GATE-QUESTIONS.md` diff
- E7 — Ship gates below are satisfied and the durable `PRD/sections/` outcome for this package is fully applied (no leftover proposal text)

How to grade: for every criterion, find the evidence in the diff, the tests, or a read-only command you ran, and mark it met, not met, or not verifiable read-only (say why). You may run, in the worktree, `npm --workspace apps/backend run test:eval`, `node --test scripts/lambda-package-budget.test.mjs`, `npm --workspace apps/backend run test -- gameRulesRetrieval`, `npm --workspace apps/backend run test -- ragRetrievalBenchmark`, and `npm --workspace apps/backend run typecheck`; nothing that writes tracked files. Check the apply-by-intent work specifically: every one of the 15 `GATE-QUESTIONS.md` blocks should now be present in its target `PRD/sections/` file as the block's proposed text, re-derived against current truth, exactly once, with the NFR-017 owner edit and the REQ-182 build-time amendment (cross-reference boost, alpha 0.60, the full sweep) reflected, and with no stale claim left standing (for example a 12/12-at-alpha-0.52 sentence that the measured build contradicts). Check the cross-reference boost is matched against question-cited ids only, is one named constant smaller than the exact-id boost, and leaves the mock path byte-identical.

Severity rule, from the contract: flag only gaps affecting correctness or these stated requirements. A preference, a style note, or an improvement outside the slices' stated requirements is never Critical or Important and never returns the run to `build`; list such things, if at all, as Minor with no action. Critical means a stated criterion is not met in a way that ships wrong behaviour or false product truth; Important means a stated criterion is not met but the code behaves; Minor is everything else.

Report back, in this order: the one-line verdict, `APPROVE` or `RETURN TO BUILD`; per-criterion results A1–E7 (met / not met / not verifiable, one line each with the evidence path or command); the findings list, each with severity, the criterion id it fails, file and line, and what was observed versus required; the commands you ran and their results; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### build (attempt 3, review loop 1)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 6 (`build`), attempt 3 of graph run `graph-20260905-191535` — review loop 1 of 2. The no-write reviewer graded PR #197 at head `b45d85d` against the slices' acceptance criteria and returned it to build with one Critical and one Important finding, both confirmed by the driver. Resolve exactly these in the worktree `.worktrees/implement-hybrid-rule-retrieval` on `thejudge-auto/hybrid-rule-retrieval-work`; every constraint from your original dispatch still holds. Fresh tool-call budget for this attempt: cap 1200.

Critical, A1 (slice A). `apps/backend/src/prompt/preparation.ts` lines 223–231 (`retrieveRulesForQueryWithDebug`) and 266–274 (`retrieveRulesForQuery`) — the Quick Lookup path — pass eight positional arguments, so the ninth parameter `questionRuleIds` defaults to `[]` and `computeCrossReferenceBoost` returns 0 for every candidate in lookup mode. The game path (`retrieveSupplementalRules(WithDebug)`) passes `query.questionRuleIds`, so the boost fires only there. The live REQ-182 criterion carves out no mode. Fix: pass `query.questionRuleIds` at both lookup call sites; add a test proving a lookup-mode question that cites a rule number promotes a rule whose text cites that number (for example a question naming 704.5g surfaces 701.8b), and that the mock path stays byte-identical; confirm `apps/backend/src/eval/retrievalReportInputs.ts` and the harness's lookup fixtures now go through the same boosted path so report and harness agree (REQ-177 parity).

Important, A10 / E7 (slice E's `system-map.md` share). `PRD/sections/system-map.md:90` `Backed by:` ends at `REQ-183`; the finalized `GATE-QUESTIONS.md` block for `system-map.md — Supplemental retrieval (System 3)` ends `REQ-182, REQ-183, REQ-184`. Append `REQ-184`.

Minor, optional and only if trivial: REQ-182's Notes in `functional-requirements.md` record alpha-0.60 MRR as 0.7139 / 0.6928 while the committed `semantic-results.json` (int8 artifact) records 0.7107 / 0.6931 — record the shipped figures, or state that the sweep MRR predates quantisation; NFR-002's dated bullet names a 5.65 MB artifact that is now 1.442 MB after REQ-183 — add the post-REQ-183 size beside it. Do not change any other product truth.

Then re-verify: `npm --workspace apps/backend run test -- gameRulesRetrieval`, `npm --workspace apps/backend run test:eval` (expect 14/14), `npm --workspace apps/backend run typecheck`, and `npm run quality:check`, with the non-ignored worktree matching the index before and after. Keep every `slice-<letter>.criteria.json` value `true` (their evidence is already earned under this run; do not flip anything to `false`). Commit with explicit paths only (never `git add -A`, `--all`, or `.`) as `fix(hybrid-rule-retrieval): review loop 1 — wire the cross-reference boost into lookup mode; REQ-184 on the system map`, with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
push `HEAD` to `thejudge-auto/hybrid-rule-retrieval-work` without force, and add a `## Review loop 1` section to the PR #197 body naming each finding and its resolution. Never push to the base or `main`; never merge or close the PR; write only inside the worktree and `PRD/work/hybrid-rule-retrieval/`; never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file; no subagents; no `npm run data:refresh`; no AWS deploy. If a finding cannot be resolved from the confirmed decisions and tests, stop and report `failed` with the evidence rather than guessing.

Report back, in this order: `ok` or `failed`; the new head commit and PR URL; each finding with its resolution and the test that proves it; the re-verification results; whether the two Minors were taken; worktree `git status --porcelain` (expect empty); the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### review (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 7 (`review`), attempt 2, of graph run `graph-20260905-191535`: a fresh-context, no-write reviewer. You hold no Write, Edit, or NotebookEdit tool and must not modify, commit, push, stash, or delete anything; do not run any command that changes tracked files (never `npm run benchmark:rag-retrieval`, `npm run data:refresh`, `eval:build-frozen-query-embeddings`, or any deploy script). Do not dispatch subagents. Tool-call cap 120, counting every call. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

What you are grading: PR #197 https://github.com/ChrisMiho/TheJudge/pull/197, branch `thejudge-auto/hybrid-rule-retrieval-work` at head `bf74140`, against its base `thejudge-auto/hybrid-rule-retrieval` at `fff2df3`. The checked-out copy of the head is the worktree `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-hybrid-rule-retrieval` (read there; run read-only test commands there). Full diff `git diff fff2df3..bf74140`; the review-loop-1 fix alone is `git diff b45d85d..bf74140`. Package artifacts in the worktree under `PRD/work/hybrid-rule-retrieval/`: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (15 finalized blocks; REQ-182 amended at build by owner decision to add a cross-reference boost), `GAMEPLAN.md`, the five slice docs and their `slice-<letter>.criteria.json`. Read `PRD/instructions/graph-workflow-contract.md` `## Node 7 — the no-write reviewer` and `## Propose / apply / close` first.

Attempt 1 (a different reviewer, at head `b45d85d`) returned the run to build with: Critical A1 — the two Quick Lookup call sites in `apps/backend/src/prompt/preparation.ts` (`retrieveRulesForQueryWithDebug`, `retrieveRulesForQuery`) omitted the trailing `questionRuleIds` argument, so the cross-reference boost never fired in lookup mode; Important A10/E7 — `PRD/sections/system-map.md:90` `Backed by:` lacked `REQ-184`; Minor A7 — REQ-182 Notes MRR figures predated int8 quantisation; Minor D2 — NFR-002's dated bullet named the pre-REQ-183 5.65 MB artifact size. The builder reports all four resolved at `bf74140`. Verify each resolution yourself; then grade the whole PR against the rubric, since you are fresh.

The rubric is the slices' own acceptance criteria, quoted verbatim, and nothing else:

Slice A (`slice-a-hybrid-blend.md`):
- A1 — under `EMBEDDING_PROVIDER=local`, each candidate's score is the normalised linear blend above, with the boost merged into the blended score
- A2 — `alpha` is a single named constant in `[0.50, 0.70]`; the chosen value and the full sweep are recorded in REQ-182's Notes
- A3 — the blend is scored over the full candidate list, never a truncated top-N of either ranking
- A4 — under `mock`, and on any embedding failure, scoring is byte-identical to the prior lexical-only path: benchmark clean recall@5 0.5833 / MRR 0.4249, polluted recall@5 0.5256 / MRR 0.3872
- A5 — all 12 labelled fixture checks pass under the semantic path (`system3-expected-recall`, `system3-noise-excluded` across the eight labelled fixtures), against the 2026-09-05 baseline of 9/12
- A6 — benchmark clean recall@5 ≥ 0.8526 and polluted recall@5 ≥ 0.8333
- A7 — clean/polluted MRR are recorded in REQ-182's Notes alongside recall (reported, not gated)
- A8 — System 3 stays capped at 5 excerpts, still deduplicated against the System 2 selection by rule-number prefix, prompt section placement unchanged
- A9 — `scripts/rag-retrieval-benchmark.mjs --semantic` (via `scoreBenchmarkSemantic`) fails loudly rather than silently reporting a lexical result as semantic when the embedder is unavailable
- A10 — the six documentation blocks in Requirement 3 are applied, byte-matching the finalized `GATE-QUESTIONS.md` diff by intent, across `functional-requirements.md`, `system-map.md`, `system-map/game-rules-retrieval.md`, `in-depth/README.md`, and `system-map/prompt-layout-spec.md`

Slice B (`slice-b-eval-gating.md`):
- B1 — Slice A is `done` before this slice's code lands
- B2 — `system3-expected-recall` and `system3-noise-excluded` fail `npm run test:eval` on a genuine semantic-path regression (a failing check fails the run; no report-only `console.log`-only path remains for the labelled-fixture assertion)
- B3 — one new labelled fixture exists for a multi-keyword card (two or more real Scryfall keywords), with hand-labelled expected/forbidden supplemental rule ids
- B4 — the new fixture's frozen query embedding is committed via `npm run eval:build-frozen-query-embeddings`
- B5 — `npm run test:eval` passes with the new fixture included and the checks gating
- B6 — the REQ-032 documentation block is applied by intent, matching the finalized `GATE-QUESTIONS.md` diff, in `PRD/sections/functional-requirements.md`

Slice C (`slice-c-lambda-vector-budget.md`):
- C1 — the artifact's `encoding` field names the shipped format, and the loader reads that field rather than assuming one
- C2 — the committed artifact is measurably smaller: from 5.650 MB (`float32-base64`) to about 1.442 MB (int8)
- C3 — tracked `apps/backend/data` total drops from the 2026-09-05 measurement of 118.095 MB; the new figure and headroom are recorded in NFR-017
- C4 — retrieval quality does not regress after the format change: benchmark clean recall@5 at or above the value REQ-182 records, polluted recall@5 likewise, and all 12 labelled fixture checks still pass
- C5 — the vector-loading path degrades exactly as REQ-181 requires: a missing, malformed, or unrecognised-encoding artifact disables the semantic path with one diagnostic warning and System 3 falls back to lexical retrieval
- C6 — `node --test scripts/lambda-package-budget.test.mjs` passes with the new artifact, and the test's recorded figures are updated in the same change
- C7 — `MIN_VARIANT_POPULARITY` stays at 0 (the combo corpus is not trimmed) and no new dependency or external service is introduced
- C8 — the REQ-183 and NFR-017 documentation blocks are applied by intent, matching the finalized `GATE-QUESTIONS.md` diff (including the owner's CI/CUDA edit), in `PRD/sections/functional-requirements.md` and `PRD/sections/non-functional-requirements.md`

Slice D (`slice-d-cold-start-measurement.md`):
- D1 — `PRD/sections/non-functional-requirements.md`'s NFR-002 defines cold-start model readiness (wall-clock, process start to first System 3 query embedding, packaged on-disk cache, no network call) and requires it to stay a small enough share of the 3-second answer target
- D2 — NFR-002's Notes record the 2026-09-05 local measurement (181.2 ms cold-start model readiness; 1.05 ms steady-state) and require the deployed figure to be read from the Lambda function's own cold-start log line, not assumed from the local number

Slice E (`slice-e-deploy-default.md`):
- E1 — Slices A, B, and C are all `done` before this slice's code and doc changes land
- E2 — the deployed Lambda's environment sets `EMBEDDING_PROVIDER=local` explicitly, recorded in the same places `ASK_AI_PROVIDER` is set (`scripts/aws-deploy.sh`, `scripts/aws-bootstrap.sh`)
- E3 — `EMBEDDING_PROVIDER` unset still resolves to `mock` and never auto-switches on `NODE_ENV` or deploy target (existing coverage: `apps/backend/src/config/index.test.ts`)
- E4 — a test asserts the deploy fails, rather than silently degrading, when the packaged model cache is absent
- E5 — a local `npm run dev` with no warmed model cache and no network still answers, using lexical retrieval, with the single diagnostic warning REQ-181 requires (existing coverage; confirmed, not re-built)
- E6 — the REQ-184 (new), `quick-lookup/README.md`, and `integrations-and-data.md` documentation blocks are applied by intent, matching the finalized `GATE-QUESTIONS.md` diff
- E7 — Ship gates below are satisfied and the durable `PRD/sections/` outcome for this package is fully applied (no leftover proposal text)

How to grade: for every criterion, find the evidence in the diff, the tests, or a read-only command you ran, and mark it met, not met, or not verifiable read-only (say why). You may run, in the worktree, `npm --workspace apps/backend run test:eval`, `node --test scripts/lambda-package-budget.test.mjs`, `npm --workspace apps/backend run test -- gameRulesRetrieval`, `npm --workspace apps/backend run test -- preparation`, `npm --workspace apps/backend run test -- ragRetrievalBenchmark`, and `npm --workspace apps/backend run typecheck`; nothing that writes tracked files. Check the apply-by-intent work: every one of the 15 `GATE-QUESTIONS.md` blocks present in its target `PRD/sections/` file as proposed, re-derived against current truth, exactly once, with the NFR-017 owner edit and the REQ-182 build-time amendment (cross-reference boost, alpha 0.60, the sweep) reflected and no stale claim left standing. Check the cross-reference boost now fires on both the game and the Quick Lookup paths, is matched against question-cited ids only, is one named constant smaller than the exact-id boost, and leaves the mock path byte-identical.

Severity rule, from the contract: flag only gaps affecting correctness or these stated requirements. A preference, a style note, or an improvement outside the slices' stated requirements is never Critical or Important and never returns the run to `build`; list such things, if at all, as Minor with no action. Critical means a stated criterion is not met in a way that ships wrong behaviour or false product truth; Important means a stated criterion is not met but the code behaves; Minor is everything else. This is the second review; a third return to build parks the run, so weigh Important carefully against that bar.

Report back, in this order: the one-line verdict, `APPROVE` or `RETURN TO BUILD`; the four loop-1 resolutions, each confirmed or not with evidence; per-criterion results A1–E7 (one line each with the evidence path or command); the findings list, each with severity, criterion id, file and line, observed versus required; the commands you ran and their results; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make Ask AI's semantic rule retrieval safe to turn on. The rag-rule-retrieval run shipped an opt-in local embedding model (EMBEDDING_PROVIDER=local) that lifts recall@5 on the 156-pair benchmark from 0.58 to 0.85 but loses the exact rule on short lookup-mode questions: two of eight labelled fixtures drop rule 702.2b from the top five because a card name plus one keyword carries too little meaning for cosine ranking alone. Four items, one spec: (1) a hybrid score that blends lexical and semantic ranking so lookup-mode questions keep the exact rule while long questions keep the semantic gain, measured on the same benchmark and the labelled fixtures; (2) once hybrid holds, make the system3-expected-recall and system3-noise-excluded checks gate test:eval on the semantic path instead of report-only, and add one labelled fixture for a multi-keyword card; (3) relieve the Lambda package budget, which sits at 118.10 of 120 MB data after the 130 MB runtime-and-model reserve, by shrinking the 75 MB combos artifact, loading the model from S3 at cold start, or storing vectors in a smaller number format, decided by measurement before the next data refresh; (4) measure Lambda cold-start latency with the model loaded and record it against the existing latency requirement. Success is a measured case for setting EMBEDDING_PROVIDER=local as the default." | answered-once | shape | — (the owner's launch request, passed to node 2 verbatim as the package's intake; every product question it raises is decided at the `define` gate, not pre-resolved) |
| "graph-implement" (the owner's `/loop graph-implement` launch, 2026-09-05) | answered-once | driver-resume | — (a request to run the build loop; every product decision stays with the owner's recorded verdicts and the gates) |
| "i cant accept 11/12, i realize its a good start, but id rather we keep refining how to make things better, is there a reason we cant hit 12/12, is it the data? do we need to redownload the latest rules?" | answered-once | build (owner-action park) | — (the owner's answer to the slice A gate: 11/12 rejected; driver investigated and reported the miss is a missing cross-reference signal, not stale rules data) |
| "this enhancement sounds like what we need, lets do it, do you need anything approved from me?" | answered-once | build (owner-action park) | — (the owner chose the cross-reference boost; recorded as the gate Decision, applied only to slice A's REQ-182 amendment, not as a standing rule) |
