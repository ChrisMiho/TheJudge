import { z } from "zod";
import { ASK_AI_ERROR_CODES } from "./errors.js";

export const playerLabelSchema = z.enum(["Player 1", "Player 2", "Player 3", "Player 4"]);
const orderedPlayerLabels = ["Player 1", "Player 2", "Player 3", "Player 4"] as const;

export const stackTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("stack"),
    targetCardId: z.string().min(1).max(120),
    targetCardName: z.string().min(1).max(120)
  }).strict(),
  z.object({
    kind: z.literal("battlefield"),
    targetPermanent: z.string().min(1).max(160)
  }).strict(),
  z.object({
    kind: z.literal("player"),
    targetPlayer: playerLabelSchema
  }).strict(),
  z.object({
    kind: z.literal("none")
  }).strict(),
  z.object({
    kind: z.literal("other"),
    targetDescription: z.string().min(1).max(200)
  }).strict()
]);

export const stackItemSchema = z.object({
  cardId: z.string().min(1),
  name: z.string().min(1),
  oracleText: z.string().min(1),
  imageUrl: z.string().optional().default(""),
  manaCost: z.string().max(40).optional().default(""),
  manaValue: z.number().min(0).max(20).optional().default(0),
  typeLine: z.string().max(200).optional().default(""),
  colors: z.array(z.string().min(1).max(1)).max(5).optional().default([]),
  supertypes: z.array(z.string().min(1).max(30)).max(8).optional().default([]),
  subtypes: z.array(z.string().min(1).max(40)).max(12).optional().default([]),
  caster: playerLabelSchema,
  targets: z.array(stackTargetSchema).max(8).optional().default([]),
  contextNotes: z.string().max(280).optional(),
  manaSpent: z.number().min(0).max(99).optional()
}).strict();

export const gamePlayerSchema = z.object({
  label: playerLabelSchema,
  lifeTotal: z.number().int().min(-99).max(999)
}).strict();

export const gameContextSchema = z
  .object({
    playerCount: z.number().int().min(2).max(4),
    players: z.array(gamePlayerSchema).min(2).max(4)
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
  });

export const battlefieldContextItemSchema = z.object({
  name: z.string().min(1).max(120),
  details: z.string().max(280).optional(),
  targets: z.array(stackTargetSchema).max(8).optional().default([])
}).strict();

export const askAiRequestSchema = z.object({
  question: z.string().max(300),
  gameContext: gameContextSchema,
  battlefieldContext: z.array(battlefieldContextItemSchema).max(16).optional().default([]),
  stack: z.array(stackItemSchema).min(1).max(10)
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
