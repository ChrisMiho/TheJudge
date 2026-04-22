# decisions.md

### DEC-001
- Decision: MVP1 is a flow-validation MVP, not a gameplay-accurate or judge-accurate MVP.
- Status: confirmed
- Context: The first version is meant to prove the core user flow without taking on full MTG rules complexity.
- Impact:
  - temporary simplifications are allowed
  - some real gameplay cases may be excluded
- Related requirements:
  - REQ-009
  - REQ-010
  - REQ-011
- Notes:

### DEC-002
- Decision: The product is an assistant, not an authoritative judge.
- Status: confirmed
- Context: The system uses AI explanations and should not present itself as official or deterministic.
- Impact:
  - response language should avoid false certainty
  - backend should not become a rules engine
- Related requirements:
  - REQ-012
  - REQ-013
- Notes:

### DEC-003
- Decision: MVP1 collects only selected cards, stack order, and an optional question.
- Status: confirmed
- Context: Additional structured fields like targets, controller, and mode are intentionally out of scope.
- Impact:
  - context remains narrow
  - some answers will necessarily rely on limited input
- Related requirements:
  - REQ-006
  - REQ-011
  - REQ-012
- Notes:
  - superseded in part by DEC-019 for approved structured context additions

### DEC-004
- Decision: Stack ordering is bottom-to-top in the array, with `stack[0]` as bottom and the last item as top.
- Status: confirmed
- Context: Ordering is critical for prompt correctness and user understanding.
- Impact:
  - frontend, backend, and prompt logic must remain consistent
- Related requirements:
  - REQ-006
- Notes:

### DEC-005
- Decision: The newest added card is appended to the end of the array and becomes the top of the stack.
- Status: confirmed
- Context: Users build the stack upward during entry.
- Impact:
  - add behavior is append-only
  - manual reorder is deferred
- Related requirements:
  - REQ-005
  - REQ-006
- Notes:

### DEC-006
- Decision: If `stack.length === 0`, the add button text is **Begin stackening!**; otherwise it is **Add to Stack**.
- Status: confirmed
- Context: The first add action should feel playful, while repeated actions should stay clear.
- Impact:
  - add control text is conditional on stack length
  - styling remains unchanged
- Related requirements:
  - REQ-004
- Notes:

### DEC-007
- Decision: Duplicate cards are blocked in MVP1.
- Status: confirmed
- Context: This reduces complexity while validating the basic flow.
- Impact:
  - some real gameplay scenarios are excluded
  - duplicate blocking must be documented as temporary
- Related requirements:
  - REQ-009
- Notes:
  - this decision overrides gameplay realism for MVP1 scope control

### DEC-008
- Decision: The stack is capped at 10 cards in MVP1.
- Status: confirmed
- Context: This limits prompt size and reduces abuse risk.
- Impact:
  - UI must block additional adds past 10
- Related requirements:
  - REQ-010
- Notes:

### DEC-009
- Decision: Blank questions fall back to **Resolve the stack** in request-building logic.
- Status: confirmed
- Context: The question field is optional, but the backend should always receive a final question string.
- Impact:
  - fallback is not shown as injected UI text
- Related requirements:
  - REQ-011
- Notes:

### DEC-010
- Decision: MVP1 uses one main product-facing backend endpoint.
- Status: confirmed
- Context: The backend should remain intentionally small.
- Impact:
  - no separate product-facing endpoints for card lookup, stack creation, or prompt generation
- Related requirements:
  - REQ-012
- Notes:

### DEC-011
- Decision: Phase A uses a mock backend response before real Bedrock integration.
- Status: confirmed
- Context: This reduces implementation/debugging complexity.
- Impact:
  - frontend flow can be validated before AWS integration
- Related requirements:
  - REQ-013
  - REQ-014
- Notes:

### DEC-012
- Decision: MVP1 uses a static prebuilt metadata file committed with the app.
- Status: confirmed
- Context: Runtime metadata syncing would add unnecessary complexity.
- Impact:
  - autocomplete and preview rely on bundled data
- Related requirements:
  - REQ-002
  - REQ-003
- Notes:

### DEC-013
- Decision: The backend must not implement legality validation, deterministic rules simulation, board-state logic, or format enforcement in MVP1.
- Status: confirmed
- Context: Heavy rules behavior is explicitly out of scope.
- Impact:
  - backend only validates request shape and builds model prompt context
- Related requirements:
  - REQ-012
- Notes:

### DEC-014
- Decision: AI failures preserve stack, question, and previous successful response, and expose a retry button with a 13-second cooldown.
- Status: confirmed
- Context: Live gameplay requires resilience without wiping user progress.
- Impact:
  - error handling must preserve state
- Related requirements:
  - REQ-014
- Notes:

### DEC-015
- Decision: The empty-state search input should say **Type to begin** before the user types.
- Status: confirmed
- Context: The empty state needs a minimal directional cue without extra helper copy or buttons.
- Impact:
  - the input itself carries the starting guidance
- Related requirements:
  - REQ-001
- Notes:

### DEC-016
- Decision: AI failure copy should use the phrase **Miho is working on it**.
- Status: confirmed
- Context: Humorous failure copy was requested and is now explicitly defined.
- Impact:
  - error-state messaging is consistent
- Related requirements:
  - REQ-014
- Notes:

### DEC-017
- Decision: Phase A mock responses should return the outbound request payload as a debug-friendly JSON-formatted string inside the `answer` field.
- Status: confirmed
- Context: The mock flow should help inspect and tune the request shape before real LLM integration.
- Impact:
  - the frontend can debug request composition without changing response contracts
- Related requirements:
  - REQ-013
- Notes:

### DEC-018
- Decision: Stack details should show thumbnails when available, but continue to work without them.
- Status: confirmed
- Context: Images are helpful but should not be required for the details UI.
- Impact:
  - thumbnail rendering is opportunistic, not mandatory
- Related requirements:
  - REQ-008
- Notes:

### DEC-019
- Decision: MVP1 includes structured context beyond stack/question for flow validation: pre-stack game context (player count + life totals), optional battlefield context with skip, and per-stack mana-spent context with deterministic fallback behavior.
- Status: confirmed
- Context: Story roadmap now requires richer prompt-ready context while still avoiding rules-engine complexity.
- Impact:
  - frontend flow becomes staged: game context -> optional battlefield context -> stack construction/question
  - backend request/prompt context includes approved structured context fields deterministically
  - mana-spent context defaults to `manaValue` when omitted by user
  - DEC-003 remains historical and is overridden where it conflicts with this approved context expansion
- Related requirements:
  - REQ-012
  - REQ-013
  - REQ-015
  - REQ-016
  - REQ-017
- Notes:
