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
- Runtime code is split across `apps/frontend` and `apps/backend`, with a single product-facing backend route (`POST /api/ask-ai`) plus health endpoint.
- Current frontend flow supports staged context + stack interaction patterns; canonical behavior is tracked in `sections/user-flows.md`.
- Prompt/input contract includes structured context beyond stack/question (see `sections/integrations-and-data.md` and `sections/decisions.md`).
- Metadata pipeline remains static-file based (`npm run data:build` / `npm run data:refresh`) with runtime loading from `/data/cardMetadata.json`.
- Phase A mock-provider architecture is active; provider boundary remains in place for future Phase B integration.
- Automated tests and type checks are part of the active workflow; root dev run remains `npm run dev`.

## Next Agent Implementation Focus
Use the repository’s current default branch as the integration baseline, and open a dedicated feature branch per story slice.

- [x] Keep static metadata strategy (DEC-012) but reduce frontend initial bundle impact from large metadata payloads.
- [x] Complete merged metadata policy+tests slice (`STORY-010`, with former `STORY-005` scope): deterministic filtering/dedupe plus transform/search regression coverage.
- [x] Add UI-focused frontend coverage for search/add/decrypt flows (`STORY-006`).
- [x] Add explicit UI regression stories for stack details/count, duplicate/cap constraints, and Decrypt failure-state resilience (`STORY-011` to `STORY-013`).
- [x] Add environment configuration/deployment target contract for frontend/backend API origin wiring (`STORY-007`).
- [x] Prepare a clean interface boundary for eventual Bedrock Phase B integration without changing request/response contracts (`STORY-014`).
- [x] Improve deterministic Phase A mock-answer readability for prompt/context debugging (`STORY-009`).
- [x] Replace emoji empty-state visual with bundled static cat-wizard asset (`STORY-008`).
- [x] Replace empty-state asset with `cats-homescreen.png` and remove surrounding frame so photo is centered-only (`STORY-015`).
- [x] Establish engineering quality guardrails and enforceable repository-level validation gates (`STORY-016`).
- [x] Remediate current high-churn hotspots via modular refactor with regression-safe tests (`STORY-017`).
- [x] Enrich stack entries with explicit caster labels and typed targeting context for improved LLM prompt readiness (`STORY-018`).
- [x] Add lightweight frontend/backend debug logging with end-to-end correlation-id traceability for flow validation (`STORY-019`).
- [x] Wire enriched stack-entry context fields into deterministic backend prompt/mock output (`STORY-020`).
- [x] Expand caster/player-target labels to support up to four players across UI/backend contracts (`STORY-021`).
- [ ] Capture pre-stack general game context (player count + life totals) and include it in prompt input (`STORY-022`).
- [ ] Capture per-stack-entry mana spent context with fallback to `manaValue` in prompt context (`STORY-023`).
- [ ] Add optional battlefield-context step after game context, including explicit skip path (`STORY-024`).
- [ ] Harden expanded Ask-AI context contract end-to-end after staged-context features land (`STORY-025`).
- [ ] Expand deterministic prompt structure to include staged context sections (`STORY-026`).
- [ ] Extend eval harness fixtures/checks for staged-context regression detection (`STORY-027`).
- [ ] Prepare Phase B Bedrock bootstrap/config/provider-selection wiring without contract changes (`STORY-028`).
- [ ] Add prompt budget and latency guardrails for high-context scenarios (`STORY-029`).
- [ ] Reuse metadata-backed search behavior in battlefield-context entry flow (`STORY-030`).
- [ ] Replace battlefield-step dual progression controls with one dynamic skip/continue action (`STORY-031`).
- [ ] Add `other` target option with 200-char freeform context wired into payload/prompt (`STORY-032`).
- [ ] Move cat visual placement to game-context first screen (`STORY-033`).
