import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app/createApp.js";
import type { CardPrintingPricesEntry } from "../cardPrices.js";

const URZA_PRICES: CardPrintingPricesEntry = {
  snapshotDate: "2026-09-08T00:00:00.000Z",
  printings: [
    {
      id: "aaaaaaaa-0000-0000-0000-000000000001",
      set: "brc",
      setName: "The Brothers' War Commander",
      collectorNumber: "1",
      usd: 12.34,
      usdFoil: null
    }
  ]
};

describe("Backend - GET /api/cards/:oracleId/prices", () => {
  it("returns one card's printings, prices, and snapshot date by oracle id", async () => {
    const app = createApp({ cardPrintingPricesIndex: new Map([["urza-oracle-id", URZA_PRICES]]) });

    const response = await request(app).get("/api/cards/urza-oracle-id/prices");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      oracleId: "urza-oracle-id",
      snapshotDate: URZA_PRICES.snapshotDate,
      printings: URZA_PRICES.printings
    });
  });

  it("returns a not-found response for an unknown oracle id", async () => {
    const app = createApp({ cardPrintingPricesIndex: new Map([["urza-oracle-id", URZA_PRICES]]) });

    const response = await request(app).get("/api/cards/no-such-card/prices");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "card_not_found" });
  });

  it("returns a not-found response with no cardPrintingPricesIndex configured (mock-default dev), with no runtime network call", async () => {
    const app = createApp({});

    const response = await request(app).get("/api/cards/urza-oracle-id/prices");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "card_not_found" });
  });
});
