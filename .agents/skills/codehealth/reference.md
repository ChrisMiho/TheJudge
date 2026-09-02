# codehealth reference

Detail the loop points to. `SKILL.md` is the authority on the loop; this file holds
the classification rubric and the ledger shape.

## Behavior-preserving classification rubric (tick step 4)

A candidate ships **only** if every check below is a clear yes. Any no, or any
"can't tell", means **skip into the digest** — never build.

| Check | Ships (yes) | Skips (no / uncertain) |
|---|---|---|
| **Reachability** | Symbol is provably unreached — grep-dead **and** not registered in any runtime lookup table, dynamic-dispatch map, reflection call, string-keyed access, decorator, or config/DI wiring | Any runtime-only reference path exists, or you cannot rule one out |
| **Public surface** | App-internal only | Exported from a published/package boundary an outside caller could use (removal is a breaking change) |
| **Output equivalence** | The refactor cannot change any value, order, timing, error, or log a user or another module observes | It changes any observable output, even "harmlessly" |
| **Product truth** | Touches no `PRD/sections/` file and no code a `REQ`/`FLOW` cites for its behavior | Touches product-truth-backed behavior |
| **Data / schema** | No change to a persisted shape, wire contract, or committed artifact | Any schema/contract/artifact shift |

Target classes in scope: dead code, duplicate/consolidatable code, inefficient code
(a faster/leaner path), unsafe/bad patterns (missing guard, unhandled error, unsafe
cast), and documentation drift — **only** where the fix is output-equivalent. A
"fix" that corrects a behavior is a product change: skip it. An efficiency change
that alters any observable value, ordering, timing contract, memory-visibility, or
error is a behavior change: skip it.

## Documentation drift (tick step 4, doc targets)

A doc target ships only when the doc is **non-authoritative** and the code is the
ground truth it should match.

| Doc | Action | Why |
|---|---|---|
| Code comment, module `README`, JSDoc, inline example that misstates what the code does | **Edit the doc to match the code** — ships as a normal behavior-preserving PR | The code is the truth here; the doc drifted |
| A statement in `PRD/sections/` (or a `REQ`/`FLOW` a spec cites) that disagrees with the code | **Park in the digest — edit nothing** | `PRD/sections/` is product truth. Code disagreeing with truth is a bug **or** a stale spec; only the owner decides which, and syncing either side silently would launder a behavior change into truth |
| A doc whose "drift" is actually the code being wrong | **Park in the digest** | Fixing the code is a behavior change, not a doc fix |

The rule in one line: the loop may correct a doc **to** the code, never the code
**to** a doc, and never touches `PRD/sections/`.

## Post-build assertion (tick step 6)

Green is necessary, not sufficient. All must hold or the build is discarded:

1. `quality:check` passes with **no test file modified** by the refactor.
2. No behavior-covering test was deleted or `.skip`-ed.
3. `git diff --name-only origin/main...HEAD` includes no `PRD/sections/` path, and no
   code file a `REQ`/`FLOW` cites for behavior.
4. If a live path was touched, the conditional live check ran and matched prior
   output.

## Night ledger

One file per night at `.worktrees/.codehealth/<night-id>/ledger.md`. `.worktrees/`
is gitignored, so the ledger never enters a PR and survives across ticks.

```markdown
# Code-Health Ledger — night <night-id>

- Start: <ts> · Base: origin/main @ <sha>
- PR cap (shipped): 4 · Ceilings: 06:00 · 15 ticks · 3 consecutive failures
- Guardrail: THEJUDGE_GRAPH_PROFILE=1 (armed)

## Ticks

| # | target | outcome | PR URL | evidence |
|---|--------|---------|--------|----------|
| 1 | <slug> | shipped | <url> | quality:check green; post-build assert held |
| 2 | <slug> | skipped | — | classify: live via scan lookup table — behavior-touching |

## Morning digest (skipped-for-behavior targets)

One line per `skipped` row: the target, the file, and why it would change behavior —
so the owner can decide whether to pursue it as a real feature.

## Night summary

Shipped N/4 · Skipped M · Failed K · Ticks used T/15 · Ended: <reason>
```

The `skipped` rows **are** the morning digest — the owner's queue of
behavior-touching finds worth a deliberate decision.
