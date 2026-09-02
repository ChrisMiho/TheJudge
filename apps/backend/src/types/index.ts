import type { z } from "zod";
import type {
  askAiErrorSchema,
  askAiRequestSchema,
  combatStepSchema,
  contextTargetSchema,
  conversationTurnSchema,
  gameContextSchema,
  gamePlayerSchema,
  playerLabelSchema,
  turnPhaseSchema,
  zoneCardItemSchema,
  zoneIdSchema
} from "../validation/askAiRequest.js";
import type { EnrichmentDebug } from "../prompt/enrichmentDebug.js";
import type { PromptDiagnostics } from "../prompt/promptDiagnostics.js";

export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
export type PlayerLabel = z.infer<typeof playerLabelSchema>;
export type TurnPhase = z.infer<typeof turnPhaseSchema>;
export type CombatStep = z.infer<typeof combatStepSchema>;
export type ZoneId = z.infer<typeof zoneIdSchema>;
export type ContextTarget = z.infer<typeof contextTargetSchema>;
export type ZoneCardItem = z.infer<typeof zoneCardItemSchema>;
export type GamePlayerContext = z.infer<typeof gamePlayerSchema>;
export type GameContext = z.infer<typeof gameContextSchema>;
export type AskAiRequest = z.infer<typeof askAiRequestSchema>;
export type GameAskAiRequest = Extract<AskAiRequest, { gameContext: GameContext }>;
export type LookupAskAiRequest = Extract<AskAiRequest, { mode: "lookup" }>;
export type AskAiError = z.infer<typeof askAiErrorSchema>;

export type AskAiResponse = {
  answer: string;
  context?: PromptInputContext;
  diagnostics?: PromptDiagnostics;
  enrichmentDebug?: EnrichmentDebug;
};

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
  owner?: PlayerLabel;
  targets: PromptContextStackTarget[];
  contextNotes?: string;
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
    combatStep?: CombatStep;
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

export type LookupPromptCard = Omit<PromptContextZoneItem, "owner" | "contextNotes">;

/** REQ-167: the single optional card generalizes to a bounded (max 5) list. */
export type LookupPromptContext = {
  finalQuestion: string;
  cards?: LookupPromptCard[];
  conversationHistory?: ConversationTurn[];
};

export type PromptInputContext = PromptContext | LookupPromptContext;
