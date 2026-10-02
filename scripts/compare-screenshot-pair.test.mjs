import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PNG } from "pngjs";

const script = new URL("./compare-screenshot-pair.mjs", import.meta.url).pathname;

function writePng(dir, name, width, height, fill, patch = []) {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i += 1) {
    png.data.set([fill, fill, fill, 255], i * 4);
  }
  for (const [x, y, value] of patch) png.data.set([value, value, value, 255], (y * width + x) * 4);
  const path = join(dir, name);
  writeFileSync(path, PNG.sync.write(png));
  return path;
}

function runScript(args) {
  return spawnSync("node", [script, ...args], { encoding: "utf8" });
}

test("identical images differ by nothing and print the one-line JSON shape", () => {
  const dir = mkdtempSync(join(tmpdir(), "pair-"));
  const a = writePng(dir, "a.png", 10, 10, 40);
  const b = writePng(dir, "b.png", 10, 10, 40);
  const out = execFileSync("node", [script, "--build", a, "--mockup", b], { encoding: "utf8" });
  assert.equal(out.trim().split("\n").length, 1);
  const result = JSON.parse(out);
  assert.deepEqual(Object.keys(result), [
    "build",
    "mockup",
    "mask",
    "tolerance",
    "comparedPixels",
    "maskedPixels",
    "differingPixels",
    "differingFraction"
  ]);
  assert.equal(result.comparedPixels, 100);
  assert.equal(result.differingPixels, 0);
  assert.equal(result.differingFraction, 0);
  assert.equal(result.mask, null);
});

test("counts differing pixels as a fraction of the compared pixels", () => {
  const dir = mkdtempSync(join(tmpdir(), "pair-"));
  const a = writePng(dir, "a.png", 10, 10, 40);
  const b = writePng(dir, "b.png", 10, 10, 40, [
    [0, 0, 200],
    [1, 0, 200]
  ]);
  const result = JSON.parse(execFileSync("node", [script, "--build", a, "--mockup", b], { encoding: "utf8" }));
  assert.equal(result.differingPixels, 2);
  assert.equal(result.differingFraction, 0.02);
});

test("tolerance lets small per-channel differences count as matching", () => {
  const dir = mkdtempSync(join(tmpdir(), "pair-"));
  const a = writePng(dir, "a.png", 4, 4, 40);
  const b = writePng(dir, "b.png", 4, 4, 50);
  const strict = JSON.parse(execFileSync("node", [script, "--build", a, "--mockup", b], { encoding: "utf8" }));
  const loose = JSON.parse(execFileSync("node", [script, "--build", a, "--mockup", b, "--tolerance", "10"], { encoding: "utf8" }));
  assert.equal(strict.differingPixels, 16);
  assert.equal(loose.differingPixels, 0);
  assert.equal(loose.tolerance, 10);
});

test("a mask removes its regions and the content box limits what is compared", () => {
  const dir = mkdtempSync(join(tmpdir(), "pair-"));
  const a = writePng(dir, "a.png", 10, 10, 40);
  const b = writePng(dir, "b.png", 10, 10, 40, [
    [1, 1, 200],
    [8, 8, 200]
  ]);
  const maskPath = join(dir, "mask.json");
  writeFileSync(
    maskPath,
    JSON.stringify({
      contentBox: { x: 0, y: 0, width: 5, height: 5 },
      regions: [{ name: "card art", reason: "live data", x: 0, y: 0, width: 2, height: 2 }]
    })
  );
  const result = JSON.parse(execFileSync("node", [script, "--build", a, "--mockup", b, "--mask", maskPath], { encoding: "utf8" }));
  assert.equal(result.comparedPixels, 25 - 4);
  assert.equal(result.maskedPixels, 4);
  assert.equal(result.differingPixels, 0);
  assert.equal(result.mask, maskPath);
});

test("a mask region without a name and reason is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "pair-"));
  const a = writePng(dir, "a.png", 4, 4, 40);
  const maskPath = join(dir, "mask.json");
  writeFileSync(maskPath, JSON.stringify({ regions: [{ x: 0, y: 0, width: 1, height: 1 }] }));
  const result = runScript(["--build", a, "--mockup", a, "--mask", maskPath]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /name and a reason/);
});

test("different sizes exit non-zero and print both sizes", () => {
  const dir = mkdtempSync(join(tmpdir(), "pair-"));
  const a = writePng(dir, "a.png", 10, 10, 40);
  const b = writePng(dir, "b.png", 12, 10, 40);
  const result = runScript(["--build", a, "--mockup", b]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /10x10/);
  assert.match(result.stderr, /12x10/);
});
