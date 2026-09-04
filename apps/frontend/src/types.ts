export type PlayerLabel =
  | "Player 1"
  | "Player 2"
  | "Player 3"
  | "Player 4"
  | "Player 5"
  | "Player 6"
  | "Player 7"
  | "Player 8";

export type CardMetadataItem = {
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
};

export type GamePlayerContext = {
  label: PlayerLabel;
  lifeTotal: number;
  displayName?: string;
  poison?: number;
  experience?: number;
  energy?: number;
  commanderDamage?: { from: PlayerLabel; amount: number }[];
  counters?: { name: string; amount: number }[];
};

export type TurnPhase =
  | "untap"
  | "upkeep"
  | "draw"
  | "main_1"
  | "main_2"
  | "end_step"
  | "cleanup"
  | "combat";

export type CombatStep =
  | "beginning_of_combat"
  | "declare_attackers"
  | "declare_blockers"
  | "combat_damage"
  | "end_of_combat";

export type ZoneId =
  | "stack"
  | "battlefield"
  | "hand"
  | "graveyard"
  | "exile"
  | "library"
  | "command";

export type ContextTarget =
  | { kind: "player"; targetPlayer: PlayerLabel }
  | { kind: "card"; zone: ZoneId; cardId: string; cardName: string }
  | { kind: "none" }
  | { kind: "other"; targetDescription: string };

export type ZoneCardItem = {
  /** Per-copy identity; frontend-only — stripped at buildAskAiRequest before the wire. */
  instanceId?: string;
  cardId: string;
  name: string;
  /** REQ-176: resolved server-side by cardId now — no longer copied on from CardMetadataItem. */
  oracleText?: string;
  imageUrl?: string;
  manaCost?: string;
  manaValue?: number;
  typeLine?: string;
  colors?: string[];
  supertypes?: string[];
  subtypes?: string[];
  caster?: PlayerLabel;
  owner?: PlayerLabel;
  targets?: ContextTarget[];
  contextNotes?: string;
  manaSpent?: number;
};

export type GameContext = {
  playerCount: number;
  players: GamePlayerContext[];
  turnPhase: TurnPhase;
  combatStep?: CombatStep;
  activePlayer?: PlayerLabel;
  selectedZones?: ZoneId[];
  zones?: Partial<Record<ZoneId, ZoneCardItem[]>>;
};

export type ConversationMessage = { role: "user" | "assistant"; content: string };

export type AskAiResponse = {
  answer: string;
};

export type AskAiError = {
  code: string;
  message: string;
  metadata?: {
    correlationId?: string;
    details?: string;
  };
  retryAfterSeconds?: number;
};
