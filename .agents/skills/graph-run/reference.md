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
| 3 | `define` | `/thejudge-refinement` | opus | 150 | `gate-qc` (writes `GATE-QUESTIONS.md` on a non-empty diff; no live park) | park |
| 4 | `gate-qc` | `/thejudge-quality-check` | sonnet | 60 | `plan` | `define`, max 3 loops |
| 5 | `plan` | `/thejudge-map-out` | sonnet | 120 | `build` | park |
| 6 | `build` | `/thejudge-implement-all` | sonnet | 600 | `review` | park |
| 7 | `review` | no-write reviewer subagent | opus | 120 | `land` | `build` for Critical/Important, max 2 loops |
| 8 | `land` | human PR merge | — | — | `close` | park |
| 9 | `close` | `/thejudge-cleanup` | sonnet | 120 | complete | park |

## Where the no-pre-authorization rule lives

One place: `### No pre-authorization of product decisions` in
`PRD/instructions/graph-workflow-contract.md`. `graph-run/SKILL.md` re-reads it
by that heading before every dispatch and points at it rather than restating it.

Do not copy the rule's text here, into `SKILL.md`, or into `AGENT-SKILLS.md`. Two
copies drift, and then two rules disagree about what the driver may do. The
example row below is an illustration of the rule being applied, not the rule.

## Node 7 dispatch shape

The reviewer is a subagent `graph-run` dispatches, not a skill. Its dispatch
carries exactly this shape:

- **Tools:** read and search only. No `Write`, `Edit`, or `NotebookEdit`. A
  reviewer that can change the work is not reviewing it.
- **Context:** fresh. Give it the diff, the slice doc, and the package
  artifacts. Never the build node's transcript — a reviewer that watched the
  work being justified grades the justification.
- **Rubric:** the slice's own `## Acceptance criteria`, quoted into the brief.
  Grade against those, not against taste.
- **Severity rule:** a preference, a style note, or an improvement outside the
  slice's stated requirements is **never** Critical or Important and never loops
  back to `build`. Say so in the brief. A reviewer with a two-loop budget and an
  incentive to look useful will otherwise manufacture findings, and each one
  spends a loop the run cannot get back.
- **Working directory:** the same absolute line every other dispatch carries,
  copied unchanged.

Loop cap unchanged: at most two returns to `build`, then park.

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
| `STATUS.owner-action` | run two: apply an answered `GATE-QUESTIONS.md` via `graph-gate-review`, then re-enter at `gate-qc`; a blank answer slot re-parks. Any non-`define` gate parks again unless its recorded `## Open gate` is resolved |
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
- any `PRD/sections/` edits refinement made — which, being non-empty, means run
  one wrote `GATE-QUESTIONS.md`, the owner answered it, and run two applied the
  verdicts through `graph-gate-review` before reaching `build`

Then confirm `git status --porcelain` is empty. A dirty launch checkout at this
point is a driver bug, not a `build` blocker — fix the publish step rather than
dispatching into a node that will correctly refuse.

### The base is frozen once `build` opens the PR

This publish is the **last** driver push to `origin/<autonomous base>`. From the
moment `build` opens the `-work` → base PR, the driver commits its ledger and
status updates — `GRAPH-RUN.md`, the `STATUS.*` marker, the `PRD/work/STATUS.md`
board row — to the launch checkout **locally only**, and pushes nothing to the
base until the PR has merged. `GRAPH-RUN.md` lives in `PRD/work/<slug>/`, which
the PR head branch also carries; a driver push to the base after that head forked
makes both branches edit the same file and the PR conflicts on it — exactly what
stranded `user-feedback-spec` PR #107 and forced a manual fix on the head branch.

Reconcile at `land`/`close` instead: after the owner merges, `git merge
origin/<autonomous base>` into the launch checkout, resolving `GRAPH-RUN.md` to
the driver's own fuller ledger and keeping a single `STATUS.*` marker. That merge
is local and short-lived — `close` deletes `PRD/work/<slug>/` — so it never
reaches the base or the owner. The one push after the PR opens is `close`'s, of
the receipt and the package deletion, and only after the merge is confirmed.

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
- **Build's PR head branch is distinct from the base.** Dispatch `build` with an
  explicit shared branch `thejudge-auto/<slug>-work` — the optional shared-branch
  input `thejudge-implement-all` accepts. Without it the skill derives the shared
  branch as `thejudge-auto/<slug>`, the **same name as the autonomous base**, and
  a PR cannot go from a branch into itself. Left to improvise, `build` splits the
  work — some slices pushed straight onto the base, the rest onto an ad-hoc fork —
  so the PR never shows the full deliverable (observed on `life-tracker-spec`
  PR #105 and `user-feedback-spec` PR #107). A distinct `-work` head puts every
  slice on one PR head, opens a clean `-work` → base PR that shows the whole
  deliverable, and keeps the base untouched by `build` until the owner merges.
  `thejudge-implement-all` now also blocks on this collision on its own side, but
  the driver supplies the distinct name so the block never fires in a graph run.

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
