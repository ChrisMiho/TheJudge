import type { Express, Request, Response } from "express";
import type { CardDetailEntry } from "../cardDetail.js";

export type CardDetailRouteDeps = {
  cardDetailIndex: Map<string, CardDetailEntry>;
};

/**
 * `GET /api/cards/:oracleId` (REQ-175, D5) — the product's second
 * product-facing endpoint, read-only, serving one card's descriptive block by
 * Scryfall `oracle_id` from the committed card-detail artifact. No runtime
 * network call: `ASK_AI_PROVIDER=mock` local dev works unchanged.
 *
 * The card-detail popup and Quick Lookup pre-submit preview fetch per card on
 * first open and cache the result for the session (FLOW-024).
 */
export function registerCardDetailRoute(app: Express, deps: CardDetailRouteDeps): void {
  const { cardDetailIndex } = deps;

  app.get("/api/cards/:oracleId", (req: Request, res: Response) => {
    const oracleId = req.params.oracleId?.trim() ?? "";
    const entry = oracleId.length > 0 ? cardDetailIndex.get(oracleId) : undefined;

    if (!entry) {
      res.status(404).json({ error: "card_not_found" });
      return;
    }

    res.status(200).json(entry satisfies CardDetailEntry);
  });
}
