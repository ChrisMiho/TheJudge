import type { TurnPhase, ZoneId } from "../../types";

/**
 * Canonical zone order used for display and payload construction.
 * Matches backend zone ordering expectations.
 */
export const CANONICAL_ZONE_ORDER: ZoneId[] = [
  "stack",
  "battlefield",
  "hand",
  "graveyard",
  "exile",
  "library",
  "command"
];

/**
 * Default zones to auto-check when the user selects a turn phase.
 * Derived from phase-zone-assumptions.md (UX Wave 2).
 * v1 merges Assumed and Suggested tiers into a single auto-check list.
 */
export const PHASE_ZONE_DEFAULTS: Record<TurnPhase, ZoneId[]> = {
  untap: ["battlefield", "command"],
  upkeep: ["battlefield", "stack", "command"],
  draw: ["battlefield", "library", "hand"],
  main_1: ["battlefield", "hand", "stack", "graveyard"],
  main_2: ["battlefield", "hand", "stack", "graveyard"],
  combat: ["battlefield", "stack", "hand"],
  end_step: ["battlefield", "hand", "graveyard", "stack"],
  cleanup: ["battlefield", "graveyard"],
  stack_resolving: ["stack", "battlefield"]
};

/**
 * Additive merge: union new phase defaults with existing selected zones.
 * Never removes user-selected zones or deletes cards.
 * Returns zones in canonical order.
 */
export function mergeSelectedZonesOnPhaseChange(
  currentSelected: ZoneId[],
  newPhase: TurnPhase
): ZoneId[] {
  const defaults = PHASE_ZONE_DEFAULTS[newPhase];
  const merged = new Set([...currentSelected, ...defaults]);
  return CANONICAL_ZONE_ORDER.filter((zone) => merged.has(zone));
}
