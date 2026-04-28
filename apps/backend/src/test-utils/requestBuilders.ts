import type { AskAiRequest } from "../types.js";

export function createGameContext(playerCount: 2 | 3 | 4 = 2): AskAiRequest["gameContext"] {
  const labels: AskAiRequest["gameContext"]["players"][number]["label"][] = ["Player 1", "Player 2", "Player 3", "Player 4"];
  return {
    playerCount,
    players: labels.slice(0, playerCount).map((label) => ({ label, lifeTotal: 20 }))
  };
}

export function createStackItem(overrides: Partial<AskAiRequest["stack"][number]> = {}): AskAiRequest["stack"][number] {
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
    gameContext: createGameContext(),
    battlefieldContext: [],
    stack: [createStackItem()],
    ...overrides
  };
}
