// Imports the local practice suite's questions into the gitignored suite folder
// (REQ-232). Used with permission, local only. The owner runs this by hand from
// the main checkout; no agent and no test ever runs it.
//
//   npm run eval:rulesguru:import
//
// It refuses to start unless git reports the suite folder ignored. It prints
// counts only. Stop it any time; running it again resumes from the last saved id.

import { pathToFileURL } from "node:url";

import { importQuestions } from "./lib/rulesguru-import.mjs";
import { SUITE_DIR, assertSuiteIgnored } from "./lib/rulesguru-suite.mjs";

async function main() {
  assertSuiteIgnored();
  const counts = await importQuestions({
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
