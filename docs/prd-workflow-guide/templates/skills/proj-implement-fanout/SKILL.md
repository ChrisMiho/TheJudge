---
name: proj-implement-fanout
description: >-
  Use when two or more PRD/work/<slug>/ packages are simultaneously active and
  should implement concurrently, not just one — as opposed to running a single
  package's slices. Reads PRD/work/STATUS.md for the active list.
---

# <Product> Implement (Fanout)

## Goal

Run several active packages concurrently, safely. The orchestration is the easy
part; the collision check is the reason this skill exists.

## Inputs

None required — the board is the input. Optionally an include or ignore list.

## Reads

- `PRD/work/STATUS.md` — every row under `## active`
- For each selected package: `GAMEPLAN.md`, `README.md` (including the recorded
  base), and the `Files touched` list of every remaining slice
- `PRD/instructions/workflow-reference.md`

## Writes

Nothing. This skill dispatches; the dispatched runs do the writing.

## Procedure

1. Select every `active` package, minus any ignore list.
2. **Diff the `Files touched` lists of every pair of selected packages.** Any
   pair with an overlap runs sequentially, not concurrently. This check is the
   whole point — two agents editing one file across separate worktrees produces
   conflicts that neither can resolve correctly, because neither knows the
   other's intent.
3. Verify every selected package shares the same base branch. Refuse otherwise.
4. Assign each package a unique, preflighted port pair before dispatch, so
   concurrent dev servers do not collide.
5. Dispatch one isolated worktree and agent per package, each running
   `proj-implement-all` against that package's own gameplan.
6. Give each dispatch a self-contained cold-start prompt. A dispatched agent
   knows nothing about this session.
7. Collect results and report per package: `ship-ready`, or blocked with the
   blocker.

## Status transitions

None owned here. Each dispatched `proj-implement-all` run owns its own package's
transitions.

## Gates

- Never dispatch overlapping packages concurrently.
- Never dispatch packages with different bases in one wave.
- Never write, commit, or push from the orchestrator.
- Never auto-retry a blocked package. Report it.

## Next step

All packages `ship-ready`: review and merge each PR, then run
`/proj-cleanup PRD/work/<slug>/` once per package.

Any package blocked: report the blocker and stop.
