# Graph run — user-feedback-spec

- Run ID: `graph-20260825-150903`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`
- Graph canary: `denied — hook live (nohup true)`
- Autonomous base: `origin/thejudge-auto/user-feedback-spec`
- Parent branch (fork point): `thejudge-auto/life-tracker-spec` — its work is already in `origin/main` via PR #106 (DEC-168 + life-tracker spec); our branch is a clean ancestor of `origin/main` (0 ahead, 1 behind)
- Staging: `.worktrees/.graph-intake/graph-20260825-150903/`
- Current node: `define`
- Next action: `/graph-run PRD/work/user-feedback-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 4` | branch `thejudge-auto/user-feedback-spec` created + pushed; forked from `thejudge-auto/life-tracker-spec`; clean tree, no stash; lock `graph-20260825-150903` held | 2026-08-25 |
| 2 | shape | sonnet | ok | `1 → 40` | package `PRD/work/user-feedback-spec/` created (`IDEA.md`, `README.md`, `STATUS.ideation`, `intake/refactor-gameplan.md`); board row under `## ideation`; commit `2e1c452` pushed | 2026-08-25 |

## Open gate

- None

## Dispatch prompts

### preflight

graph-run is controlling. You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Branch: `thejudge-auto/user-feedback-spec` (pass verbatim as `--branch`; never infer or reuse the current branch)
- Run ID: `graph-20260825-150903` (pass verbatim as `--run-id` to BOTH the dry run and the real run)
- Slug: `user-feedback-spec`

Do exactly what `graph-preflight/SKILL.md` requires, in order: confirm no stop sentinel; take the concurrency lock via the script; issue `CANARY_COMMAND` as a real Bash tool call and require a DENY (classify with `classifyCanary()`); after the lock is taken issue `GRAPH_CANARY_COMMAND` and require a DENY (classify with `classifyGraphCanary()`) — an allowed graph canary is BLOCKED; run the `--dry-run` preflight then the identical real run with the same `--run-id`; confirm `git status --porcelain` empty and the branch is `thejudge-auto/user-feedback-spec`; record any stash. The launch checkout is clean, so expect a `branch` classification with no stash.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the two canary ledger lines, the `Profile:` line verbatim, the resolved base, the classification, the branch created and whether it was pushed, the final git state, any stash ref + restore commands, and any non-zero exit. Do not dispatch further nodes; do not edit product files.

### shape

graph-run is controlling. You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; capture the idea and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Your job: create the work package for this request as `PRD/work/user-feedback-spec/`, capturing the idea in `IDEA.md` with a `STATUS.ideation` marker and a package `README.md`. Use the slug `user-feedback-spec` exactly.

The request to capture, verbatim:
"Write the current-state feature spec for the user-feedback feature — Phase A #2 of the docs-refactor gameplan. Land it at PRD/sections/user-feedback/README.md on the DEC-168 template. Frontend-only, one external dependency, no server state. Consolidate current behavior; keep it draft and non-authoritative with decisions.md at precedence #1."

Reference material (intake — evidence, never authority): a staged copy of the docs-refactor gameplan is at `.worktrees/.graph-intake/graph-20260825-150903/refactor-gameplan.md`. You may read THAT file for context. Do NOT open or fetch any document that file cites — record only their paths. Capture the idea faithfully; do not decide product behavior; that is settled later at the define gate.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the files created, the `STATUS.*` marker, a one-line slug confirmation, and whether kickoff returned NO ACTIONABLE PACKAGE. Do not create a GAMEPLAN, slice docs, or DESIGN-BRIEF; do not edit `PRD/sections/` product truth; do not dispatch further nodes.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Write the current-state feature spec for the user-feedback feature — Phase A #2 of the docs-refactor gameplan. Land it at PRD/sections/user-feedback/README.md on the DEC-168 template. Frontend-only, one external dependency, no server state. Consolidate current behavior; keep it draft and non-authoritative with decisions.md at precedence #1. | answered-once | shape | — |
