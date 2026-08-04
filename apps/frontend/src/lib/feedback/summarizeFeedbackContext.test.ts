import { describe, expect, it } from "vitest";
import { summarizeFeedbackContext } from "./summarizeFeedbackContext";
import type { FeedbackContext, FeedbackEnvironmentSnapshot, FeedbackFlowSnapshot } from "./types";

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

function createContext(flow: FeedbackFlowSnapshot | null): FeedbackContext {
  return {
    activeDestinationId: "mtg-assistant",
    providerMode: "mock",
    environment: createEnvironment(),
    flow
  };
}

function valueOf(lines: ReturnType<typeof summarizeFeedbackContext>, label: string): string | undefined {
  return lines.find((line) => line.label === label)?.value;
}

describe("summarizeFeedbackContext", () => {
  it("summarizes shell and environment fields", () => {
    const lines = summarizeFeedbackContext(createContext(null));

    expect(valueOf(lines, "Captured at")).toBe("2023-11-14T22:13:20.000Z");
    expect(valueOf(lines, "Active view")).toBe("mtg-assistant");
    expect(valueOf(lines, "Provider mode")).toBe("mock");
    expect(valueOf(lines, "Route")).toBe("/");
    expect(valueOf(lines, "Viewport")).toBe("1280 × 720");
    expect(valueOf(lines, "Build")).toBe("test (app 0.0.1)");
    expect(valueOf(lines, "Browser")).toBe("Mozilla/5.0 (Test Runner)");
  });

  it("reports when no feature contributed a flow snapshot", () => {
    const lines = summarizeFeedbackContext(createContext(null));

    expect(valueOf(lines, "Flow state")).toBe("no feature contributed a snapshot");
    expect(valueOf(lines, "Screen")).toBeUndefined();
  });

  it("falls back to placeholders when there is no active destination", () => {
    const context = createContext(null);
    context.activeDestinationId = null;

    expect(valueOf(summarizeFeedbackContext(context), "Active view")).toBe("none");
  });

  it("summarizes a contributed flow snapshot", () => {
    const flow: FeedbackFlowSnapshot = {
      screen: "MTG Assistant",
      flowStep: "enrichment",
      question: "Does the trigger still resolve?",
      selectedZones: ["stack", "battlefield"],
      isConversationActive: true,
      conversation: [
        { role: "user", content: "Does the trigger still resolve?" },
        { role: "assistant", content: "Yes." }
      ],
      zoneCards: {
        stack: [
          {
            cardId: "card-1",
            name: "Lightning Bolt",
            oracleText: "Lightning Bolt deals 3 damage to any target."
          }
        ],
        battlefield: []
      },
      gameContext: {
        playerCount: 2,
        players: [
          { label: "Player 1", lifeTotal: 40 },
          { label: "Player 2", lifeTotal: 37 }
        ],
        turnPhase: "combat",
        selectedZones: ["stack"]
      }
    };

    const lines = summarizeFeedbackContext(createContext(flow));

    expect(valueOf(lines, "Screen")).toBe("MTG Assistant");
    expect(valueOf(lines, "Flow step")).toBe("enrichment");
    expect(valueOf(lines, "Question")).toBe("Does the trigger still resolve?");
    expect(valueOf(lines, "Selected zones")).toBe("stack, battlefield");
    expect(valueOf(lines, "Cards collected")).toBe("stack 1");
    expect(valueOf(lines, "Conversation")).toBe("active, 2 messages");
    expect(valueOf(lines, "Game context")).toBe("2 players, turn phase combat");
  });

  it("degrades gracefully for an empty contributed snapshot", () => {
    const lines = summarizeFeedbackContext(createContext({}));

    expect(valueOf(lines, "Screen")).toBe("unknown");
    expect(valueOf(lines, "Flow step")).toBe("unknown");
    expect(valueOf(lines, "Question")).toBe("(not yet written)");
    expect(valueOf(lines, "Selected zones")).toBe("none");
    expect(valueOf(lines, "Cards collected")).toBe("none");
    expect(valueOf(lines, "Conversation")).toBe("not started, 0 messages");
    expect(valueOf(lines, "Game context")).toBe("not assembled yet");
  });

  it("is pure — it never mutates the context it is given", () => {
    const context = createContext({ screen: "MTG Assistant", selectedZones: ["stack"] });
    const before = JSON.stringify(context);

    summarizeFeedbackContext(context);

    expect(JSON.stringify(context)).toBe(before);
  });
});
