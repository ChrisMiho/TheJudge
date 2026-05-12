import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
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
  return merged;
}

const env = mergeLocalOpenAiEnv(process.env);
const model = env.OPENAI_MODEL;
const apiKey = env.OPENAI_API_KEY;

if (!model || !apiKey) {
  console.error("[openai:verify] Missing OPENAI_MODEL or OPENAI_API_KEY.");
  console.error("Set OPENAI_MODEL in apps/backend/.env and OPENAI_API_KEY in .secrets/openai-dev.env.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey,
  timeout: Number(env.OPENAI_TIMEOUT_MS || 15000),
  maxRetries: Number(env.OPENAI_MAX_RETRIES || 2)
});

try {
  const response = await client.responses.create({
    model,
    input: "Respond with exactly: ok"
  });
  const output = response.output_text?.trim();
  console.log("[openai:verify] request succeeded.");
  console.log(`[openai:verify] model: ${model}`);
  console.log(`[openai:verify] output: ${output || "(no output_text returned)"}`);
  console.log("[openai:verify] OpenAI integration env appears valid.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[openai:verify] verification failed.");
  console.error(message);
  process.exit(1);
}
