# story-generation.md

## Purpose
These rules govern how to convert PRD content into backlog items, stories, or implementation tasks.

## Inputs to Read First
1. `sections/decisions.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `sections/non-functional-requirements.md`

## Story Generation Rules
- Generate stories from confirmed requirements only.
- Treat decisions as override rules.
- Do not turn open questions into committed backlog scope.
- If a requirement is ambiguous, reference the matching `Q-###` instead of guessing.
- Keep stories thin and implementation-sequenced where possible.
- Preserve MVP1 simplifications.
- Do not add future-phase scope to MVP1 stories.

## Story Structure
For each story, include:
- title
- user value
- scope
- acceptance criteria
- dependencies
- exclusions

## Recommended Story Slicing
Prefer stories aligned to:
- search/autocomplete
- preview/add flow
- stack state and details view
- question input and fallback behavior
- Decrypt Stack submit flow
- mock backend integration
- failure/retry handling
- real Bedrock integration

## Guardrails
- Do not introduce duplicate support into MVP1 stories.
- Do not introduce runtime metadata syncing into MVP1 stories.
- Do not introduce heavy rules logic into MVP1 stories.
- Keep Phase A and Phase B separate.
