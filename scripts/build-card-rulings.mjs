import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const inputPath = path.resolve("apps/backend/data/scryfall/rulings.json");
const metadataPath = path.resolve("apps/frontend/public/data/cardMetadata.json");
const outputPath = path.resolve("apps/backend/data/cardRulingsByOracleId.json");

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeComment(comment) {
  return comment.replace(/\s+/g, " ").trim();
}

function getMetadataOracleIds(cards) {
  const oracleIds = new Set();

  for (const card of cards) {
    if (typeof card?.cardId === "string" && card.cardId.length > 0) {
      oracleIds.add(card.cardId);
    }
  }

  return oracleIds;
}

export function createTransformState(metadataOracleIds) {
  return {
    metadataOracleIds,
    parsedCount: 0,
    wotcCount: 0,
    skippedWithoutMetadata: 0,
    skippedWithoutComment: 0,
    rulingsByOracleId: new Map()
  };
}

export function ingestRuling(state, ruling) {
  state.parsedCount += 1;

  if (ruling?.source !== "wotc") {
    return;
  }
  state.wotcCount += 1;

  const oracleId = typeof ruling?.oracle_id === "string" ? ruling.oracle_id : "";
  if (!state.metadataOracleIds.has(oracleId)) {
    state.skippedWithoutMetadata += 1;
    return;
  }

  const comment = typeof ruling?.comment === "string" ? normalizeComment(ruling.comment) : "";
  if (comment.length === 0) {
    state.skippedWithoutComment += 1;
    return;
  }

  const publishedAt = typeof ruling?.published_at === "string" ? ruling.published_at : "";
  const cardRulings = state.rulingsByOracleId.get(oracleId) ?? [];
  cardRulings.push({ publishedAt, comment });
  state.rulingsByOracleId.set(oracleId, cardRulings);
}

export function finalizeTransformState(state) {
  const output = {};
  const sortedOracleIds = [...state.rulingsByOracleId.keys()].sort();

  for (const oracleId of sortedOracleIds) {
    output[oracleId] = state.rulingsByOracleId
      .get(oracleId)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  return {
    rulingsByOracleId: output,
    stats: {
      parsedCount: state.parsedCount,
      wotcCount: state.wotcCount,
      cardsWithRulings: sortedOracleIds.length,
      skippedWithoutMetadata: state.skippedWithoutMetadata,
      skippedWithoutComment: state.skippedWithoutComment
    }
  };
}

export function transformRulings(rulings, metadataCards) {
  const state = createTransformState(getMetadataOracleIds(metadataCards));
  for (const ruling of rulings) {
    ingestRuling(state, ruling);
  }
  return finalizeTransformState(state);
}

async function parseRulingsStream(filePath, state) {
  let startedArray = false;
  let collectingObject = false;
  let inString = false;
  let escapeNext = false;
  let depth = 0;
  let objectBuffer = "";

  const stream = fs.createReadStream(filePath, {
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

            const ruling = JSON.parse(objectBuffer);
            objectBuffer = "";
            ingestRuling(state, ruling);
          }
        }
      }
    }
  }
}

async function main() {
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata file not found: ${metadataPath}. Run npm run data:build after default-cards.json exists.`);
  }
  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Input file not found: ${inputPath}. Download Scryfall rulings first with npm run data:refresh after approval per PRD/work/card-wotc-rule-enrichment/slice-a-scryfall-download.md.`
    );
  }

  const metadataCards = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  if (!Array.isArray(metadataCards)) {
    throw new Error(`Unexpected metadata shape in ${metadataPath}.`);
  }

  const state = createTransformState(getMetadataOracleIds(metadataCards));
  await parseRulingsStream(inputPath, state);

  const { rulingsByOracleId, stats } = finalizeTransformState(state);
  const outputJson = `${JSON.stringify(rulingsByOracleId)}\n`;
  ensureParentDirectory(outputPath);
  fs.writeFileSync(outputPath, outputJson);

  console.log(`Parsed rulings: ${stats.parsedCount}`);
  console.log(`WotC rulings: ${stats.wotcCount}`);
  console.log(`Skipped without metadata: ${stats.skippedWithoutMetadata}`);
  console.log(`Skipped without comment: ${stats.skippedWithoutComment}`);
  console.log(`Cards with rulings: ${stats.cardsWithRulings}`);
  console.log(`Wrote: ${outputPath} (${formatBytes(Buffer.byteLength(outputJson))})`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
