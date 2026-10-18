// REQ-237 / REQ-184: once a trained model's manifest is committed, scripts/package-lambda.sh refuses to
// build a package whose bundled model is not verified against it. Runs the real script in a scratch repo
// with a tiny fake model folder: no network, no npm install, no zip.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { makeFakeModelDir } from "./lib/fake-embedding-model.mjs";
import { SHIPPED_FILES, buildManifest } from "./package-embedding-model.mjs";
import { makeTempDir } from "./lib/temp-dir.mjs";

const currentDir = dirname(fileURLToPath(import.meta.url));

function scratchRepo({ embeddingsModel } = {}) {
  const source = makeFakeModelDir();
  const manifest = buildManifest({ modelDir: source });
  const repoRoot = makeTempDir("package-lambda-model-test-");
  mkdirSync(join(repoRoot, "scripts"), { recursive: true });
  mkdirSync(join(repoRoot, "apps", "backend", "data"), { recursive: true });
  cpSync(join(currentDir, "package-lambda.sh"), join(repoRoot, "scripts", "package-lambda.sh"));
  cpSync(join(currentDir, "fetch-embedding-model.mjs"), join(repoRoot, "scripts", "fetch-embedding-model.mjs"));
  writeFileSync(join(repoRoot, "apps", "backend", "data", "embeddingModel.manifest.json"), JSON.stringify(manifest));
  writeFileSync(
    join(repoRoot, "apps", "backend", "data", "gameRulesRuleEmbeddings.json"),
    JSON.stringify({ model: embeddingsModel ?? manifest.modelId })
  );
  const fakeBin = join(repoRoot, "fakebin");
  mkdirSync(fakeBin, { recursive: true });
  writeFileSync(join(fakeBin, "npx"), "#!/usr/bin/env bash\nexit 0\n");
  chmodSync(join(fakeBin, "npx"), 0o755);
  return { repoRoot, fakeBin, source, manifest };
}

function placeModel(repoRoot, source, modelId) {
  const dest = join(repoRoot, "apps", "backend", "data", "models", modelId);
  for (const path of SHIPPED_FILES) {
    mkdirSync(dirname(join(dest, path)), { recursive: true });
    cpSync(join(source, path), join(dest, path));
  }
  return dest;
}

const run = (repoRoot, fakeBin, extraEnv = {}) =>
  spawnSync("bash", [join(repoRoot, "scripts", "package-lambda.sh")], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, ...extraEnv },
    timeout: 20000
  });

test("refuses to package when the manifest's model is not in the local cache (REQ-237)", () => {
  const { repoRoot, fakeBin } = scratchRepo();
  const result = run(repoRoot, fakeBin);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /not verified against .*embeddingModel\.manifest\.json/);
  assert.match(result.stderr, /fetch-embedding-model\.mjs --source/);
});

test("refuses when one byte of the packaged model differs from the manifest", () => {
  const { repoRoot, fakeBin, source, manifest } = scratchRepo();
  const dest = placeModel(repoRoot, source, manifest.modelId);
  writeFileSync(join(dest, "onnx", "model_quantized.onnx"), "fake onnx/model_quantized.onnX");
  const result = run(repoRoot, fakeBin);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /hash mismatch: onnx\/model_quantized\.onnx/);
});

test("refuses when the committed rule vectors name a different model than the manifest", () => {
  const { repoRoot, fakeBin, source, manifest } = scratchRepo({ embeddingsModel: "Xenova/all-MiniLM-L6-v2" });
  placeModel(repoRoot, source, manifest.modelId);
  const result = run(repoRoot, fakeBin);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Xenova\/all-MiniLM-L6-v2/);
  assert.match(result.stderr, /rule-search-/);
});

test("does not refuse when the model is verified (it fails later, for the scratch repo's missing package files)", () => {
  const { repoRoot, fakeBin, source, manifest } = scratchRepo();
  placeModel(repoRoot, source, manifest.modelId);
  const result = run(repoRoot, fakeBin);
  assert.doesNotMatch(result.stderr, /not verified against/);
  assert.doesNotMatch(result.stderr, /refusing to build a Lambda package/i);
});

test("fetches from EMBEDDING_MODEL_SOURCE when the model is not cached, then verifies it", () => {
  const { repoRoot, fakeBin, source } = scratchRepo();
  const result = run(repoRoot, fakeBin, { EMBEDDING_MODEL_SOURCE: source });
  assert.doesNotMatch(result.stderr, /not verified against/);
  assert.match(result.stderr, /Fetching the embedding model/);
});
