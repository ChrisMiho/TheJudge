// Shared helpers for the RAG retrieval prototype: env loading, cosine, and the
// production lexical retrieval invoked on a bare question (no attached cards).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(HERE, "../../../../..");
export const RULE_INDEX_PATH = resolve(REPO, "apps/backend/data/gameRulesRuleIndex.json");

export function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  let text = readFileSync(filePath, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out = {};
  for (const line of text.split("\n")) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
    let k = t.slice(0, eq).trim().replace(/^export\s+/, "");
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (k) out[k] = v;
  }
  return out;
}
export function loadEnv() {
  const merged = { ...process.env };
  for (const [k, v] of Object.entries(parseEnvFile(join(REPO, "apps/backend/.env")))) if (v && !merged[k]) merged[k] = v;
  for (const [k, v] of Object.entries(parseEnvFile(join(REPO, ".secrets/openai-dev.env")))) if (v) merged[k] = v;
  return merged;
}

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function loadRuleIndex() {
  return JSON.parse(readFileSync(RULE_INDEX_PATH, "utf8"));
}

// Lexical retrieval matching production, on a bare question string.
export async function makeLexicalRetriever() {
  const mod = await import(`${REPO}/apps/backend/src/gameRulesRetrieval.ts`);
  const index = mod.loadGameRulesRuleIndex(RULE_INDEX_PATH);
  return (question, k = 5) => {
    const { tokens, queryRuleIds } = mod.buildQueryTokensFromParts({ questionText: question, oracleText: "" });
    const scored = mod.retrieveRulesForQuery(tokens, queryRuleIds, index, new Set(), k);
    return scored.map((s) => s.ruleId);
  };
}
