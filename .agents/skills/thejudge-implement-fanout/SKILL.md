---
name: thejudge-implement-fanout
description: >-
  Use when two or more PRD/work/<slug>/ packages are simultaneously active and
  should implement concurrently, not just one — as opposed to fanning out
  within a single package's slices or waves. Reads PRD/work/STATUS.md for the
  active list.
---

# TheJudge Implement (Fanout)

## Goal

Run every selected `active` package to completion concurrently. Each package is
owned by one cold-start agent invoking `thejudge-implement-all`, which creates
that package's one isolated worktree, branch, and PR. This skill never touches
slice contracts itself — it only selects packages, applies the overlap gate,
and passes the checked-out feature base to each executor.

## Inputs

Optional include-list or ignore-list of slugs (e.g. "ignore commander-spellbook-combos", or name the packages directly). Without one, select every row under `## active` in `PRD/work/STATUS.md`.

## Reads

The orchestrator reads these itself, before dispatching anything — orientation is not delegable:

1. `PRD/work/STATUS.md` — resolve the active list against any include/ignore argument
2. Each selected package's `PRD/work/<slug>/GAMEPLAN.md`, `README.md`, and
   every unfinished slice's status / `### Handoff` block
3. Every selected package's `Files touched` across its slice docs
4. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties

## Durable handoff

Fanout has no shared orchestration handoff file: writing one in the clean
launch checkout would race with package status updates and would block the
next package executor's preflight. Its durable handoff is instead the
per-package `### Implementation handoff` in `README.md`, plus any unfinished
slice's `### Handoff` block, owned by `thejudge-implement-all`.

Before dispatching or re-dispatching a package, read those records and pass
their existence to the cold-start executor. The dispatch prompt must state
that it is a resume when a handoff exists, and that the executor must refresh
both applicable records before it returns or runs out of usage. A restarted
fanout run always recomputes the overlap components from the current files and
uses package status plus these handoffs as the source of truth; it never relies
on the prior parent agent's chat, task IDs, or memory.

## Per-package executor

Every selected package dispatches `thejudge-implement-all`, including a
GAMEPLAN that is grouped into dependency waves. The dispatched agent executes
all remaining slices sequentially in its own worktree; it never delegates
slice implementation or invokes `thejudge-implement-parallel`.

Each executor owns its package's durable handoff updates. A package that is
still `active` after an interrupted executor is eligible for a fresh
`thejudge-implement-all` dispatch only after its README and unfinished-slice
handoff are read; the new executor resumes that package in its retained
worktree/branch rather than reconstructing progress from the parent session.

Read the slice table only to confirm the package has work left and to identify
files for the cross-package overlap gate. Do not select an executor from the
table shape or create a third execution mode.

## Writes

Nothing directly. All product code, tests, commits, and STATUS transitions happen inside each dispatched package's own skill run, under that skill's own contract.

## Status transitions

None owned by this skill. Each package's status moves `active` → `ship-ready`
exactly as its dispatched `thejudge-implement-all` run defines. This skill
only reports which packages finished, which are still running, and which are
blocked.

## Gates

- **Cross-package file-overlap check is mandatory before dispatch.** Diff the `Files touched` lists of every pair of selected packages. Form overlap components from those pairs. Dispatch independent components concurrently; within each component, run packages in slug order, starting the next only after the prior package reports `ship-ready`. If one blocks, report it and leave the later packages in that component undispatched. Never dispatch two packages concurrently that can write the same file.
- **One isolated worktree and branch per package.** `thejudge-implement-all`
  creates and retains exactly one worktree and package branch. Do not create a
  second staging worktree, and never share a worktree, local branch, or launch
  checkout across packages, even when running sequentially per the overlap
  gate above.
- **Checked-out feature base is mandatory.** Before dispatch, record the
  current non-detached branch as `<feature-base>`. It is the PR base for every
  selected package; pass its exact name to every executor. Do not infer
  `main`, select another branch, or continue if the launch checkout is dirty,
  behind its remote, or lacks `origin/<feature-base>`.
- **Full tool access required per dispatched agent.** Each dispatched agent must be able to invoke skills and read/write/run commands (Bash, Edit, Write, Skill). An agent type restricted to read-only or planning-only tools cannot run `thejudge-implement-all` and is not a valid dispatch target for this skill.
- **Self-contained dispatch prompt.** Each dispatched agent starts cold — it does not inherit this session's context. Its prompt must name `thejudge-implement-all`, the exact `PRD/work/<slug>/` path, and `feature base: <feature-base>`; state whether `README.md` or an unfinished slice contains a handoff and require the agent to read it before acting. The dispatched agent then does its own reads and refreshes the handoff under that skill's contract.
- Only dispatch packages currently `STATUS.active` with an existing `GAMEPLAN.md`. A package still `refined` or earlier is not this skill's job — it needs map-out first.
- Never run `thejudge-map-out*`, `thejudge-quality-check`, or `thejudge-cleanup` from this skill.
- Never commit, push, merge, or open a PR from the orchestrator itself — only dispatched agents do, under their own skill's contract.
- Verification stays inside each dispatched package's own skill; this skill's own job on completion is to confirm each dispatched run actually reports `ship-ready` or a named blocker, not to re-run any package's tests itself.

## Quick reference

| Selected package | Dispatch |
|---|---|
| Any GAMEPLAN shape | `thejudge-implement-all PRD/work/<slug>/ --base <feature-base>` |
| Package has a README or unfinished-slice handoff | Read it, then dispatch `thejudge-implement-all` as a resume |
| File overlap with another selected package | Run that pair sequentially, not concurrently |
| Not yet `active` (no GAMEPLAN) | Drop from this run |

## Next step

All dispatched packages `ship-ready` → review/merge each PR manually, then `/thejudge-cleanup PRD/work/<slug>/` per package.
Any package blocked → report the blocker; do not dispatch its retry automatically.
