# Slice E — Hook liveness proven at run start and between nodes

## Status: planned

## Goal

A run never proceeds on an unproven enforcer: `graph-preflight` proves the hook
denies before node 2, and the driver confirms between every node that it is
still firing.

## Requirements

REQ-159, NFR-016.

1. `graph-preflight` issues a canary tool call the universal tier is defined to
   deny, and treats the observed deny — the reason text the hook returns — as
   the proof. The canary targets a path or command that would be inert if it
   ever executed, so an absent hook causes no side effect beyond a failed proof.
2. A canary that is not denied ends the run at `BLOCKED` before node 2 is
   dispatched, naming what was tried, what came back, and the recovery action.
   The run does not start.
3. The same `BLOCKED` path covers the untrusted-workspace condition as a named
   condition: a project hook that was never trusted cannot deny the canary
   either, and the message says so rather than reporting a generic failure.
4. Between nodes, `graph-run` confirms `.worktrees/.graph-node-calls.json`
   advanced during the node just finished. A node that made tool calls while the
   counter stood still means the hook stopped firing.
5. A failed heartbeat ends the run at `BLOCKED` with the node, the expected
   advance, and the observed counter as evidence. The run does not advance.
6. The heartbeat is read-only over the counter file, whose sole writer is the
   hook, so the driver cannot manufacture its own proof.
7. A missing or unparseable run-state file leaves nothing to advance. That is
   reported as a **degraded heartbeat**, not as a hook failure, and the canary
   at run start stays the binding proof.
8. `.claude/graph-profile.json` is not a fallback. A failed proof is refused,
   never downgraded.
9. The ledger records the canary result at run start and the heartbeat result at
   each node boundary.

## Acceptance criteria

- [ ] Unit tests in `scripts/graph-preflight.test.mjs`: a denied canary returns
      proof; an allowed canary returns the `BLOCKED` classification with the
      tried command, the response, and the recovery action in the message.
- [ ] Unit test: the untrusted-workspace case produces the same `BLOCKED`
      classification with its own named reason, distinguishable from a plain
      canary failure.
- [ ] Unit tests for the heartbeat: counter advanced → pass; counter static with
      calls made → `BLOCKED`; run-state file missing → degraded, run continues,
      condition reported.
- [ ] The canary command is inert: the slice records what it targets and why
      executing it would change nothing.
- [ ] **Live canary.** Run `npm run graph:preflight -- --dry-run` in a session
      with the hook installed and record the printed canary line verbatim. Then
      rename `.claude/settings.json` aside, re-run, and record the `BLOCKED`
      output. Restore the file and confirm `git status --porcelain` is clean.
- [ ] The ledger template in the contract carries the canary line and the
      per-node heartbeat column or line, and `graph-run/SKILL.md` states both.
- [ ] `npm run test:scripts` green.

## Verification

```bash
npm run graph:preflight -- --branch throwaway-canary-check --dry-run
npm run test:scripts
git status --porcelain
```

## Files touched

- `scripts/graph-preflight.mjs`
- `scripts/graph-preflight.test.mjs`
- `scripts/lib/boundary-rules.mjs`
- `.claude/skills/graph-preflight/SKILL.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
- `PRD/instructions/graph-workflow-contract.md`
