// REQ-184: the deployed backend sets EMBEDDING_PROVIDER=local, which makes
// the packaged local embedding model a hard requirement, not an optional
// nicety — a package built without it would ship a Lambda that silently
// falls back to lexical retrieval on every cold start, the same class of
// measurement/deploy-integrity bug REQ-177 fixed for the benchmark. This
// proves scripts/package-lambda.sh actually refuses to build in that case,
// rather than assuming the refusal exists.
//
// Runs the real script (copied into an isolated scratch directory so it
// computes its own `repo_root` there) with the model cache absent. `npx` is
// shadowed by a no-op shim on PATH so the script's best-effort warm attempt
// exits immediately instead of making a real network call to Hugging Face —
// this test proves the refusal fires when warming still leaves the cache
// empty, not whether warming itself succeeds (that's warm-embedding-model-cache.mjs's
// own concern). No network call, no npm install, no zip — the refusal in
// package-lambda.sh fires before any of that heavier work starts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, chmodSync, readFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const currentDir = dirname(fileURLToPath(import.meta.url));
const realScriptPath = join(currentDir, "package-lambda.sh");

function buildScratchRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), "package-lambda-test-"));
  mkdirSync(join(repoRoot, "scripts"), { recursive: true });
  mkdirSync(join(repoRoot, "apps", "backend", "data"), { recursive: true });

  // The real script, copied so its own `${BASH_SOURCE[0]}`-derived repo_root
  // resolves inside this scratch directory instead of the real checkout.
  cpSync(realScriptPath, join(repoRoot, "scripts", "package-lambda.sh"));

  // No-op npx shim: `npx tsx scripts/warm-embedding-model-cache.mjs` exits 0
  // immediately, so the script's warm attempt never touches the network.
  const fakeBin = join(repoRoot, "fakebin");
  mkdirSync(fakeBin, { recursive: true });
  const npxShimPath = join(fakeBin, "npx");
  writeFileSync(npxShimPath, "#!/usr/bin/env bash\nexit 0\n");
  chmodSync(npxShimPath, 0o755);

  return { repoRoot, fakeBin };
}

test("scripts/package-lambda.sh refuses to build when the local embedding model cache is absent (REQ-184)", () => {
  const { repoRoot, fakeBin } = buildScratchRepo();
  // The model cache directory intentionally does not exist in this scratch
  // repo — that is the condition under test.

  const result = spawnSync("bash", [join(repoRoot, "scripts", "package-lambda.sh")], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` },
    timeout: 5000
  });

  assert.equal(result.status, 1, `expected exit 1, got ${result.status}. stderr:\n${result.stderr}`);
  assert.match(result.stderr, /refusing to build a Lambda package/i);
  assert.match(result.stderr, /EMBEDDING_PROVIDER=local/);
  assert.match(result.stderr, /model_quantized\.onnx/);

  // Never reached the heavier work: no artifact, no package root left with
  // copied application files.
  const packageRootBackendPackageJson = join(repoRoot, ".tmp", "lambda-package", "apps", "backend", "package.json");
  assert.throws(() => readFileSync(packageRootBackendPackageJson));
});

test("scripts/package-lambda.sh does not refuse when the model cache is already present", () => {
  const { repoRoot, fakeBin } = buildScratchRepo();
  const modelDir = join(repoRoot, "apps", "backend", "data", "models", "Xenova", "all-MiniLM-L6-v2", "onnx");
  mkdirSync(modelDir, { recursive: true });
  writeFileSync(join(modelDir, "model_quantized.onnx"), "not a real model, just present for the check");

  const result = spawnSync("bash", [join(repoRoot, "scripts", "package-lambda.sh")], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` },
    timeout: 5000
  });

  // The script proceeds past the model-cache refusal (no such message) and
  // fails later for an unrelated reason — this scratch repo has no real
  // package.json/node_modules to copy or install, which is expected and out
  // of scope for this test; only the absence of the refusal is asserted.
  assert.doesNotMatch(result.stderr ?? "", /refusing to build a Lambda package/i);
});
