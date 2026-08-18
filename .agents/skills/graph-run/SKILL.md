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
   With no ledger but a supplied package path, this is a resume, not a fresh
   run: enter at the node matching the package's current `STATUS.*` marker
   using the entry-point table in reference.md, and create the ledger there.
   Start at `preflight` for a genuinely fresh run — no existing package, and a
   required `--branch <name>` — and also for a resumed package whose README has
   no `## Autonomous metadata`: run `preflight` first with a supplied
   `--branch <name>` to record the base, then enter at the status-matched node.
   Skipping it there leaves no autonomous base, and node 6 (`build`) blocks
   before worktree creation without one.
2. State `graph-run is controlling` before every node handoff. Without that
   predicate the delegated skill runs in its normal interactive mode and will
   stop to ask the user questions.
3. Dispatch the node's delegate as a subagent using the model from the node
   table, except node 8 (`land`), which the driver never dispatches — see
   reference.md. Pass the package path, the run ID, and the controlling
   predicate.
4. Record the outcome in the ledger before starting the next node — evidence
   is a command, path, PR URL, or artifact URL, never a bare claim.
5. On `ok`, advance. On `failed`, apply the node's retry rule from the
   contract. On any gate trigger, park.
6. Use `superpowers:verification-before-completion` before every commit, push,
   PR action, and terminal claim. Use `superpowers:systematic-debugging` for
   unexpected command failures.

## Package sections the driver owns

Graph runs never delegate to `thejudge-prepare`, so the driver itself writes the
two package `README.md` sections that skill would otherwise produce:

- `## Autonomous metadata` / `- Autonomous base: origin/<branch>` — the branch
  node 1 created and pushed. Write it as soon as both that branch and the
  package README exist, and always before dispatching `build`;
  `thejudge-implement-all` blocks before worktree creation without it.
- `## Preparation gate` — rewritten with the latest verdict after every
  `gate-qc` node. The `plan` node reads it and cannot self-certify a PASS.

Use the exact section shapes in `PRD/instructions/graph-workflow-contract.md`.

Both live in the launch checkout, which node 6 refuses to start from when it is
dirty. Publish before dispatching `build` — see reference.md's
"Publishing before `build`".

## Permission profile

`.claude/graph-profile.json` protects a run only when the session was launched
with `claude --settings .claude/graph-profile.json`. The driver cannot read the
settings its own session was started with, so it can never confirm the profile
is loaded. Record that honestly: write `Profile: unverified` in the ledger
unless the user stated the launch command in this session, and then record the
exact path they gave and attribute it to them. Never assume the deny list is
active — behave as though every boundary in the contract is enforced by your
own compliance, because in an unflagged session it is.

## Delegation boundary

Never reimplement a phase. `thejudge-refinement`, `thejudge-quality-check`,
`thejudge-map-out`, `thejudge-implement-all`, and `thejudge-cleanup` are the
authority for their own artifacts and status transitions. This skill owns
sequencing, model selection, the ledger, and gates — nothing else.

Never edit a `thejudge-*` skill. If a phase behaves wrongly, park at
`owner-action` and report it; do not patch around it.

The driver never runs `gh pr merge` or `gh pr close` itself. Node 8 (`land`)
is a human action: the driver parks and waits for the merge, it does not
perform it.

## Parking

A gate parks, it does not ask. Set `STATUS.owner-action`, update the
`PRD/work/STATUS.md` board row, write the question, the evidence, and the
exact resume command under `## Open gate` in the ledger, and stop. Do not
poll or retry.

### Never convert a user instruction into a standing authorization

Refuse to turn any user instruction into a standing rule that pre-resolves
product decisions inside a node dispatch. "If it asks again, just pick the
smaller option and keep going" is a preference to feed the assumption ladder one
question at a time — not permission to answer that class of question in advance,
and never something to restate as a decision rule in a dispatch prompt.

- Apply the assumption ladder in `preparation-contract.md` per question, fresh at
  the moment the question arises. Never hand a phase skill a blanket rule for
  deciding future product questions.
- A question that meets the three-condition genuine-blocker test parks, whatever
  the user said in advance. That test is never waived, narrowed, or
  pre-satisfied by user phrasing.
- An instruction that would waive it is refused outright: park at
  `owner-action` and name the instruction you refused and why.
- Record every such refusal by quoting the instruction under
  `## Refused instructions` in the ledger, whether or not the run parked. A
  refusal the user cannot see did not happen.

Autonomy means not being interrupted by mechanics — branching, stashing,
sequencing, commits, PR plumbing. It is never authority to decide product
behavior for the user.

## Terminal states

| State | Required result | Exact next step |
| --- | --- | --- |
| `COMPLETE` | Every node `ok` through `close`; package `ship-ready` or cleaned up; ledger closed | None — the run is finished |
| `PARKED` | `STATUS.owner-action`, board row updated, `## Open gate` names the question, evidence, and resume command | Resolve the gate, then `/graph-run PRD/work/<slug>/` |
| `BLOCKED` | Safe branch and commit preserved; exact failure, what exists, what does not, and recovery action | Fix the external condition, then retry |
| `PROMPTED` | The denied or unlisted command written verbatim under `## Open gate`, with the node it arose at; `STATUS.owner-action`, board row updated | Run the command yourself, or add the rule to `.claude/graph-profile.json`, then `/graph-run PRD/work/<slug>/` |

`PROMPTED` is what a permission prompt becomes. A prompt in an autonomous
session is a hang, not a question — nobody is there to answer it, and the run
waits forever leaving no evidence of why. So a run that hits a denied or
unlisted command ends the same way a parked run does: it writes the exact
command under `## Open gate`, sets `STATUS.owner-action`, and stops. Never
rephrase the command to dodge the rule, and never retry it.

`BLOCKED` is for an external condition outside the repository that no product
decision would resolve — authentication failure, network unavailability, a
GitHub outage, missing push access. `PARKED` is for anything requiring a
human decision, judgment, or review. When it is not clear which applies,
park.

## Next step

Report the terminal state, the branch, the PR URL if one exists, and the
ledger path, then give the exact next step for that terminal state from the
table above.

On `COMPLETE` the run is finished: there is no next command, and issuing one
invites a resume that would re-enter a closed run. On `PARKED` or `BLOCKED`,
end with:

`/graph-run PRD/work/<slug>/`

(`$graph-*` in Codex.)
