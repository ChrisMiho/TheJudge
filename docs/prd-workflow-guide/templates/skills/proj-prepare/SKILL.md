---
name: proj-prepare
description: >-
  Use when an arbitrary <Product> feature, bug, refactor, or code-health audit
  needs one implementation-ready work package before an unattended
  implementation loop.
---

# <Product> Prepare

## Goal

Turn an arbitrary request into exactly one implementation-ready work package
plus a docs-only PR, without a human in the loop — then stop, so a human can
review the plan before any code is written.

## Inputs

- The request, verbatim
- An explicit remote base branch. Never default to `main`; require it and record
  it in the package README under `## Autonomous metadata`.

## Reads

- `PRD/instructions/workflow-reference.md`
- `reference.md` in this skill folder
- Whatever the delegated phase skills read

## Controlling predicate

The phase skills behave interactively by default. They switch to autonomous
behavior only when the controlling agent explicitly states:

    proj-prepare is controlling

State it before each phase. Without the predicate, refinement will wait for
human approval and the run will stall.

## One-package loop

1. **Preflight.** Create the worktree at `.worktrees/prepare-<slug>` only.
   Refuse any sibling path.
2. **Kickoff.** Investigate the request against the corpus and the code. Select
   exactly **one** evidence-backed candidate. If nothing actionable exists,
   return `NO ACTIONABLE PACKAGE` and write nothing.
3. **Refinement.** Produce the brief using the assumption ladder instead of a
   human approval pause. Record every assumption with its evidence.
4. **Quality-check.** On FAIL, return the complete issue list to refinement and
   loop. Do not proceed on a FAIL.
5. **Map-out.** Requires a recorded PASS.
6. **Independent review.** Dispatch a reviewer. Return Critical and Important
   findings to the phase that produced them.
7. **Verification.** Re-run verification fresh before any commit, push, PR, or
   completion claim.
8. **Publish** a READY or BLOCKED PR per `reference.md`.

## Assumption ladder

Resolve uncertainty in this order, and record which rung was used:

1. Active decisions and requirements in `PRD/sections/`
2. Existing tested behavior and public contracts
3. Established local code patterns
4. The smallest reversible scope
5. Preserve user-visible behavior unless the request explicitly changes it
6. Never add a dependency, endpoint, contract, layer, or integration without
   authoritative scope backing it

## Genuine blocker test

Stop only when **all three** hold:

1. The unknown materially changes product behavior.
2. No authoritative basis exists to resolve it.
3. Even the smallest viable option still silently decides the question.

If any one fails, proceed using the ladder.

## Gates

- Docs only. Never write product code or tests.
- One package per run.
- Never merge, close, or force-push a PR.
- Retain the worktree until the PR is merged.
- Never claim completion without fresh verification evidence.

## Terminal states

| State | Shape | Next step |
|---|---|---|
| `READY` | Package `active`; PASS, gameplan, slices, review, and verification recorded; PR titled `[PREP][READY] <name> (<slug>)` | After human merge: `$proj-implement-all PRD/work/<slug>/` |
| `BLOCKED` | Furthest valid status preserved; draft PR titled `[PREP][BLOCKED] <name> (<slug>)` with the question, evidence, plausible outcomes, and a restart prompt | Resolve the `Q-###`, then restart |
| External blocker | Branch, commit, and artifacts preserved; error and recovery action reported | Fix the condition, retry publication |

Every terminal report names the base, the worktree, the branch, the remote
branch, the PR URL, and the PR base.
