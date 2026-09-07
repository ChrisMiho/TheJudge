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
`plan → build → review → close → land`, opening a code PR into `main` that the
owner merges. The build half works in **one folder on one branch** —
`.worktrees/implement-<slug>` on `thejudge-auto/<slug>-work`, cut from
`origin/main` — and `close` (`thejudge-cleanup`) runs on that branch before the
owner merges, so the receipt and the package deletion ride in the code PR and a
package costs two PRs: the docs PR the owner answered and merged, then this one
(REQ-193, REQ-194). This is the build half
`PRD/instructions/graph-workflow-contract.md` refers to; the spec-forming half
is `graph-kickoff`.

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

1. **Sync.** `git fetch origin`. Read the queue from `origin/main`, never from
   the launch checkout's `main` (which is never pulled, switched, or committed to
   by this half — REQ-191's rule extended, REQ-193):
   `git show origin/main:PRD/work/` lists the packages,
   `git show origin/main:PRD/work/<slug>/` lists the marker, and
   `git show origin/main:PRD/work/<slug>/GATE-QUESTIONS.md` gives the slots.
   (git's tree-listing subcommand is not in the profile; `git show` is.)
2. **Find a ready spec.** A spec is *ready to build* when, on `origin/main`, its
   `STATUS.refined` marker is present, every `GATE-QUESTIONS.md` verdict slot is
   answered (no blank), no code has been built for it yet, **and it is not
   already claimed**: no `thejudge-auto/<slug>-work` branch exists locally
   (`git branch --list thejudge-auto/<slug>-work`) or on `origin`
   (`git ls-remote --heads origin thejudge-auto/<slug>-work`), and no
   `.worktrees/implement-<slug>` exists. That state **is** the queue — there is
   no separate ready-file. A `GATE-QUESTIONS.md` with any blank slot is **not
   ready** and is skipped (the owner has not finished approving it).

   A spec whose branch or worktree already exists is claimed. Do one of three
   things: the worktree holds `PRD/work/<slug>/` → resume from the `STATUS.*`
   marker inside it (entry-point table, [reference.md](reference.md)); the
   worktree holds no package folder and the receipt's `### Node ledger` lacks
   the `close` row → finish per the post-`close` rule in `## Next step`; the
   `close` row is present → nothing, the code PR is the owner's. A branch on
   `origin` with no local worktree (claimed from another root, or a worktree
   removed by hand) is re-created with
   `git worktree add .worktrees/implement-<slug> -b thejudge-auto/<slug>-work origin/thejudge-auto/<slug>-work`
   — the one allowed form that also creates the local tracking branch — and
   resumed. `BLOCKED` is reserved for a path that exists but is not a usable
   worktree.
3. **Claim it — the branch is the claim.** First deal with the kickoff worktree
   the spec-forming half left behind (REQ-191): when
   `cd .worktrees/kickoff-<slug> && git status --porcelain` is empty, run
   `git worktree remove .worktrees/kickoff-<slug>` (never `--force`); when it is
   dirty, report the path and **skip this spec unclaimed** — no branch, no
   worktree, nothing pushed — so the owner can commit or discard the work and
   the next tick claims cleanly. Leave the local `thejudge-auto/<slug>` branch
   alone: this half never uses it again (REQ-194), and `npm run graph:prune`
   lists it once merged.

   Then cut the build worktree and publish it:

   ```
   git worktree add .worktrees/implement-<slug> -b thejudge-auto/<slug>-work origin/main
   ```

   Commit the claim as the branch's first commit — the package README's
   `## Autonomous metadata` rewritten to `- Autonomous base: origin/main`
   (the branch the package's next PR targets), and the ledger header's
   `- Worktree: <root>/.worktrees/implement-<slug>` and
   `- Autonomous base: origin/main` lines — with
   `cd <root>/.worktrees/implement-<slug> && git add <paths> && git commit …`,
   then `git push -u origin thejudge-auto/<slug>-work` from inside it. The
   commit does **not** touch the `STATUS.*` marker: it stays `refined` until
   `plan` sets `active`, exactly as the entry-point table expects, so a resume
   between claim and `plan` enters at gate resolution or `gate-qc` and never
   skips the owner's verdicts. A second tick, or a loop restart, sees the branch
   and never double-picks the same spec. Never double-build, never miss.
4. **Build it.** Every build-half node — gate resolution, `gate-qc`, `plan`,
   `build`, `review`, `close` — is dispatched with
   `Working directory: <root>/.worktrees/implement-<slug>` and works there. The
   driver writes to the branch only **between** nodes, with the same
   `cd <worktree> && git add … && git commit …` and `git push -u origin
   thejudge-auto/<slug>-work`, so the driver and the builder alternate and no
   two commits ever compete for `GRAPH-RUN.md`, the package `README.md`, the
   `STATUS.*` marker, or `PRD/work/STATUS.md`. Run `graph-gate-review`
   (finalize verdicts) → re-enter at `gate-qc` → `plan → build → review →
   close`; `build` opens the code PR `thejudge-auto/<slug>-work → main`, a
   second PR, not a continuation of the merged docs PR. `land` — the owner
   merging that PR — stays human and comes after `close`.
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
  `plan → build → review → close → land`.
- **any answer slot still blank** → re-park at `owner-action` unchanged and end.
  The gate is not resolved, so nothing is guessed.
- **no `GATE-QUESTIONS.md`** (refinement proposed no product truth) → nothing to
  apply; restore `STATUS.refined`, re-enter at `gate-qc`, and continue.

Gate resolution runs in the build worktree: `graph-gate-review` is dispatched
with the same `Working directory:` line as every other build-half node, and the
finalized `GATE-QUESTIONS.md` is committed on `thejudge-auto/<slug>-work`.

The docs PR `graph-kickoff` opened is already merged by the time this half runs
— the owner answering and merging it is the build signal. This half opens a
**second** PR, `thejudge-auto/<slug>-work → main`, and never merges anything.

## Loop

Run the ordered `## Pre-dispatch sequence` (contract) before **every** node
dispatch. Then, for nodes 5–9:

1. Take the lock before anything else: `graph-preflight --take-lock --slug <slug>
   --run-id <id>`, then issue `GRAPH_CANARY_COMMAND` and require a deny. A resumed
   run never re-runs the branch and stash work, so nothing else arms the graph
   tier.
2. State `graph is controlling` before every node handoff.
3. Dispatch the node's delegate as a subagent using the model from the node table
   (contract), except node 9 (`land`), which the driver never dispatches — see
   [reference.md](reference.md). Node 7 is not a skill: it is a no-write reviewer
   subagent whose exact dispatch shape is in [reference.md](reference.md). Node 8
   (`close`) is `thejudge-cleanup`, dispatched in the build worktree **before**
   the owner merges. Pass the package path, the run ID, the controlling
   predicate, the shared branch `thejudge-auto/<slug>-work` (node 6 requires it
   named), and an absolute `Working directory:` line —
   `<root>/.worktrees/implement-<slug>` — on its own line. Require the node to
   copy that line unchanged into every prompt it writes.

   Before dispatching node 6 (`build`), capture the launch checkout's
   `git status --porcelain`. After it returns, require that output identical,
   and require every path the node reports — relative to the launch root, or
   absolute with the root stripped — to lie inside `.worktrees/implement-<slug>/`
   (`classifyBuildWrites` in `scripts/graph-ledger-check.mjs`). The package
   folder lives inside that worktree, so a bare `PRD/work/<slug>/…` path is a
   write to the launch checkout. Anything outside **fails the node and parks**,
   with the offending paths as the evidence (REQ-193).
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

Report the terminal state, the branch, the PR URL, and the receipt path, then the
exact next step from the contract's `## Terminal states`.

**The run ends `COMPLETE` at `close`, with the code PR open.** When node 8
(`close`) returns `ok`, `PRD/work/<slug>/` is gone from the branch and the
receipt under `PRD/instructions/receipts/` carries the folded ledger, a `- PR:`
line, and `Terminal state: COMPLETE — land: the owner's merge of <PR URL>`
(cleanup writes that line). The driver appends its own `close` row to the
receipt's `### Node ledger` (the ledger file is gone; the receipt is its durable
home), commits and pushes on `thejudge-auto/<slug>-work`, releases the lock, and
ends `COMPLETE`. `land` gets no ledger row — no `Outcome` value is true of a
merge not yet made — and is recorded by GitHub when the owner merges. Nothing
resumes after the merge: the package folder is absent from `origin/main`, so the
loop never re-sees it, and `.worktrees/implement-<slug>` plus both local
branches are merged leftovers `npm run graph:prune` lists (REQ-194).

**Post-`close` resume.** A build worktree with no `PRD/work/<slug>/` inside it
is post-`close`. Read the receipt's `### Node ledger` there; append the `close`
row if it is missing (evidence: the receipt commit and the PR URL from the
`thejudge-auto:v1:registered:<slug>` marker), push, release the lock, end
`COMPLETE`. This is the one state where the ledger is read from the receipt.

(`$graph-*` in Codex.)
