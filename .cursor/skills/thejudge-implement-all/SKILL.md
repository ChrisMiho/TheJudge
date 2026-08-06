---
name: thejudge-implement-all
description: >-
  Use when every remaining slice in an existing TheJudge GAMEPLAN should be
  completed during one unattended, single-agent session, especially for
  long-running work that must remain reviewable on GitHub. When all slices
  finish, sets STATUS.ship-ready before handoff to cleanup.
---

# TheJudge Implement All

## Goal

Execute every remaining slice with one agent, publishing each green milestone to a shared GitHub branch and open review PR.

## Inputs

Work slug or `PRD/work/<slug>/` path. Optional shared remote branch or PR number; otherwise use `thejudge-auto/<slug>` targeting the package's recorded autonomous base (the `## Autonomous metadata` section in its `README.md`). Block before worktree creation if the package has no recorded base and no compatible supplied branch/PR resolves one.

## Reads

Read the work-package `README.md` — including its `## Autonomous metadata` section — plus `GAMEPLAN.md`, every remaining `slice-*.md`, each slice's files/tests, this skill's `reference.md`, and `PRD/instructions/workflow-reference.md` (package status / STATUS.*).

## Workflow contract

1. Create a unique contributor branch in a new worktree; never edit the launch checkout.
2. Join an existing shared remote branch or start from the latest fetched recorded autonomous base.
3. Implement dependency-ready slices sequentially with no implementation subagents or pauses between green slices.
4. Join an existing PR before implementation; otherwise create it after the first push. Publish one milestone commit per slice.
5. Continue until all registered work is complete or blocked. Never merge or close the PR.

## Slice loop

1. Fetch/rebase onto the shared branch when it exists, otherwise the recorded autonomous base; resolve conflicts before editing.
2. Confirm dependencies are `done`, then mark the slice `in-progress`.
3. Implement only the slice and its tests under `reference.md`.
4. Run the slice verification while its status is `in-progress`; debug until green. For a slice with browser or dev-server acceptance criteria, record `PRD/instructions/runtime-process-hygiene.md`'s cleanup evidence (browser-close, owned-process-stop, port-release, capture output path) before it can become `done`; an unresolved ownership/cleanup failure keeps it `blocked`. This skill's isolated worktree always starts its own dev server(s) on ports it owns — it never attaches to a pre-existing one, since worktrees are isolated checkouts — and writes captures under its own worktree's `PRD/work/<slug>/.playwright-mcp/`.
5. Mark it `done`, update only the README slice table/notes, and stage every intended slice output. Require the non-ignored worktree to match the index before and after rerunning the slice verification and `npm run quality:check`.
6. If either gate fails, restore `in-progress` while debugging or leave `blocked` if stopping. Do not commit, push, or start another slice.
7. Inspect the staged diff and commit `feat(<slug>): complete slice <letter>`.
8. Fetch/rebase again using the recorded autonomous base until the shared ref exists, then the shared ref. After upstream changes, rerun both gates.
9. Push `HEAD` to the shared remote branch without force. On a race, repeat fetch, rebase, full quality check, and push.

## Status transitions

- Keep package `active` / `STATUS.active` while any slice remains not `done`.
- When every registered slice is `done`: set `status: ship-ready`, replace
  marker with `STATUS.ship-ready`, move board row under `## ship-ready` in
  `PRD/work/STATUS.md` (before the completion-gate READY loop finishes).

## Completion gate

Use the race-safe READY loop in `reference.md`; never infer readiness from this work package alone. Retain and report the worktree path, and name the capture output path while the worktree still exists — cleanup removes the worktree and its captures with it.

## Quick reference

| State | Required action |
|---|---|
| Green slice | Commit, resync, reverify, push, continue |
| Ordinary progress | No PR comment |
| Push race | Rebase, reverify, retry without force |
| Exceptional event | Add the matching structured PR comment |
| Unresolved gate/conflict | Stop; no milestone push or later slice; report any local commit |

## Common mistakes

- Stopping after one slice: this skill owns all remaining slices.
- Sharing one local branch across worktrees: use unique contributors pushing to one remote branch.
- Trusting pre-rebase tests or posting routine comments: reverify; let commits show progress.
- Merging into the recorded autonomous base or running cleanup: both remain human-controlled.

## Next step

PR ready → review and merge manually. After the feature ships → `/thejudge-cleanup PRD/work/<slug>/` (`$thejudge-cleanup` in Codex) — package should already be `ship-ready`.
