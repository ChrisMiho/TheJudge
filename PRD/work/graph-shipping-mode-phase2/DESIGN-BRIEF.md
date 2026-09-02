# Design brief — graph-shipping-mode-phase2

## The one-line

Split the autonomous graph run into two decoupled tools joined by `main`: a
**parallel spec-former (`graph-kickoff`)** you can run on several ideas at once,
and a **single background build loop (`graph-implement`)** that drains the
approved queue while you're away. You approve a spec by answering its verdict
slots and merging its PR; the loop takes it from there. `land` stays a human
merge.

Depends on [[graph-shipping-mode-phase1]] — **merged** (PR #158). The
propose/apply split it landed is the foundation this builds on.

## What the owner experiences

Today a graph run is one package, one at a time, holding one global lock, and
"run two" (build) is a command you type. After this:

- **Shape many ideas at once.** Each `graph-kickoff` runs in its own worktree
  off one shared base branch and holds its own lock, so parallel formers never
  share a checkout and never collide — each writes only its own work folder.
- **Merging is the build signal.** You fill the `accept/edit/reject` slots in a
  spec's `GATE-QUESTIONS.md` inside its PR, then merge it into `main`. You never
  type a build command again.
- **The queue drains itself.** `graph-implement` runs in the background, one
  spec at a time, branching off fresh `main` for each and opening a code PR you
  merge. A build that parks doesn't stall the queue — that one slug goes to
  `owner-action` and the loop moves to the next ready spec.

## Decisions

Each decision below was made with the owner in this refinement session.

- **DEC — Skill names.** The two headline pieces are renamed to stage-verbs:
  `graph-run` retires; its run-one role becomes **`graph-kickoff`** (spec-former,
  the new intake door) and its run-two role becomes **`graph-implement`** (the
  background build loop). `graph-preflight` and `graph-gate-review` keep their
  names. The `graph-` prefix stays — the weirdness was "run" (a mechanism), not
  "graph"; renaming the verb fixes it without churning the contract, the
  `whatIsGraph/` docs, or the receipts.
- **DEC — Approval is answer-then-merge.** The owner fills the per-ID
  `accept/edit/reject` slots in `GATE-QUESTIONS.md` in the spec PR, then merging
  into `main` is the "build it" signal. Merge alone is **not** blanket-accept;
  the owner's verdicts still govern. `graph-implement` runs `graph-gate-review`
  to finalize the verdicts before building, exactly as run-two does today.
- **DEC — Ready-detection reuses `STATUS.*`, adds no new marker.** A merged spec
  leaves `PRD/work/<slug>/` on `main` at `STATUS.refined` with every
  `GATE-QUESTIONS.md` slot answered (no blank) and no code built yet. That state
  *is* the queue. The loop sets `STATUS.active` when it picks one up (so it is
  never double-built) and `thejudge-cleanup` deletes the folder when the code PR
  ships (so it is never re-seen). Idempotency comes from the existing status
  vocabulary, not a bespoke ready-file.
- **DEC — A parked build parks one, the loop continues.** A gate, cap, or
  blocker in one build sends that slug to `owner-action`; `graph-implement`
  proceeds to the next ready spec. One bad build never stalls the queue.
- **DEC — Isolation is per-worktree-session, not per-run re-keying.** The boundary
  hook and scripts resolve every control file (`.worktrees/.graph-run.lock`,
  run-state, node-calls) relative to `$CLAUDE_PROJECT_DIR`, which is fixed when a
  session launches (`graph-boundary-hook.mjs:71`). So concurrency is achieved by
  launching **each idea as its own session rooted in its own worktree** — then
  each root has exactly one lock and one control plane, and the runs are
  structurally isolated. **The boundary hook needs no change**, and the lock
  filename and keying stay exactly as they are (one lock per root, still
  preventing two runs in the same checkout). The "hook picks which run" problem
  only exists if N ideas are fanned out *inside one root* — which this design
  does not do. `graph-implement` is one session (its own root) building one spec
  at a time.
- **DEC — Preflight branches into a per-idea worktree.** Today preflight mutates
  the launch checkout (auto-commit/stash, branch off main). For an isolated idea
  it instead creates and works inside its own worktree, leaving the launch
  checkout untouched, so parallel ideas never contend on main's working tree.
- **DEC — Launch model (default, confirm at the concurrency slice).** A parallel
  idea is started as its own `claude` session inside its worktree — a thin
  launcher (or preflight) creates the worktree and the session roots there. This
  is deferred: the first shippable slices (rename + build loop) need none of it.
- **DEC — Subagent/parallel fan-out stays a knob, off by default.** Inside a
  build, fan-out is opt-in with per-run cost logged to the ledger, so the owner
  can explore cost impact deliberately rather than paying for it silently.

## Scope

Agent-workflow only — **no game behavior changes**. The product truth this
touches is the autonomous-workflow guarantees in `PRD/sections/` (REQ-152…160)
and the contract/skills that realize them.

In scope:

1. **`graph-kickoff`** — the spec-former, made runnable many-at-once via
   per-worktree-session isolation: preflight branches into a per-idea worktree,
   the session roots there, and the lock stays one-per-root (no re-keying, no
   hook change). Opens the proposal PR. The new intake door for a fresh idea.
2. **`graph-implement`** — the new background build loop: watches local `main`,
   detects approved-but-unbuilt specs via `STATUS.refined` + fully-answered
   `GATE-QUESTIONS.md`, runs `graph-gate-review → plan → build → review` for one
   at a time, opens a code PR, parks-one-continues on failure.
3. **Loop safety** — the stop sentinel halts the loop at a spec boundary; the
   hook-liveness canary/heartbeat and per-node caps apply to each build; the
   subagent knob is off by default with cost logged.
4. **Contract + skills + REQ truth** — rename `graph-run`; per-run locking; the
   loop; ready-detection; carried-over safety guarantees.

## Non-goals

- No **"ship multiple specs together"** grouping. Each idea is its own package
  and its own PR; per-idea sessions dissolve the batching problem.
- **`land` stays a human merge.** No auto-merge of any PR — spec or code.
- No **concurrent builds** in this package. `graph-implement` is single and
  sequential; multi-build concurrency is a later phase, gated behind the
  off-by-default fan-out knob's cost findings.
- No **`STEER.md`** mid-run instruction channel (already out of scope per
  REQ-154).

## Product-truth proposal

Recorded in `GATE-QUESTIONS.md` (this work folder), not written to
`PRD/sections/`. Implementation applies the approved proposal at build.

- **New:** REQ-170 (concurrent `graph-kickoff` via per-worktree-session
  isolation; preflight into a per-idea worktree; no hook change), REQ-171 (the
  `graph-implement` background build loop + ready-detection + park-one-continue),
  REQ-172 (loop safety: kill switch, liveness, bounds, fan-out knob).
- **Edited where existing text now reads false:** REQ-154 (kill switch also halts
  the loop), REQ-159 (liveness proof applies to each loop build), REQ-160 (the
  door is `graph-kickoff`; `graph-implement` is the build entry; `graph-run`
  retires). **REQ-153 needs no edit** — its "graph tier fires while a run holds
  `.worktrees/.graph-run.lock`" is still true per-root, since isolation comes from
  separate roots, not lock re-keying.

No new `FLOW-###`. The decision log is retired, so no new `DEC-###` — the `DEC —`
lines above are brief-local design decisions, not decision-log entries.

## Open risks and downstream breakage

- **The rename surface is wide** (confirmed by code survey). `graph-run` is named
  across the contract (~30 refs), both skill trees, `AGENT-SKILLS.md` (diagram +
  "three graph-* skills"), `OPERATOR.md`, `PRD/README.md`, tests
  (`graph-digest.test.mjs`, `graph-preflight.test.mjs` reads
  `graph-run/SKILL.md`), and fixtures under `skill-fixtures/graph-run/`. Map-out
  gives the rename its own slice.
- **`overnight-codehealth` breaks on the rename and hard-codes the assumptions.**
  It drives `graph-run`, hard-codes the two-run mechanic, and asserts "one graph
  run at a time." It must be updated in this package: point it at `graph-kickoff`
  + `graph-implement`, and revisit its one-at-a-time rule under per-worktree
  isolation.
- **The `graph-run is controlling` predicate** is read by all six delegated
  `thejudge-*` phase skills. Decision (map-out mechanics): keep **one** shared,
  renamed predicate emitted by both new skills — so the phase skills change only
  the token, not their logic — rather than two predicates that touch every phase
  skill's branches.
- **Shared machinery between the two skills.** ~7 SKILL.md sections (parking,
  pre-dispatch, hook liveness, tool-call caps, halting, delegation boundary,
  permission profile) are needed by both `graph-kickoff` and `graph-implement`.
  Extract a shared `graph` reference doc rather than duplicate — the contract
  repeatedly warns against duplicated truth.
- **Terminal-states table home.** `graph-preflight.test.mjs` reads the table from
  `graph-run/SKILL.md` and asserts it is not re-enumerated elsewhere. Move the
  table to one canonical home (the shared reference or the contract) and update
  the test's path, preserving the anti-drift guard.
- **Ready-detection claim point.** The loop reads `main` while a `graph-kickoff`
  PR may merge concurrently. The `STATUS.refined → STATUS.active` transition is
  the single claim point so two loop iterations (or a restart) never double-pick.
