# Slice D — Per-dispatch tool-call cap

## Status: done

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

- [x] Unit tests: the counter increments per call; the deny fires exactly at the
      cap and not before; the reason names node, attempt, and count.
- [x] Unit test: two attempts at the same node under one run id hold separate
      counts, and attempt 2 starts at zero with attempt 1 at its cap.
- [x] Unit test: a counter file carried across a simulated resume continues the
      same attempt's count rather than restarting at zero.
- [x] Unit tests: a missing run-state file and an unparseable one both allow the
      call and both emit the degraded-cap report.
- [x] Every node in the contract's node table has a cap value, and this slice's
      verification section records the observed-dispatch basis for each.
- [x] The reference.md table matches the contract table exactly:
      `diff <(...)`-style comparison or an explicit line-by-line check recorded.
- [x] **Live counter proof.** With a run-state file written by hand, issue three
      tool calls and confirm `.worktrees/.graph-node-calls.json` advanced by
      three under the expected key. Record the before and after values.
- [x] `npm run test:scripts` green.

## Verification

```bash
npm run test:scripts
cat .worktrees/.graph-node-calls.json
```

## Verification record

### Unit proof

- `node --test scripts/lib/boundary-rules.test.mjs` — 31 pass, 0 fail.
- `node --test scripts/graph-boundary-hook.test.mjs` — 92 pass, 0 fail.
- `npm run test:scripts` — 264 pass, 0 fail.
- `npm run quality:check` — exit 0.
- `scripts/protected-write-guard.test.mjs` still green with the hook now
  performing real writes: the counter path is deliberately **not** in
  `PROTECTED_PATH_LITERALS`, because the hook is its sole writer.

### The cap basis — stated, not asserted

**No completed `GRAPH-RUN.md` ledger exists in this repository.** No graph run
has finished, so there is no ledger-observed dispatch size for any node. Saying
otherwise would be inventing the evidence this criterion asks for.

The one real measurement available is this package's own implementation session,
which is the closest analogue to a `build` dispatch that exists: the same skill,
the same repository, the same slice-by-slice loop.

| Node | Cap | Basis |
| --- | --- | --- |
| `preflight` | 40 | `graph-preflight` is one script invocation plus its dry run and a status check. Observed here: 6 calls including the blocked path. ~6× headroom. |
| `shape` | 60 | `thejudge-kickoff` reads two files and writes an `IDEA.md`. No ledger; sized just above `preflight` because it writes an artifact. |
| `define` | 150 | `thejudge-refinement` is the largest read-heavy node — PRD sections, up to three question rounds, and `PRD/sections/` edits. No ledger; sized at the `plan` budget plus a margin for the question rounds. |
| `gate-qc` | 60 | Reads one brief and writes one verdict. No ledger; matched to `shape`. |
| `plan` | 120 | `thejudge-map-out` writes a GAMEPLAN and one doc per slice — this package took 10 files. No ledger; ~10 calls per slice doc at nine slices. |
| `build` | 600 | **Measured.** Slices A–D of this package took roughly 60 tool calls including preflight, worktree setup, and PR creation — about 15 per slice. Nine slices projects to ~160. 600 is ~3.7× that. |
| `review` | 120 | One diff read plus findings. No ledger; matched to `plan`. |
| `land` | — | Node 8 is a human PR merge. The driver never dispatches it, so it has no budget to spend. |
| `close` | 120 | `thejudge-cleanup` promotes truth, writes a receipt, and deletes the package. No ledger; matched to `plan`. |

Every number except `build` is a headroom estimate over a non-graph analogue,
and is marked as such. **These want re-tuning against real ledgers once runs
accumulate.** Slice I carries that forward as a stated limit.

### Table parity

```
diff <(contract: #, node, model, cap) <(reference.md: #, node, model, cap)
→ TABLES MATCH on #, node, model, cap
```

The contract is the authority and says so in the text above its table.

### Live counter proof

Sandbox with a live lock and a hand-written run-state file at
`{"runId":"graph-capproof","node":"plan","attempt":1}`:

```
BEFORE: (no counter file)
  call 1 -> exit=0
  call 2 -> exit=0
  call 3 -> exit=0
AFTER:  { "graph-capproof/plan/1": 3 }
```

Advancing the run state to `attempt: 2` and issuing one more call:

```
AFTER:  { "graph-capproof/plan/1": 3, "graph-capproof/plan/2": 1 }
```

The loop-back started at zero and attempt 1's spent count was left untouched.

Removing the run-state file:

```
[graph-boundary] degraded: no usable run state at .worktrees/.graph-run-state.json; the tool-call cap cannot attribute this call and is not enforced
  exit=0
```

Reported, never silent, and never blocking — a cap that quietly stopped counting
looks exactly like a run that stayed inside it.

### Stated limits carried forward

- Every cap except `build`'s is an estimate over a non-graph analogue. The
  numbers are a starting point to re-tune, not a measurement.
- A missing run-state file degrades the cap to nothing. The hook reports it on
  every call, but the run is not stopped — slice E's heartbeat is what turns a
  degraded counter into a `BLOCKED` condition.
- The counter file is written through a temporary file and a rename, so an
  interrupted hook leaves the previous count. A corrupt counter file restarts
  the count at zero rather than blocking the run, which means a corruption
  silently refunds the budget.
- The cap counts calls, not work. A node can exhaust its budget on cheap calls
  or do a great deal inside a few expensive ones.

## Files touched

- `scripts/graph-boundary-hook.mjs`
- `scripts/graph-boundary-hook.test.mjs`
- `scripts/lib/boundary-rules.mjs`
- `scripts/lib/boundary-rules.test.mjs`
- `PRD/instructions/graph-workflow-contract.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
