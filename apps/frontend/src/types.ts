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
    };

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

export type StackItem = CardMetadataItem & {
  caster: PlayerLabel;
  targets: StackTarget[];
  contextNotes?: string;
};

export type AskAiRequest = {
  question: string;
  stack: StackItem[];
};

export type AskAiResponse = {
  answer: string;
};

export type AskAiError = {
  error: string;
  retryAfterSeconds?: number;
};
