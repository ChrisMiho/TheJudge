# TheJudge Autonomous Work Preparation Design

## Purpose

Create a reusable `thejudge-prepare` skill that accepts an arbitrary work request, investigates it against the repository and PRD, and produces exactly one implementation-ready `PRD/work/<slug>/` package. The primary initial use case is a recurring code-health audit, but the same preparation loop must also support features, bugs, and refactors.

The preparation loop stops before product-code implementation. It publishes a docs-only pull request that a human can review and merge before a separate `thejudge-implement-all` loop begins.

## Goals

- Convert one passed-in request into one evidence-backed work package.
- Reuse the existing kickoff, refinement, quality-check, and map-out phase contracts.
- Make conservative assumptions from authoritative PRD and repository evidence.
- Continue without interactive approval unless a material product decision truly cannot be inferred.
- Publish reviewable READY and BLOCKED outcomes through GitHub.
- Apply relevant Superpowers skills consistently without creating a second planning system.
- Preserve the existing interactive behavior of directly invoked TheJudge workflow skills.

## Non-goals

- Implement product code or tests.
- Produce more than one work package per invocation.
- Manufacture cleanup work when a broad audit finds no valuable, evidence-backed improvement.
- Merge or close pull requests.
- Replace `PRD/work/` with `docs/superpowers/plans/` or another planning location.
- Change product behavior during a code-health audit unless the passed request explicitly asks for it.

## Architecture

Add `thejudge-prepare` as an orchestrator over shared phase contracts:

`request -> investigate -> capture -> refine -> quality loop -> map out -> independent review -> preparation PR`

The components are:

1. **`thejudge-prepare` skill:** Owns orchestration, candidate selection, the autonomous assumption policy, Git isolation, terminal-state handling, and PR publication.
2. **Shared preparation contract:** A PRD instruction defines phase inputs and outputs, direct versus orchestrated mode, assumption rules, quality-loop behavior, work-package states, and blocked handoffs.
3. **Existing phase skills:** Kickoff, refinement, quality-check, and map-out continue to work independently. Each gains a conditional orchestrated mode that is active only when `thejudge-prepare` is the controlling skill.
4. **Existing implementation handoff:** A merged READY preparation PR hands off to `$thejudge-implement-all PRD/work/<slug>/`.

The canonical skill is authored under `.cursor/skills/thejudge-prepare/`, then synchronized into `.agents/skills/` and `.claude/skills/` with the existing `npm run skills:ai-sync` workflow. The skill package includes Codex UI metadata generated through the skill-creator tooling.

## Invocation and Authorization

An explicit `thejudge-prepare` invocation supplies:

- An arbitrary request, such as a feature, bug, refactor, or code-health audit direction.
- Optionally, an existing `PRD/work/<slug>/` path to resume.
- Optionally, a remote preparation branch or PR to join.

Explicit invocation authorizes an isolated worktree, a preparation branch, documentation commits, non-force pushes, and preparation-PR creation or updates. It does not authorize product-code edits, force pushes, PR merges, PR closes, or destructive cleanup.

## Candidate Selection

For a specific request, investigate only enough repository and PRD context to validate and bound that request.

For a broad request such as a code-health audit:

1. Gather concrete findings with file-level evidence.
2. Exclude cosmetic churn, speculative abstractions, and changes unsupported by current behavior or requirements.
3. Rank viable findings by impact, confidence, implementation risk, and scope.
4. Select exactly one highest-value finding.
5. Record the selected finding and why it outranks the alternatives in the PR body.

If no finding is sufficiently valuable and evidence-backed, return `NO ACTIONABLE PACKAGE`. Do not create an empty commit, work folder, or PR.

## Conservative Assumption Policy

Resolve uncertainty in this order:

1. Active decisions and requirements in `PRD/sections/`.
2. Existing tested behavior and public contracts.
3. Established local code patterns.
4. The smallest reversible scope.
5. Preservation of user-visible behavior unless the request explicitly changes it.
6. No new dependency, endpoint, data contract, architectural layer, or external integration without authoritative scope.

Record every material assumption in `DESIGN-BRIEF.md` and the PR body. Assumptions must be traceable to evidence and safe for a later implementation agent to reverse if new information appears.

Naming, file organization, equivalent technical choices, slice boundaries, and other implementation details do not require user input when repository evidence supports a conservative choice.

## Genuine Decision Blockers

A question blocks preparation only when:

- Plausible answers produce materially different product behavior, public contracts, data handling, security posture, or scope.
- The PRD, tested behavior, and established patterns provide no authoritative basis for choosing.
- Choosing the smaller option would still silently decide the disputed product behavior.

When blocked, preserve every valid artifact produced before the ambiguity. Do not guess the answer into committed scope or generate slices that depend on it.

Repeated quality-check failures are not automatically product blockers. Feed each concrete failure back into refinement and make a material correction. If the same failure recurs and cannot be resolved from authoritative evidence, express the underlying ambiguity as a genuine decision blocker.

## Artifact Flow

The preparation loop produces the existing lifecycle artifacts:

- `PRD/work/<slug>/IDEA.md`: selected problem, desired outcome, and non-goals.
- `PRD/work/<slug>/README.md`: package status, summary, slice table when active, assumptions or blockers, and next command.
- `PRD/work/<slug>/DESIGN-BRIEF.md`: repository evidence, scope, decisions, assumptions, non-goals, affected requirements and flows, and implementation boundaries.
- Relevant `PRD/sections/` updates only when the request genuinely changes durable product truth.
- `PRD/work/<slug>/GAMEPLAN.md` and lettered slice documents after quality-check PASS.

A behavior-preserving code-health refactor normally cites existing PRD truth without editing durable product sections.

Work-package status follows the existing lifecycle:

- `ideation` after capture
- `refined` after autonomous refinement
- `active` only after quality-check PASS and map-out

A blocked package preserves the furthest valid lifecycle status and records the blocker rather than falsely advancing.

## Quality and Review Loop

Quality-check must emit an explicit PASS or FAIL. A FAIL returns to refinement with the complete issue list. The loop continues until:

- The package passes and can be mapped out.
- A genuine decision blocker is isolated.
- An external execution blocker prevents safe publication.

After map-out, dispatch an independent reviewer with only the original request, authoritative artifacts, repository evidence, and prepared diff. The reviewer checks request fidelity, evidence quality, PRD alignment, hidden assumptions, slice completeness, verification commands, and the no-product-code boundary. Critical and important findings return to the relevant preparation phase before publication.

Before any READY or BLOCKED claim, use `superpowers:verification-before-completion` and collect fresh evidence from package validation, repository checks appropriate to documentation changes, the staged diff, and skill-tree synchronization.

## Superpowers Integration

- `superpowers:brainstorming` supplies the design-analysis structure. The user's explicit autonomous-preparation request replaces its normal interactive approval pauses with the conservative assumption and genuine-blocker policy in this design.
- `superpowers:requesting-code-review` supplies the independent pre-publication review contract.
- `superpowers:verification-before-completion` gates commits, pushes, PR creation, and terminal claims.
- `superpowers:systematic-debugging` is required when validation, Git, or repository commands fail unexpectedly.
- `superpowers:writing-plans` is not invoked because `thejudge-map-out` is the project-specific planning authority and `PRD/work/` must remain the only implementation-plan source of truth.

## Git and Pull Request Lifecycle

Start from the latest `origin/main` in an isolated worktree and use `thejudge-prep/<slug>` as the shared remote branch unless a branch or PR is supplied. Never modify, stage, stash, or commit unrelated changes in the launch checkout.

### READY outcome

- Title: `[THEJUDGE-PREP][READY] <work name> (<slug>)`
- State: ready for human review, not draft
- Body includes:
  - Original request
  - Selected finding and repository evidence
  - Material assumptions
  - PRD alignment and durable PRD changes, if any
  - Work-package artifact summary
  - Planned slices and verification commands
  - Preparation checks and independent-review result
  - Post-merge command: `$thejudge-implement-all PRD/work/<slug>/`

### BLOCKED outcome

- Title: `[THEJUDGE-PREP][BLOCKED] <work name> (<slug>)`
- State: draft
- Body includes all READY fields available plus:
  - The unresolved question and stable question identifier
  - Evidence showing why the PRD and code cannot answer it
  - The materially different outcomes of plausible answers
  - The furthest valid completed phase
  - Invalid or intentionally omitted downstream artifacts
  - An exact restart prompt naming the work folder and question identifier

The loop never merges or closes either kind of PR.

## Error Handling

Unexpected validation or repository-command failures trigger systematic debugging, not speculative scope changes. Fix and retry when the cause is local and in scope.

GitHub authentication, network availability, missing push permission, or an irreconcilable Git state are external blockers. Preserve the isolated branch and local commit when safe, report the failing operation and exact recovery action, and do not claim that a PR exists when it does not.

If the launch checkout contains relevant uncommitted inputs that are not present on the selected remote base, stop rather than copying, stashing, or committing them implicitly. Unrelated launch-checkout changes remain untouched.

## Skill Testing Strategy

Develop the skill with `superpowers:writing-skills` RED-GREEN-REFACTOR:

1. Run realistic baseline scenarios without the new skill.
2. Combine pressures that tempt an agent to create multiple packages, skip quality-check, invent product decisions, begin implementation, or omit a blocked handoff.
3. Capture choices and rationalizations verbatim.
4. Write only enough skill guidance to address observed failures.
5. Rerun the same scenarios with the skill.
6. Micro-test behavior-shaping wording against a no-guidance control with at least five fresh-context samples per variant.
7. Add counters only for observed loopholes and rerun until compliant.

Final scenario assertions are:

- Exactly one work package or an explicit `NO ACTIONABLE PACKAGE` outcome.
- No product-code edits.
- Evidence-backed candidate selection and assumptions.
- No interactive stop for inferable details.
- No invented answer to a genuine product decision.
- Explicit quality-check PASS before map-out.
- Complete GAMEPLAN and slices for READY outcomes.
- Complete question and restart prompt for BLOCKED outcomes.
- Correct branch, PR title/state/body, and implementation handoff.
- Byte-identical `.cursor`, `.agents`, and `.claude` skill trees after sync.

## Documentation Updates

Update the workflow catalog and routing documentation to include `thejudge-prepare`, its relationship to the four interactive preparation skills, its preparation-PR boundary, and its handoff to `thejudge-implement-all`. Preserve the existing skills as valid direct-entry points.
