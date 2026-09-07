# graph-implement reference

`graph-implement` drives nodes 5–9 (the build half) after resolving the answered
`define` gate. The full node table, caps, ledger schema, and shared machinery are
in `PRD/instructions/graph-workflow-contract.md` — the authority. This file
mirrors the subset this skill runs; when they disagree, the contract wins.

## Node dispatch (build half)

Every node except node 9 (`land`) runs as a subagent with an explicit model
override; `land` is the owner merging the code PR, after the run has already
ended `COMPLETE` at `close`, and the driver never dispatches it. The controlling
predicate `graph is controlling` must appear in every dispatch prompt, and every
build-half dispatch carries `Working directory: <root>/.worktrees/implement-<slug>`.

| # | Node | Delegate | Model | Cap | On success | On failure |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | `plan` | `/thejudge-map-out` | sonnet | 120 | `build` | park |
| 6 | `build` | `/thejudge-implement-all` | sonnet | 1200 | `review` | park |
| 7 | `review` | no-write reviewer subagent | opus | 120 | `close` | `build` for Critical/Important, max 2 loops |
| 8 | `close` | `/thejudge-cleanup` (PR-ready path, on the code branch, before the merge) | sonnet | 120 | `land` — the run ends `COMPLETE` with the code PR open | park |
| 9 | `land` | human PR merge | — | — | run complete — outside the run's ledger; the package is on `main` when the owner merges | — |

Gate resolution runs before node 5: dispatch `graph-gate-review` on an answered
`GATE-QUESTIONS.md`, then re-enter at `gate-qc` (node 4) so an owner edit is
re-graded, then continue to `plan`.

## Entry point (build half)

A supplied package path resuming the build half enters at the node matching the
`STATUS.*` marker **inside the build worktree** `.worktrees/implement-<slug>`
(the launch checkout's copy is whatever the docs merge left and is never read):

| State in `.worktrees/implement-<slug>` | Enter at |
| --- | --- |
| `STATUS.owner-action` | resolve an answered `GATE-QUESTIONS.md` via `graph-gate-review`, then re-enter at `gate-qc`; a blank answer slot re-parks. Any non-`define` gate parks again unless its recorded `## Open gate` is resolved |
| `STATUS.refined` | gate resolution when `## Gate verdicts` is absent from the ledger (the claim leaves the marker `refined`), else `gate-qc` |
| `STATUS.active` | `build`, or `plan` when `GAMEPLAN.md` is absent |
| `STATUS.ship-ready` | `close` |
| no `PRD/work/<slug>/` at all | post-`close`: read the receipt's `### Node ledger`; append the `close` row if missing, push, release the lock, `COMPLETE`; if present, nothing — the code PR is the owner's |
| `thejudge-auto/<slug>-work` on `origin`, no local worktree | re-create it: `git worktree add .worktrees/implement-<slug> -b thejudge-auto/<slug>-work origin/thejudge-auto/<slug>-work`, then read the marker as above |
| the path exists but is not a usable worktree | `BLOCKED`, naming it |

The autonomous base is written by the claim itself (`- Autonomous base:
origin/main`), so a build-half package never lacks one; `graph-preflight` is
never run in this half — it would cut a kickoff branch and worktree this design
forbids.

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

Two checks, both required (REQ-193). The launch checkout's
`git status --porcelain`, captured before `build` was dispatched, must be
identical after it returns — the launch checkout is on `main` and any write
there shows. And every path `build` reports, made launch-root-relative (absolute
paths have the root stripped), must lie inside `.worktrees/implement-<slug>/`
(`buildWriteScope` / `classifyBuildWrites` in `scripts/graph-ledger-check.mjs`).
The work package lives inside that worktree, so a bare `PRD/work/<slug>/…` path
is a write to the launch checkout — the 2026-09-05 failure where slice status
landed in the launch checkout instead of the PR head. A write outside the scope
fails the node and parks, naming the offending paths. It is the production
counterpart of the fixture rig's before/after snapshot — a real run is supposed
to change the repository, so the scope set replaces "byte-unchanged".

`plan` requires a recorded quality-check PASS in the package README's
`## Preparation gate` section and cannot self-certify one. The driver writes that
section after every `gate-qc` node.

## Publishing before `build`

`thejudge-implement-all` requires the GAMEPLAN, slice docs, and baseline to exist
unchanged at the remote start point — `origin/thejudge-auto/<slug>-work`'s tip.
Before dispatching `build`, commit in the build worktree and push the shared
branch:

- `GRAPH-RUN.md`, the package `README.md` (including `## Autonomous metadata` and
  `## Preparation gate`), `DESIGN-BRIEF.md`, `GAMEPLAN.md`, every `slice-*.md`, the
  `STATUS.*` marker, and the `PRD/work/STATUS.md` board row.

Then confirm `git status --porcelain` is empty in the worktree. This is an
ordinary between-nodes driver commit, not a last push: the driver keeps
committing to the same branch between every later node. There is no frozen
base and no reconcile step — the builder and the driver write one branch in
turns, so nothing ever conflicts (REQ-193).

## Worktree and branch shape

- Worktree path: `.worktrees/implement-<slug>`, **created by the driver at claim**
  on `thejudge-auto/<slug>-work` cut from `origin/main`; `thejudge-implement-all`
  works in it in place under `graph is controlling` (no second worktree, no
  contributor branch).
- Refuse any worktree outside the repo-local `.worktrees/` root.
- One worktree per package, not per slice; one branch per package.
- The spec-forming half's `.worktrees/kickoff-<slug>` is removed before the claim
  (clean tree only, `git worktree remove`, no `--force`; dirty → report and skip
  the spec unclaimed); the local `thejudge-auto/<slug>` docs branch is left for
  `npm run graph:prune` (see `SKILL.md`, "Claim it").
- Dispatch `build` naming the shared branch `thejudge-auto/<slug>-work`
  explicitly; the skill blocks when it is missing or differs from the worktree's
  checked-out branch. The code PR is `thejudge-auto/<slug>-work → main`.
- Driver commits: `cd <root>/.worktrees/implement-<slug> && git add <paths> &&
  git commit …`, then `git push -u origin thejudge-auto/<slug>-work` — the forms
  `.claude/graph-profile.json` allows. Never `git -C`, which it does not.

## Node 9 (`land`) and model rationale

Node 9 is never dispatched — `human PR merge` is not a phase skill — and it
comes **after** the run has ended: node 8 (`close`) writes the receipt and
deletes the package on the code branch, the driver ends `COMPLETE` with the PR
open, and the owner's merge is what puts the package on `main`. No ledger row
is written for `land`; the receipt's `Terminal state:` line names the merge as
the owner's.

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
