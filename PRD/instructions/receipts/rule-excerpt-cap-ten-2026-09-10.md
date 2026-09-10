# Receipt — rule-excerpt-cap-ten

**What happened:** Ask AI now attaches up to ten official Comprehensive Rules
excerpts to its answers instead of five, so the deciding rule reaches the
model on hard questions where it previously fell just outside the top five.
Measured on the deployed model (gpt-4.1): 16/18 → 18/18 correct answers on the
worked-solution gold set, retrieval recall 89.7% → 94.2%, no added latency.

**What it means for you:** merge PR #231 into `main` to ship it. Code, tests,
and the product-truth docs are already reconciled on the branch — nothing
else to do.

- Date: 2026-09-10
- Slug: `rule-excerpt-cap-ten`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/231

## Actions taken

1. Confirmed durable truth: `build` (node 6) applied all 14 `GATE-QUESTIONS.md`
   blocks to 7 `PRD/sections/` files by intent, and `review` (node 7)
   independently verified every hunk. Nothing was re-written here — cleanup
   promotes only a leftover `build` left unapplied, and there was none.
2. Left one known leftover untouched: the retired row
   `PRD/sections/decisions.md:73` (DEC-032) still reads "up to 5 supplemental
   WotC Comprehensive Rules excerpts." It sits outside the 14 gate blocks the
   owner approved, so it is not edited here — flagged for the owner below.
3. Checked `PRD/sections/system-map.md` for a `planned`/`partial` marker to
   flip to `shipped`: none exists. The 14 gate blocks already rewrote the
   three System 3 entries (retrieval, relevance report, eval instrument) to
   say "ten" as current, shipped reality, so there is nothing to promote and
   no new marker to add.
4. Removed `rule-excerpt-cap-ten` from `PRD/work/STATUS.md` (the `ship-ready`
   section — no other section listed it).
5. Deleted `PRD/work/rule-excerpt-cap-ten/` with `git rm -r`.
6. Ran `npm run quality:check` green before the delete commit.

## Files created / updated / deleted

**Created**
- `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` (this file)

**Updated**
- `PRD/work/STATUS.md` — `rule-excerpt-cap-ten` row removed from `## ship-ready`

**Deleted** (`git rm -r PRD/work/rule-excerpt-cap-ten/`)
- `README.md`, `IDEA.md`, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`,
  `GRAPH-RUN.md`, `GAMEPLAN.md`, `STATUS.ship-ready`
- `slice-a-deploy-ten-excerpt-cap.md`, `slice-a.criteria.json`
- `slice-b-eval-instrument-and-recall-harness.md`, `slice-b.criteria.json`
- `intake/GRAPH-BRIEF.md`

**Shipped in PR #231** (code + product truth, already on `main`-bound branch
`thejudge-auto/rule-excerpt-cap-ten-work`, recorded here since the package's
own implementation map is deleted with the folder)
- `apps/backend/src/prompt/preparation.ts` — `DEFAULT_SUPPLEMENTAL_RULE_CAP` 5 → 10
- `apps/backend/src/prompt/preparation.test.ts` — cap assertions moved with it
- `scripts/eval-answer-quality.mjs` — `DEFAULT_EXCERPT_CAPS` → `[10, 15]`
- `apps/backend/src/eval/contextEvaluationHarness.ts`,
  `scripts/retrieval-relevance-report.mjs`, `relevanceReport.test.ts`, eval
  fixtures README — recall-check wording top-5 → top-10
- 9 golden prompt fixtures regenerated (additive: excerpts 6–10 appended,
  first five byte-identical)
- `PRD/sections/functional-requirements.md` (REQ-022, REQ-032, REQ-178,
  REQ-181, REQ-182, REQ-185, REQ-188, REQ-190),
  `PRD/sections/non-functional-requirements.md` (NFR-018),
  `PRD/sections/system-map.md`, `PRD/sections/integrations-and-data.md`,
  `PRD/sections/in-depth/README.md`, `PRD/sections/quick-lookup/README.md`,
  `PRD/sections/system-map/game-rules-retrieval.md` — all 14 finalized
  `GATE-QUESTIONS.md` blocks applied

## Verification results

- Build (node 6): `npm run quality:check` PASS (575/575 script tests, plus
  frontend/backend legs); `npm run test:eval` PASS, 9/9 fixtures scored 100%
  at excerpt cap 10. The brief's recorded risk — a forbidden rule already
  ranking 6–10 in an existing eval fixture, which would fail `test:eval` — did
  **not** materialize: no fixture was edited and no check was relaxed to get
  a clean pass.
- Review (node 7): independently re-ran `npm run quality:check` — exit 0
  (frontend 1337, backend 504, scripts 575/575) — and `npm run test:eval` —
  9/9 fixtures, same scores as the build evidence log, with the fixtures diff
  limited to the 9 regenerated goldens plus the README. APPROVED, no Critical
  or Important findings. One Minor note: the retired `DEC-032` row (see
  Actions taken, item 2) and that rule 205.3m is one large appended excerpt —
  a consequence of the accepted decision, not a defect.
- This node (close): re-ran `npm run quality:check` before the delete commit
  — exit 0, 575/575 script tests, no failures.

## Graph run

- Run ID: `graph-20260910-024919` | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/231

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | `npm run graph:preflight -- --branch thejudge-auto/rule-excerpt-cap-ten --slug rule-excerpt-cap-ten --run-id graph-20260910-024919 --pid 66381` exit 0; shape root; branch `thejudge-auto/rule-excerpt-cap-ten` pushed from `.worktrees/kickoff-rule-excerpt-cap-ten` (remote at 7460cf8); lock `{slug rule-excerpt-cap-ten, runId graph-20260910-024919, pid 66381}`; both canaries denied (universal `rm -rf`, graph-tier `nohup`); profile loaded (env sentinel); launch checkout stayed on `main` | 2026-09-10 |
| 2 | shape | sonnet | ok | `0 → 26` | commit `46fa1cf` on run branch (pushed) — `PRD/work/rule-excerpt-cap-ten/{IDEA.md,README.md,STATUS.ideation,intake/GRAPH-BRIEF.md}` + `PRD/work/STATUS.md` ideation row; README carries `## Autonomous metadata`; intake copied verbatim (diff identical) and staging deleted; 9 `## Prior run` matches recorded in IDEA.md; worktree `git status --porcelain` empty | 2026-09-10 |
| 3 | define | opus | ok | `0 → 55` | commit `06b6699` on run branch (pushed) — DESIGN-BRIEF.md + GATE-QUESTIONS.md (14 stable-ID slots: REQ-022/032/178/181/182/185/188/190, NFR-018, system-map.md, integrations-and-data.md, in-depth/README.md, quick-lookup/README.md, system-map/game-rules-retrieval.md; no new REQ or DEC); amendment set enumerated by wide grep (266 hits: 32 amended, 234 "not this cap" with a row each in the brief appendix); 33 before-text lines verified byte-identical by script; no blocker questions; STATUS.ideation→refined; board row moved; `git diff --stat origin/main -- PRD/sections` empty | 2026-09-10 |
| 4 | gate-qc | sonnet | failed | `0 → 32` | FAIL commits `82356d7` + `156940f` — STATUS.refined→refining, board row moved. One finding: the brief's amendment-set appendix mislabels 8 of 266 "not this cap" rows as the REQ-094/095 combo-variant cap when the line is a layout/attach-limit/deploy/section-order cap (`screen-layout.md:132`, `functional-requirements.md:2211/3107/3379/3881/4442`, `decisions/deployment.md:31`, `in-depth/README.md:302`); the "not this cap" conclusion holds for all 8, the stated reason is wrong. Everything else clean: 266-hit grep reproduced, 0 missing/0 extra rows, 32 amend rows = 32 diff hunks, all 32 before-lines byte-identical (`ALL OK`), 14 slots well-formed, no new DEC, PRD/sections unedited. Loop 1 → define | 2026-09-10 |
| 3 | define | opus | ok | `0 → 25` | attempt 2 (loop 1 fix). Commit `0056266` on run branch (pushed) — appendix disposition reasons re-read line by line against the cited `PRD/sections/` text: 59 reasons corrected (the 8 flagged + 51 more the same pass found), every one still "not this cap"; only column 3 of non-amend rows moved, all 32 amend rows byte-identical, GATE-QUESTIONS.md zero diff, `git diff --stat origin/main -- PRD/sections` empty; STATUS.refining→refined, README header refined, board row moved back | 2026-09-10 |
| 4 | gate-qc | sonnet | ok | `0 → 22` | attempt 2 PASS, no findings, no commit. Reviewer re-ran the wide grep (266 hits = appendix count) plus named-spelling and extra sweeps (`supplementalRuleCap`, bare `\b5\b`, `6–15`, `maxExcerpts`) — no System 3 cap line without a slot; 32 before-text lines script-extracted and byte-compared, 0 mismatches; "not this cap" reasons spot-checked against cited text (combo-variant, REQ-167 attach, retired DEC-032, recall@5 metric rows) all correct; 14 slots parsed well-formed; `git diff cf55225 0056266 -- GATE-QUESTIONS.md` empty; `git diff --stat origin/main -- PRD/sections` empty; no new DEC/REQ. STATUS stays refined. Run stops here: driver commit `28da373` (README gate PASS + `## Open gate`, STATUS.refined→owner-action, board row refined→owner-action), docs PR https://github.com/ChrisMiho/TheJudge/pull/230 opened `thejudge-auto/rule-excerpt-cap-ten` → `main` | 2026-09-10 |
| — | claim | driver | ok | `driver-bookkeeping` | build half claimed after docs PR #230 merged at `c28820b`: kickoff worktree clean and removed (`git worktree remove`), `git worktree add .worktrees/implement-rule-excerpt-cap-ten -b thejudge-auto/rule-excerpt-cap-ten-work origin/main`, lock retaken (`graph-preflight --take-lock`, pid 66381), both canaries denied; claim commit `dc5b129` (README base → `origin/main`, ledger header) pushed; marker left at `owner-action` | 2026-09-10 |
| — | gate-review | sonnet | ok | `0 → 24` | commit `2426986` on `thejudge-auto/rule-excerpt-cap-ten-work` (pushed) — 14/14 verdicts `accept` (0 edit, 0 reject) applied inside `GATE-QUESTIONS.md` (no diff changed); brief reconciliation `none`; `## Gate verdicts` + `## Open gate` resolved line written; STATUS.owner-action→refined, README `status: refined`, board row owner-action→refined; `git status --porcelain` empty; `git diff --stat origin/main -- PRD/sections` empty | 2026-09-10 |
| 4 | gate-qc | sonnet | ok | `0 → 25` | attempt 3 (build-half re-grade) PASS, no findings, no commit. 266-hit grep reproduced on the build branch (32 amend rows = 14 slots, 234 not-this-cap rows, 0 undisposed); 32 before-text lines byte-identical to `PRD/sections/` (`grep -rFc`, 0 mismatches); 14 blocks well-formed with `- Verdict: accept`; no new DEC; `git diff --stat origin/main -- PRD/sections` empty; brief build-ready (constant flip + tests + `--excerpt-cap` default, no live call). STATUS stays refined; driver rewrote README `## Preparation gate` | 2026-09-10 |
| 5 | plan | sonnet | ok | `0 → 49` | commit `d2e4114` on `thejudge-auto/rule-excerpt-cap-ten-work` (pushed) — `GAMEPLAN.md`, `slice-a-deploy-ten-excerpt-cap.md` + `slice-a.criteria.json` (4 criteria, all `false`), `slice-b-eval-instrument-and-recall-harness.md` + `slice-b.criteria.json` (5 criteria, all `false`; B depends on A), README slice table + implementation map + `status: active`, STATUS.refined→active, board row refined→active; README `## Preparation gate` line verified PASS by the node before writing; `git status --porcelain` empty | 2026-09-10 |
| 6 | build | sonnet | ok | `0 → 182` | commits `965b1da` (slice A) + `4b1267e` (slice B) on `thejudge-auto/rule-excerpt-cap-ten-work` (pushed, remote tip `4b1267e`); code PR https://github.com/ChrisMiho/TheJudge/pull/231 opened `thejudge-auto/rule-excerpt-cap-ten-work` → `main` (OPEN, not draft). `DEFAULT_SUPPLEMENTAL_RULE_CAP` 5→10 + `preparation.test.ts`; `DEFAULT_EXCERPT_CAPS` → `[10, 15]`; recall-harness wording top-5→top-10 (`contextEvaluationHarness.ts`, `retrieval-relevance-report.mjs`, `relevanceReport.test.ts`, fixtures README); 9 golden prompt fixtures regenerated (additive); all 14 `GATE-QUESTIONS.md` blocks applied to 7 `PRD/sections/` files. `npm run quality:check` PASS (575/575 script tests); `npm run test:eval` PASS, 9/9 fixtures 100% at cap 10 — the brief's forbidden-rule-at-rank-6–10 risk did not materialize, no fixture edited, no check relaxed. Criteria 9/9 `true` (self-reported evidence; known hook-evidence gap, review is the integrity gate). STATUS.active→ship-ready, board row active→ship-ready. Return-side: launch checkout `git status --porcelain` empty before and after, on `main`; every changed path under `.worktrees/implement-rule-excerpt-cap-ten/` (32 files, `git diff --stat origin/main`) | 2026-09-10 |
| 7 | review | opus | ok | `0 → 25` | APPROVED, no commit (no-write reviewer). 9/9 criteria met with commands: A1 constant `10` at `preparation.ts:52` read at 4 call sites; A2 ranking proof runs default-10 vs explicit 15 on the real rule index (`fifteenIds.slice(0,10) === tenIds`, tail = `runnerUp`), and `gameRulesRetrieval.ts:832` computes `runnerUp` relative to the cap; A3/B3 all 14 blocks (30 hunks) applied verbatim, negative grep over before-text leaves only intentional survivors (REQ-094/095 combo cap, `recall@5` metric names, dated history), no `PRD/sections/` line outside the blocks changed; B1 `[10, 15]`; B2 six sites top-5→top-10, zero residual; B4 reviewer re-ran `npm run test:eval` (9/9 fixtures, same scores as the evidence log), fixtures diff = 9 goldens + README only; A4/B5 reviewer re-ran `npm run quality:check` exit 0 (frontend 1337, backend 504, scripts 575/575). Goldens additive: pure insertions, first five byte-identical (99+/2−, the 2 deletions are README wording). Critical none; Important none; Minor: retired `decisions.md:73` (DEC-032) still says five (outside the 14 blocks); rule 205.3m is one large appended excerpt (consequence of the accepted decision) | 2026-09-10 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "lets increase the cap to 10" | answered-once | shape | — |
| "Raise the deployed System 3 rule-excerpt cap from 5 to 10" | answered-once | shape | — |

## Intake

- `intake/GRAPH-BRIEF.md` — staged by `graph-kickoff` from the launch request: "Self-contained intake for `graph-kickoff`" (file header, `GRAPH-BRIEF.md:3`)
