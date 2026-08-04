import { describe, expect, it } from "vitest";
import { buildFeedbackContext, type BuildFeedbackContextInput } from "./buildFeedbackContext";
import type { FeedbackEnvironmentSnapshot, FeedbackFlowSnapshot } from "./types";

function createEnvironment(): FeedbackEnvironmentSnapshot {
  return {
    userAgent: "Mozilla/5.0 (Test Runner)",
    viewport: { width: 1280, height: 720 },
    route: "/",
    timestamp: 1_700_000_000_000,
    capturedAt: "2023-11-14T22:13:20.000Z",
    buildMode: "test",
    appVersion: "0.0.1"
  };
}

function createFlowSnapshot(): FeedbackFlowSnapshot {
  return {
    screen: "MTG Assistant",
    flowStep: "enrichment",
    question: "Does the trigger still resolve?",
    isConversationActive: true,
    selectedZones: ["stack", "battlefield"],
    gameContext: {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 40 },
        { label: "Player 2", lifeTotal: 37, counters: [{ name: "poison", amount: 3 }] }
      ],
      turnPhase: "combat",
      combatStep: "declare_blockers",
      activePlayer: "Player 1",
      selectedZones: ["stack"]
    },
    zoneCards: {
      stack: [
        {
          cardId: "card-1",
          name: "Lightning Bolt",
          oracleText: "Lightning Bolt deals 3 damage to any target.",
          caster: "Player 1",
          targets: [{ kind: "player", targetPlayer: "Player 2" }],
          contextNotes: "Cast in response"
        }
      ]
    },
    conversation: [
      { role: "user", content: "Who wins the trigger race?" },
      { role: "assistant", content: "The active player's trigger resolves last." }
    ]
  };
}

function createInput(overrides: Partial<BuildFeedbackContextInput> = {}): BuildFeedbackContextInput {
  return {
    flowSnapshot: createFlowSnapshot(),
    providerMode: "mock",
    activeDestinationId: "mtg-assistant",
    environment: createEnvironment(),
    ...overrides
  };
}

describe("Frontend - Feedback", () => {
  describe("buildFeedbackContext", () => {
    it("produces a deep-equal snapshot for deep-equal but distinct inputs", () => {
      const first = buildFeedbackContext(createInput());
      const second = buildFeedbackContext(createInput());

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });

    it("returns a fresh object on every call for the same input reference", () => {
      const input = createInput();

      const first = buildFeedbackContext(input);
      const second = buildFeedbackContext(input);

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
      expect(first.flow).not.toBe(second.flow);
    });

    it("carries shell fields onto the snapshot", () => {
      const context = buildFeedbackContext(
        createInput({ providerMode: "openai", activeDestinationId: "trade-balancer" })
      );

      expect(context.providerMode).toBe("openai");
      expect(context.activeDestinationId).toBe("trade-balancer");
      expect(context.environment).toEqual(createEnvironment());
    });

    it("returns a valid shell-only snapshot when no contributor supplied a flow", () => {
      const context = buildFeedbackContext(createInput({ flowSnapshot: null }));

      expect(context.flow).toBeNull();
      expect(context.activeDestinationId).toBe("mtg-assistant");
      expect(context.providerMode).toBe("mock");
      expect(context.environment.userAgent).toBe("Mozilla/5.0 (Test Runner)");
    });

    it("does not throw for a null flow snapshot and an unknown destination", () => {
      expect(() =>
        buildFeedbackContext(createInput({ flowSnapshot: null, activeDestinationId: null }))
      ).not.toThrow();
    });

    it("carries an empty flow snapshot through as an empty object, not null", () => {
      const context = buildFeedbackContext(createInput({ flowSnapshot: {} }));

      expect(context.flow).toEqual({});
      expect(context.flow).not.toBeNull();
    });

    it("carries screen, step, game context and typed question through unchanged", () => {
      const context = buildFeedbackContext(createInput());

      expect(context.flow?.screen).toBe("MTG Assistant");
      expect(context.flow?.flowStep).toBe("enrichment");
      expect(context.flow?.question).toBe("Does the trigger still resolve?");
      expect(context.flow?.gameContext).toEqual(createFlowSnapshot().gameContext);
    });

    it("carries zones, cards and per-card enrichment through unchanged", () => {
      const context = buildFeedbackContext(createInput());

      expect(context.flow?.selectedZones).toEqual(["stack", "battlefield"]);
      expect(context.flow?.zoneCards).toEqual(createFlowSnapshot().zoneCards);
      expect(context.flow?.zoneCards?.stack?.[0].contextNotes).toBe("Cast in response");
      expect(context.flow?.zoneCards?.stack?.[0].targets).toEqual([
        { kind: "player", targetPlayer: "Player 2" }
      ]);
    });

    it("carries conversation history through unchanged and in order", () => {
      const context = buildFeedbackContext(createInput());

      expect(context.flow?.conversation).toEqual(createFlowSnapshot().conversation);
      expect(context.flow?.conversation?.[0].role).toBe("user");
    });

    it("does not mutate the input flow snapshot", () => {
      const flowSnapshot = createFlowSnapshot();

      buildFeedbackContext(createInput({ flowSnapshot }));

      expect(flowSnapshot).toEqual(createFlowSnapshot());
    });

    it("isolates the snapshot from later mutation of the source flow state", () => {
      const flowSnapshot = createFlowSnapshot();
      const context = buildFeedbackContext(createInput({ flowSnapshot }));

      flowSnapshot.question = "changed after the snapshot was taken";
      flowSnapshot.zoneCards?.stack?.push({
        cardId: "card-2",
        name: "Counterspell",
        oracleText: "Counter target spell."
      });

      expect(context.flow?.question).toBe("Does the trigger still resolve?");
      expect(context.flow?.zoneCards?.stack).toHaveLength(1);
    });

    it("produces a JSON-serializable snapshot for the appState payload field", () => {
      const context = buildFeedbackContext(createInput());

      expect(JSON.parse(JSON.stringify(context))).toEqual(context);
    });
  });
});
