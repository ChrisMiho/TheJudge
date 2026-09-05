// REQ-181 (review loop 1, cheap finding #8): warms the local embedding
// model's on-disk cache (`apps/backend/data/models/`) without touching any
// tracked artifact. `package-lambda.sh` needs the model cache warm before it
// copies `apps/backend/data` into the deploy package (SCOPE-B: the model
// ships bundled, never fetched at request time) — it previously did this by
// running `npm run data:build-rule-embeddings`, which as a side effect
// rewrites the committed `gameRulesRuleEmbeddings.json`, a tracked file a
// deploy-time script must never mutate. This script only loads the pipeline
// (which populates the cache directory as a side effect of loading the
// model) and computes nothing, writes nothing else.
//
//   node scripts/warm-embedding-model-cache.mjs

import { LOCAL_MODEL_CACHE_DIR, LOCAL_MODEL_ID } from "../apps/backend/src/providers/localEmbeddingProvider.ts";

async function main() {
  const { env, pipeline } = await import("@huggingface/transformers");
  // Build/deploy-time only: allowed to fetch the model into the local cache
  // once, same as build-rule-embeddings.mjs. If it's already cached, this is
  // a fast local read with no network call.
  env.allowRemoteModels = true;
  env.cacheDir = LOCAL_MODEL_CACHE_DIR;
  await pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" });
  console.log(`Warmed local embedding model cache: ${LOCAL_MODEL_CACHE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
