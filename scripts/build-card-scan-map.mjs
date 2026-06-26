import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { shouldIncludeScanPrinting } from "../apps/frontend/src/lib/scan/hashLibBuild.ts";

const DEFAULT_INPUT = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const DEFAULT_OUTPUT = path.resolve("apps/frontend/public/data/cardScanMap.json");

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

export function buildScanMapEntry(card) {
  return { oracleId: card.oracle_id, name: card.name.trim(), imageUrl: getImageUrl(card) };
}

export async function buildScanMap(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const scanMap = {};
  const stats = { parsed: 0, skippedByFilter: 0, skippedMissingOracleId: 0, entries: 0 };

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
    scanMap[card.id] = buildScanMapEntry(card);
  }

  stats.entries = Object.keys(scanMap).length;
  return { scanMap, stats };
}

async function main() {
  const { scanMap, stats } = await buildScanMap(DEFAULT_INPUT);

  ensureParentDirectory(DEFAULT_OUTPUT);
  fs.writeFileSync(DEFAULT_OUTPUT, JSON.stringify(scanMap));

  console.log(`[build-card-scan-map] Parsed cards: ${stats.parsed}`);
  console.log(`[build-card-scan-map] Skipped by filter: ${stats.skippedByFilter}`);
  console.log(`[build-card-scan-map] Skipped missing oracle id: ${stats.skippedMissingOracleId}`);
  console.log(`[build-card-scan-map] Map entries: ${stats.entries}`);
  console.log(`[build-card-scan-map] Wrote: ${DEFAULT_OUTPUT}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
