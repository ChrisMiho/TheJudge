// Small file-system and text helpers the scripts used to copy into each file.
import fs from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

/**
 * Brotli-compress with the fixed, named params this repository uses
 * everywhere: quality 11, a size hint set to the raw input length, no
 * `dictionary` option (Node 22 in CI silently ignores a brotli dictionary
 * while Node 24 on Lambda honours it, which would make CI and Lambda
 * disagree).
 */
export function brotliCompress(buffer) {
  return zlib.brotliCompressSync(buffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length
    }
  });
}

/** Reads a brotli-compressed UTF-8 JSON file and parses it. */
export function readBrotliJson(filePath) {
  return JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(filePath)).toString("utf8"));
}

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
