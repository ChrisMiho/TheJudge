// Full card-name lookup for the local practice suite's convert step (REQ-232).
//
// The committed card detail file (`cardDetailByOracleId.json.br`) holds every
// oracle id but no names, so names come from two committed files joined by
// oracle id: `cardMetadata.json` (leaves out cards with no rules text), then,
// for the ids it omits, the first printing in `cardScanMap.json`. Matching
// tries the exact name, then case-insensitive, then accent-folded; a
// double-faced `A // B` also answers to `A`. A non-token card wins over a token;
// a name still matching two cards is unresolved, never guessed.
//
// Sources are injected so tests use small in-memory data; loadCardNameSources()
// reads the committed files for the real run.

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Reads the three committed files the lookup joins. */
export async function loadCardNameSources({ root = repoRoot } = {}) {
  const detail = JSON.parse(brotliDecompressSync(await readFile(join(root, "apps/backend/data/cardDetailByOracleId.json.br"))).toString("utf8"));
  const metadata = JSON.parse(await readFile(join(root, "apps/frontend/public/data/cardMetadata.json"), "utf8"));
  const scanMap = JSON.parse(await readFile(join(root, "apps/frontend/public/data/cardScanMap.json"), "utf8"));
  return { detail, metadata, scanMap };
}

const exactKey = (name) => name.trim();
const lowerKey = (name) => name.trim().toLowerCase();
const foldedKey = (name) =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();

function add(map, key, id) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(id);
}

/**
 * Builds the lookup. `detail` maps oracle id to `{ typeLine }` and is the key
 * set; `metadata` is `[{ cardId, name }]`; `scanMap` maps a printing to
 * `{ oracleId, name }`. Returns `{ lookup(name), namedCount }`, where
 * `lookup` gives `{ status: "resolved", oracleId, name }`, `{ status:
 * "ambiguous" }` or `{ status: "unresolved" }`.
 */
export function buildCardNameIndex({ detail, metadata, scanMap }) {
  const nameOf = new Map();
  for (const row of metadata) {
    if (typeof row?.cardId === "string" && typeof row?.name === "string" && Object.hasOwn(detail, row.cardId) && !nameOf.has(row.cardId)) {
      nameOf.set(row.cardId, row.name);
    }
  }
  const scanned = new Set();
  for (const entry of Object.values(scanMap)) {
    const id = entry?.oracleId;
    if (typeof id !== "string" || scanned.has(id)) continue;
    scanned.add(id);
    if (typeof entry.name === "string" && Object.hasOwn(detail, id) && !nameOf.has(id)) nameOf.set(id, entry.name);
  }

  const isToken = (id) => /Token/.test(detail[id]?.typeLine ?? "");
  const levels = [
    { key: exactKey, map: new Map() },
    { key: lowerKey, map: new Map() },
    { key: foldedKey, map: new Map() }
  ];
  for (const [id, name] of nameOf) {
    const spellings = [name];
    if (name.includes(" // ")) spellings.push(name.split(" // ")[0]);
    for (const spelling of spellings) for (const level of levels) add(level.map, level.key(spelling), id);
  }

  return {
    namedCount: nameOf.size,
    lookup(name) {
      if (typeof name !== "string" || name.trim() === "") return { status: "unresolved" };
      for (const level of levels) {
        const found = level.map.get(level.key(name));
        if (!found) continue;
        const nonToken = [...found].filter((id) => !isToken(id));
        const pool = nonToken.length > 0 ? nonToken : [...found];
        if (pool.length === 1) return { status: "resolved", oracleId: pool[0], name: nameOf.get(pool[0]) };
        return { status: "ambiguous" };
      }
      return { status: "unresolved" };
    }
  };
}
