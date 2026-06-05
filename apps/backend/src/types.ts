import type { z } from "zod";
import type {
  askAiErrorSchema,
  askAiRequestSchema,
  askAiResponseSchema,
  contextTargetSchema,
  gameContextSchema,
  gamePlayerSchema,
  playerLabelSchema,
  turnPhaseSchema,
  zoneCardItemSchema,
  zoneIdSchema
} from "./validation.js";

export type PlayerLabel = z.infer<typeof playerLabelSchema>;
export type TurnPhase = z.infer<typeof turnPhaseSchema>;
export type ZoneId = z.infer<typeof zoneIdSchema>;
export type ContextTarget = z.infer<typeof contextTargetSchema>;
export type ZoneCardItem = z.infer<typeof zoneCardItemSchema>;
export type GamePlayerContext = z.infer<typeof gamePlayerSchema>;
export type GameContext = z.infer<typeof gameContextSchema>;
export type AskAiRequest = z.infer<typeof askAiRequestSchema>;
export type AskAiResponse = z.infer<typeof askAiResponseSchema>;
export type AskAiError = z.infer<typeof askAiErrorSchema>;

/**
 * Internal target shape used by the prompt builder.
 * Maps from the external ContextTarget via normalizeContextTarget in promptContext.ts.
 */
export type PromptContextStackTarget =
  | { kind: "stack"; targetCardId: string; targetCardName: string }
  | { kind: "battlefield"; targetPermanent: string }
  | { kind: "player"; targetPlayer: PlayerLabel }
  | { kind: "none" }
  | { kind: "other"; targetDescription: string };

/** Generic per-card item for non-stack zones (battlefield, hand, graveyard, etc.). */
export type PromptContextZoneItem = {
  name: string;
  owner?: PlayerLabel;
  details?: string;
  targets: PromptContextStackTarget[];
};

export type PromptContextStackItem = {
  cardId: string;
  name: string;
  oracleText: string;
  imageUrl: string;
  manaCost: string;
  manaValue: number;
  typeLine: string;
  colors: string[];
  supertypes: string[];
  subtypes: string[];
  caster: PlayerLabel;
  targets: PromptContextStackTarget[];
  contextNotes?: string;
  manaSpent: number;
  stackIndex: number;
  stackRole: "bottom" | "middle" | "top";
};

export type PromptContext = {
  finalQuestion: string;
  gameContext: {
    playerCount: number;
    players: GamePlayerContext[];
    turnPhase: TurnPhase;
    activePlayer?: PlayerLabel;
    selectedZones: ZoneId[];
  };
  /** Non-stack zones that have cards, in canonical zone order. */
  populatedZones: {
    zoneId: Exclude<ZoneId, "stack">;
    items: PromptContextZoneItem[];
  }[];
  orderedStack: PromptContextStackItem[];
};
