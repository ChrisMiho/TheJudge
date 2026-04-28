import type { z } from "zod";
import type {
  askAiErrorSchema,
  askAiRequestSchema,
  askAiResponseSchema,
  gameContextSchema,
  gamePlayerSchema,
  playerLabelSchema,
  stackTargetSchema
} from "./validation.js";

export type PlayerLabel = z.infer<typeof playerLabelSchema>;
export type StackTarget = z.infer<typeof stackTargetSchema>;
export type GamePlayerContext = z.infer<typeof gamePlayerSchema>;
export type GameContext = z.infer<typeof gameContextSchema>;
export type AskAiRequest = z.infer<typeof askAiRequestSchema>;
export type AskAiResponse = z.infer<typeof askAiResponseSchema>;
export type AskAiError = z.infer<typeof askAiErrorSchema>;
export type BattlefieldContextItem = AskAiRequest["battlefieldContext"][number];
export type StackItem = AskAiRequest["stack"][number];

export type PromptContextStackItem = AskAiRequest["stack"][number] & {
  stackIndex: number;
  stackRole: "bottom" | "middle" | "top";
};

export type PromptContext = {
  finalQuestion: string;
  gameContext: GameContext;
  battlefieldContext: BattlefieldContextItem[];
  orderedStack: PromptContextStackItem[];
};
