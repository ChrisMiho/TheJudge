# Slice C — Owner kill switch

## Status: planned

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

- [ ] Unit test: the hook denies a subagent-dispatch tool call while
      `.worktrees/.graph-stop` exists and allows it when absent.
- [ ] Unit test in `scripts/graph-preflight.test.mjs`: the sentinel classifies
      the run as refusing to start, with the sentinel path in the message.
- [ ] `graph-run/SKILL.md` states the pre-dispatch sentinel check, the clean
      halt sequence in order, and the resume command; the halt states are read
      from the existing `## Terminal states` table with no second list added.
- [ ] **Live halt rehearsal.** With a live lock and a stub ledger, create the
      sentinel and confirm the halt path produces: a terminal state in the
      ledger, an `## Open gate` entry naming the node, the `STATUS.*` marker,
      the board row, and a deleted lock. Record the five observations.
- [ ] `grep -c "graph-stop" PRD/instructions/graph-workflow-contract.md` is
      non-zero — the sentinel is documented where the boundaries are.
- [ ] `npm run skills:ai-sync` run and `.agents/skills/` mirror clean in
      `git status --porcelain`.

## Verification

```bash
npm run test:scripts
npm run skills:ai-sync && git status --porcelain
```

## Files touched

- `scripts/lib/boundary-rules.mjs`
- `scripts/graph-boundary-hook.test.mjs`
- `scripts/graph-preflight.mjs`
- `scripts/graph-preflight.test.mjs`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-preflight/SKILL.md`
- `PRD/instructions/graph-workflow-contract.md`
