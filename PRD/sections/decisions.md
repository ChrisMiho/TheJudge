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

### DEC-020
- Decision: Live answer generation uses an explicit backend provider flag with OpenAI behind the existing provider interface; HTTP contracts stay frozen across provider swaps.
- Status: confirmed
- Context: MVP2 replaced the Phase A mock-only path with a swappable provider boundary while preserving staged UX and request/response shapes.
- Impact:
  - `POST /api/ask-ai` request and success/error response shapes remain unchanged when switching providers
  - provider selection is explicit via `ASK_AI_PROVIDER` (`mock` default, `openai` live); do not infer provider mode from `NODE_ENV` or deploy target
  - OpenAI credentials and API keys remain backend-only (see `instructions/secrets-handling.md` and `apps/backend/src/providers/README.md`)
  - upstream provider failures map to normalized API error codes with optional `retryAfterSeconds`
  - frontend and backend remain independently deployable release units
  - stack order semantics (`stack[0]` bottom, last item top) must stay consistent across UI, API payloads, and prompt-building logic
- Related requirements:
  - REQ-006
  - REQ-012
  - REQ-013
  - REQ-014
- Notes:
  - supersedes Bedrock-specific Phase B wording in `sections/integrations-and-data.md` where they conflict
  - route handlers stay contract-focused; provider SDK wiring lives only in provider/factory composition

### DEC-021
- Decision: `GameContext` is the parent model for prompt-facing game state.
- Status: confirmed
- Context: UX Wave 2 replaces separate top-level stack and battlefield payloads with a single structured game-state container.
- Impact:
  - `POST /api/ask-ai` accepts `question` and `gameContext` only
  - selected zones, turn phase, players, active player, and populated zone cards live under `gameContext`
  - frontend, backend validation, prompt context, and eval fixtures use the same parent model
- Related requirements:
  - REQ-012
  - REQ-015
  - REQ-018
  - REQ-019
- Notes:
  - supersedes DEC-003 and DEC-019 where those decisions describe top-level `stack` or `battlefieldContext`

### DEC-022
- Decision: Turn phase uses the v1 enum `untap`, `upkeep`, `draw`, `main_1`, `combat`, `main_2`, `end_step`, `cleanup`, and `stack_resolving`.
- Status: confirmed
- Context: The app needs enough timing context for prompt quality without modeling every Magic sub-step.
- Impact:
  - combat is one combined phase
  - combat sub-step detail belongs in the user's question or notes, not structured fields
  - `stack_resolving` is a distinct timing value for questions asked while the stack is resolving
- Related requirements:
  - REQ-015
- Notes:

### DEC-023
- Decision: Zone confirmation is user-controlled and seeded by phase defaults.
- Status: confirmed
- Context: The app should help users include likely relevant zones without treating phase defaults as rules-engine truth.
- Impact:
  - game setup is followed by a zone checklist
  - phase defaults preselect likely zones
  - user changes are preserved across navigation
  - changing phase adds newly assumed zones without wiping cards or enrichment
- Related requirements:
  - REQ-018
  - REQ-020
- Notes:

### DEC-024
- Decision: Submit requires at least one card in at least one selected zone, and empty zones are omitted from the request payload.
- Status: confirmed
- Context: Manual flow validation showed that users could complete the staged flow without providing any card context, which produced too little information for the flow-validation assistant.
- Impact:
  - frontend submit requires at least one card in at least one selected zone
  - `gameContext.zones` contains only zone keys with one or more cards
  - selected-but-empty zones are represented by `selectedZones` and the prompt scope sentence, not by empty arrays
- Related requirements:
  - REQ-012
  - REQ-018
  - REQ-019
- Notes:
  - the validation contract rejects empty zone arrays; omit the key instead

### DEC-025
- Decision: Every AI prompt includes the MTG reference block and a merged zone scope sentence.
- Status: confirmed
- Context: Prompt quality depends on stable Magic terminology and explicit boundaries around missing or intentionally empty zones.
- Impact:
  - prompt text starts from the static Magic reference block
  - one scope sentence covers both unselected zones and selected zones with no cards
  - the model is instructed to ignore out-of-scope zones unless the user's question says otherwise
- Related requirements:
  - REQ-013
  - REQ-019
- Notes:

### DEC-026
- Decision: `ContextTarget` replaces `StackTarget`.
- Status: confirmed
- Context: Targets can now refer to cards from any selected/populated zone, players, no target, or freeform external targets.
- Impact:
  - target kinds are `player`, `card`, `none`, and `other`
  - card targets include `zone`, `cardId`, and `cardName`
  - stack-specific target serialization is internal prompt-context normalization, not the public API model
- Related requirements:
  - REQ-017
  - REQ-021
- Notes:

### DEC-027
- Decision: Optional player display names are UI- and prompt-facing labels layered over fixed `PlayerLabel` identity.
- Status: confirmed
- Context: Users can enter names during game setup, but the API must keep stable player identifiers for validation and downstream contracts.
- Impact:
  - API fields such as `label`, `activePlayer`, `caster`, `owner`, and `targetPlayer` remain `PlayerLabel` strings (`Player 1` ... `Player N`)
  - UI player options show `Player N (Name)` when a trimmed custom display name is set and differs from the label
  - prompt text resolves player references in roster-adjacent fields, `activePlayer`, caster, owner, and player targets using the same `Player N (Name)` format
  - empty, whitespace-only, or label-identical display names are treated as unset
- Related requirements:
  - REQ-015
  - REQ-017
  - REQ-019
- Notes:
