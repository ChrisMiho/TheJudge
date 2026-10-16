import type { GameContext, ZoneCardItem } from "../types";

export const card: ZoneCardItem = {
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

export const card1: ZoneCardItem = { ...card, instanceId: "inst-1" };

export const card2: ZoneCardItem = { ...card, instanceId: "inst-2" };

export const singlePlayerGameContext: GameContext = {
  playerCount: 1,
  players: [{ label: "Player 1", lifeTotal: 20 }],
  turnPhase: "main_1",
  activePlayer: "Player 1",
  selectedZones: ["stack"]
};

export const twoPlayerGameContext: GameContext = {
  playerCount: 2,
  players: [
    { label: "Player 1", lifeTotal: 20 },
    { label: "Player 2", lifeTotal: 20 }
  ],
  turnPhase: "main_1",
  activePlayer: "Player 1",
  selectedZones: ["stack"]
};
