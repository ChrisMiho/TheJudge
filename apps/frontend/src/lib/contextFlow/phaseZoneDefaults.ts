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
  upkeep: ["battlefield", "stack"],
  draw: ["hand", "library"],
  main_1: ["battlefield", "hand"],
  main_2: ["battlefield", "hand"],
  combat: ["battlefield", "stack"],
  end_step: ["battlefield", "hand"],
  cleanup: ["battlefield", "graveyard"]
};

export function getPhaseZoneDefaults(phase: TurnPhase): ZoneId[] {
  return PHASE_ZONE_DEFAULTS[phase];
}

/**
 * Additive delta merge: adds zones newly assumed in newPhase compared to prevPhase
 * (or all defaults when prevPhase is undefined). Never removes user-selected zones.
 * Returns zones in canonical order.
 *
 * Delta semantics ensure that zones the user explicitly unchecked on zone-confirm
 * are not re-added simply because the new phase also assumes them — only genuinely
 * new zones (not present in the previous phase's defaults) are added.
 */
export function mergeSelectedZonesOnPhaseChange(
  currentSelected: ZoneId[],
  newPhase: TurnPhase,
  prevPhase?: TurnPhase
): ZoneId[] {
  const prevDefaults = prevPhase ? new Set(PHASE_ZONE_DEFAULTS[prevPhase]) : new Set<ZoneId>();
  const deltaZones = PHASE_ZONE_DEFAULTS[newPhase].filter((zone) => !prevDefaults.has(zone));
  const merged = new Set([...currentSelected, ...deltaZones]);
  return CANONICAL_ZONE_ORDER.filter((zone) => merged.has(zone));
}
