import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { EmbeddingProvider } from "./embeddingProvider.js";

// REQ-181/SCOPE-B: a small embedding model bundled in the answer process and
// run in-process — not a hosted service, not a per-request external call.
// `Xenova/all-MiniLM-L6-v2` quantised, 384 dimensions: the same model the
// committed rule-embeddings artifact is built with (scripts/build-rule-embeddings.mjs).
export const LOCAL_MODEL_ID = "Xenova/all-MiniLM-L6-v2";

const currentDir = dirname(fileURLToPath(import.meta.url));
/** Committed-data-adjacent cache directory: populated once at build/deploy
 * time (never gitignored-raw-model-committed, per NFR-017's constraint), and
 * carried into the Lambda package by the same `apps/backend/data` copy step
 * that already ships `gameRulesRuleIndex.json` (`scripts/package-lambda.sh`). */
export const LOCAL_MODEL_CACHE_DIR = resolve(currentDir, "../../data/models");

let extractorPromise: Promise<(text: string, options: Record<string, unknown>) => Promise<{ data: ArrayLike<number> }>> | null =
  null;

/**
 * Lazily loads the `@huggingface/transformers` feature-extraction pipeline.
 * `env.allowRemoteModels = false` means this can never make a network call —
 * a cache miss throws (caught by `embed`, mapped to the lexical fallback),
 * so "no per-request external call" holds even on a cold, unwarmed cache.
 */
async function loadExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowRemoteModels = false;
      env.cacheDir = LOCAL_MODEL_CACHE_DIR;
      return pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" }) as unknown as (
        text: string,
        options: Record<string, unknown>
      ) => Promise<{ data: ArrayLike<number> }>;
    })();
  }
  return extractorPromise;
}

export const localEmbeddingProvider: EmbeddingProvider = {
  async embed(text) {
    try {
      const extractor = await loadExtractor();
      const output = await extractor(text, { pooling: "mean", normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.warn("[embedding] local provider failed; falling back to lexical retrieval.", error);
      return null;
    }
  }
};
