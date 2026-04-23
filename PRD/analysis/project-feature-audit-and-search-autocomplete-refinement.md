# Project Feature Audit + Search Refinement Stories

## Scope and Method

- scope: full repository audit (frontend, backend, data pipeline, tests/docs) plus targeted search/autocomplete path analysis.
- source-of-truth order followed: `[PRD/sections/decisions.md](../sections/decisions.md)` -> `[PRD/sections/functional-requirements.md](../sections/functional-requirements.md)` -> `[PRD/sections/user-flows.md](../sections/user-flows.md)` -> story rules in `[PRD/instructions/story-generation.md](../instructions/story-generation.md)`.
- implementation evidence reviewed in runtime code and tests under `apps/frontend`, `apps/backend`, and `scripts`.

## Implemented Features (Current State)

### 1) Core Product Flow and UX

- implemented staged flow: game context -> optional battlefield context -> stack construction -> ask/decrypt, aligned with FLOW-001 and DEC-019.
- game context capture supports fixed player labels, player count, and life totals before proceeding (REQ-015).
- battlefield context step supports add/remove and explicit skip path with dynamic progression behavior (REQ-016).
- stack builder supports thresholded suggestions, preview-before-add, append-only stack behavior, and stack details/removal (REQ-001 to REQ-008).
- duplicate-blocking and 10-card cap are implemented as explicit MVP1 constraints (REQ-009, REQ-010; DEC-007, DEC-008).
- question input trim/fallback behavior and Decrypt submit gate are implemented (REQ-011, REQ-012; DEC-009).
- failure handling preserves state and exposes retry cooldown behavior (REQ-014; DEC-014, DEC-016).

Evidence:
- `[apps/frontend/src/App.tsx](../../apps/frontend/src/App.tsx)`
- `[apps/frontend/src/lib/stackState.ts](../../apps/frontend/src/lib/stackState.ts)`
- `[apps/frontend/src/App.test.tsx](../../apps/frontend/src/App.test.tsx)`

### 2) Search and Metadata Foundation

- local static metadata strategy is implemented and consumed at runtime from `/data/cardMetadata.json` (DEC-012).
- current autocomplete behavior includes:
  - threshold at 3+ characters,
  - typo tolerance via Levenshtein distance,
  - no-match copy constant,
  - max 3 suggestions.
- both stack and battlefield suggestion lists call the same `getSuggestions` utility.

Evidence:
- `[apps/frontend/src/lib/search.ts](../../apps/frontend/src/lib/search.ts)`
- `[apps/frontend/src/lib/search.test.ts](../../apps/frontend/src/lib/search.test.ts)`
- `[scripts/build-card-metadata.mjs](../../scripts/build-card-metadata.mjs)`
- `[apps/frontend/src/App.tsx](../../apps/frontend/src/App.tsx)`

### 3) Backend Contract and Prompt Pipeline

- API shape implemented with one main product-facing endpoint (`POST /api/ask-ai`) and health route, aligned with DEC-010 and REQ-012.
- strict request validation, deterministic prompt-context shaping, and prompt normalization/eval harness are implemented.
- provider boundary exists and is wired for provider selection.
- Phase A mock provider is active.

Evidence:
- `[apps/backend/src/app.ts](../../apps/backend/src/app.ts)`
- `[apps/backend/src/validation.ts](../../apps/backend/src/validation.ts)`
- `[apps/backend/src/promptContext.ts](../../apps/backend/src/promptContext.ts)`
- `[apps/backend/src/promptNormalization.ts](../../apps/backend/src/promptNormalization.ts)`
- `[apps/backend/src/providers/createAskAiProvider.ts](../../apps/backend/src/providers/createAskAiProvider.ts)`
- `[apps/backend/src/eval/contextEvaluationHarness.ts](../../apps/backend/src/eval/contextEvaluationHarness.ts)`

### 4) Test and Quality Coverage

- frontend flow tests cover staged context, stack interactions, payload shape, duplicate/cap guardrails, and retry behavior.
- backend tests cover validation/contracts, provider selection, and error mapping behavior.
- prompt regression fixtures and harness support deterministic evaluation checks.

Evidence:
- `[apps/frontend/src/App.test.tsx](../../apps/frontend/src/App.test.tsx)`
- `[apps/backend/src/app.test.ts](../../apps/backend/src/app.test.ts)`
- `[apps/backend/src/eval/contextEvaluationHarness.test.ts](../../apps/backend/src/eval/contextEvaluationHarness.test.ts)`

## Features Yet To Implement (Gap Analysis)

The following gaps are based on existing roadmap clues and current implementation state, without introducing speculative scope.

### MVP1-Deferred (already acknowledged by PRD decisions/constraints)

1. duplicate-card support (intentionally blocked in MVP1; DEC-007 is temporary).
2. manual stack reordering (explicitly out of MVP1 flow scope).
3. richer response rendering beyond plain text (REQ-013 defers formatting polish).
4. scanning-based card input (NFR-008 says extensibility only, no MVP1 implementation).

### Next-Phase Candidate / Phase B Readiness Gap

1. real Bedrock runtime invocation is not implemented yet; current `bedrock` path is readiness-only and intentionally throws.

Evidence:
- `[apps/backend/src/providers/bedrockReadinessProvider.ts](../../apps/backend/src/providers/bedrockReadinessProvider.ts)`
- `[apps/backend/src/providers/README.md](../../apps/backend/src/providers/README.md)`
- `[PRD/stories/STORY-028-phase-b-bedrock-readiness-bootstrap.md](../stories/STORY-028-phase-b-bedrock-readiness-bootstrap.md)`

## Search and Autocomplete Path Diagnosis

### Current Path Comparison

Both flows use the same search utility path, not separate backend services:

- stack search path:
  - `searchInput` -> `getSuggestions(cardMetadata, searchInput)` -> suggestion select -> preview/add stack item.
- battlefield search path:
  - `battlefieldSearchInput` -> `getSuggestions(cardMetadata, battlefieldSearchInput)` -> suggestion select -> battlefield entry fields.
- both feed the same downstream `POST /api/ask-ai` payload on submit.

### Why Smoothness Can Feel Different

The perceived difference is mostly from surrounding UI state behavior, not a different matcher:

1. both flows are synchronous and non-debounced; every keypress recomputes fuzzy filtering over full metadata.
2. both flows return first matching items in metadata order; no explicit relevance scoring/ranking contract.
3. battlefield input currently updates both `battlefieldSearchInput` and `battlefieldEntryName` on each keystroke (extra state churn).
4. there is no keyboard-navigation parity layer (arrow/enter/escape handling) for either suggestion list.
5. parity tests currently focus on baseline behavior, not strict cross-flow equivalence guarantees (same query => same ordered output).

Evidence:
- `[apps/frontend/src/App.tsx](../../apps/frontend/src/App.tsx)`
- `[apps/frontend/src/lib/search.ts](../../apps/frontend/src/lib/search.ts)`
- `[apps/frontend/src/lib/search.test.ts](../../apps/frontend/src/lib/search.test.ts)`

## Stories To Create (PRD-Compliant Backlog)

These stories are scoped to unify search/autocomplete behavior and user experience between battlefield and stack paths while preserving MVP1 guardrails.

### STORY-A - Shared Autocomplete Path Foundation

- title: Introduce a shared autocomplete module/hook used by both stack and battlefield entry flows.
- user value: As a player, I get consistent search behavior regardless of where I enter a card/effect.
- scope:
  - extract shared input->suggestions behavior from `App.tsx` into a reusable unit.
  - keep existing MVP1 constraints: local metadata, 3-char threshold, no-match copy, suggestion cap.
  - adapt both stack and battlefield entry points to call the same interface.
- acceptance criteria:
  - stack and battlefield suggestions are produced through one shared code path.
  - no regressions to existing threshold/no-match/selection behavior.
  - existing request/payload contracts remain unchanged.
- execution mode: parallel-ready
- dependencies:
  - REQ-001, REQ-002, REQ-012, REQ-016
  - DEC-010, DEC-012, DEC-019
  - NFR-004, NFR-005
- exclusions:
  - no new backend endpoints
  - no runtime metadata sync changes
  - no rules-engine logic additions

### STORY-B - Deterministic Relevance Ranking Contract

- title: Add deterministic suggestion ranking so both flows return the same ordered results for the same query.
- user value: As a player, the most likely match appears first consistently.
- scope:
  - define rank order (exact match > prefix > substring > typo-distance tie-break).
  - implement deterministic tie-break behavior independent of metadata source order.
  - add targeted unit coverage for ranking and tie-break scenarios.
- acceptance criteria:
  - equal queries against the same card set yield stable ordered top-3 results.
  - typo tolerance remains available after ranking changes.
  - no-match and threshold behavior stay unchanged.
- execution mode: parallel-ready
- dependencies:
  - REQ-002
  - DEC-012
  - NFR-002, NFR-005
- exclusions:
  - no external search service introduction
  - no fuzzy-search engine replacement beyond current MVP complexity

### STORY-C - Keyboard Interaction Parity

- title: Add shared keyboard navigation behavior for autocomplete in both stack and battlefield contexts.
- user value: As a player, I can complete search quickly without leaving the keyboard.
- scope:
  - implement active-option state and key handling (ArrowUp/ArrowDown/Enter/Escape).
  - normalize focus and selection behavior across both entry contexts.
  - add component/integration tests validating parity.
- acceptance criteria:
  - both contexts support identical key-driven suggestion navigation.
  - Enter selects focused suggestion; Escape closes suggestions.
  - mouse and keyboard interactions both preserve preview/add semantics.
- execution mode: parallel-ready
- dependencies:
  - REQ-001, REQ-002
  - FLOW-001
  - NFR-001, NFR-002, NFR-005
- exclusions:
  - no major visual redesign
  - no animation-heavy behavior changes

### STORY-D - Battlefield Input State Path Cleanup

- title: Refactor battlefield autocomplete input wiring to remove extra per-keystroke state duplication and align with shared path adapters.
- user value: As a player, battlefield search feels as smooth and predictable as stack search.
- scope:
  - remove unnecessary dual-write input updates where possible.
  - use shared autocomplete interface side-effect hooks for selection-to-entry mapping.
  - preserve current battlefield payload shape and skip/continue behavior.
- acceptance criteria:
  - battlefield keystrokes no longer depend on duplicate input-state writes.
  - battlefield selection behavior remains compatible with existing context-entry UX.
  - no regressions in battlefield payload submission tests.
- execution mode: sequential
- dependencies:
  - blocker: STORY-A (shared interface required to avoid parallel conflicting rewrites)
  - reason: contract coupling in shared autocomplete adapter and battlefield selection mapping.
  - parallelizable after unblock: additional parity and performance stories can proceed independently.
  - REQ-016, DEC-019, NFR-005
- exclusions:
  - no changes to backend `battlefieldContext` contract
  - no additional battlefield domain fields

### STORY-E - Cross-Flow Parity Regression Suite

- title: Add parity tests asserting same-query equivalence between stack and battlefield suggestion behavior.
- user value: As a team, we can prevent drift between the two search experiences.
- scope:
  - add regression scenarios for ordered results, threshold, no-match copy, and selection behavior.
  - encode parity assertions in frontend test coverage.
  - ensure tests fail on future path divergence.
- acceptance criteria:
  - test suite verifies same query produces same ordered suggestions across both contexts.
  - threshold and no-match behavior are parity-checked.
  - CI catches regressions when one path drifts from the other.
- execution mode: parallel-ready
- dependencies:
  - REQ-002
  - DEC-012
  - NFR-005
- exclusions:
  - no backend contract changes
  - no production logic changes beyond tests

### STORY-F - Lightweight Search Performance Guardrails

- title: Add lightweight responsiveness guardrails (debounce and/or pre-normalized index) for autocomplete loops.
- user value: As a player, suggestions stay responsive during live gameplay typing.
- scope:
  - introduce minimal performance controls compatible with MVP1 architecture.
  - keep behavior deterministic and testable (especially around debounce timing and emitted suggestions).
  - document constraints to preserve static metadata approach.
- acceptance criteria:
  - interaction remains consistent with existing threshold/no-match behavior.
  - responsiveness improves under representative metadata size.
  - implementation does not violate static metadata/no-runtime-sync constraints.
- execution mode: parallel-ready
- dependencies:
  - REQ-002
  - DEC-012
  - NFR-002, NFR-004, NFR-005
- exclusions:
  - no runtime metadata synchronization tooling
  - no separate search microservice or endpoint

## Sequencing Summary

- primary unblocker: STORY-A should land first to establish one shared path.
- mandatory sequential dependency: STORY-D depends on STORY-A because both touch battlefield path adapters.
- parallel-ready stories after STORY-A interface is available: STORY-B, STORY-C, STORY-E, STORY-F.

## Guardrail Alignment Check

All proposed stories intentionally preserve current product boundaries:

- preserve MVP1 simplifications (duplicate block stays in place).
- preserve static metadata strategy (no runtime sync tooling).
- preserve one main product-facing backend endpoint.
- avoid rules-engine expansion and keep assistant-style behavior model.
