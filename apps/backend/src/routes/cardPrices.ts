import type { Express, Request, Response } from "express";
import type { CardPrintingPricesEntry } from "../cardPrices.js";

export type CardPricesRouteDeps = {
  cardPrintingPricesIndex: Map<string, CardPrintingPricesEntry>;
};

/**
 * `GET /api/cards/:oracleId/prices` (REQ-066, REQ-175, BLOCK-01 = A) — a
 * read-only sibling to `GET /api/cards/:oracleId`, the product's third
 * product-facing endpoint (NFR-004). Serves one card's printings and prices
 * by Scryfall `oracle_id` from the committed price artifact, kept on its own
 * route so the card-detail/ask-ai path never carries price bytes and the
 * balancer never carries rules text. No runtime network call:
 * `ASK_AI_PROVIDER=mock` local dev works unchanged.
 *
 * The Trade Balancer fetches one card's prices on add and caches the result
 * for the session (FLOW-025).
 */
export function registerCardPricesRoute(app: Express, deps: CardPricesRouteDeps): void {
  const { cardPrintingPricesIndex } = deps;

  app.get("/api/cards/:oracleId/prices", (req: Request, res: Response) => {
    const oracleId = req.params.oracleId?.trim() ?? "";
    const entry = oracleId.length > 0 ? cardPrintingPricesIndex.get(oracleId) : undefined;

    if (!entry) {
      res.status(404).json({ error: "card_not_found" });
      return;
    }

    res.status(200).json({
      oracleId,
      snapshotDate: entry.snapshotDate,
      printings: entry.printings
    });
  });
}
