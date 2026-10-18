import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

const createdDirs: string[] = [];

// Registered once per test file (vitest loads this module fresh for each file),
// so every folder made through makeTempDir is removed when that file finishes.
afterAll(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Creates a temp folder under the OS temp dir and removes it after the test file finishes. */
export function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  createdDirs.push(dir);
  return dir;
}
