import { z } from "zod";

const playerLabelSchema = z.enum(["Player 1", "Player 2", "Player 3", "Player 4"]);

const stackTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("stack"),
    targetCardId: z.string().min(1).max(120),
    targetCardName: z.string().min(1).max(120)
  }),
  z.object({
    kind: z.literal("battlefield"),
    targetPermanent: z.string().min(1).max(160)
  }),
  z.object({
    kind: z.literal("player"),
    targetPlayer: playerLabelSchema
  }),
  z.object({
    kind: z.literal("none")
  })
]);

const stackItemSchema = z.object({
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
  contextNotes: z.string().max(280).optional()
});

export const askAiRequestSchema = z.object({
  question: z.string().max(300),
  stack: z.array(stackItemSchema).min(1).max(10)
});
