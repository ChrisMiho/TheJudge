// REQ-236 / REQ-237 (acceptance target 12): the repository is public, so no model weights, checkpoints or
// training material may ever be tracked. Weights live only in the private S3 bucket; training pairs,
// checkpoints and exported models live only under git-ignored folders.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const trackedFiles = () => execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).split("\0").filter(Boolean);

test("git ls-files lists no model weights, checkpoints or training pairs", () => {
  const weightLike = /\.(onnx|safetensors|ckpt|gguf|pt|pth)$/i;
  const checkpointFolder = /(^|\/)(ckpt|checkpoints?|checkpoint-\d+)\//i;
  const trainingMaterial = /(^|\/)rule-search-model\//;
  const offenders = trackedFiles().filter((file) => weightLike.test(file) || checkpointFolder.test(file) || trainingMaterial.test(file));
  assert.deepEqual(offenders, []);
});

test("every folder the model pipeline writes is git-ignored", () => {
  const paths = [
    "output/rule-search-model/data/cases.jsonl",
    "output/rule-search-model/data/examples.jsonl",
    "output/rule-search-model/ckpt/F-foldall/model.safetensors",
    "output/rule-search-model/onnx/F-foldall/onnx/model_quantized.onnx",
    "output/rule-search-model/upload/rule-search-000000000000/config.json",
    "output/rule-search-model/venv/bin/python",
    "output/rule-search-eval/percase-shipped.json",
    "apps/backend/data/models/rule-search-000000000000/onnx/model_quantized.onnx",
    "apps/backend/data/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx"
  ];
  for (const path of paths) {
    const result = spawnSync("git", ["check-ignore", "-q", path], { cwd: repoRoot });
    assert.equal(result.status, 0, `${path} must be git-ignored`);
  }
});

test("a weight file dropped anywhere in the tree is ignored too", () => {
  for (const path of ["apps/backend/data/some-model.onnx", "somewhere/else/weights.safetensors"]) {
    assert.equal(spawnSync("git", ["check-ignore", "-q", path], { cwd: repoRoot }).status, 0, `${path} must be git-ignored`);
  }
});
