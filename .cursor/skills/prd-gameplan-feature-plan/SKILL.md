---
name: prd-gameplan-feature-plan
description: Generates or updates a feature-specific execution markdown plan in PRD/gameplan/features using directives from PRD/sections and PRD/instructions. Use when the user wants a concrete path to implement a new feature safely and incrementally.
disable-model-invocation: true
---

# PRD Gameplan Feature Plan

## Purpose

Create one actionable feature implementation plan that is traceable to PRD truth and ready for iterative execution.

## Inputs

Required:
- feature name
- one-line feature objective

Optional:
- explicit exclusions
- target milestone or timeline
- sequencing constraints

## Mandatory Reads

Read in order:

1. `PRD/sections/decisions.md`
2. relevant `PRD/sections/*` files for the feature
3. `PRD/instructions/story-generation.md`
4. `PRD/instructions/writing-rules.md`
5. `PRD/instructions/technical-design-rules.md`
6. `PRD/instructions/secrets-handling.md` (if credentials/env/auth are touched)
7. `PRD/gameplan/MASTER-ROADMAP.md`
8. `PRD/gameplan/FEATURE-QUEUE.md`

## Output Path

Create or update:

`PRD/gameplan/features/<feature-slug>.md`

`<feature-slug>` must be lowercase kebab-case.

## Required Plan Structure

Use this exact section order:

```markdown
# Feature Gameplan: <Human Title>

## Metadata
- feature_slug:
- status: proposed | active | blocked | done
- owner:
- last_updated:

## Objective

## Source Traceability
- REQ:
- FLOW:
- NFR:
- DEC:
- Q:
- STORY:

## Scope In
- ...

## Scope Out
- ...

## Execution Waves
### Wave 0
- goal:
- tasks:
  - ...
- dependencies:
- exit criteria:

### Wave N
...

## Risks and Mitigations
- ...

## Validation Plan
- tests:
- manual checks:
- docs to update:

## Rollout and Fallback
- ...

## Next Actions
1. ...
2. ...
```

## Wave Rules

- Default to parallelizable waves unless a real blocker exists.
- When sequential ordering is required, name the blocker and why.
- Keep each task small enough to become a story without re-analysis.

## Update Rules

After writing the feature file:

1. update `PRD/gameplan/FEATURE-QUEUE.md` with status + link
2. update `PRD/gameplan/MASTER-ROADMAP.md` now/next/later lanes if priorities shifted
3. append a row to `PRD/gameplan/CHANGELOG.md`

## Non-Goals

- Do not rewrite PRD section truth.
- Do not silently resolve open questions as confirmed scope.
- Do not add forbidden design drift from technical design rules.
