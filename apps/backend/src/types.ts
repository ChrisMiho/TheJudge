export type StackItem = {
  cardId: string;
  name: string;
  oracleText: string;
  imageUrl: string;
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
