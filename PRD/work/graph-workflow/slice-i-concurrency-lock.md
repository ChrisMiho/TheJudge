# Slice I — One run at a time: the concurrency lock

## Status: planned

Scope item 15. Depends on: **D** (the `## Terminal states` table it releases on)
and **F** (`graph-preflight` edits).

## Goal

A second `graph-run` cannot share the first one's launch checkout.

## Requirements

1. Two `graph-run` invocations share one launch checkout: both commit to it, both
   rewrite `GRAPH-RUN.md`, both publish before `build`. That is the
   shared-working-directory hazard that produced the leak, with no rep isolation
   between them.
2. `graph-preflight` takes a lockfile at `.worktrees/.graph-run.lock` recording
   the slug, run ID, PID, and start time.
3. A second run **refuses** while it is held, naming the holder.
4. A run releases the lock on **every** terminal state in `graph-run`'s
   `## Terminal states` table — `COMPLETE`, `PARKED`, `BLOCKED`, and the
   `PROMPTED` state slice D adds. Reference that table as the single definitive
   list; **a release path enumerated anywhere else can drift out of step with it
   and strand the lock.**
5. A lock whose PID is no longer alive is reported **stale and reclaimable**,
   never silently stolen.
6. Lock acquisition and staleness detection are a tested pure function, following
   `scripts/graph-preflight.mjs`.
7. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [ ] `node --test scripts/graph-preflight.test.mjs` covers acquire, contend, and
      stale-PID paths as pure-function unit tests
- [ ] A second `graph-run` launched while a run holds the lock refuses and names
      the holding **slug, run ID, and PID** — all three
- [ ] A lock file whose recorded PID is not alive is reported **stale**, with the
      reclaim action stated; it is not silently overwritten
- [ ] The release path names `graph-run`'s `## Terminal states` table by
      reference; `git grep` finds **no** second enumeration of terminal states in
      `graph-preflight` or the contract
- [ ] Release is verified for all four states, `PROMPTED` included: after each,
      `.worktrees/.graph-run.lock` no longer exists
- [ ] `.worktrees/.graph-run.lock` is not tracked by git
- [ ] `npm run quality:check` green

## Verification

```bash
node --test scripts/graph-preflight.test.mjs
npm run test:scripts
git check-ignore -v .worktrees/.graph-run.lock
git grep -n 'COMPLETE' .claude/skills/graph-preflight/ PRD/instructions/graph-workflow-contract.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `scripts/graph-preflight.mjs`, `scripts/graph-preflight.test.mjs`
- `.claude/skills/graph-preflight/SKILL.md` (+ reference, + mirror)
- `.claude/skills/graph-run/SKILL.md` (release-on-terminal-state) (+ mirror)
- `PRD/instructions/graph-workflow-contract.md`
