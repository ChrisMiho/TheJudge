// REQ-235: builds the committed frozen per-card vectors the offline gates rank with -- one vector per
// distinct card search text (a card's oracle text), embedded once by the shipped local embedder
// (REQ-184: bundled MiniLM, in process, no network, no provider call) and stored under a hash of that
// text. Covers every card of the rules test corpus (the rules gate, REQ-222; `eval:worked-solutions`)
// and every labelled context-eval fixture (REQ-032), so those gates stay offline and mirror production.
//
// A vector whose key (hash of the text) is already stored is kept as-is, so the output is
// deterministic and a rerun only embeds what changed; `--force` re-embeds every text. Texts no longer
// used by any case or fixture are dropped. This command never reads an API key and never uses the
// hosted embedder: it refuses any EMBEDDING_PROVIDER other than `local`.
//
//   npm run eval:build-frozen-card-vectors
//   npm run eval:build-frozen-card-vectors -- --force

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadGateCases, loadGateInputs, parseCaseRequest, writeFormattedJson } from "./lib/rules-gate-inputs.mjs";
import { assertQueryEmbedded, resolveEmbeddingProviderMode } from "./lib/prompt-fidelity.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = resolve(repoRoot, "apps/backend/src/eval/fixtures");

async function collectCardTexts() {
  const { buildPerCardSearchTexts } = await import("../apps/backend/src/prompt/preparation.ts");
  const { cardDetailIndexFromRequest } = await import("../apps/backend/src/eval/fixtureCardDetail.ts");
  const texts = new Map(); // key -> text
  const { resources } = await loadGateInputs();
  for (const caseEntry of await loadGateCases()) {
    const request = await parseCaseRequest(caseEntry);
    for (const card of buildPerCardSearchTexts(request, { cardDetailIndex: resources.cardDetailIndex })) texts.set(card.key, card.text);
  }
  const fixtureFiles = (await readdir(fixturesDir)).filter((name) => name.endsWith(".fixture.json")).sort();
  for (const name of fixtureFiles) {
    const fixture = JSON.parse(await readFile(join(fixturesDir, name), "utf8"));
    for (const card of buildPerCardSearchTexts(fixture.request, { cardDetailIndex: cardDetailIndexFromRequest(fixture.request) })) {
      texts.set(card.key, card.text);
    }
  }
  return texts;
}

async function main() {
  const mode = resolveEmbeddingProviderMode(process.env);
  if (mode !== "local") {
    throw new Error(`EMBEDDING_PROVIDER=${mode}: the frozen vectors are built by the local model only (unset EMBEDDING_PROVIDER).`);
  }
  const force = process.argv.includes("--force");
  const { encodeVector } = await import("../apps/backend/src/eval/vectorEncoding.ts");
  const { FROZEN_CARD_VECTORS_PATH, readFrozenCardVectorsOnDisk } = await import("../apps/backend/src/eval/frozenCardVectors.ts");
  const { localEmbeddingProvider, LOCAL_MODEL_ID } = await import("../apps/backend/src/providers/localEmbeddingProvider.ts");

  const texts = await collectCardTexts();
  // Only vectors the running model made are reused; a file from another model is rebuilt whole (REQ-237).
  const onDisk = readFrozenCardVectorsOnDisk();
  const existing = onDisk && onDisk.model === LOCAL_MODEL_ID ? onDisk.vectors : {};
  const out = {};
  let embedded = 0;
  let kept = 0;
  for (const key of [...texts.keys()].sort()) {
    if (!force && existing[key] !== undefined) {
      out[key] = existing[key];
      kept += 1;
      continue;
    }
    const vector = await localEmbeddingProvider.embed(texts.get(key));
    assertQueryEmbedded({ mode: "local", vector, caseId: `card text ${key.slice(0, 12)}` });
    out[key] = encodeVector(vector);
    embedded += 1;
  }

  const bytes = await writeFormattedJson(FROZEN_CARD_VECTORS_PATH, { model: LOCAL_MODEL_ID, vectors: out });
  console.log(`Wrote ${FROZEN_CARD_VECTORS_PATH}: ${Object.keys(out).length} card vectors (${embedded} embedded, ${kept} kept), ${bytes} bytes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
