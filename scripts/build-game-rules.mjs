import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const manifestPath = path.resolve("apps/backend/data/gameRulesTopicManifest.json");
const sourcePath = path.resolve("apps/backend/data/cr/source.txt");
const outputPath = path.resolve("apps/backend/data/gameRulesByTopic.json");

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

function readJsonIfPresent(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validateExistingArtifact() {
  if (!fs.existsSync(outputPath)) {
    console.warn(`Comprehensive Rules source not found: ${sourcePath}`);
    console.warn(`No existing game rules artifact found to preserve: ${outputPath}`);
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  if (!Array.isArray(artifact)) {
    throw new Error(`Unexpected game rules artifact shape in ${outputPath}; expected a JSON array.`);
  }

  const bytes = fs.statSync(outputPath).size;
  console.warn(`Comprehensive Rules source not found: ${sourcePath}`);
  console.log(`Preserved existing game rules artifact: ${outputPath} (${formatBytes(bytes)}).`);
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
  const output = JSON.stringify(topics, null, 2);
  fs.writeFileSync(outputPath, `${output}\n`);

  console.log(`Game rules topics: ${topics.length}`);
  console.log(`Output bytes: ${Buffer.byteLength(output)}`);
  console.log(`Wrote: ${outputPath}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
