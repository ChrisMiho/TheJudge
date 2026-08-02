import { describe, expect, it } from "vitest";
import type { CardMetadataItem, ZoneCardItem, ZoneId } from "../types";
import {
  appendZoneCard,
  buildZoneCardFromMetadata,
  removeZoneCardByInstanceId,
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

describe("Frontend - MTG Assistant", () => {
describe("zoneCards", () => {
  it("buildZoneCardFromMetadata copies identity fields", () => {
    const zoneCard = buildZoneCardFromMetadata(SAMPLE_CARD);
    expect(zoneCard.cardId).toBe("opt");
    expect(zoneCard.name).toBe("Opt");
    expect(zoneCard.oracleText).toBe("Scry 1, then draw a card.");
  });

  it("buildZoneCardFromMetadata uses scanImageUrl override when provided", () => {
    const card: CardMetadataItem = { ...SAMPLE_CARD, imageUrl: "https://img/opt-oracle.jpg" };
    const scannedUrl = "https://img/opt-print.jpg";
    const zoneCard = buildZoneCardFromMetadata(card, scannedUrl);
    expect(zoneCard.imageUrl).toBe(scannedUrl);
  });

  it("buildZoneCardFromMetadata falls back to card.imageUrl when scanImageUrl is omitted", () => {
    const card: CardMetadataItem = { ...SAMPLE_CARD, imageUrl: "https://img/opt-oracle.jpg" };
    const zoneCard = buildZoneCardFromMetadata(card);
    expect(zoneCard.imageUrl).toBe("https://img/opt-oracle.jpg");
  });

  it("buildZoneCardFromMetadata does not carry non-image fields from oracle into printed override", () => {
    const card: CardMetadataItem = { ...SAMPLE_CARD, imageUrl: "https://img/opt-oracle.jpg" };
    const scannedUrl = "https://img/opt-print.jpg";
    const zoneCard = buildZoneCardFromMetadata(card, scannedUrl);
    // Only imageUrl is overridden; identity fields stay oracle-level
    expect(zoneCard.cardId).toBe(card.cardId);
    expect(zoneCard.name).toBe(card.name);
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

  it("buildZoneCardFromMetadata assigns a unique instanceId per call", () => {
    const a = buildZoneCardFromMetadata(SAMPLE_CARD);
    const b = buildZoneCardFromMetadata(SAMPLE_CARD);
    expect(a.instanceId).toBeDefined();
    expect(b.instanceId).toBeDefined();
    expect(a.instanceId).not.toBe(b.instanceId);
  });

  it("removeZoneCardByInstanceId removes only the matching instance, leaving same-cardId duplicate intact", () => {
    const copy1 = buildZoneCardFromMetadata(SAMPLE_CARD);
    const copy2 = buildZoneCardFromMetadata(SAMPLE_CARD);
    const result = removeZoneCardByInstanceId([copy1, copy2], copy1.instanceId!);
    expect(result).toHaveLength(1);
    expect(result[0]?.instanceId).toBe(copy2.instanceId);
    expect(result[0]?.cardId).toBe("opt");
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
});
