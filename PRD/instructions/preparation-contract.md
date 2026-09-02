# Autonomous Preparation Contract

## Purpose and precedence

This contract governs one autonomous TheJudge preparation run from request to
reviewable planning artifacts. It coordinates the existing kickoff, refinement,
quality-check, and map-out contracts without replacing them. Active decisions
and requirements in `PRD/sections/` remain product truth; this file governs the
preparation process. If a phase skill conflicts with this contract while
`thejudge-prepare` is controlling, this contract governs approval and
continuation behavior while the phase skill continues to govern its artifacts.

## Direct versus orchestrated mode predicate

Orchestrated mode is active only when the controlling agent explicitly names
itself as controlling the current run: `thejudge-prepare is controlling` for a
preparation run, or `graph-run is controlling` for an autonomous graph run
(`PRD/instructions/graph-workflow-contract.md`). The orchestrator must state
its own predicate when handing work to each phase, and never states another
orchestrator's name — the predicate is an attestation of which orchestrator is
running, not a mode switch any caller may borrow.

Without one of those observable predicates, every phase runs directly and
preserves its normal user questions, approval pauses, reads, outputs, and
handoff.

## Autonomous base

`thejudge-prepare` is an explicit opt-in that requires a remote base argument,
such as `--base feature/example`. It never defaults to `main` and never infers
the current branch as the base. A missing, unavailable, or contradicted base
blocks before worktree creation — report the missing base rather than silently
choosing one.

The resolved base is recorded as durable package metadata in the package
`README.md`:

```markdown
## Autonomous metadata

- Autonomous base: origin/<branch>
```

Downstream autonomous skills — `thejudge-implement-all`,
`thejudge-implement-fanout`, and `thejudge-cleanup` — read and inherit this
value, and block if it is missing, unavailable, or contradicted by a supplied
branch or PR.

## One-package candidate selection and `NO ACTIONABLE PACKAGE`

Produce exactly one `PRD/work/<slug>/` package per invocation.

For a specific request, investigate only enough request-relevant PRD and code to
validate and bound it. For a broad request:

1. Gather concrete findings with file-level evidence.
2. Exclude cosmetic churn, speculative abstractions, and work unsupported by
   current behavior or requirements.
3. Rank viable findings by impact, confidence, implementation risk, and scope.
4. Select the single highest-value finding and record why it outranks the other
   viable candidates in the preparation PR body.

If no candidate is valuable and evidence-backed, return `NO ACTIONABLE PACKAGE`.
Do not create a work folder, branch commit, or pull request for that result.

## Conservative assumption ladder

Resolve uncertainty from the first authoritative source that answers it:

1. Active decisions and requirements in `PRD/sections/`.
2. Existing tested behavior and public contracts.
3. Established local code patterns.
4. The smallest reversible scope.
5. Preservation of user-visible behavior unless the request changes it.
6. No new dependency, endpoint, data contract, architectural layer, or external
   integration without authoritative scope.

Record every material assumption and its evidence in `DESIGN-BRIEF.md` and the
preparation PR body. Infer naming, file organization, equivalent technical
choices, and slice boundaries when repository evidence supports a conservative
choice.

## Genuine decision blocker test

A question blocks preparation only when all three conditions hold:

1. Plausible answers materially change product behavior, a public contract,
   data handling, security posture, or scope.
2. The PRD, tested behavior, and established patterns provide no authoritative
   basis for choosing.
3. Choosing the smaller option would still silently decide the disputed product
   behavior.

Otherwise apply the assumption ladder and continue. When all conditions hold,
create or reuse a stable `Q-###` identifier, preserve every valid artifact, and
omit downstream artifacts that would depend on the answer.

## Phase inputs, outputs, and valid status transitions

The recorded autonomous base is a precondition for every phase below, not
phase-specific state: it is resolved before the first phase runs and remains
unchanged for the life of the package.

| Phase | Required input | Required output | Status transition |
| --- | --- | --- | --- |
| Investigate and kickoff | Original request or resumable work-folder path | Selected candidate evidence; `IDEA.md`; package `README.md` | new → `ideation` |
| Refinement | `IDEA.md` or an equivalent captured request | `DESIGN-BRIEF.md`; proposed durable-PRD edits recorded in `GATE-QUESTIONS.md` (never written to `PRD/sections/` here — `build` applies them); material assumptions | `ideation` → `refined` |
| Quality-check | `DESIGN-BRIEF.md` and affected authoritative PRD | Explicit PASS or FAIL with complete findings; latest result recorded in the package README | no status advance |
| Map-out | Recorded quality-check PASS | `GAMEPLAN.md`; lettered slice docs; README slice table and implementation map | `refined` → `active` |
| Independent review | Original request, authoritative artifacts, repository evidence, and prepared diff | Request-fidelity and quality verdict with findings | no status advance |
| Preparation verification | Reviewed artifacts and staged docs-only diff | Fresh validation, repository, diff, and skill-sync evidence | no status advance |

A blocked package keeps its furthest valid lifecycle status. It records the
blocker instead of advancing to a phase whose inputs are not valid.

## Quality FAIL feedback loop

Every quality-check emits PASS or FAIL. On FAIL, return the complete issue list
to refinement, make a material correction, and run quality-check again. Map-out
requires a recorded PASS and cannot self-certify one.

After each orchestrated quality-check, `thejudge-prepare` records the latest
result in `PRD/work/<slug>/README.md` using this exact section shape:

```markdown
## Preparation gate

- Quality-check: PASS | FAIL
- Checked artifact: `PRD/work/<slug>/DESIGN-BRIEF.md`
- Findings: none | <complete issue list>
```

Replace this section with the latest result after refinement and re-check. A
map-out call verifies `Quality-check: PASS` in this section before writing any
planning artifact.

Repeated FAIL results are not automatically product blockers. Continue the
feedback loop until the package passes or the unresolved issue satisfies the
genuine decision blocker test. After map-out, Critical or Important independent
review findings return to the relevant preparation phase before publication.

## READY, BLOCKED, and external-blocker terminal contracts

| Terminal state | Required shape | Next step |
| --- | --- | --- |
| `READY` | Package is `active`; quality-check PASS, complete GAMEPLAN/slices, independent review, and fresh verification are recorded; PR is non-draft with title `[THEJUDGE-PREP][READY] <work name> (<slug>)` | After human merge: `$thejudge-implement-all PRD/work/<slug>/` |
| `BLOCKED` | Package preserves its furthest valid status; draft PR title is `[THEJUDGE-PREP][BLOCKED] <work name> (<slug>)`; question, evidence, divergent outcomes, omitted artifacts, and restart prompt are present | Resolve the named `Q-###`, then use the exact restart prompt below |
| External blocker | Safe local branch and commit are preserved when possible; report names the failed operation, exact error, what exists, what does not exist, and exact recovery action | Retry publication only after the external condition is fixed |

Do not claim READY or BLOCKED until fresh verification passes. Do not claim a PR
exists when authentication, network, permission, or Git state prevented it.

## Git/PR authorization boundary

Explicit `thejudge-prepare` invocation on a supported surface
(`/thejudge-prepare` or `$thejudge-prepare`) authorizes an isolated worktree from
the latest fetched recorded autonomous base, documentation commits, non-force
pushes, and creation or update of one preparation PR whose PR base is the
recorded autonomous base. The worktree path is `.worktrees/prepare-<slug>` and
the branch is `thejudge-prep/<slug>`, unless a compatible preparation branch or
PR is supplied.

The design stops before implementation, so this authorization does not include
product-code or product-test edits. It also excludes merges, closes, force
pushes, stashing, destructive cleanup, and changes to unrelated launch-checkout
work. If relevant uncommitted launch-checkout inputs are absent from the
selected remote base, stop and report them instead of copying or stashing them.

## Worktree retention

The preparation worktree and its local branch remain after `READY` or `BLOCKED`
publication. They are removed only once implementation preflight has proven the
preparation PR merged into the recorded autonomous base and that worktree is
clean. `thejudge-implement-all`'s preflight owns that removal step; preparation
must not violate this contract by self-deleting its worktree or branch early.

## Required PR body fields and exact restart-prompt shape

Every preparation PR body includes:

- Original request
- Selected finding, repository evidence, and—when alternatives were viable—why
  it outranks them
- Material assumptions
- PRD alignment and durable PRD changes, if any
- Work-package artifact summary
- Planned slices and verification commands, when mapped
- Preparation checks and independent-review result

A READY body also includes the post-merge command
`$thejudge-implement-all PRD/work/<slug>/`.

A BLOCKED body also includes the unresolved question and stable identifier,
evidence that PRD and code cannot answer it, materially different outcomes,
furthest valid phase, and invalid or intentionally omitted downstream artifacts.
End with this exact restart-prompt shape:

```text
Use $thejudge-prepare to resume PRD/work/<slug>/ after resolving <question-id>: <answer>. Re-run refinement, quality-check, map-out, independent review, and preparation verification before updating the PR.
```

## Superpowers mapping

- Use `superpowers:brainstorming` for design analysis; this explicit autonomous
  contract replaces interactive approval pauses with the assumption and blocker
  rules above.
- Use `superpowers:requesting-code-review` for independent pre-publication
  review.
- Use `superpowers:verification-before-completion` before commits, pushes, PR
  creation or updates, and terminal claims.
- Use `superpowers:systematic-debugging` for unexpected validation, Git, or
  repository-command failures.
- Do not use `superpowers:writing-plans`; `thejudge-map-out` and `PRD/work/` are
  the implementation-planning authority.

## Red flags and observed rationalization table

Baseline pressure tests found no discipline violation: agents selected one
evidence-backed candidate, preserved a genuine blocker, and refused to map after
a real quality FAIL. Therefore the observed table contains only structural drift
from those tests and does not invent prohibition counters.

| Observed drift | Required structure |
| --- | --- |
| Baseline runs improvised local Git handling and had no preparation branch or PR convention. | Use `thejudge-prep/<slug>` and the exact READY/BLOCKED publication contracts when a remote is available; use the external-blocker report when it is not. |

The approved design additionally makes these structural contract gaps red
flags: a missing terminal field, an unrecorded quality PASS before map-out, or a
branch/PR shape that does not match the contract. Correct the missing structure
and re-verify it; these are design-derived checks, not observed rationalizations.
