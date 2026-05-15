> WARNING: This draft may be stale. Evaluate and reconcile it against the current PRD sections/instructions and implementation setup before accepting it as active scope.

# Feature PRD: ContextRefactor

## Metadata
- feature_id: context-refactor
- status: draft
- owner: Primary engineer
- last_updated: 2026-05-14

## Executive summary

ContextRefactor changes only the user data-collection flow so cross-references are captured after both card lists exist. The new staged flow is battlefield card collection, then stack card collection, then per-card enrichment, while preserving the same backend request contract and the same prompt output.

## Problem statement

The current flow captures targeting context too early, which creates edge cases where battlefield context and stack context point at each other before both lists are complete.

User-stated goal (verbatim):
> "The problem, is that in certain cenarios, the battleifled context and the stack context point at eachother, so to fix this, the new flow is to collect all the cards in the battlefield context, then collect all the cards in the stack context, and then be brought to a screen that walks through each card and enables the user to input the proper context for each card, before sending to the backend to process"

## Goals

- Refactor collection so users first collect battlefield cards, then stack cards, then enrich each card.
- Prevent premature cross-list linking during initial collection.
- Keep generated prompt output behavior unchanged from current expected output.
- Keep stack-empty submission blocked and battlefield-empty submission allowed.
- Make flow behavior easy to update through configuration.

## Non-goals

- Redesigning backend prompt assembly or changing the resulting prompt semantics.
- Changing `AskAiRequest` shape, Zod schemas, or endpoint contracts.
- Rewriting unrelated utilities outside targeted refactor scope.
- Expanding product scope into rules-engine behavior.

## Actors and personas

- Primary actor: Primary engineer.
- Secondary actor: End user entering gameplay context before ask-AI submission.

## User flows
### F-FLOW-001
- Name: Staged collection flow
- Trigger: User starts a new context capture session.
- Preconditions:
  - User can access context collection UI.
  - Existing request contract remains in place.
- Main flow:
  1. User establishes game context.
  2. User collects battlefield card list (cards only).
  3. User collects stack card list (cards only).
  4. System transitions to enrichment walkthrough.
  5. User proceeds to review and submit.
- Edge cases:
  - Battlefield list is empty and user continues.
  - Stack list is empty and user is blocked at submit boundary.
- Requirements covered: `F-REQ-001`, `F-REQ-004`, `F-REQ-006`
- Notes:
  - Initial collection steps do not collect targets.

### F-FLOW-002
- Name: Per-card enrichment walkthrough
- Trigger: User reaches enrichment after both card lists are collected.
- Preconditions:
  - Battlefield and stack card lists are already assembled.
- Main flow:
  1. System presents each card in sequence for enrichment.
  2. User enters per-card context, including targets where relevant.
  3. User can move through every card in the walkthrough.
  4. System persists enrichment for review and submit.
- Edge cases:
  - User leaves optional enrichment fields blank.
  - User must complete required enrichment constraints before submit.
- Requirements covered: `F-REQ-002`, `F-REQ-003`, `F-REQ-005`
- Notes:
  - Cross-list and same-list targeting is enabled only in enrichment.

## Functional requirements
### F-REQ-001
- Title: Split collection into list-first stages
- Priority: P0
- Description:
  - The UI must collect battlefield cards first and stack cards second before any targeting enrichment occurs.
- Acceptance criteria:
  - Battlefield stage supports card-list collection without target selection controls.
  - Stack stage supports card-list collection without target selection controls.
  - Transition to enrichment occurs only after both stages are completed.
- Constraints:
  - Preserve existing game-context entry and overall submit flow architecture.
- Dependencies:
  - Existing frontend flow/state orchestration.
- Flow coverage: `F-FLOW-001`
- Notes:
  - This is a refactor of collection order, not a feature-scope expansion.

### F-REQ-002
- Title: Add sequential per-card enrichment stage
- Priority: P0
- Description:
  - After card-list collection, the UI must walk through each card to capture proper per-card context.
- Acceptance criteria:
  - Enrichment presents cards in a deterministic sequence.
  - Users can input enrichment details per card before final submit.
  - Enrichment state is preserved into review.
- Constraints:
  - Keep the stage easy to maintain and update through configuration.
- Dependencies:
  - Card list data model from battlefield and stack stages.
- Flow coverage: `F-FLOW-002`
- Notes:
  - Sequence behavior should be driven by configurable flow metadata where possible.

### F-REQ-003
- Title: Enable cross-references only during enrichment
- Priority: P0
- Description:
  - Targeting references must be captured only after both lists exist, during enrichment.
- Acceptance criteria:
  - Battlefield cards can target stack cards during enrichment.
  - Stack cards can target battlefield cards during enrichment.
  - Same-list targeting remains supported where currently supported.
  - No targeting controls are available in the initial collection stages.
- Constraints:
  - Preserve current data-contract compatibility.
- Dependencies:
  - Enrichment components and target-picker data providers.
- Flow coverage: `F-FLOW-002`
- Notes:
  - This requirement addresses cross-list integrity issues from early targeting.

### F-REQ-004
- Title: Preserve submit gating rules
- Priority: P0
- Description:
  - Submission must remain blocked when stack is empty; battlefield may remain empty.
- Acceptance criteria:
  - Empty stack blocks submit with clear guidance.
  - Empty battlefield does not block submit when stack is valid.
  - Automated tests cover both cases.
- Constraints:
  - Validation behavior must remain consistent with current product decisions.
- Dependencies:
  - Existing validation logic and submit orchestration.
- Flow coverage: `F-FLOW-001`
- Notes:
  - This requirement is mandatory for parity with intended behavior.

### F-REQ-005
- Title: Make collection flow configurable
- Priority: P1
- Description:
  - Flow sequencing and step behavior should be easy to update through configuration instead of hardcoded branching.
- Acceptance criteria:
  - Stage order and walkthrough metadata are defined in one dedicated flow-configuration module.
  - Adding or reordering enrichment prompts can be done without broad refactors.
  - Configuration-driven behavior is test-covered.
- Constraints:
  - Avoid introducing a framework-level rewrite.
- Dependencies:
  - Existing flow state machine and UI step rendering logic.
- Flow coverage: `F-FLOW-002`
- Notes:
  - This supports future enhancements with lower implementation risk.

### F-REQ-006
- Title: Keep output prompt behavior unchanged
- Priority: P0
- Description:
  - Refactoring collection must not alter intended backend prompt output behavior for equivalent user input.
- Acceptance criteria:
  - Request serialization and review/submit parity tests remain green.
  - Backend eval harness remains green unless intentional, justified fixture updates are required.
  - Prompt/content semantics stay equivalent for matching scenarios.
- Constraints:
  - No `AskAiRequest` shape changes.
  - No unapproved prompt-assembly contract drift.
- Dependencies:
  - Existing backend eval fixtures and frontend serialization tests.
- Flow coverage: `F-FLOW-001`, `F-FLOW-002`
- Notes:
  - Refactor scope is collection process only.

## Non-functional requirements
### F-NFR-001
- Title: Regression safety across flow and prompt path
- Description:
  - The refactor must preserve reliability by keeping frontend and backend regression gates green.
- Constraints:
  - `npm test` passes for touched frontend logic.
  - Backend eval tests pass when prompt path-adjacent behavior is touched.
- Dependencies:
  - Existing CI commands and fixture workflow.
- Notes:
  - Golden updates require intentional behavior-change justification.

### F-NFR-002
- Title: Maintainability through narrow refactor boundaries
- Description:
  - Implementation should remain focused on collection flow surfaces and avoid unrelated rewrites.
- Constraints:
  - Use existing utilities where possible, targeted updates otherwise.
- Dependencies:
  - Current frontend flow and enrichment modules.
- Notes:
  - Supports faster iteration for future context enhancements.

## Integrations and data

- Frontend stages continue feeding existing request-builder paths.
- Enrichment consumes both assembled lists to populate target pickers.
- Backend integration remains unchanged at API contract level.
- Prompt creation uses existing backend logic and guardrails.

## UX and copy notes

- Step framing should make stage purpose obvious: collect cards first, enrich second.
- Empty-stack block messaging must clearly explain required next action.
- Enrichment walkthrough should make per-card progress understandable.
- Copy must not imply official tournament rulings.

## Observability and analytics

- Preserve existing milestone logs for flow progression.
- Add/adjust stage milestones for list collection and enrichment completion.
- Keep stable log keys for dashboard/funnel consistency.

## Risks and mitigations

- Risk: Refactor introduces review/submit mismatch.
  - Mitigation: Add parity assertions between review source and serialized payload.
- Risk: Cross-list target integrity regresses.
  - Mitigation: Add targeted tests for battlefield->stack, stack->battlefield, and same-list references.
- Risk: Configuration layer becomes over-engineered.
  - Mitigation: Keep configuration surface minimal and tied to current step model.
- Risk: Prompt output drifts unintentionally.
  - Mitigation: Keep backend eval harness checks mandatory for touched paths.

## Open questions

No open questions currently.

## Decisions
### F-DEC-001
- Decision: Collection flow is reordered to battlefield card list -> stack card list -> per-card enrichment.
- Status: confirmed
- Context:
  - User requested staged list-first flow to resolve cross-reference timing issues.
- Impact:
  - Targeting collection moves out of early stages into enrichment.
- Related requirements:
  - `F-REQ-001`
  - `F-REQ-002`
- Notes:
  - This is the primary behavior change of the feature.

### F-DEC-002
- Decision: Cross-list and same-list targeting are enabled during enrichment only.
- Status: confirmed
- Context:
  - Both lists must exist before reliable target assignment.
- Impact:
  - Target-pickers rely on assembled battlefield and stack collections.
- Related requirements:
  - `F-REQ-003`
- Notes:
  - Prevents broken early-stage references.

### F-DEC-003
- Decision: Empty stack blocks submit; empty battlefield is allowed.
- Status: confirmed
- Context:
  - User clarified desired gating behavior.
- Impact:
  - Validation remains strict for stack and permissive for battlefield.
- Related requirements:
  - `F-REQ-004`
- Notes:
  - Preserve consistency with current gating expectations.

### F-DEC-004
- Decision: Refactor collection flow only; final prompt behavior remains the same.
- Status: confirmed
- Context:
  - User explicitly requested no prompt-output behavior change.
- Impact:
  - Backend prompt contract and output semantics are preserved.
- Related requirements:
  - `F-REQ-006`
  - `F-NFR-001`
- Notes:
  - Any required fixture updates must be intentional and justified.

### F-DEC-005
- Decision: Use a dedicated flow-configuration module to control stage order and walkthrough behavior.
- Status: confirmed
- Context:
  - User selected long-term config-driven control and preferred the dedicated module approach.
- Impact:
  - Flow updates are centralized and easier to maintain.
  - Implementation avoids scattering step-order rules across multiple components.
- Related requirements:
  - `F-REQ-005`
- Notes:
  - Keep the module minimal and consume it from the existing flow controller.

## Out of scope

- Backend prompt redesign or semantics changes.
- New endpoints, schema migrations, or contract changes.
- Broad utility/library rewrites outside collection flow.
- Non-collection UX redesign.

## Success metrics

- Primary: collection refactor ships with unchanged prompt behavior for equivalent scenarios.
- Secondary: reduced reference-integrity regressions in automated tests.
- Quality proxy: all relevant frontend and backend regression checks pass.

## Testing, rollout, and flags

- Add/adjust frontend tests for staged collection order and enrichment sequencing.
- Add target-integrity tests for cross-list and same-list references in enrichment.
- Keep review-submit parity tests as ship blockers.
- Run backend eval harness for prompt-regression protection when touched.
- Roll out without permanent flags unless temporary rollout safety is needed.

## Traceability matrix
| ID | Type | Summary | Flows | Notes |
|----|------|---------|-------|-------|
| F-FLOW-001 | flow | Staged collection flow | — | Battlefield -> stack -> enrichment pipeline |
| F-FLOW-002 | flow | Per-card enrichment walkthrough | — | Targeting captured after both lists exist |
| F-REQ-001 | requirement | Split collection into list-first stages | `F-FLOW-001` | No early targeting |
| F-REQ-002 | requirement | Add sequential per-card enrichment stage | `F-FLOW-002` | Deterministic walkthrough |
| F-REQ-003 | requirement | Enable cross-references only during enrichment | `F-FLOW-002` | battlefield<->stack + same-list |
| F-REQ-004 | requirement | Preserve submit gating rules | `F-FLOW-001` | Empty stack blocked |
| F-REQ-005 | requirement | Make collection flow configurable | `F-FLOW-002` | Easier future updates |
| F-REQ-006 | requirement | Keep output prompt behavior unchanged | `F-FLOW-001`, `F-FLOW-002` | Refactor-only scope |
| F-NFR-001 | non-functional | Regression safety across flow and prompt path | `F-FLOW-001`, `F-FLOW-002` | CI/eval gates |
| F-NFR-002 | non-functional | Maintainability through narrow refactor boundaries | `F-FLOW-001`, `F-FLOW-002` | Reuse-first strategy |
| F-DEC-001 | decision | Reordered staged collection flow | `F-FLOW-001`, `F-FLOW-002` | Confirmed |
| F-DEC-002 | decision | Enrichment-only target linking | `F-FLOW-002` | Confirmed |
| F-DEC-003 | decision | Empty stack blocks submit | `F-FLOW-001` | Confirmed |
| F-DEC-004 | decision | Prompt behavior unchanged | `F-FLOW-001`, `F-FLOW-002` | Confirmed |
| F-DEC-005 | decision | Dedicated flow-config module | `F-FLOW-001`, `F-FLOW-002` | Confirmed |

## Story decomposition handoff
> **Machine contract:** This section is the primary input for `prd-to-parallel-stories`.

```yaml
feature_id: context-refactor
prd_path: PRD/docs/features/context-refactor/prd.md
requirements:
  - id: F-REQ-001
    summary: Split collection into battlefield-list then stack-list stages before enrichment.
  - id: F-REQ-002
    summary: Add deterministic per-card enrichment walkthrough after both lists are collected.
  - id: F-REQ-003
    summary: Capture cross-list and same-list targets only during enrichment.
  - id: F-REQ-004
    summary: Preserve submit gating: empty stack blocked, empty battlefield allowed.
  - id: F-REQ-005
    summary: Make flow sequencing and enrichment behavior easy to update through configuration.
  - id: F-REQ-006
    summary: Keep prompt output behavior and backend contract unchanged.
flows:
  - id: F-FLOW-001
    summary: Staged list-first collection flow.
  - id: F-FLOW-002
    summary: Sequential per-card enrichment walkthrough.
non_functional:
  - id: F-NFR-001
    summary: Keep frontend/backend regression gates green.
  - id: F-NFR-002
    summary: Keep refactor narrow and maintainable.
open_questions: []
decisions_confirmed:
  - id: F-DEC-001
  - id: F-DEC-002
  - id: F-DEC-003
  - id: F-DEC-004
  - id: F-DEC-005
suggested_story_themes:
  - staged-collection-flow-refactor
  - per-card-enrichment-walkthrough
  - cross-list-target-integrity-guards
  - configuration-driven-flow-metadata
  - prompt-parity-regression-locks
parallelization_notes: >
  UI stage refactor and enrichment component updates can proceed in parallel once shared
  flow contracts are defined. Submit-gating, review-submit parity, and prompt-regression
  checks should be finalized in a serial hardening pass before merge.
```

- ContextRefactor: staged battlefield/stack list collection
- ContextRefactor: per-card enrichment walkthrough and progress UX
- ContextRefactor: enrichment-only targeting integrity tests
- ContextRefactor: configuration surface for flow sequencing
- ContextRefactor: review/submit + prompt parity regression hardening

## Quality Gate

- [x] Every `F-REQ-*` has testable acceptance criteria
- [x] Every `F-FLOW-*` maps to at least one requirement or explicit gap called out in open questions
- [x] Non-goals and out of scope prevent agent scope creep
- [x] Open questions are not smuggled in as fake requirements
- [x] Story decomposition handoff YAML lists every `F-REQ-*` and `F-FLOW-*` from the doc body
