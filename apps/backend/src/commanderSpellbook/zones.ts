import type { ZoneId } from "../types/index.js";
import type { ComboCardStateZone, ComboZoneId } from "./catalog.js";

/**
 * The single authoritative TheJudge `ZoneId` ⇄ Commander Spellbook zone map.
 * Both the game and lookup paths import this rather than re-deriving it.
 *
 * TheJudge's `stack` zone has no Commander Spellbook equivalent — upstream
 * ingredients describe *starting* locations — so a card on the stack is never
 * zone-compatible with any ingredient. It is annotated wrong-zone rather than
 * treated as absent, because the card genuinely is on the board.
 */
export const ZONE_ID_TO_COMBO_ZONE: Readonly<Record<Exclude<ZoneId, "stack">, ComboZoneId>> = Object.freeze({
  hand: "H",
  battlefield: "B",
  command: "C",
  exile: "E",
  graveyard: "G",
  library: "L"
});

export const COMBO_ZONE_TO_ZONE_ID: Readonly<Record<ComboZoneId, Exclude<ZoneId, "stack">>> = Object.freeze({
  H: "hand",
  B: "battlefield",
  C: "command",
  E: "exile",
  G: "graveyard",
  L: "library"
});

/** Canonical ordering for every serialized zone array. */
export const COMBO_ZONE_ORDER: readonly ComboZoneId[] = Object.freeze(["H", "B", "C", "E", "G", "L"]);

/**
 * Only these four zones carry card state upstream; hand and command have no
 * state field at all (`Ingredient.CARD_STATE_FIELDS`).
 */
export const COMBO_ZONE_TO_CARD_STATE_ZONE: Readonly<Record<ComboZoneId, ComboCardStateZone | null>> = Object.freeze({
  H: null,
  B: "battlefield",
  C: null,
  E: "exile",
  G: "graveyard",
  L: "library"
});

/** `null` for the stack, which can never be zone-compatible. */
export function toComboZone(zoneId: ZoneId): ComboZoneId | null {
  if (zoneId === "stack") return null;
  return ZONE_ID_TO_COMBO_ZONE[zoneId];
}

export function comboZoneLabel(zone: ComboZoneId): string {
  return COMBO_ZONE_TO_ZONE_ID[zone];
}

export function sortComboZones(zones: readonly ComboZoneId[]): ComboZoneId[] {
  const permitted = new Set(zones);
  return COMBO_ZONE_ORDER.filter((zone) => permitted.has(zone));
}
