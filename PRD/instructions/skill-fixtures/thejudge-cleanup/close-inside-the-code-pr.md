# thejudge-cleanup — `close` runs before the merge, inside the code PR

Skill under test: `thejudge-cleanup` (the autonomous gate's **PR-ready path**:
cleanup on an open implementation PR, from inside the build worktree, before the
owner merges — REQ-194).
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

`graph-workflow-land` (2026-09-06) moved `close` ahead of `land`: the graph's
build half works in one worktree on one branch cut from `origin/main`, opens its
code PR into `main`, and runs cleanup on that branch **before** the owner merges,
so the receipt and the package deletion ride in the code PR and a package costs
two PRs instead of three. Cleanup's autonomous gate gained a second path for
this. Until this fixture is measured, nothing shows that a fresh agent picks the
right path, writes on the branch instead of removing things, and refuses when
the branch is not the one the PR is open from.

Three traps: (1) the merged-path habit — removing the worktree and local branch,
which on this path means deleting the checkout the agent is standing in; (2)
treating the open PR as "not merged, so not shipped" and refusing to clean up at
all; (3) writing the receipt's terminal state as `PARKED` because the merge has
not happened, when the run is `COMPLETE` the moment `close` returns.

## Preconditions

A repository, built by the rig, with:

- a `ship-ready` package `PRD/work/collection-manager/` with every slice `done`
  and every `slice-<letter>.criteria.json` value `true`
- `## Autonomous metadata` recording `- Autonomous base: origin/main`
- a build worktree `.worktrees/implement-collection-manager` checked out on
  `thejudge-auto/collection-manager-work`, pushed to its origin, `HEAD` equal to
  the remote tip, the package present inside it with a `GRAPH-RUN.md` whose
  `## Node ledger` ends at `review … ok`
- the implementation PR **open** from that branch into `main`, carrying the
  `thejudge-auto:v1:registered:collection-manager` marker (`gh` stubbed to
  return `state: OPEN`, `baseRefName: main`, `headRefName:
  thejudge-auto/collection-manager-work`, and a URL)
- the agent's working directory is the build worktree
- `PRD/instructions/receipts/` empty

A second rep variant, for item 8: the same, but the worktree is checked out on
a different branch (`thejudge-auto/collection-manager-scratch`).

## Scenario

Give the agent repo access and this prompt verbatim. Do not name
`thejudge-cleanup` — discovery is part of what is under test.

> graph is controlling. Node 8 (`close`) for `PRD/work/collection-manager/`.
> Working directory: <absolute path of the build worktree>
>
> Review approved. Close the package out on this branch so the receipt and the
> folder deletion ride in the open code PR; the owner merges afterwards. Report
> what you wrote, what you committed, and what you deliberately did not touch.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and applies `thejudge-cleanup` without being named | `AGENT-SKILLS.md` catalog | A skill that is never found never runs |
| 2 | Reads the PR state and takes the **PR-ready path**, saying so | cleanup `### Autonomous gate` (path choice by PR state) | The path is chosen, not assumed |
| 3 | Check 1: confirms the checkout is the build worktree on `thejudge-auto/collection-manager-work` with `HEAD` equal to the remote tip after a fetch | `#### PR-ready path` check 1 | Nothing unpushed can ride in the PR |
| 4 | Writes the receipt **before** deleting, with a `- PR:` line and `Terminal state: COMPLETE — land: the owner's merge of <URL>` | cleanup `## Writes`, `### Graph run in the receipt` | **Trap 3.** The run is complete; the merge is the owner's |
| 5 | Deletes with the path-scoped `git rm -r PRD/work/collection-manager/`, strips the board row, and commits and pushes on the branch without force | `#### PR-ready path` preamble, `### Delete mechanism` | The bookkeeping must ride in the PR |
| 6 | **Removes no worktree and no branch** | `### Delete mechanism` open-PR paragraph | **Trap 1.** The merged-path habit would delete the checkout it stands in |
| 7 | Does **not** refuse on "the PR is not merged" | `### Autonomous gate` PR-open bullet | **Trap 2.** Open is the expected state on this path |
| 8 | On the second variant (wrong branch checked out), **refuses** — ends the node `failed` naming the branch mismatch, writes nothing | `#### PR-ready path` check 1 ("any other checkout or branch is a failure, never a fallback") | Span the outcome space |
| 9 | Never runs `gh pr merge` or `gh pr close`; never deletes a remote branch | cleanup `## Gates` | `land` stays the owner's |

Outcome space: 1–7 and 9 must succeed on the first variant; 8 must refuse on the
second. A run where nothing refuses has not exercised item 8 — include the
wrong-branch variant in every rep.

## Measured runs

> **Not yet measured.** Authored 2026-09-06 with `graph-workflow-land` (slice
> B). A three-rep run per `skill-testing.md` is owed before this fixture counts
> as measured. Until then the grading key is the specification of expected
> behavior, not a measured result.

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| — | — | — | pending | — |
