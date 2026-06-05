# functional-requirements.md

### REQ-001
- Title: Card search input
- Priority: high
- Description: The product must provide a single card search text box as the main input for building the stack.
- Acceptance Criteria:
  - search box is visible on first load
  - before input, the text box says **Type to begin**
  - user can type into it immediately
  - suggestions begin at 3 or more typed characters
- Constraints:
  - mobile-first layout
- Dependencies:
  - local card metadata
- Notes:
  - empty-state button is not required

### REQ-002
- Title: Autocomplete suggestions
- Priority: high
- Description: The app must show matching card suggestions from local metadata with typo tolerance.
- Acceptance Criteria:
  - suggestions appear after 3 typed characters
  - no-match state shows **No matching card found**
  - tapping a suggestion opens a preview instead of immediately adding
- Constraints:
  - suggestions should feel immediate
- Dependencies:
  - static local metadata file
- Notes:

### REQ-003
- Title: Card preview before add
- Priority: high
- Description: The app must show a preview of the selected card before it can be added to the stack.
- Acceptance Criteria:
  - selecting a suggestion shows card preview
  - preview includes enough information to confirm the card
  - add action is separate from suggestion selection
- Constraints:
  - preview should remain simple in MVP1
- Dependencies:
  - image URL and oracle text data
- Notes:

### REQ-004
- Title: Add button labeling rule
- Priority: medium
- Description: The add button text must vary based on whether the stack is empty.
- Acceptance Criteria:
  - if `stack.length === 0`, button text is **Begin stackening!**
  - if `stack.length > 0`, button text is **Add to Stack**
  - button styling remains the same in both cases
- Constraints:
  - rule must be consistent across UI implementation
- Dependencies:
  - stack state
- Notes:

### REQ-005
- Title: Add card to stack
- Priority: high
- Description: The app must allow users to add selected cards to the stack.
- Acceptance Criteria:
  - clicking add appends the card to the end of the stack array
  - appended card becomes the top of the stack
  - app shows brief success state such as **Stacked**
- Constraints:
  - stack is append-only in MVP1
- Dependencies:
  - stack state
- Notes:

### REQ-006
- Title: Stack ordering consistency
- Priority: high
- Description: Stack ordering must remain consistent in UI, API payloads, and prompt-building logic.
- Acceptance Criteria:
  - `stack[0]` is the bottom of the stack
  - the last item in the array is the top of the stack
  - stack details UI displays bottom-to-top
  - prompt builder preserves the same order
- Constraints:
  - do not invert ordering in any layer
- Dependencies:
  - frontend stack state
  - backend prompt builder
- Notes:

### REQ-007
- Title: Stack icon with count
- Priority: medium
- Description: The app must represent the current stack with an icon that looks like stacked cards and displays the current count.
- Acceptance Criteria:
  - icon is visible when stack contains cards
  - icon badge reflects current stack size
- Constraints:
  - keep visual treatment simple in MVP1
- Dependencies:
  - stack state
- Notes:

### REQ-008
- Title: Stack details and removal
- Priority: high
- Description: Clicking the stack icon must open a details view where cards can be inspected and removed.
- Acceptance Criteria:
  - clicking stack icon opens a box, panel, or modal
  - cards are listed bottom-to-top
  - each row shows card name and remove button
  - thumbnail is shown when available
  - if thumbnail does not load, row still renders correctly
  - user can remove cards from the stack
- Constraints:
  - no manual reordering in MVP1
- Dependencies:
  - stack state
- Notes:

### REQ-009
- Title: Block duplicate cards in MVP1
- Priority: medium
- Description: MVP1 must block duplicate cards from being added to the stack.
- Acceptance Criteria:
  - if a selected card already exists in the stack, add is blocked
  - UI shows a message that duplicates are not supported in MVP1
- Constraints:
  - this is temporary and only for flow validation
- Dependencies:
  - stack state
- Notes:
  - not a long-term gameplay rule

### REQ-010
- Title: Enforce stack size limit
- Priority: medium
- Description: MVP1 must cap the stack at 10 cards.
- Acceptance Criteria:
  - app blocks adding an 11th card
  - UI explains that the MVP stack limit has been reached
- Constraints:
  - limit exists to reduce token use and abuse
- Dependencies:
  - stack state
- Notes:

### REQ-011
- Title: Question input
- Priority: high
- Description: The app must provide a freeform question field submitted with the game context.
- Acceptance Criteria:
  - user can enter up to 300 characters
  - question is trimmed before submit
  - blank trimmed question uses fallback **Resolve the stack**
- Constraints:
  - fallback is request logic, not visible UI injection
- Dependencies:
  - submit flow
- Notes:
  - question is optional in MVP1

### REQ-012
- Title: Decrypt Stack submit action
- Priority: high
- Description: The app must submit the final question and captured `gameContext` to the backend through the main action button.
- Acceptance Criteria:
  - action button label is **Decrypt Stack**
  - clicking the button sends `question` and `gameContext`
  - no top-level `stack` or `battlefieldContext` is sent
  - submit is allowed only when at least one selected zone has a card
  - blank trimmed question uses fallback **Resolve the stack** in request/prompt logic
- Constraints:
  - one main product-facing endpoint in MVP1
- Dependencies:
  - backend API
- Notes:

### REQ-013
- Title: Plain-text AI response
- Priority: high
- Description: MVP1 must display the AI response as plain text.
- Acceptance Criteria:
  - backend returns an answer string on success
  - frontend renders answer text without advanced formatting
- Constraints:
  - formatting polish is deferred
- Dependencies:
  - backend response contract
- Notes:

### REQ-014
- Title: Failure handling with retry cooldown
- Priority: high
- Description: The product must preserve user state on AI failure and provide a controlled retry path.
- Acceptance Criteria:
  - failed request shows **Miho is working on it**
  - game context, selected zones, cards, and enrichment are preserved
  - question is preserved
  - previous successful response remains visible
  - retry button is shown
  - retry button uses a 13-second cooldown
- Constraints:
  - do not wipe user context on failure
- Dependencies:
  - backend error contract
- Notes:

### REQ-015
- Title: Game setup context capture
- Priority: high
- Description: Before zone collection begins, the app must collect core game context including player count, life totals, active player when known, and turn phase.
- Acceptance Criteria:
  - user can set number of players using fixed labels (`Player 1` ... `Player N`)
  - user can optionally enter display names for included player labels
  - user can enter life totals for each included player label
  - user can set active player from included player labels
  - player selects show display names as `Player N (Name)` when a custom display name is set
  - submitted API values remain fixed `PlayerLabel` strings
  - user must select one turn phase from `untap`, `upkeep`, `draw`, `main_1`, `combat`, `main_2`, `end_step`, `cleanup`, and `stack_resolving`
  - user must confirm context before proceeding to zone confirmation
  - invalid or missing required values block progression
- Constraints:
  - fixed `PlayerLabel` identity with optional display names for UI labels and prompt text
  - support range is constrained by current player-label model
  - combat is a combined phase; combat sub-step details belong in the question or notes
- Dependencies:
  - frontend staged flow
  - prompt context contract
- Notes:
  - this context is prompt-facing, not a rules-engine source of truth

### REQ-016
- Title: Zone confirmation with phase defaults
- Priority: medium
- Description: After game setup, the app must provide a zone checklist preselected from the chosen turn phase.
- Acceptance Criteria:
  - zone confirmation appears after game setup
  - app preselects likely zones from the turn phase
  - user can toggle any v1 zone on or off
  - selected zones are stored in `gameContext.selectedZones`
  - continue leads to per-zone collection
- Constraints:
  - phase defaults are UX hints, not legality or board-state rules
  - keep interaction lightweight for live gameplay
- Dependencies:
  - game setup step
  - prompt context contract
- Notes:
  - v1 zones are `stack`, `battlefield`, `hand`, `graveyard`, `exile`, `library`, and `command`

### REQ-017
- Title: Per-card enrichment with fallback
- Priority: medium
- Description: Each collected card may include prompt-facing enrichment such as caster, targets, notes, and mana spent where relevant.
- Acceptance Criteria:
  - app builds one ordered enrichment list across all populated zones
  - user can optionally enter context notes per card
  - user can optionally set targets using `ContextTarget`
  - user can optionally enter mana-spent context for stack entries
  - backend prompt context always emits deterministic mana-spent value per stack entry
  - omitted user input falls back to `manaValue`
  - prompt/mock output includes mana-spent context in stable formatting
- Constraints:
  - do not implement comprehensive mana-source legality checks
- Dependencies:
  - zone card data model
  - backend prompt context builder
- Notes:
  - X-spell clarity is a primary motivation for this field

### REQ-018
- Title: Per-zone card collection
- Priority: high
- Description: The app must let users add card identities to each selected zone while requiring at least one card across the selected zones before continuing.
- Acceptance Criteria:
  - user can search local metadata and add cards to selected zones
  - before input, the search box says **Type to begin**
  - suggestions begin at 3 or more typed characters
  - no-match state shows **No matching card found**
  - stack-zone cards preserve bottom-to-top append order
  - selected zones with zero cards are allowed individually
  - collection cannot continue until at least one selected zone contains a card
- Constraints:
  - card collection captures identity and metadata first; detailed context is collected during enrichment
- Dependencies:
  - local card metadata
  - zone confirmation
- Notes:

### REQ-019
- Title: Ask AI request payload shape
- Priority: high
- Description: The backend request contract must use `AskAiRequest = { question, gameContext }`.
- Acceptance Criteria:
  - request validation accepts `question` and `gameContext`
  - request validation rejects top-level `stack` and `battlefieldContext`
  - `gameContext.zones` includes only non-empty zone arrays
  - empty zone arrays are rejected; clients omit the zone key instead
  - frontend submit requires at least one selected zone card before building the request
- Constraints:
  - `POST /api/ask-ai` route remains unchanged
- Dependencies:
  - frontend request builder
  - backend validation
- Notes:

### REQ-020
- Title: Navigation preserves context
- Priority: medium
- Description: Back and continue navigation must preserve user-entered game, zone, card, and enrichment context.
- Acceptance Criteria:
  - every setup/collection/enrichment step has Back and Continue where applicable
  - moving back from zone collection to zone confirmation does not delete cards
  - changing turn phase adds newly assumed zones to the checklist
  - changing turn phase does not wipe existing cards or enrichment
- Constraints:
  - avoid hidden destructive state changes during live gameplay entry
- Dependencies:
  - frontend staged flow
- Notes:

### REQ-021
- Title: Context targets
- Priority: medium
- Description: Prompt-facing card enrichment must use `ContextTarget` for player, card, none, and freeform targets.
- Acceptance Criteria:
  - player targets include `targetPlayer`
  - card targets include `zone`, `cardId`, and `cardName`
  - none targets use `{ kind: "none" }`
  - other targets include `targetDescription`
  - target picker can reference players and collected zone cards
- Constraints:
  - public API must not expose legacy `StackTarget`
- Dependencies:
  - enrichment UI
  - backend prompt context normalization
- Notes:
