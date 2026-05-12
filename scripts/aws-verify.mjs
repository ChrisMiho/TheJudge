import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

console.warn("[ARCHIVED] aws-verify is kept for historical Bedrock rollback only. Use npm run openai:verify for active setup.");

/**
 * Parse KEY=VAL lines from a dotenv-style file.
 * @returns {Record<string, string>}
 */
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }
  const out = {};
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) {
      out[key] = val;
    }
  }
  return out;
}

/**
 * Merge local env for AWS CLI: process env, then apps/backend/.env (fill empty only),
 * then .secrets/aws-bedrock-dev.env (values override when set).
 * Matches backend load order in apps/backend/src/index.ts.
 */
function mergeLocalAwsEnv(baseEnv) {
  const root = process.cwd();
  const backendEnvPath = join(root, "apps/backend/.env");
  const secretsEnvPath = join(root, ".secrets/aws-bedrock-dev.env");

  let merged = { ...baseEnv };
  const backendParsed = parseEnvFile(backendEnvPath);
  for (const [key, val] of Object.entries(backendParsed)) {
    if (val === undefined || val === "") continue;
    if (merged[key] === undefined || merged[key] === "") {
      merged[key] = val;
    }
  }
  const secretsParsed = parseEnvFile(secretsEnvPath);
  for (const [key, val] of Object.entries(secretsParsed)) {
    if (val === undefined || val === "") continue;
    merged[key] = val;
  }
  return merged;
}

function runAws(args, env) {
  return spawnSync("aws", args, { env, encoding: "utf8", shell: false });
}

const env = mergeLocalAwsEnv(process.env);

console.log(
  "[aws:verify] Merged env: process + apps/backend/.env (fill empty) + .secrets/aws-bedrock-dev.env (override when set).\n"
);

const sts = runAws(["sts", "get-caller-identity"], env);
if (sts.status !== 0) {
  process.stderr.write(sts.stderr || sts.stdout || "sts get-caller-identity failed\n");
  console.error(`
Next steps (personal account):
  1. In AWS IAM: create a user (or role), attach Bedrock runtime policy (e.g. AmazonBedrockFullAccess for dev), create access keys.
  2. Prefer: aws configure --profile <name>   # keys live in ~/.aws/credentials
  3. In apps/backend/.env set AWS_PROFILE=<name>, AWS_REGION=<region>, BEDROCK_MODEL_ID=<model id>
  4. If you must use env keys: copy secrets-templates/aws-bedrock-dev.env.example to .secrets/aws-bedrock-dev.env and fill it (never commit .secrets/).
  5. In Bedrock console (same region): enable model access for that model ID.
  6. Re-run: npm run aws:verify
`);
  process.exit(sts.status ?? 1);
}

process.stdout.write(sts.stdout);
const region = env.AWS_REGION;
if (!region) {
  console.log(
    "\n[aws:verify] Set AWS_REGION in apps/backend/.env (or your shell) to list foundation models.\n"
  );
  process.exit(0);
}

const models = runAws(["bedrock", "list-foundation-models", "--region", region], env);
if (models.status !== 0) {
  process.stderr.write(models.stderr || models.stdout || "list-foundation-models failed\n");
  process.exit(models.status ?? 1);
}

process.stdout.write(`\n[aws:verify] Foundation models (region ${region}), first 15 modelIds:\n`);
try {
  const parsed = JSON.parse(models.stdout);
  const summaries = parsed.modelSummaries ?? [];
  for (const m of summaries.slice(0, 15)) {
    console.log(`  - ${m.modelId}`);
  }
  if (summaries.length > 15) {
    console.log(`  ... and ${summaries.length - 15} more`);
  }
} catch {
  process.stdout.write(models.stdout);
}

console.log(
  "\n[aws:verify] Pick BEDROCK_MODEL_ID from the list (and enable access in Bedrock console if required), then run: npm run dev:bedrock\n"
);
