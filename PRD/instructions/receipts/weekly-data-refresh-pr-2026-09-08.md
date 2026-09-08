# Receipt — weekly-data-refresh-pr — 2026-09-08

**What happened:** The Trade Balancer's card prices have been stuck on a
snapshot dated 5 June 2026 because refreshing them meant a person manually
running two commands, then committing and opening a pull request by hand.
Nobody had done that since June, so the prices players see when balancing a
trade were three months stale. This ships a single command,
`npm run data:refresh-pr`, that does the whole job: pull the latest Magic
data (prices, rulings, combos, rules), rebuild every artifact, and open a
pull request to `main` — skipping the pull request entirely if nothing
actually changed. Once merged, the balancer's "Prices as of `<date>`" line
moves forward automatically. Code PR:
https://github.com/ChrisMiho/TheJudge/pull/213 (open, not yet merged).

**What it means for you:** Run `npm run data:refresh-pr` locally whenever
you want fresher data — it opens a PR for you to review and merge instead of
touching `main` directly. Merge PR #213 to ship this; once merged, that
weekly command is what refreshes the Trade Balancer's prices going forward.

## Summary

- Date: 2026-09-08
- Slug: weekly-data-refresh-pr
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run
  `graph-20260908-013519`, **PR-ready path** — this receipt and the package
  deletion are committed on the code branch and ride in PR #213, before the
  owner's merge.
- Package classification: autonomous — `README.md` carries `## Autonomous
  metadata` (`Autonomous base: origin/main`), so the PR-ready path of the
  autonomous gate applies.
- PR: https://github.com/ChrisMiho/TheJudge/pull/213

## What shipped

- **Slice A — refresh-and-PR script core.** New `scripts/refresh-and-open-pr.mjs`:
  dirty-tree refusal, branch-cut off `origin/main`, pipeline runner
  (`data:refresh` before `data:build`, never runs `data:build` after a
  `data:refresh` failure), explicit 11-path `git add` list (no `-A`/`--all`),
  dated commit message, no-force push, and an injectable `gh pr create`
  wrapper that surfaces PR-creation failure distinctly. 9/9 criteria true.
- **Slice B — change-detection and no-op path.** Classifies an empty diff
  over the explicit path list as no-op (no commit/push/PR-open call, local
  branch deleted) vs. a non-empty diff as changed (commit → push → PR-open,
  each exactly once, in order). A pipeline failure blocks all three and
  leaves the local branch undeleted. 5/5 criteria true.
- **Slice C — npm script wiring.** `package.json` gains
  `scripts.data:refresh-pr` = `node scripts/refresh-and-open-pr.mjs`; no
  other script entry changed. 2/2 criteria true.
- **Slice D — promote REQ-195 into PRD/sections, together with the code.**
  New `### REQ-195` in `functional-requirements.md` after REQ-194;
  `trade-balancer/data/cardPrintingPrices.md` and `trade-balancer/README.md`
  each cite REQ-195 and document the weekly refresh-and-PR cadence (static
  snapshot / no-runtime-sync language unchanged); `system-map.md`'s
  Printing-price artifact entry names the new wrapper script and cites
  REQ-195, `Status:` line unchanged. 5/5 criteria true (D5 manual
  confirmation that script/npm names match slices A/C exactly).
- All 4 slices `STATUS: done`; 21/21 criteria true across
  `slice-{a,b,c,d}.criteria.json` (9 + 5 + 2 + 5), matching the build ledger.

## Verification

- `node --test scripts/refresh-and-open-pr.test.mjs`: 19/19 passing, run
  against injected git/gh/pipeline fakes only — no live Scryfall refresh, no
  real `data:refresh`/`data:build`/`data:refresh-pr` invocation, at build,
  review, or this cleanup.
- `npm run quality:check` (re-run fresh at this cleanup, not reused from the
  build ledger): **green**, exit 0. `typecheck`, `lint`, `format:check`,
  `coverage:check` all passed; `test:scripts` 541/541 passed (matches the
  build ledger's count exactly — no drift since build).
- Independent fresh-context review (node 7, opus, read-only): **APPROVE**.
  Confirmed no force-push, no merge into `main` (only `gh pr create --base
  main`), explicit-path `git add --` over the 11-path constant, the no-op
  path opens no PR and deletes the local-only branch, a pipeline failure
  degrades before any commit/push/PR call, and REQ-195 applied in all four
  PRD/sections locations. One Minor non-blocking note (`git checkout -` in
  `deleteLocalBranch`, outside stated requirements) — Minor never loops back
  to build.
- Independently re-confirmed at this cleanup by direct read of the live
  branch (not re-derived from the ledger's account) — see
  `## Durable truth confirmed` below.
- `gh pr view 213 --json state,baseRefName,headRefName,mergeable`: `state:
  OPEN`, `baseRefName: main`, `headRefName:
  thejudge-auto/weekly-data-refresh-pr-work`, `mergeable: MERGEABLE`. GitHub
  API was reachable; no fallback needed.

## Durable truth confirmed

Every item below was checked against the live files on
`thejudge-auto/weekly-data-refresh-pr-work` (this branch) at this cleanup —
none was rewritten here, all were applied at `build` (node 6) together with
the code:

- `PRD/sections/functional-requirements.md:4579` — `### REQ-195` heading
  present, after REQ-194.
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md:47-49` — the
  Backed-by line cites REQ-195; the weekly one-command refresh-and-PR cadence
  is documented; the static-snapshot / no-runtime-sync statement is intact.
- `PRD/sections/trade-balancer/README.md:92-93` — the Backed-by line cites
  REQ-195; the prices bullet documents the weekly refresh-and-PR cadence
  (`npm run data:refresh-pr`, opens a PR to `main`).
- `PRD/sections/system-map.md:451-453` — the Printing-price artifact entry
  names `scripts/refresh-and-open-pr.mjs` (wired as `npm run
  data:refresh-pr`) beside `build-card-prices.mjs`; Backed-by line adds
  REQ-195 alongside DEC-088, REQ-066, NFR-013; `Status:` line unchanged.

Nothing was found missing. No promotion was needed at this cleanup — every
outcome the build half applied is present as recorded.

## Autonomous gate: PR-ready path (pre-merge checks)

- **Checkout/branch:** current checkout is
  `.worktrees/implement-weekly-data-refresh-pr` with
  `thejudge-auto/weekly-data-refresh-pr-work` checked out. After `git fetch
  origin`, this branch's `HEAD` (`3cde68d`) equals
  `origin/thejudge-auto/weekly-data-refresh-pr-work` exactly — nothing
  unpushed, nothing unfetched. `git status --porcelain`: empty (clean).
- **Implementation PR:** #213 is **OPEN**, head
  `thejudge-auto/weekly-data-refresh-pr-work`, base `main` — the recorded
  autonomous base — verified via `gh pr view 213
  --json state,baseRefName,headRefName,mergeable`. GitHub API reachable; no
  fallback used.
- **Ship-ready with criteria:** `README.md` carries `status: active` with all
  four slices `done`; `STATUS.ship-ready` marker present; every criterion in
  every `slice-{a,b,c,d}.criteria.json` read directly and confirmed `true`
  (21/21).
- **Runtime cleanup:** this package is script-only — no application UI, no
  server, no browser session started by any slice (confirmed by grep across
  the slice docs and criteria files for playwright/browser/port/process
  terms: no hits beyond ordinary Node.js `process.argv`/`child_process`
  usage). No `PRD/instructions/runtime-process-hygiene.md` criteria were
  recorded for this package, so none apply.

All four checks pass. No worktree and no branch removed on this path — the
owner's `npm run graph:prune -- --apply` lists this worktree and both
branches as merged leftovers once PR #213 lands.

Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/213

## Actions taken

- Wrote this receipt (before any delete).
- Confirmed durable `PRD/sections/` truth present (no rewrite — see
  `## Durable truth confirmed`).
- Removed the `weekly-data-refresh-pr` row from `PRD/work/STATUS.md`
  (`## ship-ready` section).
- Deleted the work package: `git rm -r PRD/work/weekly-data-refresh-pr/`.
- Re-ran `npm run quality:check`: green (see `## Verification`).
- Did **not** merge or close PR #213, did **not** push to `main`, and did
  **not** delete any remote branch. Committed on
  `thejudge-auto/weekly-data-refresh-pr-work` and pushed that branch (never
  `main`).

## Files

- Created: `PRD/instructions/receipts/weekly-data-refresh-pr-2026-09-08.md`
  (this receipt)
- Updated: `PRD/work/STATUS.md` (`## ship-ready` row removed)
- Deleted: `PRD/work/weekly-data-refresh-pr/` (entire package, including
  `GRAPH-RUN.md`, `GATE-QUESTIONS.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`,
  `IDEA.md`, `README.md`, `STATUS.ship-ready`, `intake/GRAPH-BRIEF.md`, four
  `slice-*.md` docs, and four `slice-*.criteria.json` files)

## Graph run

- Run ID: `graph-20260907-163826` (spec-forming half) /
  `graph-20260908-013519` (build half) | Profile: `loaded (env sentinel)` |
  Terminal state: COMPLETE — land: the owner's merge of
  https://github.com/ChrisMiho/TheJudge/pull/213

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | degraded (no run state) | branch `thejudge-auto/weekly-data-refresh-pr` cut from `origin/main` (b20ea13), pushed from `.worktrees/kickoff-weekly-data-refresh-pr`; lock held (runId graph-20260907-163826, pid 10773); launch checkout untouched | 2026-09-07 |
| 2 | shape | sonnet | ok | degraded (no run state) | `PRD/work/weekly-data-refresh-pr/` created (STATUS.ideation) with IDEA.md, intake/GRAPH-BRIEF.md verbatim, 3 prior-run matches; committed 0b59ec5 and pushed; launch checkout untouched | 2026-09-07 |
| 3 | define | opus | ok | `0 → 31` | DESIGN-BRIEF.md + GATE-QUESTIONS.md written (1 proposed id REQ-195; full-refresh chosen via assumption ladder, flip-to-prices-only left as owner edit); STATUS.refined; PRD/sections untouched; no blocker | 2026-09-07 |
| 4 | gate-qc | sonnet | ok | `0 → 19` | PASS — DESIGN-BRIEF verified against PRD truth (DEC-087/088/162, REQ-066/093/145, NFR-013) and all four proposed diffs matched current-state byte-for-byte; no drift; STATUS stays refined for build | 2026-09-07 |
| GR | gate-review (build half, run graph-20260908-013519) | sonnet | ok | `0 → 14` | REQ-195 accept applied (accept changes no diff); `## Gate verdicts` (1 id, 0 blockers) and resolved `## Open gate` (dated 2026-09-08, docs PR #209 merged) written; STATUS.refined restored (marker, README, PRD/work/STATUS.md board row) | 2026-09-08 |
| 4B | gate-qc (build half, run graph-20260908-013519) | sonnet | ok (PASS) | `0 → 16` | re-grade of the gate-finalized proposal, no fan-out (14 calls). REQ-195's three proposed diffs match current PRD/sections byte-for-byte (trade-balancer/data/cardPrintingPrices.md, trade-balancer/README.md, system-map.md); functional-requirements append target after REQ-194 exists, REQ-195 not already defined; cited ids (DEC-087/088/162, REQ-066/093/145, NFR-013) all match; `data:refresh`→`data:build` pipeline + build-card-prices.mjs real; new script/npm name not yet present; buildable without a live user. Findings none. STATUS unchanged (refined) | 2026-09-08 |
| 5 | plan (build half, run graph-20260908-013519) | sonnet | ok | `0 → 39` | thejudge-map-out wrote GAMEPLAN.md + 4 slice docs (A refresh-and-PR script core; B change-detection/no-op path; C npm `data:refresh-pr` wiring; D promote REQ-195 to PRD/sections with the code) with slice-{a,b,c,d}.criteria.json (9/5/2/5 = 21 criteria, valid JSON). Verification uses injected git/gh/pipeline fakes — no slice runs the real Scryfall refresh (REQ-093/DEC-162, denied under the graph lock). STATUS.active; README slice table + implementation map; board row moved to active | 2026-09-08 |
| 6 | build (build half, run graph-20260908-013519) | sonnet | ok | `0 → 122` | thejudge-implement-all built A→B→C→D, 21/21 criteria true. New `scripts/refresh-and-open-pr.mjs` (injectable-effects: dirty-tree refusal, branch off origin/main, pipeline runner, 11-path explicit artifact staging, dated commit, no-force push, gh pr create wrapper) + no-op/change-detection + graceful pipeline-fail; npm `data:refresh-pr` wired. Tests against injected fakes only: refresh-and-open-pr.test.mjs 19/19, quality:check 541/541 — never ran the live Scryfall refresh. REQ-195 applied to PRD/sections (functional-requirements append + trade-balancer/data/cardPrintingPrices.md + trade-balancer/README.md + system-map.md). Code PR #213 opened. STATUS.ship-ready. Return-side assertion: launch checkout byte-identical before/after, worktree clean/synced | 2026-09-08 |
| 7 | review (build half, run graph-20260908-013519) | opus | ok (APPROVE) | `0 → 17` | fresh-context no-write reviewer (Plan agent, no Edit/Write) graded PR #213 against each slice's acceptance criteria; 21/21 satisfied. Ran refresh-and-open-pr.test.mjs 19/19 over injected fakes (never the live pipeline/git/gh/Scryfall). Confirmed: no force-push, no merge into main (only gh pr create --base main), explicit-path `git add --` over the 11-path constant, no-op path opens no PR + deletes the local-only branch, pipeline failure degrades before any commit/push/PR; REQ-195 applied in all four PRD/sections locations. One Minor non-blocking note (`git checkout -` in deleteLocalBranch, outside stated requirements). Verdict: proceed to close | 2026-09-08 |
| 8 | close (build half, run graph-20260908-013519) | sonnet | ok | `0 → 26` | thejudge-cleanup on the PR-ready path: folded this run's Node + Instruction ledgers verbatim into `## Graph run`; re-ran quality:check fresh (541/541); confirmed REQ-195 present in all four PRD/sections locations (nothing to promote); wrote the `Terminal state: COMPLETE` line + `- PR:` link + `## Intake`; `git rm -r` the 16-file package; removed the ship-ready row from PRD/work/STATUS.md; committed `2a89c78` and pushed on `thejudge-auto/weekly-data-refresh-pr-work`; PR #213 left open + mergeable | 2026-09-08 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh | answered-once | shape | — |
| A weekly one-command local script: refresh the data, cut a branch off origin/main, commit, push, open a PR you merge. Reuses the existing data:refresh pipeline; no runtime sync. Open choice for refinement: full refresh vs prices-only (I recommend full to start). | answered-once | define | — |

## Intake

- `intake/GRAPH-BRIEF.md` — origin: staged verbatim from
  `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260907-163826/`
  at node 2 (`shape`), per `GRAPH-RUN.md`'s ledger row for that node.
