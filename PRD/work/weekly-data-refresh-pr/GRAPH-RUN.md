# Graph run — weekly-data-refresh-pr

- Run ID: `graph-20260907-163826`
- Profile: `loaded (env sentinel)` (reported by node 1)
- Canary: `denied — hook live (rm -rf, universal tier; nohup, graph tier)`
- Autonomous base: `origin/thejudge-auto/weekly-data-refresh-pr` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260907-163826/`
- Current node: `define`
- Next action: `/graph-kickoff` (spec-forming half in flight; stop at gate-qc PASS with docs PR)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | degraded (no run state) | branch `thejudge-auto/weekly-data-refresh-pr` cut from `origin/main` (b20ea13), pushed from `.worktrees/kickoff-weekly-data-refresh-pr`; lock held (runId graph-20260907-163826, pid 10773); launch checkout untouched | 2026-09-07 |
| 2 | shape | sonnet | ok | degraded (no run state) | `PRD/work/weekly-data-refresh-pr/` created (STATUS.ideation) with IDEA.md, intake/GRAPH-BRIEF.md verbatim, 3 prior-run matches; committed 0b59ec5 and pushed; launch checkout untouched | 2026-09-07 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling

You are node 1 (`preflight`) of an autonomous graph-kickoff run. Invoke the `/graph-preflight` skill and follow it exactly. Do not run any other lifecycle phase.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke: `/graph-preflight --branch thejudge-auto/weekly-data-refresh-pr --slug weekly-data-refresh-pr --run-id graph-20260907-163826`

Parameters: slug `weekly-data-refresh-pr`, branch `thejudge-auto/weekly-data-refresh-pr`, run id `graph-20260907-163826`. Take the concurrency lock, create the kickoff worktree cut from `origin/main` and push it, run the hook-liveness canary and treat the observed deny as proof the hook is live, read the profile env sentinel, refuse on stop sentinel or branch collision, and report worktree path, branch, canary reason, profile, and lock.

### shape

graph is controlling

You are node 2 (`shape`) of an autonomous graph-kickoff run. Invoke the `/thejudge-kickoff` skill and follow it exactly, in its graph-controlled mode. Do not run refinement, quality-check, or any later phase — only create and name the package.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr

All work happens in that kickoff worktree; never touch the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-subagent.

Slug (use exactly this): `weekly-data-refresh-pr`. Run id `graph-20260907-163826`.

The request: "Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh"

Owner's framing (verbatim, for IDEA.md context — an input, NOT a settled product decision): "A weekly one-command local script: refresh the data, cut a branch off origin/main, commit, push, open a PR you merge. Reuses the existing data:refresh pipeline; no runtime sync. Open choice for refinement: full refresh vs prices-only (I recommend full to start)."

Create `PRD/work/weekly-data-refresh-pr/` with IDEA.md and STATUS.ideation; copy the staged intake verbatim from `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260907-163826/` into `intake/` without opening any document it cites; grep `PRD/instructions/receipts/` for prior runs and write one `## Prior run` line per match; do not write the README's Autonomous metadata or Preparation gate sections. Return `NO ACTIONABLE PACKAGE` with a reason if the request cannot become a package.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh | answered-once | shape | — |
| A weekly one-command local script: refresh the data, cut a branch off origin/main, commit, push, open a PR you merge. Reuses the existing data:refresh pipeline; no runtime sync. Open choice for refinement: full refresh vs prices-only (I recommend full to start). | answered-once | define | — |
