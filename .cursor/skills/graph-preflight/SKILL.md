---
name: graph-preflight
description: >-
  Use before an autonomous graph run to guarantee a clean, freshly branched
  local checkout — resolving uncommitted work by auto-commit or stash and
  publishing the branch that worktrees and pull requests will target.
---

# Graph Preflight

## Goal

Leave the repository in exactly one state: a freshly created local branch,
pushed to `origin`, with no uncommitted work — and a recorded account of what
happened to anything that was uncommitted.

Read `PRD/instructions/graph-workflow-contract.md` before acting.

## Inputs

- `--branch <name>` (required). Never infer it, never reuse the current branch,
  never default to `main`.
- `--run-id <id>` (optional; defaults to `graph-<YYYYMMDD>-<n>`).

## Procedure

1. Run `npm run graph:preflight -- --branch <name> --run-id <id> --dry-run`
   first. Report the classification and the planned commands.
2. If the action is `blocked`, stop. Report the offending paths. Never
   hand-resolve a secret-bearing path to get past this.
3. Otherwise re-run without `--dry-run`.
4. Confirm the end state with `git status --porcelain` (empty) and
   `git branch --show-current` (the requested branch).
5. When the action was `stash`, record the stash reference and the exact
   restore commands from the contract's "Stashed work handoff" section.

## Boundaries

The classification thresholds live in `scripts/graph-preflight.mjs` and are
covered by `scripts/graph-preflight.test.mjs`. Do not reimplement the
commit-versus-stash decision in prose, override it by judgment, or pass
`--max-files`/`--max-lines` to force a different branch of the logic.

Never drop, pop, or clear a stash. Never force-push.

## Next step

Report the branch, the classification, and the stash reference if one exists,
then continue the run:

`/graph-run PRD/work/<slug>/`
