import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { assertSharpPlatformBinding, planSharpCheck, sharpPlatformFiles } from "./assert-sharp-platform-binding.mjs";

const scriptPath = new URL("./assert-sharp-platform-binding.mjs", import.meta.url).pathname;

/** A fake `node_modules` holding sharp builds for the given `<os>-<arch>` platforms. */
function fakeNodeModules(platforms, { withoutLibvips = [] } = {}) {
  const nodeModulesDir = mkdtempSync(join(tmpdir(), "sharp-platform-"));
  for (const platform of platforms) {
    const [os, arch] = platform.split("-");
    const files = sharpPlatformFiles({ os, arch });
    mkdirSync(dirname(join(nodeModulesDir, files.binding)), { recursive: true });
    writeFileSync(join(nodeModulesDir, files.binding), "binding");
    if (!withoutLibvips.includes(platform)) {
      mkdirSync(join(nodeModulesDir, files.libvipsDir), { recursive: true });
      writeFileSync(join(nodeModulesDir, files.libvipsDir, "libvips-cpp.so.8"), "lib");
    }
  }
  return nodeModulesDir;
}

test("sharpPlatformFiles names the binding and libvips directory sharp loads for linux-arm64", () => {
  const files = sharpPlatformFiles({ os: "linux", arch: "arm64" });
  assert.equal(files.binding, join("@img", "sharp-linux-arm64", "lib", "sharp-linux-arm64.node"));
  assert.equal(files.libvipsDir, join("@img", "sharp-libvips-linux-arm64", "lib"));
});

test("planSharpCheck is ok only with both the binding and libvips present", () => {
  assert.equal(planSharpCheck({ os: "linux", arch: "arm64", hasBinding: true, hasLibvips: true }).ok, true);
  assert.equal(planSharpCheck({ os: "linux", arch: "arm64", hasBinding: true, hasLibvips: false }).ok, false);
  assert.equal(planSharpCheck({ os: "linux", arch: "arm64", hasBinding: false, hasLibvips: true }).ok, false);
});

test("assertSharpPlatformBinding passes when the Lambda's linux-arm64 build is installed", () => {
  const nodeModulesDir = fakeNodeModules(["linux-arm64", "darwin-arm64"]);
  try {
    const logs = [];
    const plan = assertSharpPlatformBinding({ nodeModulesDir, os: "linux", arch: "arm64", log: (l) => logs.push(l) });
    assert.equal(plan.ok, true);
    assert.match(logs[0], /sharp: linux-arm64 build present/);
  } finally {
    rmSync(nodeModulesDir, { recursive: true, force: true });
  }
});

test("assertSharpPlatformBinding refuses the 2026-09-07 production package: only the host's build installed", () => {
  const nodeModulesDir = fakeNodeModules(["linux-x64"]);
  try {
    assert.throws(
      () => assertSharpPlatformBinding({ nodeModulesDir, os: "linux", arch: "arm64", log: () => {} }),
      /sharp has no linux-arm64 build .*EMBEDDING_PROVIDER=local .*--os=linux --cpu=arm64 --libc=glibc.*Refusing to package/
    );
  } finally {
    rmSync(nodeModulesDir, { recursive: true, force: true });
  }
});

test("assertSharpPlatformBinding refuses a binding without its libvips library", () => {
  const nodeModulesDir = fakeNodeModules(["linux-arm64"], { withoutLibvips: ["linux-arm64"] });
  try {
    assert.throws(
      () => assertSharpPlatformBinding({ nodeModulesDir, os: "linux", arch: "arm64", log: () => {} }),
      /missing .*sharp-libvips-linux-arm64/
    );
  } finally {
    rmSync(nodeModulesDir, { recursive: true, force: true });
  }
});

test("the CLI exits 1 on a missing build and 0 when it is present", () => {
  const missing = fakeNodeModules(["darwin-arm64"]);
  const present = fakeNodeModules(["linux-arm64"]);
  try {
    const bad = spawnSync("node", [scriptPath, missing, "linux", "arm64"], { encoding: "utf8" });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /Refusing to package/);

    const good = spawnSync("node", [scriptPath, present, "linux", "arm64"], { encoding: "utf8" });
    assert.equal(good.status, 0, good.stderr);
    assert.match(good.stderr, /linux-arm64 build present/);
  } finally {
    rmSync(missing, { recursive: true, force: true });
    rmSync(present, { recursive: true, force: true });
  }
});

test("scripts/package-lambda.sh installs for the function's platform and asserts sharp's build before zipping", () => {
  const source = readFileSync(new URL("../package-lambda.sh", import.meta.url), "utf8");
  assert.match(source, /npm ci[^\n]*--os=linux[^\n]*--cpu="\$LAMBDA_ARCH"[^\n]*--libc=glibc/);
  assert.match(source, /assert-sharp-platform-binding\.mjs/);
  // The sharp check runs after the install and the onnxruntime prune, before the size measurement.
  const install = source.indexOf("npm ci");
  const prune = source.indexOf("prune-onnxruntime-platforms.mjs");
  const sharp = source.indexOf("assert-sharp-platform-binding.mjs");
  const measure = source.indexOf("unzipped_bytes=");
  assert.ok(install < prune && prune < sharp && sharp < measure, "install → prune → sharp check → measure");
});
