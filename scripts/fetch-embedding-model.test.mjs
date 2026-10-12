// REQ-237: the fetch script, tested offline against a local folder standing in for S3.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./package-embedding-model.mjs";
import { makeFakeModelDir } from "./lib/fake-embedding-model.mjs";
import { fetchModel, readManifest, verifyModelDirectory, verifyRuleVectorsModel } from "./fetch-embedding-model.mjs";

const scriptPath = fileURLToPath(new URL("./fetch-embedding-model.mjs", import.meta.url));

function setup() {
  const source = makeFakeModelDir();
  const manifest = buildManifest({ modelDir: source });
  const work = mkdtempSync(join(tmpdir(), "fetch-test-"));
  const manifestPath = join(work, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const embeddingsPath = join(work, "embeddings.json");
  writeFileSync(embeddingsPath, JSON.stringify({ model: manifest.modelId }));
  return { source, manifest, work, manifestPath, embeddingsPath, dest: join(work, "models") };
}

const run = (args) => spawnSync("node", [scriptPath, ...args], { encoding: "utf8" });

test("fetches from a local folder and verifies every file", () => {
  const { source, manifest, dest } = setup();
  assert.deepEqual(fetchModel({ manifest, source, destRoot: dest }), []);
  assert.deepEqual(verifyModelDirectory(manifest, join(dest, manifest.modelId)), []);
});

test("the command line fetches and verifies, and --verify alone passes afterwards", () => {
  const { source, manifestPath, embeddingsPath, dest, manifest } = setup();
  const fetched = run(["--source", source, "--dest", dest, "--manifest", manifestPath, "--embeddings", embeddingsPath]);
  assert.equal(fetched.status, 0, fetched.stderr);
  assert.match(fetched.stdout, new RegExp(`${manifest.modelId} verified`));
  const verified = run(["--verify", "--dest", dest, "--manifest", manifestPath, "--embeddings", embeddingsPath]);
  assert.equal(verified.status, 0, verified.stderr);
});

test("refuses a changed byte", () => {
  const { source, manifest, dest } = setup();
  writeFileSync(join(source, "onnx", "model_quantized.onnx"), "fake onnx/model_quantized.onnX");
  const problems = fetchModel({ manifest, source, destRoot: dest });
  assert.ok(problems.some((problem) => /hash mismatch: onnx\/model_quantized\.onnx/.test(problem)), problems.join("; "));
  assert.ok(!existsSync(join(dest, manifest.modelId)), "a bad copy is removed, never left to be loaded");
});

test("refuses a changed size", () => {
  const { source, manifest, dest } = setup();
  writeFileSync(join(source, "config.json"), "fake config.json plus extra");
  assert.ok(fetchModel({ manifest, source, destRoot: dest }).some((problem) => /size mismatch: config\.json/.test(problem)));
});

test("refuses a missing file", () => {
  const { source, manifest, dest } = setup();
  writeFileSync(join(source, "tokenizer.json"), "x");
  const emptySource = mkdtempSync(join(tmpdir(), "empty-source-"));
  const problems = fetchModel({ manifest, source: emptySource, destRoot: dest });
  assert.ok(problems.length > 0 && problems.every((problem) => /could not fetch/.test(problem)), problems.join("; "));
});

test("refuses on a wrong manifest: a hash that does not match the files", () => {
  const { source, manifest, work, dest } = setup();
  const wrong = structuredClone(manifest);
  wrong.files[0].sha256 = "0".repeat(64);
  const wrongPath = join(work, "wrong.json");
  writeFileSync(wrongPath, JSON.stringify(wrong));
  const result = run(["--source", source, "--dest", dest, "--manifest", wrongPath, "--embeddings", join(work, "embeddings.json")]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /NOT verified/);
  assert.match(result.stderr, /hash mismatch/);
});

test("refuses a malformed manifest", () => {
  const { work } = setup();
  const bad = join(work, "bad.json");
  writeFileSync(bad, JSON.stringify({ modelId: "../escape", baseModel: "b", files: [] }));
  assert.throws(() => readManifest(bad), /unexpected shape/);
  const result = run(["--verify", "--manifest", bad]);
  assert.equal(result.status, 1);
});

test("refuses rule vectors built by a different model than the manifest names", () => {
  const { manifest, work } = setup();
  const embeddings = join(work, "other.json");
  writeFileSync(embeddings, JSON.stringify({ model: "Xenova/all-MiniLM-L6-v2" }));
  const problems = verifyRuleVectorsModel(manifest, embeddings);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Xenova\/all-MiniLM-L6-v2.*rule-search-/);
  assert.deepEqual(verifyRuleVectorsModel(manifest, join(work, "embeddings.json")), []);
});

test("--skip-vector-check places a freshly trained model before the rule vectors are rebuilt with it", () => {
  const { source, manifestPath, work, dest, manifest } = setup();
  const embeddings = join(work, "old-vectors.json");
  writeFileSync(embeddings, JSON.stringify({ model: "Xenova/all-MiniLM-L6-v2" }));
  const refused = run(["--source", source, "--dest", dest, "--manifest", manifestPath, "--embeddings", embeddings]);
  assert.equal(refused.status, 1);
  const placed = run(["--source", source, "--dest", dest, "--manifest", manifestPath, "--embeddings", embeddings, "--skip-vector-check"]);
  assert.equal(placed.status, 0, placed.stderr);
  assert.match(placed.stdout, new RegExp(`${manifest.modelId} verified`));
});

test("--verify fails when nothing was fetched yet", () => {
  const { manifestPath, embeddingsPath, dest } = setup();
  const result = run(["--verify", "--dest", dest, "--manifest", manifestPath, "--embeddings", embeddingsPath]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /model folder missing/);
});

test("asks for a source when it is neither verifying nor given one", () => {
  const { manifestPath, embeddingsPath, dest } = setup();
  const result = run(["--dest", dest, "--manifest", manifestPath, "--embeddings", embeddingsPath]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--source/);
  mkdirSync(dest, { recursive: true });
  assert.equal(readFileSync(manifestPath, "utf8").length > 0, true);
});
