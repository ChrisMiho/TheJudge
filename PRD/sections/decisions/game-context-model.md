# Game context model decisions

The structured GameContext model: zones, targets, players, turn phase, and combat steps.

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

