# graph-run reference

## Node dispatch

Every node except node 8 (`land`) runs as a subagent with an explicit model
override; `land` is a human PR merge the driver parks for and never dispatches,
described below. The controlling predicate `graph-run is controlling` must
appear in the dispatch prompt — the `thejudge-*` phase skills check for it and
otherwise run interactively.

| # | Node | Delegate | Model | Cap | On success | On failure |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `preflight` | `/graph-preflight --branch <name>` | haiku | 40 | `shape` | park |
| 2 | `shape` | `/thejudge-kickoff` | sonnet | 60 | `define` | park |
| 3 | `define` | `/thejudge-refinement` | opus | 150 | `gate-qc`, **or park on any `PRD/sections/` diff** | park |
| 4 | `gate-qc` | `/thejudge-quality-check` | sonnet | 60 | `plan` | `define`, max 3 loops |
| 5 | `plan` | `/thejudge-map-out` | sonnet | 120 | `build` | park |
| 6 | `build` | `/thejudge-implement-all` | sonnet | 600 | `review` | park |
| 7 | `review` | `superpowers:requesting-code-review` | opus | 120 | `land` | `build` for Critical/Important, max 2 loops |
| 8 | `land` | human PR merge | — | — | `close` | park |
| 9 | `close` | `/thejudge-cleanup` | sonnet | 120 | complete | park |

Before dispatching node 2, node 1 must have proven the hook is live with a
denied canary. Between every node, confirm `.worktrees/.graph-node-calls.json`
advanced. Both are specified in `PRD/instructions/graph-workflow-contract.md`
under `## Hook liveness`, which is the authority.

Every dispatch prompt in this table carries an absolute `Working directory:`
line on its own line, and instructs the node to copy that line unchanged into
every prompt it writes. A node fans out to its own subagents; without the
propagation rule the pin stops at the first hop, which is where the 2026-08-17
leak got through. Relative paths are rejected outright.

Node 6 (`build`) has a return-side assertion to match: every path it wrote must
lie inside `.worktrees/implement-<slug>/` or `PRD/work/<slug>/`. A write outside
that set fails the node and parks, naming the offending paths. It is the
production counterpart of the fixture rig's before/after snapshot — that check
asserts the invoking checkout is byte-unchanged, which a real run is supposed to
violate, so the scope set replaces it rather than being renamed.

`plan` requires a recorded quality-check PASS in the package README's
`## Preparation gate` section. It cannot self-certify one.

`graph-run` writes that section itself after every `gate-qc` node — graph runs
do not delegate to `thejudge-prepare`, so nothing else produces it. Use the
exact section shape given in `PRD/instructions/graph-workflow-contract.md`.

Node 8 (`land`) is never dispatched as a subagent — `human PR merge` is not a
phase skill. On reaching `land`, the driver parks: it sets
`STATUS.owner-action`, records the gate with the PR URL and the resume
command under `## Open gate`, and stops. It does not run `gh pr merge` or
`gh pr close`. A later `/graph-run PRD/work/<slug>/` checks whether the PR is
merged; if so it records `land` as `ok` and continues to `close`, otherwise
it reports the PR is still open and stops again.

`review` may loop to `build` at most **two** times for a Critical or
Important finding. A **Critical** finding the run cannot resolve from confirmed
decisions and tests — the contract's `## Human gates` bar, which names Critical
only — parks immediately without waiting for the loop cap. A third Critical/Important loop also parks, with
the open findings recorded as evidence.

## Entry point with no ledger

A supplied package path with no `GRAPH-RUN.md` is a resume, not a fresh run.
Enter at the node matching the package's existing `STATUS.*` marker: dispatching
`shape` at an already-mapped package re-runs `thejudge-kickoff`, which rewrites
`IDEA.md` and resets the package to `STATUS.ideation` — regressing finished
work.

| Existing marker | Enter at |
| --- | --- |
| no package folder at all | `preflight` (requires `--branch <name>`) |
| `STATUS.ideation` | `define` |
| `STATUS.refining` | `define` |
| `STATUS.refined` | `gate-qc` |
| `STATUS.active` | `build`, or `plan` when `GAMEPLAN.md` is absent |
| `STATUS.ship-ready` | `close` |
| `STATUS.owner-action` | park again unless the recorded `## Open gate` is resolved — `graph-gate-review` is what resolves a `define` gate |
| `STATUS.deferred` | refuse; `thejudge-defer` restores it first |

A package entered mid-lifecycle still needs a recorded autonomous base. If
`## Autonomous metadata` is missing from its README, run `preflight` first with
a supplied `--branch <name>`, record the base, then enter at the status-matched
node.

## Publishing before `build`

`thejudge-implement-all` blocks when the launch checkout has relevant modified
or untracked inputs, and requires the GAMEPLAN, slice docs, and baseline to
exist unchanged at the remote start point (`thejudge-implement-all/reference.md`
preflight steps 6–7). The driver's own writes violate both conditions:
`GRAPH-RUN.md` is rewritten before every node, and nodes 3–5 produce
`DESIGN-BRIEF.md`, `GAMEPLAN.md`, and the slice docs.

Before dispatching `build`, commit and push to `origin/<autonomous base>`:

- `GRAPH-RUN.md`
- the package `README.md`, including `## Autonomous metadata` and
  `## Preparation gate`
- `DESIGN-BRIEF.md`, `GAMEPLAN.md`, and every `slice-*.md`
- the `STATUS.*` marker and the `PRD/work/STATUS.md` board row
- any `PRD/sections/` edits refinement made — which, being non-empty, means the
  run already parked at the `define` gate and an owner already walked them
  through `graph-gate-review`

Then confirm `git status --porcelain` is empty. A dirty launch checkout at this
point is a driver bug, not a `build` blocker — fix the publish step rather than
dispatching into a node that will correctly refuse.

## Worktree and branch shape

- Autonomous base: the branch `graph-preflight` created and pushed. **The
  driver writes it.** Add `## Autonomous metadata` /
  `- Autonomous base: origin/<branch>` to the package `README.md`, in the exact
  shape `preparation-contract.md` specifies, immediately after node 1 succeeds —
  or, on a fresh run where node 2 creates that README, immediately after node 2 —
  and always before dispatching `build`. Nothing else produces it: graph runs
  never delegate to `thejudge-prepare`, and `thejudge-implement-all` blocks
  before worktree creation when the section is missing.
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
| "The user said not to stall on scope, so I'll tell the refinement dispatch to take the smaller option whenever a question comes up" | That is a standing pre-authorization: it decides a whole class of product forks in advance, and nothing in the output shows they were decided rather than referred. Feed the preference to the assumption ladder one question at a time; never write a rule for future questions into a dispatch prompt. An instruction that waives the three-condition blocker test is refused and parks. Record it as a `## Instruction ledger` row classified `refused`, naming the rule, either way. |
| "Quality-check failed again, but the finding is minor" | Three loops, then park. The limit exists because a fourth attempt has never been the fix. |
| "Review flagged another Critical/Important finding, one more build pass will fix it" | Two loops, then park. If two build passes have not resolved it, the run cannot resolve it. |
| "I'll just fix the thejudge skill so the node passes" | Never edit a `thejudge-*` skill. Park and report. |
| "The stash is in the way, I'll pop it" | Never drop, pop, or clear a stash. The deny list enforces this only in a session launched with the profile — assume it is not, and comply anyway. |
| "No ledger row yet, I'll write them all at the end" | Write the row before the next node starts, or a crashed run resumes wrong. |
