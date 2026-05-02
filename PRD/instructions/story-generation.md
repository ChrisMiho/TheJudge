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
- Default to stories that can be implemented independently and in parallel.
- Keep stories thin and implementation-sequenced where possible.
- Preserve flow-validation simplifications where they still apply (see `sections/decisions.md`).
- Do not add future-phase scope beyond the current active roadmap unless promoted via decisions.
- If a story cannot be parallelized, explicitly document why and what must land first.

## Parallelization-First Rules

- Assume each story should be a standalone slice unless constraints prove otherwise.
- Keep each story scoped to one primary behavior or one primary technical objective.
- Avoid mixing preventive/process work and remediation/refactor work in one story when they can be separated.
- For every story, state whether it is:
  - `parallel-ready` (no blocking story dependency), or
  - `sequential` (blocked by one or more prerequisite stories).
- For sequential stories, dependencies must list:
  - required prerequisite story IDs
  - dependency reason in one line (contract coupling, shared files, ordering risk, etc.)
  - what becomes parallelizable after the prerequisite lands

## Story Structure

For each story, include:

- title
- implementation area (`frontend`, `backend`, or `full-stack`)
- user value
- scope
- acceptance criteria
- execution mode (`parallel-ready` or `sequential`)
- dependencies
- exclusions

### Implementation Area Rules

- Every story must explicitly declare `implementation area`.
- Use:
  - `frontend` for UI/client-only work
  - `backend` for API/server-only work
  - `full-stack` when both runtime layers are required
- If a story touches docs/tests only, still choose the runtime area where the primary behavior change lands.

### Acceptance Criteria Requirements

- Include at least one acceptance criterion that ties completion to **visible documentation or tracking** appropriate to the phase:
  - **MVP2 and forward:** update `PRD/analysis/MVP2-bedrock-integration-roadmap.md` when a roadmap phase milestone is met, and/or `PRD/README.md` when control-plane guidance changes; add or adjust `PRD/stories/STORY-###` scope if the story file is the source of truth for that slice.
  - **Historical MVP1:** completion is recorded in `PRD/archive/mvp1/stories/` and summarized under `PRD/archive/mvp1/`; do not require a root `README.md` checklist (removed after MVP1 closeout).
- The tracker criterion should name the file(s) to update so completion stays auditable.

## Dependency Rules

- If `execution mode` is `parallel-ready`, dependencies should include only requirement/decision references and no blocking story IDs.
- If `execution mode` is `sequential`, include at least one blocking story ID with explicit reason text.
- Do not leave dependencies generic; each dependency line should be actionable.
- If story ordering is optional, do not mark the story as sequential.

## Story Quality Checklist

- Story objective is singular and clear.
- Story explicitly calls out `implementation area` and it matches the scope.
- Story can be picked up without hidden assumptions from other stories.
- Acceptance criteria can be verified without redefining scope.
- Acceptance criteria include updating the agreed tracker doc (roadmap, PRD README, or story file) per the rules above.
- Dependency section clearly distinguishes references vs blockers.
- Parallel viability is explicit and justified.

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

- Do not introduce duplicate support unless explicitly approved in product sections.
- Do not introduce runtime metadata syncing into flow-validation scope unless explicitly approved.
- Do not introduce heavy rules logic without explicit product approval.
- Keep Phase A and Phase B separate.
- Do not hide blocking relationships; if two stories cannot run in parallel, mark and justify the dependency in both stories.