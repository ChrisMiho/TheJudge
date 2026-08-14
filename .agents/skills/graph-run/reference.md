# graph-run reference

## Node dispatch

Each node runs as a subagent with an explicit model override. The controlling
predicate `graph-run is controlling` must appear in the dispatch prompt — the
`thejudge-*` phase skills check for it and otherwise run interactively.

| # | Node | Delegate | Model | On success | On failure |
| --- | --- | --- | --- | --- | --- |
| 1 | `preflight` | `/graph-preflight --branch <name>` | haiku | `shape` | park |
| 2 | `shape` | `/thejudge-kickoff` | sonnet | `define` | park |
| 3 | `define` | `/thejudge-refinement` | opus | `gate-qc` | park |
| 4 | `gate-qc` | `/thejudge-quality-check` | sonnet | `plan` | `define`, max 3 loops |
| 5 | `plan` | `/thejudge-map-out` | sonnet | `build` | park |
| 6 | `build` | `/thejudge-implement-all` | sonnet | `review` | park |
| 7 | `review` | `superpowers:requesting-code-review` | opus | `land` | `build` for Critical/Important |
| 8 | `land` | human PR merge | — | `close` | park |
| 9 | `close` | `/thejudge-cleanup` | sonnet | complete | park |

`plan` requires a recorded quality-check PASS in the package README's
`## Preparation gate` section. It cannot self-certify one.

`graph-run` writes that section itself after every `gate-qc` node — graph runs
do not delegate to `thejudge-prepare`, so nothing else produces it. Use the
exact section shape given in `PRD/instructions/graph-workflow-contract.md`.

## Worktree and branch shape

- Autonomous base: the branch `graph-preflight` created and pushed. Recorded as
  `## Autonomous metadata` / `- Autonomous base: origin/<branch>` in the package
  README, exactly as `preparation-contract.md` specifies, so
  `thejudge-implement-all` inherits it unchanged.
- Worktree path: `.worktrees/implement-<slug>`, owned by `thejudge-implement-all`.
- Refuse any worktree outside the repo-local `.worktrees/` root.
- One worktree per package, not per slice. Slices that build on each other
  share it — that is what avoids the merge conflicts bundling is meant to
  prevent.
- PR base is the recorded autonomous base. Never `main` unless the user named
  it explicitly.

## Ledger writes

Append one row per node attempt — never overwrite a prior attempt's row. A
retried node gets a new row, so the ledger shows the loop count that
`gate-qc`'s three-loop limit is measured against.

Update `Current node` and `Next action` in the same edit that appends the row.

## Model selection rationale

Cheapest capable model per node. `define` and `review` take opus because their
output is judgment the run cannot recover from: a bad design brief propagates
through every later node, and a review that misses a Critical finding defeats
the purpose of the gate. Everything else is bounded, verifiable work where a
mistake surfaces immediately as a failing command.

To change a node's model, edit the table in
`PRD/instructions/graph-workflow-contract.md` first — it is the authority; this
table mirrors it.

## Red flags

| Thought | Reality |
| --- | --- |
| "The phase skill would ask the user here, I'll answer for them" | Apply the assumption ladder in `preparation-contract.md`. If it does not resolve, park. |
| "Quality-check failed again, but the finding is minor" | Three loops, then park. The limit exists because a fourth attempt has never been the fix. |
| "I'll just fix the thejudge skill so the node passes" | Never edit a `thejudge-*` skill. Park and report. |
| "The stash is in the way, I'll pop it" | Never drop, pop, or clear a stash. The deny list enforces this. |
| "No ledger row yet, I'll write them all at the end" | Write the row before the next node starts, or a crashed run resumes wrong. |
