# Slice D — Per-dispatch tool-call cap

## Status: planned

## Goal

Each node carries a tool-call budget for one dispatch of it; the hook counts and
denies past that budget, and an overrun parks instead of burning the run.

## Requirements

REQ-156.

1. The node table in `PRD/instructions/graph-workflow-contract.md` gains a cap
   column, and every node has a value. The mirrored table in
   `.claude/skills/graph-run/reference.md` follows the contract, which stays the
   authority.
2. Cap values are set with headroom over the largest dispatch observed in the
   existing `GRAPH-RUN.md` ledgers and receipts. The slice records the basis for
   each number rather than asserting it.
3. `graph-run` writes `.worktrees/.graph-run-state.json` immediately before
   every node dispatch: run id, the node about to be dispatched, and the attempt
   number for that node. `graph-run` is that file's only writer.
4. The hook reads that file to learn the current node. It does not parse
   `GRAPH-RUN.md` and does not infer the node from the tool call.
5. The hook increments a counter keyed by run id, node, **and** attempt in
   `.worktrees/.graph-node-calls.json`, of which it is the only writer, and
   denies once that attempt's cap is reached — naming the node, the attempt, and
   the count in the reason.
6. The counter survives park and resume, because the key is run id / node /
   attempt rather than session.
7. A loop-back — `define` on a `gate-qc` FAIL, `build` on a `review` finding —
   is a new attempt with a fresh budget. It never parks before doing any work on
   a budget an earlier attempt spent.
8. The cap adds no third loop limit. The contract's three-FAIL and two-return
   caps stay the only bound on dispatch count.
9. An overrun parks at `owner-action` using the existing `PARKED` state, with
   node, cap, and observed count as evidence in `GRAPH-RUN.md`. No fifth state.
10. A missing or unparseable run-state file means the hook cannot attribute the
    call, so the cap does not fire. It never blocks a run, and the hook reports
    the degraded condition rather than staying silent.

## Acceptance criteria

- [ ] Unit tests: the counter increments per call; the deny fires exactly at the
      cap and not before; the reason names node, attempt, and count.
- [ ] Unit test: two attempts at the same node under one run id hold separate
      counts, and attempt 2 starts at zero with attempt 1 at its cap.
- [ ] Unit test: a counter file carried across a simulated resume continues the
      same attempt's count rather than restarting at zero.
- [ ] Unit tests: a missing run-state file and an unparseable one both allow the
      call and both emit the degraded-cap report.
- [ ] Every node in the contract's node table has a cap value, and this slice's
      verification section records the observed-dispatch basis for each.
- [ ] The reference.md table matches the contract table exactly:
      `diff <(...)`-style comparison or an explicit line-by-line check recorded.
- [ ] **Live counter proof.** With a run-state file written by hand, issue three
      tool calls and confirm `.worktrees/.graph-node-calls.json` advanced by
      three under the expected key. Record the before and after values.
- [ ] `npm run test:scripts` green.

## Verification

```bash
npm run test:scripts
cat .worktrees/.graph-node-calls.json
```

## Files touched

- `scripts/graph-boundary-hook.mjs`
- `scripts/graph-boundary-hook.test.mjs`
- `scripts/lib/boundary-rules.mjs`
- `scripts/lib/boundary-rules.test.mjs`
- `PRD/instructions/graph-workflow-contract.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
