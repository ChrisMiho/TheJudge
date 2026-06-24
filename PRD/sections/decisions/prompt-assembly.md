# Prompt assembly decisions

How backend prompt text is assembled: reference block, zone sections, phase guidance.

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

