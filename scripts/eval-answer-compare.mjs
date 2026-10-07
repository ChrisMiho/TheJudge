// Paired comparison of two experiment runs (REQ-228). Offline: it reads two run
// folders under output/answer-quality/runs/ (or any two folder paths) and prints
// the report; no provider call, no network call, never a gate. It refuses, and
// says why, when the two runs were not judged the same way.
//
//   npm run eval:answer-quality:compare -- <run-a> <run-b>
//   npm run eval:answer-quality:compare -- <run-a> <run-b> --model gpt-4.1
//   npm run eval:answer-quality:compare -- <run> <run> --arm-a A --arm-b C   # two arms of one run
//
// Selectors: --arm / --model apply to both sides; --arm-a, --arm-b, --model-a,
// --model-b to one side. The default arm is A (the production prompt); the default
// model is the run's only model.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compareRunSides, formatComparison, readRunFolder, selectSide } from "./lib/answer-compare.mjs";
import { EXPERIMENT_RUNS_DIR } from "./lib/experiment-run.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function parseCompareArgs(argv) {
  const positional = [];
  const selectors = { arm: undefined, armA: undefined, armB: undefined, model: undefined, modelA: undefined, modelB: undefined };
  const flagToKey = { "--arm": "arm", "--arm-a": "armA", "--arm-b": "armB", "--model": "model", "--model-a": "modelA", "--model-b": "modelB" };
  for (let i = 0; i < argv.length; i++) {
    const key = flagToKey[argv[i]];
    if (key) selectors[key] = argv[++i];
    else if (argv[i].startsWith("--")) throw new Error(`Unknown option ${argv[i]}.`);
    else positional.push(argv[i]);
  }
  if (positional.length !== 2) throw new Error("Name exactly two runs: npm run eval:answer-quality:compare -- <run-a> <run-b>.");
  return { runs: positional, selectors };
}

/** A bare run id resolves under the runs folder; anything with a path separator is a folder path. */
export function resolveRunFolder(arg, { runsRoot, cwd }) {
  return arg.includes("/") ? resolve(cwd, arg) : resolve(runsRoot, arg);
}

export async function runCompare({
  argv = process.argv.slice(2),
  log = console.log,
  runsRoot = resolve(repoRoot, EXPERIMENT_RUNS_DIR),
  cwd = process.cwd()
} = {}) {
  if (argv.length === 0) {
    // Asked with nothing to compare: say how, and which runs exist, rather than fail.
    const { readdir } = await import("node:fs/promises");
    const available = await readdir(runsRoot).catch(() => []);
    log(
      [
        "Compare two experiment runs (offline): npm run eval:answer-quality:compare -- <run-a> <run-b> [--arm A] [--model <id>]",
        `Runs under ${runsRoot}: ${available.length === 0 ? "none yet" : available.sort().join(", ")}`
      ].join("\n")
    );
    return { usage: true, available };
  }
  const { runs, selectors } = parseCompareArgs(argv);
  const [runA, runB] = await Promise.all(runs.map((arg) => readRunFolder(resolveRunFolder(arg, { runsRoot, cwd }))));
  const sideA = selectSide(runA, { arm: selectors.armA ?? selectors.arm, model: selectors.modelA ?? selectors.model });
  const sideB = selectSide(runB, { arm: selectors.armB ?? selectors.arm, model: selectors.modelB ?? selectors.model });
  const result = compareRunSides(sideA, sideB);
  log(formatComparison(result, { labelA: runs[0], labelB: runs[1] }));
  if (result.refused) process.exitCode = 1;
  return result;
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  runCompare().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
