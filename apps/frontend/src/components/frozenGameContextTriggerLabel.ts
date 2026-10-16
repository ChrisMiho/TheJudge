import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import type { CombatStep, GameContext, TurnPhase, ZoneCardItem, ZoneId } from "../types";

const TURN_PHASE_LABELS: Record<TurnPhase, string> = {
  untap: "Untap",
  upkeep: "Upkeep",
  draw: "Draw",
  main_1: "Pre Combat Main Phase",
  combat: "Combat",
  main_2: "Post Combat Main Phase",
  end_step: "End Step",
  cleanup: "Cleanup"
};

const COMBAT_STEP_LABELS: Record<CombatStep, string> = {
  beginning_of_combat: "Beginning of Combat",
  declare_attackers: "Declare Attackers",
  declare_blockers: "Declare Blockers",
  combat_damage: "Combat Damage",
  end_of_combat: "End of Combat"
};

export type PopulatedZone = { zone: ZoneId; cards: ZoneCardItem[] };

export function getPopulatedZones(frozenGameContext: GameContext): PopulatedZone[] {
  const zones = frozenGameContext.zones ?? {};
  return CANONICAL_ZONE_ORDER
    .map((zone) => ({ zone, cards: zones[zone] ?? [] }))
    .filter(({ cards }) => cards.length > 0);
}

export function getPhaseLabel(frozenGameContext: GameContext): string {
  const phaseLabel = TURN_PHASE_LABELS[frozenGameContext.turnPhase];
  if (frozenGameContext.turnPhase !== "combat" || !frozenGameContext.combatStep) {
    return phaseLabel;
  }
  return `${phaseLabel} — ${COMBAT_STEP_LABELS[frozenGameContext.combatStep]}`;
}

export function getFrozenGameContextTriggerLabel(frozenGameContext: GameContext): string {
  const populatedZoneCount = getPopulatedZones(frozenGameContext).length;
  return `${getPhaseLabel(frozenGameContext)} · ${populatedZoneCount} populated ${
    populatedZoneCount === 1 ? "zone" : "zones"
  }`;
}
