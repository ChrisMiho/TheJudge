// The owner review commands for the rules test corpus (REQ-224). No provider
// call, no network call, no embedder: they read the committed corpus and the
// committed rule, card and ruling data, and write only gitignored batch files
// (render) or the case files the owner's verdicts name (apply).
//
//   npm run eval:rules-review:render                         # pending cases -> output/rules-review/batch-001.md ...
//   npm run eval:rules-review:render -- --batch-size 40 --include-needs-edit
//   npm run eval:rules-review:apply -- output/rules-review/batch-001.md [more batch files]
//
// Render writes every `draft` case, every `approved` case whose rule, oracle or
// ruling text changed since it was approved (marked stale, with the changed
// text), and with `--include-needs-edit` every `needs-edit` case, grouped by
// mechanic then rules section. Apply writes each filled-in verdict into its case
// file: `review.status`, `review.reviewedOn`, the note, and on `approve` the
// re-recorded `snapshot`. It changes no other field and refuses, naming the
// case, anything the owner could not have seen (see scripts/lib/rules-review.mjs).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CASES_DIR, loadGoldCases, loadSnapshotSources, readCaseFiles } from "./lib/gold-cases.mjs";
import { DEFAULT_BATCH_SIZE, applyVerdicts, parseBatch, renderBatches } from "./lib/rules-review.mjs";
import { writeFormattedJson } from "./lib/write-formatted-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_REVIEW_DIR = "output/rules-review";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function flagValue(argv, name) {
  const index = argv.indexOf(name);
  return index !== -1 && index + 1 < argv.length ? argv[index + 1] : undefined;
}

/** Renders pending cases into batch files. Returns the files written. */
export async function renderCommand({
  argv = [],
  casesDir = CASES_DIR,
  loadCases = loadGoldCases,
  loadSources = loadSnapshotSources,
  log = console.log,
  now = today
} = {}) {
  const batchSize = flagValue(argv, "--batch-size") === undefined ? DEFAULT_BATCH_SIZE : Number(flagValue(argv, "--batch-size"));
  const outDir = resolve(repoRoot, flagValue(argv, "--out") ?? DEFAULT_REVIEW_DIR);
  const includeNeedsEdit = argv.includes("--include-needs-edit");

  const cases = await loadCases(casesDir);
  const sources = await loadSources();
  const batches = renderBatches({ cases, sources, includeNeedsEdit, batchSize, renderedOn: now() });
  if (batches.length === 0) {
    log("Nothing is pending: no draft case, no stale approved case" + (includeNeedsEdit ? ", no needs-edit case." : "."));
    return [];
  }
  await mkdir(outDir, { recursive: true });
  const written = [];
  for (const batch of batches) {
    const filePath = join(outDir, batch.name);
    await writeFile(filePath, batch.markdown, "utf8");
    written.push(filePath);
    log(`Wrote ${filePath} (${batch.caseIds.length} cases)`);
  }
  log(`Fill in each ">>> Verdict:" line, then run: npm run eval:rules-review:apply -- ${written.join(" ")}`);
  return written;
}

/**
 * Applies filled batches to the case files. Returns `{ updated, refused,
 * skipped }`; a refusal is reported and never throws, so every valid verdict in
 * the batch is still applied.
 */
export async function applyCommand({
  argv = [],
  casesDir = CASES_DIR,
  loadSources = loadSnapshotSources,
  readBatch = (filePath) => readFile(filePath, "utf8"),
  writeCase = (filePath, value) => writeFormattedJson(filePath, value),
  log = console.log,
  now = today
} = {}) {
  const batchFiles = argv.filter((arg) => !arg.startsWith("--"));
  if (batchFiles.length === 0) {
    throw new Error("Name the filled batch file(s) to apply, such as: npm run eval:rules-review:apply -- output/rules-review/batch-001.md");
  }
  const sources = await loadSources();
  const rawByCaseId = new Map((await readCaseFiles(casesDir)).map(({ fileName, case: raw }) => [raw.id, { fileName, case: raw }]));

  const result = { updated: [], refused: [], skipped: [] };
  for (const batchFile of batchFiles) {
    const { entries, problems } = parseBatch(await readBatch(batchFile));
    for (const problem of problems) result.refused.push({ id: batchFile, reason: problem });
    const applied = applyVerdicts({ entries, rawByCaseId, sources, reviewedOn: now() });
    for (const update of applied.updated) {
      await writeCase(join(casesDir, update.fileName), update.case);
      // A later batch naming the same case sees the file as it now stands.
      rawByCaseId.set(update.id, { fileName: update.fileName, case: update.case });
      log(`Applied: ${update.id} -> ${update.status}`);
    }
    result.updated.push(...applied.updated);
    result.refused.push(...applied.refused);
    result.skipped.push(...applied.skipped);
  }
  for (const refusal of result.refused) log(`Refused: ${refusal.id} -- ${refusal.reason}`);
  log(`${result.updated.length} applied, ${result.refused.length} refused, ${result.skipped.length} skipped (blank verdict).`);
  return result;
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  const [command, ...argv] = process.argv.slice(2);
  const action = command === "render" ? renderCommand : command === "apply" ? applyCommand : null;
  if (!action) {
    console.error("Usage: node scripts/rules-review.mjs render|apply [options]");
    process.exitCode = 1;
  } else {
    action({ argv })
      .then((result) => {
        if (command === "apply" && result.refused.length > 0) process.exitCode = 1;
      })
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
