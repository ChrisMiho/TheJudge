import { useEffect, useState } from "react";
import { fetchCardDetail, peekCardDetail, type CardDetailBlock } from "../lib/cardDetail";

/**
 * One card's descriptive block (type line, mana cost) for a sheet's header line, read through
 * the same on-demand `GET /api/cards/:oracleId` path and session cache the card detail popup
 * uses (REQ-175, FLOW-024) — no new endpoint. `undefined` while it loads or when the request
 * fails; `null` when the card has no block.
 */
export function useCardDetailBlock(cardId: string | undefined): CardDetailBlock | null | undefined {
  const [block, setBlock] = useState<CardDetailBlock | null | undefined>(() =>
    cardId ? peekCardDetail(cardId) : undefined
  );

  useEffect(() => {
    if (!cardId) {
      setBlock(undefined);
      return undefined;
    }
    const cached = peekCardDetail(cardId);
    if (cached !== undefined) {
      setBlock(cached);
      return undefined;
    }
    setBlock(undefined);
    let cancelled = false;
    fetchCardDetail(cardId)
      .then((detail) => {
        if (!cancelled) setBlock(detail);
      })
      .catch(() => {
        // A failed lookup leaves the header line out; it is not a gate.
      });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  return block;
}
