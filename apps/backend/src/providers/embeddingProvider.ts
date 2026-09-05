/**
 * REQ-181: the query-embedding boundary, mirroring `AskAiProvider`'s shape
 * (`askAiProvider.ts`). Returns `null` on any failure — model load, inference
 * error, missing artifact, provider error — never throws, so the caller's
 * lexical-fallback path (SCOPE-D) is always reachable.
 */
export type EmbeddingProvider = {
  embed(text: string): Promise<number[] | null>;
};
