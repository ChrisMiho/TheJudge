import type { ContextTarget, PlayerLabel, ZoneId } from "../types";
import { formatPlayerDisplayLabel } from "./playerLabels";
import { ZONE_LABELS } from "./zoneLabels";
import { NON_STACK_ZONES_WITH_OWNER } from "./contextFlow";

/** Bound matches `zoneCardItemSchema.manaSpent` (0–99) on every zone (REQ-210). */
export function parseManaSpent(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 && n <= 99 ? n : undefined;
}

/** REQ-210: the Mana spent box's hint text, preferring the printed mana cost symbols
 * ("printed {R}") and falling back to the printed mana value when no cost string is
 * known. Undefined when the card carries neither — the box then prefills and hints
 * nothing, same as an unidentified card today. */
export function formatPrintedManaHint(card: { manaCost?: string; manaValue?: number }): string | undefined {
  if (card.manaCost && card.manaCost.trim().length > 0) {
    return `printed ${card.manaCost}`;
  }
  if (card.manaValue !== undefined) {
    return `printed ${card.manaValue}`;
  }
  return undefined;
}

export function formatContextTarget(target: ContextTarget, displayNamesByPlayer: Record<PlayerLabel, string | undefined>): string {
  if (target.kind === "player") {
    return `Player: ${formatPlayerDisplayLabel(target.targetPlayer, displayNamesByPlayer[target.targetPlayer])}`;
  }
  if (target.kind === "card") return `${ZONE_LABELS[target.zone]}: ${target.cardName}`;
  if (target.kind === "other") return `Other: ${target.targetDescription}`;
  return "No specific target";
}

export function hasOwnerControl(zone: ZoneId): boolean {
  return NON_STACK_ZONES_WITH_OWNER.includes(zone as Exclude<ZoneId, "stack">);
}
