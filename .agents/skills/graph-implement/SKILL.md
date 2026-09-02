---
name: graph-implement
description: >-
  Use to build an approved-and-merged TheJudge spec without per-step user input —
  resolving the answered gate, then map-out, implementation, and review as
  delegated nodes — opening a code PR the owner merges. Runs as a single
  background loop that watches local main and drains the approved queue one spec
  at a time. The build half of the graph workflow; the spec-forming half is
  graph-kickoff.
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

## The build loop

`graph-implement` runs as a **single, self-paced background loop** — invoked as
`/loop graph-implement` (no interval; it paces itself) — that drains the approved
queue one spec at a time. A single `/graph-implement PRD/work/<slug>/` still builds
one named spec; the loop is the same build applied to every ready spec in turn.

Each tick:

1. **Sync.** `git fetch origin`; read local `main`.
2. **Find a ready spec.** Scan `PRD/work/*/` **on `main`** for a spec that is
   *ready to build*: its `STATUS.refined` marker is present, every
   `GATE-QUESTIONS.md` verdict slot is answered (no blank), and no code has been
   built for it yet. That state **is** the queue — there is no separate ready-file.
   A `GATE-QUESTIONS.md` with any blank slot is **not ready** and is skipped
   (the owner has not finished approving it).
3. **Claim it.** Set `STATUS.active` for that slug **first**, as the single claim
   point, and commit that transition. This is the idempotency guard: a second tick,
   or a loop restart, sees `STATUS.active` (not `refined`) and never double-picks
   the same spec. Never double-build, never miss.
4. **Build it.** Branch off fresh `main` in the spec's own worktree, then run the
   build half — `graph-gate-review` (finalize verdicts) → re-enter at `gate-qc` →
   `plan → build → review` — and open the code PR that grows from the spec PR the
   owner merged. `land` stays human.
5. **Park one, continue.** If that build parks (a gate blocker, a per-node cap, a
   `gate-qc`/`review` loop-limit), the slug stays at `owner-action` and the loop
   moves on to the **next** ready spec. One parked build never stalls the queue.
6. **No ready spec** → report "no ready spec" and hold (schedule the next tick) or
   stop; never spin.

**Approval is answer-then-merge.** A spec becomes ready only after the owner
answers its verdict slots in the spec PR and merges it to `main` — the merge is the
"build it" signal. A merge is not blanket-accept: `graph-gate-review` applies the
owner's per-ID verdicts before `plan`.

**Pacing.** Under `/loop graph-implement`, end each tick by scheduling the next
(`ScheduleWakeup` with the same `/loop` input); when the queue is empty and no work
is expected, stop instead. The stop sentinel halts the loop at a spec boundary
(see `## Loop safety`).

## Loop safety

The loop runs unattended and longest, so it carries the same rails a single run
does — all sourced from the contract, applied per build:

- **Kill switch, at a spec boundary.** The stop sentinel `.worktrees/.graph-stop`
  halts the loop: the in-flight build finishes at its node boundary, no next spec
  is picked up, and no ledger is left half written. This extends the contract's
  `## The owner's stop sentinel` to the loop — the sentinel already halts a single
  run at a node boundary; here it also stops the loop from claiming the next spec.
- **Liveness proven per build.** The hook-liveness canary at build start and the
  per-node heartbeat (contract `## Hook liveness`) run for **every** build the loop
  performs, not once for the loop as a whole. A failed proof ends **that build** at
  `BLOCKED` and the loop does **not** silently continue past an unproven enforcer:
  the affected slug stops, and the loop halts rather than building the next spec on
  a hook it cannot prove is firing.
- **Caps per build.** The per-node tool-call caps (contract `## Node table`) apply
  per build exactly as for a single run; a cap overrun parks that build's slug at
  `owner-action` and the loop continues to the next ready spec.
- **Subagent fan-out is off by default.** Splitting a build across helper subagents
  to go faster is an opt-in knob, off by default. When it is on, the per-run token
  cost is written to that run's `GRAPH-RUN.md` ledger, so the owner can weigh cost
  deliberately.
- **Bounded and fail-closed.** The loop stops rather than spinning when there is no
  ready spec, and a liveness or lock failure ends the affected build rather than the
  whole repository. It uses no denied backgrounding primitive (`nohup`, untracked
  background `&`, `pkill`, `killall` stay denied); all sentinel and counter state
  lives under the already-ignored `.worktrees/` root. No fifth terminal state is
  added — the loop reuses `BLOCKED`/`PARKED` per build.

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
