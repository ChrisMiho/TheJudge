import type { ContextTarget, PlayerLabel, ZoneId } from "../types";
import { formatPlayerDisplayLabel } from "./playerLabels";
import { ZONE_LABELS } from "./zoneLabels";
import { NON_STACK_ZONES_WITH_OWNER } from "./contextFlow";

export function parseManaSpent(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
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
