// Imports the local practice suite's questions into the gitignored suite folder
// (REQ-232). Local only. The owner runs this by hand from
// the main checkout; no agent and no test ever runs it.
//
//   npm run eval:practice-suite:import
//
// It refuses to start unless git reports the suite folder ignored and the
// PRACTICE_SUITE_API_URL environment variable holds the question API address. It prints
// counts only. Stop it any time; running it again resumes from the last saved id.

import { pathToFileURL } from "node:url";

import { API_URL_ENV, importQuestions } from "./lib/practice-suite-import.mjs";
import { SUITE_DIR, assertSuiteIgnored } from "./lib/practice-suite.mjs";

async function main() {
  assertSuiteIgnored();
  const baseUrl = process.env[API_URL_ENV];
  if (!baseUrl) throw new Error(`Set ${API_URL_ENV} to the question API address before importing.`);
  const counts = await importQuestions({
    baseUrl,
    fetch: globalThis.fetch,
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    suiteDir: SUITE_DIR
  });
  console.log(
    `Import stopped (${counts.stopReason}): saved ${counts.saved}, skipped ${counts.skipped}, already frozen ${counts.alreadyFrozen}, requests ${counts.requests}.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
