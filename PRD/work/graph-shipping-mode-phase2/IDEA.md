# graph-shipping-mode-phase2

## Problem
Once the propose/apply foundation ([[graph-shipping-mode-phase1]]) lands, the
lifecycle is correct but still single-threaded: one `.worktrees/.graph-run.lock`
and a shared launch checkout. The owner wants to form several ideas' specs in
parallel and have a background worker implement each the moment it's approved.

## Outcome — two decoupled tools, joined by main
1. **Spec former (parallel).** The propose half, runnable many-at-once. Each takes
   one idea, forms its spec entirely in `PRD/work/<slug>/`, opens a spec PR = the
   work-folder proposal. Each runs in its **own worktree off one base branch**, so
   parallel formers never share a checkout and never collide (each writes only its
   own work folder). The owner approves by merging the spec PR into main.
2. **Implementation loop (single, background).** The apply half, driven by a loop.
   It monitors local main; when the owner syncs and it sees a spec that's been
   approved-and-merged but not yet built, it branches off that fresh main,
   implements it (durable truth + code) in its own worktree, and opens a code PR
   the owner merges.

Handoff is main: merge a spec → sync → the loop picks it up. Because approved
specs are already in main, the loop always branches off a base that has them —
the base→main staleness problem never arises.

## Design pieces to shape (in refinement, after Phase 1)
- **Worktree-per-run isolation** for the whole run (part 1 included, not just
  build), and **per-run locking** replacing the single global lock — isolation is
  what keeps concurrency safe, not the base→main guard.
- **"Ready" detection**: a reliable, idempotent marker in main for an
  approved-but-unbuilt spec, so the loop never double-ships and never misses.
- **Approval-watcher**: a background monitor that fires part 2 when a spec is
  ready. Part 2's resume path already skips the base→main guard
  (verified `graph-preflight.mjs:797`).
- **Subagents / parallelism = a knob, off by default**, with per-run cost logged
  to the ledger (owner wants to explore cost impact deliberately).
- **Bounds + kill switch + fail-closed liveness** for the unattended loop.

## Non-goals
- No "ship multiple specs together" grouping — per-idea sessions make each idea
  its own package and PR, dissolving that problem.
- `land` (merge to main) stays a human merge; no auto-merge.

## Depends on
[[graph-shipping-mode-phase1]] — the propose/apply rework and conflict-free
spec-forming are prerequisites. Shape this only after Phase 1 lands.
