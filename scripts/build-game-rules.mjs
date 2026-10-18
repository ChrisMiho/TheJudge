import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { format as prettierFormat } from "prettier";
import { ensureParentDirectory, formatBytes, escapeRegExp } from "./lib/fs-helpers.mjs";

const manifestPath = path.resolve("apps/backend/data/gameRulesTopicManifest.json");
const sourcePath = path.resolve("apps/backend/data/cr/source.txt");
const outputPath = path.resolve("apps/backend/data/gameRulesByTopic.json");
const indexPath = path.resolve("apps/backend/data/gameRulesRuleIndex.json");
const glossaryPath = path.resolve("apps/backend/data/gameRulesGlossary.json");
const bookMetaPath = path.resolve("apps/backend/data/gameRulesBookMeta.json");
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

// REQ-233: one tokenizer and one Porter stemmer, shared with the backend's scoring and the model
// training export. Node loads the TypeScript module directly (it has no imports and erasable types
// only), so the rule side and the query side can never drift apart.
const { tokenizeSearchText } = await import("../apps/backend/src/gameRulesStemmer.ts");

/**
 * REQ-233: a rule's `searchText` is its id, section title and text read through the shared tokenizer
 * (sentence dots dropped, "can't" whole, U+2028 and no-break spaces as spaces, Porter stems), joined
 * by single spaces. The backend splits it on spaces and never stems it again.
 */
export function buildSearchText(ruleId, sectionTitle, ruleText) {
  return tokenizeSearchText([ruleId, sectionTitle, ruleText].join(" ")).join(" ");
}

/**
 * Document-frequency stats for IDF scoring (DEC-046). `df` counts the number of
 * rule entries whose `searchText` contains the token (deduped per rule), `N` is the
 * total rule count. `searchText` is already the scorer's tokens (REQ-233), so it is read by splitting on spaces.
 * @param {Array<{ searchText: string }>} ruleEntries
 */
function buildTokenStats(ruleEntries) {
  const df = new Map();
  for (const entry of ruleEntries) {
    const seen = new Set(entry.searchText.split(" ").filter((token) => token.length > 0));
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
  const nextHeaderPattern = /\n(?=\d{3}(?:\.\d+)*(?:[a-z]{1,2})?(?:\.|\s))/g;
  const nextHeader = nextHeaderPattern.exec(rest.slice(1));
  const end = nextHeader ? 1 + nextHeader.index : rest.length;
  const excerpt = rest.slice(0, end).trim();
  // The last rule of a part is followed by the next part's title line; it is not rule text.
  const partTitleAt = excerpt.search(PART_TITLE_LINE);
  return (partTitleAt > 0 ? excerpt.slice(0, partTitleAt) : excerpt).trim();
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
export function isHeadingOnlyEntry(ruleId, text, hasOwnLetteredChild = false) {
  const prefixPattern = new RegExp(`^${escapeRegExp(ruleId)}(?:\\.|\\s)\\s*`);
  const remainder = text.replace(prefixPattern, "").trim();
  if (remainder.length === 0) return true;
  if (remainder.length >= HEADING_ONLY_MAX_LENGTH) return false;
  // A keyword's title can end in "!" ("For Mirrodin!", "Start Your Engines!");
  // it is a bare title when its own lettered rule (702.163a) follows.
  if (hasOwnLetteredChild && !/[.:;]["'\u201d\u2019)\]]?$/.test(remainder)) return true;
  // A colon introduces a following list (e.g. "704.5. The state-based actions
  // are as follows:") and is real rule content, not a bare title. A rule may
  // end in a closing curly quote after its period (700.15, 303.7).
  return !/[.!?:;]["'\u201d\u2019)\]]?$/.test(remainder);
}

/**
 * REQ-179: drop heading-only entries, then dedupe by rule id (keeping the
 * first occurrence) as a backstop — belt and braces once the table of
 * contents is no longer scanned at all by `parseRuleIndex`.
 */
export function cleanRuleIndexEntries(entries) {
  const withoutHeadings = entries.filter(
    (entry, i) => !isHeadingOnlyEntry(entry.ruleId, entry.text, entries[i + 1]?.ruleId === `${entry.ruleId}a`)
  );
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
  const withoutLetter = ruleId.replace(/[a-z]+$/, "");
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

const PART_TITLE_LINE = /^\d\. \S[^\n]*$/m;

/** Source text with the table of contents cut away: where the numbered rules and the glossary begin. */
function locateSections(normalizedText) {
  const glossaryPattern = /^Glossary\s*$/gm;
  const glossaryIndexes = [];
  let gm;
  while ((gm = glossaryPattern.exec(normalizedText)) !== null) glossaryIndexes.push(gm.index);
  return glossaryIndexes;
}

/** The rule book's edition date (ISO), the hash of its text, and each part's title. */
export function parseRuleBookMeta(crText) {
  const normalizedText = normalizeNewlines(crText);
  const editionMatch = /effective as of ([A-Z][a-z]+) (\d{1,2}), (\d{4})/.exec(normalizedText);
  if (!editionMatch) throw new Error("Rule book edition date not found (\"effective as of ...\").");
  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(editionMatch[1]) + 1;
  if (month === 0) throw new Error(`Unknown month in rule book edition: ${editionMatch[1]}`);
  const edition = `${editionMatch[3]}-${String(month).padStart(2, "0")}-${editionMatch[2].padStart(2, "0")}`;
  const glossaryIndexes = locateSections(normalizedText);
  const contentStart = glossaryIndexes.length > 0 ? glossaryIndexes[0] : 0;
  const lastGlossaryIndex = glossaryIndexes.length > 0 ? glossaryIndexes[glossaryIndexes.length - 1] : -1;
  const body = normalizedText.slice(contentStart, lastGlossaryIndex > contentStart ? lastGlossaryIndex : undefined);
  const partTitles = {};
  for (const m of body.matchAll(/^(\d)\. (\S[^\n]*)$/gm)) partTitles[m[1]] = m[2].trim();
  return { edition, sourceSha256: crypto.createHash("sha256").update(normalizedText).digest("hex"), partTitles };
}

/**
 * The rule book's glossary: one entry per term. `obsolete` marks the 35 entries
 * the book flags "(Obsolete)"; `obsoleteSense` marks those where only one sense
 * of a live term is obsolete (for example "Play"), so query translation can
 * leave them alone. The glossary is never delivered as an excerpt.
 */
export function parseGlossary(crText) {
  const normalizedText = normalizeNewlines(crText);
  const lines = normalizedText.split("\n");
  let glossaryLine = -1;
  let creditsLine = -1;
  lines.forEach((line, i) => {
    if (/^Glossary\s*$/.test(line)) glossaryLine = i;
    if (/^Credits\s*$/.test(line)) creditsLine = i;
  });
  if (glossaryLine < 0 || creditsLine < glossaryLine) return [];
  const blocks = lines
    .slice(glossaryLine + 1, creditsLine)
    .join("\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
  return blocks.map((block) => {
    const [head, ...rest] = block.split("\n");
    const definition = rest.map((line) => line.trim()).filter(Boolean).join(" ");
    const headMarked = /\(Obsolete\)\s*$/.test(head);
    const leadMarked = /^\(Obsolete\)/.test(definition);
    const obsolete = headMarked || /\(Obsolete\)/.test(block);
    const term = head.replace(/\s*\(Obsolete\)\s*$/, "").trim();
    return { term, definition, obsolete, ...(obsolete && !headMarked && !leadMarked ? { obsoleteSense: true } : {}) };
  });
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
  // A rule id carries up to two trailing letters (704.5aa follows 704.5z).
  const ruleHeaderPattern = /^(\d{3}(?:\.\d+)*(?:[a-z]{1,2})?)(?:\. | (?=\S))/gm;
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
    let ruleText = text.slice(index, end).trim();
    // The next part's title line ("2. Parts of a Card") follows the last rule of
    // a part; it is not rule text.
    const partTitleAt = ruleText.search(PART_TITLE_LINE);
    if (partTitleAt > 0) ruleText = ruleText.slice(0, partTitleAt).trim();

    if (!ruleId.includes(".")) {
      const headingMatch = /^\d{3}\. (.+)/.exec(ruleText);
      if (headingMatch) {
        currentSectionTitle = headingMatch[1].trim();
      }
    }

    const parentRuleIds = computeParentRuleIds(ruleId);
    const searchText = buildSearchText(ruleId, currentSectionTitle, ruleText);

    entries.push({ ruleId, sectionTitle: currentSectionTitle, text: ruleText, searchText, parentRuleIds });
  }

  return annotateKeywordRuleTitles(cleanRuleIndexEntries(entries), keywordRuleTitlesOf(text));
}

/**
 * REQ-179 / REQ-235: the keyword rules' titles, read from the title-only lines of the rule book
 * (`702.2. Deathtouch`, `701.9. Discard`): rule number -> title. 701.1 and 702.1 are the sections'
 * general rules, not keywords. The first line per rule number wins.
 */
export function keywordRuleTitlesOf(text) {
  const titles = new Map();
  for (const match of text.matchAll(/^(70[12]\.(\d+))\. (.+?)\s*$/gm)) {
    if (match[2] === "1") continue;
    if (!titles.has(match[1])) titles.set(match[1], match[3].trim());
  }
  return titles;
}

/**
 * Each lettered piece of a keyword rule carries `keywordTitle`, the rule's title, so the backend can
 * match a card's Scryfall keyword to the rule's whole set. Data only: the title is never an excerpt.
 */
export function annotateKeywordRuleTitles(entries, titles) {
  return entries.map((entry) => {
    const parent = /^(70[12]\.\d+)[a-z]+$/.exec(entry.ruleId)?.[1];
    const title = parent ? titles.get(parent) : undefined;
    return title ? { ...entry, keywordTitle: title } : entry;
  });
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

  const glossary = parseGlossary(crText);
  ensureParentDirectory(glossaryPath);
  const glossaryOutput = await prettierFormat(JSON.stringify(glossary), { parser: "json", printWidth: 120 });
  fs.writeFileSync(glossaryPath, glossaryOutput);
  console.log(`Glossary entries: ${glossary.length} (${glossary.filter((entry) => entry.obsolete).length} obsolete)`);
  console.log(`Wrote: ${glossaryPath}`);

  const bookMeta = parseRuleBookMeta(crText);
  const bookMetaOutput = await prettierFormat(JSON.stringify(bookMeta), { parser: "json", printWidth: 120 });
  fs.writeFileSync(bookMetaPath, bookMetaOutput);
  console.log(`Rule book edition: ${bookMeta.edition}; parts: ${Object.keys(bookMeta.partTitles).length}`);
  console.log(`Wrote: ${bookMetaPath}`);

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
