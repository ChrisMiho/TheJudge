import type { AskAiRequest, ZoneCardItem } from "../types/index.js";

export function createGameContext(playerCount: 2 | 3 | 4 | 5 | 6 | 7 | 8 = 2): AskAiRequest["gameContext"] {
  const labels: AskAiRequest["gameContext"]["players"][number]["label"][] = [
    "Player 1",
    "Player 2",
    "Player 3",
    "Player 4",
    "Player 5",
    "Player 6",
    "Player 7",
    "Player 8"
  ];
  return {
    playerCount,
    players: labels.slice(0, playerCount).map((label) => ({ label, lifeTotal: 20 })),
    turnPhase: "main_1",
    selectedZones: ["stack"],
    zones: {}
  };
}

export function createZoneCardItem(overrides: Partial<ZoneCardItem> = {}): ZoneCardItem {
  return {
    cardId: "opt",
    name: "Opt",
    oracleText: "Scry 1, then draw a card.",
    imageUrl: "",
    manaCost: "{U}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: [],
    caster: "Player 1",
    targets: [],
    manaSpent: undefined,
    ...overrides
  };
}

export function createAskAiRequest(overrides: Partial<AskAiRequest> = {}): AskAiRequest {
  return {
    question: "How does this resolve?",
    gameContext: {
      ...createGameContext(),
      zones: {
        stack: [createZoneCardItem()]
      }
    },
    ...overrides
  };
}
