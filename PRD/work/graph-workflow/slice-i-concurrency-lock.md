# Slice I — One run at a time: the concurrency lock

## Status: done

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

- [x] `node --test scripts/graph-preflight.test.mjs` covers acquire, contend, and
      stale-PID paths as pure-function unit tests
- [x] A second `graph-run` launched while a run holds the lock refuses and names
      the holding **slug, run ID, and PID** — all three
- [x] A lock file whose recorded PID is not alive is reported **stale**, with the
      reclaim action stated; it is not silently overwritten
- [x] The release path names `graph-run`'s `## Terminal states` table by
      reference; `git grep` finds **no** second enumeration of terminal states in
      `graph-preflight` or the contract
- [x] Release is verified for all four states, `PROMPTED` included: after each,
      `.worktrees/.graph-run.lock` no longer exists
- [x] `.worktrees/.graph-run.lock` is not tracked by git
- [x] `npm run quality:check` green

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

## Result

`scripts/graph-preflight.mjs` gains `LOCK_PATH`, `parseLockFile`, `isPidAlive`,
`classifyLock`, and `lockRecord` — all pure, following the file's existing
pattern. Eleven new tests; the suite is 83, `npm run test:scripts` 115, all
passing.

### Four lock states, not two

| State | Meaning | Action |
| --- | --- | --- |
| `free` | no lock file | take it and continue |
| `held` | the recorded PID is alive | refuse, naming the holding slug, run id, **and** PID |
| `stale` | the recorded PID is not running | report stale with the `rm` reclaim command; never reclaim silently |
| `corrupt` | the lock exists but does not parse | stop |

`corrupt` is the state the requirements did not name and the implementation
needs: treating a garbled lock as absent is exactly how two runs end up sharing
a checkout. A test asserts `"not json"`, `"[]"`, `"null"`, and `{"slug":"x"}`
all classify `corrupt` rather than `free`.

`isPidAlive` treats `EPERM` as **alive** — a process owned by another user
exists, and reclaiming it would be theft. Signal 0 does the existence and
permission checks without delivering anything.

### Release by reference, verified

`graph-run`'s `## Terminal states` table is the definitive list. The SKILL says
"Release the concurrency lock on every state in this table", and neither
`graph-preflight/SKILL.md` nor `graph-workflow-contract.md` re-enumerates them —
`git grep -n 'COMPLETE'` across both returns one line, the contract's pointer
from slice D.

Three tests hold that shape mechanically rather than by inspection:

1. the states parsed out of `graph-run`'s table are exactly `COMPLETE`,
   `PARKED`, `BLOCKED`, `PROMPTED` — so a fifth state added later fails here
   until the release path is reconsidered
2. the release sentence exists in the SKILL, and neither of the other two files
   enumerates the states
3. **release is exercised for all four**, `PROMPTED` included: in a sandbox, a
   lock is written and classified `held`, the terminal state's last act removes
   it, and the file is asserted gone and the classifier `free`

`git check-ignore -v .worktrees/.graph-run.lock` resolves to `.gitignore:8`, so
the lock is never tracked and never travels with a branch.

### Lock I/O stayed out of the script, and the guard is why

`graph-preflight.mjs` names `.secrets/` (a protected literal), so adding a
`writeFileSync(` or `rm(` there would have failed slice C's drift guard. The
script therefore classifies and the skill performs the file operations — which
is the division the guard exists to force, working on its first real case.

`diff -rq .claude/skills .agents/skills` produces no output.
`npm run quality:check` exits 0.
