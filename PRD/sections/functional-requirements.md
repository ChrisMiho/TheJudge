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
  - user can optionally enter context notes per card; stack item `contextNotes` UI uses placeholder copy that names transient card-level annotations: kicker or buyback paid, X value used, counters added this turn, tapped status, gained abilities this turn
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
- Description: Every backend AI prompt must include a curated library of verbatim WotC Comprehensive Rules excerpts as reference context, selected by card-agnostic game-state signals for the baseline and by card/question-driven relevance scoring for supplemental rules, without changing the product API or UI.
- Acceptance Criteria:
  - committed artifact `apps/backend/data/gameRulesByTopic.json` loads at backend startup
  - every assembled prompt includes `GAME RULES (reference)` with curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) in stable `id` order when the artifact is present
  - excerpts are verbatim WotC CR prose for rule numbers listed in `apps/backend/data/gameRulesTopicManifest.json`
  - section appears after populated zone sections and before `OFFICIAL RULINGS`, then `SCOPE` and `QUESTION`
  - section includes a disclaimer that rules are shared vocabulary and do not override submitted game state
  - section omitted only when artifact missing or empty, with a warning logged
  - `MAX_PROMPT_CHAR_BUDGET` is set to `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) per DEC-042 amendment to DEC-030; prompt diagnostics continue to track prompt size and utilization
  - `npm run data:build` runs `build-game-rules.mjs` with graceful degradation when CR source or extracts are unavailable
  - `npm run data:refresh` attempts WotC CR download alongside Scryfall refresh with graceful skip when unavailable
  - eval fixtures assert conditional System 2 topic selection per scenario (see REQ-032)
  - manual latency sampling (p50/p95) is recorded after integration against the NFR-002 product risk
  - committed artifact `apps/backend/data/gameRulesRuleIndex.json` loads at backend startup alongside the topic artifact
  - every assembled prompt may include an `ADDITIONAL RELEVANT RULE EXCERPTS` section with up to 5 rules scored per DEC-046 against the request context
  - supplemental rules are excluded from the curated baseline set (deduplicated against selected System 2 topic rule numbers)
  - supplemental section appears after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
  - supplemental section omitted when index missing, empty, or no rules score above 0
  - eval fixtures assert labeled supplemental recall per REQ-032
- Constraints:
  - prompt-only and backend-only; no `AskAiRequest`, Zod schema, or frontend changes
  - no paraphrased rule text
  - no runtime CR or Scryfall fetch per request
  - System 2 selection uses only card-agnostic game-state signals (`turnPhase`, `combatStep`, populated zones); no card names, oracle text, or keywords
  - System 3 owns all card/question-driven retrieval including oracle-keyword signals
- Dependencies:
  - DEC-045
  - DEC-046
  - REQ-032
- Notes:
  - supersedes REQ-022 acceptance criteria that required all curated topics on every request

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
- Description: After a successful Decrypt Stack, the enrichment step must replace the submit form with a compact answered-state layout, a read-only frozen context summary, and a conversation thread whose first visible message is the assistant's initial answer.
- Acceptance Criteria:
  - on first decrypt success, the submit form and Decrypt Stack button are hidden
  - answered-state header shows only **TheJudge** and omits redundant subtitle or conversation-heading copy
  - compact read-only frozen context summary appears above the conversation thread
  - compact summary highlights turn phase, active player when known, and populated zones with card names
  - summary includes a disclosure arrow/control that expands to show the full frozen game context, including setup, zones, cards, and enrichment details
  - expanded frozen context remains read-only and does not allow zone, card, or enrichment edits
  - a scrollable conversation thread is shown; first visible bubble is the assistant's answer
  - the initial user question is not shown in the thread
  - start over button is visible and enabled while no request is in flight
- Constraints:
  - thread opens with the assistant answer only; do not show the initial user question as a visible bubble
  - layout changes must not change request payloads, prompt assembly, answer rendering, or conversation-history behavior
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
  - history chars budget is capped at `MAX_CONVERSATION_HISTORY_CHARS` (`EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` per DEC-042 amendment; revisit after latency/cost sampling); oldest turns truncated first
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

### REQ-031
- Title: Global game-state notes
- Priority: medium
- Description: The app must accept an optional freeform game-state notes field on `GameContext` for cross-card, transient context not inferrable from submitted card oracle text — including active replacement effects, priority holder during stack resolution, pending delayed triggered abilities, and casting restrictions.
- Acceptance Criteria:
  - `GameContext` includes optional `gameStateNotes?: string`
  - backend Zod schema validates `gameStateNotes` when present: trimmed, same control-character guardrails as `question`, capped at 2000 characters; blank/whitespace is accepted and omitted by normalization rather than rejected
  - backend prompt emits `ADDITIONAL GAME STATE` section containing `gameStateNotes` content, positioned after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE`
  - section is omitted entirely when `gameStateNotes` is absent or blank after trim
  - UI surface is a collapsible dropdown within the context collection step; collapsed by default; expanding reveals an optional text area for `gameStateNotes` with placeholder copy that names example use cases: active replacement or continuous effects, who has priority, pending delayed triggers, casting restrictions
  - `POST /api/ask-ai` request and success/error response shapes otherwise unchanged
- Constraints:
  - no structured sub-fields per category; field is freeform
  - capped at 2000 characters; control-character guardrails
  - prompt-facing only; no rules-validation behavior under this field
- Dependencies:
  - DEC-043
  - GameContext model
- Notes:

### REQ-032
- Title: Game rules retrieval relevance measurement
- Priority: high
- Description: The eval harness must verify that System 2 conditional topic selection and System 3 supplemental rule retrieval pull the right rules for representative scenarios, using labeled expected outcomes rather than structural checks alone.
- Acceptance Criteria:
  - eval fixtures may include an `expected` block with `expectedSystem2TopicIds`, `expectedSupplementalRuleIds`, and optional `forbiddenSupplementalRuleIds`
  - harness check `system2-conditional-selection` passes when selected curated topics match `expectedSystem2TopicIds` for fixtures that define them
  - harness check `system3-expected-recall` passes when every `expectedSupplementalRuleIds` entry appears in System 3 top-5 retrieval results
  - harness check `system3-noise-excluded` passes when no `forbiddenSupplementalRuleIds` entry appears in System 3 top-5
  - scenario fixtures cover the signal taxonomy: stack-resolution (e.g. counterspell), combat-damage/deathtouch, upkeep-trigger, keyword interaction (extend `cascade-keyword`), out-of-manifest SBA (extend `state-based-actions`)
  - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics selected, System 3 top-5 with scores, recall hit/miss); may be a script output or harness report artifact
  - existing structural checks (section presence, ordering, budget) remain unchanged
  - `npm run test:eval` remains the automated regression gate
- Constraints:
  - no live AI provider calls in relevance checks
  - expected rule IDs are human-labeled ground truth, not inferred from current scorer output
  - do not assert full prompt golden text for relevance scenarios unless structural sections change intentionally
- Dependencies:
  - DEC-047
  - REQ-022
- Notes:
  - replaces reliance on manual multi-file `prompt:preview` review as the sole relevance verification path

### REQ-033
- Title: Live response-size diagnostic logs
- Priority: medium
- Description: The backend must log lightweight size statistics for successful live LLM answers without changing prompt construction, frontend behavior, or the `POST /api/ask-ai` success response contract.
- Acceptance Criteria:
  - after a successful provider invocation, backend lifecycle logs include `correlationId`, `providerElapsedMs`, `answerChars`, `estimatedAnswerTokens`, and `charsPerTokenEstimate`
  - `answerChars` is computed from the final `answer` string returned by the provider boundary after trimming/extraction and before the API response is sent
  - `estimatedAnswerTokens` uses the same 4-characters-per-token estimate convention as existing mock prompt stats
  - OpenAI/live provider success responses remain `{ answer }` only; no live `context`, `diagnostics`, `enrichmentDebug`, or response-size sidecar is returned
  - response-size stats are not appended to the prompt, the answer text, frontend UI, or follow-up `conversationHistory`
  - tests assert both the emitted log fields and the unchanged live-provider response body shape
- Constraints:
  - debug/log-only; no frontend UI changes
  - do not depend on provider-native usage metadata
  - do not change `AskAiRequest`, prompt assembly, or eval prompt goldens for this work
- Dependencies:
  - DEC-049
  - DEC-020
  - DEC-033
  - backend lifecycle logging
- Notes:
  - mock prompt-size stats remain unchanged; this requirement adds comparable visibility for live answer size

### REQ-034
- Title: On-device card identification core (parity-critical)
- Priority: high
- Description: Port the Cardomancer art-identification core to TypeScript as a single authoritative module that, given a canonical 745×1040 card image, returns a ranked candidate list, fully on-device with no network calls.
- Acceptance Criteria:
  - implements the binary `cardhashes.bin` reader, query-only auto-levels (per-channel black-point stretch), Region A crop `(30,105,715,520)`, the canonical per-channel DCT perceptual hash (64×64 resize → DCT-II → top-left 16×16 → median including DC → `>median` row-major → 32 bytes MSB-first per channel), both-orientation (0°/180°) matching, mean R/G/B Hamming distance on a 0..256 scale, match threshold 120, card-back rejection threshold 100, and `__back` suffix stripping
  - exposes the resize + hash "recipe" as a reusable export consumed by the library builder (REQ-035)
  - golden-vector parity tests run under `npm test` (Vitest) and pass: DB load (ids/count/byte lengths), pHash byte-for-byte, auto-levels pixel-for-pixel, end-to-end identify (candidate order, ids, distances, `matched`, `was_rotated`)
  - golden vectors are regenerated from this module's recipe (DEC-051) and committed as the regression fixtures
- Constraints:
  - no network calls and no camera dependency in this core or its tests
  - byte-exact pHash behavior is the gate; if vectors fail, the resize/DCT/median/packing convention is wrong and must be fixed before proceeding
  - the recipe must have a single authoritative definition imported by both scanner and builder (no FE↔build duplication)
- Dependencies:
  - DEC-051
  - DEC-053
- Notes:
  - algorithm/constants/parity gotchas: `PRD/work/cardomancer-card-detection-summary/SOURCE-ANALYSIS.md` and the friend's `SPEC.md`

### REQ-035
- Title: TheJudge-owned fingerprint library build and lazy load
- Priority: high
- Description: Add a build step that generates the fingerprint library (`cardhashes.bin`) plus a manifest from Scryfall card images using the same TypeScript recipe as REQ-034, and have the frontend lazy-load it only when scanning is first used.
- Acceptance Criteria:
  - a build script (alongside `data:build` / `data:refresh`) emits a versioned `cardhashes.bin` + manifest from local card images, excluding non-gameplay layouts (art_series, planar, scheme, vanguard, oversized, memorabilia "Card" types, substitute/checklist, minigame) and including a `_card_back` reference entry
  - the emitted library round-trips byte-identical through the REQ-034 TS DB reader
  - library + bridge artifacts ship under `apps/frontend/public/data/` and are lazy-loaded only on first scan; app startup is unaffected for users who never scan
  - card-image download required for the build is gated behind explicit human approval before the command runs (same policy as Scryfall/CR refresh)
- Constraints:
  - the build hashes with the same authoritative recipe as the on-device scanner (DEC-051)
  - no runtime network fetch of card images or the library; no runtime metadata/library sync
  - raw downloaded images are gitignored and not committed
- Dependencies:
  - REQ-034
  - DEC-051
  - data pipeline (`scripts/`)
- Notes:
  - re-run on each new Scryfall release to keep the library current; the on-device app only ever reads the committed artifact

### REQ-036
- Title: Scan-to-metadata candidate resolver
- Priority: high
- Description: Resolve ranked engine candidates (Scryfall printing ids) into existing `CardMetadataItem` records so scan results feed the picker exactly like typed suggestions.
- Acceptance Criteria:
  - a build-time printing-id → oracle-id bridge artifact maps each candidate to an oracle id, then to a committed `CardMetadataItem` (keyed by `cardId`)
  - duplicate oracle ids collapse to a single candidate keyed by best (lowest) distance
  - candidates that do not resolve to committed metadata are dropped without breaking the picker
  - returns ranked `CardMetadataItem` candidates to the scan UI; no backend route or request-schema change is introduced
- Constraints:
  - identity resolution makes no runtime network call (static committed bridge artifact)
  - printing-level identity is not pushed into `ZoneCardItem`, prompt context, or rulings lookup
- Dependencies:
  - REQ-034
  - DEC-053
- Notes:
  - the bridge artifact follows the committed `cardMetadata.json` static pattern

### REQ-037
- Title: Camera capture and card detector
- Priority: high
- Description: Add a camera capture surface that locates a single card in the live frame, perspective-warps it to the canonical 745×1040 image, and feeds the identification core, supporting continuous auto-scan and manual tap capture.
- Acceptance Criteria:
  - live camera preview with a card-shaped guide overlay; continuous auto-scan plus an always-available manual tap-to-capture (DEC-052)
  - the detector finds the card quad and warps it to a usable canonical image for representative real mobile captures
  - identification top-1 after warp is plausible on a representative capture set; a measured detect-rate / top-1 accuracy result is recorded
  - card-back and no-match states are handled with no backend call
- Constraints:
  - detector area fractions and capture/confidence thresholds are tuned and validated by outcome, not bit-equality (calibration constants, not product open questions)
  - single card per frame; no multi-card detection
  - continuous scanning degrades gracefully (throttle/drop frames) rather than freezing the UI (NFR-010)
- Dependencies:
  - REQ-034
  - DEC-052
- Notes:
  - first implementation may land manual tap-capture before continuous auto-scan

### REQ-038
- Title: Scan UX integrated into the zone card picker
- Priority: high
- Description: Add a Scan entry point beside the existing search input in `ZoneCardPicker` and implement the batch scan loop and unhappy-path handling, reusing the existing add flow unchanged.
- Acceptance Criteria:
  - a Scan entry point sits beside the existing search input; manual search remains unchanged
  - batch loop: scan → Accept (adds via existing add path) → camera re-opens for the next card → Back/Exit returns to zone collection; the zone's existing card list shows the running count
  - card back shows "Flip the card over"; after a few consecutive low-confidence attempts a non-blocking prompt offers manual name entry while auto-scan continues
  - an accepted scan candidate reaches the existing preview/add/owner/duplicate-block/stack-limit behavior and produces the same `ZoneCardItem` shape as a manually added card
  - stack cards land in scan order (bottom-to-top); manual reorder remains out of scope (`FLOW-002`)
  - existing zone-collection tests are extended, not replaced
- Constraints:
  - reuse the existing add path; do not duplicate owner/duplicate-block/stack-limit logic
  - no backend/API/prompt change
- Dependencies:
  - REQ-036
  - REQ-037
  - DEC-052
- Notes:
  - performance budgets (NFR-010) are measured during this phase

### REQ-039
- Title: Resumable, budget-bounded fingerprint-library build (default), with non-destructive fresh rebuild
- Priority: medium
- Description: Make `scripts/build-card-hashes.mjs` resumable by default: the no-flag run uses the existing (or in-progress partial) `cardhashes.bin` as the record of already-fingerprinted entries, downloads only missing card images to a transient temp path, hashes them with the shared `recipe.ts`, deletes each image immediately, and rewrites the bin + manifest — so the full gameplay-card corpus can be fingerprinted across many short, bounded, resumable runs without retaining the full image corpus. A from-scratch rebuild is opt-in via `--fresh` and is non-destructive: it writes a new file and never deletes or overwrites the live bin.
- Acceptance Criteria:
  - the default (no-flag) run diffs the filtered Scryfall printing ids (same `shouldIncludeScanPrinting` filter) against the existing/partial bin and downloads only missing entries to a transient temp path that is deleted per image immediately after hashing; a cold start with no existing bin runs against an empty diff with no special flag
  - hashing uses the existing shared `cropRegionA` + `phashRegionPacked` recipe (no second resize/hash implementation); the emitted bin still round-trips byte-identical through `readDb` (REQ-034 / DEC-051 parity preserved)
  - `--fresh` builds from scratch ignoring the existing bin and writes to a separate new output file (default a sibling such as `cardhashes.fresh.bin` + matching manifest); it does not delete or overwrite the live `cardhashes.bin` and refuses to clobber an existing target unless explicitly directed (`--output <path>` and/or `--force`)
  - every bin/manifest write (default checkpoint and `--fresh`) is atomic (temp file then rename) so a killed or interrupted run cannot corrupt or truncate the live bin
  - `--limit N` and `--max-minutes M` are both optional and may be used independently or together; with both set the run stops at whichever ceiling is reached first; with neither set the run continues to completion; a budget stop finishes the in-flight entry, then checkpoints before exit
  - a valid partial bin + manifest is checkpointed every K newly hashed entries and on every clean budget-stop; a re-run resumes losslessly by diffing against the partial; entries are processed in a stable id order
  - per-image downloads are paced for Scryfall politeness (fixed inter-request delay, ~50–100ms Scryfall guideline, `--rate-ms` override) with bounded retry-and-backoff on `429`/`5xx`/network errors honoring `Retry-After`
  - a per-image download/hash failure logs and skips without aborting the run; the entry stays missing and is retried next run; only permanent failures (`404`, decode/dimension) count toward parking while transient failures (`429`/`5xx`/network, retries exhausted) do not; a sidecar skip-list (`apps/frontend/public/data/cardhashSkiplist.json`) tracks attempt counts and parks an entry after N attempts; `--retry-parked` re-includes parked entries
  - merge is append-only (no pruning); an unsupported bin version is rejected before any rewrite; `<id>`, `<id>__back`, and `_card_back` are treated as distinct entry ids
  - npm alias `data:scan-fingerprints` runs the default resumable build and prints a labeled progress readout (total target, already fingerprinted, done this run, remaining, parked, rough ETA) at start and end; `data:scan-fingerprints:fresh` runs the non-destructive `--fresh` rebuild; the prior `data:scan-hashes` alias is reconciled (repointed or retired)
  - run documentation exists in the root `README.md` and the script `--help`: it states that the default (via `data:scan-fingerprints`) resumes and extends the existing bin and is the normal day-to-day path, that `--fresh` rebuilds into a new file without touching the live bin, and explains the budget flags, resume/checkpoint and atomic-write safety, skip-list/parking with `--retry-parked`, and the human-approval network posture
- Constraints:
  - the transient download path must never be the retained image cache dir
  - `--fresh` must never delete or overwrite the live `cardhashes.bin` implicitly
  - no change to the shipped artifact format/size (`CARDHSH1` v1, ~14 MB), the runtime scanner, `loadHashDb.ts`, `recipe.ts`, the `dbformat.ts` round-trip, or DEC-051 parity
  - every run downloads images and therefore requires explicit human approval = the operator running the command; no scheduled/automated/CI refresh is added
  - per-image downloads must be paced and back off on `429`/`5xx` (honoring `Retry-After`) so a long multi-thousand-image run does not overload Scryfall or get the operator rate-limited; downloads are sequential (no added concurrency)
  - checkpoint cadence K, parking-attempt threshold N, and the rate-limit pace are outcome-validated calibration constants, not product open questions
- Dependencies:
  - REQ-035
  - DEC-051
  - DEC-054
- Notes:
  - a future recipe/geometry change still forces a full re-download/re-hash
  - this realizes the `cardhashes.bin` production build deferred in `cardomancer-card-detection-summary` Slice B
