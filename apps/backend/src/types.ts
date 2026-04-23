export type PlayerLabel = "Player 1" | "Player 2" | "Player 3" | "Player 4";

export type StackTarget =
  | {
      kind: "stack";
      targetCardId: string;
      targetCardName: string;
    }
  | {
      kind: "battlefield";
      targetPermanent: string;
    }
  | {
      kind: "player";
      targetPlayer: PlayerLabel;
    }
  | {
      kind: "none";
    }
  | {
      kind: "other";
      targetDescription: string;
    };

export type GamePlayerContext = {
  label: PlayerLabel;
  lifeTotal: number;
};

export type GameContext = {
  playerCount: number;
  players: GamePlayerContext[];
};

export type BattlefieldContextItem = {
  name: string;
  details?: string;
  targets: StackTarget[];
};

export type StackItem = {
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
  targets: StackTarget[];
  contextNotes?: string;
  manaSpent?: number;
};

export type AskAiRequest = {
  question: string;
  gameContext: GameContext;
  battlefieldContext: BattlefieldContextItem[];
  stack: StackItem[];
};

export type AskAiResponse = {
  answer: string;
};

export type AskAiError = {
  error: string;
  retryAfterSeconds?: number;
};

export type PromptContextStackItem = StackItem & {
  stackIndex: number;
  stackRole: "bottom" | "middle" | "top";
};

export type PromptContext = {
  finalQuestion: string;
  gameContext: GameContext;
  battlefieldContext: BattlefieldContextItem[];
  orderedStack: PromptContextStackItem[];
};
