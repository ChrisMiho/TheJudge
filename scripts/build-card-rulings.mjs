import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const inputPath = path.resolve("apps/backend/data/scryfall/rulings.json");
const metadataPath = path.resolve("apps/frontend/public/data/cardMetadata.json");
const outputPath = path.resolve("apps/backend/data/cardRulingsByOracleId.json");

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeInlineWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createRulingsTransformState(metadataCardIds) {
  return {
    metadataCardIds,
    parsedCount: 0,
    wotcCount: 0,
    skippedMissingOracleId: 0,
    skippedMissingComment: 0,
    skippedOutsideMetadata: 0,
    rulingsByOracleId: new Map()
  };
}

export function ingestRuling(state, ruling) {
  state.parsedCount += 1;

  if (ruling?.source !== "wotc") {
    return;
  }

  state.wotcCount += 1;

  const oracleId = typeof ruling?.oracle_id === "string" ? ruling.oracle_id.trim() : "";
  if (oracleId.length === 0) {
    state.skippedMissingOracleId += 1;
    return;
  }

  const comment = typeof ruling?.comment === "string" ? normalizeInlineWhitespace(ruling.comment) : "";
  if (comment.length === 0) {
    state.skippedMissingComment += 1;
    return;
  }

  if (!state.metadataCardIds.has(oracleId)) {
    state.skippedOutsideMetadata += 1;
    return;
  }

  const publishedAt =
    typeof ruling?.published_at === "string" && ruling.published_at.trim().length > 0
      ? ruling.published_at.trim()
      : "0000-00-00";
  const existing = state.rulingsByOracleId.get(oracleId) ?? [];
  existing.push({ publishedAt, comment });
  state.rulingsByOracleId.set(oracleId, existing);
}

export function finalizeRulingsTransformState(state) {
  const sortedOracleIds = [...state.rulingsByOracleId.keys()].sort();
  const output = {};

  for (const oracleId of sortedOracleIds) {
    output[oracleId] = [...state.rulingsByOracleId.get(oracleId)].sort((a, b) => {
      const byDate = b.publishedAt.localeCompare(a.publishedAt);
      if (byDate !== 0) return byDate;
      return a.comment.localeCompare(b.comment);
    });
  }

  return {
    rulingsByOracleId: output,
    stats: {
      parsedCount: state.parsedCount,
      wotcCount: state.wotcCount,
      skippedMissingOracleId: state.skippedMissingOracleId,
      skippedMissingComment: state.skippedMissingComment,
      skippedOutsideMetadata: state.skippedOutsideMetadata,
      cardsWithRulings: sortedOracleIds.length
    }
  };
}

export function transformRulings(rulings, metadataCardIds) {
  const state = createRulingsTransformState(metadataCardIds);
  for (const ruling of rulings) {
    ingestRuling(state, ruling);
  }
  return finalizeRulingsTransformState(state);
}

function readMetadataCardIds() {
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Card metadata not found: ${metadataPath}. Run npm run data:build after restoring metadata input.`);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  if (!Array.isArray(metadata)) {
    throw new Error(`Unexpected card metadata shape in ${metadataPath}; expected a JSON array.`);
  }

  return new Set(
    metadata
      .map((card) => (typeof card?.cardId === "string" ? card.cardId.trim() : ""))
      .filter((cardId) => cardId.length > 0)
  );
}

function validateExistingArtifact() {
  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Raw rulings file not found: ${inputPath}. Existing artifact also missing: ${outputPath}. Run slice A with human-approved Scryfall download before rebuilding rulings.`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  if (!artifact || Array.isArray(artifact) || typeof artifact !== "object") {
    throw new Error(`Unexpected rulings artifact shape in ${outputPath}; expected an object keyed by oracle_id.`);
  }

  const bytes = fs.statSync(outputPath).size;
  console.log(`Raw rulings file not found: ${inputPath}`);
  console.log(`Preserved existing rulings artifact: ${outputPath} (${formatBytes(bytes)}).`);
}

async function ingestRulingsStream(state) {
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
  if (!fs.existsSync(inputPath)) {
    validateExistingArtifact();
    return;
  }

  const metadataCardIds = readMetadataCardIds();
  const state = createRulingsTransformState(metadataCardIds);
  await ingestRulingsStream(state);

  const { rulingsByOracleId, stats } = finalizeRulingsTransformState(state);
  const output = JSON.stringify(rulingsByOracleId);
  ensureParentDirectory(outputPath);
  fs.writeFileSync(outputPath, output);

  console.log(`Parsed rulings: ${stats.parsedCount}`);
  console.log(`WotC rulings: ${stats.wotcCount}`);
  console.log(`Cards with rulings: ${stats.cardsWithRulings}`);
  console.log(`Skipped missing oracle_id: ${stats.skippedMissingOracleId}`);
  console.log(`Skipped missing comment: ${stats.skippedMissingComment}`);
  console.log(`Skipped outside metadata: ${stats.skippedOutsideMetadata}`);
  console.log(`Output bytes: ${Buffer.byteLength(output)}`);
  console.log(`Wrote: ${outputPath}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
