import { Dispatch, SetStateAction, useState } from "react";
import type { ContextTarget, PlayerLabel, ZoneCardItem, ZoneId } from "../types";

type ContextCardEntry = { zone: ZoneId; cardId: string; cardName: string };

/** REQ-021 (ui-reimagining-build, amended): a single Targets picker replaces the prior
 * kind → value → Add three-step row. These are the non-player/non-card option values
 * the `<select>` carries; a player option is `player:<PlayerLabel>` and a card option
 * is `card:<zone>:<cardId>`. */
export const TARGET_OPTION_NONE = "none";
export const TARGET_OPTION_BOARD = "other:Just on the board";
export const TARGET_OPTION_ALL_PLAYERS = "other:All players";
export const TARGET_OPTION_CUSTOM = "other:__custom__";

const EXCLUSIVE_OTHER_DESCRIPTIONS = new Set(["Just on the board", "All players"]);

function isExclusiveTarget(target: ContextTarget): boolean {
  return target.kind === "none" || (target.kind === "other" && EXCLUSIVE_OTHER_DESCRIPTIONS.has(target.targetDescription));
}

type UseEnrichmentTargetsParams = {
  activePlayers: PlayerLabel[];
  contextIndex: ContextCardEntry[];
  updateZoneCard: (zone: ZoneId, instanceId: string, updates: Partial<ZoneCardItem>) => void;
};

type UseEnrichmentTargetsResult = {
  pendingCustomTextByKey: Record<string, string>;
  setPendingCustomTextByKey: Dispatch<SetStateAction<Record<string, string>>>;
  isAwaitingCustomTarget: (key: string) => boolean;
  handleSelectTargetOption: (zone: ZoneId, card: ZoneCardItem, key: string, value: string) => void;
  handleConfirmCustomTarget: (zone: ZoneId, card: ZoneCardItem, key: string) => void;
  handleCancelCustomTarget: (key: string) => void;
  handleRemoveTarget: (zone: ZoneId, card: ZoneCardItem, targetIndex: number) => void;
};

/**
 * One Targets picker (REQ-021 amended): No target · Just on the board · each player ·
 * All players · every other card in context · Something else (one line). Every pick
 * maps onto today's four `ContextTarget` kinds with no request-shape change; the
 * picker itself carries no selected value, so it reads as "Add another target…" again
 * after each pick.
 */
export function useEnrichmentTargets({
  activePlayers,
  contextIndex,
  updateZoneCard
}: UseEnrichmentTargetsParams): UseEnrichmentTargetsResult {
  const [pendingCustomTextByKey, setPendingCustomTextByKey] = useState<Record<string, string>>({});
  const [awaitingCustomByKey, setAwaitingCustomByKey] = useState<Record<string, boolean>>({});

  function isAwaitingCustomTarget(key: string): boolean {
    return awaitingCustomByKey[key] ?? false;
  }

  function replaceTargets(zone: ZoneId, card: ZoneCardItem, targets: ContextTarget[]): void {
    updateZoneCard(zone, card.instanceId ?? card.cardId, { targets });
  }

  function handleSelectTargetOption(zone: ZoneId, card: ZoneCardItem, key: string, value: string): void {
    if (!value) return;

    if (value === TARGET_OPTION_CUSTOM) {
      setAwaitingCustomByKey((c) => ({ ...c, [key]: true }));
      return;
    }

    setAwaitingCustomByKey((c) => ({ ...c, [key]: false }));

    if (value === TARGET_OPTION_NONE) {
      replaceTargets(zone, card, [{ kind: "none" }]);
      return;
    }

    if (value === TARGET_OPTION_BOARD) {
      replaceTargets(zone, card, [{ kind: "other", targetDescription: "Just on the board" }]);
      return;
    }

    if (value === TARGET_OPTION_ALL_PLAYERS) {
      replaceTargets(zone, card, [{ kind: "other", targetDescription: "All players" }]);
      return;
    }

    const existing = (card.targets ?? []).filter((target) => !isExclusiveTarget(target));

    if (value.startsWith("player:")) {
      const targetPlayer = value.slice("player:".length) as PlayerLabel;
      const alreadyPicked = existing.some((target) => target.kind === "player" && target.targetPlayer === targetPlayer);
      const next: ContextTarget[] = alreadyPicked
        ? existing
        : [...existing, { kind: "player", targetPlayer }];

      const pickedPlayers = new Set(
        next.filter((target): target is Extract<ContextTarget, { kind: "player" }> => target.kind === "player")
          .map((target) => target.targetPlayer)
      );
      const everyPickIsAPlayer = next.every((target) => target.kind === "player");
      if (everyPickIsAPlayer && activePlayers.length > 0 && activePlayers.every((player) => pickedPlayers.has(player))) {
        replaceTargets(zone, card, [{ kind: "other", targetDescription: "All players" }]);
        return;
      }

      replaceTargets(zone, card, next);
      return;
    }

    if (value.startsWith("card:")) {
      const [, cardZone, cardId] = value.split(":");
      const entry = contextIndex.find((candidate) => candidate.zone === cardZone && candidate.cardId === cardId);
      if (!entry) return;
      const alreadyPicked = existing.some(
        (target) => target.kind === "card" && target.cardId === entry.cardId && target.zone === entry.zone
      );
      const next: ContextTarget[] = alreadyPicked
        ? existing
        : [...existing, { kind: "card", zone: entry.zone, cardId: entry.cardId, cardName: entry.cardName }];
      replaceTargets(zone, card, next);
    }
  }

  function handleConfirmCustomTarget(zone: ZoneId, card: ZoneCardItem, key: string): void {
    const text = (pendingCustomTextByKey[key] ?? "").trim().slice(0, 200);
    if (!text) return;
    const existing = (card.targets ?? []).filter((target) => !isExclusiveTarget(target));
    replaceTargets(zone, card, [...existing, { kind: "other", targetDescription: text }]);
    setPendingCustomTextByKey((c) => ({ ...c, [key]: "" }));
    setAwaitingCustomByKey((c) => ({ ...c, [key]: false }));
  }

  function handleCancelCustomTarget(key: string): void {
    setPendingCustomTextByKey((c) => ({ ...c, [key]: "" }));
    setAwaitingCustomByKey((c) => ({ ...c, [key]: false }));
  }

  function handleRemoveTarget(zone: ZoneId, card: ZoneCardItem, targetIndex: number): void {
    updateZoneCard(zone, card.instanceId ?? card.cardId, {
      targets: (card.targets ?? []).filter((_, i) => i !== targetIndex)
    });
  }

  return {
    pendingCustomTextByKey,
    setPendingCustomTextByKey,
    isAwaitingCustomTarget,
    handleSelectTargetOption,
    handleConfirmCustomTarget,
    handleCancelCustomTarget,
    handleRemoveTarget
  };
}
