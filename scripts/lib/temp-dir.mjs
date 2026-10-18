// Test helper: temp folders that are removed when the test file finishes.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after } from "node:test";

const createdDirs = [];

// `node --test` runs each file in its own process, so this hook is registered
// once per test file and removes every folder that file made.
after(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Creates a temp folder under the OS temp dir and removes it after the test file finishes. */
export function makeTempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  createdDirs.push(dir);
  return dir;
}
