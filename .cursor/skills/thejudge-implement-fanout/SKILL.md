---
name: thejudge-implement-fanout
description: >-
  Use when two or more PRD/work/<slug>/ packages are simultaneously active and
  should implement concurrently, not just one — as opposed to running a single
  package's slices. Reads PRD/work/STATUS.md for the active list.
---

# TheJudge Implement (Fanout)

## Goal

Run every selected `active` package to completion concurrently, one isolated worktree and agent per package, each delegating to `thejudge-implement-all` for its own GAMEPLAN. This skill never touches slice contracts itself — it only decides *which* packages run.

## Inputs

Optional include-list or ignore-list of slugs (e.g. "ignore commander-spellbook-combos", or name the packages directly). Without one, select every row under `## active` in `PRD/work/STATUS.md`.

## Reads

The orchestrator reads these itself, before dispatching anything — orientation is not delegable:

1. `PRD/work/STATUS.md` — resolve the active list against any include/ignore argument
2. Each selected package's `PRD/work/<slug>/GAMEPLAN.md` and `README.md`
3. Every selected package's `Files touched` across its slice docs
4. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties

## Per-package dispatch

Every selected package is dispatched to `thejudge-implement-all`, which runs
that package's slices sequentially in one unattended agent session.

Do not re-derive slice dependencies or invent a second mode — the dispatched skill owns its own slice-level contract and status transitions.

## Writes

Nothing directly. All product code, tests, commits, and STATUS transitions happen inside each dispatched package's own skill run, under that skill's own contract.

## Status transitions

None owned by this skill. Each package's status moves `active` → `ship-ready` exactly as `thejudge-implement-all` already defines. This skill only reports which packages finished, which are still running, and which are blocked.

## Gates

- **Cross-package file-overlap check is mandatory before dispatch.** Diff the `Files touched` lists of every pair of selected packages. Any overlap: drop that pair from concurrent dispatch and run them sequentially instead — never dispatch two packages concurrently that can write the same file.
- **One isolated worktree and branch per package.** Never share a worktree, local branch, or launch checkout across packages, even when running sequentially per the overlap gate above.
- **Full tool access required per dispatched agent.** Each dispatched agent must be able to invoke skills and read/write/run commands (Bash, Edit, Write, Skill). An agent type restricted to read-only or planning-only tools cannot run `thejudge-implement-all` and is not a valid dispatch target for this skill.
- **Self-contained dispatch prompt.** Each dispatched agent starts cold — it does not inherit this session's context. Its prompt must name the exact skill to invoke (`thejudge-implement-all`) and the exact package path; the dispatched agent then does its own reads under that skill's contract.
- Only dispatch packages currently `STATUS.active` with an existing `GAMEPLAN.md`. A package still `refined` or earlier is not this skill's job — it needs map-out first.
- Never run `thejudge-map-out*`, `thejudge-quality-check`, or `thejudge-cleanup` from this skill.
- Never commit, push, merge, or open a PR from the orchestrator itself — only dispatched agents do, under their own skill's contract.
- Verification stays inside each dispatched package's own skill; this skill's own job on completion is to confirm each dispatched run actually reports `ship-ready` or a named blocker, not to re-run any package's tests itself.

## Quick reference

| Selected package's GAMEPLAN | Dispatch |
|---|---|
| Slice table with an existing GAMEPLAN | `thejudge-implement-all PRD/work/<slug>/` |
| File overlap with another selected package | Run that pair sequentially, not concurrently |
| Not yet `active` (no GAMEPLAN) | Drop from this run |

## Next step

All dispatched packages `ship-ready` → review/merge each PR manually, then `/thejudge-cleanup PRD/work/<slug>/` per package.
Any package blocked → report the blocker; do not dispatch its retry automatically.
