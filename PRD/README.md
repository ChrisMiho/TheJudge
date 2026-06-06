# README.md

## Status
- Project Status: active
- Documentation baseline: product truth in `sections/`; agent process in `instructions/`
- Next work: start from `sections/decisions.md` and promote new scope there before implementation

## Purpose
This file is the control-plane document for the PRD set.

Use it to:
- find the right file for a given task
- understand source-of-truth precedence
- navigate product content vs. agent instructions

## Read First
For implementation work, read in this order:
1. `sections/decisions.md`
2. the relevant target section file(s)
3. the relevant instruction file(s)

## Source-of-Truth Precedence
1. `sections/decisions.md` overrides older conflicting draft language
2. section files define current product scope
3. instruction files define how the agent should process and generate content
4. `README.md` is the navigation layer only (not a backlog or roadmap)

## Section Inventory

| File | Status | Description |
|---|---|---|
| `sections/overview.md` | complete | High-level summary of the product and current product status |
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
| `instructions/agent-working-rules.md` | active | Behavioral rules for any agent editing or generating content in this PRD set |
| `instructions/doc-lifecycle.md` | active | When to create, promote, and delete ephemeral planning docs |
| `instructions/writing-rules.md` | complete | Rules for writing and editing these documents |
| `instructions/requirement-format.md` | complete | Required formatting templates for requirements, flows, decisions, questions, and slices |
| `instructions/technical-design-rules.md` | complete | Constraints for architecture and implementation proposals |
| `instructions/secrets-handling.md` | active | Guardrails for storing secrets in `.secrets/`, never committing them, and validating secret decisions with the user |
| `instructions/workflow-reference.md` | active | Lean five-skill PRD workflow reference, session openers, slice template, and cleanup receipt convention |

## Which Files to Read for Which Task

### If the task is product understanding
Read in this order:
1. `sections/overview.md`
2. `sections/decisions.md`
3. `sections/goals-and-non-goals.md`
4. `sections/problem-statement.md`

### If the task is feature implementation
Read in this order:
1. `sections/decisions.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `sections/integrations-and-data.md`
5. `sections/non-functional-requirements.md`
6. `instructions/technical-design-rules.md` (if architecture or code structure is involved)
7. `instructions/secrets-handling.md` (if credentials, env vars, or provider keys are involved)

### If the task is slice planning or map-out
Read in this order:
1. `sections/decisions.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `instructions/workflow-reference.md`
5. `instructions/requirement-format.md`

### If the task is document editing or extension
Read in this order:
1. `instructions/agent-working-rules.md`
2. `instructions/doc-lifecycle.md` (if creating or closing non-section PRD markdown)
3. `instructions/writing-rules.md`
4. `sections/decisions.md`
5. the relevant target section file

## Working Rules Summary
- Keep product truth in section files.
- Keep workflow and generation guidance in instruction files.
- Ephemeral slice plans live only in `PRD/work/<slug>/` and must be deleted when the slice ships (see `instructions/doc-lifecycle.md`).
- Do not guess when the source is ambiguous.
- Put unresolved ambiguity in `sections/open-questions.md`.
- Record confirmed decisions in `sections/decisions.md`.
- Prefer narrow edits to one file at a time.
- Preserve stable IDs once assigned.
- Agent workflow skills live under `.cursor/skills/thejudge-*`, `.codex/skills/thejudge-*`, and `.claude/skills/thejudge-*`; humans attach the matching skill manually for each session.

## Active work packages (`PRD/work/`)

| Slug | Status | Summary |
|------|--------|---------|
| [supplemental-game-rules-retrieval](./work/supplemental-game-rules-retrieval/) | draft | Context-retrieved supplemental CR rules (max 5) on top of DEC-030 curated baseline |

Completed work is promoted into `sections/` and temporary work folders are removed per `instructions/doc-lifecycle.md`.

## Current Editorial Notes
- Current product status is flow validation with staged zone context, mock-default local provider mode, and optional live OpenAI provider mode.
- Duplicate-card blocking is temporary and should not be treated as long-term product truth.
- Stack ordering is critical and must remain consistent across UI, API payloads, and prompt-building logic.
- Default local provider mode is mock (`ASK_AI_PROVIDER=mock`); live OpenAI path is documented in `DEC-020`, `sections/integrations-and-data.md`, and `apps/backend/src/providers/README.md`.
- Local OpenAI onboarding should keep non-secrets in `apps/backend/.env` and real secrets in `.secrets/openai-dev.env`.
- Provider modularity remains a hard rule: route handlers stay contract-focused and only consume the provider interface selected in bootstrap/factory composition.

## Implementation Snapshot
- Runtime code is split across `apps/frontend` and `apps/backend`, with a single product-facing backend route (`POST /api/ask-ai`) plus health endpoint.
- Current frontend flow supports staged context + stack interaction patterns; canonical behavior is tracked in `sections/user-flows.md`.
- Prompt/input contract includes structured context beyond stack/question (see `sections/integrations-and-data.md` and `sections/decisions.md`).
- Metadata pipeline remains static-file based (`npm run data:build` / `npm run data:refresh`) with runtime loading from `/data/cardMetadata.json`.
- Context/prompt regression coverage lives in tests and `apps/backend/src/eval/fixtures/README.md`.
- Automated tests and type checks are part of the active workflow; root dev run remains `npm run dev`.
