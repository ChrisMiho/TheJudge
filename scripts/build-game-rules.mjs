import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { format as prettierFormat } from "prettier";

const manifestPath = path.resolve("apps/backend/data/gameRulesTopicManifest.json");
const sourcePath = path.resolve("apps/backend/data/cr/source.txt");
const outputPath = path.resolve("apps/backend/data/gameRulesByTopic.json");
const indexPath = path.resolve("apps/backend/data/gameRulesRuleIndex.json");
const tokenStatsPath = path.resolve("apps/backend/data/gameRulesTokenStats.json");
const coreTopicsPath = path.resolve("apps/frontend/public/data/gameRulesCoreTopics.json");

// Mirrors ALWAYS_ON_TOPIC_IDS in apps/backend/src/gameRulesTopicSelection.ts;
// the build-policy test guards this Node-script boundary against drift.
export const CORE_TOPIC_IDS = Object.freeze([
  "stack-and-priority",
  "targets-basics",
  "zones-basics",
  "abilities-trigger-basics",
  "combat-phase-structure",
  "layers-order"
]);

// Keep this stopword set + tokenizer in sync with `tokenize` in
// apps/backend/src/gameRulesRetrieval.ts so token-frequency stats match the scorer.
const STOP_WORDS = new Set([
  "and", "are", "can", "card", "cards", "does", "for", "from",
  "has", "have", "how", "one", "that", "the", "this", "what",
  "when", "will", "with"
]);

function tokenizeForStats(value) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

/**
 * Document-frequency stats for IDF scoring (DEC-046). `df` counts the number of
 * rule entries whose `searchText` contains the token (deduped per rule), `N` is the
 * total rule count. Mirrors the scorer's tokenization.
 * @param {Array<{ searchText: string }>} ruleEntries
 */
function buildTokenStats(ruleEntries) {
  const df = new Map();
  for (const entry of ruleEntries) {
    const seen = new Set(tokenizeForStats(entry.searchText));
    for (const token of seen) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }
  const tokens = {};
  for (const token of [...df.keys()].sort((a, b) => a.localeCompare(b))) {
    tokens[token] = { df: df.get(token) };
  }
  return { N: ruleEntries.length, tokens };
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeNewlines(value) {
  return value.replace(/\r\n?/g, "\n");
}

function validateTopic(topic, index) {
  const id = typeof topic?.id === "string" ? topic.id.trim() : "";
  const title = typeof topic?.title === "string" ? topic.title.trim() : "";
  const ruleNumbers = Array.isArray(topic?.ruleNumbers)
    ? topic.ruleNumbers.map((ruleNumber) => String(ruleNumber).trim()).filter((ruleNumber) => ruleNumber.length > 0)
    : [];

  if (id.length === 0) {
    throw new Error(`Invalid game rules manifest topic at index ${index}: id is required.`);
  }
  if (title.length === 0) {
    throw new Error(`Invalid game rules manifest topic ${id}: title is required.`);
  }
  if (ruleNumbers.length === 0) {
    throw new Error(`Invalid game rules manifest topic ${id}: ruleNumbers must include at least one rule.`);
  }

  return { id, title, ruleNumbers };
}

export function normalizeGameRulesManifest(manifest) {
  if (!Array.isArray(manifest)) {
    throw new Error("Unexpected game rules manifest shape; expected a JSON array.");
  }

  return manifest.map(validateTopic).sort((a, b) => a.id.localeCompare(b.id));
}

export function extractRuleExcerpt(crText, ruleNumber) {
  const normalizedText = normalizeNewlines(crText);
  const rulePattern = escapeRegExp(ruleNumber);
  const headerPattern = new RegExp(`^${rulePattern}(?:\\.|\\s)`, "m");
  const match = headerPattern.exec(normalizedText);
  if (!match) return null;

  const start = match.index;
  const rest = normalizedText.slice(start);
  const nextHeaderPattern = /\n(?=\d{3}(?:\.\d+)*(?:[a-z])?(?:\.|\s))/g;
  const nextHeader = nextHeaderPattern.exec(rest.slice(1));
  const end = nextHeader ? 1 + nextHeader.index : rest.length;
  return rest.slice(0, end).trim();
}

const HEADING_ONLY_MAX_LENGTH = 60;

/**
 * REQ-179: an entry whose text is nothing but its own numbered heading — e.g.
 * "100. General" or "702.19. Trample" — carries no rule content; the actual
 * definition lives in a separate child entry (100.1, 702.19a, ...). Every
 * Comprehensive Rules statement ends with sentence-terminating punctuation
 * (a period, or a closing quote/bracket after one); a bare heading title never
 * does, so that is the general, corpus-independent signal used here rather
 * than a hard-coded title list.
 */
export function isHeadingOnlyEntry(ruleId, text) {
  const prefixPattern = new RegExp(`^${escapeRegExp(ruleId)}(?:\\.|\\s)\\s*`);
  const remainder = text.replace(prefixPattern, "").trim();
  if (remainder.length === 0) return true;
  if (remainder.length >= HEADING_ONLY_MAX_LENGTH) return false;
  // A colon introduces a following list (e.g. "704.5. The state-based actions
  // are as follows:") and is real rule content, not a bare title.
  return !/[.!?:;]['")\]]?$/.test(remainder);
}

/**
 * REQ-179: drop heading-only entries, then dedupe by rule id (keeping the
 * first occurrence) as a backstop — belt and braces once the table of
 * contents is no longer scanned at all by `parseRuleIndex`.
 */
export function cleanRuleIndexEntries(entries) {
  const withoutHeadings = entries.filter((entry) => !isHeadingOnlyEntry(entry.ruleId, entry.text));
  const seen = new Set();
  const deduped = [];
  for (const entry of withoutHeadings) {
    if (seen.has(entry.ruleId)) continue;
    seen.add(entry.ruleId);
    deduped.push(entry);
  }
  return deduped;
}

function computeParentRuleIds(ruleId) {
  const parents = [];
  const withoutLetter = ruleId.replace(/[a-z]$/, "");
  if (withoutLetter !== ruleId) {
    parents.push(withoutLetter);
  }
  const parts = withoutLetter.split(".");
  while (parts.length > 1) {
    parts.pop();
    parents.push(parts.join("."));
  }
  return parents;
}

export function parseRuleIndex(crText) {
  const normalizedText = normalizeNewlines(crText);

  // REQ-179: the source document opens with a table of contents that lists
  // every top-level section (and, as its last two items, "Glossary" then
  // "Credits") before the real numbered rule text begins; unguarded, every
  // TOC line becomes a duplicate rule-index entry shadowing the real section
  // heading. The FIRST bare "Glossary" line is that TOC's own last-but-one
  // entry, so everything up to and including it is the TOC — skip it. The
  // real Glossary section (definitions, not numbered rules) sits near the end
  // of the document; the LAST bare "Glossary" line marks where it starts, so
  // everything from there on is cut too, same as before this change.
  const glossaryPattern = /^Glossary\s*$/gm;
  const glossaryIndexes = [];
  let gm;
  while ((gm = glossaryPattern.exec(normalizedText)) !== null) {
    glossaryIndexes.push(gm.index);
  }
  const contentStart = glossaryIndexes.length > 0 ? glossaryIndexes[0] : 0;
  const lastGlossaryIndex = glossaryIndexes.length > 0 ? glossaryIndexes[glossaryIndexes.length - 1] : -1;
  const contentEnd = lastGlossaryIndex > contentStart ? lastGlossaryIndex : normalizedText.length;
  const text = normalizedText.slice(contentStart, contentEnd);

  // Match both `100.1. ` (period+space) and `100.1a ` (space only, lettered sub-rules).
  const ruleHeaderPattern = /^(\d{3}(?:\.\d+)*(?:[a-z])?)(?:\. | (?=\S))/gm;
  const matches = [];
  let m;
  while ((m = ruleHeaderPattern.exec(text)) !== null) {
    matches.push({ ruleId: m[1], index: m.index });
  }

  const entries = [];
  let currentSectionTitle = "";

  for (let i = 0; i < matches.length; i++) {
    const { ruleId, index } = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const ruleText = text.slice(index, end).trim();

    if (!ruleId.includes(".")) {
      const headingMatch = /^\d{3}\. (.+)/.exec(ruleText);
      if (headingMatch) {
        currentSectionTitle = headingMatch[1].trim();
      }
    }

    const parentRuleIds = computeParentRuleIds(ruleId);
    const searchText = [ruleId, currentSectionTitle, ruleText].join(" ").toLowerCase();

    entries.push({ ruleId, sectionTitle: currentSectionTitle, text: ruleText, searchText, parentRuleIds });
  }

  return cleanRuleIndexEntries(entries);
}

function mapPreviousTopics(previousTopics) {
  const topicsById = new Map();
  if (!Array.isArray(previousTopics)) return topicsById;

  for (const topic of previousTopics) {
    const id = typeof topic?.id === "string" ? topic.id.trim() : "";
    const excerpt = typeof topic?.excerpt === "string" ? topic.excerpt.trim() : "";
    if (id.length > 0 && excerpt.length > 0) {
      topicsById.set(id, topic);
    }
  }

  return topicsById;
}

/** @param {{ crText: string, manifest: Array<{id: string, title: string, ruleNumbers: string[]}>, previousTopics?: Array<{id: string, title: string, ruleNumbers: string[], excerpt: string}> }} options */
export function transformGameRules({ crText, manifest, previousTopics = [] }) {
  const topics = [];
  const warnings = [];
  const previousTopicsById = mapPreviousTopics(previousTopics);

  for (const topic of normalizeGameRulesManifest(manifest)) {
    const excerpts = [];
    const missingRuleNumbers = [];

    for (const ruleNumber of topic.ruleNumbers) {
      const excerpt = extractRuleExcerpt(crText, ruleNumber);
      if (excerpt) {
        excerpts.push(excerpt);
      } else {
        missingRuleNumbers.push(ruleNumber);
      }
    }

    if (missingRuleNumbers.length > 0) {
      const previousTopic = previousTopicsById.get(topic.id);
      if (previousTopic) {
        topics.push({
          id: topic.id,
          title: topic.title,
          ruleNumbers: topic.ruleNumbers,
          excerpt: previousTopic.excerpt
        });
        for (const ruleNumber of missingRuleNumbers) {
          warnings.push(`Missing CR excerpt for ${topic.id} rule ${ruleNumber}; preserved prior topic excerpt.`);
        }
      } else {
        for (const ruleNumber of missingRuleNumbers) {
          warnings.push(`Missing CR excerpt for ${topic.id} rule ${ruleNumber}; skipped topic.`);
        }
      }
      continue;
    }

    topics.push({
      id: topic.id,
      title: topic.title,
      ruleNumbers: topic.ruleNumbers,
      excerpt: excerpts.join("\n")
    });
  }

  return { topics, warnings };
}

/**
 * Select the signed-off frontend browse subset from the generated topic artifact.
 * @param {Array<{id: string, title: string, ruleNumbers: string[], excerpt: string}>} topics
 * @param {readonly string[]} topicIds
 */
export function buildCoreTopics(topics, topicIds = CORE_TOPIC_IDS) {
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
  const coreTopics = [];
  const warnings = [];

  for (const id of topicIds) {
    const topic = topicsById.get(id);
    if (!topic) {
      warnings.push(`Core rules topic ${id} not found in generated topic artifact; skipped.`);
      continue;
    }

    coreTopics.push({
      id: topic.id,
      title: topic.title,
      ruleNumbers: topic.ruleNumbers,
      excerpt: topic.excerpt
    });
  }

  return { topics: coreTopics, warnings };
}

function readJsonIfPresent(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validateExistingArtifact() {
  console.warn(`Comprehensive Rules source not found: ${sourcePath}`);

  if (!fs.existsSync(outputPath)) {
    console.warn(`No existing game rules artifact found to preserve: ${outputPath}`);
  } else {
    const artifact = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (!Array.isArray(artifact)) {
      throw new Error(`Unexpected game rules artifact shape in ${outputPath}; expected a JSON array.`);
    }
    const bytes = fs.statSync(outputPath).size;
    console.log(`Preserved existing game rules artifact: ${outputPath} (${formatBytes(bytes)}).`);
  }

  if (!fs.existsSync(indexPath)) {
    console.warn(`No existing rule index artifact found to preserve: ${indexPath}`);
  } else {
    const indexArtifact = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (!Array.isArray(indexArtifact)) {
      throw new Error(`Unexpected rule index artifact shape in ${indexPath}; expected a JSON array.`);
    }
    const bytes = fs.statSync(indexPath).size;
    console.log(`Preserved existing rule index artifact: ${indexPath} (${formatBytes(bytes)}).`);
  }
}

async function main() {
  if (!fs.existsSync(manifestPath)) {
    console.warn(`Game rules topic manifest not found: ${manifestPath}`);
    return;
  }

  if (!fs.existsSync(sourcePath)) {
    validateExistingArtifact();
    return;
  }

  const manifest = readJsonIfPresent(manifestPath, []);
  const previousTopics = readJsonIfPresent(outputPath, []);
  const crText = fs.readFileSync(sourcePath, "utf8");
  const { topics, warnings } = transformGameRules({ crText, manifest, previousTopics });

  for (const warning of warnings) {
    console.warn(warning);
  }

  ensureParentDirectory(outputPath);
  const output = await prettierFormat(JSON.stringify(topics), { parser: "json", printWidth: 120 });
  fs.writeFileSync(outputPath, output);

  console.log(`Game rules topics: ${topics.length}`);
  console.log(`Output bytes: ${Buffer.byteLength(output)}`);
  console.log(`Wrote: ${outputPath}`);

  const ruleEntries = parseRuleIndex(crText);
  ensureParentDirectory(indexPath);
  const indexOutput = await prettierFormat(JSON.stringify(ruleEntries), { parser: "json", printWidth: 120 });
  fs.writeFileSync(indexPath, indexOutput);

  console.log(`Rule index entries: ${ruleEntries.length}`);
  console.log(`Rule index bytes: ${Buffer.byteLength(indexOutput)}`);
  console.log(`Wrote: ${indexPath}`);

  const tokenStats = buildTokenStats(ruleEntries);
  ensureParentDirectory(tokenStatsPath);
  const tokenStatsOutput = await prettierFormat(JSON.stringify(tokenStats), { parser: "json", printWidth: 120 });
  fs.writeFileSync(tokenStatsPath, tokenStatsOutput);

  console.log(`Token stats tokens: ${Object.keys(tokenStats.tokens).length} (N=${tokenStats.N})`);
  console.log(`Token stats bytes: ${Buffer.byteLength(tokenStatsOutput)}`);
  console.log(`Wrote: ${tokenStatsPath}`);

  const { topics: coreTopics, warnings: coreTopicWarnings } = buildCoreTopics(topics);
  for (const warning of coreTopicWarnings) {
    console.warn(warning);
  }
  ensureParentDirectory(coreTopicsPath);
  const coreTopicsOutput = await prettierFormat(JSON.stringify(coreTopics), { parser: "json", printWidth: 120 });
  fs.writeFileSync(coreTopicsPath, coreTopicsOutput);

  console.log(`Core rules topics: ${coreTopics.length}`);
  console.log(`Core rules topics bytes: ${Buffer.byteLength(coreTopicsOutput)}`);
  console.log(`Wrote: ${coreTopicsPath}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
