import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { BINDING_FILE, NAPI_DIR, planPrune, pruneOnnxruntimePlatforms } from "./prune-onnxruntime-platforms.mjs";

const scriptPath = new URL("./prune-onnxruntime-platforms.mjs", import.meta.url).pathname;

function fakeNodeModules(platforms) {
  const nodeModulesDir = mkdtempSync(join(tmpdir(), "prune-onnx-"));
  for (const [os, arches] of Object.entries(platforms)) {
    for (const arch of arches) {
      const dir = join(nodeModulesDir, NAPI_DIR, os, arch);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, BINDING_FILE), "binding");
      writeFileSync(join(dir, "libonnxruntime.so.1"), "lib");
    }
  }
  return nodeModulesDir;
}

const SHIPPED = { darwin: ["arm64"], linux: ["arm64", "x64"], win32: ["x64"] };

test("planPrune keeps the Lambda's linux/arm64 and removes every other platform", () => {
  const plan = planPrune({ platforms: SHIPPED, os: "linux", arch: "arm64", hasBinding: true });
  assert.equal(plan.keep, "linux/arm64");
  assert.deepEqual(plan.remove.sort(), ["darwin", "linux/x64", "win32"]);
  assert.equal(plan.ok, true);
});

test("planPrune is not ok when the target binding is absent, whatever else is present", () => {
  const plan = planPrune({ platforms: { linux: ["x64"] }, os: "linux", arch: "arm64", hasBinding: false });
  assert.equal(plan.ok, false);
});

test("pruneOnnxruntimePlatforms leaves only linux/arm64 on disk (the 2026-09-07 production failure inverted)", () => {
  const nodeModulesDir = fakeNodeModules(SHIPPED);
  try {
    const logs = [];
    const plan = pruneOnnxruntimePlatforms({ nodeModulesDir, os: "linux", arch: "arm64", log: (l) => logs.push(l) });
    assert.equal(plan.keep, "linux/arm64");
    assert.ok(existsSync(join(nodeModulesDir, NAPI_DIR, "linux", "arm64", BINDING_FILE)), "arm64 binding survives");
    assert.equal(existsSync(join(nodeModulesDir, NAPI_DIR, "linux", "x64")), false, "x64 is removed");
    assert.equal(existsSync(join(nodeModulesDir, NAPI_DIR, "darwin")), false);
    assert.equal(existsSync(join(nodeModulesDir, NAPI_DIR, "win32")), false);
    assert.match(logs[0], /kept linux\/arm64/);
  } finally {
    rmSync(nodeModulesDir, { recursive: true, force: true });
  }
});

test("pruneOnnxruntimePlatforms refuses before deleting anything when the target binding is missing", () => {
  const nodeModulesDir = fakeNodeModules({ linux: ["x64"], darwin: ["arm64"] });
  try {
    assert.throws(
      () => pruneOnnxruntimePlatforms({ nodeModulesDir, os: "linux", arch: "arm64", log: () => {} }),
      /no linux\/arm64\/onnxruntime_binding\.node .*EMBEDDING_PROVIDER=local .*Refusing to package/
    );
    assert.ok(existsSync(join(nodeModulesDir, NAPI_DIR, "linux", "x64", BINDING_FILE)), "nothing was deleted");
    assert.ok(existsSync(join(nodeModulesDir, NAPI_DIR, "darwin", "arm64", BINDING_FILE)), "nothing was deleted");
  } finally {
    rmSync(nodeModulesDir, { recursive: true, force: true });
  }
});

test("the CLI exits 1 with the refusal on a missing binding and 0 after a successful prune", () => {
  const missing = fakeNodeModules({ linux: ["x64"] });
  const present = fakeNodeModules(SHIPPED);
  try {
    const bad = spawnSync("node", [scriptPath, missing, "linux", "arm64"], { encoding: "utf8" });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /Refusing to package/);

    const good = spawnSync("node", [scriptPath, present, "linux", "arm64"], { encoding: "utf8" });
    assert.equal(good.status, 0, good.stderr);
    assert.match(good.stderr, /kept linux\/arm64, removed/);
    assert.equal(existsSync(join(present, NAPI_DIR, "linux", "x64")), false);
  } finally {
    rmSync(missing, { recursive: true, force: true });
    rmSync(present, { recursive: true, force: true });
  }
});

test("scripts/package-lambda.sh invokes the pruner for linux/arm64 and no longer deletes linux/arm64 by hand", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../package-lambda.sh", import.meta.url), "utf8");
  assert.match(source, /prune-onnxruntime-platforms\.mjs/);
  assert.match(source, /LAMBDA_ARCH:-arm64/);
  assert.doesNotMatch(source, /rm -rf[^\n]*linux\/arm64/);
});
