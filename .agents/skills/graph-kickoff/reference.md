# graph-kickoff reference

`graph-kickoff` drives nodes 1–4 (the spec-forming half). The full node table,
caps, ledger schema, and shared machinery are in
`PRD/instructions/graph-workflow-contract.md` — the authority. This file mirrors
the subset this skill runs; when they disagree, the contract wins.

## Node dispatch (spec-forming half)

Every node runs as a subagent with an explicit model override. The controlling
predicate `graph is controlling` must appear in the dispatch prompt — the
`thejudge-*` phase skills check for it and otherwise run interactively.

| # | Node | Delegate | Model | Cap | On success | On failure |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `preflight` | `/graph-preflight --branch <name>` | haiku | 40 | `shape` | park |
| 2 | `shape` | `/thejudge-kickoff` | sonnet | 60 | `define` | park (or `BLOCKED` on `NO ACTIONABLE PACKAGE`) |
| 3 | `define` | `/thejudge-refinement` | opus | 150 | `gate-qc` (writes `GATE-QUESTIONS.md` on a proposed change; no live park) | park |
| 4 | `gate-qc` | `/thejudge-quality-check` | sonnet | 60 | **stop at PASS** (docs PR + `owner-action`) | `define`, max 3 loops; a 4th FAIL parks |

At `gate-qc` PASS the run does not advance to `plan` — it publishes the proposal,
opens the docs-only PR into `main`, and parks at `owner-action`. The build half
(`graph-implement`) picks the spec up once the owner answers and merges that PR,
in its own worktree cut from `origin/main` (REQ-193).

## Entry point with no ledger (spec-forming half)

A supplied package path with no `GRAPH-RUN.md` is a resume. Enter at the node
matching the package's existing `STATUS.*` marker:

| Existing marker | Enter at |
| --- | --- |
| no package folder at all | `preflight` (requires `--branch <name>`) |
| `STATUS.ideation` | `define` |
| `STATUS.refining` | `define` |
| `STATUS.refined` | `gate-qc` |
| `STATUS.owner-action` | hand off to `graph-implement` — the build half owns the answered gate |
| `STATUS.active` / `STATUS.ship-ready` | hand off to `graph-implement` |
| `STATUS.deferred` | refuse; `thejudge-defer` restores it first |

A package entered mid-lifecycle still needs a recorded autonomous base. If
`## Autonomous metadata` is missing from its README, run `preflight` first with a
supplied `--branch <name>`, record the base, then enter at the status-matched node.

## Where the no-pre-authorization rule lives

One place: `### No pre-authorization of product decisions` in
`PRD/instructions/graph-workflow-contract.md`. Re-read it by that heading before
every dispatch and point at it rather than restating it. Do not copy the rule's
text here or into `SKILL.md`.

## Ledger writes

Append one row per node attempt — never overwrite a prior attempt's row. A retried
node gets a new row, so the ledger shows the loop count `gate-qc`'s three-loop
limit is measured against. Update `Current node` and `Next action` in the same
edit that appends the row.
