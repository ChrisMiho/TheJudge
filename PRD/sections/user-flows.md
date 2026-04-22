# user-flows.md

### FLOW-001
- Name: Build stack and ask a question
- Trigger: User opens the app to understand a stack interaction
- Preconditions:
  - app is loaded
  - local metadata is available
- Main Flow:
  1. User sees home-screen game context capture.
  2. User sets player count and life totals for included player labels.
  3. User confirms game context to proceed.
  4. App presents optional battlefield-context step.
  5. User either adds relevant battlefield context entries or clicks skip.
  6. App shows stack-building screen with card search input.
  7. Before the user types, the search box says **Type to begin**.
  8. User types at least 3 characters into the search box.
  9. App shows autocomplete suggestions from local metadata.
  10. User taps a suggestion.
  11. App shows a card preview.
  12. User optionally sets stack-entry context (caster/targets/notes/mana spent).
  13. User clicks the add button.
  14. If `stack.length === 0`, the add button text is **Begin stackening!**
  15. If `stack.length > 0`, the add button text is **Add to Stack**
  16. App shows a brief success message such as **Stacked**
  17. Card is appended to the stack array and becomes the top of the stack.
  18. User repeats until the stack is complete.
  19. User optionally enters a question.
  20. User clicks **Decrypt Stack**
  21. Frontend sends ordered stack, final question, and captured context to backend.
  22. Backend builds the prompt and returns a plain-text answer.
  23. Frontend displays the answer.
- Edge Cases:
  - if game-context values are missing/invalid, continue action is blocked
  - if battlefield context is not relevant, user can explicitly skip step
  - if no matches are found, show **No matching card found**
  - if the question is blank after trimming, use the fallback question **Resolve the stack**
  - if the stack is empty, do not send the request
  - if the stack has 10 cards, block additional adds
- Notes:
  - this is the primary MVP1 flow with staged context capture

### FLOW-002
- Name: Inspect and remove cards from stack
- Trigger: User taps the stack icon
- Preconditions:
  - at least one card is in the stack
- Main Flow:
  1. User taps the stack icon.
  2. App opens a box, panel, or modal.
  3. App lists cards from bottom to top.
  4. Each row shows card name, optional small thumbnail, and remove button.
  5. User removes one or more cards.
  6. Stack count updates.
- Edge Cases:
  - if a thumbnail does not load, continue to show the row without it
  - if the last card is removed, the stack becomes empty
- Notes:
  - manual reorder is out of scope for MVP1

### FLOW-003
- Name: Handle failed AI request
- Trigger: Backend request fails
- Preconditions:
  - user has submitted a valid stack
- Main Flow:
  1. Backend returns an error payload.
  2. Frontend shows the message **Miho is working on it**.
  3. Frontend keeps the existing stack and question intact.
  4. Frontend keeps the previous successful response visible until a new one succeeds.
  5. Frontend shows a retry button.
  6. Retry button is placed on a 13-second cooldown.
- Edge Cases:
  - repeated failures should not wipe user-entered state
- Notes:
  - this flow is important for live table usability

### FLOW-004
- Name: Block duplicate card add in MVP1
- Trigger: User attempts to add a card already present in the stack
- Preconditions:
  - the card is already in the stack
- Main Flow:
  1. User selects a card already present in the stack.
  2. User attempts to add it.
  3. UI blocks the add.
  4. UI shows a message that duplicate cards are not supported in MVP1.
- Edge Cases:
  - this may reject some real gameplay scenarios
- Notes:
  - this is an MVP1 flow simplification only
