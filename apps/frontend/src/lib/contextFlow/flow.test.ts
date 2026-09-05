import { describe, expect, it } from "vitest";
import type { CardMetadataItem, GameContext, ZoneCardItem } from "../../types";
import {
  buildAskAiRequest,
  buildEnrichmentQueue,
  buildLookupAskAiRequest,
  canAdvance,
  hasAtLeastOneCardInSelectedZones
} from "./flow";

// ── Shared test fixtures ────────────────────────────────────────────────────

const BASE_GAME_CONTEXT: GameContext = {
  playerCount: 2,
  players: [
    { label: "Player 1", lifeTotal: 20 },
    { label: "Player 2", lifeTotal: 20 }
  ],
  turnPhase: "main_1",
  selectedZones: ["battlefield", "stack"]
};

function makeCard(id: string, name = id): ZoneCardItem {
  return {
    cardId: id,
    name,
  };
}

// ── canAdvance ──────────────────────────────────────────────────────────────

describe("Frontend - MTG Assistant", () => {
describe("canAdvance", () => {
  it("game-context: returns true when players have valid life totals", () => {
    expect(
      canAdvance("game-context", {
        gameContext: {
          turnPhase: "main_1",
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
          ]
        }
      })
    ).toBe(true);
  });

  it("game-context: returns false when fewer than 2 players", () => {
    expect(
      canAdvance("game-context", {
        gameContext: {
          turnPhase: "main_1",
          players: [{ label: "Player 1", lifeTotal: 20 }]
        }
      })
    ).toBe(false);
  });

  it("game-context: returns false when a player has NaN life total", () => {
    expect(
      canAdvance("game-context", {
        gameContext: {
          turnPhase: "main_1",
          players: [
            { label: "Player 1", lifeTotal: NaN },
            { label: "Player 2", lifeTotal: 20 }
          ]
        }
      })
    ).toBe(false);
  });

  it("game-context: returns false when players is undefined", () => {
    expect(canAdvance("game-context", { gameContext: { turnPhase: "main_1" } })).toBe(false);
  });

  it("game-context: returns false when turnPhase is undefined", () => {
    expect(
      canAdvance("game-context", {
        gameContext: {
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
          ]
        }
      })
    ).toBe(false);
  });

  it("zone-confirm: returns true when at least one zone selected", () => {
    expect(
      canAdvance("zone-confirm", {
        gameContext: { selectedZones: ["battlefield"] }
      })
    ).toBe(true);
  });

  it("zone-confirm: returns false when selectedZones is empty", () => {
    expect(
      canAdvance("zone-confirm", {
        gameContext: { selectedZones: [] }
      })
    ).toBe(false);
  });

  it("zone-confirm: returns false when selectedZones is undefined", () => {
    expect(canAdvance("zone-confirm", { gameContext: {} })).toBe(false);
  });

  it("zone-collection: returns false when selected zones have no cards", () => {
    expect(
      canAdvance("zone-collection", {
        gameContext: { selectedZones: ["stack", "battlefield"], zones: { stack: [], battlefield: [] } }
      })
    ).toBe(false);
  });

  it("zone-collection: returns true when one selected zone has a card", () => {
    expect(
      canAdvance("zone-collection", {
        gameContext: {
          selectedZones: ["stack", "battlefield"],
          zones: { stack: [], battlefield: [makeCard("bf-1")] }
        }
      })
    ).toBe(true);
  });

  it("enrichment: returns false when all selected-zone cards were removed", () => {
    expect(
      canAdvance("enrichment", {
        gameContext: { selectedZones: ["stack"], zones: { stack: [] } }
      })
    ).toBe(false);
  });

  it("enrichment: returns true when one selected zone has a card", () => {
    expect(
      canAdvance("enrichment", {
        gameContext: {
          selectedZones: ["stack", "hand"],
          zones: { stack: [makeCard("stack-1")], hand: [] }
        }
      })
    ).toBe(true);
  });
});

// ── hasAtLeastOneCardInSelectedZones ───────────────────────────────────────

describe("hasAtLeastOneCardInSelectedZones", () => {
  it("returns false when no selected zone has cards", () => {
    expect(hasAtLeastOneCardInSelectedZones(["stack", "battlefield"], { stack: [], battlefield: [] })).toBe(false);
  });

  it("returns true when any selected zone has at least one card", () => {
    expect(hasAtLeastOneCardInSelectedZones(["stack", "battlefield"], { stack: [], battlefield: [makeCard("bf-1")] })).toBe(true);
  });

  it("ignores cards in unselected zones", () => {
    expect(hasAtLeastOneCardInSelectedZones(["stack"], { battlefield: [makeCard("bf-1")] })).toBe(false);
  });
});

// ── buildEnrichmentQueue ────────────────────────────────────────────────────

describe("buildEnrichmentQueue", () => {
  it("returns empty array when no zones are populated", () => {
    const result = buildEnrichmentQueue({ ...BASE_GAME_CONTEXT, zones: {} });
    expect(result).toEqual([]);
  });

  it("returns cards in canonical zone order", () => {
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: {
        hand: [makeCard("hand-1")],
        stack: [makeCard("stack-1")],
        battlefield: [makeCard("bf-1")]
      }
    };
    const result = buildEnrichmentQueue(ctx);
    const zones = result.map((e) => e.zone);
    expect(zones).toEqual(["stack", "battlefield", "hand"]);
  });

  it("includes all cards from multi-card zones", () => {
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: {
        stack: [makeCard("s1"), makeCard("s2"), makeCard("s3")]
      }
    };
    const result = buildEnrichmentQueue(ctx);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.card.cardId)).toEqual(["s1", "s2", "s3"]);
  });

  it("preserves card data on each entry", () => {
    const card = makeCard("c1", "Lightning Bolt");
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: { stack: [card] }
    };
    const [entry] = buildEnrichmentQueue(ctx);
    expect(entry?.zone).toBe("stack");
    expect(entry?.card).toEqual(card);
  });

  it("is stable: same input produces same order", () => {
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: {
        graveyard: [makeCard("g1")],
        hand: [makeCard("h1")],
        battlefield: [makeCard("b1")]
      }
    };
    const first = buildEnrichmentQueue(ctx).map((e) => e.card.cardId);
    const second = buildEnrichmentQueue(ctx).map((e) => e.card.cardId);
    expect(first).toEqual(second);
  });

  it("back navigation does not mutate state: gameContext is not modified", () => {
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: { stack: [makeCard("s1")] }
    };
    const originalZones = { ...ctx.zones };
    buildEnrichmentQueue(ctx);
    expect(ctx.zones).toEqual(originalZones);
  });
});

// ── buildAskAiRequest ───────────────────────────────────────────────────────

describe("buildAskAiRequest", () => {
  it("omits zone keys that have empty arrays", () => {
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: {
        stack: [makeCard("s1")],
        hand: [],
        battlefield: []
      }
    };
    const payload = buildAskAiRequest("What happens?", ctx);
    expect(payload.gameContext.zones).not.toHaveProperty("hand");
    expect(payload.gameContext.zones).not.toHaveProperty("battlefield");
    expect(payload.gameContext.zones).toHaveProperty("stack");
  });

  it("omits zones object entirely when all zones are empty", () => {
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: { hand: [], battlefield: [] }
    };
    const payload = buildAskAiRequest("test", ctx);
    expect(Object.keys(payload.gameContext.zones ?? {})).toHaveLength(0);
  });

  it("preserves non-empty zones", () => {
    const card = makeCard("s1");
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: { stack: [card] }
    };
    const payload = buildAskAiRequest("test", ctx);
    expect(payload.gameContext.zones?.stack).toEqual([card]);
  });

  it("uses trimmed question when provided", () => {
    const payload = buildAskAiRequest("  Does this resolve?  ", {
      ...BASE_GAME_CONTEXT,
      zones: { battlefield: [makeCard("bf-1")] }
    });
    expect(payload.question).toBe("Does this resolve?");
  });

  it("falls back to stack resolution when stack has cards and question is blank", () => {
    const payload = buildAskAiRequest("", {
      ...BASE_GAME_CONTEXT,
      zones: { stack: [makeCard("s1")] }
    });
    expect(payload.question).toBe("Resolve the stack");
  });

  it("falls back to board-state interaction when only non-stack zones have cards and question is blank", () => {
    const payload = buildAskAiRequest("   ", {
      ...BASE_GAME_CONTEXT,
      zones: { battlefield: [makeCard("bf-1")], stack: [] }
    });
    expect(payload.question).toBe("Explain the interaction with the provided game state");
  });

  it("falls back to stack resolution when stack and battlefield both have cards", () => {
    const payload = buildAskAiRequest("", {
      ...BASE_GAME_CONTEXT,
      zones: { battlefield: [makeCard("bf-1")], stack: [makeCard("s1")] }
    });
    expect(payload.question).toBe("Resolve the stack");
  });

  it("strips instanceId from every zone card before serialization", () => {
    const card: ZoneCardItem = { instanceId: "inst-abc", cardId: "s1", name: "s1", oracleText: "" };
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: { stack: [card] }
    };
    const payload = buildAskAiRequest("test", ctx);
    const wireCard = payload.gameContext.zones?.stack?.[0];
    expect(wireCard).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(wireCard, "instanceId")).toBe(false);
  });

  it("does not mutate the input gameContext", () => {
    const ctx: GameContext = {
      ...BASE_GAME_CONTEXT,
      zones: { stack: [makeCard("s1")], hand: [] }
    };
    const originalZones = { ...ctx.zones };
    buildAskAiRequest("test", ctx);
    expect(ctx.zones).toEqual(originalZones);
  });

  it("passthrough: gameContext fields other than zones are preserved", () => {
    const payload = buildAskAiRequest("test", BASE_GAME_CONTEXT);
    expect(payload.gameContext.playerCount).toBe(2);
    expect(payload.gameContext.turnPhase).toBe("main_1");
    expect(payload.gameContext.selectedZones).toEqual(["battlefield", "stack"]);
  });

  it("defaults missing turnPhase to main_1 before sending", () => {
    const ctxWithoutPhase = {
      playerCount: BASE_GAME_CONTEXT.playerCount,
      players: BASE_GAME_CONTEXT.players,
      selectedZones: BASE_GAME_CONTEXT.selectedZones
    };
    const payload = buildAskAiRequest("test", ctxWithoutPhase as GameContext);
    expect(payload.gameContext.turnPhase).toBe("main_1");
  });
});

describe("buildLookupAskAiRequest", () => {
  const lookupCard: CardMetadataItem = {
    cardId: "oracle-lightning-bolt",
    name: "Lightning Bolt",
    imageUrl: "https://cards.example/lightning-bolt.jpg",
    colors: ["R"],
  };

  it("builds a trimmed lookup payload without a card", () => {
    expect(buildLookupAskAiRequest("  How does priority work?  ")).toEqual({
      mode: "lookup",
      question: "How does priority work?"
    });
  });

  it("includes only lookup-card wire fields and preserves conversation history", () => {
    const cardWithFrontendField = {
      ...lookupCard,
      instanceId: "frontend-only"
    } as CardMetadataItem & { instanceId: string };
    const conversationHistory = [
      { role: "user" as const, content: "First question" },
      { role: "assistant" as const, content: "First answer" }
    ];

    const payload = buildLookupAskAiRequest("Follow up", [cardWithFrontendField], conversationHistory);

    // REQ-176: the descriptive block is resolved server-side by cardId now —
    // only identity and the image go on the wire.
    expect(payload).toEqual({
      mode: "lookup",
      question: "Follow up",
      cards: [{ cardId: lookupCard.cardId, name: lookupCard.name, imageUrl: lookupCard.imageUrl }],
      conversationHistory
    });
    expect(payload.cards?.[0]).not.toHaveProperty("instanceId");
    expect(payload.cards?.[0]).not.toHaveProperty("oracleText");
  });

  it("builds a bounded multi-card lookup payload, in submitted order (REQ-167)", () => {
    const secondCard: CardMetadataItem = {
      cardId: "oracle-counterspell",
      name: "Counterspell",
      imageUrl: "https://cards.example/counterspell.jpg",
      colors: ["U"],
    };

    const payload = buildLookupAskAiRequest("How do these interact?", [lookupCard, secondCard]);

    expect(payload).toEqual({
      mode: "lookup",
      question: "How do these interact?",
      cards: [
        { cardId: lookupCard.cardId, name: lookupCard.name, imageUrl: lookupCard.imageUrl },
        { cardId: secondCard.cardId, name: secondCard.name, imageUrl: secondCard.imageUrl }
      ]
    });
  });
});
});
