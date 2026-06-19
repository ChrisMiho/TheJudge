import type { ZoneId } from "./types/index.js";

export const PLAYER_LABELS = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
  "Player 7",
  "Player 8"
] as const;

export const CANONICAL_ZONE_ORDER: ZoneId[] = [
  "stack",
  "battlefield",
  "hand",
  "graveyard",
  "exile",
  "library",
  "command"
];

export const NON_STACK_CANONICAL_ZONE_ORDER: Array<Exclude<ZoneId, "stack">> =
  CANONICAL_ZONE_ORDER.filter((zone): zone is Exclude<ZoneId, "stack"> => zone !== "stack");

export const DEFAULT_STACK_QUESTION = "Resolve the stack";
export const DEFAULT_BOARD_QUESTION = "Explain the interaction with the provided game state";
