import { z } from "zod";

const enrichmentEntrySchema = z.object({
  ruleId: z.string(),
  sectionTitle: z.string(),
  score: z.number()
});

export const enrichmentDebugSchema = z.object({
  supplemental: z.object({
    queryText: z.string(),
    queryTokens: z.array(z.string()),
    queryRuleIds: z.array(z.string()),
    excludedCuratedRuleCount: z.number(),
    selected: z.array(enrichmentEntrySchema),
    runnerUp: z.array(enrichmentEntrySchema),
    candidatesScored: z.number()
  }),
  curatedGameRules: z.object({
    topicIds: z.array(z.string()),
    topics: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        ruleNumbers: z.array(z.string())
      })
    )
  }),
  rulings: z.object({
    cardsConsidered: z.array(z.object({ cardId: z.string(), name: z.string() })),
    cardsIncluded: z.array(z.object({ cardId: z.string(), name: z.string(), rulingCount: z.number() })),
    cardsSkippedNoMatch: z.array(z.object({ cardId: z.string(), name: z.string() })),
    sectionTruncated: z.boolean()
  })
});

export type EnrichmentDebug = z.infer<typeof enrichmentDebugSchema>;
