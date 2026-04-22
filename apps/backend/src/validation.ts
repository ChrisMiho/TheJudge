import { z } from "zod";

const stackItemSchema = z.object({
  cardId: z.string().min(1),
  name: z.string().min(1),
  oracleText: z.string().min(1),
  imageUrl: z.string().optional().default("")
});

export const askAiRequestSchema = z.object({
  question: z.string().max(300),
  stack: z.array(stackItemSchema).min(1).max(10)
});
