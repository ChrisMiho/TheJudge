// Small file-system and text helpers the scripts used to copy into each file.
import fs from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import path from "node:path";

/** Creates the folder that will hold `filePath` (and any missing parents). */
export function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/** Writes `text` to `filePath` whole: a temp file first, then a rename, so a reader never sees half a file. */
export async function writeWhole(filePath, text) {
  const temp = `${filePath}.tmp-${process.pid}`;
  await writeFile(temp, text, "utf8");
  await rename(temp, filePath);
}

/** Escapes `value` so it matches itself literally inside a regular expression. */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A byte count as B, KB or MB (three tiers). */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
