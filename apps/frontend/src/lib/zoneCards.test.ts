import { describe, expect, it } from "vitest";
import type { CardMetadataItem, ZoneCardItem, ZoneId } from "../types";
import {
  appendZoneCard,
  buildZoneCardFromMetadata,
  removeZoneCardById,
  validateZoneCardAdd
} from "./zoneCards";
import { buildAskAiRequest } from "./contextFlow/flow";
import { DUPLICATE_CARD_MESSAGE } from "./stackLimits";

const SAMPLE_CARD: CardMetadataItem = {
  cardId: "opt",
  name: "Opt",
  oracleText: "Scry 1, then draw a card.",
  imageUrl: "",
  manaCost: "{U}",
  manaValue: 1,
  typeLine: "Instant",
  colors: ["U"],
  supertypes: [],
  subtypes: []
};

const BOLT_CARD: CardMetadataItem = {
  ...SAMPLE_CARD,
  cardId: "lightning-bolt",
  name: "Lightning Bolt",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  manaCost: "{R}",
  colors: ["R"]
};

describe("zoneCards", () => {
  it("buildZoneCardFromMetadata copies identity fields", () => {
    const zoneCard = buildZoneCardFromMetadata(SAMPLE_CARD);
    expect(zoneCard.cardId).toBe("opt");
    expect(zoneCard.name).toBe("Opt");
    expect(zoneCard.oracleText).toBe("Scry 1, then draw a card.");
  });

  it("appendZoneCard preserves bottom-to-top stack order", () => {
    const first = buildZoneCardFromMetadata(SAMPLE_CARD);
    const second = buildZoneCardFromMetadata(BOLT_CARD);
    const stack = appendZoneCard(appendZoneCard([], first), second);
    expect(stack.map((card) => card.cardId)).toEqual(["opt", "lightning-bolt"]);
  });

  it("validateZoneCardAdd blocks duplicate cards in stack zone only", () => {
    const card = buildZoneCardFromMetadata(SAMPLE_CARD);
    expect(validateZoneCardAdd([card], card, "stack")).toEqual({
      ok: false,
      message: DUPLICATE_CARD_MESSAGE
    });
    expect(validateZoneCardAdd([card], card, "hand")).toEqual({ ok: true });
  });

  it("removeZoneCardById removes the matching card", () => {
    const first = buildZoneCardFromMetadata(SAMPLE_CARD);
    const second = buildZoneCardFromMetadata(BOLT_CARD);
    const next = removeZoneCardById([first, second], "opt");
    expect(next.map((card) => card.cardId)).toEqual(["lightning-bolt"]);
  });

  it("buildAskAiRequest omits empty zone keys from synced game context", () => {
    const stackCard = buildZoneCardFromMetadata(SAMPLE_CARD);
    const ctx = {
      playerCount: 2,
      players: [
        { label: "Player 1" as const, lifeTotal: 20 },
        { label: "Player 2" as const, lifeTotal: 20 }
      ],
      turnPhase: "main_1" as const,
      selectedZones: ["stack", "hand", "battlefield"] as ZoneId[],
      zones: {
        stack: [stackCard],
        hand: [] as ZoneCardItem[],
        battlefield: [buildZoneCardFromMetadata(BOLT_CARD)]
      }
    };

    const payload = buildAskAiRequest("What resolves?", ctx);
    expect(payload.gameContext.zones?.stack?.map((card) => card.cardId)).toEqual(["opt"]);
    expect(payload.gameContext.zones?.battlefield?.map((card) => card.name)).toEqual(["Lightning Bolt"]);
    expect(payload.gameContext.zones).not.toHaveProperty("hand");
  });
});
