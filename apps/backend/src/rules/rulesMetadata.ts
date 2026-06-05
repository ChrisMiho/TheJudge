import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuleMetadataItem } from "./types.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const metadataPath = path.resolve(moduleDir, "../../data/rules/rulesMetadata.json");

let cachedRules: RuleMetadataItem[] | null = null;

function isRuleMetadataItem(value: unknown): value is RuleMetadataItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.ruleId === "string" &&
    typeof candidate.sectionId === "string" &&
    typeof candidate.sectionTitle === "string" &&
    Array.isArray(candidate.parentRuleIds) &&
    typeof candidate.text === "string" &&
    typeof candidate.searchText === "string" &&
    Array.isArray(candidate.crossRefs)
  );
}

export function loadRulesMetadata(): RuleMetadataItem[] {
  if (cachedRules) {
    return cachedRules;
  }

  if (!fs.existsSync(metadataPath)) {
    cachedRules = [];
    return cachedRules;
  }

  const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) {
    cachedRules = [];
    return cachedRules;
  }

  cachedRules = parsed.filter(isRuleMetadataItem);
  return cachedRules;
}
