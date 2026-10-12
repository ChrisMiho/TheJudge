// Converts the frozen local practice-suite questions into local draft cases
// (REQ-232). Local only.
//
//   npm run eval:practice-suite:convert
//
// Reads the suite folder's raw/ and committed repo data only; no network.
// Refuses to start unless git reports the suite folder ignored. Prints counts only.

import { pathToFileURL } from "node:url";

import { loadSnapshotSources } from "./lib/gold-cases.mjs";
import { buildCardNameIndex, loadCardNameSources } from "./lib/practice-suite-card-names.mjs";
import { convertSuite } from "./lib/practice-suite-convert.mjs";
import { SUITE_DIR, assertSuiteIgnored } from "./lib/practice-suite.mjs";

async function main() {
  assertSuiteIgnored();
  const cardNames = buildCardNameIndex(await loadCardNameSources());
  const sources = await loadSnapshotSources();
  const counts = await convertSuite({ suiteDir: SUITE_DIR, cardNames, sources });
  const excluded = Object.entries(counts.excluded)
    .map(([reason, count]) => `${reason} ${count}`)
    .join(", ");
  console.log(`Converted ${counts.converted} of ${counts.raw} questions; selectable ${counts.selectable}; excluded: ${excluded}.`);
  console.log("The report is in the suite folder (convert-report.txt).");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
