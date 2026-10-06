// Build step for REQ-220's topic (niche-interaction-rule-tests).
//
// Adds every manifest topic that is not yet in apps/backend/data/gameRulesByTopic.json,
// taking the rules text from the committed rule index
// (apps/backend/data/gameRulesRuleIndex.json — the 2026-06-05 Comprehensive Rules
// text every shipped game-rules artifact was built from). It runs the build script's
// own `transformGameRules` over that text, so the excerpt is exactly what
// `scripts/build-game-rules.mjs` would extract, and writes the file with the build
// script's formatting.
//
// It writes gameRulesByTopic.json and nothing else: the rule index, token stats,
// rule embeddings, and frontend core topics are never touched, and no rules source
// file (apps/backend/data/cr/source.txt, gitignored) is needed or read.
//
// It refuses to write if any existing topic would change, if any rule number is
// missing from the index, or if nothing new would be added.
//
// Run from the repo root, after adding the topic to gameRulesTopicManifest.json and
// after the repo's dependencies are installed (prettier):
//   node PRD/work/niche-interaction-rule-tests/build-topic-from-index.mjs
//
// Measured at define (2026-10-06) on a clean export of origin/main: 23 of 23 existing
// topics come out byte-identical, the new topic's excerpt is 3,670 characters, and the
// file diff is the six added lines of the new topic only.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { format as prettierFormat } from "prettier";

const root = process.cwd();
const manifestPath = path.join(root, "apps/backend/data/gameRulesTopicManifest.json");
const topicsPath = path.join(root, "apps/backend/data/gameRulesByTopic.json");
const indexPath = path.join(root, "apps/backend/data/gameRulesRuleIndex.json");
const buildScriptPath = path.join(root, "scripts/build-game-rules.mjs");

for (const p of [manifestPath, topicsPath, indexPath, buildScriptPath]) {
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p}; run from the repo root.`);
    process.exit(1);
  }
}

const { transformGameRules } = await import(pathToFileURL(buildScriptPath).href);
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const manifest = readJson(manifestPath);
const committed = readJson(topicsPath);
const index = readJson(indexPath);

// The index entries' `text` fields are verbatim rule text split at the same rule
// headers `extractRuleExcerpt` splits at; joined back, they let the build script
// extract any indexed rule from the committed rules version.
const crText = index.map((entry) => entry.text).join("\n");
const { topics: built, warnings } = transformGameRules({ crText, manifest, previousTopics: committed });

const failures = [...warnings];
const builtById = new Map(built.map((topic) => [topic.id, topic]));
for (const topic of committed) {
  const next = builtById.get(topic.id);
  if (!next) failures.push(`Existing topic ${topic.id} is missing from the build.`);
  else if (JSON.stringify(next) !== JSON.stringify(topic)) failures.push(`Existing topic ${topic.id} would change.`);
}
const committedIds = new Set(committed.map((topic) => topic.id));
const added = built.filter((topic) => !committedIds.has(topic.id));
if (added.length === 0) failures.push("No new manifest topic to add (is the manifest entry in place?).");

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  console.error("Nothing written.");
  process.exit(1);
}

const output = await prettierFormat(JSON.stringify(built), { parser: "json", printWidth: 120 });
fs.writeFileSync(topicsPath, output);

const totalChars = built.reduce((sum, topic) => sum + topic.excerpt.length, 0);
for (const topic of added) {
  console.log(`Added topic ${topic.id}: ${topic.ruleNumbers.length} rules, ${topic.excerpt.length} excerpt chars.`);
}
console.log(`Topics: ${committed.length} -> ${built.length}; total excerpt chars: ${totalChars}.`);
console.log(`Wrote: ${topicsPath} (only this file).`);
