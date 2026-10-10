// Paired comparison of two experiment runs (REQ-228). Offline: it reads two run
// folders under output/answer-quality/runs/ (or any two folder paths) and prints
// the report; no provider call, no network call, never a gate. It refuses, and
// says why, when the two runs were not judged the same way.
//
//   npm run eval:answer-quality:compare -- <run-a> <run-b>
//   npm run eval:answer-quality:compare -- <run-a> <run-b> --model gpt-4.1
//   npm run eval:answer-quality:compare -- <run> <run> --arm-a A --arm-b C   # two arms of one run
//   npm run eval:answer-quality:compare -- <run> <run> --arm-a A --arm-b R --repeats 1-3   # repeats 1-3 of both arms
//   npm run eval:answer-quality:compare -- <run> <run> --arm A --repeats-a 1-3 --repeats-b 4-6   # noise floor: one arm's halves
//
// Selectors: --arm / --model apply to both sides; --arm-a, --arm-b, --model-a,
// --model-b to one side; --cap picks one excerpt cap on both. The default arm is A
// (the production prompt); the default model is the run's only model.
// --repeats <from>-<to> (also --repeats-a / --repeats-b) keeps only the records whose
// repeat number is in the range (or a list such as 1,3,5-6); the default is every repeat.
// Two sides that select the same records are refused: a side compared with itself says nothing.
//
// Besides printing, it writes a numbers-and-ids-only `compare-<a>-<b>.json` and the
// same report as `compare-<a>-<b>.md` under output/answer-quality/ (gitignored).

import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compareRunSides, formatComparison, readRunFolder, selectSide, selfComparisonReasons } from "./lib/answer-compare.mjs";
import { EXPERIMENT_RUNS_DIR } from "./lib/experiment-run.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function parseCompareArgs(argv) {
  const positional = [];
  const selectors = { arm: undefined, armA: undefined, armB: undefined, model: undefined, modelA: undefined, modelB: undefined, cap: undefined, repeats: undefined, repeatsA: undefined, repeatsB: undefined };
  const flagToKey = {
    "--arm": "arm",
    "--arm-a": "armA",
    "--arm-b": "armB",
    "--model": "model",
    "--model-a": "modelA",
    "--model-b": "modelB",
    "--cap": "cap",
    "--repeats": "repeats",
    "--repeats-a": "repeatsA",
    "--repeats-b": "repeatsB"
  };
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
  outputRoot = resolve(repoRoot, "output/answer-quality"),
  cwd = process.cwd()
} = {}) {
  if (argv.length === 0) {
    // Asked with nothing to compare: say how, and which runs exist, rather than fail.
    const { readdir } = await import("node:fs/promises");
    const available = await readdir(runsRoot).catch(() => []);
    log(
      [
        "Compare two experiment runs (offline): npm run eval:answer-quality:compare -- <run-a> <run-b> [--arm A] [--model <id>] [--repeats 1-3]",
        `Runs under ${runsRoot}: ${available.length === 0 ? "none yet" : available.sort().join(", ")}`
      ].join("\n")
    );
    return { usage: true, available };
  }
  const { runs, selectors } = parseCompareArgs(argv);
  const [runA, runB] = await Promise.all(runs.map((arg) => readRunFolder(resolveRunFolder(arg, { runsRoot, cwd }))));
  const sideA = selectSide(runA, { arm: selectors.armA ?? selectors.arm, model: selectors.modelA ?? selectors.model, cap: selectors.cap, repeats: selectors.repeatsA ?? selectors.repeats });
  const sideB = selectSide(runB, { arm: selectors.armB ?? selectors.arm, model: selectors.modelB ?? selectors.model, cap: selectors.cap, repeats: selectors.repeatsB ?? selectors.repeats });
  const selfReasons = selfComparisonReasons(sideA, sideB);
  const result = selfReasons.length > 0 ? { refused: true, selfComparison: true, reasons: selfReasons } : compareRunSides(sideA, sideB);
  const report = formatComparison(result, { labelA: runs[0], labelB: runs[1] });
  log(report);
  if (result.refused) {
    process.exitCode = 1;
    return result;
  }
  const stem = `compare-${basename(runs[0])}-${basename(runs[1])}`;
  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, `${stem}.json`), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(resolve(outputRoot, `${stem}.md`), `\`\`\`text\n${report}\n\`\`\`\n`, "utf8");
  return result;
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  runCompare().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
