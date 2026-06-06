# user-flows.md

### FLOW-001
- Name: Capture game context, zones, and ask a question
- Trigger: User opens the app to understand an MTG rules or interaction question
- Preconditions:
  - app is loaded
  - local metadata is available
- Main Flow:
  1. Game setup: user sets player count (expandable panel for per-player display name and life), active player when known, and turn phase via dropdown; turn phase is required and defaults to **main_1**. Active player and downstream player selects show display names as `Player N (Name)` when set.
  2. Zone confirmation: app preselects likely zones from the turn phase; user adjusts the checklist; at least one zone is required to continue.
  3. Per-zone collection: for each selected zone, user may add card identities from local search; non-stack cards capture owner; stack cards are ordered bottom-to-top.
  4. Enrichment: default card-by-card wizard (OK advances); optional **View all cards** for full-list edit; user may add caster, targets, notes, and mana spent where relevant.
  5. Submit: user enters an optional question, clicks **Decrypt Stack**, and the frontend sends `question` plus `gameContext` to the backend.
  6. Backend builds the prompt and returns a plain-text answer.
  7. Frontend displays the answer.
- Edge Cases:
  - if game-context values are missing/invalid, continue action is blocked
  - if zone confirmation has zero zones selected, continue action is blocked
  - if a selected zone has no cards, omit that zone key from `gameContext.zones`
  - if no selected zone contains at least one card, continue/submit is blocked until the user adds a card to a selected zone
  - if no matches are found, show **No matching card found**
  - if the question is blank after trimming, use a zone-aware fallback: **Resolve the stack** when the stack zone has cards; otherwise **Explain the interaction with the provided game state** when another selected zone has cards
  - if stack is selected but has no cards and another selected zone has cards, submit remains allowed; enrichment shows what will be sent before decrypting
  - if a display name is empty, whitespace-only, or matches the fixed player label, treat it as unset
  - if the stack has 10 cards, block additional adds
  - if the user changes phase after selecting zones, newly assumed zones are added and existing cards/enrichment are preserved
- Notes:
  - this is the primary core product flow with staged context capture

### FLOW-002
- Name: Inspect and remove cards from selected zones
- Trigger: User reviews cards while collecting zone context
- Preconditions:
  - at least one selected zone has a card
- Main Flow:
  1. User opens or views a selected zone's card list.
  2. App lists cards for that zone.
  3. Stack-zone cards are shown from bottom to top.
  4. Each row shows card name, optional small thumbnail, and remove button.
  5. User removes one or more cards.
  6. Zone card count updates.
- Edge Cases:
  - if a thumbnail does not load, continue to show the row without it
  - if the last card is removed from a zone, that zone remains selected but is omitted from the request payload
- Notes:
  - manual reorder is out of scope for the core product

### FLOW-003
- Name: Handle failed AI request
- Trigger: Backend request fails
- Preconditions:
  - user has submitted a valid `gameContext` and question
- Main Flow:
  1. Backend returns an error payload.
  2. Frontend shows the message **Miho is working on it**.
  3. Frontend keeps the existing game context, zone cards, enrichment, and question intact.
  4. Frontend keeps the previous successful response visible until a new one succeeds.
  5. Frontend shows a retry button.
  6. Retry button is placed on a 13-second cooldown.
- Edge Cases:
  - repeated failures should not wipe user-entered state
- Notes:
  - this flow is important for live table usability

### FLOW-004
- Name: Block duplicate stack card add
- Trigger: User attempts to add a card already present in the stack
- Preconditions:
  - the card is already in the stack
- Main Flow:
  1. User selects a card already present in the stack.
  2. User attempts to add it.
  3. UI blocks the add.
  4. UI shows a message that duplicate cards are not supported yet.
- Edge Cases:
  - this may reject some real gameplay scenarios
- Notes:
  - this is an intentional constraint only

### FLOW-005
- Name: Post-decrypt follow-up chat
- Trigger: User wants to clarify, question, or correct the assistant after a successful Decrypt Stack
- Preconditions:
  - first decrypt has succeeded and the conversation thread is showing
- Main Flow:
  1. User reads the assistant's answer in the conversation thread.
  2. User types a follow-up in the chat composer (up to 300 characters) and clicks Send.
  3. Send button shows an inline processing animation; button is disabled.
  4. Frontend sends `{ question: followUpText, gameContext: frozen, conversationHistory: fullPriorExchange }` to `POST /api/ask-ai`.
  5. Backend inserts `CONVERSATION HISTORY` before `QUESTION` in the prompt and returns a plain-text answer.
  6. User bubble and then assistant bubble are appended to the thread.
  7. Send button is restored; user can send another follow-up.
- Edge Cases:
  - if the follow-up request fails, the error is shown and a retry button is presented; retry resubmits the failed follow-up with the same frozen context and history
  - if the user clicks start over, the conversation thread is cleared, enrichment editing is unfrozen, previously entered context is preserved, and the pre-decrypt enrichment state is restored
  - start over is not available while a request is in flight
  - if history chars exceed `MAX_CONVERSATION_HISTORY_CHARS` (6000), oldest turns are truncated before the prompt is assembled
- Notes:
  - game context, zones, cards, and enrichment are frozen for the duration of the conversation; follow-ups are text-only in v1
  - the initial user question (including fallback) is included in `conversationHistory` sent to the API but is not shown as a visible bubble in the thread
