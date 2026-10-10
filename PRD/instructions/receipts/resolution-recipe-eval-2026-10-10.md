# Receipt — resolution-recipe-eval — 2026-10-10

**What happened:** The owner wanted to know whether a reorganized prompt, one
that walks the model through layers and timing before it answers, helps GPT-6
Luna judge hard interactions better than today's production prompt. This
builds the measuring tool for that and nothing else. Players see no change.
It adds an eval-only prompt variant called arm R, a set of 18 hard cases
graded strictly in both Quick Lookup and In-Depth, a compare report, and a
runbook for the paid run. A dry run estimates the paid run at about $3.59.
Code PR: https://github.com/ChrisMiho/TheJudge/pull/285 (open, not yet merged).

**What it means for you:** Merge PR #285. Then run the paid comparison
yourself from `docs/eval/resolution-recipe/RUNBOOK.md`, keeping every live run
at `--max-cost-usd` 15 or less. The ship / don't ship / test more verdict
goes in `docs/eval/resolution-recipe/REPORT.md` after that run. Changing the
production prompt stays a separate decision you make after reading it.

## Summary

- Date: 2026-10-10
- Slug: resolution-recipe-eval
- Status: **shipped**
- PR: https://github.com/ChrisMiho/TheJudge/pull/285 (open, `thejudge-auto/resolution-recipe-eval-work` -> `main`)
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run `graph-20261010-200917`, PR-ready path. This receipt and the package deletion ride in PR #285, before the owner's merge.
- Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/285

## Actions taken

- PR-ready checks, in order: (1) branch `thejudge-auto/resolution-recipe-eval-work`, HEAD `9eeab833` equal to `origin/thejudge-auto/resolution-recipe-eval-work` after fetch; (2) PR #285 open, head that branch, base `main`; (3) `STATUS.ship-ready` present, 45/45 criteria `true` across slice A 8, B 6, C 5, D 5, E 6, F 8, G 7, read from the files; (4) runtime-cleanup criteria: none, the package ran no dev server or browser.
- Durable truth confirmed present, none promoted: REQ-230, REQ-228, REQ-187, REQ-224, REQ-185 in `PRD/sections/functional-requirements.md`.
- `PRD/sections/system-map.md`: no flip. The package is eval-only and has no system-map entry.
- Board row stripped from `PRD/work/STATUS.md`; `PRD/work/resolution-recipe-eval/` deleted with `git rm -r`. No worktree and no branch removed.

## Files

Created or updated by the build (from `git diff --name-only origin/main...HEAD`, excluding the deleted work folder):

- `PRD/sections/functional-requirements.md`
- `apps/backend/src/eval/answer-quality/`: `arm-r-recipe.json`, `artifact.test.ts`, `coverage.json`, `judge.test.ts`, `manifests/diagnostic.json`, `rubric.test.ts`, `rubric.ts`
- `apps/backend/src/eval/rules-gate/`: `baseline.json`, `frozen-query-vectors.json`, `rulesGate.test.ts`, `stateFacts.ts`
- `apps/backend/src/eval/worked-solutions/`: `README.md` and 16 `.case.json` files (layers, replacement, triggers, necropotence, academy-manufactor cases, Quick Lookup and In-Depth pairs)
- `docs/eval/resolution-recipe/RUNBOOK.md`
- `scripts/`: `build-answer-quality-manifests.mjs` (+ test), `diagnostic-arms-check.mjs`, `eval-answer-compare.mjs`, `eval-answer-quality.mjs` (+ test), `lib/answer-compare.mjs` (+ test), `lib/diagnostic-arms.mjs` (+ test), `lib/experiment-run.mjs` (+ test)

Deleted: `PRD/work/resolution-recipe-eval/` (whole folder). Edited: `PRD/work/STATUS.md`. Created: this receipt.

## Verification

Review (node 11) approved with 0 Critical, 0 Important, 4 Minor. It re-ran `npm run test:scripts` (785 pass), the backend eval tests (135 pass), `npm run typecheck`, `node scripts/diagnostic-arms-check.mjs` (62 cases, 0 problems), the manifests check (exit 0), a dry run costed at $2.56 with no `--confirm-live-calls`, and `npm run quality:check` (exit 0).

## Follow-ups

Review's four Minor findings, none blocking:

1. `scripts/eval-answer-compare.mjs:92`: the saved compare file name ignores arm and repeats, so RUNBOOK Step 4's four `rr-hard rr-hard` compares overwrite one saved file. Printed output is correct.
2. `apps/backend/src/eval/rules-gate/stateFacts.ts:145-153`: matching is any-block, not one-to-one pairing.
3. `scripts/lib/diagnostic-arms.test.mjs:319`: the test title names arm R but the body has no R assertion.
4. `scripts/lib/answer-compare.mjs:384`: the noise-floor label can mislead on overlapping repeat selections.

After the merge, per the runbook: the owner launches the paid run, then `docs/eval/resolution-recipe/REPORT.md` is written from it.

## Graph run

- Run ID: `graph-20261010-200917` (spec-forming half `graph-20261010-183425`; build half `graph-20261010-200144`) | Profile: `unverified` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/285

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | branch `thejudge-auto/resolution-recipe-eval` pushed from `.worktrees/kickoff-resolution-recipe-eval` at `dabad406` (`git ls-remote --heads origin thejudge-auto/resolution-recipe-eval`); lock `.worktrees/.graph-run.lock` pid 81708; launch checkout untouched (porcelain unchanged, still on `main`) | 2026-10-10 |
| 2 | shape | sonnet | ok | `0 → 13` | `PRD/work/resolution-recipe-eval/` (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md byte-identical to the staged copy, `cmp` clean); commit `96eb39d4`; 3 prior-run receipts in IDEA.md; node removed the staged copy after committing it (the committed `intake/` copy is the record) | 2026-10-10 |
| 3 | define | opus | ok | `0 → 118` | `PRD/work/resolution-recipe-eval/DESIGN-BRIEF.md`, `PRD/work/resolution-recipe-eval/GATE-QUESTIONS.md` (5 stable-ID slots REQ-230, REQ-228, REQ-187, REQ-224, REQ-185 + blocker slots G1, G2, G3-01..G3-16, G4, G5→REQ-187), `STATUS.refined`; commit `a9daa27f`; 104-hit line-level grep with dispositions in the brief (10 amend / 20 build / 74 keep); `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs` empty; dry-run anchor $0.0117 per graded answer (gitignored `output/` only); driver spot-checked the nine reference outcomes against CR 613.4b/c, 613.8, 707.2, 603.3b, 616.1 | 2026-10-10 |
| 4 | gate-qc | sonnet | failed | `0 → 44` | FAIL attempt 1 — `PRD/work/resolution-recipe-eval/QUALITY-CHECK.md`, commit `532b7129`, `STATUS.refining`; F1 blocking (cost anchor and reasoning-token figures cite no command or output), F2 blocking (Serra Angel not found — driver re-check: present as oracle `4b7ac066-e5c7-43e6-9e7e-2739b24a905d` via `apps/frontend/public/data/cardMetadata.json` cardId, so F2 reduces to F3), F3–F5 minor; diffs 33/33 lines match, grep 104/104 dispositioned, 16/16 references correct; loop 1 of 3 back to define | 2026-10-10 |
| 5 | define | opus | ok | `0 → 93` | attempt 2 (gate-qc loop 1): commit `a5f98eec`; F1 dry-run command lines + `evidence/cost-anchor-dry-runs.txt` (re-run, same totals; no `--confirm-live-calls`), Luna figures sourced to backup `calls.jsonl` fields via `evidence/luna-token-stats.mjs` (two figures corrected: tier-3 judge $0.0064, hard-case median 13.1 s); F2/F3 oracle ids in all 16 G3 slots via `evidence/resolve-g3-cards.mjs` → `evidence/g3-card-ids.txt` (22 cards, 1 id each; Grizzly Bears resolved via `cardScanMap.json` because vanilla cards are absent from `cardMetadata.json`); F4 cross-ref fixed; F5 REQ-230/REQ-224 wording count-free + per-slot recommendations; diffs 33/33 lines still match; grep 104/104; `STATUS.refined`; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs` empty | 2026-10-10 |
| 6 | gate-qc | sonnet | ok | `0 → 17` | PASS attempt 2, findings none — `PRD/work/resolution-recipe-eval/QUALITY-CHECK.md`, commit `efda9238`; F1–F5 resolved; 33/33 diff lines match; grep 104/104; 24 verdict slots blank; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs` empty; README `## Preparation gate` PASS written by the driver; parked `owner-action`; docs PR https://github.com/ChrisMiho/TheJudge/pull/283 | 2026-10-10 |
| 7 | gate-review | sonnet | ok | `0 → 15` | build half run `graph-20261010-200144`: claim commit `a1683a9d` on `thejudge-auto/resolution-recipe-eval-work` cut from `origin/main` `bcef4543` (kickoff worktree removed clean); `graph-gate-review` commit `2e4720cd`: 24 accept / 0 edit / 0 reject, brief reconciliation none, `## Gate verdicts` written, `## Open gate` resolved; `STATUS.refined` only marker; board row under refined; worktree porcelain empty | 2026-10-10 |
| 8 | gate-qc | sonnet | ok | `0 → 18` | PASS build-half re-grade, findings none — `PRD/work/resolution-recipe-eval/QUALITY-CHECK.md`, commit `831c0ee7`; 33/33 diff lines match at `bcef4543`; grep 104/104; 24/24 accept; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; README `## Preparation gate` PASS written by the driver | 2026-10-10 |
| 9 | plan | sonnet | ok | `0 → 35` | commit `edf9e904` — `GAMEPLAN.md` + 7 slices with criteria files (A arm R 8; B manifests 6; C compare report 5; D game fidelity 5; E strict grading 6; F hard cases 8, manual F8; G runbook + ship 7, manual G7), all criteria `false`; Preparation gate PASS verified first; `STATUS.active` only marker; board row under active; runbook at `docs/eval/resolution-recipe/RUNBOOK.md`, no deliverable inside `PRD/work/`; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree porcelain empty | 2026-10-10 |
| 10 | build | sonnet | ok | `0 → 292` | run `graph-20261010-200917`; code PR https://github.com/ChrisMiho/TheJudge/pull/285 (open, `thejudge-auto/resolution-recipe-eval-work → main`); slice commits A `a4db3115`, B `73dfc317`, C `99ff78f6`, D `dd5fca3a`, E `96691614`, F `46f4fc7a`, G `e1467adb`; 45/45 criteria `true` (self-reported: the hook reads criteria from the launch checkout, which holds no slice criteria files, so no evidence was logged — review re-verifies); `STATUS.ship-ready` only marker; builder reports `npm run quality:check` exit 0 on `e1467adb`; return-side checks: launch `git status --porcelain` identical before/after (`diff` clean), `classifyBuildWrites` over `git diff --name-only origin/main...HEAD` (62 files) → ok, 0 outside; `git diff --stat origin/main -- apps/backend/src/prompt apps/backend/src/routes apps/backend/src/providers` empty; no `--confirm-live-calls`; deviation (mechanics, not denied): Bash heredocs used for edits in slices A and C; out-of-repo scratch only (session scratchpad, one `/tmp/qc.txt`) | 2026-10-10 |
| 11 | review | opus | ok | `0 → 57` | APPROVE, 45/45 criteria re-verified independently, 0 Critical / 0 Important / 4 Minor; no-write `Plan`-type subagent at head `ae2c6395`; re-ran `npm run test:scripts` (785 pass), `npm --workspace apps/backend run test -- src/eval` (135 pass), `npm run typecheck`, `node scripts/diagnostic-arms-check.mjs` (62 cases, 0 problems), `npm run eval:answer-quality:manifests -- --check` (exit 0), F6 dry run `rr-hard-review-dry` (216 answer + 216 judge calls, $2.56, no `--confirm-live-calls`), `npm run quality:check` (exit 0); F8 scripted over all 16 cases, 0 differences; FR edits checked line by line against the five accepted blocks; worktree porcelain empty after. Minor: (1) `scripts/eval-answer-compare.mjs:92` saved compare file name ignores arm and repeats, so RUNBOOK Step 4's four `rr-hard rr-hard` compares overwrite one saved file (printed output correct); (2) `apps/backend/src/eval/rules-gate/stateFacts.ts:145-153` any-block match, not one-to-one pairing; (3) `scripts/lib/diagnostic-arms.test.mjs:319` title names R but body has no R assertion; (4) `scripts/lib/answer-compare.mjs:384` noise-floor label on overlapping repeat selections. Driver then posted the missing `thejudge-auto:v1:registered:resolution-recipe-eval` comment (https://github.com/ChrisMiho/TheJudge/pull/285#issuecomment-6102029388) and set the title to `[THEJUDGE-AUTO][READY]` | 2026-10-10 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Measure whether a reorganized prompt (the resolution recipe) helps GPT-6 Luna judge hard interactions better than today's production prompt, in both Quick Lookup and In-Depth, using the answer-quality harness" | answered-once | shape | — |
| "Luna does the mapping. Code never tags cards with layers" (owner decision, 2026-10-10) | answered-once | define | — |
| "Measure first. This package is an eval-only comparison" and must amend REQ-230 rather than invent a parallel mechanism | answered-once | define | — |
| "whether the player sees the full step list or only the conclusion and key reasons" — raised at the define gate as G1, not decided by the run | answered-once | define | — |
| "Each needs a reference answer I approve; grade strictly" — raised at the define gate as G3/G5, not decided by the run | answered-once | define | — |
| "Every live run must pass --max-cost-usd <= 15" | answered-once | define | — |
| "Accept all recommended" (owner's answer to all 24 GATE-QUESTIONS.md slots, given in session 2026-10-10; filled by the driver at the owner's request) | answered-once | define | — |
| "can you merge and drive for me" (2026-10-10; owner then merged #282 and #283 with `!`, the driver builds) | answered-once | gate-review | — |
| "before implementation though, can we start a fresh session?" (2026-10-10) | answered-once | build | — |

## Intake

- `intake/GRAPH-BRIEF.md` — the owner's graph-run brief, supplied as a staged file and committed into the package at shape (node 2)
