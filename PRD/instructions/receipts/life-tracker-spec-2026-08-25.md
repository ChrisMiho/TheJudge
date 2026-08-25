# Receipt — life-tracker-spec

- **Date:** 2026-08-25
- **Slug:** `life-tracker-spec`
- **Status:** shipped
- **Type:** documentation only — the DEC-168 current-state feature-spec layer's
  first instance. No `apps/` code, no `POST /api/ask-ai` change, no UI
  behavior change, and no shipped Player Life Tracker behavior change.

## Actions taken

- [x] Slice A — wrote `PRD/sections/life-tracker/README.md` (167 lines) on
      the DEC-168 template: `Status:`, `Backed by:` (16 IDs), **What it is**,
      **How it works** across all seven surfaces (life table; counter panel
      and commander-damage matrix; day/night header control; Game Setup;
      Reset / New Game; persistence; one-way MTG Assistant seed), **Measured
      bounds**, **Rejected alternatives and deferred scope**, **Where it
      lives**. The measured-bounds supersession rule was applied: the ≈53px
      commander-damage band (REQ-112) survives under **Measured bounds**; the
      ≈67px life-adjustment edge band (REQ-112) appears only as a closed door
      under **Rejected alternatives and deferred scope**, per A7's verified
      evidence.
- [x] Slice B — added the one `PRD/README.md` Section Inventory row for
      `sections/life-tracker/`; ran the package-wide diff-scope proof (no
      `apps/`, no existing `DEC`/`REQ`/`FLOW`/`NFR` body touched).
- [x] All 14 acceptance criteria (`slice-a.criteria.json` A1–A9,
      `slice-b.criteria.json` B1–B5) verified `true`, independently
      re-confirmed by the node 7 no-write reviewer: verdict **APPROVE**, 0
      Critical, 0 Important, 3 Minor (recorded as follow-ups below).
- [x] PR #105 (base `thejudge-auto/life-tracker-spec`) merged by the owner
      2026-08-25T15:20:12Z, merge commit `4bb26c6`.
- [x] Durable promotion: none required at cleanup — both deliverables
      (`PRD/sections/life-tracker/README.md`, the `PRD/README.md` row) were
      already committed directly onto the recorded autonomous base by node 6
      (`build`), and `DEC-168` plus its `PRD/sections/decisions.md` router row
      were already committed and owner-accepted at the `define` gate on
      2026-08-24. Confirmed still present on the base at cleanup time.
- [x] System-map promotion gate: no flip required. `PRD/sections/system-map.md`'s
      `## Player Life Tracker` entry (line 534) already reads `Status: shipped`
      from prior work; this package did not change shipped product behavior,
      only added a derived documentation view.
- [x] `PRD/work/life-tracker-spec/GRAPH-RUN.md`'s `## Node ledger` and
      `## Instruction ledger` folded verbatim into `## Graph run` below,
      before the package folder was deleted, per this run's node-9
      requirement.
- [x] `intake/refactor-gameplan.md` recorded under `## Intake` below, before
      the package folder was deleted.
- [x] Autonomous merge-proof gate — all four checks satisfied; see
      `## Merge-proof gate` below for the full evidence and verdict on each.

## Merge-proof gate

1. **Current branch equals recorded base.** `git branch --show-current` →
   `thejudge-auto/life-tracker-spec`, matching `README.md`'s
   `Autonomous base: origin/thejudge-auto/life-tracker-spec` exactly.
   `git ls-remote --heads origin thejudge-auto/life-tracker-spec` →
   `ba7e0c6`, so the base still exists on the remote and the deleted-base
   second path does not apply. **Met.**
2. **PR merged into the recorded base, verified via `gh`.**
   `gh pr view 105 --json state,baseRefName,mergedAt,mergeCommit` →
   `state: MERGED`, `baseRefName: thejudge-auto/life-tracker-spec`,
   `mergedAt: 2026-08-25T15:20:12Z`, `mergeCommit.oid: 4bb26c64c163…`. The
   GitHub API was reachable, so `gh` stays authoritative; the local-proof
   fallback does not apply. **Met.**
3. **Worktree fully merged (judgment call, squash merge).** PR #105 was
   squash-merged: `git rev-list --parents -n 1 4bb26c6` → single parent
   `763edf2`, so the worktree's slice-B commit `3d18edf` is not a literal
   ancestor of the base tip, and `git log origin/thejudge-auto/life-tracker-spec..HEAD`
   in the worktree lists nothing (confirms the absence). Content check:
   `git diff --stat 3d18edf origin/thejudge-auto/life-tracker-spec` touches
   exactly one file, `PRD/work/life-tracker-spec/GRAPH-RUN.md` (177
   insertions, 2 deletions), and reading that diff directly confirms every
   line is the driver's own run-bookkeeping (current-node/next-action
   updates, ledger rows 6–8, the resolved `land` gate section) — no product
   deliverable differs. `PRD/sections/life-tracker/README.md` and the
   `PRD/README.md` row are byte-identical between the worktree and the base.
   `git -C .worktrees/implement-life-tracker-spec status --porcelain` is
   empty. **Verdict: met.** Squash merge breaks literal commit ancestry by
   design; the substantive requirement — every deliverable present in the
   merged base — is satisfied by content identity, and the one file that
   differs is the run's own ledger, which this receipt now supersedes.
4. **Runtime-cleanup criteria.** Confirmed against both evidence files rather
   than assumed: `slice-a.evidence.md` records two manual checks (a grep and
   a read of the **Where it lives** section); `slice-b.evidence.md` records a
   `git diff --stat`/`git diff` check and a scope cross-check against
   `DESIGN-BRIEF.md`. Neither mentions a browser, a dev server, or a port.
   `GAMEPLAN.md`'s own `## Runtime / browser risk` section states "None...
   No Playwright verification is required." **Met — vacuously, no runtime
   session was ever opened.**

## Files created

- `PRD/instructions/receipts/life-tracker-spec-2026-08-25.md` (this file)

## Files updated

- `PRD/work/STATUS.md` — removed the `life-tracker-spec` row from the
  `## ship-ready` section

## Files deleted

- `PRD/work/life-tracker-spec/` (entire work folder): `README.md`,
  `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `GRAPH-RUN.md`,
  `STATUS.ship-ready`, `slice-a-write-spec.md` + `slice-a.criteria.json` +
  `slice-a.evidence.md`, `slice-b-nav-row.md` + `slice-b.criteria.json` +
  `slice-b.evidence.md`, `intake/refactor-gameplan.md`
- `.worktrees/implement-life-tracker-spec/` (autonomous implementation
  worktree, clean and content-complete per merge-proof check 3) and its
  local branch `implement-life-tracker-spec-1787586821`

## Durable outcomes already shipped (present on the base prior to this node)

- `PRD/sections/life-tracker/README.md` — new, 167 lines, the DEC-168
  current-state feature spec.
- `PRD/README.md` — one Section Inventory row for `sections/life-tracker/`.
- `PRD/sections/decisions/doc-process.md` §DEC-168 and its router row in
  `PRD/sections/decisions.md` — landed and owner-accepted at the `define`
  gate on 2026-08-24, unchanged since.

## Verification results

- `npm run quality:check` — exit 0. `test:scripts`: 401/401 tests passing, 0
  failures. Touched-area note: this package's diff is entirely
  `PRD/**/*.md` (prettier-ignored, not covered by `lint`/`format:check`/
  `typecheck`), so `quality:check` here confirms no regression elsewhere in
  the repo rather than exercising the touched files directly — consistent
  with this package's own `GAMEPLAN.md`, which states no `apps/` test suite
  applies.
- `git ls-remote --heads origin thejudge-auto/life-tracker-spec` → `ba7e0c6`
  (base still live on remote).
- `gh pr view 105 --json state,baseRefName,mergedAt,mergeCommit` → `MERGED`,
  base `thejudge-auto/life-tracker-spec`, merge `4bb26c6`.
- `git diff --stat 3d18edf origin/thejudge-auto/life-tracker-spec` → one
  file (`GRAPH-RUN.md`, bookkeeping only); every deliverable byte-identical.
- `git -C .worktrees/implement-life-tracker-spec status --porcelain` → empty.
- `grep -n "DEC-168" PRD/sections/decisions.md` → present, row unchanged
  since the `define` gate.

## Follow-ups (node 7 reviewer, rated Minor, not fixed by this node)

1. **`B5` reads as a human confirmation; no human existed in the unattended
   run.** The build node recorded a dated agent observation instead and said
   so in `slice-b.evidence.md`. Resolved now: the owner reviewed and merged
   PR #105, which is the human confirmation `B5` was written to describe.
2. **PR #105 does not display the spec.** Node 6 pushed slice A directly
   onto the recorded autonomous base before opening the PR (see "Known
   defect" below), so `origin/thejudge-auto/life-tracker-spec` already
   carried `PRD/sections/life-tracker/README.md` when PR #105 opened, and
   the PR's Files tab shows only slice B (seven files, no spec). No content
   was lost — verified during the `land` gate by `git ls-remote` and
   `gh pr view 105 --json files`. No action needed; recorded for whoever
   next reads PR #105's diff and wonders where the spec is.
3. **Two current-state details are absent from the spec.** The
   confirm-before-destroy step on Reset / New Game
   (`PRD/sections/system-map.md:535`, "confirm-before-destroy Reset/New
   Game") is not narrated in the spec's own Reset / New Game section. And
   `NFR-001` / `NFR-006` are named on the spec's `Backed by:` line but carry
   no attached behavior anywhere in **How it works**. Neither fails a
   stated slice criterion — A5 asks for the seven surfaces and gets them;
   A4 asks only that the IDs be named, not that every named ID anchor a
   sentence. Candidates for a later pass over `PRD/sections/life-tracker/README.md`.

## Known defect (contributing cause of this run, not fixed here)

`thejudge-implement-all/SKILL.md:36` derives the shared remote branch as
`thejudge-auto/<slug>` — the same name as the recorded autonomous base. On
this run that collided with itself: node 6 (`build`) forked
`thejudge-auto/life-tracker-spec-work` after slice A had already landed
directly on the base, which is what produced follow-up 2 above and this
receipt's merge-proof check 3 judgment call. The fix belongs to an ordinary
session — a graph run may not edit a `thejudge-*` skill, so it was recorded
here rather than patched in flight. This repo has one prior precedent for the
same fork (PR #97, `codebase-duplication-audit`).

## Graph run

- Run ID: `graph-20260824-082911` | Profile: `loaded (env sentinel)` | Terminal state: `COMPLETE`

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | `git switch -c thejudge-auto/life-tracker-spec main`; `git push -u origin thejudge-auto/life-tracker-spec`; base resolved `main`; classification `clean`, no stash; `Profile: loaded (env sentinel)`; `CANARY_COMMAND` denied (`'rm -rf' is denied in every session`); `GRAPH_CANARY_COMMAND` denied (`'nohup' is denied while a graph run holds the lock`); lock `free` → taken at `.worktrees/.graph-run.lock` | 2026-08-24 |
| 2 | shape | sonnet | ok | `0 → 29` | commit `ec08424` on `thejudge-auto/life-tracker-spec`, pushed; `PRD/work/life-tracker-spec/IDEA.md`, `README.md`, `STATUS.ideation`, `intake/refactor-gameplan.md`; board row added under `## ideation` in `PRD/work/STATUS.md`; staged intake deleted (`.worktrees/.graph-intake/graph-20260824-082911/` absent); prior-run matches `PRD/instructions/receipts/player-life-tracker-2026-08-03.md`, `PRD/instructions/receipts/player-life-tracker-refinement-2026-08-05.md` | 2026-08-24 |
| 3 | define | opus | ok — gate | `0 → 41` | commit `a6c4aec` on `thejudge-auto/life-tracker-spec`, pushed; `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`; `PRD/sections/decisions/doc-process.md` + `PRD/sections/decisions.md` (DEC-168); `git diff main...HEAD -- PRD/sections/` non-empty -> parked at the `define` gate; `STATUS.refined` -> `STATUS.owner-action` | 2026-08-24 |
| 4 | gate-qc | sonnet | ok | `0 → 22` | verdict `PASS` on `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`, findings `none`; no `STATUS.*` transition (stays `STATUS.refined`); `## Preparation gate` written to `PRD/work/life-tracker-spec/README.md` by the driver | 2026-08-24 |
| 5 | plan | sonnet | ok | `0 → 33` | `PRD/work/life-tracker-spec/GAMEPLAN.md`; slices `slice-a-write-spec.md` (write `PRD/sections/life-tracker/README.md`) and `slice-b-nav-row.md` (one `PRD/README.md` Section Inventory row + package-wide diff proof), B sequential on A; `slice-a.criteria.json` (A1–A9) and `slice-b.criteria.json` (B1–B5) — all 14 criteria `false`, each with an `evidence` block, verified by parsing both files; `STATUS.refined` -> `STATUS.active`; board row moved to `## active` in `PRD/work/STATUS.md`; every written path inside `PRD/work/life-tracker-spec/` plus the board file | 2026-08-24 |
| 6 | build | sonnet | ok | `0 → 136` | worktree `.worktrees/implement-life-tracker-spec` on `implement-life-tracker-spec-1787586821`; slice A `376b2a0`, slice B `3d18edf`, both pushed to `origin/thejudge-auto/life-tracker-spec-work` (forked because the derived shared-branch name collided with the recorded base itself, matching this repo's PR #97 precedent); PR https://github.com/ChrisMiho/TheJudge/pull/105 base `thejudge-auto/life-tracker-spec`; **write scope verified** — `git worktree list` and `git status --porcelain` show the launch checkout clean at `8799b1e`, and every path in `git diff --stat 8799b1e..3d18edf` lies inside `.worktrees/implement-life-tracker-spec/` or `PRD/work/life-tracker-spec/`; deliverables `PRD/sections/life-tracker/README.md` (new, 167 lines) and one `PRD/README.md` row; all 14 criteria `value: true` with 14 matching lines in the hook-written `.worktrees/.graph-evidence.jsonl` for this run id (A7/A8/B3/B5 `via: manual-observation` — a dated check that happened, not a passing check); `STATUS.active` -> `STATUS.ship-ready` | 2026-08-24 |
| 7 | review | opus | ok | `0 → 31` | no-write reviewer (`Plan` agent type — no `Write`/`Edit`/`NotebookEdit`), fresh context, graded against `slice-a.criteria.json` (A1–A9) and `slice-b.criteria.json` (B1–B5); verdict **APPROVE**, **0 Critical, 0 Important**, 3 Minor — no loop back to `build`; all 14 criteria satisfied as stated; supersession rule verified applied as a rule (four superseded shapes demoted to closed doors, `≈67px` band appears only under `## Rejected alternatives and deferred scope`); diff confined to `PRD/README.md`, `PRD/sections/life-tracker/README.md`, and `PRD/work/` bookkeeping; Minor 2 independently confirmed by the driver — `git ls-remote origin thejudge-auto/life-tracker-spec` = `376b2a0` and `gh pr view 105 --json files` lists 7 files without the spec | 2026-08-24 |
| 8 | land | — (human PR merge) | ok | — (not dispatched) | owner merged https://github.com/ChrisMiho/TheJudge/pull/105 on 2026-08-25T15:20:12Z, merge commit `4bb26c6`; `gh pr view 105 --json state,mergedAt,mergeCommit` -> `MERGED`; launch checkout fast-forwarded `763edf2 -> 4bb26c6` with `git merge --ff-only`, `git status --porcelain` empty; package now `STATUS.ship-ready` with both slices `done` in `PRD/work/life-tracker-spec/README.md` and the board row under `## ship-ready`; the driver ran no `gh pr merge` or `gh pr close` | 2026-08-25 |
| 9 | close | sonnet | ok | `0 → n/a (degraded)` | receipt `PRD/instructions/receipts/life-tracker-spec-2026-08-25.md` written; all four merge-proof checks verified independently (see `## Merge-proof gate` above); `PRD/work/life-tracker-spec/` deleted via `git rm -r`; `.worktrees/implement-life-tracker-spec` and local branch `implement-life-tracker-spec-1787586821` removed; `PRD/work/STATUS.md` board row removed; `npm run quality:check` exit 0 (401/401 `test:scripts`) | 2026-08-25 |

**Node 9's row was written by the driver after the fact, not by the run.**
The run cannot record its own final node: node 9 deletes
`PRD/work/<slug>/`, and `GRAPH-RUN.md` lives inside it, so there is no
ledger left to write the `close` row into. This is the same structural gap
`codebase-duplication-audit-2026-08-23.md`'s receipt records for PR #97 —
recorded here rather than worked around.

**Node-row count.** The dispatch prompt for this node stated the ledger
holds "nine node rows." At the time this node read `GRAPH-RUN.md`, it held
eight (rows 1–8); the ninth is this node's own row, added above for exactly
the reason stated in the note directly above. Recorded as a discrepancy
between the stated fact and the observed file, resolved by the same
mechanism the prior receipt already established.

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "start with the life-tracker in @PRD/work/adhoc/refactor-gameplan.md" | answered-once | shape | — |
| "ok its merged" | answered-once | land | — |

## Intake

- `intake/refactor-gameplan.md` — supplied path `@PRD/work/adhoc/refactor-gameplan.md`
  in the launch request; staged by the run and copied verbatim into the
  package per `GRAPH-RUN.md`'s node 2 dispatch prompt. Not opened by this
  node — recorded as a citation only, per the graph-workflow-contract's
  intake rule.
