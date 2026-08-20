# Slice E — Hook liveness proven at run start and between nodes

## Status: done

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

- [x] Unit tests in `scripts/graph-preflight.test.mjs`: a denied canary returns
      proof; an allowed canary returns the `BLOCKED` classification with the
      tried command, the response, and the recovery action in the message.
- [x] Unit test: the untrusted-workspace case produces the same `BLOCKED`
      classification with its own named reason, distinguishable from a plain
      canary failure.
- [x] Unit tests for the heartbeat: counter advanced → pass; counter static with
      calls made → `BLOCKED`; run-state file missing → degraded, run continues,
      condition reported.
- [x] The canary command is inert: the slice records what it targets and why
      executing it would change nothing.
- [x] **Live canary.** Run `npm run graph:preflight -- --dry-run` in a session
      with the hook installed and record the printed canary line verbatim. Then
      rename `.claude/settings.json` aside, re-run, and record the `BLOCKED`
      output. Restore the file and confirm `git status --porcelain` is clean.
- [x] The ledger template in the contract carries the canary line and the
      per-node heartbeat column or line, and `graph-run/SKILL.md` states both.
- [x] `npm run test:scripts` green.

## Verification

```bash
npm run graph:preflight -- --branch throwaway-canary-check --dry-run
npm run test:scripts
git status --porcelain
```

## Verification record

### Unit proof

- `node --test scripts/graph-preflight.test.mjs` — 101 pass, 0 fail.
- `npm run test:scripts` — 274 pass, 0 fail.
- `npm run quality:check` — exit 0.

### The canary, and why it is inert

`CANARY_COMMAND` is `rm -rf .worktrees/.graph-canary-nonexistent`.

Two properties, both required. It is denied by the universal tier's
`recursive-force-remove` rule, so a deny proves the hook fired. And it targets a
path that does not exist, inside `.worktrees/`, which `.gitignore` already
covers — so if it ever executes it removes nothing, prints nothing, and exits 0.
A proof with a side effect on failure is not a proof worth running.

The literal lives in `boundary-rules.mjs` with every other command literal in
this system and is re-exported by `graph-preflight.mjs`, so the canary and the
rule that denies it cannot drift apart.

### Live canary — hook installed

`npm run graph:preflight -- --branch throwaway-canary-check --dry-run` printed:

```
canary command: rm -rf .worktrees/.graph-canary-nonexistent
canary: pending — issue it as a Bash tool call and require a deny
```

Issued as a real tool call, it came back:

```
PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"]: [graph-boundary] `rm -rf` is denied in every session.
```

### Live canary — hook removed

`.claude/settings.json` was moved aside and the same command issued:

```
- Output: none (no stdout, no stderr)
- Exit code: 0
```

This is the negative case *and* the inertness proof in one observation: with no
hook the canary actually executed, and it did nothing. The file was restored and
`git status --porcelain` showed no change to it.

A script cannot make a tool call, so the script names the canary and leaves it
`pending`; the skill issues it and classifies the result. That split is why
`classifyCanary()` takes the observed result as an input rather than producing
one.

### The heartbeat

Read-only over `.worktrees/.graph-node-calls.json`, whose sole writer is the
hook — which is the only reason it counts as evidence rather than as the run
vouching for itself. Three outcomes, all unit-tested:

| Condition | State | Effect |
| --- | --- | --- |
| Counter advanced | `ok` | Continue; the span is recorded |
| Static, tool calls made | `blocked` | Run does not advance; node, expected, and observed recorded |
| No usable run state | `degraded` | Reported; run continues; canary stays the binding proof |

A node that made no tool calls is `ok` with "nothing to prove" — the absence of
calls is not evidence of an absent hook.

### Ledger and documentation

The contract's ledger template gained a `Canary:` header line and a `Heartbeat`
column in the node ledger. `graph-run/SKILL.md` states both, `graph-preflight/SKILL.md`
states the canary procedure, and `reference.md` points at the contract as the
authority.

### Stated limits carried forward

- The canary proves the hook denied **one** command at **one** moment. It does
  not prove any other rule fires, and it cannot.
- The heartbeat proves calls were counted, not that they were correctly judged.
  A hook that counted every call and allowed everything would pass it.
- The untrusted-workspace branch is classified from a flag the caller passes.
  Nothing in the script detects workspace trust on its own.
- A run whose run-state file never appears degrades every heartbeat while still
  reporting `ok` at the run level, leaving the canary as the only liveness
  evidence for the whole run.

## Files touched

- `scripts/graph-preflight.mjs`
- `scripts/graph-preflight.test.mjs`
- `scripts/lib/boundary-rules.mjs`
- `.claude/skills/graph-preflight/SKILL.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
- `PRD/instructions/graph-workflow-contract.md`
