import { z } from "zod";
import { ASK_AI_ERROR_CODES } from "./errors.js";

export const playerLabelSchema = z.enum([
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
  "Player 7",
  "Player 8"
]);
const orderedPlayerLabels = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
  "Player 7",
  "Player 8"
] as const;

function noControlCharacterGuardrail(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31) || code === 127) {
      return false;
    }
  }
  return true;
}

function boundedText(maxLength: number, minLength = 1) {
  return z
    .string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .refine(noControlCharacterGuardrail, "contains unsupported control characters");
}

function optionalBoundedText(maxLength: number) {
  return boundedText(maxLength).optional();
}

function optionalBoundedTextWithEmptyDefault(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .refine(noControlCharacterGuardrail, "contains unsupported control characters")
    .optional()
    .default("");
}

export const turnPhaseSchema = z.enum([
  "untap",
  "upkeep",
  "draw",
  "main_1",
  "main_2",
  "end_step",
  "cleanup",
  "combat",
  "stack_resolving"
]);

export const zoneIdSchema = z.enum([
  "stack",
  "battlefield",
  "hand",
  "graveyard",
  "exile",
  "library",
  "command"
]);

export const contextTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("player"),
    targetPlayer: playerLabelSchema
  }).strict(),
  z.object({
    kind: z.literal("card"),
    zone: zoneIdSchema,
    cardId: boundedText(120),
    cardName: boundedText(120)
  }).strict(),
  z.object({
    kind: z.literal("none")
  }).strict(),
  z.object({
    kind: z.literal("other"),
    targetDescription: boundedText(200)
  }).strict()
]);

export const zoneCardItemSchema = z.object({
  cardId: boundedText(120),
  name: boundedText(120),
  oracleText: boundedText(2000),
  imageUrl: optionalBoundedTextWithEmptyDefault(500),
  manaCost: optionalBoundedTextWithEmptyDefault(40),
  manaValue: z.number().min(0).max(20).optional().default(0),
  typeLine: optionalBoundedTextWithEmptyDefault(200),
  colors: z.array(boundedText(1)).max(5).optional().default([]),
  supertypes: z.array(boundedText(30)).max(8).optional().default([]),
  subtypes: z.array(boundedText(40)).max(12).optional().default([]),
  caster: playerLabelSchema.optional(),
  owner: playerLabelSchema.optional(),
  targets: z.array(contextTargetSchema).max(8).optional().default([]),
  contextNotes: optionalBoundedText(280),
  manaSpent: z.number().min(0).max(99).optional()
}).strict();

const zonesSchema = z
  .object({
    stack: z.array(zoneCardItemSchema).min(1).max(10).optional(),
    battlefield: z.array(zoneCardItemSchema).min(1).max(30).optional(),
    hand: z.array(zoneCardItemSchema).min(1).max(20).optional(),
    graveyard: z.array(zoneCardItemSchema).min(1).max(30).optional(),
    exile: z.array(zoneCardItemSchema).min(1).max(30).optional(),
    library: z.array(zoneCardItemSchema).min(1).max(10).optional(),
    command: z.array(zoneCardItemSchema).min(1).max(10).optional()
  })
  .strict();

export const gamePlayerSchema = z.object({
  label: playerLabelSchema,
  lifeTotal: z.number().int().min(-99).max(999),
  displayName: optionalBoundedText(40)
}).strict();

export const gameContextSchema = z
  .object({
    playerCount: z.number().int().min(2).max(8),
    players: z.array(gamePlayerSchema).min(2).max(8),
    turnPhase: turnPhaseSchema,
    activePlayer: playerLabelSchema.optional(),
    selectedZones: z.array(zoneIdSchema).min(1).max(7),
    zones: zonesSchema.optional().default({})
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.players.length !== value.playerCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "must match playerCount"
      });
    }

    const labels = value.players.map((player) => player.label);
    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "must use unique player labels"
      });
    }

    const expectedLabels = orderedPlayerLabels.slice(0, value.playerCount);
    const hasExactFixedLabelSet =
      expectedLabels.every((label) => labels.includes(label)) && labels.every((label) => expectedLabels.includes(label));
    if (!hasExactFixedLabelSet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: `must use fixed labels ${expectedLabels.join(", ")}`
      });
    }

    if (value.activePlayer !== undefined && !labels.includes(value.activePlayer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activePlayer"],
        message: "must be one of the players in the game"
      });
    }
  });

export const askAiRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .max(300)
    .refine(noControlCharacterGuardrail, "contains unsupported control characters"),
  gameContext: gameContextSchema
}).strict();

export const askAiResponseSchema = z
  .object({
    answer: z.string()
  })
  .strict();

export const askAiErrorSchema = z
  .object({
    code: z.enum(ASK_AI_ERROR_CODES),
    message: z.string(),
    metadata: z
      .object({
        correlationId: z.string().min(1).optional(),
        details: z.string().min(1).optional()
      })
      .strict()
      .optional(),
    retryAfterSeconds: z.number().int().positive().optional()
  })
  .strict();
