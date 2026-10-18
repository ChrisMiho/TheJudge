// REQ-237: the manifest writer, tested offline on a tiny fake model folder (never real weights).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { makeFakeModelDir } from "./lib/fake-embedding-model.mjs";
import { uploadCommands } from "./lib/embedding-model-upload.mjs";
import { SHIPPED_FILES, buildManifest, stageUpload } from "./package-embedding-model.mjs";
import { makeTempDir } from "./lib/temp-dir.mjs";

const scriptPath = fileURLToPath(new URL("./package-embedding-model.mjs", import.meta.url));

test("buildManifest records the model id and a SHA-256 and byte size for every shipped file", () => {
  const dir = makeFakeModelDir();
  const manifest = buildManifest({ modelDir: dir });
  assert.match(manifest.modelId, /^rule-search-[0-9a-f]{12}$/);
  assert.equal(manifest.baseModel, "sentence-transformers/all-MiniLM-L6-v2");
  assert.deepEqual(manifest.files.map((file) => file.path), SHIPPED_FILES);
  for (const file of manifest.files) {
    const bytes = readFileSync(join(dir, file.path));
    assert.equal(file.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.equal(file.bytes, bytes.length);
  }
  assert.ok(!manifest.files.some((file) => file.path === "onnx/model.onnx"), "the fp32 export is not shipped");
});

test("the model id is content-addressed: same bytes, same id; one changed byte, a new id", () => {
  const a = buildManifest({ modelDir: makeFakeModelDir() });
  const b = buildManifest({ modelDir: makeFakeModelDir() });
  const c = buildManifest({ modelDir: makeFakeModelDir({ "onnx/model_quantized.onnx": "fake onnx/model_quantized.oXnx" }) });
  assert.equal(a.modelId, b.modelId);
  assert.notEqual(a.modelId, c.modelId);
});

test("buildManifest refuses a folder that is missing a shipped file", () => {
  const dir = makeFakeModelDir();
  writeFileSync(join(dir, "tokenizer.json"), "x");
  const empty = makeTempDir("fake-model-empty-");
  assert.throws(() => buildManifest({ modelDir: empty }), /missing config\.json/);
});

test("stageUpload copies exactly the shipped files and prints the upload commands with profile thejudge-admin", () => {
  const dir = makeFakeModelDir();
  const manifest = buildManifest({ modelDir: dir });
  const stageRoot = makeTempDir("stage-");
  const stageDir = stageUpload({ modelDir: dir, manifest, stageRoot });
  for (const path of SHIPPED_FILES) assert.ok(existsSync(join(stageDir, path)), path);
  assert.ok(!existsSync(join(stageDir, "onnx", "model.onnx")));
  const commands = uploadCommands({ modelId: manifest.modelId, stageDir }).join("\n");
  assert.match(commands, /AWS_PROFILE=thejudge-admin/);
  assert.match(commands, new RegExp(`models/${manifest.modelId}/`));
  assert.match(commands, /aws s3 cp .* --recursive/);
});

test("the command line writes the manifest and prints the upload commands, and runs nothing against AWS", () => {
  const dir = makeFakeModelDir();
  const out = makeTempDir("package-out-");
  const manifestPath = join(out, "manifest.json");
  // aws is replaced by a shim that fails the test if it is ever called.
  const bin = join(out, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "aws"), "#!/usr/bin/env bash\necho AWS WAS CALLED >&2\nexit 99\n", { mode: 0o755 });
  const result = spawnSync("node", [scriptPath, "--model-dir", dir, "--manifest", manifestPath, "--stage", join(out, "upload")], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }
  });
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.match(result.stdout, new RegExp(`Model id: ${manifest.modelId}`));
  assert.match(result.stdout, /aws s3 cp/);
  assert.doesNotMatch(result.stderr, /AWS WAS CALLED/);
});
