# Slice C — Owner kill switch

## Status: done

## Goal

The owner stops a running graph run by creating `.worktrees/.graph-stop`, and
the run halts at the next node boundary with its terminal state written and the
lock released — instead of Ctrl-C, which strands the lock mid-node.

## Requirements

REQ-154, FLOW-020.

1. `graph-run` checks for `.worktrees/.graph-stop` immediately before every node
   dispatch, in the same pre-dispatch block that runs `graph-ledger-check.mjs`.
2. On finding it the run halts cleanly: writes a terminal state from
   `graph-run`'s existing `## Terminal states` table, records the halt, the node
   it halted at, and the evidence under `## Open gate` in `GRAPH-RUN.md`, sets
   the package `STATUS.*` marker, updates the `PRD/work/STATUS.md` board row,
   deletes the lock, and reports branch, PR URL if one exists, and ledger path.
3. A sentinel created mid-node lets the current node finish. The halt is at the
   node boundary, so no ledger is left half written.
4. The hook denies new node dispatches while the sentinel exists — the backstop
   for a driver that ignores its own check. This is a graph-tier rule.
5. `graph-preflight` refuses to start a run while the sentinel exists, naming
   the sentinel and the file to remove.
6. Resume is `/graph-run PRD/work/<slug>/` after the sentinel is removed,
   re-entering at the node the ledger records.
7. The sentinel and a gate park coincide → the park wins; it already carries the
   owner's question and resume command.
8. No fifth terminal state is added, and no `STEER.md` channel is created.

## Acceptance criteria

- [x] Unit test: the hook denies a subagent-dispatch tool call while
      `.worktrees/.graph-stop` exists and allows it when absent.
- [x] Unit test in `scripts/graph-preflight.test.mjs`: the sentinel classifies
      the run as refusing to start, with the sentinel path in the message.
- [x] `graph-run/SKILL.md` states the pre-dispatch sentinel check, the clean
      halt sequence in order, and the resume command; the halt states are read
      from the existing `## Terminal states` table with no second list added.
- [x] **Live halt rehearsal.** With a live lock and a stub ledger, create the
      sentinel and confirm the halt path produces: a terminal state in the
      ledger, an `## Open gate` entry naming the node, the `STATUS.*` marker,
      the board row, and a deleted lock. Record the five observations.
- [x] `grep -c "graph-stop" PRD/instructions/graph-workflow-contract.md` is
      non-zero — the sentinel is documented where the boundaries are.
- [x] `npm run skills:ai-sync` run and `.agents/skills/` mirror clean in
      `git status --porcelain`.

## Verification

```bash
npm run test:scripts
npm run skills:ai-sync && git status --porcelain
```

## Verification record

### Unit proof

- `node --test scripts/graph-boundary-hook.test.mjs` — 82 pass, 0 fail.
- `node --test scripts/graph-preflight.test.mjs` — 91 pass, 0 fail.
- `npm run test:scripts` — 243 pass, 0 fail.
- `npm run quality:check` — exit 0.
- `grep -c "graph-stop" PRD/instructions/graph-workflow-contract.md` — 1.
- `npm run skills:ai-sync` re-run leaves no further change; the `.agents/`
  mirror in this commit is the sync output, not drift.

### Live halt rehearsal

Run in a sandbox with a live lock, a stub `GRAPH-RUN.md` at
`Current node: plan`, `STATUS.active`, and a board row under `## active`. The
real hook and the real `graph-preflight.mjs` were pointed at that sandbox.

**Backstop, with the sentinel present:**

```
Task dispatch    → deny: The owner asked this run to stop. Dispatching another node is denied.
rm the sentinel  → deny: Removing the owner's stop sentinel is denied while a run holds the lock.
write the ledger → allow
write board row  → allow
```

**Preflight, with the sentinel present:**

```
graph-preflight: refusing to start — the owner's stop sentinel exists at .worktrees/.graph-stop. A run was asked to halt, and starting another would undo that. Confirm the halted run finished, then remove it to resume: rm .worktrees/.graph-stop
```

**The five observations after running the documented halt sequence:**

```
1. terminal state in ledger:  - Terminal state: `PARKED`
2. Open gate names the node:  - Halted at node: `plan` (node 5), at the node boundary, before dispatch.
3. status marker:             STATUS.owner-action
4. board row now under:       ## owner-action
5. lock released:             deleted
```

The sentinel remained after the halt, which is correct: the owner clears it to
resume, and `graph-preflight` keeps refusing until they do.

### One rule beyond the letter of the slice

Item 4 asks only that the hook deny new node dispatches. A run could still have
run `rm .worktrees/.graph-stop` and carried on, which defeats the switch
entirely — so `stop-sentinel-removal` was added alongside it. It serves item 4's
stated intent, and it is gated on the lock, so the owner clearing the sentinel to
resume is unaffected: by then the halted run has released the lock.

The halt path is deliberately left open. A run that could not write its own
ledger, status marker, and board row would strand exactly the state this slice
exists to avoid, so only `Task` and `Agent` are denied.

### Stated limits carried forward

- The hook denies the two dispatch tools by name. A harness that grows a third
  subagent-dispatching tool needs it added to `DISPATCH_TOOLS`; nothing detects
  that automatically.
- The halt sequence is agent prose in `graph-run/SKILL.md`, rehearsed here
  rather than executed by code. This proves the sequence produces the five
  artifacts, not that a live driver will always follow it.
- `graph-preflight`'s refusal fires in the CLI. A caller that imports
  `classifyStopSentinel()` and ignores the verdict is not stopped by it.

## Files touched

- `scripts/lib/boundary-rules.mjs`
- `scripts/graph-boundary-hook.test.mjs`
- `scripts/graph-preflight.mjs`
- `scripts/graph-preflight.test.mjs`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-preflight/SKILL.md`
- `PRD/instructions/graph-workflow-contract.md`
