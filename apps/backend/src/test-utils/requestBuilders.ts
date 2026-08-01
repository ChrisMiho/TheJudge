import { PLAYER_LABELS } from "../constants.js";
import type { GameAskAiRequest, ZoneCardItem } from "../types/index.js";

export function createGameContext(playerCount: 2 | 3 | 4 | 5 | 6 | 7 | 8 = 2): GameAskAiRequest["gameContext"] {
  return {
    playerCount,
    players: PLAYER_LABELS.slice(0, playerCount).map((label) => ({ label, lifeTotal: 20 })),
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

export function createAskAiRequest(overrides: Partial<GameAskAiRequest> = {}): GameAskAiRequest {
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
