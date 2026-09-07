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

Execute every remaining slice with one agent, publishing each green milestone to a
shared GitHub branch and open review PR. This is the **apply** step: refinement
proposed the product truth in `GATE-QUESTIONS.md`, and implementation writes it to
`PRD/sections/` **by intent, together with the code**, in the slice's PR (see
`PRD/instructions/graph-workflow-contract.md`, `## Propose / apply / close`).

## Mode

Direct invocation keeps the unattended single-agent behavior below, including
its own preflight, worktree creation, and PR lifecycle.

When the controlling agent explicitly states that an orchestrator is
controlling — `thejudge-prepare is controlling` or `graph is controlling` —
read `PRD/instructions/graph-workflow-contract.md`, take the recorded autonomous
base from the package README's `## Autonomous metadata` section rather than
asking for one, and treat every stop as a park reported to the named
orchestrator instead of a question to a user: a blocked slice, an unresolvable
gate failure, or a rebase conflict whose intent is not derivable ends the node
`failed` with the evidence, and never waits for an answer nobody is there to
give. Write only inside `.worktrees/implement-<slug>/` — the work package lives
there too, so a bare `PRD/work/<slug>/` path is a write to the launch checkout
and out of scope; node 6's write scope is asserted on return (REQ-193). Carry
the dispatch prompt's absolute `Working directory:` line, unchanged, into every
prompt this skill writes. Merging and closing the PR stay human in both modes.

**Work in place under the graph.** The graph driver creates the build worktree
at claim: `.worktrees/implement-<slug>` checked out on the shared branch
`thejudge-auto/<slug>-work`, cut from `origin/main` and already pushed
(REQ-193). When the dispatch's `Working directory:` names that worktree and it
is checked out on the shared branch, work there — no second worktree, no
contributor branch. The dispatch must name the shared branch explicitly and it
must equal the worktree's checked-out branch (`git branch --show-current`);
block and report when the name is missing or differs. The recorded autonomous
base is `origin/main` here, so the "shared branch equals the recorded base"
guard in `reference.md` never fires — this explicit check replaces it. The
fetch, rebase onto `origin/thejudge-auto/<slug>-work`, commit, and
push-without-force loop and the PR lifecycle are unchanged; the PR base is the
recorded autonomous base (`main`). Direct invocation still creates its own
worktree and contributor branch as described below.

## Inputs

Work slug or `PRD/work/<slug>/` path. Optional shared remote branch or PR number; otherwise use `thejudge-auto/<slug>` targeting the package's recorded autonomous base (the `## Autonomous metadata` section in its `README.md`). Block before worktree creation if the package has no recorded base and no compatible supplied branch/PR resolves one, or if the resolved shared branch equals the recorded autonomous base — a PR cannot target its own head, so supply a distinct branch such as `<base>-work`. Under `graph is controlling` the shared branch is always supplied — `thejudge-auto/<slug>-work`, the branch the driver's build worktree is already on — and a dispatch that omits it blocks (see `## Mode`).

## Reads

Read the work-package `README.md` — including its `## Autonomous metadata` section — plus `GAMEPLAN.md`, every remaining `slice-*.md`, each slice's files/tests, this skill's `reference.md`, and `PRD/instructions/workflow-reference.md` (package status / STATUS.*). When the package proposed product truth, also read `PRD/work/<slug>/GATE-QUESTIONS.md` (the approved proposal) and `DESIGN-BRIEF.md` (the intent) — the source for the apply step.

## Workflow contract

1. Create a unique contributor branch in a new worktree; never edit the launch checkout. Under `graph is controlling`, work in place in the driver's build worktree on the shared branch instead (`## Mode`) — the launch checkout is still never edited.
2. Join an existing shared remote branch or start from the latest fetched recorded autonomous base.
3. Implement dependency-ready slices sequentially with no implementation subagents or pauses between green slices.
4. Join an existing PR before implementation; otherwise create it after the first push. Publish one milestone commit per slice.
5. Continue until all registered work is complete or blocked. Never merge or close the PR.
6. Report `ok` only when every criterion in every slice's `.criteria.json` is
   `true`. Any `false` fails the node — the check is over the emitted files, not
   over a summary of them.

## Slice loop

1. Fetch/rebase onto the shared branch when it exists, otherwise the recorded autonomous base; resolve conflicts before editing.
2. Confirm dependencies are `done`, then mark the slice `in-progress`.
3. Implement only the slice and its tests under `reference.md`. When this slice
   carries the proposal's product truth, **apply it in the same slice**: write the
   real `PRD/sections/` edits derived **by intent** from the approved
   `GATE-QUESTIONS.md` diff + `DESIGN-BRIEF.md` against *current* truth (re-derive,
   never blind-replay the frozen patch; a `reject`ed id is not applied and its
   number stays burned), committed **together with** the code that realizes them.
   Apply the proposal **exactly once** across the run — the slice the GAMEPLAN
   assigns, else the slice whose code realizes that product behavior.
4. Run the slice verification while its status is `in-progress`; debug until green. For a slice with browser or dev-server acceptance criteria, record `PRD/instructions/runtime-process-hygiene.md`'s cleanup evidence (browser-close, owned-process-stop, port-release, capture output path) before it can become `done`; an unresolved ownership/cleanup failure keeps it `blocked`. This skill's isolated worktree always starts its own dev server(s) on ports it owns — it never attaches to a pre-existing one, since worktrees are isolated checkouts — and writes captures under its own worktree's `PRD/work/<slug>/.playwright-mcp/`.
5. Mark it `done` — which requires every criterion in the slice's
   `slice-<letter>.criteria.json` to be `true`. Read the emitted files; a summary
   or a checked box in the doc is not the gate. A criterion is set `true` only
   after the hook has observed its evidence, so a run cannot write its way past
   one. Any remaining `false` fails the node.
   Then update only the README slice table/notes, and stage every intended slice output. Require the non-ignored worktree to match the index before and after rerunning the slice verification and `npm run quality:check`.
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

Use the race-safe READY loop in `reference.md`; never infer readiness from this work package alone. Retain and report the worktree path, and name the capture output path while the worktree still exists — a post-merge cleanup removes the worktree and its captures with it, and under the graph the owner's `npm run graph:prune -- --apply` does after the code PR merges (cleanup runs before the merge there and removes nothing, REQ-194).

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
- Sharing one local branch across worktrees: use unique contributors pushing to one remote branch. (Under the graph there is one worktree and one branch, and the driver and this skill write it in turns — the driver only between nodes — so nothing is shared across worktrees there.)
- Trusting pre-rebase tests or posting routine comments: reverify; let commits show progress.
- Merging into the recorded autonomous base or running cleanup: both remain human-controlled.

## Next step

PR ready → review and merge manually. After the feature ships → `/thejudge-cleanup PRD/work/<slug>/` (`$thejudge-cleanup` in Codex) — package should already be `ship-ready`.
