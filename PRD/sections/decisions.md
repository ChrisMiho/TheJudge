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
- Status: confirmed
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
  - `MAX_PROMPT_CHAR_BUDGET` is raised to **35,000**; eval goldens and diagnostics update intentionally
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
  - `MAX_PROMPT_CHAR_BUDGET` remains 35000 per DEC-030

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
