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
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { format as prettierFormat } from "prettier";
import { LOCAL_MODEL_CACHE_DIR, LOCAL_MODEL_ID } from "../apps/backend/src/providers/localEmbeddingProvider.ts";

/** Matches production's committed-embedding text shape exactly (no shaping — see note above). */
export function buildEmbeddingText(entry) {
  return `${entry.sectionTitle}: ${entry.text}`.slice(0, 2000);
}

const indexPath = path.resolve("apps/backend/data/gameRulesRuleIndex.json");
const outputPath = path.resolve("apps/backend/data/gameRulesRuleEmbeddings.json");
const EMBEDDING_DIMS = 384;
/** REQ-183: the shipped encoding. Named once so the hash-skip check below
 * also rebuilds when this changes (an encoding change is a legitimate
 * rebuild reason on its own, not only a rule-index change). */
const ENCODING = "int8-base64";
/**
 * REQ-183: the int8 scale factor is computed at build time from the actual
 * data, not assumed at a fixed 127-per-unit-magnitude. Measured 2026-09-05:
 * every component of a unit (L2-normalised) vector is bounded by ±1 in
 * theory, but this model's components only ever reach about ±0.27 in
 * practice — a fixed scale of 127 (assuming the full ±1 range) would use
 * only ~70 of the 255 signed int8 levels, wasting most of int8's precision
 * and measurably regressing benchmark recall@5 (0.8974 -> 0.8910 clean,
 * observed). Scaling instead by the corpus's own largest |component| uses
 * the full int8 range and reproduces the pre-quantisation recall. The scale
 * is committed on the artifact (`int8Scale`) so the loader dequantises with
 * the exact value this build used, never a hardcoded guess.
 */
export function computeInt8Scale(values) {
  let maxAbs = 0;
  for (const value of values) {
    const abs = Math.abs(value);
    if (abs > maxAbs) maxAbs = abs;
  }
  return maxAbs > 0 ? 127 / maxAbs : 1;
}

/** REQ-183: quantise one float32 component to a signed int8 using the given scale, clamped to the valid range. */
export function quantizeToInt8(value, scale) {
  const scaled = Math.round(value * scale);
  return Math.max(-128, Math.min(127, scaled));
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/**
 * REQ-181/E12 (review loop 1): a hash of the rule index this artifact was
 * built from, stored on the artifact itself (`ruleIndexHash`) — the
 * accepted `GATE-QUESTIONS.md` wording says this step "runs in the same
 * `npm run data:build` chain... rebuilds only on CR refresh." Since a CR
 * refresh only changes anything downstream by changing
 * `gameRulesRuleIndex.json`, keying the skip on a hash of that file (rather
 * than a timestamp or a separate "did CR refresh run" flag) is the same
 * condition expressed precisely, and re-running `data:build` on an unchanged
 * checkout doesn't re-run the (comparatively slow) embedding step for
 * nothing.
 */
export function hashRuleIndex(rawIndexJson) {
  return createHash("sha256").update(rawIndexJson).digest("hex");
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.warn(`Rule index not found; nothing to embed: ${indexPath}`);
    return;
  }

  const rawIndexJson = fs.readFileSync(indexPath, "utf8");
  const entries = JSON.parse(rawIndexJson);
  if (!Array.isArray(entries) || entries.length === 0) {
    console.warn(`Rule index is empty; nothing to embed: ${indexPath}`);
    return;
  }

  const ruleIndexHash = hashRuleIndex(rawIndexJson);
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      if (existing.ruleIndexHash === ruleIndexHash && existing.encoding === ENCODING) {
        console.log(`Rule index unchanged (sha256 ${ruleIndexHash.slice(0, 12)}...) and encoding already ${ENCODING}; skipping rebuild: ${outputPath}`);
        return;
      }
    } catch {
      // Malformed existing artifact: fall through and rebuild.
    }
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

  // REQ-183: base64-encoded signed int8 bytes — one byte per component
  // instead of four. 384 dims/rule x 2,873 rules x 1 byte = ~1.05MB raw,
  // ~1.44MB base64, versus ~4.4MB raw / ~5.9MB base64 for float32-base64.
  // NFR-017's deploy budget is why this matters; retrieval quality is
  // re-measured after this change (REQ-183 acceptance), not assumed.
  const int8Scale = computeInt8Scale(allValues);
  const vectorsBase64 = Buffer.from(Int8Array.from(allValues, (value) => quantizeToInt8(value, int8Scale)).buffer).toString(
    "base64"
  );

  const artifact = {
    model: LOCAL_MODEL_ID,
    dims: EMBEDDING_DIMS,
    encoding: ENCODING,
    int8Scale,
    generatedAt: new Date().toISOString(),
    ruleIndexHash,
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

// REQ-183: guarded so importing this module's pure functions for testing
// (`scripts/build-rule-embeddings.test.mjs`) never triggers a rebuild as a
// side effect — matches the established pattern in `build-game-rules.mjs`.
const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
