// Deletes the local practice suite's whole folder and nothing else (REQ-232).
// Used with permission, local only.
//
//   npm run eval:rulesguru:purge             prints how many files it would delete
//   npm run eval:rulesguru:purge -- --yes    deletes the suite folder
//
// It refuses a target that does not resolve to exactly the suite folder: no
// parent path, no sibling, no symlink escape.

import { lstat, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { SUITE_DIR, assertSuiteIgnored, resolveInsideSuite } from "./lib/rulesguru-suite.mjs";

async function countFiles(dir) {
  let count = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += await countFiles(join(dir, entry.name));
    else count += 1;
  }
  return count;
}

/**
 * Counts, and with `yes` deletes, the suite folder. `target` defaults to the
 * suite folder itself; anything that does not resolve to exactly the suite
 * folder is refused. Returns `{ count, deleted }`.
 */
export async function purgeSuite({ suiteDir = SUITE_DIR, target = suiteDir, yes = false } = {}) {
  const root = resolveInsideSuite(suiteDir, { suiteDir });
  const resolved = resolveInsideSuite(target, { suiteDir });
  if (resolved !== root) throw new Error(`Refusing to purge ${target}: it is not exactly the suite folder (${suiteDir}).`);

  let stats;
  try {
    stats = await lstat(suiteDir);
  } catch (error) {
    if (error?.code === "ENOENT") return { count: 0, deleted: false };
    throw error;
  }
  if (stats.isSymbolicLink()) throw new Error(`Refusing to purge ${suiteDir}: the suite folder is a symbolic link.`);

  const count = await countFiles(suiteDir);
  if (!yes) return { count, deleted: false };
  await rm(suiteDir, { recursive: true, force: true });
  return { count, deleted: true };
}

async function main() {
  assertSuiteIgnored();
  const yes = process.argv.slice(2).includes("--yes");
  const { count, deleted } = await purgeSuite({ yes });
  console.log(
    deleted
      ? `Deleted the suite folder (${count} files).`
      : `Would delete ${count} files from the suite folder. Run again with --yes to delete.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
