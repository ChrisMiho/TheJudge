# Gameplan — graph-run-boundary-enforcement

## What ships

A `PreToolUse` hook, committed to `.claude/settings.json`, that enforces every
graph-run boundary without a launch flag; a kill switch the owner can throw
mid-run; a per-dispatch tool-call cap; slice criteria that start `false`; a
node-7 reviewer that cannot write; and a run that proves its own enforcer is
firing before it starts and between every node.

Nothing here is player-facing. This is the machinery that keeps an autonomous
run inside its stated boundaries.

## Architecture

### The hook

```
Claude Code tool call
   │
   ▼
.claude/settings.json  →  PreToolUse matcher "*"  (committed, always on)
   │
   ▼
scripts/graph-boundary-hook.mjs        ← thin CLI: stdin JSON → exit 0 | 2
   │  reads  .worktrees/.graph-run.lock          (run active?)
   │  reads  .worktrees/.graph-stop              (kill switch)
   │  reads  .worktrees/.graph-run-state.json    (current node + attempt)
   │  writes .worktrees/.graph-node-calls.json   (counter — hook is sole writer)
   │  writes .worktrees/.graph-evidence.jsonl    (observed evidence — append only)
   ▼
scripts/lib/boundary-rules.mjs         ← pure: tiers, normalization, decision
scripts/lib/protected-paths.mjs        ← existing; the protected set, reused
```

**Split is load-bearing.** `boundary-rules.mjs` is pure and holds every
protected-path and command literal. `graph-boundary-hook.mjs` does the file I/O
and holds none of those literals. `scripts/protected-write-guard.test.mjs`
fails any non-test script that pairs an `fs` write call with a protected-path
literal, so a hook file that both writes counters and names `CLAUDE.md` breaks
`test:scripts` on day one. Keep the literals in the pure module.

**Tier data, not duplicated logic.** The graph tier's protected paths come from
`PROTECTED_PATH_PATTERNS` in `scripts/lib/protected-paths.mjs`. The hook does
not restate the profile's deny list as hook code.

**Decision protocol.** Deny is exit code 2 with the reason on stderr. Exit 0 is
allow. The hook never exits non-zero for any other reason: an internal error
prints a diagnostic and exits 0, because a hook that fails closed would brick
every session in the repository. A hook that cannot decide is caught by the
canary and the heartbeat (slice E), not by blocking the user.

### The three `.worktrees/` records — one writer each

| File | Sole writer | Read by |
| --- | --- | --- |
| `.graph-run.lock` | `graph-preflight` | hook (tier gate), `graph-run` |
| `.graph-run-state.json` | `graph-run` (before every dispatch) | hook (cap key) |
| `.graph-node-calls.json` | the hook | `graph-run` (heartbeat) |
| `.graph-evidence.jsonl` | the hook | the hook (criterion flip check) |
| `.graph-stop` | the owner | `graph-run`, hook, `graph-preflight` |

The run-state file is deliberately separate from the lock: `parseLockFile()`
treats an unreadable lock as a hard blocker for the next run, so rewriting it at
every node boundary would put the concurrency guard at risk nine times a run.

### Data flow — one node dispatch under the finished system

1. `graph-run` checks `.graph-stop`. Present → halt cleanly (slice C).
2. `graph-run` reads the no-pre-authorization rule from the contract (slice H)
   and runs `graph-ledger-check.mjs`.
3. `graph-run` writes `.graph-run-state.json`: run id, node, attempt.
4. `graph-run` dispatches the node's subagent.
5. Every tool call in that subagent hits the hook: universal tier always, graph
   tier because the lock is held, counter incremented against
   `<run id>/<node>/<attempt>`, evidence appended when the call matches a
   criterion's `evidence` block.
6. Node returns. `graph-run` confirms the counter advanced (heartbeat, slice E).
   No advance with tool calls made → `BLOCKED`.

## This package cannot be built by a graph run

Slice A creates `.claude/settings.json` and slice F edits `thejudge-map-out` and
`thejudge-implement-all`. Both are inside the protected set, and the graph tier
denies exactly those writes while a run holds the lock. A graph run building
this package would be denied by the boundary it is building.

So implement it interactively, in a session holding no lock. This is not a
limitation to design around — it is the boundary working. Once shipped, the same
rule keeps every later run out of its own enforcer.

## Slice order and parallelism

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Hook exists, is always on, denies the universal tier | — |
| B | Graph tier, gated by the run lock | A |
| C | Kill switch | A |
| D | Per-dispatch tool-call cap | A |
| E | Hook liveness proven — canary, heartbeat, untrusted workspace | A, B, D |
| F | Slice criteria start `false` and need observed evidence | A, B |
| G | Node 7 reviewer with no write tools | — |
| H | No-pre-authorization rule re-read at every dispatch | — |
| I | Contract retirements, docs, PRD promotion, ship gates | all |

A is the only hard prerequisite for the hook chain. G and H touch skill and
contract text only and can run at any time. E is the one genuinely sequential
slice: it proves the hook the earlier slices built and reads the counter D
writes.

## Verification checklist

- `npm run test:scripts` — every new `scripts/*.test.mjs` joins the gate by
  existing; no harness change needed.
- `npm run quality:check` — the full gate for touched areas.
- Each hook slice adds live-binary evidence, not only unit tests: a unit test
  proves the decision function, and only a real tool call proves the hook is
  wired. Both are required.
- `npm run skills:ai-sync` after any `.claude/skills/` edit, so the
  `.agents/skills/` mirror does not drift.

## Browser verification

None. This package touches agent workflow, repository configuration, and
`scripts/`. No screen, overlay, responsive geometry, or browser API is involved,
so `PRD/instructions/runtime-process-hygiene.md`'s policy does not trigger and
no slice carries Playwright criteria or cleanup evidence.

## Stated limits carried into implementation

Each of these is recorded in the contract by slice I, not designed away:

- The hook matches literals; a path assembled at runtime evades it.
- `graph-ledger-check.mjs` stays a self-report.
- A `manual` criterion proves the check happened, not that it passed.
- A missing run-state file degrades the cap, and the heartbeat with it.
- Project hooks require workspace trust; an untrusted checkout is a named
  `BLOCKED` condition, never a silent no-op.
- Whether a hook deny survives `bypassPermissions` is measured in slice A and
  recorded as the measurement, not asserted.

## PRD references

REQ-152..159, NFR-016, FLOW-020, DEC-166.
