# graph-shipping-mode-phase2

## Problem
Even after Phase 1 ([[graph-shipping-mode-phase1]]), the graph backbone is still
one-run-at-a-time: a single `.worktrees/.graph-run.lock` and a shared launch
checkout (the design that prevents the 2026-08-17 shared-checkout corruption).
So the owner can't form several ideas' specs in parallel, and can't have a
background session waiting to implement a spec the moment it's approved.

## Outcome (to be shaped in refinement)
Concurrent graph-run built on **one base branch + a worktree per run**:
1. Each run — part 1 (spec) included, not just `build` — works inside its own
   isolated worktree off the base, so parallel runs never share a checkout.
2. Per-run locking (or per-worktree) replaces the single global lock so
   independent runs proceed at once, while the shared-checkout hazard stays
   closed by isolation.
3. An **approval-watcher**: a background session monitors a parked package's
   `GATE-QUESTIONS.md` for a fully-answered gate (all verdict slots filled) and,
   on approval, fires part 2 (`/graph-run PRD/work/<slug>/`) in that package's
   worktree. Part 2's resume path already skips the base→main guard, so this is
   supported once isolation exists.

Result: kick off multiple idea-forming sessions at once; each parks for spec
approval; a waiter ships each approved spec's implementation as its own PR; the
owner merges each.

## Non-goals
- No "ship multiple specs together" grouping — per-idea sessions make each idea
  its own package and PR, which dissolves that problem.
- `land` stays a human merge.

## Depends on
Phase 1's overlap-scoped guard and auto-bridge are prerequisites for safe
concurrency. Shape this only after Phase 1 lands.
