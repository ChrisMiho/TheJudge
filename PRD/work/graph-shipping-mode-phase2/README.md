status: ideation

# graph-shipping-mode-phase2

Concurrent graph-run: one base branch + a worktree per run, per-run locking, and
a background approval-watcher that fires part 2 the moment a spec's gate is fully
answered. Lets the owner form several ideas' specs in parallel and auto-ship each
approved spec as its own PR. Depends on [[graph-shipping-mode-phase1]]. Shape
after Phase 1 lands. See `IDEA.md`.
