---
name: prd-gameplan-bootstrap
description: Creates or refreshes baseline PRD/gameplan markdown files from PRD sections and instructions so the team has a single path-forward control plane. Use when PRD/gameplan is missing, incomplete, or needs a fresh baseline.
disable-model-invocation: true
---

# PRD Gameplan Bootstrap

## Goal

Create the minimum durable gameplan scaffold under `PRD/gameplan/` that stays aligned with project truth and can be updated over time.

## Mandatory Reads

Read these files before writing:

1. `PRD/README.md`
2. `PRD/instructions/agent-working-rules.md`
3. `PRD/instructions/writing-rules.md`
4. `PRD/instructions/requirement-format.md`
5. `PRD/instructions/story-generation.md`
6. `PRD/instructions/technical-design-rules.md`
7. `PRD/instructions/secrets-handling.md`
8. `PRD/sections/overview.md`
9. `PRD/sections/problem-statement.md`
10. `PRD/sections/goals-and-non-goals.md`
11. `PRD/sections/personas.md`
12. `PRD/sections/user-flows.md`
13. `PRD/sections/functional-requirements.md`
14. `PRD/sections/non-functional-requirements.md`
15. `PRD/sections/integrations-and-data.md`
16. `PRD/sections/open-questions.md`
17. `PRD/sections/decisions.md`

## Files To Create or Refresh

Write/update these files:

- `PRD/gameplan/README.md`
- `PRD/gameplan/MASTER-ROADMAP.md`
- `PRD/gameplan/FEATURE-QUEUE.md`
- `PRD/gameplan/OPEN-QUESTIONS-QUEUE.md`
- `PRD/gameplan/CHANGELOG.md`

## Required File Content

### `README.md`

Include:
- purpose of `PRD/gameplan/`
- source-of-truth precedence
- exact file map for this folder
- update workflow (`feature-plan` then `sync`)

### `MASTER-ROADMAP.md`

Include:
- current phase summary
- now / next / later lanes
- dependency-ordered execution notes
- explicit exclusions to prevent scope creep
- traceability section referencing core IDs from sections

### `FEATURE-QUEUE.md`

Include:
- prioritized list of upcoming feature slices
- owner/status placeholders
- links to per-feature gameplan files under `PRD/gameplan/features/`

### `OPEN-QUESTIONS-QUEUE.md`

Include:
- unresolved `Q-*` and impact level
- blocking vs non-blocking labels
- recommended decision owner

### `CHANGELOG.md`

Append-only log:
- date
- files touched
- reason for update
- PRD source files reviewed

## Guardrails

- Do not invent net-new product scope.
- If source files conflict, defer to `decisions.md` and call out ambiguity explicitly.
- Keep gameplan items thin and executable.
- Do not place secrets or secret-like values in gameplan docs.
