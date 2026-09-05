// REQ-181 (E10, review loop 1): builds the committed frozen query-embedding
// fixture the eval harness uses to run `system3-expected-recall` and
// `system3-noise-excluded` against the semantic path with no live embedding
// call at test time. One vector per labelled fixture question (the exact
// retrieval query text production would build — question plus each card's
// compact per-card signal, REQ-178/REQ-180), embedded once here with the
// shipped local model and committed.
//
// "Labelled" means the fixture carries `expectedSupplementalRuleIds` and/or
// `forbiddenSupplementalRuleIds` — the only fixtures the two checks above run
// against (contextEvaluationHarness.ts). That is 8 of the fixture corpus
// today, not 9: `quick-lookup-off-domain` asserts only System 2 topic ids, no
// supplemental expectation, so System 3 never scores it either path.
//
// Re-run this whenever a labelled fixture's question or card data changes:
//
//   npm run eval:build-frozen-query-embeddings

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRetrievalQueryText } from "../apps/backend/src/prompt/preparation.ts";
import { cardDetailIndexFromRequest } from "../apps/backend/src/eval/fixtureCardDetail.ts";
import { localEmbeddingProvider } from "../apps/backend/src/providers/localEmbeddingProvider.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = resolve(repoRoot, "apps/backend/src/eval/fixtures");
const outputPath = resolve(fixturesDir, "frozen-query-embeddings.json");

async function loadLabeledFixtures() {
  const fileNames = await readdir(fixturesDir);
  const fixtureFiles = fileNames.filter((name) => name.endsWith(".fixture.json")).sort();
  const fixtures = await Promise.all(
    fixtureFiles.map(async (name) => JSON.parse(await readFile(join(fixturesDir, name), "utf8")))
  );
  // Only fixtures the harness actually runs `system3-expected-recall` /
  // `system3-noise-excluded` against — i.e. ones with an expected or
  // forbidden supplemental-rule-id list (see contextEvaluationHarness.ts:583).
  return fixtures.filter(
    (fixture) => fixture.expected?.expectedSupplementalRuleIds || fixture.expected?.forbiddenSupplementalRuleIds
  );
}

function buildQueryTextFor(fixture) {
  const cardDetailIndex = cardDetailIndexFromRequest(fixture.request);
  // `buildRetrievalQueryText` already branches on request.mode internally
  // (lookup vs. game) — this is the exact function production calls to build
  // the text it embeds, so the frozen vector matches the real query.
  return buildRetrievalQueryText(fixture.request, { cardDetailIndex });
}

async function main() {
  const fixtures = await loadLabeledFixtures();
  const out = {};

  for (const fixture of fixtures) {
    const queryText = buildQueryTextFor(fixture);
    const vector = await localEmbeddingProvider.embed(queryText);
    if (!vector) {
      throw new Error(`Failed to embed fixture "${fixture.id}" — is the local model cache warm?`);
    }
    out[fixture.id] = { question: queryText, vector };
    console.log(`Embedded ${fixture.id}`);
  }

  await writeFile(outputPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath} (${Object.keys(out).length} fixtures)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
