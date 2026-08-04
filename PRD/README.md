# README.md

## Status
- Project Status: active
- Documentation baseline: product truth in `sections/`; agent process in `instructions/`
- Next work: start from the `sections/decisions.md` router and promote new scope to the relevant `sections/decisions/<domain>.md` file plus the router index line before implementation

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
| `sections/decisions.md` | active | Read-first router for confirmed decisions that override older draft wording |
| `sections/decisions/` | active | Domain decision files that hold confirmed DEC bodies |
| `sections/system-map.md` | active | Feature/subsystem catalog: shipped-vs-planned status, behavior summary, and coarse location per subsystem |

## Instruction Inventory

| File | Status | Description |
|---|---|---|
| `instructions/agent-working-rules.md` | active | Behavioral rules for any agent editing or generating content in this PRD set |
| `instructions/doc-lifecycle.md` | active | When to create, promote, and delete ephemeral planning docs |
| `instructions/writing-rules.md` | complete | Rules for writing and editing these documents |
| `instructions/requirement-format.md` | complete | Required formatting templates for requirements, flows, decisions, questions, and slices |
| `instructions/technical-design-rules.md` | complete | Constraints for architecture and implementation proposals |
| `instructions/secrets-handling.md` | active | Guardrails for storing secrets in `.secrets/`, never committing them, and validating secret decisions with the user |
| `instructions/test-naming.md` | active | Hierarchical Vitest title convention (`Layer - Feature` outer describe, nested area + behavior) |
| `instructions/workflow-reference.md` | active | Lean ten-skill PRD workflow reference: interactive and autonomous paths, handoff prefix rule, work-folder lifecycle, status vocabulary |
| `instructions/preparation-contract.md` | active | Autonomous one-package preparation, assumption, blocker, and PR-publication contract |

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

### If the task is writing or renaming tests
Read in this order:
1. `instructions/test-naming.md`
2. `instructions/technical-design-rules.md` (if architecture or shared helpers are involved)

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
- Record confirmed decision bodies in the relevant `sections/decisions/<domain>.md` file and keep the router index line in `sections/decisions.md` current.
- Prefer narrow edits to one file at a time.
- Preserve stable IDs once assigned.
- Agent workflow skills: edit `.cursor/skills/thejudge-*` (canonical), run `npm run skills:ai-sync` to copy to `.agents/skills/` and `.claude/skills/`; see `AGENT-SKILLS.md`.

## Active work packages (`PRD/work/`)

| Slug | Status | Summary |
|------|--------|---------|
| [feedback-bug-report](./work/feedback-bug-report/) | active | Frontend-only user feedback + bug report: feature-portal action opens a modal, delivered to owner inbox via Formspree with an app-state snapshot |
| [feedback-delivery-onboarding](./work/feedback-delivery-onboarding/) | owner-action | Human-only tail split out of `feedback-bug-report`: create the Formspree form, supply the public form id, run the live-send smoke check |
| [card-trade-balancer](./work/card-trade-balancer/) | active | Build a frontend-only two-sided card-value comparison with printing-aware prices, scan/manual input, and top-level navigation |
| [prompt-game-state-enrichment](./work/prompt-game-state-enrichment/) | deferred | Add `gameStateNotes` freeform game-state field and `ADDITIONAL GAME STATE` prompt section (revisit after retrieval + consolidation work) |

Completed work is promoted into `sections/` and temporary work folders are removed per `instructions/doc-lifecycle.md`.

## Current Editorial Notes
- Current product status: TheJudge is an MTG assistant suite (`DEC-094`); the primary MTG Assistant loop is validated (past MVP) and deployed on AWS with the live OpenAI provider; local development remains mock-default (`DEC-020`, `DEC-084`).
- Duplicate-card blocking is temporary and should not be treated as long-term product truth.
- Stack ordering is critical and must remain consistent across UI, API payloads, and prompt-building logic.
- Default local provider mode is mock (`ASK_AI_PROVIDER=mock`); live OpenAI path is documented in `DEC-020`, `sections/integrations-and-data.md`, and `apps/backend/src/providers/README.md`.
- Local OpenAI onboarding should keep non-secrets in `apps/backend/.env` and real secrets in `.secrets/openai-dev.env`.
- Provider modularity remains a hard rule: route handlers stay contract-focused and only consume the provider interface selected in bootstrap/factory composition.

## Implementation Snapshot
- Runtime code is split across `apps/frontend` and `apps/backend`, with a single product-facing backend route (`POST /api/ask-ai`) plus health endpoint.
- Current frontend flow supports staged context + stack interaction patterns; canonical behavior is tracked in `sections/user-flows.md`.
- Prompt/input contract includes structured context beyond stack/question (see `sections/integrations-and-data.md`, the `sections/decisions.md` router, and relevant `sections/decisions/<domain>.md` files).
- Metadata pipeline remains static-file based (`npm run data:build` / `npm run data:refresh`) with runtime loading from `/data/cardMetadata.json`.
- Context/prompt regression coverage lives in tests and `apps/backend/src/eval/fixtures/README.md`.
- Automated tests and type checks are part of the active workflow; root dev run remains `npm run dev`.
