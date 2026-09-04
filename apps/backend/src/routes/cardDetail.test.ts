import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app/createApp.js";
import type { CardDetailEntry } from "../cardDetail.js";

const URZA_DETAIL: CardDetailEntry = {
  oracleText: "When Urza enters, create a Construct artifact creature token.",
  typeLine: "Legendary Creature — Human Artificer",
  manaCost: "{2}{U}{U}",
  manaValue: 4,
  colors: ["U"],
  supertypes: ["Legendary"],
  subtypes: ["Human", "Artificer"]
};

describe("Backend - GET /api/cards/:oracleId", () => {
  it("returns one card's descriptive block by oracle id", async () => {
    const app = createApp({ cardDetailIndex: new Map([["urza-oracle-id", URZA_DETAIL]]) });

    const response = await request(app).get("/api/cards/urza-oracle-id");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(URZA_DETAIL);
  });

  it("returns a not-found response for an unknown oracle id", async () => {
    const app = createApp({ cardDetailIndex: new Map([["urza-oracle-id", URZA_DETAIL]]) });

    const response = await request(app).get("/api/cards/no-such-card");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "card_not_found" });
  });

  it("returns a not-found response with no cardDetailIndex configured (mock-default dev)", async () => {
    const app = createApp({});

    const response = await request(app).get("/api/cards/urza-oracle-id");

    expect(response.status).toBe(404);
  });
});
