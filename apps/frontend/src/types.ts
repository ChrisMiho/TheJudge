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
};

export type TurnPhase =
  | "untap"
  | "upkeep"
  | "draw"
  | "main_1"
  | "main_2"
  | "end_step"
  | "cleanup"
  | "combat"
  | "stack_resolving";

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
  cardId: string;
  name: string;
  oracleText: string;
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

/**
 * GameContext extended with new zone-based fields.
 * New fields are optional until the UI migrates in slice 06.
 */
export type GameContext = {
  playerCount: number;
  players: GamePlayerContext[];
  turnPhase: TurnPhase;
  activePlayer?: PlayerLabel;
  selectedZones?: ZoneId[];
  zones?: Partial<Record<ZoneId, ZoneCardItem[]>>;
};

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
