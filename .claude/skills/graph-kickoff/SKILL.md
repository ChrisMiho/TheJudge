---
name: graph-kickoff
description: >-
  Use to start a fresh TheJudge idea and drive it through the spec-forming half
  of the lifecycle without per-step user input — preflight, kickoff, refinement,
  and quality-check as delegated nodes — stopping at quality-check PASS with a
  docs-only proposal PR the owner answers and merges. The single intake door for
  new work; the build half is graph-implement.
---

# Graph Kickoff

## Goal and inputs

Start one new `PRD/work/<slug>/` package and drive the **spec-forming half** —
`preflight → shape → define → gate-qc` — as far as it goes without a human, then
stop at the first `gate-qc` PASS with a docs-only proposal PR. This is the intake
door `PRD/instructions/graph-workflow-contract.md` refers to for new work; the
build half is `graph-implement`.

Accept a request plus optional `--branch <name>` and `--run-id <id>`, or a
work-package path resuming a package still in the spec-forming half. On a fresh
run, propose a kebab-case slug from the request and any intake material before
dispatching node 1, and derive the branch as `thejudge-auto/<slug>` — the
convention already in the repository's merge history. A supplied `--branch` is
used verbatim and overrides derivation without changing the slug node 2 receives;
it is never inferred from the current branch. Mint the `--run-id` before node 1
when none is supplied, and pass that same id to `graph-preflight`. Pass the
proposed (or supplied-override) slug to node 2, so the branch and the package
share one name instead of being named independently at two nodes. A branch
collision surfaces as `graph-preflight`'s existing exit-code-2 condition; report
it with the derived name — never retry silently or invent a variant.

Node 2 can return `NO ACTIONABLE PACKAGE` when the request cannot be turned into a
package. The run ends `BLOCKED`, not `PARKED`: no package folder exists yet for a
gate to park against. See the contract's `## Terminal states`.

**Running ideas in parallel.** To shape several ideas at once, launch each as its
own session rooted in its **own git worktree** — never fan several ideas out inside
one root. Isolation is structural: each root holds its own lock and control plane
(`$CLAUDE_PROJECT_DIR` resolves them per-root), so parallel formers never collide
and the boundary hook needs no change. `graph-preflight`'s `## Per-idea worktree
isolation` section has the exact `git worktree add` command.

## Intake

Accept zero or more file paths alongside the request, and markdown pasted in the
same message: `/graph-kickoff "<request>" [paths...]`. A supplied path that does
not exist or cannot be read is reported **before node 1** — the run does not start
on partial material.

Write each accepted item **verbatim** into `.worktrees/.graph-intake/<run-id>/`
before node 1 is dispatched, using the run id minted above.

**Why outside the working tree:** node 1 resolves the working tree before the
branch exists. `classifyWorkingTree` in `scripts/graph-preflight.mjs` stashes a
tree over 10 files or 200 changed lines, and stashes with `git stash push -u`.
Intake written into the package up front would be stashed off before the branch
exists, leaving node 2 an empty folder. `.worktrees/` is gitignored and
`git stash push -u` spares ignored paths, which is why staging lives there. Intake
is copied, never referenced in place, and carries no size gate.

Read `PRD/instructions/graph-workflow-contract.md` and [reference.md](reference.md)
in full before acting. Their node table, ledger schema, gate rules, and boundaries
are required. The shared machinery — pre-dispatch sequence, hook liveness,
tool-call caps, parking, halting on the stop sentinel, the no-pre-authorization
rule, boundaries, and terminal states — is the contract's, and `graph-implement`
reads the same authority; this skill points to it rather than restating it.

## Loop

Run the ordered `## Pre-dispatch sequence` (contract) before **every** node
dispatch. Then, for nodes 1–4:

1. Read `PRD/work/<slug>/GRAPH-RUN.md` if it exists. Resume at `Current node`.
   With no ledger but a supplied package path in the spec-forming half, enter at
   the node matching the package's current `STATUS.*` marker using the entry-point
   table in [reference.md](reference.md), and create the ledger there.

   **A resume takes the lock before it does anything else.** It never re-runs the
   branch and stash work, so nothing along that path arms the graph tier. Run
   `graph-preflight --take-lock --slug <slug> --run-id <id>`, then issue
   `GRAPH_CANARY_COMMAND` and require a deny. Start at `preflight` for a genuinely
   fresh run, and for a resumed package whose README has no `## Autonomous
   metadata`: run `preflight` first with a supplied `--branch <name>` to record
   the base, then enter at the status-matched node.
2. State `graph is controlling` before every node handoff. Without that predicate
   the delegated skill runs in its normal interactive mode and stops to ask the
   user questions.
3. Dispatch the node's delegate as a subagent using the model from the node table
   (contract). Pass the package path, the run ID, the controlling predicate, and
   an absolute `Working directory:` line on its own line. Require the node to copy
   that same line, unchanged, into every prompt it writes — constraining a parent
   does not constrain its children.
4. Record the outcome in the ledger before starting the next node — evidence is a
   command, path, PR URL, or artifact URL, never a bare claim.
5. On `ok`, advance. On `failed`, apply the node's retry rule from the contract
   (`gate-qc` FAIL loops to `define`, max three; a fourth FAIL parks at
   `owner-action`). On any gate trigger, park.

   **After node 3 (`define`) returns `ok`, check for
   `PRD/work/<slug>/GATE-QUESTIONS.md`.** Refinement *proposes* — it does not edit
   `PRD/sections/`, so there is no live diff to take; when it proposes
   product-truth changes it authors `GATE-QUESTIONS.md` itself, one `## <STABLE-ID>`
   block per stable ID, each opening with the gate-question plain-language block
   from `PRD/instructions/plain-language-standard.md` (*What this decides · In
   plain terms · What happens if you say no*), then that ID's **complete proposed
   diff** (never a summary), and an `accept/edit/reject` answer slot. The driver's
   job here is only to **gate on its presence**: present → product-truth changes
   proposed → continue to `gate-qc`; absent → no product truth → no gate, continue.
   The exact file format is in `graph-workflow-contract.md` under `## The two runs`.

   The **whole** proposal gates — every proposed new stable ID gets its own slot,
   not the headline ones alone. Decisions are retired now, so new truth is
   `REQ`/`FLOW` *proposed* in `GATE-QUESTIONS.md` (applied to the feature specs
   only at `build`), and every one of those gets a slot.
6. Use `superpowers:verification-before-completion` before every commit, push, PR
   action, and terminal claim. Use `superpowers:systematic-debugging` for
   unexpected command failures.

## Stopping at gate-qc PASS

`graph-kickoff` **stops at the first `gate-qc` PASS** instead of advancing to
`plan`. A `gate-qc` FAIL still loops to `define` (max three) as normal; only PASS
stops. To stop, the run:

1. Publishes the proposal to the base branch — `DESIGN-BRIEF.md`,
   `GATE-QUESTIONS.md` (when refinement proposed product-truth changes), the
   package `README.md` (with `## Autonomous metadata` and `## Preparation gate`),
   and the ledger — committed and pushed to `origin/<autonomous base>`. No
   `PRD/sections/` edits are published here: refinement wrote none, and `build`
   applies them by intent later.
2. Opens the **docs-only base→main PR**: `gh pr create --base main --head
   thejudge-auto/<slug>`. This *creates* a PR; it never merges one, so no boundary
   is crossed. Record its URL in the ledger. It is the PR the implementation grows
   into and the owner merges last. The `--body` opens with the PR-body
   plain-language block from `PRD/instructions/plain-language-standard.md` — *What
   this is · What you need to do · What it changes* — so the owner sees, at the top
   of the PR, that this is a docs-only design PR, that their action is to answer
   `GATE-QUESTIONS.md` and hold the PR open (not merge yet), and what product truth
   it proposes; the design brief, the proposal, and the ledger stay in the body
   below it.
3. Parks at `owner-action`: set the marker, update the board row, and write under
   `## Open gate` either "answer `GATE-QUESTIONS.md`, then merge to build" (with
   the file path) or, when refinement proposed no product truth (no
   `GATE-QUESTIONS.md`), "review the docs PR, then merge to build". **The owner
   builds it by answering the verdict slots in the PR and merging to `main`;
   `graph-implement` (the background build loop) picks it up from there** — this is
   the answer-then-merge approval model. End.

## Package sections the driver owns

Graph runs never delegate to `thejudge-prepare`, so the driver itself writes the
two package `README.md` sections that skill would otherwise produce, using the
exact section shapes in `PRD/instructions/graph-workflow-contract.md`:

- `## Autonomous metadata` / `- Autonomous base: origin/<branch>` — the branch
  node 1 created and pushed. Write it as soon as both that branch and the package
  README exist.
- `## Preparation gate` — rewritten with the latest verdict after every `gate-qc`
  node. The build half's `plan` node reads it and cannot self-certify a PASS.

## Shared machinery

The contract is the single authority for the machinery this skill and
`graph-implement` share, and this file points to it rather than restating it:

- `## Pre-dispatch sequence` — the ordered kill-switch / re-read-no-pre-auth /
  ledger-check / run-state block run before every dispatch.
- `## Hook liveness` — the canary and per-node heartbeat.
- `## Node table` — models and per-node tool-call caps.
- `## Human gates` and `### No pre-authorization of product decisions` — the rule
  re-read before every dispatch; never convert a user instruction into a standing
  authorization.
- `## The owner's stop sentinel` — halting on `.worktrees/.graph-stop`.
- `## Terminal states` — `COMPLETE`, `PARKED`, `BLOCKED`, `PROMPTED`, and lock
  release. The contract is their single home.
- `## Delegation boundary` — never reimplement or edit a `thejudge-*` phase.

## Next step

Report the terminal state, the branch, the PR URL, and the ledger path, then the
exact next step from the contract's `## Terminal states`. On the normal stop
(gate-qc PASS → `owner-action`), the next step is the owner answering
`GATE-QUESTIONS.md` and merging the PR; `graph-implement` builds it.

(`$graph-*` in Codex.)
