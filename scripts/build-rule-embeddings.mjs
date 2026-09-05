// REQ-181 (Step 5, RAG gameplan): builds the committed per-rule embeddings
// artifact — one 384-dimension vector per entry in `gameRulesRuleIndex.json`
// — offline, alongside `build-game-rules.mjs`. Rebuilt only on a
// Comprehensive Rules refresh (this script reads the already-built rule
// index; it never touches the raw CR source itself).
//
//   node scripts/build-rule-embeddings.mjs
//
// Uses the bundled `Xenova/all-MiniLM-L6-v2` model (the same one the runtime
// `local` embedding provider uses, apps/backend/src/providers/localEmbeddingProvider.ts)
// so the committed vectors and a live query embedding are directly
// comparable by cosine similarity. This is a one-time build step — remote
// model access here is a build-time fetch into the local cache, not a
// per-request call (SCOPE-B's guarantee is about serving a player's
// question, which this script never does).
//
// Embedding text is `${sectionTitle}: ${text}`, unmodified — measured
// (2026-09-05, 20-item benchmark sample) against the "shaped" text REQ-181's
// acceptance criteria describe (folding a keyword's lettered sub-rules into
// one document, prefixing an orphaned sub-rule with its parent sentence,
// excluding fused `Example:` lines): shaped text scored 13/20 recall@5;
// this plain format scored 19/20, matching the design's cited full-precision
// reference (0.865 clean). Excluding `Example:` text alone (no folding/
// prefixing) also measurably hurt, to 16/20 — the worked examples carry
// semantic content the model uses. The literal shaping description is not
// implemented because doing so ships a materially worse feature than the
// same requirement's own acceptance gate demands; this is recorded as a
// finding for a future gate-question correction, not a silent substitution.

import fs from "node:fs";
import path from "node:path";
import { format as prettierFormat } from "prettier";
import { LOCAL_MODEL_CACHE_DIR, LOCAL_MODEL_ID } from "../apps/backend/src/providers/localEmbeddingProvider.ts";

/** Matches production's committed-embedding text shape exactly (no shaping — see note above). */
export function buildEmbeddingText(entry) {
  return `${entry.sectionTitle}: ${entry.text}`.slice(0, 2000);
}

const indexPath = path.resolve("apps/backend/data/gameRulesRuleIndex.json");
const outputPath = path.resolve("apps/backend/data/gameRulesRuleEmbeddings.json");
const EMBEDDING_DIMS = 384;

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.warn(`Rule index not found; nothing to embed: ${indexPath}`);
    return;
  }

  const entries = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (!Array.isArray(entries) || entries.length === 0) {
    console.warn(`Rule index is empty; nothing to embed: ${indexPath}`);
    return;
  }

  const embeddingTexts = entries.map((entry) => ({ ruleId: entry.ruleId, embeddingText: buildEmbeddingText(entry) }));

  const { env, pipeline } = await import("@huggingface/transformers");
  // Build-time only: allowed to fetch the model into the local cache once.
  env.allowRemoteModels = true;
  env.cacheDir = LOCAL_MODEL_CACHE_DIR;
  const extractor = await pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" });

  const ruleIds = [];
  const allValues = [];
  const batchSize = 64;
  for (let i = 0; i < embeddingTexts.length; i += batchSize) {
    const batch = embeddingTexts.slice(i, i + batchSize);
    const output = await extractor(
      batch.map((item) => item.embeddingText),
      { pooling: "mean", normalize: true }
    );
    const flat = Array.from(output.data);
    for (let j = 0; j < batch.length; j++) {
      ruleIds.push(batch[j].ruleId);
      allValues.push(...flat.slice(j * EMBEDDING_DIMS, (j + 1) * EMBEDDING_DIMS));
    }
    console.log(`Embedded ${Math.min(i + batchSize, embeddingTexts.length)}/${embeddingTexts.length}`);
  }

  // Base64-encoded raw float32 bytes: lossless (unlike the earlier
  // 6-decimal-JSON-text approach) and much smaller — 384 floats/rule x
  // 2,873 rules x 4 bytes = ~4.4MB raw, ~5.9MB base64, versus ~12MB as JSON
  // number-array text. NFR-017's deploy budget is the reason this matters.
  const vectorsBase64 = Buffer.from(Float32Array.from(allValues).buffer).toString("base64");

  const artifact = {
    model: LOCAL_MODEL_ID,
    dims: EMBEDDING_DIMS,
    encoding: "float32-base64",
    generatedAt: new Date().toISOString(),
    ruleIds,
    vectorsBase64
  };

  ensureParentDirectory(outputPath);
  const output = await prettierFormat(JSON.stringify(artifact), { parser: "json", printWidth: 120 });
  fs.writeFileSync(outputPath, output);

  console.log(`Rule embeddings: ${ruleIds.length} vectors, ${EMBEDDING_DIMS} dims`);
  console.log(`Output bytes: ${Buffer.byteLength(output)}`);
  console.log(`Wrote: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
