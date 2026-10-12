// REQ-237: which embedding model this checkout runs, and the check that every committed vector file
// was built by it.
//
// The Magic-trained search model (REQ-236) never enters the public repository. A small committed
// manifest, `apps/backend/data/embeddingModel.manifest.json`, names it (`modelId`, content-addressed:
// the id carries a prefix of the hash of the model's files) and records a SHA-256 and byte size for
// every file. Until a trained model is committed there is no manifest and the stock
// `Xenova/all-MiniLM-L6-v2` is the running model, exactly as before.
//
// Every committed vector file records the model id that built it. Ranking against vectors built by
// a different model would compare apples to oranges silently, so the runtime catches the mismatch at
// load (one error-level diagnostic naming both ids, then the lexical fallback) and every offline
// instrument (the eval harnesses, the benchmark, the rules gate) refuses outright.

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The general-purpose model the Magic-trained one is fine-tuned from; the running model until a manifest is committed. */
export const STOCK_MODEL_ID = "Xenova/all-MiniLM-L6-v2";

export type EmbeddingModelFile = { path: string; sha256: string; bytes: number };

export type EmbeddingModelManifest = {
  /** Content-addressed: `rule-search-` plus a prefix of the hash over the files below. Also the S3 folder name `models/<modelId>/`. */
  modelId: string;
  baseModel: string;
  files: EmbeddingModelFile[];
};

const currentDir = dirname(fileURLToPath(import.meta.url));

export const EMBEDDING_MODEL_MANIFEST_PATH = resolve(currentDir, "../data/embeddingModel.manifest.json");

function isManifest(value: unknown): value is EmbeddingModelManifest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<EmbeddingModelManifest>;
  return (
    typeof candidate.modelId === "string" &&
    candidate.modelId.length > 0 &&
    typeof candidate.baseModel === "string" &&
    Array.isArray(candidate.files) &&
    candidate.files.every(
      (file) => typeof file?.path === "string" && typeof file?.sha256 === "string" && typeof file?.bytes === "number"
    )
  );
}

/** The committed manifest, or null when none is committed (the stock model runs). A malformed manifest throws: it must never be guessed around. */
export function loadEmbeddingModelManifest(path = EMBEDDING_MODEL_MANIFEST_PATH): EmbeddingModelManifest | null {
  if (!existsSync(path)) return null;
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isManifest(parsed)) throw new Error(`Embedding model manifest has an unexpected shape: ${path}`);
  return parsed;
}

/** The id of the model this checkout runs: the manifest's, else the stock model's. */
export function runtimeEmbeddingModelId(manifest: EmbeddingModelManifest | null = loadEmbeddingModelManifest()): string {
  return manifest?.modelId ?? STOCK_MODEL_ID;
}

export class EmbeddingModelMismatchError extends Error {
  constructor(label: string, recorded: string | null | undefined, running: string) {
    super(
      `${label} was built by embedding model "${recorded ?? "(no model recorded)"}" but this checkout runs "${running}". ` +
        "Ranking with vectors from a different model is refused. Rebuild the file with the running model, or fetch the model it names (REQ-237)."
    );
    this.name = "EmbeddingModelMismatchError";
  }
}

/** Refuses (throws) unless a vector file's recorded model id is the running model's. Used by the offline instruments. */
export function assertVectorsMatchRuntimeModel(
  label: string,
  recordedModelId: string | null | undefined,
  runningModelId: string = runtimeEmbeddingModelId()
): void {
  if (recordedModelId !== runningModelId) throw new EmbeddingModelMismatchError(label, recordedModelId, runningModelId);
}
