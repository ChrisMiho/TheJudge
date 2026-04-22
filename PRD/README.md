# README.md

## Status
- Project Status: active
- Current Drafting Phase: MVP1 implementation in progress (Phase A mock backend)
- Overall Documentation Status: active and implementation-aligned

## Purpose
This file is the control-plane document for the PRD set.

Use it to:
- understand current drafting status
- find the right file for a given task
- understand source-of-truth precedence
- navigate product content vs. agent instructions

## Source-of-Truth Precedence
1. `sections/decisions.md` overrides older conflicting draft language
2. section files define current product scope
3. instruction files define how the agent should process and generate content
4. `README.md` is the navigation and status layer

## Section Inventory

| File | Status | Description |
|---|---|---|
| `sections/overview.md` | complete | High-level summary of the product and MVP framing |
| `sections/problem-statement.md` | complete | Problem being solved and why it matters |
| `sections/goals-and-non-goals.md` | complete | Goals, success metrics, scope boundaries, and out-of-scope items |
| `sections/personas.md` | complete | Primary user and pain points |
| `sections/user-flows.md` | complete | End-to-end user journeys and edge flows |
| `sections/functional-requirements.md` | complete | Product requirements and acceptance criteria |
| `sections/non-functional-requirements.md` | complete | Performance, security, maintainability, and system quality constraints |
| `sections/integrations-and-data.md` | complete | API contracts, stack ordering, integrations, data notes, and dependencies |
| `sections/open-questions.md` | needs review | Unresolved items that need human decisions |
| `sections/decisions.md` | active | Confirmed decisions that override older draft wording |

## Instruction Inventory

| File | Status | Description |
|---|---|---|
| `instructions/writing-rules.md` | complete | Rules for writing and editing these documents |
| `instructions/requirement-format.md` | complete | Required formatting templates for requirements, flows, decisions, and questions |
| `instructions/story-generation.md` | complete | Rules for converting requirements into stories and backlog items |
| `instructions/technical-design-rules.md` | complete | Constraints for architecture and implementation proposals |
| `instructions/agent-working-rules.md` | active | Behavioral rules for any agent editing or generating content in this PRD set |

## Which Files to Read for Which Task

### If the task is product understanding
Read in this order:
1. `sections/overview.md`
2. `sections/decisions.md`
3. `sections/goals-and-non-goals.md`
4. `sections/problem-statement.md`

### If the task is feature implementation planning
Read in this order:
1. `sections/decisions.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `sections/integrations-and-data.md`
5. `sections/non-functional-requirements.md`

### If the task is story generation or backlog creation
Read in this order:
1. `sections/decisions.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `instructions/story-generation.md`
5. `instructions/requirement-format.md`

### If the task is document editing or extension
Read in this order:
1. `instructions/agent-working-rules.md`
2. `instructions/writing-rules.md`
3. `sections/decisions.md`
4. the relevant target section file

### If the task is architecture or technical design
Read in this order:
1. `sections/decisions.md`
2. `sections/integrations-and-data.md`
3. `sections/non-functional-requirements.md`
4. `instructions/technical-design-rules.md`

## Working Rules Summary
- Keep product truth in section files.
- Keep workflow and generation guidance in instruction files.
- Do not guess when the source is ambiguous.
- Put unresolved ambiguity in `sections/open-questions.md`.
- Record confirmed decisions in `sections/decisions.md`.
- Prefer narrow edits to one file at a time.
- Preserve stable IDs once assigned.

## Current Editorial Notes
- MVP1 is intentionally a flow-validation MVP.
- Duplicate-card blocking is temporary and should not be treated as long-term product truth.
- Stack ordering is critical and must remain consistent across UI, API payloads, and prompt-building logic.
- The mock-first delivery strategy is part of current planning and should remain visible in implementation-related work.

## Implementation Snapshot
- Frontend and backend workspaces are implemented under `apps/frontend` and `apps/backend`.
- Frontend currently supports search, preview, add/remove stack, duplicate block, stack cap, optional question, and Decrypt Stack flow.
- Backend `POST /api/ask-ai` is implemented with validation and Phase A mock response contract.
- Local Scryfall bulk data is stored at `apps/frontend/data/scryfall/default-cards.json`.
- Trimmed metadata generation is implemented via `npm run data:build` and outputs `apps/frontend/public/data/cardMetadata.json`.
- Frontend now loads metadata at runtime from `/data/cardMetadata.json` to avoid bundling the full dataset in the main JS chunk.
- Lightweight automated tests exist for frontend search helpers and backend API contracts.
- Root dev workflow is available with `npm run dev` for running frontend and backend together.

## Next Agent Implementation Focus
Current trunk slice branch: `feat/frontend-flow-tests`

- [x] Keep static metadata strategy (DEC-012) but reduce frontend initial bundle impact from large metadata payloads.
- [ ] Add tests for metadata transform output shape and expand search behavior against representative card samples.
- [ ] Add UI-focused frontend coverage for search/add/decrypt flows (backend validation contract tests are implemented).
- [ ] Prepare a clean interface boundary for eventual Bedrock Phase B integration without changing request/response contracts.
- [ ] Replace emoji empty-state visual with a bundled static cat-wizard asset if approved.
