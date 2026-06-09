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
- Description: The app must show a preview of the selected card before it can be added to a selected zone.
- Acceptance Criteria:
  - selecting a suggestion shows card preview
  - preview includes enough information to confirm the card
  - add action is separate from suggestion selection
- Constraints:
  - preview should remain simple in the core product
- Dependencies:
  - image URL and oracle text data
- Notes:

### REQ-004
- Title: Add button labeling rule
- Priority: medium
- Description: The stack add button text must vary based on whether the stack is empty.
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
- Description: The app must allow users to add selected cards to the stack zone.
- Acceptance Criteria:
  - clicking add appends the card to the end of the stack array
  - appended card becomes the top of the stack
  - app shows brief success state such as **Stacked**
- Constraints:
  - stack is append-only in the core product
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
  - keep visual treatment simple in the core product
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
  - no manual reordering in the core product
- Dependencies:
  - stack state
- Notes:

### REQ-009
- Title: Block duplicate stack cards
- Priority: medium
- Description: The core product must block duplicate cards from being added to the stack.
- Acceptance Criteria:
  - if a selected card already exists in the stack, add is blocked
  - UI shows a message that duplicates are not supported yet
- Constraints:
  - this is temporary and only for flow validation
- Dependencies:
  - stack state
- Notes:
  - not a long-term gameplay rule

### REQ-010
- Title: Enforce stack size limit
- Priority: medium
- Description: The core product must cap the stack at 10 cards.
- Acceptance Criteria:
  - app blocks adding an 11th card
  - UI explains that the stack limit has been reached
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
  - blank trimmed question uses a zone-aware fallback: **Resolve the stack** when the stack zone has cards; otherwise **Explain the interaction with the provided game state** when another selected zone has cards
- Constraints:
  - fallback is request/prompt logic and may be shown as an informational pre-submit hint
- Dependencies:
  - submit flow
- Notes:
  - question is optional in the core product

### REQ-012
- Title: Decrypt Stack submit action
- Priority: high
- Description: The app must submit the final question and captured `gameContext` to the backend through the main action button.
- Acceptance Criteria:
  - action button label is **Decrypt Stack**
  - clicking the button sends `question` and `gameContext`
  - no top-level `stack` or `battlefieldContext` is sent
  - submit is allowed only when at least one selected zone has a card
  - blank trimmed question uses the zone-aware fallback in request/prompt logic
- Constraints:
  - one main product-facing endpoint in the core product
- Dependencies:
  - backend API
- Notes:

### REQ-013
- Title: Plain-text AI response
- Priority: high
- Description: The core product must display the AI response as plain text.
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
  - user must select one turn phase from `untap`, `upkeep`, `draw`, `main_1`, `combat`, `main_2`, `end_step`, `cleanup`
  - when turn phase is `combat`, an inline sub-step selector offers `beginning_of_combat`, `declare_attackers`, `declare_blockers`, `combat_damage`, and `end_of_combat`
  - combat sub-step defaults to `declare_blockers` when `combat` is selected
  - submitted `combatStep` value is the selected `CombatStep` string when turn phase is `combat`; field is omitted otherwise
  - user must confirm context before proceeding to zone confirmation
  - invalid or missing required values block progression
- Constraints:
  - fixed `PlayerLabel` identity with optional display names for UI labels and prompt text
  - support range is constrained by current player-label model
  - combat sub-step is captured as a structured field; the user's question may still add further detail
- Dependencies:
  - frontend staged flow
  - prompt context contract
- Notes:
  - this context is prompt-facing, not a rules-engine source of truth
  - see DEC-034 for phase enum change, DEC-037 for combat sub-step

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
  - per-phase 2-zone defaults are defined in DEC-035; empty defaulted zones are excluded from the payload and LLM context per DEC-024 and DEC-035

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

### REQ-022
- Title: General game rules prompt enrichment
- Priority: high
- Description: Every backend AI prompt must include a curated library of verbatim WotC Comprehensive Rules excerpts as reference context, without changing the product API or UI.
- Acceptance Criteria:
  - committed artifact `apps/backend/data/gameRulesByTopic.json` loads at backend startup
  - every assembled prompt includes `GAME RULES (reference)` with all curated topics in stable `id` order when the artifact is present
  - excerpts are verbatim WotC CR prose for rule numbers listed in `apps/backend/data/gameRulesTopicManifest.json`
  - section appears after populated zone sections and before `OFFICIAL RULINGS`, then `SCOPE` and `QUESTION`
  - section includes a disclaimer that rules are shared vocabulary and do not override submitted game state
  - section omitted only when artifact missing or empty, with a warning logged
  - `MAX_PROMPT_CHAR_BUDGET` is set to `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) per DEC-042 amendment to DEC-030; prompt diagnostics continue to track prompt size and utilization
  - `npm run data:build` runs `build-game-rules.mjs` with graceful degradation when CR source or extracts are unavailable
  - `npm run data:refresh` attempts WotC CR download alongside Scryfall refresh with graceful skip when unavailable
  - eval fixtures assert the full game-rules block and remain under the prompt budget
  - manual latency sampling (p50/p95) is recorded after integration against the NFR-002 product risk
  - committed artifact `apps/backend/data/gameRulesRuleIndex.json` loads at backend startup alongside the topic artifact
  - every assembled prompt may include an `ADDITIONAL RELEVANT RULE EXCERPTS` section with up to 5 rules scored against the request context
  - supplemental rules are excluded from the curated baseline set (deduplicated against `gameRulesTopicManifest.json` rule numbers)
  - supplemental section appears after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
  - supplemental section omitted when index missing, empty, or no rules score above 0
  - eval fixtures `state-based-actions` and `cascade-keyword` assert supplemental retrieval for out-of-manifest rules
- Constraints:
  - prompt-only and backend-only; no `AskAiRequest`, Zod schema, or frontend changes
  - no paraphrased rule text
  - no runtime CR or Scryfall fetch per request

### REQ-023
- Title: Decrypt wait feedback panel
- Priority: medium
- Description: While a decrypt request is in flight, the app must replace the submit form with a dedicated waiting panel showing a live elapsed timer and escalating threshold-based messages.
- Acceptance Criteria:
  - waiting panel replaces the submit form while `isSubmitting` is true
  - card list and wizard context above the form remain visible during the wait
  - elapsed timer increments in real time from the moment of submission
  - displayed message updates at defined second thresholds: 0s, 3s, 8s, 15s, 25s, 40s
  - submit form is restored when a response is received or an error occurs
  - message region uses `aria-live` so screen readers announce updates
- Constraints:
  - CSS-only motion; no animation libraries
  - panel must not block card context above the form
- Dependencies:
  - REQ-012
  - NFR-006
- Notes:
  - approved threshold copy: 0s "Consulting the stack…" (calm), 3s "Priority is passing to the LLM." (calm), 8s "The judge is reading every layer. Twice." (curious), 15s "Still waiting? The servers are scrying 1." (curious), 25s "At this point we're basically in a MUD subgame." (absurd), 40s "If this were F6, we'd have resolved by now." (absurd)

### REQ-024
- Title: Phase-scoped prompt guidance
- Priority: medium
- Description: Every backend AI prompt must include a `PHASE GUIDANCE` block containing phase-specific and combat-sub-step-specific reasoning instructions, positioned between `GENERAL GAME CONTEXT` and the zone sections.
- Acceptance Criteria:
  - every assembled prompt includes a `PHASE GUIDANCE` section between `GENERAL GAME CONTEXT` and the zone sections
  - guidance text is specific to the submitted `turnPhase`
  - when `turnPhase` is `combat`, guidance text is specific to the submitted `combatStep` when present; falls back to generic combat framing when absent
  - section is never omitted for a valid phase submission
  - canonical guidance strings per phase match those specified in DEC-036
- Constraints:
  - prompt-only and backend-only beyond the `combatStep` field additions in DEC-037
  - do not add rules-validation behavior under the label of phase guidance
- Dependencies:
  - DEC-036
  - DEC-037
  - REQ-015
- Notes:

### REQ-025
- Title: Post-decrypt conversation thread
- Priority: high
- Description: After a successful Decrypt Stack, the enrichment step must replace the submit form with a conversation thread whose first visible message is the assistant's initial answer.
- Acceptance Criteria:
  - on first decrypt success, the submit form and Decrypt Stack button are hidden
  - a scrollable conversation thread is shown; first visible bubble is the assistant's answer
  - the initial user question is not shown in the thread
  - a compact read-only context summary (frozen zone counts and card names) is visible but not editable
  - start over button is visible and enabled while no request is in flight
- Constraints:
  - thread opens with the assistant answer only; do not show the initial user question as a visible bubble
- Dependencies:
  - REQ-012
  - DEC-040
- Notes:

### REQ-026
- Title: Follow-up chat composer
- Priority: high
- Description: While a conversation is active, users must be able to submit text follow-ups from a chat composer; each follow-up uses the frozen game context from the initial decrypt.
- Acceptance Criteria:
  - chat composer shows a textarea and a Send button
  - textarea accepts up to 300 characters
  - on follow-up success, a user bubble and then an assistant bubble are appended to the thread
  - mock-provider responses append to the same thread; the chat remains visible after mock responses exactly as it does for live responses
  - frozen game context is used unchanged for all follow-up requests
  - Send button is disabled while a request is in flight
- Constraints:
  - no zone or card editing during an active conversation (v1)
- Dependencies:
  - REQ-025
  - DEC-040
- Notes:

### REQ-027
- Title: Follow-up history assembly and API contract
- Priority: high
- Description: Follow-up requests must include `conversationHistory` containing the full prior exchange; history is assembled client-side from in-memory state.
- Acceptance Criteria:
  - follow-up request payload is `{ question, gameContext: frozen, conversationHistory }`
  - `conversationHistory` includes the hidden initial user question (including fallback) and first assistant answer, then all subsequent user and assistant turns in order
  - current follow-up text goes in `question`, not duplicated in history
  - backend validates `conversationHistory` when present: non-empty array, max 20 turns, max 2000 chars/message, alternating user/assistant roles starting with user, last entry must be assistant
  - backend inserts `CONVERSATION HISTORY` section before `QUESTION` when history is present
  - when `ASK_AI_PROVIDER=mock`, the assistant answer for each follow-up includes the exact assembled LLM-facing prompt that would have been sent for that user message, including `CONVERSATION HISTORY`, frozen `gameContext`, and any phase guidance
  - history chars budget is capped at `MAX_CONVERSATION_HISTORY_CHARS` (6000); oldest turns truncated first
  - history budget contribution is included in `getPromptDiagnostics`
  - no server-side session store; history is discarded on page reload
- Constraints:
  - `conversationHistory` is optional on `AskAiRequest`; first decrypt omits it
  - success and error response shapes unchanged
- Dependencies:
  - DEC-038
  - DEC-039
  - REQ-026
- Notes:

### REQ-028
- Title: Inline follow-up processing animation
- Priority: medium
- Description: While a follow-up request is in flight, the Send button must display an inline processing animation; the full AskAiWaitingPanel must not be shown for follow-up turns.
- Acceptance Criteria:
  - Send button content is replaced with a processing animation (e.g. spinner or animated dots) while a follow-up request is in flight
  - Send button is disabled during the animation
  - animation is removed and button is restored when the response is received or an error occurs
  - `AskAiWaitingPanel` is not rendered for follow-up submits
- Constraints:
  - CSS-only motion consistent with NFR-006; no animation libraries
- Dependencies:
  - DEC-041
  - REQ-023
  - REQ-026
- Notes:

### REQ-029
- Title: Start over from conversation
- Priority: medium
- Description: Users must be able to start over from an active conversation, clearing the thread and unfreezing enrichment editing while preserving all previously entered context.
- Acceptance Criteria:
  - start over button is visible whenever the first decrypt has succeeded and no request is in flight
  - clicking start over clears the conversation thread
  - enrichment editing is unfrozen; all previously entered game context, zones, cards, enrichment, and question are preserved
  - the user is returned to the pre-decrypt enrichment state (submit form and Decrypt Stack button restored)
  - no conversation history is persisted after start over
- Constraints:
  - do not clear or reset game context, zones, cards, or enrichment on start over
- Dependencies:
  - DEC-040
  - REQ-025
- Notes:

### REQ-030
- Title: Prompt assembly includes full card metadata in every populated zone
- Priority: high
- Description: The backend must include full card metadata — including oracle text — for every card in every populated zone section of the assembled LLM prompt, not only stack items.
- Acceptance Criteria:
  - every card in every populated zone section includes `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`, `targets`, and `contextNotes` lines in the assembled prompt
  - empty oracle text after whitespace trim emits `oracleText: (none) — no oracle text recorded for this card`
  - stack section retains stack-specific fields (`stackRole`, `caster`, `manaSpent`)
  - non-stack sections use `owner` and zone item labels (`Hand 1`, `Battlefield 1`, etc.); `caster` is not emitted for non-stack items
  - `buildPromptContext` preserves oracle and full metadata for non-stack zone items
  - eval harness `oracle-text-all-zones` check confirms every populated non-stack card block contains an `oracleText:` line
  - `cardId` and `imageUrl` continue to be omitted from LLM-facing prompt text
- Constraints:
  - prompt-only and backend-only; no `AskAiRequest`, Zod schema, or frontend changes
- Dependencies:
  - DEC-042
