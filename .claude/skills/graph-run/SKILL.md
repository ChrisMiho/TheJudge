---
name: graph-run
description: >-
  Use to advance one TheJudge work package through the full lifecycle without
  per-step user input — sequencing preflight, refinement, quality-check,
  map-out, implementation, and review as delegated nodes with a resumable
  on-disk ledger.
---

# Graph Run

## Goal and inputs

Advance exactly one `PRD/work/<slug>/` package as far as it can go without a
human, then either complete the run or park it at a named gate. `graph-run` is
the driver that `PRD/instructions/graph-workflow-contract.md` refers to
throughout.

Accept a work-package path, or a request plus `--branch <name>` to start a new
package from scratch. A `--branch` argument is required on a fresh run and is
never inferred from the current branch.

Read `PRD/instructions/graph-workflow-contract.md` and [reference.md](reference.md)
in full before acting. Their node table, ledger schema, gate rules, and
boundaries are required.

## Loop

1. Read `PRD/work/<slug>/GRAPH-RUN.md` if it exists. Resume at `Current node`.
   With no ledger, start at `preflight` and create one.
2. State `graph-run is controlling` before every node handoff. Without that
   predicate the delegated skill runs in its normal interactive mode and will
   stop to ask the user questions.
3. Dispatch the node's delegate as a subagent using the model from the node
   table. Pass the package path, the run ID, and the controlling predicate.
4. Record the outcome in the ledger before starting the next node — evidence
   is a command, path, PR URL, or artifact URL, never a bare claim.
5. On `ok`, advance. On `failed`, apply the node's retry rule from the
   contract. On any gate trigger, park.
6. Use `superpowers:verification-before-completion` before every commit, push,
   PR action, and terminal claim. Use `superpowers:systematic-debugging` for
   unexpected command failures.

## Delegation boundary

Never reimplement a phase. `thejudge-refinement`, `thejudge-quality-check`,
`thejudge-map-out`, `thejudge-implement-all`, and `thejudge-cleanup` are the
authority for their own artifacts and status transitions. This skill owns
sequencing, model selection, the ledger, and gates — nothing else.

Never edit a `thejudge-*` skill. If a phase behaves wrongly, park at
`owner-action` and report it; do not patch around it.

## Parking

A gate parks, it does not ask. Set `STATUS.owner-action`, update the
`PRD/work/STATUS.md` board row, write the question and evidence under
`## Open gate` in the ledger, and stop. Do not poll or retry.

## Terminal states

| State | Required result | Exact next step |
| --- | --- | --- |
| `COMPLETE` | Every node `ok`; package `ship-ready` or cleaned up; ledger closed | Review and merge the PR |
| `PARKED` | `STATUS.owner-action`, board row updated, `## Open gate` names the question, evidence, and resume command | Resolve the gate, then `/graph-run PRD/work/<slug>/` |
| `BLOCKED` | Safe branch and commit preserved; exact failure, what exists, what does not, and recovery action | Fix the external condition, then retry |

## Next step

Report the terminal state, the branch, the PR URL if one exists, and the
ledger path, then:

`/graph-run PRD/work/<slug>/`

(`$graph-*` in Codex.)
