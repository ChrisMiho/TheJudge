---
name: proj-implement-all
description: >-
  Use when every remaining slice in an existing <Product> GAMEPLAN should be
  completed during one unattended, single-agent session, especially for
  long-running work that must remain reviewable on GitHub. When all slices
  finish, sets STATUS.ship-ready before handoff to cleanup.
---

# <Product> Implement All

## Goal

Complete every remaining slice in one unattended run, leaving a reviewable trail
of one green commit per slice.

Only use this once your quality gate is genuinely trustworthy. Nobody is
watching.

## Inputs

A work package slug or path. A recorded base branch.

## Reads

- `PRD/work/<slug>/README.md` (including any recorded autonomous base) and
  `GAMEPLAN.md`
- Every remaining slice document
- `PRD/instructions/workflow-reference.md`
- `PRD/instructions/runtime-process-hygiene.md`
- `reference.md` in this skill folder

## Writes

- Product code and tests
- One milestone commit per completed slice
- A shared remote branch and a review PR, kept updated as the run proceeds
- Slice and package status signals

## Setup

1. Create an isolated worktree at `.worktrees/implement-<slug>`.
2. Create a contributor branch targeting the recorded base. Never guess the
   base — require it explicitly.
3. Push and open a review PR after the first milestone, or join the existing one.

## Slice loop

For each remaining slice, in dependency order:

1. Fetch and rebase onto the shared branch head.
2. Confirm prerequisites are `done`.
3. Set the slice to `in-progress`.
4. Implement within scope.
5. Run the slice's verification; record evidence, including runtime cleanup for
   browser-risk slices.
6. Set the slice to `done`.
7. Stage everything, including the updated slice document.
8. Run `<quality-command>`. It must be green before the commit exists.
9. Commit as `feat(<slug>): complete slice <letter>` and push without force.

On a push race: fetch, rebase, re-verify, retry. Never force-push.

## Completion

When every slice is `done`, set the package to `ship-ready` and update the PR
title to signal it is ready for review.

## Status transitions

Package stays `active` while slices remain; `ship-ready` when the last one is
`done`.

## Gates

- Never merge or close the PR. A human does that.
- Never force-push.
- Never skip the quality gate to keep the loop moving.
- Never start a slice whose prerequisites are unfinished.
- On an unresolvable blocker: stop, write the slice handoff block, and report on
  the PR. Do not attempt the next slice.

## Next step

Review and merge the PR manually. After the feature ships, run
`/proj-cleanup PRD/work/<slug>/` — the package should already be `ship-ready`.
