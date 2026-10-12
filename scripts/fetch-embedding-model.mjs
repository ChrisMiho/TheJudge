// REQ-237: fetches the private, Magic-trained search model into the git-ignored local model folder and
// verifies it against the committed manifest. Used when the deploy package is built and when the owner
// trains or rebuilds vectors locally -- never at Lambda cold start, never per request. Plain Node,
// built-ins only (no tsx), so it runs anywhere `package-lambda.sh` does.
//
//   node scripts/fetch-embedding-model.mjs --source s3://<bucket>/models/<model-id>   # fetch from S3 (aws CLI)
//   node scripts/fetch-embedding-model.mjs --source /path/to/<model-id>               # fetch from a local folder
//   node scripts/fetch-embedding-model.mjs --verify                                   # verify only, fetch nothing
//
// Options: --manifest <path> (default apps/backend/data/embeddingModel.manifest.json),
//          --dest <folder>   (default apps/backend/data/models; the model lands in <dest>/<model-id>/),
//          --embeddings <path> (default apps/backend/data/gameRulesRuleEmbeddings.json).
//
// Refuses (exit 1) on a missing file, a size or SHA-256 mismatch, a manifest that is malformed, or rule
// vectors that name a different model than the manifest's. It never uploads anything.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_MANIFEST_PATH = join(repoRoot, "apps/backend/data/embeddingModel.manifest.json");
export const DEFAULT_DEST = join(repoRoot, "apps/backend/data/models");
export const DEFAULT_EMBEDDINGS_PATH = join(repoRoot, "apps/backend/data/gameRulesRuleEmbeddings.json");

export function sha256OfFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/** Reads and shape-checks the manifest; throws on anything unexpected rather than guessing. */
export function readManifest(path = DEFAULT_MANIFEST_PATH) {
  if (!existsSync(path)) throw new Error(`Embedding model manifest not found: ${path}`);
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const ok =
    typeof manifest?.modelId === "string" &&
    manifest.modelId.length > 0 &&
    !/[\\/]/.test(manifest.modelId) &&
    typeof manifest?.baseModel === "string" &&
    Array.isArray(manifest?.files) &&
    manifest.files.length > 0 &&
    manifest.files.every(
      (file) =>
        typeof file?.path === "string" &&
        !file.path.startsWith("/") &&
        !file.path.split("/").includes("..") &&
        /^[0-9a-f]{64}$/.test(file?.sha256 ?? "") &&
        Number.isInteger(file?.bytes)
    );
  if (!ok) throw new Error(`Embedding model manifest has an unexpected shape: ${path}`);
  return manifest;
}

/** Every problem with a model folder against the manifest: a missing file, a wrong size, a changed byte. */
export function verifyModelDirectory(manifest, modelDir) {
  const problems = [];
  if (!existsSync(modelDir)) return [`model folder missing: ${modelDir}`];
  for (const file of manifest.files) {
    const full = join(modelDir, file.path);
    if (!existsSync(full)) {
      problems.push(`missing file: ${file.path}`);
      continue;
    }
    const size = statSync(full).size;
    if (size !== file.bytes) {
      problems.push(`size mismatch: ${file.path} is ${size} bytes, the manifest says ${file.bytes}`);
      continue;
    }
    if (sha256OfFile(full) !== file.sha256) problems.push(`hash mismatch: ${file.path}`);
  }
  return problems;
}

/** The committed rule vectors must name the manifest's model (REQ-237). */
export function verifyRuleVectorsModel(manifest, embeddingsPath = DEFAULT_EMBEDDINGS_PATH) {
  if (!existsSync(embeddingsPath)) return [`rule vectors missing: ${embeddingsPath}`];
  const recorded = JSON.parse(readFileSync(embeddingsPath, "utf8")).model;
  return recorded === manifest.modelId
    ? []
    : [`the committed rule vectors were built by model "${recorded}", the manifest names "${manifest.modelId}"`];
}

function defaultCopy(source, relativePath, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  if (/^s3:\/\//.test(source)) {
    const result = spawnSync("aws", ["s3", "cp", `${source.replace(/\/$/, "")}/${relativePath}`, destination, "--only-show-errors"], {
      encoding: "utf8"
    });
    if (result.status !== 0) throw new Error(`aws s3 cp failed for ${relativePath}: ${(result.stderr || result.error?.message || "").trim()}`);
  } else {
    const from = join(source, relativePath);
    if (!existsSync(from)) throw new Error(`file not found in the source: ${relativePath}`);
    copyFileSync(from, destination);
  }
}

/**
 * Copies every manifest file from `source` (an `s3://` URL or a local folder) into `<destRoot>/<modelId>/`
 * and verifies it. On any failure the half-fetched folder is removed, so a bad copy is never loaded.
 * Returns the problems (empty when the folder is verified). `copy` is injectable for tests.
 */
export function fetchModel({ manifest, source, destRoot = DEFAULT_DEST, copy = defaultCopy }) {
  const modelDir = join(destRoot, manifest.modelId);
  rmSync(modelDir, { recursive: true, force: true });
  const problems = [];
  for (const file of manifest.files) {
    try {
      copy(source, file.path, join(modelDir, file.path));
    } catch (error) {
      problems.push(`could not fetch ${file.path}: ${error.message}`);
    }
  }
  if (problems.length === 0) problems.push(...verifyModelDirectory(manifest, modelDir));
  if (problems.length > 0) rmSync(modelDir, { recursive: true, force: true });
  return problems;
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--verify") options.verify = true;
    else if (["--source", "--dest", "--manifest", "--embeddings"].includes(token)) options[token.slice(2)] = argv[++i];
    else throw new Error(`Unknown argument: ${token}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = readManifest(options.manifest ?? DEFAULT_MANIFEST_PATH);
  const destRoot = resolve(options.dest ?? DEFAULT_DEST);
  const modelDir = join(destRoot, manifest.modelId);
  if (!options.verify && !options.source) {
    throw new Error("Pass --source <s3://bucket/models/<model-id> | folder>, or --verify to check what is already there.");
  }
  const problems = options.verify ? verifyModelDirectory(manifest, modelDir) : fetchModel({ manifest, source: options.source, destRoot });
  problems.push(...verifyRuleVectorsModel(manifest, resolve(options.embeddings ?? DEFAULT_EMBEDDINGS_PATH)));
  if (problems.length > 0) {
    console.error(`Embedding model ${manifest.modelId} is NOT verified:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Embedding model ${manifest.modelId} verified: ${manifest.files.length} files in ${modelDir}`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
