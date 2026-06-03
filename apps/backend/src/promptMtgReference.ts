/**
 * Static MTG rules reference block included in every ask-ai prompt.
 * Kept under 2500 characters for token budget compliance.
 */
export const MTG_PROMPT_REFERENCE = `Magic: The Gathering turns proceed in this order: beginning phase (untap, upkeep, draw), pre-combat main phase, combat phase, post-combat main phase, ending phase (end step, cleanup). The stack is a zone where spells and abilities wait to resolve; items resolve top to bottom.

This app records turn phase as one of: untap, upkeep, draw, main_1, combat, main_2, end_step, cleanup, stack_resolving. Combat is a single combined phase; specify combat sub-steps (declare attackers, declare blockers, combat damage, etc.) in the user's question if relevant. stack_resolving means a stack is currently resolving.

Zones (app model):
- stack — Spells and abilities pending resolution; ordered bottom (first) to top (last).
- battlefield — Permanents in play.
- hand — Hidden cards a player may cast or activate.
- graveyard — Used cards and destroyed permanents.
- exile — Cards removed from the game.
- library — Deck; top matters for draw and search effects.
- command — Command zone (commanders, some other cards).

Only zones with cards appear in the user payload. A separate scope note lists empty or omitted zones.

Continuous effects and state-based actions use a layer system. When effects conflict, apply in order: (1) Copy effects, (2) Control-changing effects, (3) Text-changing effects, (4) Type-changing effects, (5) Color-changing effects, (6) Ability-adding/removing effects, (7) Power- and toughness-changing effects. Within a layer, timestamp and dependency rules apply. This assistant does not adjudicate officially; use layers as shared vocabulary when explaining interactions.`;
