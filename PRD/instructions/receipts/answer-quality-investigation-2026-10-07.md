# Receipt: answer-quality-investigation

**What happened.** The answer-quality evaluation can now run controlled before/after experiments: a fixed set of cases, repeated and regraded from stored answers, stopping at a spending cap, with a side-by-side report, an offline trace of where each deciding rule ranks, and labelled diagnostic prompt arms. Nothing was run against the live model.

**What it means for you.** You can compare PR #273's old and new revisions and the two models for a spend you choose, following `docs/eval/answer-quality-investigation/RUNBOOK.md`. First fill in the owner inputs listed under Follow-ups. Players see no change.

- Date: 2026-10-07
- Slug: `answer-quality-investigation`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/275

## Actions taken

- Built seven slices (A experiment runs and identity record; B checkpoint, resume and spending cap; C grader repair and runtime parity; D offline evidence trace; E diagnostic arms and manifests; F paired compare report; G offline run, runbook and truth apply) on `thejudge-auto/answer-quality-investigation-work`.
- Slice G applied the approved proposal once: REQ-226 to REQ-230 new; REQ-185 to REQ-189 and NFR-018 amended in `PRD/sections/`, plus the system-map summary and the worked-solutions README. Build attempt 2 completed the REQ-229 trace sentence and fixed a stray double space in REQ-226.
- Review attempt 1 returned the build to fix one Important finding: a `test:scripts` test ran the manifest generator and trace over the real corpus, a hidden build gate. Attempt 2 removed it and added a guard test, and was approved.
- Close: confirmed the durable truth above is present and promoted nothing a second time. The system-map entry "Answer-quality baseline" was already `shipped` and has no separate status for this work, so nothing flipped. Wrote this receipt, deleted the package, stripped the board row.

## Files

- Created: `PRD/instructions/receipts/answer-quality-investigation-2026-10-07.md`.
- Created or updated by build (full list in PR #275): `scripts/eval-answer-quality.mjs`, the compare, evidence-trace and manifest scripts and their tests, `apps/backend/src/eval/answer-quality/` (manifests, arm files), `docs/eval/answer-quality-investigation/{OFFLINE-FINDINGS,RUNBOOK}.md`, `PRD/sections/{functional-requirements,non-functional-requirements,system-map}.md`, `apps/backend/src/eval/worked-solutions/README.md`.
- Updated: `PRD/work/STATUS.md` (row removed).
- Deleted: `PRD/work/answer-quality-investigation/` (README, IDEA, DESIGN-BRIEF, GATE-QUESTIONS, QUALITY-CHECK, GAMEPLAN, GRAPH-RUN, STATUS.ship-ready, seven slice docs, seven criteria files, `intake/GRAPH-BRIEF.md`).

## Verification

- `ANSWER_QUALITY_NO_LOCAL_ENV=1 npm run quality:check` exit 0 at the approved head: frontend 1559/1559, backend 583/583, `test:scripts` 766/766, lint 0 errors. Close re-ran it before its commit.
- Offline evidence trace: 392/392 cases agree. Manifests `--check` byte-for-byte identical. Arms check: 46 cases, 0 problems.
- 63/63 slice criteria `true`; the reviewer re-ran the evidence commands (the hook evidence log had 0 entries, the known gap).
- No live OpenAI spend: dry runs and fake clients only. `.secrets/` untouched.

## Follow-ups

Reviewer Minor findings (attempt 1, no loop):

- M1: REQ-228 reference-hash mismatch is applied as refuse, not exclude.
- M2: regrade lacks a question-hash guard and a `calls.jsonl` checkpoint.
- M3: a failed judge call drops its reason.
- M4: four rates are dated "not re-checked" rather than 2026-09-07.
- M5: slice E5 and brief section 4.6 say held-out arm A only, while accepted REQ-230 allows frozen B and P.
- M6: findings line 31 overstates an empty diff.
- M7: head trace and the unchanged-input stratum were not measured (allowed fallback, weak reason).
- M8: stray double space in applied REQ-226. Fixed in build attempt 2.

Reviewer findings (attempt 2):

- N1: the guard test's exec regex misses the promisified `execFileAsync(` form and stops at the first `)`, so the pre-fix file is caught only by its `loadGoldCases` rule.
- N2: REQ-229's "synthetic input" wording is slightly broad, since one test reads the committed manifests as data.

Owner awareness: `scripts/lib/diagnostic-arms.test.mjs` (near line 301) execs `diagnostic-arms-check.mjs` over the real corpus inside `test:scripts`. It is the REQ-230 offline arms check, allowed to gate per `goals-and-non-goals.md:83`, but a corpus refresh that retires a diagnostic case would turn `quality:check` red.

Owner inputs the RUNBOOK still needs (`docs/eval/answer-quality-investigation/RUNBOOK.md`):

- Judge model (D0): stronger than GPT-4.1 and GPT-6 Luna, never one of them; the default `gpt-5` is kept only if judged stronger than Luna.
- A spending cap for each of Phases 1 to 4 (`--max-cost-usd`).
- A rate re-check against the provider's pricing page before any spend.
- Confirmation of the ten re-snapshotted cases (step 0.4).
- Arm P wording approval in `apps/backend/src/eval/answer-quality/arm-p-correction.json` (optional).

Unmeasured: the unchanged-input stratum (runbook step 0), which needs the base and head worktrees the owner sets up.

## Graph run

- Run ID: `graph-20261007-134015` | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/275

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/answer-quality-investigation` pushed at 3e973ced from `.worktrees/kickoff-answer-quality-investigation`; launch checkout untouched (still `main`); lock `.worktrees/.graph-run.lock` taken (pid 19439) | 2026-10-07 |
| 2 | shape | sonnet | ok | `8 → 20` | package `PRD/work/answer-quality-investigation/` created on the branch: commits 0bb3b193 (intake copied verbatim, staged copy deleted) and 7067c63e (IDEA.md with six `## Prior run` lines, README.md with `## Autonomous metadata`, GRAPH-RUN.md, `STATUS.ideation`, board row); launch checkout untouched | 2026-10-07 |
| 3 | define | opus | ok | `22 → 79` (two driver bookkeeping calls charged to shape/1 before run-state moved) | commit b771735d: `DESIGN-BRIEF.md` (14 sections, decision points D0–D5, 23 assumptions, no blocker) + `GATE-QUESTIONS.md` (11 stable-ID blocks: new REQ-226–230; amend REQ-185/186/187/188/189, NFR-018; `## Blocker questions` empty) + `STATUS.refined` + board row; `git diff --stat HEAD~1 -- PRD/sections apps` empty → gate: proposal present, continue to gate-qc | 2026-10-07 |
| 4 | gate-qc | sonnet | ok (PASS) | `79 → 97` (one driver bookkeeping call charged to define/1) | commit 05ecc20b: `PRD/work/answer-quality-investigation/QUALITY-CHECK.md` — Verdict: PASS, findings none; 12/12 removed diff lines match live `PRD/sections/` text; marker left `STATUS.refined`; driver then wrote `## Preparation gate` (PASS), parked at `owner-action`, pushed 2ff207af, opened docs PR https://github.com/ChrisMiho/TheJudge/pull/274 | 2026-10-07 |
| — | claim (driver) | — | ok | — | docs PR #274 merged 2026-10-07T21:48Z; kickoff worktree removed clean (`git worktree remove`, porcelain empty); `.worktrees/implement-answer-quality-investigation` cut on `thejudge-auto/answer-quality-investigation-work` from `origin/main` (1a8e61d5); claim commit fa12f0d0 pushed; lock re-taken (`graph:preflight --take-lock`, pid 19439); graph canary `nohup true` denied | 2026-10-07 |
| 4b | gate-review | sonnet | ok | `0 → 21` | commit 75b85c00: 11 verdicts applied inside `GATE-QUESTIONS.md` (9 accept, 2 edit: REQ-226 drops the cross-checkout `--subject` import and adds a regrade mode; REQ-188 drops the production timeout/retry criterion, keeps combo-catalog parity); `DESIGN-BRIEF.md` reconciled (§2, §4.1, §4.2, §4.8, Phase 0/2/3 steps, §12, truth-changes rows, A6/A9); README note none; `## Gate verdicts` + `### Brief reconciliation` written; marker `STATUS.refined`; board row refined; `git diff --stat HEAD~1 -- PRD/sections apps scripts` empty | 2026-10-07 |
| 4 (attempt 2) | gate-qc | sonnet | failed (FAIL) | `0 → 21` | commit 3bb5bdd2: `QUALITY-CHECK.md` overwritten — Verdict: FAIL, 2 findings: (1) accepted REQ-229 still carries the `--subject`/`--subject-b` cross-checkout import the owner's REQ-226 edit dropped (brief §4.5, Phase 0 step 2 repeat it); (2) "subject" is an undefined term in REQ-228/229/230 and brief §4.4–4.6; both edits (REQ-226, REQ-188) themselves confirmed consistent; marker `STATUS.refining`, board row refining; driver rewrote README `## Preparation gate` (FAIL + findings) and `status: refining` → loop to `define` (gate-qc→define loop 1 of 3) | 2026-10-07 |
| 3 (attempt 2) | define | opus | ok | `0 → 45` | commit e5e3d8cb: REQ-229 re-proposed (no `--subject`/`--subject-b`; the trace measures the checkout it runs from, refuses a dirty checkout, records its commit; two revisions compared offline by `eval:evidence-trace:compare -- <folder-a> <folder-b>`, each folder from its own worktree); REQ-228 and REQ-230 reworded (the checkout the run executes from / the changed revision), substance unchanged; all 11 `- Verdict:`/`- Reason:` lines untouched (diff grep count 0), one `Re-proposed 2026-10-07` line under each of the three blocks; brief §4.4–4.6, Phase 0 step 2, §12 parity rewritten, assumption A24 added (evidence: the owner's REQ-226 verdict); genuine blocker none; marker `STATUS.refined`; `git diff --stat HEAD~1 -- PRD/sections apps scripts` empty. Driver judgment: the moved diffs are consequences of the owner's own REQ-226 rule (blocker test condition 2 fails — an authoritative basis exists), so no fresh verdict park; the owner reads the finalized proposal in the code PR before `land` | 2026-10-07 |
| 4 (attempt 3) | gate-qc | sonnet | ok (PASS) | `0 → 16` | commit d075389f: `QUALITY-CHECK.md` — Verdict: PASS, findings none; both attempt-2 findings closed (REQ-229 traces its own checkout and compares two trace folders; no undefined term left — remaining hits are quoted history); 11/11 blocks well-formed, verdict lines untouched; marker `STATUS.refined`; driver rewrote README `## Preparation gate` to PASS / findings none → advance to `plan` | 2026-10-07 |
| 5 | plan | sonnet | ok | `0 → 16` | commit 94ade4d2: `GAMEPLAN.md` + 7 slice docs (A experiment runs/identity record; B checkpoint/resume/cap; C grader repair + runtime parity; D offline evidence trace; E diagnostic arms + manifests; F paired compare report; G Phase 0 offline run, `docs/eval/answer-quality-investigation/{OFFLINE-FINDINGS,RUNBOOK}.md`, PRD apply, Ship gates) + 7 `slice-*.criteria.json` (63 criteria, all `false`, 1 manual: G13 no-live-spend observation); slice G applies the proposal; build order A→G (A/B/C/F share `scripts/eval-answer-quality.mjs`); README slice table, `STATUS.active`, board row active; driver checked every criteria file parses with all values `false` and no deliverable path lies inside `PRD/work/` | 2026-10-07 |
| 6 | build | sonnet | ok | `0 → 209` | code PR https://github.com/ChrisMiho/TheJudge/pull/275 (`thejudge-auto/answer-quality-investigation-work → main`, title `[THEJUDGE-AUTO][READY]`, MERGEABLE, not merged); slices A–G done at 27635148 / bf7e1b98 / 198d03dd / 948981b5 / 992d968b / 9352c683 / 3123e7fe, ship-ready at 2e2763a3 (= remote tip, worktree clean, marker `STATUS.ship-ready`); driver re-read all 7 `slice-*.criteria.json`: 63/63 `true` (self-reported — hook evidence log has 0 entries for this run, the known criteria-root gap; review re-runs the commands); builder reports `npm run quality:check` green per slice and at READY head, `test:scripts` 766/0, backend 583 pass, typecheck + lint clean, no live OpenAI call (`ANSWER_QUALITY_NO_LOCAL_ENV=1` dry runs + fake clients), `.secrets/` untouched (one read-only probe naming it was hook-denied, not retried; one `sed -i` denied, Edit/Write used instead); slice G applied the proposal once to `PRD/sections/{functional-requirements,non-functional-requirements,system-map}.md` (+156/−12) and `apps/backend/src/eval/worked-solutions/README.md`; six by-intent deviations from the proposal text listed in the builder's report and the review brief; return-side: launch `git status --porcelain` byte-identical before/after (6 lines, still `main`), `classifyBuildWrites` over the 62 changed paths → `ok, all writes inside .worktrees/implement-answer-quality-investigation/` | 2026-10-07 |
| 7 | review | opus | failed (RETURN TO BUILD) | `0 → 69` | no-write reviewer re-ran every evidence command from the worktree (exit 0 each: `ANSWER_QUALITY_NO_LOCAL_ENV=1 npm run quality:check` frontend 1559/1559, backend 583/583, test:scripts 766/766; eval dry run 392 cases no client; evidence trace 392/392 agree; manifests `--check` byte-identical; staleness none; coverage unchanged; arms check 46 cases 0 problems); 63/63 criteria observed pass by the reviewer's own runs; (a) `PRD/sections/` apply pass, both owner edits honoured, no `--subject`, no `DEC-`, max REQ-230; (b) six by-intent deviations judged consistent (two reworded accepted-text cases noted Minor M1/M5); (c) no-spend pass; (d) player-visible surfaces unchanged. One Important finding I1: `scripts/build-answer-quality-manifests.test.mjs:156-189` execs the generator's real-corpus `--check` (which runs the full evidence trace) and validates the committed manifests against the live corpus inside `npm run test:scripts`, which `quality:check` and CI (`.github/workflows/quality-check.yml:60`) run — a de-facto build gate contradicting REQ-229 (`functional-requirements.md:5968`), NFR-018 (`non-functional-requirements.md:302`) and the generator's own header; a corpus refresh would turn quality:check red and its error text tells the developer to re-draw the frozen held-out set. Minor M1–M8 (no loop): M1 REQ-228 reference-hash mismatch applied as refuse not exclude; M2 regrade lacks question-hash guard and `calls.jsonl` checkpoint; M3 failed judge call drops its reason; M4 four rates dated "not re-checked" rather than 2026-09-07; M5 slice E5/brief §4.6 say held-out arm A only vs accepted REQ-230 allowing frozen B/P; M6 findings line 31 overstates an empty diff; M7 head trace/unchanged-input stratum not measured (allowed fallback, weak reason); M8 stray double space in applied REQ-226 → loop to `build` (review→build loop 1 of 2) | 2026-10-07 |
| 6 (attempt 2) | build | sonnet | ok | `0 → 21` | commit 0f04382a (= remote tip, worktree clean, marker `STATUS.ship-ready`): `scripts/build-answer-quality-manifests.test.mjs` no longer execs the generator `--check` or validates manifests against the live corpus (grep execFile/spawn = 0); E5 now proven by a data-only test over the two committed manifest files, E6 by the synthetic determinism test plus the standalone `ANSWER_QUALITY_NO_LOCAL_ENV=1 npm run eval:answer-quality:manifests -- --check` (re-issued: byte-for-byte pass; `slice-e.criteria.json` E6 evidence command updated); `scripts/answer-quality-no-gate.test.mjs` gained a walk over every `scripts/**/*.test.mjs` that fails on exec/spawn of the generator or trace scripts, `runEvidenceTrace` without injected `loadCases`, or `loadGoldCases` beside the generator (builder verified it catches a planted offender); completed the mid-sentence REQ-229 trace constraint in `PRD/sections/functional-requirements.md` and fixed M8; `test:scripts` 766/766, `quality:check` exit 0; 5 paths written; return-side: launch porcelain byte-identical (6 lines, `main`), `classifyBuildWrites` 62 paths → ok. Follow-up noted for the receipt: `scripts/lib/diagnostic-arms.test.mjs` still execs `diagnostic-arms-check.mjs` over the real corpus inside `test:scripts` (not the trace or generator; corpus-coupled) | 2026-10-07 |
| 7 (attempt 2) | review | opus | ok (APPROVE) | `0 → 23` | fresh no-write reviewer at 0f04382a (HEAD 425362cf differs only by the ledger): I1 closed — `build-answer-quality-manifests.test.mjs` has no child_process import, no `--check` exec, no `loadGoldCases`; whole `test:scripts` runs in ~2 s vs ~12 s for the real-corpus `--check`, so the trace cannot be inside it; grep of every `scripts/**/*.test.mjs` finds no exec of the generator or trace scripts and the one `runEvidenceTrace` call injects synthetic `loadCases`; E5 pass (data-only test), E6 pass (`ANSWER_QUALITY_NO_LOCAL_ENV=1 npm run eval:answer-quality:manifests -- --check` → byte-for-byte, exit 0), G10 pass, G11 pass (`quality:check` exit 0: frontend 1559/1559, backend 583/583, test:scripts 766/766, lint 0 errors); `git diff --stat 7701a90a 0f04382a` = exactly the five named files, generator/trace scripts and committed manifests untouched; completed REQ-229 sentence matches the code. No Critical, no Important. Minor N1: the guard's exec regex misses the promisified `execFileAsync(` form (the house style) and stops at the first `)`, so the pre-fix file is caught only by its `loadGoldCases` rule; N2: REQ-229's "synthetic input" wording slightly broad (one test reads the committed manifests as data). Owner awareness: `scripts/lib/diagnostic-arms.test.mjs:301` execs `diagnostic-arms-check.mjs` over the real corpus inside `test:scripts` (the REQ-230 offline arms check, allowed to gate per goals-and-non-goals.md:83; a corpus refresh that retires a diagnostic case would turn it red) → advance to `close` | 2026-10-07 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Prepare reproducible before/after answer evaluation for PR #273, isolate retrieval and prompt-organization failures, and compare GPT-4.1 with GPT-6 Luna before selecting a product fix" | answered-once | shape | — |

## Intake

- `intake/GRAPH-BRIEF.md` — supplied as a file at launch (the owner's probe brief)
