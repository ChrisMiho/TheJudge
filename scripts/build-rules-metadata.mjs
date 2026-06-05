import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const inputPath = path.resolve("apps/backend/data/rules/source/MagicCompRules.txt");
const outputPath = path.resolve("apps/backend/data/rules/rulesMetadata.json");
const ruleLinePattern = /^(\d{3}(?:\.\d+[a-z]?)?)\.?\s+(.+)$/;
const partHeadingPattern = /^\d+\.\s+[A-Z][A-Za-z /-]+$/;
const crossRefPattern = /\b\d{3}(?:\.\d+[a-z]?)?\b/gi;

function normalizeInlineWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getSectionId(ruleId) {
  return ruleId.split(".")[0] ?? ruleId;
}

function getParentRuleIds(ruleId) {
  const parts = ruleId.split(".");
  if (parts.length <= 1) {
    return [];
  }

  const parents = [parts[0]];
  for (let index = 2; index < parts.length; index += 1) {
    parents.push(parts.slice(0, index).join("."));
  }

  const lastPart = parts[parts.length - 1];
  const numericParent = lastPart?.match(/^(\d+)[a-z]$/i)?.[1];
  if (numericParent && parts.length > 1) {
    parents.push([...parts.slice(0, -1), numericParent].join("."));
  }

  return [...new Set(parents)];
}

function getCrossRefs(text, currentRuleId) {
  const refs = new Set();
  for (const match of text.matchAll(crossRefPattern)) {
    const ref = match[0];
    if (ref && ref !== currentRuleId) refs.add(ref);
  }
  return [...refs].sort((left, right) => left.localeCompare(right));
}

function buildSearchText(ruleId, sectionTitle, text) {
  return normalizeInlineWhitespace(`${ruleId} ${sectionTitle} ${text}`).toLowerCase();
}

export function parseRulesText(sourceText) {
  const sectionTitles = new Map();
  const rawRules = [];
  let currentRule = null;

  function pushCurrentRule() {
    if (!currentRule) return;
    currentRule.text = normalizeInlineWhitespace(currentRule.text);
    rawRules.push(currentRule);
    currentRule = null;
  }

  for (const rawLine of sourceText.split(/\r?\n/)) {
    const line = normalizeInlineWhitespace(rawLine);
    if (line.length === 0) {
      continue;
    }

    const match = line.match(ruleLinePattern);
    if (!match) {
      if (line === "Glossary" && currentRule) {
        pushCurrentRule();
        break;
      }

      if (partHeadingPattern.test(line)) {
        pushCurrentRule();
        continue;
      }

      if (currentRule) {
        currentRule.text = `${currentRule.text} ${line}`;
      }
      continue;
    }

    pushCurrentRule();

    const ruleId = match[1];
    const text = match[2] ?? "";
    const sectionId = getSectionId(ruleId);
    if (ruleId === sectionId) {
      sectionTitles.set(sectionId, text);
      continue;
    }

    currentRule = {
      ruleId,
      sectionId,
      text
    };
  }

  pushCurrentRule();

  return rawRules.map((rule) => {
    const sectionTitle = sectionTitles.get(rule.sectionId) ?? "";
    return {
      ruleId: rule.ruleId,
      sectionId: rule.sectionId,
      sectionTitle,
      parentRuleIds: getParentRuleIds(rule.ruleId),
      text: rule.text,
      searchText: buildSearchText(rule.ruleId, sectionTitle, rule.text),
      crossRefs: getCrossRefs(rule.text, rule.ruleId)
    };
  });
}

function ensureParentDirectory(filePath) {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Rules source file not found: ${inputPath}`);
  }

  const sourceText = fs.readFileSync(inputPath, "utf8");
  const rules = parseRulesText(sourceText);
  ensureParentDirectory(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(rules));

  console.log(`Parsed rules: ${rules.length}`);
  console.log(`Wrote: ${outputPath}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
