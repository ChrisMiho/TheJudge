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
- Description: The app must provide a freeform question field submitted with the stack.
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
- Description: The app must submit ordered stack data, final question, and captured contextual inputs to the backend through the main action button.
- Acceptance Criteria:
  - action button label is **Decrypt Stack**
  - clicking the button sends ordered stack, final question, and structured context payload fields
  - if stack is empty, request is not sent
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
  - stack is preserved
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
- Title: Pre-stack game context capture
- Priority: high
- Description: Before stack construction begins, the app must collect core game context including player count and life totals.
- Acceptance Criteria:
  - user can set number of players using fixed labels (`Player 1` ... `Player N`)
  - user can enter life totals for each included player label
  - user must confirm context before proceeding to stack construction
  - invalid or missing required values block progression
- Constraints:
  - fixed player labels only (no custom names)
  - support range is constrained by current player-label model
- Dependencies:
  - frontend staged flow
  - prompt context contract
- Notes:
  - this context is prompt-facing, not a rules-engine source of truth

### REQ-016
- Title: Optional battlefield context step with skip
- Priority: medium
- Description: After general game context capture, the app must provide an optional battlefield-context step that users can fill or skip.
- Acceptance Criteria:
  - battlefield step appears after pre-stack game context confirmation
  - user can add/remove relevant battlefield context entries
  - user can explicitly skip when no relevant battlefield context exists
  - continue/skip both lead to stack construction flow
- Constraints:
  - do not force placeholder battlefield entries
  - keep interaction lightweight for live gameplay
- Dependencies:
  - pre-stack game context step
  - prompt context contract
- Notes:
  - battlefield context is intended for stack-relevant board effects, not full board simulation

### REQ-017
- Title: Per-stack mana-spent context with fallback
- Priority: medium
- Description: Each stack entry may include mana spent to cast; when omitted, prompt-facing mana spent defaults to the entry's mana value.
- Acceptance Criteria:
  - user can optionally enter mana-spent context per stack entry
  - backend prompt context always emits deterministic mana-spent value per stack entry
  - omitted user input falls back to `manaValue`
  - prompt/mock output includes mana-spent context in stable formatting
- Constraints:
  - do not implement comprehensive mana-source legality checks
- Dependencies:
  - stack-entry data model
  - backend prompt context builder
- Notes:
  - X-spell clarity is a primary motivation for this field
