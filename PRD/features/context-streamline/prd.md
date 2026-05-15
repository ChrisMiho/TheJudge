> WARNING: This draft may be stale. Evaluate and reconcile it against the current PRD sections/instructions and implementation setup before accepting it as active scope.

# Feature PRD: ContextStreamline

## Metadata
- feature_id: context-streamline
- status: draft
- owner: unknown
- last_updated: 2026-05-14

## Executive summary

ContextStreamline re-organizes context collection so prompt input follows a stable, user-friendly order: battlefield context first, stack context second, and currently enabled additional context last. The feature keeps existing request contracts stable while making collection easier to extend in future increments.

## Problem statement

Current context collection behavior has evolved across frontend flow steps and enrichment points. This creates friction for users and engineers because ordering and omission handling can feel inconsistent. The feature must streamline the process without changing the core backend request contract or introducing broad utility rewrites.

## Goals

- Streamline the context process to make it more enjoyable for users.
- Re-organize context collection so user-provided context is captured and serialized in predictable order.
- Preserve compatibility with existing request/prompt contracts and product decisions.
- Keep battlefield context optional while enforcing non-empty stack submission rules.
- Improve maintainability so future context enhancements can be added with lower risk.

## Non-goals

- Reworking current utilities beyond targeted updates required to support the new collection order.
- Introducing net-new product-facing endpoints or changing core API contracts.
- Re-scoping product behavior into deterministic rules-engine logic.
- Shipping broad UX redesign unrelated to context collection flow.

## Actors and personas

- Primary actor: Engineer reviewing implementation correctness and maintainability.
- Secondary actor: End user entering gameplay context before asking for AI output.

## User flows
### F-FLOW-001
- Name: Ordered context entry and submit
- Trigger: User enters the context flow and prepares a request for AI response.
- Preconditions:
  - User is in the active context capture flow.
  - Existing request schema and validation rules are unchanged.
- Main flow:
  1. User enters battlefield context (or skips it).
  2. User enters stack context.
  3. User enters currently enabled additional context fields.
  4. User reviews summary of collected data.
  5. User submits request.
- Edge cases:
  - User omits battlefield context and proceeds.
  - User reaches submit with empty stack and is blocked until at least one stack item exists.
  - User omits stack-adjacent optional enrichment fields and proceeds.
- Requirements covered: `F-REQ-001`, `F-REQ-002`, `F-REQ-003`
- Notes:
  - Battlefield remains optional; stack is required for submit.

### F-FLOW-002
- Name: Omission-aware request generation
- Trigger: User submits with one or more optional sections omitted.
- Preconditions:
  - Submit requires non-empty stack under existing rules.
- Main flow:
  1. System assembles request in required section order.
  2. System includes omission markers or equivalent omission-aware context cues for skipped sections.
  3. Backend prompt path receives omission-aware context without contract drift.
- Edge cases:
  - Battlefield omitted while stack and additional context are present.
  - Additional context omitted while battlefield and stack are present.
- Requirements covered: `F-REQ-003`, `F-REQ-004`
- Notes:
  - Omission representation should be deterministic and test-covered.

## Functional requirements
### F-REQ-001
- Title: Enforce user-facing context collection order
- Priority: P0
- Description:
  - The context flow must collect user input in this order: battlefield context, then stack context, then currently enabled additional context.
- Acceptance criteria:
  - Frontend flow enforces the above order on happy path.
  - Review view reflects the same section ordering.
  - No step allows bypass that inverts section order.
- Constraints:
  - Preserve approved staged flow principles and existing stack-order semantics.
- Dependencies:
  - Existing frontend flow orchestration and step-state components.
  - DEC-019 staged context expansion.
- Flow coverage: `F-FLOW-001`
- Notes:
  - Keep edits local to flow and assembly surfaces.

### F-REQ-002
- Title: Preserve serialization and submit parity with ordered sections
- Priority: P0
- Description:
  - Serialized request data must preserve the same section ordering represented in UI review and used for submit.
- Acceptance criteria:
  - Automated tests validate review-source and submit payload parity.
  - Serialization tests confirm section-order invariants remain stable.
  - Existing request shape remains unchanged.
- Constraints:
  - Do not change `AskAiRequest` or Zod schemas.
  - Do not introduce backend contract-breaking prompt-path changes.
- Dependencies:
  - Request builder logic and existing eval harness fixtures.
- Flow coverage: `F-FLOW-001`
- Notes:
  - Treat contract stability as ship blocker.

### F-REQ-003
- Title: Enforce stack-required submit while keeping battlefield optional
- Priority: P0
- Description:
  - Submit must be blocked when stack is empty. Battlefield context may be omitted without blocking submit, and prompt context should remain omission-aware for optional sections where relevant.
- Acceptance criteria:
  - Submit is blocked when `stack.length === 0`.
  - Submit remains allowed when battlefield context is empty and stack is non-empty.
  - Request/prompt context includes deterministic omitted-section signaling.
  - Tests cover at least one omitted battlefield scenario and one omitted additional-context scenario.
- Constraints:
  - Omission signaling must remain within existing schema and approved prompt behavior boundaries.
- Dependencies:
  - Frontend request assembly and backend prompt context handling.
- Flow coverage: `F-FLOW-001`, `F-FLOW-002`
- Notes:
  - Keep stack-required validation behavior explicit in UI and tests.

### F-REQ-004
- Title: Reuse existing code paths before adding new implementation surfaces
- Priority: P1
- Description:
  - Implementation should re-use or minimally adapt existing utilities and flow code where possible; only update code paths when reuse cannot satisfy correctness.
- Acceptance criteria:
  - Change set documents reused modules and targeted updates.
  - No broad utility rewrite is introduced.
  - All relevant tests pass after changes.
- Constraints:
  - Keep implementation narrow and maintainable.
- Dependencies:
  - Existing frontend/backend utility modules and test suites.
- Flow coverage: `F-FLOW-002`
- Notes:
  - This requirement governs implementation strategy, not user-visible behavior.

## Non-functional requirements
### F-NFR-001
- Title: Regression safety and test health
- Description:
  - All touched context-flow areas must maintain or improve existing automated test coverage and pass gates.
- Constraints:
  - Frontend tests must pass.
  - Backend eval harness must pass when prompt path or fixtures are touched.
- Dependencies:
  - Existing CI commands and fixture workflow.
- Notes:
  - Fixture updates require explicit justification.

### F-NFR-002
- Title: Contract and decision compatibility
- Description:
  - Feature behavior must remain compatible with existing product decisions on assistant framing, stack semantics, and narrow backend scope.
- Constraints:
  - No expansion into rules-engine behavior.
  - No new endpoint sprawl.
- Dependencies:
  - Active decisions in `PRD/sections/decisions.md`.
- Notes:
  - Decisions are override layer for ambiguity resolution.

## Integrations and data

- Frontend flow state and request assembly integrate with existing ask-submit orchestration.
- Backend continues to consume the existing ask payload contract and prompt normalization path.
- Existing fixtures and goldens remain source of regression truth.
- Additional context refers to currently enabled UI context that enriches the user question.

## UX and copy notes

- Collection sequence should feel explicit and predictable.
- Empty-stack submit state should show clear, actionable guidance to add at least one stack item.
- Omitted optional sections should show clear, non-alarming review language (example intent: "omitted by user").
- Avoid copy that implies official tournament ruling certainty.

## Observability and analytics

- Preserve and extend context-flow milestone logging where needed so ordered flow completion can be monitored.
- Ensure submit attempts with omitted sections are observable without logging sensitive free text.
- Keep milestone keys stable once finalized.

## Risks and mitigations

- Risk: Hidden contract drift while reordering collection.
  - Mitigation: Add parity tests and fixture-backed regression checks.
- Risk: Validation drift causes incorrect submit gating behavior.
  - Mitigation: Explicit tests for blocked empty-stack submit and allowed battlefield-omitted submit.
- Risk: Over-refactor of utilities increases scope and delivery risk.
  - Mitigation: Enforce targeted reuse-first implementation approach.

## Open questions
### F-Q-001
- Question: What exact UI label and structured representation should be used for omitted sections across review and prompt context?
- Context:
  - Requirement is to keep optional omission signaling consistent while stack-required submit gating remains enforced.
- Why it matters:
  - Inconsistent omission representation can break trust or regress prompt quality.
- Options under consideration:
  - Standardized per-section status string (e.g., "omitted_by_user").
  - Existing empty-array/empty-field semantics with explicit review copy only.
- Recommended next step:
  - Confirm one canonical omission representation and lock tests to it.

## Decisions
### F-DEC-001
- Decision: ContextStreamline orders collection as battlefield -> stack -> currently enabled additional context.
- Status: confirmed
- Context:
  - User provided direct ordering intent for this feature.
- Impact:
  - UI flow, review ordering, and request serialization must align.
- Related requirements:
  - `F-REQ-001`
  - `F-REQ-002`
- Notes:
  - This is feature-scoped and must remain compatible with global decisions.

### F-DEC-002
- Decision: Submit is blocked when stack is empty; battlefield context may remain optional, and optional omissions should still be represented to model context when relevant.
- Status: confirmed
- Context:
  - User clarified stack-empty submission should be blocked, but empty battlefield is acceptable.
- Impact:
  - Validation and UX must enforce stack-required submit behavior.
  - Request assembly and prompt context handling still include deterministic omission-aware cues for optional sections.
- Related requirements:
  - `F-REQ-003`
- Notes:
  - Keep compatibility with existing non-empty stack validation rules.

### F-DEC-003
- Decision: Implementation is reuse-first, targeted-update-second.
- Status: confirmed
- Context:
  - User requested existing code should be re-used where possible; otherwise updated.
- Impact:
  - Limits refactor breadth and keeps delivery focused.
- Related requirements:
  - `F-REQ-004`
  - `F-NFR-001`
- Notes:
  - Broad utility rewrites remain out of scope.

## Out of scope

- Replacing core context utilities with new framework-level abstractions.
- Changing request schema, validation schema, or backend endpoint shape.
- Rewriting prompt assembly architecture beyond compatibility-preserving adjustments.
- Defining final success KPI targets in this draft (deferred by request).

## Success metrics

- Deferred for this draft per user direction.
- Baseline quality proxy: no regression in relevant automated test gates.

## Testing, rollout, and flags

- Add/maintain frontend tests for ordered flow, submit parity, and omission-aware behavior.
- Run backend eval regression tests when prompt-path-adjacent behavior is touched.
- Roll out without feature-flag proliferation unless implementation risk requires temporary guard.
- Require green test gates before merge.

## Traceability matrix
| ID | Type | Summary | Flows | Notes |
|----|------|---------|-------|-------|
| F-FLOW-001 | flow | Ordered context entry and submit | — | Primary user path |
| F-FLOW-002 | flow | Omission-aware request generation | — | Handles skipped optional sections |
| F-REQ-001 | requirement | Enforce user-facing context collection order | `F-FLOW-001` | Battlefield -> stack -> additional |
| F-REQ-002 | requirement | Preserve serialization and submit parity | `F-FLOW-001` | Contract and parity guard |
| F-REQ-003 | requirement | Stack-required submit with optional battlefield omission | `F-FLOW-001`, `F-FLOW-002` | Empty stack blocks submit |
| F-REQ-004 | requirement | Reuse-first implementation strategy | `F-FLOW-002` | Scope discipline |
| F-NFR-001 | non-functional | Regression safety and test health | `F-FLOW-001`, `F-FLOW-002` | CI/eval gates |
| F-NFR-002 | non-functional | Contract and decision compatibility | `F-FLOW-001`, `F-FLOW-002` | No scope drift |
| F-Q-001 | open question | Canonical omission representation | `F-FLOW-002` | Needs final lock |
| F-DEC-001 | decision | Ordered collection sequence | `F-FLOW-001` | Confirmed by user |
| F-DEC-002 | decision | Empty stack blocks submit; battlefield may be omitted | `F-FLOW-002` | Confirmed by user |
| F-DEC-003 | decision | Reuse-first implementation strategy | `F-FLOW-002` | Confirmed by user |

## Story decomposition handoff
> **Machine contract:** This section is the primary input for `prd-to-parallel-stories`.

```yaml
feature_id: context-streamline
prd_path: PRD/features/context-streamline/prd.md
requirements:
  - id: F-REQ-001
    summary: Enforce ordered context collection across UI/review flow.
  - id: F-REQ-002
    summary: Preserve ordered serialization and review-submit parity without schema drift.
  - id: F-REQ-003
    summary: Block submit for empty stack while allowing battlefield omission with omission-aware context cues.
  - id: F-REQ-004
    summary: Use reuse-first implementation strategy with targeted updates only.
flows:
  - id: F-FLOW-001
    summary: Ordered context entry and submit path.
  - id: F-FLOW-002
    summary: Omission-aware request generation path.
non_functional:
  - id: F-NFR-001
    summary: Maintain regression safety and passing test gates.
  - id: F-NFR-002
    summary: Preserve compatibility with existing decisions and contract boundaries.
open_questions:
  - id: F-Q-001
decisions_confirmed:
  - id: F-DEC-001
  - id: F-DEC-002
  - id: F-DEC-003
suggested_story_themes:
  - ordered-ui-flow-and-review-sequencing
  - serialization-and-submit-parity-regression-tests
  - omission-aware-context-representation
  - reuse-first-refactor-guardrails-and-test-hardening
parallelization_notes: >
  UI flow ordering and omission-representation test scaffolding can run in parallel.
  Final submit-parity and backend eval fixture verification should serialize after
  request assembly behavior is stabilized.
```

- ContextStreamline: ordered UI flow enforcement (battlefield -> stack -> additional context)
- ContextStreamline: review/submit parity regression coverage
- ContextStreamline: stack-required submit and omission-aware request/prompt context behavior
- ContextStreamline: targeted reuse-first implementation and safety checks

## Quality Gate

- [x] Every `F-REQ-*` has testable acceptance criteria
- [x] Every `F-FLOW-*` maps to at least one requirement or explicit gap called out in open questions
- [x] Non-goals and out of scope prevent agent scope creep
- [x] Open questions are not smuggled in as fake requirements
- [x] Story decomposition handoff YAML lists every `F-REQ-*` and `F-FLOW-*` from the doc body
