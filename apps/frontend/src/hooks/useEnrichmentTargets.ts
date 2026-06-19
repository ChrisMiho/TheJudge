import { Dispatch, SetStateAction, useState } from "react";
import type { ContextTarget, PlayerLabel, ZoneCardItem, ZoneId } from "../types";

type PendingTargetKind = ContextTarget["kind"];

type ContextCardEntry = { zone: ZoneId; cardId: string; cardName: string };

type UseEnrichmentTargetsParams = {
  activePlayers: PlayerLabel[];
  contextIndex: ContextCardEntry[];
  updateZoneCard: (zone: ZoneId, cardId: string, updates: Partial<ZoneCardItem>) => void;
};

type UseEnrichmentTargetsResult = {
  pendingKindByKey: Record<string, PendingTargetKind>;
  setPendingKindByKey: Dispatch<SetStateAction<Record<string, PendingTargetKind>>>;
  pendingPlayerByKey: Record<string, PlayerLabel>;
  setPendingPlayerByKey: Dispatch<SetStateAction<Record<string, PlayerLabel>>>;
  pendingCardIdByKey: Record<string, string>;
  setPendingCardIdByKey: Dispatch<SetStateAction<Record<string, string>>>;
  pendingOtherByKey: Record<string, string>;
  setPendingOtherByKey: Dispatch<SetStateAction<Record<string, string>>>;
  getPendingKind: (key: string) => PendingTargetKind;
  getPendingPlayer: (key: string) => PlayerLabel;
  handleAddTarget: (zone: ZoneId, card: ZoneCardItem, key: string) => void;
  handleRemoveTarget: (zone: ZoneId, card: ZoneCardItem, targetIndex: number) => void;
};

export function useEnrichmentTargets({
  activePlayers,
  contextIndex,
  updateZoneCard
}: UseEnrichmentTargetsParams): UseEnrichmentTargetsResult {
  const [pendingKindByKey, setPendingKindByKey] = useState<Record<string, PendingTargetKind>>({});
  const [pendingPlayerByKey, setPendingPlayerByKey] = useState<Record<string, PlayerLabel>>({});
  const [pendingCardIdByKey, setPendingCardIdByKey] = useState<Record<string, string>>({});
  const [pendingOtherByKey, setPendingOtherByKey] = useState<Record<string, string>>({});

  function getPendingKind(key: string): PendingTargetKind {
    return pendingKindByKey[key] ?? "player";
  }

  function getPendingPlayer(key: string): PlayerLabel {
    return pendingPlayerByKey[key] ?? (activePlayers[1] ?? activePlayers[0] ?? "Player 2");
  }

  function handleAddTarget(zone: ZoneId, card: ZoneCardItem, key: string): void {
    const kind = getPendingKind(key);
    let newTarget: ContextTarget;

    if (kind === "player") {
      newTarget = { kind: "player", targetPlayer: getPendingPlayer(key) };
    } else if (kind === "card") {
      const selectedCardId = pendingCardIdByKey[key] ?? "";
      const entry = contextIndex.find((e) => e.cardId === selectedCardId);
      if (!entry) return;
      newTarget = { kind: "card", zone: entry.zone, cardId: entry.cardId, cardName: entry.cardName };
      setPendingCardIdByKey((c) => ({ ...c, [key]: "" }));
    } else if (kind === "other") {
      const text = (pendingOtherByKey[key] ?? "").trim();
      if (!text) return;
      newTarget = { kind: "other", targetDescription: text };
      setPendingOtherByKey((c) => ({ ...c, [key]: "" }));
    } else {
      newTarget = { kind: "none" };
    }

    updateZoneCard(zone, card.cardId, {
      targets: [...(card.targets ?? []), newTarget]
    });
  }

  function handleRemoveTarget(zone: ZoneId, card: ZoneCardItem, targetIndex: number): void {
    updateZoneCard(zone, card.cardId, {
      targets: (card.targets ?? []).filter((_, i) => i !== targetIndex)
    });
  }

  return {
    pendingKindByKey,
    setPendingKindByKey,
    pendingPlayerByKey,
    setPendingPlayerByKey,
    pendingCardIdByKey,
    setPendingCardIdByKey,
    pendingOtherByKey,
    setPendingOtherByKey,
    getPendingKind,
    getPendingPlayer,
    handleAddTarget,
    handleRemoveTarget
  };
}
