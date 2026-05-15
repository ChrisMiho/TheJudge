# MVP2 OpenAI Integration Roadmap

## Purpose

This document is an execution handoff for agents to:
- continue from the completed MVP1 baseline without regressing contracts or UX
- transition the backend from Phase A mock responses to real OpenAI Responses API calls
- preserve existing API contract and staged UX behavior

## Current Baseline (Start State)

- Monorepo with `apps/frontend` and `apps/backend`
- Backend provider boundary already exists and can host provider swaps
- API contract must remain stable:
  - `POST /api/ask-ai` request shape unchanged
  - success response unchanged: `{ "answer": "string" }`
  - failure response shape unchanged: `{ code, message, metadata?, retryAfterSeconds? }`

## Hard Rules for MVP2

- Keep frontend and backend independently deployable release units.
- OpenAI credentials remain backend-only.
- Preserve stack order semantics (`stack[0]` bottom, last item top).
- Do not break existing frontend behavior while changing provider internals.
- Functional toggles remain explicit feature-flag behavior (`ASK_AI_PROVIDER`), not inferred from `NODE_ENV`.
- Keep normalized API error codes regardless of upstream provider internals.

## Phase Plan

### Task 0 - Secrets hygiene baseline

Goal: enforce secret boundaries before provider migration work.

Scope:
- `.secrets/` stays gitignored and local-only
- non-secret env in `apps/backend/.env`
- secret env in `.secrets/openai-dev.env`
- never include secrets in docs, screenshots, or PR diffs

### Phase 1 - OpenAI runtime foundation

Goal: enable OpenAI Responses API behind the existing provider interface without changing HTTP contract.

Scope:
- provider selection remains explicit (`mock` default, `openai` live)
- required OpenAI config validated at startup
- OpenAI provider implementation added in provider layer only
- startup fails fast with actionable config errors when OpenAI mode is selected

Deliverables:
- backend config validation updates
- provider factory update for OpenAI selection
- OpenAI provider implementation + tests
- updated `.env.example`, scripts, and README docs

### Phase 2 - Reliability and observability

Goal: keep provider failures debuggable while preserving user-facing error semantics.

Scope:
- map OpenAI failures into canonical API error codes
- preserve correlation-ID logging lifecycle
- capture request/provider latency in logs
- keep payload logging controls and safe diagnostics

### Phase 3 - Prompt context follow-on (deferred for this migration)

Goal: keep deterministic prompt preparation and fixture coverage while deferring prompt-content upgrades to a dedicated follow-on.

Scope:
- no contract changes during provider migration
- prompt/eval expansion tracked as a separate next step after OpenAI path is stable

Related (frontend context capture and eval, parallel track): `PRD/analysis/EVAL-STRATEGY-context-flow-rework.md` (`EVAL-CTX-FLOW-001`) with promoted stories `STORY-069` through `STORY-078` under `PRD/stories/` and checklist in `PRD/README.md` (Context flow eval execution). Backend fixture work that stays inside frozen prompt assembly belongs in `STORY-072`; do not conflate with OpenAI provider swap scope above.

## Definition of Done for OpenAI Pivot

- `/api/ask-ai` can run OpenAI in DEV when provider mode is `openai`
- mock mode remains unchanged
- canonical error contract remains unchanged and normalized
- README + provider README + PRD control-plane docs point to OpenAI workflow
- Historical Bedrock/AWS implementation docs are not kept as active repo guidance
