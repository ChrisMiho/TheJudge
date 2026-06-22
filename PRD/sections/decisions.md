# decisions.md

### DEC-001
- Decision: The core product is a flow-validation assistant, not a gameplay-accurate or judge-accurate system.
- Status: confirmed
- Context: Historical MVP1 framing was meant to prove the core user flow without taking on full MTG rules complexity.
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
- Decision: The selected-cards-only capture model is superseded by the approved `GameContext` model.
- Status: superseded
- Context: Historical MVP1 scope collected only selected cards, stack order, and an optional question.
- Impact:
  - context remains narrow
  - some answers will necessarily rely on limited input
- Related requirements:
  - REQ-006
  - REQ-011
  - REQ-012
- Notes:
  - superseded by DEC-019 and DEC-021 for approved structured context additions

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
- Decision: Duplicate stack cards are blocked as an intentional constraint.
- Status: confirmed
- Context: This reduces complexity while validating the basic flow.
- Impact:
  - some real gameplay scenarios are excluded
  - duplicate blocking must be documented as temporary
- Related requirements:
  - REQ-009
- Notes:
  - this decision overrides gameplay realism for current scope control

### DEC-008
- Decision: The stack is capped at 10 cards in the core product.
- Status: confirmed
- Context: This limits prompt size and reduces abuse risk.
- Impact:
  - UI must block additional adds past 10
- Related requirements:
  - REQ-010
- Notes:

### DEC-009
- Decision: Blank questions fall back to **Resolve the stack** in request-building logic.
- Status: superseded
- Context: The question field is optional, but the backend should always receive a final question string.
- Impact:
  - fallback is not shown as injected UI text
- Related requirements:
  - REQ-011
- Notes:
  - superseded by DEC-028 for zone-aware blank-question fallback behavior

### DEC-010
- Decision: The core product uses one main product-facing backend endpoint.
- Status: confirmed
- Context: The backend should remain intentionally small.
- Impact:
  - no separate product-facing endpoints for card lookup, stack creation, or prompt generation
- Related requirements:
  - REQ-012
- Notes:

### DEC-011
- Decision: The old staged provider rollout is superseded by explicit provider modes.
- Status: superseded
- Context: Historical Phase A used mock responses before planned Bedrock integration.
- Impact:
  - frontend flow can be validated with `ASK_AI_PROVIDER=mock`
- Related requirements:
  - REQ-013
  - REQ-014
- Notes:

### DEC-012
- Decision: The core product uses a static prebuilt metadata file committed with the app.
- Status: confirmed
- Context: Runtime metadata syncing would add unnecessary complexity.
- Impact:
  - autocomplete and preview rely on bundled data
- Related requirements:
  - REQ-002
  - REQ-003
- Notes:

### DEC-013
- Decision: The backend must not implement legality validation, deterministic rules simulation, board-state logic, or format enforcement in the core product.
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
- Decision: Mock provider responses should return the outbound request payload as a debug-friendly JSON-formatted string inside the `answer` field.
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
- Decision: Structured context beyond stack/question is approved for flow validation.
- Status: superseded
- Context: Earlier roadmap scope required richer prompt-ready context while still avoiding rules-engine complexity.
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
- Context: The current provider model replaces the earlier mock-only path with a swappable provider boundary while preserving staged UX and request/response shapes.
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
  - supersedes retired provider-stage wording in `sections/integrations-and-data.md` where they conflict
  - route handlers stay contract-focused; provider SDK wiring lives only in provider/factory composition

### DEC-021
- Decision: `GameContext` is the parent model for prompt-facing game state.
- Status: confirmed
- Context: The current staged zone flow replaces separate top-level stack and battlefield payloads with a single structured game-state container.
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
- Status: superseded
- Context: The app needs enough timing context for prompt quality without modeling every Magic sub-step.
- Impact:
  - combat is one combined phase
  - combat sub-step detail belongs in the user's question or notes, not structured fields
  - `stack_resolving` is a distinct timing value for questions asked while the stack is resolving
- Related requirements:
  - REQ-015
- Notes:
  - superseded by DEC-034 which removes `stack_resolving` and by DEC-037 which adds structured `combatStep` capture

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

### DEC-028
- Decision: Blank-question fallback is zone-aware.
- Status: confirmed
- Context: Manual walkthrough on 2026-06-05 showed that default main-phase selected zones can include stack while users may only populate battlefield. The previous unconditional **Resolve the stack** fallback caused the prompt to ask for stack resolution even when no stack cards were submitted.
- Impact:
  - blank trimmed questions use **Resolve the stack** when `gameContext.zones.stack` has one or more cards
  - blank trimmed questions use **Explain the interaction with the provided game state** when stack has no cards and another zone has cards
  - submit remains allowed when stack is selected but empty as long as another selected zone has a card
  - skipped targets do not imply an empty stack; `targets: (none)` means no target was specified for that card
  - enrichment shows a pre-decrypt summary of populated zones and the fallback question when the user leaves the question blank
  - zone collection shows a non-blocking nudge when stack is selected but empty and another selected zone has cards
- Related requirements:
  - REQ-011
  - REQ-012
  - REQ-017
  - REQ-018
  - REQ-019
- Notes:
  - supersedes DEC-009 where it describes an unconditional stack fallback

### DEC-029
- Decision: Published WotC Oracle rulings may enrich backend prompts for submitted cards without changing the product API or UI.
- Status: confirmed
- Context: TheJudge already sends card oracle text and structured game context to the backend prompt. Card-specific WotC rulings can improve grounding for timing, replacement effects, triggered abilities, and card-specific exceptions while preserving the assistant's non-authoritative scope.
- Impact:
  - WotC rulings enrichment is prompt-only and backend-only
  - `POST /api/ask-ai` request and response shapes remain unchanged
  - no frontend rulings UI or product-facing rulings endpoint is added
  - rulings are sourced from Scryfall bulk type `rulings`, filtered to `source === "wotc"`, and intersected with the committed card metadata `cardId` / oracle ID set
  - raw Scryfall rulings bulk data is not committed; the trimmed static backend artifact is `apps/backend/data/cardRulingsByOracleId.json`
  - existing `POST /api/ask-ai` handling looks up rulings during `preparePromptInput`; there is no separate product-facing rulings endpoint
  - prompt text may include `OFFICIAL RULINGS (WotC reference)` after populated zone sections and before `SCOPE`
  - the rulings block is omitted entirely when no submitted card has matching WotC data
  - ruling output is capped by per-card count, per-comment length, and total-section budget so `MAX_PROMPT_CHAR_BUDGET` remains authoritative
  - Scryfall download and refresh workflows require explicit human approval before agents run networked download commands
- Related requirements:
  - REQ-012
  - REQ-013
  - REQ-019
- Notes:
  - this decision does not make the product an official judge or rules engine

### DEC-030
- Decision: Backend prompts include a curated library of verbatim WotC Comprehensive Rules excerpts on every request, without changing the product API or UI.
- Status: confirmed (amended — see Notes)
- Context: Card-specific WotC rulings (DEC-029) do not cover general CR topics such as priority, stack mechanics, layers, and combat keywords. A static committed artifact mirrors the existing card-metadata and rulings pipeline.
- Impact:
  - game-rules enrichment is prompt-only and backend-only
  - `POST /api/ask-ai` request and response shapes remain unchanged
  - no frontend game-rules UI or product-facing rules endpoint is added
  - source is WotC Comprehensive Rules TXT from [magic.wizards.com/en/rules](https://magic.wizards.com/en/rules); Scryfall remains the source for cards and per-card rulings only
  - gitignored source: `apps/backend/data/cr/source.txt`
  - committed topic manifest: `apps/backend/data/gameRulesTopicManifest.json`
  - committed artifact: `apps/backend/data/gameRulesByTopic.json`
  - topic rule numbers and excerpts are curated and human-signed-off during implementation Slice B
  - current scope includes **all** curated topics on every request; no per-request signal-based selection
  - prompt text includes `GAME RULES (reference)` after populated zone sections and before `OFFICIAL RULINGS`, then `SCOPE` and `QUESTION`
  - disclaimer states rules are shared vocabulary and do not override submitted game state, stack order, zones, targets, notes, or card oracle text
  - section omitted only when artifact missing or empty (warning logged)
  - `npm run data:refresh` and `npm run data:build` extend the existing Scryfall pipeline with graceful degradation; agent-run network refresh still requires explicit human approval
  - larger prompts create active product risk against NFR-002; context-driven topic selection is a deferred mitigation path if latency risk materializes
- Related requirements:
  - REQ-012
  - REQ-013
  - REQ-019
  - REQ-022
- Notes:
  - static MTG reference block (DEC-025) remains unchanged
  - this decision does not make the product an official judge or rules engine
  - **Amendment (DEC-042):** `MAX_PROMPT_CHAR_BUDGET` and related truncation/enrichment constants are raised to effectively unlimited test values via a shared `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` constant; all diagnostic and enforcement infrastructure remains; revisit cap values after latency/cost sampling
  - **Superseded in part (DEC-045):** per-request inclusion of all curated topics is replaced by always-on core plus game-state-gated conditional expansion; the "all topics every request" impact bullet above is historical

### DEC-031
- Decision: Decrypt wait UX uses a pure frontend animated panel with CSS-only motion, a live elapsed timer, and threshold-based escalating messages.
- Status: confirmed
- Context: AI responses during decrypt can take several seconds; the submit button going inactive with no feedback creates a perceived hang. A dedicated waiting panel was added to replace the submit form while `isSubmitting` is true.
- Impact:
  - `lib/askAiWaitStages.ts` — threshold config and stage selector (pure TS, no React)
  - `hooks/useElapsedWaitTimer.ts` — setInterval hook returning elapsed seconds and current stage
  - `components/AskAiWaitingPanel.tsx` — timer display with `aria-live` message region and CSS variant classes
  - `index.css` — `.wait-stage-calm`, `.wait-stage-curious`, `.wait-stage-absurd` keyframe classes
  - `components/EnrichmentStep.tsx` — conditionally renders `AskAiWaitingPanel` in place of submit form
  - CSS carve-out under NFR-006 explicitly permits these keyframe animations for functional wait states
- Related requirements:
  - REQ-023
  - NFR-006
- Notes:
  - no animation libraries added; CSS-only constraint satisfied
  - card list and wizard context above the form remain visible during the wait

### DEC-032
- Decision: Backend prompts include up to 5 supplemental WotC Comprehensive Rules excerpts per request, dynamically retrieved from a committed rule index artifact, deduplicated against the curated baseline manifest.
- Status: confirmed
- Context: DEC-030 curated baseline covers 23 topic areas but cannot cover every rule. Questions about state-based actions, obscure keywords, or specific rule numbers reference rules outside the curated manifest. Signal-based retrieval against a pre-built index fills this gap without increasing baseline prompt size for unrelated requests.
- Impact:
  - supplemental retrieval is prompt-only and backend-only; no API or UI changes
  - DEC-030 curated baseline always included; supplemental rules coexist and never replace it
  - max 5 supplemental rules per request; deduplicated against manifest rule numbers so curated rules are never repeated
  - source is same WotC CR TXT and `build-game-rules.mjs` pipeline used for DEC-030
  - committed artifact: `apps/backend/data/gameRulesRuleIndex.json` (built alongside `gameRulesByTopic.json`)
  - `scripts/build-game-rules.mjs` extended with dual-output: topic JSON + rule index JSON
  - scoring: exact rule ID match (100 pts), parent rule ID match (20 pts), dotted-token match (8 pts), keyword token match (1 pt); rules with score 0 excluded
  - section label: `ADDITIONAL RELEVANT RULE EXCERPTS`, positioned after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
  - section omitted when index missing, empty, or no rules score above 0
  - eval harness extended with checklist IDs: `supplemental-rules-section-present`, `supplemental-rules-after-game-rules`, `supplemental-rules-before-rulings`
  - eval fixtures added: `state-based-actions` (704.5g SBA scenario), `cascade-keyword` (cascade + prowess interaction)
- Related requirements:
  - REQ-022
- Notes:
  - supplemental section disclaimer matches DEC-030 curated baseline disclaimer pattern
  - this decision does not make the product an official judge or rules engine
  - **Superseded in part (DEC-046):** flat lexical scoring formula (+1 per shared word, lowest rule-number tie-break) is replaced by IDF-weighted, question-boosted, keyword-boosted scoring per DEC-046; the scoring impact bullet above is historical

### DEC-033
- Decision: The mock provider may return optional debug sidecar fields on `POST /api/ask-ai` success responses; the OpenAI provider and frontend contract remain `{ answer }` only.
- Status: confirmed
- Context: Prompt enrichment review today requires reading the mock `answer` blob or eval goldens that skip the full `/api/ask-ai` path. A local `npm run prompt:preview` workflow needs structured artifacts without new routes or frontend changes.
- Impact:
  - `askAiResponseSchema` accepts optional `context`, `diagnostics`, and `enrichmentDebug` on success responses
  - mock provider populates all sidecars from `preparePromptInput` plus enrichment debug collected only when `ASK_AI_PROVIDER=mock`
  - OpenAI provider continues returning `{ answer }` only
  - frontend reads `answer` only; no UI or request-shape changes
  - `enrichmentDebug` exposes supplemental retrieval scores/runner-ups, curated topic manifest snapshot, and rulings inclusion trace not present in aggregate diagnostics
  - error responses remain the existing `askAiErrorSchema` shape; preview tooling captures them per fixture for frontend-visible error review
  - DEC-020 frozen success contract for live provider is preserved; optional fields are mock-only additions
- Related requirements:
  - NFR-009
  - REQ-012
  - REQ-013
- Notes:
  - do not add `promptText` as a separate response field; parse from the stable `FULL PROMPT (SENT TO PROVIDER)` section in mock `answer`
  - `MAX_PROMPT_CHAR_BUDGET` raised to `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) per DEC-042 amendment to DEC-030

### DEC-034
- Decision: `stack_resolving` is removed from the `TurnPhase` enum; the default turn phase on the game setup screen is `main_1`.
- Status: confirmed
- Context: `stack_resolving` is not a real MTG turn phase; it was a product invention that caused confusion. The stack can be resolving during any phase. `main_1` is the most common phase where players encounter interactions requiring clarification.
- Impact:
  - `TurnPhase` union updated in frontend and backend types to: `untap`, `upkeep`, `draw`, `main_1`, `combat`, `main_2`, `end_step`, `cleanup`
  - `stack_resolving` removed from `TURN_PHASE_OPTIONS` in `App.tsx`
  - `DEFAULT_TURN_PHASE` set to `"main_1"` in `apps/frontend/src/lib/contextFlow/flow.ts`
  - `PHASE_ZONE_DEFAULTS` entry for `stack_resolving` removed from `phaseZoneDefaults.ts`
  - `MTG_PROMPT_REFERENCE` in `apps/backend/src/prompt/mtgReference.ts` updated to remove `stack_resolving` references
- Related requirements:
  - REQ-015
  - REQ-016
- Notes:
  - supersedes DEC-022 where it includes `stack_resolving` in the phase enum

### DEC-035
- Decision: Phase zone defaults are trimmed to 2 zones per phase; empty phase-defaulted zones are excluded from the payload and LLM context.
- Status: confirmed
- Context: Manual testing showed users consistently unchecking more zones than they were adding, indicating defaults were too broad. Tighter defaults reduce friction during live gameplay entry. The empty-zone exclusion rule from DEC-024 applies to all phase-defaulted zones, not only stack.
- Impact:
  - `PHASE_ZONE_DEFAULTS` in `phaseZoneDefaults.ts` updated:
    - untap: `battlefield`, `command`
    - upkeep: `battlefield`, `stack`
    - draw: `library`, `hand`
    - main_1: `battlefield`, `hand`
    - main_2: `battlefield`, `hand`
    - combat: `battlefield`, `stack`
    - end_step: `battlefield`, `hand`
    - cleanup: `battlefield`, `graveyard`
  - `stack_resolving` entry removed (per DEC-034)
  - a defaulted zone with no cards is excluded from the payload and LLM context; the user may still proceed as long as at least one other zone has a card
- Related requirements:
  - REQ-016
- Notes:
  - `untap`, `cleanup` were already 2 zones; `upkeep`, `draw`, `combat` trimmed from 3; `main_1`, `main_2`, `end_step` trimmed from 4

### DEC-036
- Decision: Every backend prompt includes a `PHASE GUIDANCE` block positioned between `GENERAL GAME CONTEXT` and the zone sections, with phase-specific and combat-sub-step-specific reasoning instructions.
- Status: confirmed
- Context: The LLM receives `turnPhase` as a field in `GENERAL GAME CONTEXT` but has no phase-specific reasoning instructions. Phase guidance improves answer quality by directing the model toward the mechanics and timing rules most relevant for the submitted phase.
- Impact:
  - new module `apps/backend/src/prompt/phaseGuidance.ts` maps each `TurnPhase` and optional `CombatStep` to 2–4 sentences of focused guidance
  - `buildPromptText` in `normalization.ts` emits a `PHASE GUIDANCE` block using this module, always present for a valid phase submission
  - combat guidance varies by `combatStep` when present; falls back to generic combat framing when absent
  - canonical guidance strings per phase:
    - `untap`: "This is the untap step. Players do not normally receive priority during untap — the stack should be empty. Focus on replacement effects that modify untapping, effects that prevent permanents from untapping, and phasing."
    - `upkeep`: "This is the upkeep step. Upkeep-triggered abilities fire in APNAP order and are placed on the stack before priority is passed. Focus on which upkeep triggers fired, their stacking order, cumulative upkeep costs, and what responses are available."
    - `draw`: "This is the draw step. The active player draws one card; triggered abilities from drawing then fire. Focus on replacement effects on the draw (the controlling player orders multiple replacement effects), skip-draw effects, and 'whenever a player draws' triggered abilities."
    - `main_1`: "This is the first main phase. Focus on spell timing restrictions (sorceries require an empty stack and the caster's main phase), ETB trigger ordering, and the legendary rule."
    - `main_2`: "This is the second main phase, after combat has concluded. The same spell timing rules apply as in the first main phase. Note that 'until end of turn' effects from combat are still active; they end during cleanup, not here."
    - `combat` + `beginning_of_combat`: "This is the beginning of combat step. Triggered abilities that fire at the beginning of combat are placed on the stack in APNAP order. Attackers have not yet been declared. Players can cast instants and activate abilities."
    - `combat` + `declare_attackers`: "Attackers have been declared. Attack-triggered abilities (exalted, attack triggers on creatures) fire in APNAP order. Players can cast instants and activate abilities in response before blockers are declared."
    - `combat` + `declare_blockers` (default): "Blockers have been declared. Focus on damage assignment order, trample, deathtouch, first strike and double strike, and how combat damage is allocated across multiple blockers. Block-triggered abilities fire in APNAP order."
    - `combat` + `combat_damage`: "Combat damage is being assigned. Focus on first strike vs regular damage steps, lethal damage and deathtouch, trample damage to the defending player, lifelink, and triggered abilities that fire when creatures deal or receive combat damage."
    - `combat` + `end_of_combat`: "This is the end of combat step. 'Until end of combat' effects are still active. Players can cast instants and activate abilities. Triggered abilities that fire at end of combat are placed on the stack in APNAP order."
    - `combat` (no sub-step): "The game is in a combat step. Focus on combat keyword interactions, attack and block triggered abilities in APNAP order, damage assignment, and combat tricks. Specify the combat sub-step in your question if precision matters."
    - `end_step`: "This is the end step. 'At the beginning of your end step' triggered abilities fire in APNAP order. Players can cast instants and activate abilities in response. Note: 'until end of turn' effects have not yet expired — those end during cleanup."
    - `cleanup`: "This is the cleanup step. The active player discards to hand size, damage is removed from all permanents, and 'until end of turn' effects end. Priority is not normally passed during cleanup — but if a triggered ability fires, state-based actions are checked and players receive priority."
- Related requirements:
  - REQ-024
- Notes:
  - `PHASE GUIDANCE` section is always emitted for a valid submitted phase; it is never omitted
  - do not add rules-validation behavior under the label of phase guidance
  - `main_1` and `main_2` guidance shares a base builder in `phaseGuidance.ts`; `main_2` appends a post-combat addendum rather than duplicating the full string — the distinction is meaningful in the game and must be preserved, but the implementation should not duplicate shared logic

### DEC-037
- Decision: `combatStep` is an optional structured field on `GameContext`; a combat sub-step selector appears inline in the frontend when `turnPhase === "combat"` and defaults to `declare_blockers`.
- Status: confirmed
- Context: Combat has five distinct priority windows requiring different reasoning. A structured field lets the phase guidance block (DEC-036) give precise, sub-step-specific instructions rather than generic combat framing. Most players do not know exactly which combat sub-step they are in, so defaulting to `declare_blockers` covers the most contentious and common moment.
- Impact:
  - new type `CombatStep = "beginning_of_combat" | "declare_attackers" | "declare_blockers" | "combat_damage" | "end_of_combat"` added to frontend and backend types
  - `GameContext` gains optional field `combatStep?: CombatStep`
  - frontend: inline sub-step selector renders next to the phase picker when combat is selected; default is `declare_blockers`
  - backend Zod schema updated to accept optional `combatStep` on `gameContext`; field is ignored when `turnPhase !== "combat"`
  - `PromptContext` passes `combatStep` through to `phaseGuidance.ts` resolution
  - `POST /api/ask-ai` request shape gains `gameContext.combatStep` as optional; success and error response shapes remain unchanged
- Related requirements:
  - REQ-015
  - REQ-024
- Notes:
  - the note in DEC-022 that "combat sub-step detail belongs in the question or notes" is superseded; the user's question may still add further detail

### DEC-038
- Decision: `POST /api/ask-ai` may accept an optional `conversationHistory` field on follow-up turns; success and error response shapes remain unchanged.
- Status: confirmed
- Context: The post-decrypt follow-up chat feature requires prior exchange turns to be sent with each follow-up so the model can reason in context. Adding one optional field is the smallest additive change to the existing contract.
- Impact:
  - `AskAiRequest` gains optional `conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>`
  - first decrypt omits `conversationHistory`; follow-up N sends frozen `gameContext` plus full prior exchange
  - backend Zod validation accepts the field when present: non-empty array, max 20 turns, max 2000 chars/message, same control-character guardrails as `question`, must start `role: "user"`, must alternate user/assistant, last entry must be `assistant`
  - success response shape `{ answer }` and error response shape are unchanged for both mock and OpenAI providers
  - mock-provider follow-up answers include the exact assembled LLM-facing prompt for the submitted user message, allowing the visible chat flow and provider-bound prompt to be validated without live model access
  - DEC-020 frozen contract is preserved; this is an additive optional extension only
- Related requirements:
  - REQ-019
  - REQ-027
- Notes:
  - amends DEC-020 contract freeze for this one optional additive field

### DEC-039
- Decision: Follow-up conversation history is client-side ephemeral only; no server-side session store, no persistence across page reloads.
- Status: confirmed
- Context: The PRD non-goal explicitly excludes saved sessions. Ephemeral client state is sufficient for the in-session follow-up use case and avoids any server-side session complexity.
- Impact:
  - `conversationHistory` is assembled in the frontend hook from in-memory state and discarded on page reload
  - no session IDs, no new backend endpoints, no storage layer
- Related requirements:
  - REQ-027
- Notes:

### DEC-040
- Decision: Game context is frozen after the first successful decrypt for the duration of the in-session conversation; follow-up turns are text-only in v1.
- Status: confirmed
- Context: Allowing zone or card edits mid-conversation would require re-deriving the full context for every history turn, adding complexity without a clear v1 use case. Freezing context keeps the history coherent and the implementation tractable.
- Impact:
  - `frozenGameContext` snapshot is taken on first decrypt success and used unchanged for all follow-up requests
  - enrichment zone/card editing is disabled while a conversation is active
  - `hiddenInitialQuestion` (including zone-aware fallback) is captured at first decrypt and included in `conversationHistory` on follow-up turns but not shown in the UI thread
  - start over clears the thread and unfreezes editing; all previously entered context, zones, cards, and enrichment are preserved for re-use
  - start over button is visible whenever the first decrypt has succeeded and no request is in flight
- Related requirements:
  - REQ-025
  - REQ-029
- Notes:

### DEC-041
- Decision: Follow-up submit UX is inline within the chat composer; `AskAiWaitingPanel` is not shown for follow-up turns.
- Status: confirmed
- Context: The full waiting panel is appropriate for the initial decrypt which can take several seconds under a cold start. Follow-up turns share frozen context and shorter prompts; replacing the entire form for each follow-up would break the chat flow. An inline button animation is sufficient feedback.
- Impact:
  - Send button replaces its content with a processing animation (e.g. spinner or animated dots) while a follow-up request is in flight
  - `AskAiWaitingPanel` continues to render for the initial decrypt only (REQ-023 unchanged)
  - Send button is disabled and shows the animation until the response is received or an error occurs
- Related requirements:
  - REQ-023
  - REQ-028
- Notes:

### DEC-042
- Decision: Backend prompt assembly must include full card metadata (including oracle text) for every submitted card in every populated zone, not only stack items. Empty oracle text renders as `(none) — no oracle text recorded for this card`. Prompt-size and truncation constants are raised to effectively unlimited test values via a shared `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` constant; diagnostic and enforcement infrastructure is preserved.
- Status: confirmed
- Context: The PRD contract states "oracle text for each card" but the implementation was stack-only. Phase-scoped zone defaults (DEC-035) increased non-stack submissions, exposing the gap. The frontend already sends full `ZoneCardItem` payloads with oracle and metadata for every zone; the fix is backend prompt assembly only.
- Impact:
  - `PromptContextZoneItem` extended with `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`; `details` removed in favor of `contextNotes`; `caster` omitted (non-stack cards are not cast)
  - `normalizeZoneItem()` mirrors the stack card mapping
  - `formatNonStackZoneSections()` emits the same shared card metadata block as the stack section
  - empty `oracleText` after trim emits `oracleText: (none) — no oracle text recorded for this card`
  - `buildQueryText()` in `gameRulesRetrieval.ts` includes `typeLine` and `oracleText` for non-stack items
  - `normalization.ts` gains exported `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000`; all `MAX_*` constants raised accordingly
  - eval goldens regenerated; `oracle-text-all-zones` eval harness check added
  - `POST /api/ask-ai` request and response shapes unchanged
- Related requirements:
  - REQ-030
- Notes:
  - `cardId` and `imageUrl` continue to be omitted from LLM-facing prompt text
  - amends DEC-030 cap values — see DEC-030 Notes for the amendment
  - full card oracle in all zones must not be rolled back when caps are tightened in a future slice

### DEC-043
- Decision: `gameStateNotes` is a single freeform optional string on `GameContext`, not structured sub-fields per feedback category.
- Status: confirmed
- Context: AI feedback identified 6 categories of missing prompt context (continuous/replacement effects, target legality flags, priority holder, alternative costs, board state specifics, pending delayed triggers). Structuring these as individual fields would add form friction during live gameplay and produce brittle data models for inherently freeform game state. Per-card transient state is already addressable via existing `contextNotes` on `ZoneCardItem`. The genuine gap is cross-card, global game-state context with no existing capture point.
- Impact:
  - `GameContext` gains optional field `gameStateNotes?: string`
  - backend prompt emits `ADDITIONAL GAME STATE` section containing `gameStateNotes` content, positioned after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE`
  - section omitted entirely when `gameStateNotes` is absent or blank after trim
  - `POST /api/ask-ai` request shape gains `gameContext.gameStateNotes` as optional; success and error response shapes remain unchanged
  - no structured sub-fields for individual categories (`priorityHolder`, `activeEffects[]`, `pendingTriggers[]` are not added)
  - per-card transient state (counters, tapped status, gained abilities, kicker paid, X value) remains in existing `contextNotes` on `ZoneCardItem`; stack item `contextNotes` UI gains placeholder copy to surface this intent
  - `gameStateNotes` is capped at 2000 characters (matching `oracleText`); the control-character guardrails from `question` also apply; blank/whitespace input is accepted at validation and omitted by normalization rather than rejected
  - `gameStateNotes` UI surface is a collapsible dropdown within the context collection step; collapsed by default; expanding reveals the freeform textarea
- Related requirements:
  - REQ-031
  - REQ-017
- Notes:
  - live gameplay entry speed is the dominant constraint; freeform captures all 6 feedback categories without forcing structured input during play

### DEC-044
- Decision: Adopt a durable feature/subsystem catalog at `sections/system-map.md` so the truth layer states what is built, how it behaves at a glance, and where it lives — without re-deriving behavior from code.
- Status: confirmed
- Context: The PRD promotes decisions into the `sections/` truth layer during planning, and the `Status:` field tracks decision lifecycle (`confirmed`/`superseded`), not whether code shipped. As a result the truth layer mixes "decided" with "built," and answering "is this real / how does it work / where does it live?" requires a code-reading journey. A single consolidated catalog answers all three in one read and gives a low-maintenance shipped-vs-planned signal without overloading `Status:` or sprinkling a new field across every entry.
- Impact:
  - new durable artifact `sections/system-map.md`; two levels — subsystems, with features grouped under each subsystem
  - each entry records: `Status` (`shipped` | `planned` | `partial`), a one-line behavior summary, coarse file/module location (subsystem level, not per-line), and backing `DEC`/`REQ` IDs
  - the shipped-vs-planned signal lives in the catalog only; existing `Status: confirmed/superseded` semantics on `DEC`/`REQ` entries are unchanged and not overloaded
  - additive-first: the catalog is built and validated against real questions before any reconciliation of stale navigation or change to existing status conventions
  - lightweight promotion gate: a catalog entry is marked `shipped` only when code and a cleanup receipt exist; enforced at cleanup time and documented in `instructions/`
  - commit-message convention (conventional-commits-lite): `docs(prd):` for doc/plan-only changes, `feat:`/`fix:` for changes that ship product behavior; documented in `instructions/`
  - stale navigation is reconciled only after the catalog is validated: the `PRD/README.md` work-package table is corrected and a pointer to the catalog is added to the `PRD/README.md` Section Inventory
  - `DEC-043`/`REQ-031` (`gameStateNotes` / `ADDITIONAL GAME STATE`) are reconciled by representing them as `planned` in the catalog — their `Status: confirmed` lifecycle field is left unchanged, because shipped-vs-planned lives in the catalog only and `Status:` semantics are not overloaded
  - deep per-subsystem behavior prose is out of scope here and deferred to `PRD/work/system-map-detail/` (it covers prompt assembly and the System 2 / System 3 retrieval mechanics that `prompt-context-retrieval-tuning` will rewrite); the catalog links to it once it exists
  - no per-decision → code-line link maintenance is introduced (explicit non-goal preserved)
  - documentation and process only: no `POST /api/ask-ai` request/response, UI, or prompt-assembly behavior change
- Related requirements:
  - (none — documentation and process decision; no functional requirement is added or changed)
- Notes:
  - the promotion gate and commit convention are process rules implemented in instruction files (`instructions/doc-lifecycle.md`, `instructions/agent-working-rules.md`) during map-out/implement, not in section files
  - DEC-044 itself is tracked as `planned` in the catalog until the catalog ships, then flipped to `shipped` per the promotion gate
  - "correcting `DEC-043`" means giving it a `planned` catalog entry, not editing its `Status:` field; `DEC-043`/`REQ-031` prose stays in the normative present tense used across the truth layer, since disambiguating decided-vs-built is precisely the catalog's job
  - this decision does not change the "assistant, not judge" framing or any prompt behavior

### DEC-045
- Decision: System 2 curated game-rules baseline uses an always-on core plus card-agnostic game-state-gated topic expansion, replacing inclusion of all curated topics on every request.
- Status: confirmed
- Context: DEC-030 ships all 23 curated topics on every prompt regardless of game state, producing phase-irrelevant bloat and missing situation-specific coverage. The System 2 / System 3 boundary (locked 2026-06-18) assigns card-agnostic game-state signals to System 2; card-driven retrieval belongs in System 3. Because System 2 rule IDs are excluded from System 3's pool, a balanced slimming strategy is safe — topics dropped from the baseline become eligible for System 3 when genuinely relevant.
- Impact:
  - game-rules enrichment remains prompt-only and backend-only; no API or UI changes
  - **always-on core** (every prompt): `stack-and-priority`, `targets-basics`, `zones-basics`, `abilities-trigger-basics`
  - **conditional buckets** (unioned with core, stable `id` order):
    - `stack` zone non-empty → `spell-casting-choices`, `spell-casting-costs`, `effects-resolution-targets`, `copying-spells-abilities`, `effects-source-impossible`
    - `battlefield` zone populated → `replacement-effects-basics`, `replacement-etb-effects`, `layers-order`, `layers-power-toughness`, `layers-timestamps-dependencies`, `abilities-zone-change-triggers`
    - `turnPhase = combat` + `combatStep = declare_attackers` → `combat-phase-structure`, `combat-declare-attackers`
    - `turnPhase = combat` + `combatStep = declare_blockers` → `combat-phase-structure`, `combat-declare-blockers`
    - `turnPhase = combat` + `combatStep = combat_damage` → `combat-phase-structure`, `combat-damage-assignment`, `damage-basics`, `damage-marked-lethal`, `damage-lifelink-deathtouch`
    - `turnPhase = combat` + other or absent `combatStep` → all combat and damage topics above
    - `turnPhase ∈ {upkeep, draw, end_step, cleanup}` → `abilities-delayed-triggers`
  - selection uses only `turnPhase`, `combatStep`, and populated zone presence — no card names, oracle text, or keywords
  - topic rule numbers remain in `gameRulesTopicManifest.json`; mapping is human-signed-off during implementation
  - selection logic lives in backend (`gameRules.ts` or dedicated selector module)
  - `preparePromptInput` passes selected topics (not all topics) to `formatGameRulesSection`
  - `collectCuratedRuleIds` reflects selected topics only for System 3 deduplication
  - eval harness asserts conditional selection per scenario (REQ-032)
  - supersedes DEC-030 impact bullet requiring all curated topics on every request
- Related requirements:
  - REQ-022
  - REQ-032
- Notes:
  - NFR-002 latency mitigation: smaller baseline for phase-irrelevant requests; re-sample p50/p95 after ship
  - `MAX_PROMPT_CHAR_BUDGET` stays at `EFFECTIVELY_UNLIMITED_CHARS` (DEC-042) during tuning

### DEC-046
- Decision: System 3 supplemental rule retrieval uses relevance-aware lexical scoring with IDF weighting, question boost, keyword boost, and an improved tie-break, replacing DEC-032's flat +1-per-shared-word formula.
- Status: confirmed
- Context: DEC-032's scorer treats all shared words equally (+1), lets full oracle text drown out the user's question, and tie-breaks toward the lowest rule number — producing common, general, early-numbered rules instead of card/question-relevant ones. The System 2 / System 3 boundary assigns all card-driven retrieval (including oracle-keyword signals) to System 3; keyword matches must carry strong scoring weight to preserve quality when keyword-related topics are not curated into System 2.
- Impact:
  - supplemental retrieval remains prompt-only and backend-only; max 5 rules, deduplicated against selected System 2 rule IDs
  - **IDF weighting:** each matched token contributes `log(N/df)` where `df` = rules containing the token (computed from `gameRulesRuleIndex.json` at build or startup)
  - **question boost:** tokens from the user's question carry a multiplier over tokens from card oracle text and context notes; `buildQueryText` tracks token provenance
  - **keyword boost:** tokens in a committed static keyword vocabulary carry a strong multiplier; initial vocabulary is manually curated (`apps/backend/data/gameRulesKeywordVocabulary.json` or equivalent); derivation strategy may evolve (Q-001)
  - **retain** exact rule-ID (+100) and parent-ID (+20) bonuses from DEC-032
  - **tie-break:** highest single-token IDF among matched tokens, then ruleId ascending for determinism; replaces lowest-rule-number tie-break
  - `enrichmentDebug` continues to expose scores, selected rules, and runner-ups
  - eval harness asserts labeled supplemental recall per REQ-032
  - embeddings/semantic retrieval is not committed; lexical tuning first, measured follow-up only if needed
- Related requirements:
  - REQ-022
  - REQ-032
- Notes:
  - supersedes DEC-032 scoring formula impact bullet; section label, positioning, and dedup behavior unchanged
  - keyword vocabulary is a standalone artifact so derivation can change without scorer logic changes

### DEC-047
- Decision: The eval harness verifies game-rules retrieval relevance using labeled expected outcomes for System 2 topic selection and System 3 supplemental rule recall.
- Status: confirmed
- Context: Existing eval checks assert section presence and ordering but not which rules are pulled. Tuning System 2 and System 3 together requires measurable before/after relevance, not manual inspection of multi-file `prompt:preview` output.
- Impact:
  - eval fixtures may include an `expected` block: `expectedSystem2TopicIds`, `expectedSupplementalRuleIds`, optional `forbiddenSupplementalRuleIds`
  - new harness checks: `system2-conditional-selection`, `system3-expected-recall`, `system3-noise-excluded`
  - new or extended scenario fixtures cover the signal taxonomy (stack-resolution, combat-damage/deathtouch, upkeep-trigger, keyword interaction, out-of-manifest SBA)
  - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics, System 3 top-5 + scores, recall hit/miss)
  - existing structural checks and `npm run test:eval` gate remain unchanged
  - expected rule IDs are human-labeled ground truth, not inferred from current scorer output
- Related requirements:
  - REQ-032
  - REQ-022
- Notes:
  - does not replace `prompt:preview` for general prompt inspection; adds automated relevance regression
  - full prompt golden regeneration only for intentional structural changes

### DEC-048
- Decision: The deep per-subsystem behavior layer deferred by DEC-044 lives as separate detail files under `PRD/sections/system-map/`, one file per catalog subsystem, each linked from the catalog by an optional `Details:` field and written to a fixed lightweight template.
- Status: confirmed
- Context: DEC-044 ships the shallow `sections/system-map.md` catalog (status + one-liner + location + backing IDs) and explicitly defers the depth layer — the prose explaining how a subsystem actually works — to `PRD/work/system-map-detail/`, because the highest-value subsystems to document (prompt assembly, System 2 / System 3 retrieval) were about to be rewritten by `prompt-context-retrieval-tuning`. That package has landed (DEC-045, DEC-046, DEC-047 confirmed), so the volatile detail can now be written once. The catalog is already optimized for one-read scanning; embedding deep prose inline would grow it past readability and mix the index with its detail.
- Impact:
  - documentation and process only: no `apps/` code, no `POST /api/ask-ai` request/response, UI, or prompt-assembly behavior change
  - depth prose lives in separate files under `PRD/sections/system-map/`, one detail file per catalog `##` subsystem (e.g. `system-map/prompt-assembly.md`); the catalog keeps its existing four-field shallow shape
  - the catalog format gains one optional, additive `Details:` field on a subsystem entry pointing to its detail file; this does not change or overload `Status:` semantics and is omitted for subsystems with no detail file
  - no dangling links: a `Details:` pointer and the detail file it references land together in the same change; a subsystem without a detail file has no `Details:` line
  - each detail file follows a fixed lightweight template: a `Backed by:` DEC/REQ line, then `How it works`, `Data flow`, `Where it lives` (coarse modules), one `Worked example`, and `Invariants / gotchas`
  - behavior-level prose only; no per-decision → code-line link maintenance (inherits the DEC-044 non-goal); prose that merely restates code is not added
  - coverage is by need, not exhaustive: this package writes detail files for the priority subsystems only — `prompt-assembly.md` and `game-rules-retrieval.md` (the latter covering System 1 card rulings, System 2 curated baseline, and System 3 supplemental retrieval, which the catalog groups together and which interrelate via dedup); other subsystems get a detail file and `Details:` link only when one is later written
  - maintenance rule: a detail file is revisited only when its subsystem's behavior changes, governed by the existing DEC-044 commit convention (`feat:`/`fix:` for behavior changes, `docs(prd):` for doc-only changes)
- Related requirements:
  - (none — documentation and process decision; no functional requirement is added or changed)
- Notes:
  - extends DEC-044; does not supersede it — the shallow catalog and its shipped-vs-planned signal are unchanged
  - the priority detail files must reflect the assembled prompt section order and the System 1/2/3 mechanics as defined by DEC-025, DEC-029, DEC-030, DEC-036, DEC-042, DEC-043 (planned), DEC-045, DEC-046, DEC-047; `Q-001` (keyword-vocabulary derivation) is the live open question for System 3 and should be referenced, not resolved, by the detail prose
  - this decision does not change the "assistant, not judge" framing or any prompt behavior

### DEC-049
- Decision: Live LLM response-size diagnostics are log-only statistics computed from the returned answer text; they are not prompt input, product answer text, frontend UI, or response sidecars.
- Status: confirmed
- Context: Mock mode already exposes prompt-size stats for local debugging, but the live provider path lacks lightweight visibility into how large model answers are. This makes it harder to compare real provider behavior against mock/local expectations after prompt-size and retrieval-tuning work. The debug need is response-size observability, not a product-facing contract change.
- Impact:
  - after a successful live provider invocation, backend lifecycle logs include answer-size fields derived from the final `answer` string returned to the caller
  - required fields are `answerChars`, `estimatedAnswerTokens`, and `charsPerTokenEstimate`
  - `estimatedAnswerTokens` uses the same 4-characters-per-token heuristic as the existing mock prompt stats; this remains an estimate, not provider-native token accounting
  - `POST /api/ask-ai` success responses from the OpenAI/live provider remain `{ answer }`
  - response-size stats are not appended to `answer`, not included in `context`, `diagnostics`, or `enrichmentDebug`, and not added to `conversationHistory`
  - prompt construction and prompt diagnostics remain unchanged; this decision does not add hidden prompt context or provider-response metadata to the model input
  - provider-native usage metadata, exact billing token accounting, durable analytics storage, and frontend debug displays remain out of scope unless a later decision adds them
- Related requirements:
  - REQ-033
- Notes:
  - preserves DEC-020 live provider contract stability and DEC-033's mock-only sidecar boundary

### DEC-050
- Decision: Camera card scanning is an optional, separately-scoped, frontend-only alternate input path into existing zone card fields — not a replacement for manual search and not part of the core product loop.
- Status: confirmed
- Context: `goals-and-non-goals.md` previously listed camera scanning as an Explicit Non-Goal and Intentional Constraint, and `NFR-008` framed it as future-only and not in the core product. A friend exported a proven, self-contained on-device art-identification engine (Cardomancer), making scanning feasible now as a convenience input. Typed-only card entry (`FLOW-001` step 3) is slow at a live table and discourages players from feeding a complete board before asking, weakening prompt context. This decision reframes scanning from out-of-scope to a scoped optional feature; it does not change the flow-validation core-product framing (`GOAL-001..003`).
- Impact:
  - scanning reuses the existing select → preview → add → owner → duplicate-block → stack-limit path and produces the same `ZoneCardItem` output as manual add
  - scanning is frontend-only and makes zero network calls at identification time
  - no change to `AskAiRequest`, `GameContext`, prompt assembly (`buildPromptContext`/`buildPromptText`), provider boundary, or any product-facing endpoint
  - manual card search remains the default input and a permanent fallback
  - supersedes the "camera scanning is out of scope" non-goal/constraint in `goals-and-non-goals.md`; realizes the `NFR-008` "leave room for future scanning" intent
  - shipped-vs-planned signal lives in `system-map.md` (entry starts `planned`)
- Related requirements:
  - REQ-034
  - REQ-035
  - REQ-036
  - REQ-037
  - REQ-038
  - NFR-010
- Notes:
  - art-only identification yields a ranked candidate list, not a definitive printing (DEC-053)
  - does not introduce duplicate-card support (inherits `FLOW-004` block) or manual reorder (`FLOW-002`)

### DEC-051
- Decision: The card-art perceptual-hash "recipe" (64×64 resize + DCT hash) is implemented once in TypeScript as the single authoritative module, used both on-device at scan time and by TheJudge's own offline build that generates the fingerprint library (`cardhashes.bin`); TheJudge owns and refreshes the library via the existing data pipeline.
- Status: confirmed
- Context: Perceptual-hash matching only works if the hasher and the database builder use an identical resize+hash, or distances silently shift and matching degrades with no error. The friend's reference built the database with PIL Lanczos. Rather than depend on a second image stack matching it (or on the friend re-exporting the library), TheJudge uses one TS implementation on both sides, making parity true by construction. This fits the repo "single authoritative definition / reuse before creating" rule and the "no runtime metadata sync" constraint.
- Impact:
  - one TS module owns resize + DCT perceptual hash; both the on-device scanner and the build step import it (no FE↔build duplication)
  - golden parity vectors are regenerated from the TS recipe and used as the byte-exact regression gate (REQ-034)
  - TheJudge generates `cardhashes.bin` + a manifest from Scryfall images during a build/refresh step; no dependence on an externally prebuilt database
  - identification never fetches Scryfall or card images at runtime; the library is a lazy-loaded static artifact (REQ-035, NFR-010)
  - card-image download for the build requires explicit human approval before the command runs (same policy as Scryfall/CR refresh)
  - supersedes the SOURCE-ANALYSIS "consume a prebuilt DB first" recommendation
- Related requirements:
  - REQ-034
  - REQ-035
  - NFR-010
- Notes:
  - canonical constants, parity gotchas, and DB format are in `PRD/work/cardomancer-card-detection-summary/SOURCE-ANALYSIS.md` and the friend's `SPEC.md`

### DEC-052
- Decision: The scanner opens a camera screen with continuous auto-scan plus an always-available manual tap-to-capture fallback, runs a batch accept-and-rescan loop per zone, and handles card backs and low-confidence results without leaving the camera or calling the backend.
- Status: confirmed
- Context: Scanning is meant to speed batch context capture at a live table. A single deliberate shot is reliable; continuous auto-scan is faster when it works; combining them gives speed with a reliable fallback. Unhappy paths must never strand the user, who can always fall back to manual search.
- Impact:
  - camera shows a card-shaped guide overlay; auto-scans continuously; a manual capture button is always available
  - on a candidate, the user taps Accept to add the card to the current zone via the existing add path; the camera immediately re-opens to scanning for the next card
  - a Back/Exit control closes the camera and returns to zone collection
  - a detected card back shows "Flip the card over" (not a generic no-match)
  - on low confidence, scanning continues and manual capture stays available; after a few consecutive low-confidence attempts a non-blocking prompt offers manual name entry (existing search) without stopping the scan
  - stack cards land in scan order, bottom-to-top; manual reorder remains out of scope (`FLOW-002`)
  - the "few attempts" count, detector area fractions, and confidence/card-back thresholds are calibration constants validated by outcome (detect-rate / top-1 accuracy), not product open questions
- Related requirements:
  - REQ-037
  - REQ-038
- Notes:
  - first implementation may land manual tap-capture before continuous auto-scan; the target experience is both (map-out sequences this)

### DEC-053
- Decision: Scan matches are art-level (printing-level) and resolve through `Scryfall printing id → oracle_id → existing CardMetadataItem`; the engine returns a ranked candidate list, duplicate oracle ids collapse to one candidate by best distance, and unresolvable candidates are dropped.
- Status: confirmed
- Context: Reprints share artwork, so an art hash identifies an illustration, not a single printing — several printings can match near-identically. TheJudge's gameplay/prompt identity is oracle-level (`CardMetadataItem.cardId` is the oracle id). A printing-level scan result must therefore be bridged to oracle-level metadata rather than forced into zone/prompt state as a printing id.
- Impact:
  - the engine output contract is a ranked candidate list (best first), not a single answer
  - a build-time printing-id → oracle-id bridge artifact maps each match to an oracle id, then to the committed `CardMetadataItem`
  - candidates with the same oracle id collapse to one, keyed by best (lowest) distance; candidates that do not resolve to committed metadata are dropped
  - resolved candidates feed the existing picker preview exactly like typed suggestions; downstream zone/prompt identity stays oracle-level and unchanged
  - the bridge artifact is static and committed (consistent with `cardMetadata.json`); identity resolution makes no runtime network call
- Related requirements:
  - REQ-034
  - REQ-036
- Notes:
  - printing-level identity is not pushed into `ZoneCardItem`, prompt context, or rulings lookup

### DEC-054
- Decision: The fingerprint-library build (`cardhashes.bin`) becomes resumable and budget-bounded by **default** ("bin-as-memory, hash-and-discard"): the no-flag run resumes from the existing bin and downloads only what is missing, so the full gameplay-card corpus can be fingerprinted across many short runs without ever retaining the full image corpus. A full from-scratch rebuild is opt-in via `--fresh` and is **non-destructive** — it writes a new file and never deletes or overwrites the live bin.
- Status: confirmed
- Context: `cardhashes.bin` is built from ~96k Scryfall printing PNGs (~100 GB). The original `build-card-hashes.mjs` path (`buildFromLocalImages`) rewrote the bin from scratch each run and was all-or-nothing — it threw on the first missing local PNG unless `--download`, never read the existing bin, and clobbered the previous artifact in place — so avoiding re-downloads forced retaining the whole corpus, and any rebuild risked destroying a known-good bin. The real production artifact was deferred in `cardomancer-card-detection-summary` Slice B (REQ-035) precisely because of the corpus-retention cost. Making the resumable, bin-as-memory path the default (it diffs against what is already fingerprinted, downloads only what is missing into a transient path, hashes, and discards immediately) lets the operator kick off one bounded command per morning until coverage is complete, and treating destruction as an explicit, non-destructive opt-in removes the "rebuild deletes my good file" hazard.
- Impact:
  - resumable bin-as-memory build is the **default** (no flag) on `scripts/build-card-hashes.mjs`; a cold start with no existing bin is simply the default running against an empty diff (no special flag needed for a brand-new build)
  - the default build uses the existing (or in-progress partial) `cardhashes.bin` as the record of already-fingerprinted entry ids: it diffs the filtered Scryfall printing ids against the bin, downloads only missing images to a **transient temp path** (never the retained cache dir), hashes each via the shared `recipe.ts` (`cropRegionA` + `phashRegionPacked`, DEC-051 parity preserved), and **deletes each image immediately** after hashing
  - `--fresh` builds from scratch, ignoring the existing bin's contents, and is **non-destructive**: it writes to a separate new output file (default a sibling such as `cardhashes.fresh.bin` + matching manifest) and never deletes or overwrites the live `cardhashes.bin`; it refuses to clobber an existing target file unless the operator explicitly directs it there (`--output <path>` and/or `--force`). Promotion of a fresh build to the live path is a deliberate manual step
  - crash safety: every bin/manifest write (default in-place checkpoint and `--fresh`) is atomic — written to a temp file and renamed into place — so a killed or interrupted run can never corrupt or truncate the live bin
  - two optional, independent, combinable per-run budgets: `--limit N` (stop after N newly fingerprinted entries) and `--max-minutes M` (stop after M wall-clock minutes, finishing the in-flight entry first); either alone, both together (first ceiling reached ends the run), or neither (run to completion). A clean stop always checkpoints before exit
  - checkpointing: a valid partial `cardhashes.bin` + `cardhashManifest.json` is rewritten every K newly hashed entries and on every clean budget-stop, so an interrupted or killed run resumes losslessly next run by diffing against the partial; entries are processed in a stable id order for deterministic, predictable progress
  - per-image downloads are paced for Scryfall politeness — a fixed inter-request delay (~50–100ms per Scryfall's API guideline, with a `--rate-ms` override) plus bounded retry-and-backoff on `429`/`5xx`/network errors honoring `Retry-After`, and the existing `User-Agent` header — so a multi-thousand-image run does not overload Scryfall or get the operator rate-limited; downloads stay sequential (no added concurrency)
  - per-image failure handling: a download/hash failure logs and skips (run continues); the printing stays missing and is retried on the next run, but a sidecar skip-list artifact (`apps/frontend/public/data/cardhashSkiplist.json`) tracks per-id attempt counts and **parks** a printing after N failed attempts so a permanently-bad image stops blocking daily progress; only permanent failures (`404`, decode/dimension errors) count toward parking, while transient failures (`429`/`5xx`/network with the retry budget exhausted) are left missing for the next run and do not increment the park counter; parked entries are reported in the run summary and a `--retry-parked` flag re-includes them
  - append-only merge (no pruning of printings removed from a newer bulk; a `--prune` flag is a separate later decision); unsupported `cardhashes.bin` versions are rejected before any rewrite; `<id>`, `<id>__back`, and `_card_back` are distinct diff entry ids
  - npm aliases: `data:scan-fingerprints` runs the default resumable build with a labeled banner ("Building card-scan fingerprint library (cardhashes.bin) — resume + extend") and a progress readout (start and end): total target (filtered gameplay printings), already fingerprinted, done this run, remaining, parked, rough ETA at the current run's rate; `data:scan-fingerprints:fresh` runs the non-destructive `--fresh` rebuild; the prior `data:scan-hashes` alias is reconciled (repointed to `data:scan-fingerprints` or retired) so one name does not mean two behaviors
  - run-it-yourself documentation is a shipped deliverable, not optional: the root `README.md` (under `## Useful Commands` and/or `## Operational References`) and the script `--help` must explain that the default (via `data:scan-fingerprints`) resumes and extends the existing bin and is the normal day-to-day path, that `--fresh` builds from scratch into a new file without touching the live bin, the two budget flags and their combination, the `--rate-ms` pacing and automatic `429`/`5xx` backoff, the resume/checkpoint and atomic-write safety, the skip-list/parking and `--retry-parked`, and the human-approval network posture
  - network posture is unchanged: every run downloads images, so each run is itself the explicit human approval (the operator running the command); no scheduled/automated/CI refresh job is added
  - no change to the shipped artifact format/size (`CARDHSH1` v1, ~14 MB), the runtime scanner, `loadHashDb.ts`, the shared `recipe.ts`, the `dbformat.ts` round-trip, or DEC-051 parity-by-construction; a future recipe/geometry change still forces a full re-download/re-hash
  - checkpoint cadence K, parking-attempt threshold N, and the rate-limit pace (inter-request delay + retry/backoff bounds) are outcome-validated calibration constants (DEC-052 precedent), not product open questions
- Related requirements:
  - REQ-035
  - REQ-039
  - NFR-010
- Notes:
  - extends REQ-035 / DEC-051 (the same TheJudge-owned library and single-recipe parity); does not supersede them
  - this is the maintainable path to actually produce and keep `cardhashes.bin` current after its Slice B deferral
  - related prior exploration: a Codex read-only feasibility pass confirmed `readDb`/`writeDb` round-trip losslessly and the build already hashes via the same `recipe.ts` as runtime

### DEC-055
- Decision: The live scanner converges via a temporal lock-in control layer rather than streaming a fresh ranked list every frame, and card-back detection is descoped from the shipped scan UX (no canonical card-back reference asset is available). This refines DEC-052's capture/batch UX; it does not supersede it.
- Status: confirmed
- Context: The first shipped scanner (`cardomancer-card-detection`) wholesale-replaced the candidate list every auto-scan frame with a near-random top-10, so it visibly "never honed in": the correct card surfaced only occasionally amid churn, and the only auto-accept path (`resolved.length === 1`) effectively never fired. Separately, card-back detection requires a canonical 745×1040 `card_back_reference.png` in the library; that asset does not exist, so `CardIdentifier.isCardBack()` always returned `{ isBack: false }` and the "Flip the card over" UX was inert dead code. Reporter validation on a laptop camera confirmed identification itself works; the defect was convergence/confidence gating around the engine, not the engine.
- Impact:
  - a pure, unit-tested temporal stabilizer votes the top-1 ORACLE identity across a short rolling window and emits `searching` / `locked`; a frame only votes when the best distance is within a tight confidence bound AND beats the runner-up by a margin, so noise dilutes rather than accumulates (`apps/frontend/src/lib/scan/stabilizer.ts`)
  - on lock, auto-scan pauses and the picker presents one confident card for one-tap Add, with Rescan to resume — preserving the DEC-052 accept → re-scan loop while ending the list churn
  - while searching, per-frame candidates are confidence-gated and capped (top 3) as a subdued hint rather than a flooding top-10; the degenerate single-candidate auto-accept is removed
  - detection runs on a downscaled frame and warps from full resolution, raising effective FPS (more votes) and steadying the quad with no engine/geometry/hash change
  - all convergence knobs (window size, vote count, lock distance, margin, surface distance, detect downscale) live in one file (`apps/frontend/src/lib/scan/tuning.ts`) so calibration is a single-file edit
  - card-back detection is removed from the scan-time path: the `isCardBack` hook state, the "Flip the card over" prompt, and the picker wiring + their tests are deleted. The engine method `CardIdentifier.isCardBack()` and the build-side `_card_back` / `hasCardBackReference` support remain in place but dormant, so the feature can be re-enabled by supplying the asset, re-running `data:scan-fingerprints`, and rewiring the UI
- Related requirements:
  - REQ-037
  - REQ-038
- Notes:
  - validated end-to-end on a laptop camera (detection + identification + single-card lock-in); formal NFR-010 device metrics were not separately recorded and some scan UX refinement remains as future work
  - lock-in tuning constants are outcome-validated calibration values (DEC-052 precedent), not product open questions
