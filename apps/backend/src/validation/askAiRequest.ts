import { z } from "zod";
import { PLAYER_LABELS } from "../constants.js";
import { ASK_AI_ERROR_CODES } from "../errors.js";
import { enrichmentDebugSchema } from "../prompt/enrichmentDebug.js";

export const playerLabelSchema = z.enum(PLAYER_LABELS);

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
  "combat"
]);

export const combatStepSchema = z.enum([
  "beginning_of_combat",
  "declare_attackers",
  "declare_blockers",
  "combat_damage",
  "end_of_combat"
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

const cardReferenceShape = {
  cardId: boundedText(120),
  name: boundedText(120),
  oracleText: boundedText(2000),
  imageUrl: optionalBoundedTextWithEmptyDefault(500),
  manaCost: optionalBoundedTextWithEmptyDefault(40),
  manaValue: z.number().min(0).max(20).optional().default(0),
  typeLine: optionalBoundedTextWithEmptyDefault(200),
  colors: z.array(boundedText(1)).max(5).optional().default([]),
  supertypes: z.array(boundedText(30)).max(8).optional().default([]),
  subtypes: z.array(boundedText(40)).max(12).optional().default([])
};

export const zoneCardItemSchema = z.object({
  ...cardReferenceShape,
  caster: playerLabelSchema.optional(),
  owner: playerLabelSchema.optional(),
  targets: z.array(contextTargetSchema).max(8).optional().default([]),
  contextNotes: optionalBoundedText(280),
  manaSpent: z.number().min(0).max(99).optional()
}).strict();

export const lookupCardReferenceSchema = z.object({
  ...cardReferenceShape
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

const nonNegativeIntCount = () => z.number().int().min(0);

export const commanderDamageEntrySchema = z.object({
  from: playerLabelSchema,
  amount: nonNegativeIntCount()
}).strict();

export const namedCounterSchema = z.object({
  name: boundedText(40),
  amount: nonNegativeIntCount()
}).strict();

export const gamePlayerSchema = z.object({
  label: playerLabelSchema,
  lifeTotal: z.number().int().min(-99).max(999),
  displayName: optionalBoundedText(40),
  poison: nonNegativeIntCount().optional(),
  experience: nonNegativeIntCount().optional(),
  energy: nonNegativeIntCount().optional(),
  commanderDamage: z.array(commanderDamageEntrySchema).max(7).optional(),
  counters: z.array(namedCounterSchema).max(20).optional()
}).strict();

export const gameContextSchema = z
  .object({
    playerCount: z.number().int().min(2).max(8),
    players: z.array(gamePlayerSchema).min(2).max(8),
    turnPhase: turnPhaseSchema,
    combatStep: combatStepSchema.optional(),
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

    const expectedLabels = PLAYER_LABELS.slice(0, value.playerCount);
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

    const hasCardInSelectedZone = value.selectedZones.some((zoneId) => (value.zones[zoneId]?.length ?? 0) > 0);
    if (!hasCardInSelectedZone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zones"],
        message: "must include at least one card in a selected zone"
      });
    }
  });

export const conversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: boundedText(10000)
}).strict();

const conversationHistorySchema = z
  .array(conversationTurnSchema)
  .min(1)
  .max(20)
  .superRefine((turns, ctx) => {
    if (turns[0]?.role !== "user") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [0, "role"], message: "first turn must have role: user" });
    }
    if (turns[turns.length - 1]?.role !== "assistant") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [turns.length - 1, "role"], message: "last turn must have role: assistant" });
    }
    for (let i = 1; i < turns.length; i++) {
      if (turns[i].role === turns[i - 1].role) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [i, "role"], message: "roles must alternate between user and assistant" });
      }
    }
  });

// The 300-character product cap (REQ-011/REQ-091 as amended) measures the raw editable
// textarea, not this field. The client composes the submitted question from a locked topic
// pill phrase or the silent `Tell me about {Card Name}.` fallback plus that text, so the
// wire value can exceed 300 by the prefix; 600 covers the longest such prefix with room to
// spare and stays far below DEC-042's 1,000,000-character prompt budget.
const questionSchema = boundedText(600, 0);

const gameAskAiRequestSchema = z.object({
  mode: z.literal("game").optional(),
  question: questionSchema,
  gameContext: gameContextSchema,
  conversationHistory: conversationHistorySchema.optional()
}).strict();

const lookupAskAiRequestSchema = z.object({
  mode: z.literal("lookup"),
  question: questionSchema,
  card: lookupCardReferenceSchema.optional(),
  conversationHistory: conversationHistorySchema.optional()
}).strict();

export const askAiRequestSchema = z.preprocess(
  (input) => {
    if (
      typeof input !== "object" ||
      input === null ||
      Array.isArray(input) ||
      ("mode" in input && input.mode !== undefined)
    ) {
      return input;
    }

    return { ...input, mode: "game" };
  },
  z.discriminatedUnion("mode", [gameAskAiRequestSchema, lookupAskAiRequestSchema])
);

export const askAiResponseSchema = z
  .object({
    answer: z.string(),
    context: z.record(z.string(), z.unknown()).optional(),
    diagnostics: z.record(z.string(), z.unknown()).optional(),
    enrichmentDebug: enrichmentDebugSchema.optional()
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
