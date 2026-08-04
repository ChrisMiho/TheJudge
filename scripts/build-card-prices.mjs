import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { shouldIncludeScanPrinting } from "../apps/frontend/src/lib/scan/hashLibBuild.ts";

const DEFAULT_INPUT = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const DEFAULT_INPUT_META = path.resolve("apps/frontend/data/scryfall/default-cards.meta.json");
const DEFAULT_OUTPUT = path.resolve("apps/frontend/public/data/cardPrintingPrices.json");

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function* readScryfallCards(inputPath) {
  let startedArray = false;
  let collectingObject = false;
  let inString = false;
  let escapeNext = false;
  let depth = 0;
  let objectBuffer = "";

  const stream = fs.createReadStream(inputPath, {
    encoding: "utf8",
    highWaterMark: 1024 * 1024
  });

  for await (const chunk of stream) {
    for (let index = 0; index < chunk.length; index += 1) {
      const char = chunk[index];

      if (!startedArray) {
        if (char === "[") startedArray = true;
        continue;
      }

      if (!collectingObject) {
        if (char === "{") {
          collectingObject = true;
          inString = false;
          escapeNext = false;
          depth = 1;
          objectBuffer = "{";
        }
        continue;
      }

      objectBuffer += char;

      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        if (inString) escapeNext = true;
        continue;
      }
      if (char === "\"") {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          depth += 1;
        } else if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            collectingObject = false;
            const card = JSON.parse(objectBuffer);
            objectBuffer = "";
            yield card;
          }
        }
      }
    }
  }
}

function hasOracleId(card) {
  return typeof card?.oracle_id === "string" && card.oracle_id.length > 0;
}

function getImageUrl(card) {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.image_uris?.small) return card.image_uris.small;
  if (Array.isArray(card.card_faces)) {
    for (const face of card.card_faces) {
      if (face?.image_uris?.normal) return face.image_uris.normal;
      if (face?.image_uris?.small) return face.image_uris.small;
    }
  }
  return "";
}

export function normalizePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildPriceEntry(card) {
  return {
    id: card.id,
    oracleId: card.oracle_id,
    name: typeof card.name === "string" ? card.name.trim() : "",
    set: typeof card.set === "string" ? card.set : "",
    setName: typeof card.set_name === "string" ? card.set_name : "",
    collectorNumber: typeof card.collector_number === "string" ? card.collector_number : "",
    imageUrl: getImageUrl(card),
    usd: normalizePrice(card.prices?.usd),
    usdFoil: normalizePrice(card.prices?.usd_foil)
  };
}

/**
 * Snapshot date preference: persisted Scryfall bulk metadata (`updated_at`) when a
 * sidecar exists, then the source file's mtime, then the build date.
 */
export function resolveSnapshotDate(inputPath, metaPath = DEFAULT_INPUT_META, now = new Date()) {
  if (metaPath && fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      const updatedAt = meta?.updated_at ?? meta?.updatedAt;
      if (typeof updatedAt === "string" && !Number.isNaN(Date.parse(updatedAt))) {
        return new Date(updatedAt).toISOString();
      }
    } catch {
      // Fall through to the mtime / build-date fallbacks.
    }
  }

  try {
    if (inputPath && fs.existsSync(inputPath)) {
      return fs.statSync(inputPath).mtime.toISOString();
    }
  } catch {
    // Fall through to the build date.
  }

  return now.toISOString();
}

export async function buildCardPrices(inputPath, metaPath = DEFAULT_INPUT_META) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const printings = {};
  const byOracleId = {};
  const stats = {
    parsed: 0,
    skippedByFilter: 0,
    skippedMissingOracleId: 0,
    entries: 0,
    oracles: 0,
    withUsd: 0,
    withUsdFoil: 0,
    withoutAnyPrice: 0
  };

  for await (const card of readScryfallCards(inputPath)) {
    stats.parsed += 1;
    if (!shouldIncludeScanPrinting(card)) {
      stats.skippedByFilter += 1;
      continue;
    }
    if (!hasOracleId(card)) {
      stats.skippedMissingOracleId += 1;
      continue;
    }

    // Printings with no price are kept: they stay selectable, and the pricing layer
    // treats a null price as $0 plus a missing-price flag.
    const entry = buildPriceEntry(card);
    printings[entry.id] = entry;

    const bucket = byOracleId[entry.oracleId];
    if (bucket) {
      bucket.push(entry.id);
    } else {
      byOracleId[entry.oracleId] = [entry.id];
    }

    if (entry.usd !== null) stats.withUsd += 1;
    if (entry.usdFoil !== null) stats.withUsdFoil += 1;
    if (entry.usd === null && entry.usdFoil === null) stats.withoutAnyPrice += 1;
  }

  stats.entries = Object.keys(printings).length;
  stats.oracles = Object.keys(byOracleId).length;

  return {
    artifact: { snapshotDate: resolveSnapshotDate(inputPath, metaPath), printings, byOracleId },
    stats
  };
}

async function main() {
  if (!fs.existsSync(DEFAULT_INPUT)) {
    // Graceful degradation: the raw bulk source is gitignored and may be absent.
    // Keep the prior committed artifact and let the rest of `data:build` continue.
    console.warn(`[build-card-prices] Source not found, keeping existing artifact: ${DEFAULT_INPUT}`);
    return;
  }

  let result;
  try {
    result = await buildCardPrices(DEFAULT_INPUT);
  } catch (error) {
    console.warn(
      `[build-card-prices] Build failed, keeping existing artifact: ${error instanceof Error ? error.message : String(error)}`
    );
    return;
  }

  const { artifact, stats } = result;

  ensureParentDirectory(DEFAULT_OUTPUT);
  fs.writeFileSync(DEFAULT_OUTPUT, JSON.stringify(artifact));

  console.log(`[build-card-prices] Parsed cards: ${stats.parsed}`);
  console.log(`[build-card-prices] Skipped by filter: ${stats.skippedByFilter}`);
  console.log(`[build-card-prices] Skipped missing oracle id: ${stats.skippedMissingOracleId}`);
  console.log(`[build-card-prices] Printings: ${stats.entries}`);
  console.log(`[build-card-prices] Oracle ids: ${stats.oracles}`);
  console.log(`[build-card-prices] With usd: ${stats.withUsd}, with usdFoil: ${stats.withUsdFoil}`);
  console.log(`[build-card-prices] Without any price: ${stats.withoutAnyPrice}`);
  console.log(`[build-card-prices] Snapshot date: ${artifact.snapshotDate}`);
  console.log(`[build-card-prices] Wrote: ${DEFAULT_OUTPUT}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
