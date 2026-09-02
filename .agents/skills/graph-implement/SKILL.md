---
name: graph-implement
description: >-
  Use to build an approved-and-merged TheJudge spec without per-step user input —
  resolving the answered gate, then map-out, implementation, and review as
  delegated nodes — opening a code PR the owner merges. The build half of the
  graph workflow; the spec-forming half is graph-kickoff. (Slice B turns this into
  a background loop over the approved queue.)
---

# Graph Implement

## Goal and inputs

Build one approved spec: resolve its answered `define` gate, then drive
`plan → build → review → land → close`, opening a code PR the owner merges. This
is the build half `PRD/instructions/graph-workflow-contract.md` refers to; the
spec-forming half is `graph-kickoff`.

Accept `/graph-implement PRD/work/<slug>/` resuming an `owner-action` park whose
`GATE-QUESTIONS.md` the owner has answered and merged. **Approval is
answer-then-merge:** the owner fills the accept/edit/reject slots in the spec PR
and merges to `main`; that merge is the "build it" signal. This skill finalizes
the verdicts and builds.

Read `PRD/instructions/graph-workflow-contract.md` and [reference.md](reference.md)
in full before acting. The shared machinery — pre-dispatch sequence, hook
liveness, tool-call caps, parking, halting on the stop sentinel, the
no-pre-authorization rule, boundaries, and terminal states — is the contract's,
the same authority `graph-kickoff` reads; this skill points to it rather than
restating it.

## Resolving the gate

On resuming an `owner-action` park, resolve the gate before re-entering the node
graph:

- **`GATE-QUESTIONS.md` fully answered** → dispatch `graph-gate-review` to apply
  the accept/edit/reject verdicts inside the proposal. It restores
  `STATUS.refined`. Then re-enter at `gate-qc` via the entry-point table
  ([reference.md](reference.md)), so an owner edit is re-graded, and continue
  `plan → build → review → land → close`.
- **any answer slot still blank** → re-park at `owner-action` unchanged and end.
  The gate is not resolved, so nothing is guessed.
- **no `GATE-QUESTIONS.md`** (refinement proposed no product truth) → nothing to
  apply; restore `STATUS.refined`, re-enter at `gate-qc`, and continue.

The base→main PR opened by `graph-kickoff` stays the owner's to merge and stays
open across both halves; this skill never merges it.

## Loop

Run the ordered `## Pre-dispatch sequence` (contract) before **every** node
dispatch. Then, for nodes 5–9:

1. Take the lock before anything else: `graph-preflight --take-lock --slug <slug>
   --run-id <id>`, then issue `GRAPH_CANARY_COMMAND` and require a deny. A resumed
   run never re-runs the branch and stash work, so nothing else arms the graph
   tier.
2. State `graph is controlling` before every node handoff.
3. Dispatch the node's delegate as a subagent using the model from the node table
   (contract), except node 8 (`land`), which the driver never dispatches — see
   [reference.md](reference.md). Node 7 is not a skill: it is a no-write reviewer
   subagent whose exact dispatch shape is in [reference.md](reference.md). Pass the
   package path, the run ID, the controlling predicate, and an absolute `Working
   directory:` line on its own line. Require the node to copy that line unchanged
   into every prompt it writes.

   After node 6 (`build`) returns, assert every path it wrote lies inside
   `.worktrees/implement-<slug>/` or `PRD/work/<slug>/`. Anything outside that set
   **fails the node and parks**, with the offending paths as the evidence.
4. Record the outcome in the ledger before starting the next node — evidence is a
   command, path, PR URL, or artifact URL, never a bare claim.
5. On `ok`, advance. On `failed`, apply the node's retry rule from the contract
   (`review` loops to `build`, max two; a third parks). On any gate trigger, park.
6. Use `superpowers:verification-before-completion` before every commit, push, PR
   action, and terminal claim. Use `superpowers:systematic-debugging` for
   unexpected command failures.

## Applying product truth at build

Node 6 (`build`, `thejudge-implement-all`) **applies** the approved proposal: it
writes the real `PRD/sections/` truth **by intent** — re-derived from the finalized
`GATE-QUESTIONS.md` diff and `DESIGN-BRIEF.md` against current truth, never a
blind replay; a `reject`ed id stays burned — **together with the code**, in the
slice's PR. This is the one place durable product truth is written.

## Package sections the driver owns

`## Preparation gate` is rewritten with the latest verdict after every `gate-qc`
node; the `plan` node reads it and cannot self-certify a PASS. Use the exact
section shape in `PRD/instructions/graph-workflow-contract.md`.

## Shared machinery

The contract is the single authority for the machinery this skill and
`graph-kickoff` share; this file points to it rather than restating it:

- `## Pre-dispatch sequence`, `## Hook liveness`, `## Node table` (models + caps),
  `## Human gates` / `### No pre-authorization of product decisions`, `## The
  owner's stop sentinel`, `## Terminal states` (the contract is their single
  home), and `## Delegation boundary`.

## Next step

Report the terminal state, the branch, the PR URL, and the ledger path, then the
exact next step from the contract's `## Terminal states`. On reaching `land`, the
run parks: the owner merges the code PR, then a later `/graph-implement
PRD/work/<slug>/` records `land` as `ok` and continues to `close`.

(`$graph-*` in Codex.)
