import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";

const LOG_PREFIX = "[openai:verify-credentials]";
const DEFAULT_OPENAI_TIMEOUT_MS = 15000;
const DEFAULT_OPENAI_MAX_RETRIES = 2;

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  let text = readFileSync(filePath, "utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    if (key.startsWith("export ")) {
      key = key.slice("export ".length).trim();
    }
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

function mergeLocalOpenAiEnv(baseEnv) {
  const root = process.cwd();
  const backendEnvPath = join(root, "apps/backend/.env");
  const secretsEnvPath = join(root, ".secrets/openai-dev.env");
  const merged = { ...baseEnv };
  const backendParsed = parseEnvFile(backendEnvPath);
  for (const [key, val] of Object.entries(backendParsed)) {
    if (!val) continue;
    if (merged[key] === undefined || merged[key] === "") merged[key] = val;
  }
  const secretsParsed = parseEnvFile(secretsEnvPath);
  for (const [key, val] of Object.entries(secretsParsed)) {
    if (!val) continue;
    merged[key] = val;
  }
  return { merged, root, backendEnvPath, secretsEnvPath };
}

/** Matches apps/backend/src/config.ts parseOptionalPositiveInteger */
function parseOptionalPositiveInteger(rawValue, envName) {
  if (rawValue == null || String(rawValue).trim() === "") {
    return undefined;
  }
  const parsed = Number(String(rawValue).trim());
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${envName} value "${rawValue}". Expected a positive integer.`);
  }
  return parsed;
}

const { merged: env, root, backendEnvPath, secretsEnvPath } = mergeLocalOpenAiEnv(process.env);
const model = env.OPENAI_MODEL != null ? String(env.OPENAI_MODEL).trim() : "";
const apiKey = env.OPENAI_API_KEY != null ? String(env.OPENAI_API_KEY).trim() : "";

if (!model || !apiKey) {
  console.error(`${LOG_PREFIX} Missing OPENAI_MODEL or OPENAI_API_KEY after merge.`);
  console.error(`Run from repo root (cwd is ${root}).`);
  console.error(`  ${backendEnvPath}: ${existsSync(backendEnvPath) ? "found" : "missing"}`);
  console.error(`  ${secretsEnvPath}: ${existsSync(secretsEnvPath) ? "found" : "missing"}`);
  if (existsSync(backendEnvPath) && !model) {
    const keys = Object.keys(parseEnvFile(backendEnvPath));
    if (!keys.includes("OPENAI_MODEL")) {
      console.error("  Hint: apps/backend/.env has no OPENAI_MODEL= line (check spelling).");
    }
  }
  if (existsSync(secretsEnvPath) && !apiKey) {
    const keys = Object.keys(parseEnvFile(secretsEnvPath));
    if (!keys.includes("OPENAI_API_KEY")) {
      console.error("  Hint: .secrets/openai-dev.env has no OPENAI_API_KEY= line (check spelling).");
    }
  }
  if (!model) {
    console.error("  OPENAI_MODEL: unset or blank — set in apps/backend/.env (or export OPENAI_MODEL).");
  }
  if (!apiKey) {
    console.error(
      "  OPENAI_API_KEY: unset or blank — set in .secrets/openai-dev.env (see secrets-templates/openai-dev.env.example)."
    );
  }
  process.exit(1);
}

let timeoutMs;
let maxRetries;
try {
  timeoutMs = parseOptionalPositiveInteger(env.OPENAI_TIMEOUT_MS, "OPENAI_TIMEOUT_MS") ?? DEFAULT_OPENAI_TIMEOUT_MS;
  maxRetries = parseOptionalPositiveInteger(env.OPENAI_MAX_RETRIES, "OPENAI_MAX_RETRIES") ?? DEFAULT_OPENAI_MAX_RETRIES;
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`${LOG_PREFIX} ${message}`);
  process.exit(1);
}

const client = new OpenAI({
  apiKey,
  timeout: timeoutMs,
  maxRetries
});

try {
  const response = await client.responses.create({
    model,
    input: "This is a test"
  });
  const output = response.output_text?.trim();
  if (!output) {
    console.error(`${LOG_PREFIX} API returned no assistant text (output_text empty).`);
    process.exit(1);
  }
  console.log(`${LOG_PREFIX} request succeeded (credentials and connectivity).`);
  console.log(`${LOG_PREFIX} model: ${model}`);
  console.log(`${LOG_PREFIX} response: ${output}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${LOG_PREFIX} verification failed.`);
  console.error(message);
  process.exit(1);
}
