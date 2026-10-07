// Compares two evidence-trace folders (REQ-229), offline. Each folder was
// produced by `npm run eval:evidence-trace` from its own revision's worktree
// (the tooling commits applied on top). It reads two `trace.json` files and
// reports both commits, per-case prompt-hash equality, how coverage differs,
// and any case in only one trace. It never names a winner and is never a gate.
//
//   npm run eval:evidence-trace:compare -- <trace-folder-a> <trace-folder-b>

import { resolve } from "node:path";

import { compareTraces, formatTraceComparison, readTraceFolder } from "./lib/evidence-trace.mjs";

export async function runTraceCompare({ argv = process.argv.slice(2), log = console.log, cwd = process.cwd() } = {}) {
  const folders = argv.filter((arg) => !arg.startsWith("--"));
  if (folders.length !== 2) {
    throw new Error("Name exactly two trace folders: npm run eval:evidence-trace:compare -- <trace-folder-a> <trace-folder-b>.");
  }
  const [a, b] = await Promise.all(folders.map((folder) => readTraceFolder(resolve(cwd, folder))));
  const result = compareTraces(a, b);
  log(formatTraceComparison(result, { labelA: folders[0], labelB: folders[1] }));
  return result;
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  runTraceCompare().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
