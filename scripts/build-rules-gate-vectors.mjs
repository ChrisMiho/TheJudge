// REQ-222: builds the committed frozen query vectors the offline prompt gate
// ranks rules with -- one per non-rejected rules test case, embedded once by
// the shipped local model (REQ-184: bundled MiniLM, in process, no network, no
// provider call) from the exact retrieval query text production embeds. Each
// vector is stored with a SHA-256 of that query text, which is how the gate
// notices a case whose query text has since changed ("awaiting a re-freeze").
//
// A vector whose stored hash still matches its case's query text is kept
// as-is, so the output is deterministic and a rerun only embeds what changed;
// `--force` re-embeds every case. Vectors for cases no longer in the corpus are
// dropped. This command never reads an API key and never uses the hosted
// embedder: it refuses any EMBEDDING_PROVIDER other than `local`.
//
//   npm run eval:build-rules-gate-vectors
//   npm run eval:build-rules-gate-vectors -- --force

import { loadGateCases, loadGateInputs, parseCaseRequest, writeFormattedJson } from "./lib/rules-gate-inputs.mjs";
import { assertQueryEmbedded, resolveEmbeddingProviderMode } from "./lib/prompt-fidelity.mjs";

async function main() {
  const mode = resolveEmbeddingProviderMode(process.env);
  if (mode !== "local") {
    throw new Error(`EMBEDDING_PROVIDER=${mode}: the frozen vectors are built by the local model only (unset EMBEDDING_PROVIDER).`);
  }
  const force = process.argv.includes("--force");

  const { buildCaseQueryText, encodeVector, hashQueryText, loadFrozenVectors, FROZEN_VECTORS_PATH } = await import(
    "../apps/backend/src/eval/rules-gate/frozenVectors.ts"
  );
  const { localEmbeddingProvider } = await import("../apps/backend/src/providers/localEmbeddingProvider.ts");

  const { resources } = await loadGateInputs();
  const cases = await loadGateCases();
  const existing = loadFrozenVectors();
  const out = {};
  let embedded = 0;
  let kept = 0;

  for (const caseEntry of [...cases].sort((a, b) => a.id.localeCompare(b.id))) {
    const request = await parseCaseRequest(caseEntry);
    const queryText = buildCaseQueryText(request, resources.cardDetailIndex);
    const queryTextHash = hashQueryText(queryText);
    const previous = existing[caseEntry.id];
    if (!force && previous && previous.queryTextHash === queryTextHash) {
      out[caseEntry.id] = previous;
      kept += 1;
      continue;
    }
    const vector = await localEmbeddingProvider.embed(queryText);
    assertQueryEmbedded({ mode: "local", vector, caseId: caseEntry.id });
    out[caseEntry.id] = { queryTextHash, vector: encodeVector(vector) };
    embedded += 1;
  }

  const bytes = await writeFormattedJson(FROZEN_VECTORS_PATH, out);
  console.log(
    `Wrote ${FROZEN_VECTORS_PATH}: ${Object.keys(out).length} vectors (${embedded} embedded, ${kept} kept), ${bytes} bytes.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
