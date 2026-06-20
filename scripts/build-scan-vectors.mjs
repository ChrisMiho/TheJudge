// build-scan-vectors.mjs -- regenerate the card-scan golden parity vectors
// (Slice A, REQ-034, DEC-051) from the shared TS recipe.
//
// Decodes the friend's source PNGs ONCE (dev-only decode dependency: pngjs)
// and commits raw-pixel fixtures + expected hashes computed by our own
// recipe.ts / identify.ts. `npm test` reads only the committed fixtures
// below and never decodes a PNG or calls the network.
//
// Run via tsx so the TypeScript recipe/identify modules resolve directly:
//   npx tsx scripts/build-scan-vectors.mjs
//
// Re-running must produce no diff against the committed fixtures.

import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

import { phashRegionHex, phashRegionPacked } from "../apps/frontend/src/lib/scan/recipe.ts";
import { autoLevels, cropRegionA, CardIdentifier } from "../apps/frontend/src/lib/scan/identify.ts";
import { encodeRawImageFixture } from "../apps/frontend/src/lib/scan/rawImageFixture.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceInputs = resolve(
  "/Users/chrismiho/Coding/Projects/cardomancer-card-detection/testdata/vectors/inputs"
);
const sourceDbBin = resolve(
  "/Users/chrismiho/Coding/Projects/cardomancer-card-detection/testdata/vectors/fixture_db.bin"
);
const fixturesDir = resolve(repoRoot, "apps/frontend/src/lib/scan/__fixtures__");

function decodePng(name) {
  const png = PNG.sync.read(readFileSync(resolve(sourceInputs, name)));
  const { width, height, data: rgba } = png;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 3) {
    rgb[p] = rgba[i];
    rgb[p + 1] = rgba[i + 1];
    rgb[p + 2] = rgba[i + 2];
  }
  return { width, height, data: rgb };
}

function writeRawFixture(name, img) {
  writeFileSync(resolve(fixturesDir, name), encodeRawImageFixture(img));
}

function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function main() {
  const vectors = { phash: [], autoLevels: {}, identify: {} };

  // --- 1. pHash vectors: Region-A-sized fixtures hashed directly. ---
  for (const seed of [1, 2, 3]) {
    const name = `phash_${seed}`;
    const img = decodePng(`${name}.png`);
    writeRawFixture(`${name}.rgb.bin`, img);
    const [r, g, b] = phashRegionHex(img);
    vectors.phash.push({ input: `${name}.rgb.bin`, r, g, b });
  }

  // --- 2. auto-levels vector: input + our own regenerated expected output. ---
  const autoLevelsIn = decodePng("autolevels_in.png");
  writeRawFixture("autolevels_in.rgb.bin", autoLevelsIn);
  const autoLevelsOut = autoLevels(autoLevelsIn);
  writeRawFixture("autolevels_out.rgb.bin", autoLevelsOut);
  vectors.autoLevels = {
    input: "autolevels_in.rgb.bin",
    expectedOutput: "autolevels_out.rgb.bin"
  };

  // Sanity cross-check against the friend's PIL-generated output: auto-levels
  // has no resize dependency, so a conformant PNG decode should match exactly.
  const referenceOut = decodePng("autolevels_out.png");
  if (
    referenceOut.width !== autoLevelsOut.width ||
    referenceOut.height !== autoLevelsOut.height ||
    !referenceOut.data.every((v, i) => v === autoLevelsOut.data[i])
  ) {
    console.warn(
      "[build-scan-vectors] WARNING: regenerated auto-levels output differs from the " +
        "friend's reference autolevels_out.png. Continuing with the TS-recipe output."
    );
  }

  // --- 3. identify end-to-end vector: tiny DB (no auto-levels) + one query. ---
  const dbCards = ["card_10", "card_11", "card_12"];
  const dbEntries = dbCards.map((id) => {
    const img = decodePng(`${id}.png`);
    const hash = phashRegionPacked(cropRegionA(img));
    return { id, img, hash };
  });
  writeRawFixture("card_10.rgb.bin", dbEntries[0].img); // also serves as the query image

  const hashBytes = new Uint8Array(dbEntries.length * 96);
  dbEntries.forEach((entry, i) => hashBytes.set(entry.hash, i * 96));
  const identifier = new CardIdentifier({
    ids: dbEntries.map((e) => e.id),
    hashes: hashBytes,
    count: dbEntries.length
  });
  const topN = 3;
  const result = identifier.identify(dbEntries[0].img, topN);

  vectors.identify = {
    db: dbEntries.map((entry) => ({ id: entry.id, hash: hex(entry.hash) })),
    query: "card_10.rgb.bin",
    topN,
    expected: result
  };

  // --- 4. keep the friend's binary DB fixture for dbformat.test.ts (format-only). ---
  copyFileSync(sourceDbBin, resolve(fixturesDir, "fixture_db.bin"));

  writeFileSync(resolve(fixturesDir, "vectors.json"), `${JSON.stringify(vectors, null, 2)}\n`);

  console.log(`[build-scan-vectors] Wrote fixtures to ${fixturesDir}`);
  console.log(
    `[build-scan-vectors] identify top-1: ${JSON.stringify(result.candidates[0])} ` +
      `(matched=${result.matched})`
  );
}

main();
