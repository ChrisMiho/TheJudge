import { describe, expect, it } from "vitest";
import type { GameContext, ZoneCardItem } from "../../types";
import { buildAskAiRequest, buildEnrichmentQueue, canAdvance } from "./flow";

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
    oracleText: ""
  };
}

// ── canAdvance ──────────────────────────────────────────────────────────────

describe("canAdvance", () => {
  it("game-setup: returns true when players have valid life totals", () => {
    expect(
      canAdvance("game-setup", {
        gameContext: {
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
          ]
        }
      })
    ).toBe(true);
  });

  it("game-setup: returns false when fewer than 2 players", () => {
    expect(
      canAdvance("game-setup", {
        gameContext: {
          players: [{ label: "Player 1", lifeTotal: 20 }]
        }
      })
    ).toBe(false);
  });

  it("game-setup: returns false when a player has NaN life total", () => {
    expect(
      canAdvance("game-setup", {
        gameContext: {
          players: [
            { label: "Player 1", lifeTotal: NaN },
            { label: "Player 2", lifeTotal: 20 }
          ]
        }
      })
    ).toBe(false);
  });

  it("game-setup: returns false when players is undefined", () => {
    expect(canAdvance("game-setup", { gameContext: {} })).toBe(false);
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

  it("zone-collection: always returns true (no min card count)", () => {
    expect(canAdvance("zone-collection", { gameContext: {} })).toBe(true);
  });

  it("enrichment: always returns true", () => {
    expect(canAdvance("enrichment", { gameContext: {} })).toBe(true);
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
    const payload = buildAskAiRequest("  Does this resolve?  ", BASE_GAME_CONTEXT);
    expect(payload.question).toBe("Does this resolve?");
  });

  it("falls back to default question when question is blank", () => {
    const payload = buildAskAiRequest("", BASE_GAME_CONTEXT);
    expect(payload.question).toBe("Resolve the stack");
  });

  it("falls back to default question when question is only whitespace", () => {
    const payload = buildAskAiRequest("   ", BASE_GAME_CONTEXT);
    expect(payload.question).toBe("Resolve the stack");
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
});
