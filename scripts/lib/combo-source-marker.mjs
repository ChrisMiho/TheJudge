// Hash-gated Commander Spellbook combo reuse (REQ-196).
//
// The weekly refresh rebuilds combos only when their build inputs changed. Two
// content hashes are the gate: the set of Scryfall `oracle_id`s in the fresh
// `default_cards` (the pool the template searches run against) and the set of
// distinct combo templates (id + Scryfall query) in the variant export. Both are
// stored in a committed marker beside the combo artifacts. Volatile fields
// (prices, popularity, the export timestamp) are excluded, so weekly price churn
// never triggers a rebuild. The export's own version/timestamp are NOT the gate:
// the timestamp changes on every regeneration (would never skip) and the version
// is a schema version that rarely moves (would skip even when combos changed).

import crypto from "node:crypto";
import fs from "node:fs";

import { streamJsonArrayObjects } from "./stream-json-array.mjs";

/** Order-independent hash of a set of Scryfall oracle ids; blank/non-string ids are dropped. */
export function hashOracleIdSet(oracleIds) {
  const unique = [...new Set(oracleIds)].filter((id) => typeof id === "string" && id.length > 0).sort();
  return crypto.createHash("sha256").update(unique.join("\n")).digest("hex");
}

/** Order-independent hash of the distinct combo templates (id + Scryfall query). */
export function hashTemplateSet(templates) {
  const rows = (templates ?? [])
    .map((t) => `${t.templateId}\t${t.scryfallApi ?? ""}`)
    .sort();
  return crypto.createHash("sha256").update(rows.join("\n")).digest("hex");
}

/**
 * Stream a Scryfall `default-cards.json` array and hash its `oracle_id` set. Streamed,
 * never read as one string — the file is far larger than V8's max string length.
 * Returns `null` when the file cannot be read, so the caller treats it as "changed".
 */
export async function hashCardIdentityFile(filePath) {
  try {
    const oracleIds = new Set();
    const stream = fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: 1024 * 1024 });
    for await (const card of streamJsonArrayObjects(stream)) {
      const id = card?.oracle_id;
      if (typeof id === "string" && id.length > 0) oracleIds.add(id);
    }
    return hashOracleIdSet(oracleIds);
  } catch {
    return null;
  }
}

/** Read the committed marker, or `null` if missing/unreadable/malformed (treated as "changed"). */
export function readComboSourceMarker(markerPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(markerPath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Write the marker recording the hashes the committed combo artifacts were built from. */
export function writeComboSourceMarker(markerPath, { cardIdentityHash, templateSetHash, exportVersion = null, exportTimestamp = null }) {
  const payload = {
    cardIdentityHash: cardIdentityHash ?? null,
    templateSetHash: templateSetHash ?? null,
    exportVersion,
    exportTimestamp,
    builtAt: new Date().toISOString()
  };
  fs.writeFileSync(markerPath, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

/**
 * Combos need a refresh unless BOTH hashes match the committed marker. A missing or
 * unreadable marker, or an uncomputable (falsy) hash, all count as "changed" — the
 * safe default is to refresh, never to wrongly skip and ship stale combos.
 */
export function combosNeedRefresh(marker, { cardIdentityHash, templateSetHash }) {
  if (!marker) return true;
  if (!cardIdentityHash || !templateSetHash) return true;
  return marker.cardIdentityHash !== cardIdentityHash || marker.templateSetHash !== templateSetHash;
}
