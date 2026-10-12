import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEmbeddingModelManifest, runtimeEmbeddingModelId } from "../embeddingModel.js";
import type { EmbeddingProvider } from "./embeddingProvider.js";

// REQ-181/SCOPE-B: a small embedding model bundled in the answer process and
// run in-process — not a hosted service, not a per-request external call.
// Quantised, 384 dimensions: the same model the committed rule-embeddings
// artifact is built with (scripts/build-rule-embeddings.mjs). It is the
// Magic-trained MiniLM (REQ-236) named by the committed manifest
// (`embeddingModel.manifest.json`, REQ-237), loaded from the local folder
// `data/models/<modelId>/` that packaging fetches and verifies; when no
// manifest is committed it is the stock `Xenova/all-MiniLM-L6-v2`.
const manifest = loadEmbeddingModelManifest();
export const LOCAL_MODEL_ID = runtimeEmbeddingModelId(manifest);

const currentDir = dirname(fileURLToPath(import.meta.url));
/** Committed-data-adjacent cache directory: populated once at build/deploy
 * time (never gitignored-raw-model-committed, per NFR-017's constraint), and
 * carried into the Lambda package by the same `apps/backend/data` copy step
 * that already ships `gameRulesRuleIndex.json` (`scripts/package-lambda.sh`). */
export const LOCAL_MODEL_CACHE_DIR = resolve(currentDir, "../../data/models");

type Extractor = (text: string, options: Record<string, unknown>) => Promise<{ data: ArrayLike<number> }>;

/**
 * The feature-extraction pipeline for the running model. Request-time callers never allow a download
 * (`allowRemoteModels: false`), so a cache miss throws and maps to the lexical fallback. Build-time
 * callers (the stock model only, before a trained model is committed) may fetch into the cache once.
 */
export async function createLocalExtractor({ allowRemoteModels = false }: { allowRemoteModels?: boolean } = {}): Promise<Extractor> {
  const { env, pipeline } = await import("@huggingface/transformers");
  env.allowRemoteModels = allowRemoteModels;
  if (manifest) {
    // The trained model is a local folder (never on the Hugging Face hub): <cache>/<modelId>/.
    env.allowLocalModels = true;
    env.localModelPath = LOCAL_MODEL_CACHE_DIR;
  } else {
    env.cacheDir = LOCAL_MODEL_CACHE_DIR;
  }
  return pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" }) as unknown as Extractor;
}

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
    extractorPromise = createLocalExtractor();
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
