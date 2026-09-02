# graph-implement reference

`graph-implement` drives nodes 5–9 (the build half) after resolving the answered
`define` gate. The full node table, caps, ledger schema, and shared machinery are
in `PRD/instructions/graph-workflow-contract.md` — the authority. This file
mirrors the subset this skill runs; when they disagree, the contract wins.

## Node dispatch (build half)

Every node except node 8 (`land`) runs as a subagent with an explicit model
override; `land` is a human PR merge the driver parks for and never dispatches.
The controlling predicate `graph is controlling` must appear in every dispatch
prompt.

| # | Node | Delegate | Model | Cap | On success | On failure |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | `plan` | `/thejudge-map-out` | sonnet | 120 | `build` | park |
| 6 | `build` | `/thejudge-implement-all` | sonnet | 600 | `review` | park |
| 7 | `review` | no-write reviewer subagent | opus | 120 | `land` | `build` for Critical/Important, max 2 loops |
| 8 | `land` | human PR merge | — | — | `close` | park |
| 9 | `close` | `/thejudge-cleanup` | sonnet | 120 | complete | park |

Gate resolution runs before node 5: dispatch `graph-gate-review` on an answered
`GATE-QUESTIONS.md`, then re-enter at `gate-qc` (node 4) so an owner edit is
re-graded, then continue to `plan`.

## Entry point (build half)

A supplied package path resuming the build half enters at the node matching its
`STATUS.*` marker:

| Existing marker | Enter at |
| --- | --- |
| `STATUS.owner-action` | resolve an answered `GATE-QUESTIONS.md` via `graph-gate-review`, then re-enter at `gate-qc`; a blank answer slot re-parks. Any non-`define` gate parks again unless its recorded `## Open gate` is resolved |
| `STATUS.refined` | `gate-qc` |
| `STATUS.active` | `build`, or `plan` when `GAMEPLAN.md` is absent |
| `STATUS.ship-ready` | `close` |

A package still needs a recorded autonomous base. If `## Autonomous metadata` is
missing, run `graph-preflight` first with a supplied `--branch <name>`.

## Node 7 dispatch shape

The reviewer is a subagent this skill dispatches, not a skill. Its dispatch
carries exactly this shape:

- **Tools:** read and search only. No `Write`, `Edit`, or `NotebookEdit`.
- **Context:** fresh. Give it the diff, the slice doc, and the package artifacts.
  Never the build node's transcript.
- **Rubric:** the slice's own `## Acceptance criteria`, quoted into the brief.
- **Severity rule:** a preference, a style note, or an improvement outside the
  slice's stated requirements is **never** Critical or Important and never loops
  back to `build`. Say so in the brief.
- **Working directory:** the same absolute line every other dispatch carries,
  copied unchanged.

Loop cap unchanged: at most two returns to `build`, then park. A **Critical**
finding the run cannot resolve from confirmed decisions and tests parks
immediately (the contract's `## Human gates` bar), without waiting for the cap.

## Node 6 return-side assertion

Every path `build` wrote must lie inside `.worktrees/implement-<slug>/` or
`PRD/work/<slug>/`. A write outside that set fails the node and parks, naming the
offending paths. It is the production counterpart of the fixture rig's
before/after snapshot — a real run is supposed to change the repository, so the
scope set replaces "byte-unchanged".

`plan` requires a recorded quality-check PASS in the package README's
`## Preparation gate` section and cannot self-certify one. The driver writes that
section after every `gate-qc` node.

## Publishing before `build`

`thejudge-implement-all` blocks when the launch checkout has relevant modified or
untracked inputs, and requires the GAMEPLAN, slice docs, and baseline to exist
unchanged at the remote start point. Before dispatching `build`, commit and push
to `origin/<autonomous base>`:

- `GRAPH-RUN.md`, the package `README.md` (including `## Autonomous metadata` and
  `## Preparation gate`), `DESIGN-BRIEF.md`, `GAMEPLAN.md`, every `slice-*.md`, the
  `STATUS.*` marker, and the `PRD/work/STATUS.md` board row.

Then confirm `git status --porcelain` is empty.

### The base is frozen once `build` opens the PR

This publish is the **last** driver push to `origin/<autonomous base>`. From the
moment `build` opens the `-work` → base PR, the driver commits its ledger and
status updates locally only, and pushes nothing to the base until the PR merges —
a driver push to the base after the head forked makes both branches edit
`GRAPH-RUN.md` and the PR conflicts on it. Reconcile at `land`/`close` instead.

## Worktree and branch shape

- Worktree path: `.worktrees/implement-<slug>`, owned by `thejudge-implement-all`.
- Refuse any worktree outside the repo-local `.worktrees/` root.
- One worktree per package, not per slice.
- Dispatch `build` with an explicit shared branch `thejudge-auto/<slug>-work` — a
  distinct head from the autonomous base, so the `-work` → base PR shows the whole
  deliverable and a PR cannot go from a branch into itself.

## Node 8 (`land`) and model rationale

Node 8 is never dispatched — `human PR merge` is not a phase skill. On reaching
`land`, the driver parks with the PR URL and the resume command. A later
`/graph-implement PRD/work/<slug>/` checks whether the PR is merged; if so it
records `land` as `ok` and continues to `close`.

`define` and `review` take opus because their output is judgment the run cannot
recover from. Everything else is bounded, verifiable work. To change a node's
model, edit the table in the contract first — it is the authority; this table
mirrors it.

## Red flags

| Thought | Reality |
| --- | --- |
| "The phase skill would ask the user here, I'll answer for them" | Apply the assumption ladder in `preparation-contract.md`. If it does not resolve, park. |
| "Review flagged another Critical/Important finding, one more build pass will fix it" | Two loops, then park. |
| "I'll just fix the thejudge skill so the node passes" | Never edit a `thejudge-*` skill. Park and report. |
| "No ledger row yet, I'll write them all at the end" | Write the row before the next node starts, or a crashed run resumes wrong. |
