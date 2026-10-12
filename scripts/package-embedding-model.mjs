// REQ-237: turns a trained model folder (the output of `scripts/train-rule-search-model.py --fold all
// --export`) into the committed manifest, and stages the exact folder the owner uploads. Owner-run,
// local, offline: it reads and writes files and prints commands. It runs nothing against AWS.
//
//   node scripts/package-embedding-model.mjs --model-dir output/rule-search-model/onnx/F-foldall \
//     [--manifest apps/backend/data/embeddingModel.manifest.json] [--stage output/rule-search-model/upload] \
//     [--base-model sentence-transformers/all-MiniLM-L6-v2]
//
// The model id is content-addressed: `rule-search-` plus the first 12 hex characters of the SHA-256 of
// the file list (path and hash per file). The same bytes always get the same id; any change gets a new
// one, so a vector file's recorded model id identifies exact weights.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, existsSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { uploadCommands } from "./lib/embedding-model-upload.mjs";
import { writeFormattedJson } from "./lib/write-formatted-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The files the runtime loads. The fp32 `onnx/model.onnx` and checkpoints are never shipped. */
export const SHIPPED_FILES = ["config.json", "tokenizer.json", "tokenizer_config.json", "onnx/model_quantized.onnx"];
export const DEFAULT_BASE_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

const sha256OfFile = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** The manifest for a model folder: id, base model, and a SHA-256 and byte size per shipped file. */
export function buildManifest({ modelDir, baseModel = DEFAULT_BASE_MODEL }) {
  const files = SHIPPED_FILES.map((path) => {
    const full = join(modelDir, path);
    if (!existsSync(full)) throw new Error(`Model folder is missing ${path}: ${modelDir}`);
    return { path, sha256: sha256OfFile(full), bytes: statSync(full).size };
  });
  const fingerprint = createHash("sha256")
    .update(files.map((file) => `${file.path}\0${file.sha256}\n`).join(""))
    .digest("hex");
  return { modelId: `rule-search-${fingerprint.slice(0, 12)}`, baseModel, files };
}

/** Copies exactly the shipped files into `<stageRoot>/<modelId>/` (what gets uploaded). */
export function stageUpload({ modelDir, manifest, stageRoot }) {
  const stageDir = join(stageRoot, manifest.modelId);
  rmSync(stageDir, { recursive: true, force: true });
  for (const file of manifest.files) {
    mkdirSync(dirname(join(stageDir, file.path)), { recursive: true });
    copyFileSync(join(modelDir, file.path), join(stageDir, file.path));
  }
  return stageDir;
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (["--model-dir", "--manifest", "--stage", "--base-model"].includes(token)) options[token.slice(2)] = argv[++i];
    else throw new Error(`Unknown argument: ${token}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options["model-dir"]) throw new Error("Pass --model-dir <trained model folder>.");
  const modelDir = resolve(options["model-dir"]);
  const manifestPath = resolve(options.manifest ?? join(repoRoot, "apps/backend/data/embeddingModel.manifest.json"));
  const stageRoot = resolve(options.stage ?? join(repoRoot, "output/rule-search-model/upload"));
  const manifest = buildManifest({ modelDir, baseModel: options["base-model"] });
  await writeFormattedJson(manifestPath, manifest);
  const stageDir = stageUpload({ modelDir, manifest, stageRoot });
  const totalMb = manifest.files.reduce((sum, file) => sum + file.bytes, 0) / 1e6;
  console.log(`Model id: ${manifest.modelId} (${manifest.files.length} files, ${totalMb.toFixed(1)} MB)`);
  console.log(`Wrote ${manifestPath}`);
  console.log(`Staged the upload folder: ${stageDir}`);
  console.log("");
  console.log("Upload it once, before merging the code PR (this script does not run any of it):");
  for (const line of uploadCommands({ modelId: manifest.modelId, stageDir })) console.log(`  ${line}`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
