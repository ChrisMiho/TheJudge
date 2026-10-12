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
// REQ-237: this downloads the STOCK model from Hugging Face. Once a trained model's manifest is
// committed (`apps/backend/data/embeddingModel.manifest.json`) the running model is private and is
// fetched from S3 and hash-verified by `scripts/fetch-embedding-model.mjs` instead; this script then
// refuses, naming that command.
//
//   node scripts/warm-embedding-model-cache.mjs

import { LOCAL_MODEL_CACHE_DIR, LOCAL_MODEL_ID, createLocalExtractor } from "../apps/backend/src/providers/localEmbeddingProvider.ts";
import { loadEmbeddingModelManifest } from "../apps/backend/src/embeddingModel.ts";

async function main() {
  if (loadEmbeddingModelManifest()) {
    throw new Error(
      `The running embedding model (${LOCAL_MODEL_ID}) is stored privately, not on Hugging Face. ` +
        "Fetch and verify it with: node scripts/fetch-embedding-model.mjs --source <s3://bucket/models/<id> | local folder> (REQ-237)."
    );
  }
  // Build/deploy-time only: allowed to fetch the model into the local cache
  // once, same as build-rule-embeddings.mjs. If it's already cached, this is
  // a fast local read with no network call.
  await createLocalExtractor({ allowRemoteModels: true });
  console.log(`Warmed local embedding model cache: ${LOCAL_MODEL_CACHE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
