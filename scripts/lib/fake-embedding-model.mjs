// Test helper (REQ-237): a tiny fake model folder shaped like a trained export -- never real weights.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { SHIPPED_FILES } from "../package-embedding-model.mjs";
import { makeTempDir } from "./temp-dir.mjs";

export function makeFakeModelDir(contentByFile = {}) {
  // Removed when the test file that asked for it finishes.
  const dir = makeTempDir("fake-model-");
  for (const path of SHIPPED_FILES) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), contentByFile[path] ?? `fake ${path}`);
  }
  // A file that is never shipped: the fp32 export.
  writeFileSync(join(dir, "onnx", "model.onnx"), "fake fp32 weights that must not ship");
  return dir;
}
