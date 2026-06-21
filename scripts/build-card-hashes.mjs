import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { PNG } from "pngjs";

import { phashRegionPacked } from "../apps/frontend/src/lib/scan/recipe.ts";
import { CARD_HEIGHT, CARD_WIDTH, cropRegionA } from "../apps/frontend/src/lib/scan/identify.ts";
import { readDb, writeDb } from "../apps/frontend/src/lib/scan/dbformat.ts";
import {
  applySkiplistOutcome,
  backoffDelayMs,
  classifyFetchFailure,
  diffMissingEntries,
  evaluateBudget,
  mergeEntries,
  parseRetryAfterMs,
  planTargetEntryIds,
  readSkiplist,
  resolveBuildTargets,
  serializeSkiplist,
  writeFileAtomic
} from "../apps/frontend/src/lib/scan/hashLibBuild.ts";

const VERSION = 1;
const HASH_BYTES = 96;
const DEFAULT_INPUT = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const DEFAULT_IMAGE_DIR = path.resolve("apps/frontend/data/scryfall/card-images");
const DEFAULT_OUTPUT = path.resolve("apps/frontend/public/data/cardhashes.bin");
const DEFAULT_MANIFEST = path.resolve("apps/frontend/public/data/cardhashManifest.json");
const DEFAULT_SKIPLIST = path.resolve("apps/frontend/public/data/cardhashSkiplist.json");
const CARD_BACK_REFERENCE_NAME = "card_back_reference.png";
const CARD_BACK_ID = "_card_back";
const BACK_FACE_SUFFIX = "__back";
const DEFAULT_RATE_MS = 75;
const CHECKPOINT_EVERY = 50;
const MAX_RETRIES = 4;
const PARK_THRESHOLD = 3;
const PROGRESS_BANNER = "Building card-scan fingerprint library (cardhashes.bin) — resume + extend";

const EXCLUDED_LAYOUTS = new Set([
  "art_series",
  "planar",
  "scheme",
  "vanguard",
  "token",
  "double_faced_token",
  "emblem"
]);
const EXCLUDED_SET_TYPES = new Set(["memorabilia", "minigame"]);

function printHelp() {
  console.log(`Usage: npx tsx scripts/build-card-hashes.mjs [options]

Build the local CARDHSH1 fingerprint library with resumable hash-and-discard downloads.
Day-to-day use is: npm run data:scan-fingerprints

Options:
  --input <path>       Scryfall default-cards JSON (default: ${DEFAULT_INPUT})
  --image-dir <path>   Directory containing ${CARD_BACK_REFERENCE_NAME} (default: ${DEFAULT_IMAGE_DIR})
  --output <path>      Output cardhashes.bin path (default: ${DEFAULT_OUTPUT})
  --manifest <path>    Output cardhashManifest.json path (default: ${DEFAULT_MANIFEST})
  --skiplist <path>    Skip-list sidecar path (default: ${DEFAULT_SKIPLIST})
  --rate-ms <n>        Inter-request pace for Scryfall downloads (default: ${DEFAULT_RATE_MS})
  --limit <n>          Stop after hashing n new entries in this run
  --max-minutes <n>    Stop after n wall-clock minutes, after the current entry finishes
  --retry-parked       Re-include parked entries in this run's diff
  --fresh              Rebuild from scratch into sibling cardhashes.fresh.bin / manifest
  --force              Allow --fresh to replace an existing fresh target
  --self-test          Run an in-memory writer/readDb round-trip check; no files or network
  --help               Show this help; no files or network

Network posture:
  Running this command is the human approval to download missing Scryfall PNGs. Existing
  entries in --output are reused, so only missing entries are downloaded. Each image is
  written to a transient OS temp path, hashed, and deleted immediately. Scanner runtime
  never downloads card images. Downloads are paced by --rate-ms and automatically retry
  429/5xx/network failures with bounded backoff, honoring Retry-After when present.

Resume and safety posture:
  The default run resumes and extends the live cardhashes.bin by diffing filtered Scryfall
  printings against entries already in the bin. It checkpoints every ${CHECKPOINT_EVERY} newly
  hashed entries and again on clean stop. Bin, manifest, and skip-list writes use same-directory
  temp files plus atomic rename, so the next run resumes from the latest valid partial.
  --limit and --max-minutes are optional per-run budgets; when reached, the in-flight entry
  finishes before the checkpoint is written.

Skip-list posture:
  Permanent per-image failures (404, decode/dimension errors) are tracked in --skiplist and
  parked after ${PARK_THRESHOLD} attempts so a bad image stops blocking progress. Transient
  failures (429/5xx/network) are retried next run and never count toward parking. Use
  --retry-parked to re-attempt parked entries.

Fresh rebuild posture:
  --fresh ignores the live bin's contents and writes a separate artifact. By default that is
  cardhashes.fresh.bin plus cardhashManifest.fresh.json next to the live files. Existing
  default fresh targets are protected unless --force is passed; --fresh never writes the live
  cardhashes.bin / cardhashManifest.json paths. Promote a fresh artifact to the live paths only
  as a deliberate manual step after review.`);
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    imageDir: DEFAULT_IMAGE_DIR,
    output: DEFAULT_OUTPUT,
    manifest: DEFAULT_MANIFEST,
    skiplist: DEFAULT_SKIPLIST,
    rateMs: DEFAULT_RATE_MS,
    limit: undefined,
    maxMinutes: undefined,
    retryParked: false,
    fresh: false,
    force: false,
    outputExplicit: false,
    manifestExplicit: false,
    selfTest: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--self-test") {
      options.selfTest = true;
    } else if (arg === "--input") {
      options.input = path.resolve(readArgValue(argv, ++i, arg));
    } else if (arg === "--image-dir") {
      options.imageDir = path.resolve(readArgValue(argv, ++i, arg));
    } else if (arg === "--output") {
      options.output = path.resolve(readArgValue(argv, ++i, arg));
      options.outputExplicit = true;
    } else if (arg === "--manifest") {
      options.manifest = path.resolve(readArgValue(argv, ++i, arg));
      options.manifestExplicit = true;
    } else if (arg === "--skiplist") {
      options.skiplist = path.resolve(readArgValue(argv, ++i, arg));
    } else if (arg === "--rate-ms") {
      options.rateMs = parseNonNegativeInteger(readArgValue(argv, ++i, arg), arg);
    } else if (arg === "--limit") {
      options.limit = parsePositiveInteger(readArgValue(argv, ++i, arg), arg);
    } else if (arg === "--max-minutes") {
      options.maxMinutes = parsePositiveInteger(readArgValue(argv, ++i, arg), arg);
    } else if (arg === "--retry-parked") {
      options.retryParked = true;
    } else if (arg === "--fresh") {
      options.fresh = true;
    } else if (arg === "--force") {
      options.force = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function readArgValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseNonNegativeInteger(value, flag) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Expected non-negative integer for ${flag}, got ${JSON.stringify(value)}`);
  }
  return Number(value);
}

function parsePositiveInteger(value, flag) {
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new Error(`Expected positive integer for ${flag}, got ${JSON.stringify(value)}`);
  }
  return Number(value);
}

function createScryfallRequestOptions() {
  return {
    headers: {
      Accept: "image/png,application/json;q=0.9,*/*;q=0.8",
      "User-Agent": "TheJudge/0.0.1 (https://github.com/local/thejudge)"
    }
  };
}

function hasPaperPrinting(card) {
  return Array.isArray(card?.games) && card.games.includes("paper") && card.digital !== true;
}

function textIncludesChecklistOrSubstitute(card) {
  const haystack = [card?.name, card?.type_line, card?.oracle_text]
    .filter((value) => typeof value === "string")
    .join(" ");
  return /\b(checklist|substitute)\s+card\b/i.test(haystack);
}

export function shouldIncludeScanPrinting(card) {
  // Exclude non-paper or non-gameplay Scryfall objects by layout, set_type, oversized flag, and checklist/substitute "Card" labels.
  if (typeof card?.id !== "string" || card.id.length === 0) return false;
  if (!hasPaperPrinting(card)) return false;
  if (card?.oversized === true) return false;
  if (EXCLUDED_LAYOUTS.has(String(card?.layout ?? ""))) return false;
  if (EXCLUDED_SET_TYPES.has(String(card?.set_type ?? ""))) return false;
  if (textIncludesChecklistOrSubstitute(card)) return false;
  if (String(card?.type_line ?? "").trim() === "Card") return false;
  return true;
}

function getFrontImageUrl(card) {
  if (typeof card?.image_uris?.png === "string") return card.image_uris.png;
  if (Array.isArray(card?.card_faces) && typeof card.card_faces[0]?.image_uris?.png === "string") {
    return card.card_faces[0].image_uris.png;
  }
  return "";
}

function getBackImageUrl(card) {
  if (Array.isArray(card?.card_faces) && typeof card.card_faces[1]?.image_uris?.png === "string") {
    return card.card_faces[1].image_uris.png;
  }
  return "";
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

function decodeCanonicalPng(filePath) {
  const png = PNG.sync.read(fs.readFileSync(filePath));
  const { width, height, data: rgba } = png;
  if (width !== CARD_WIDTH || height !== CARD_HEIGHT) {
    throw new Error(`Expected canonical ${CARD_WIDTH}x${CARD_HEIGHT} PNG, got ${width}x${height}: ${filePath}`);
  }

  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 3) {
    rgb[p] = rgba[i];
    rgb[p + 1] = rgba[i + 1];
    rgb[p + 2] = rgba[i + 2];
  }
  return { width, height, data: rgb };
}

function hashCanonicalPng(filePath) {
  return phashRegionPacked(cropRegionA(decodeCanonicalPng(filePath)));
}

function buildDb(entries) {
  const hashes = new Uint8Array(entries.length * HASH_BYTES);
  entries.forEach((entry, index) => hashes.set(entry.hash, index * HASH_BYTES));
  return {
    ids: entries.map((entry) => entry.id),
    hashes,
    count: entries.length
  };
}

function entriesFromDb(db) {
  return db.ids.map((id, index) => ({
    id,
    hash: db.hashes.slice(index * HASH_BYTES, index * HASH_BYTES + HASH_BYTES)
  }));
}

function sanitizeTempName(id) {
  return id.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadPngWithRetry(url, outputPath, rateMs) {
  if (!url) {
    return { ok: false, kind: "permanent", error: new Error(`Missing Scryfall PNG URL for ${outputPath}`) };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    if (rateMs > 0) await sleep(rateMs);

    try {
      const response = await fetch(url, createScryfallRequestOptions());
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        fs.writeFileSync(outputPath, bytes);
        return { ok: true };
      }

      const kind = classifyFetchFailure(response.status);
      if (kind === "permanent") {
        return {
          ok: false,
          kind,
          error: new Error(`Could not download ${url}: ${response.status} ${response.statusText}`)
        };
      }

      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelayMs(attempt, parseRetryAfterMs(response.headers.get("retry-after"))));
        continue;
      }

      return {
        ok: false,
        kind,
        error: new Error(`Could not download ${url}: ${response.status} ${response.statusText}`)
      };
    } catch (error) {
      const kind = classifyFetchFailure(null, error);
      if (kind === "permanent" || attempt >= MAX_RETRIES) {
        return { ok: false, kind, error };
      }
      await sleep(backoffDelayMs(attempt));
    }
  }

  return { ok: false, kind: "transient", error: new Error(`Could not download ${url}`) };
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function logSkipped(kind, id, error) {
  console.warn(`[build-card-hashes] Skipped ${kind} ${id}: ${errorMessage(error)}`);
}

function countTargetExisting(targetIds, existingEntries) {
  const existingIds = new Set(existingEntries.map((entry) => entry.id));
  return targetIds.filter((id) => existingIds.has(id)).length;
}

function countTargetParked(targetIds, existingEntries, skiplist) {
  const existingIds = new Set(existingEntries.map((entry) => entry.id));
  return targetIds.filter((id) => !existingIds.has(id) && skiplist[id]?.parked).length;
}

function countTargetRemaining(targetIds, existingEntries, skiplist, { retryParked = false } = {}) {
  const existingIds = new Set(existingEntries.map((entry) => entry.id));
  return targetIds.filter((id) => !existingIds.has(id) && (retryParked || !skiplist[id]?.parked)).length;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "n/a";
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatEta({ hashedNew, remaining, startedAtMs }, nowMs = Date.now()) {
  if (remaining <= 0) return "complete";
  if (hashedNew <= 0) return "n/a until first new entry completes";

  const elapsedMs = Math.max(1, nowMs - startedAtMs);
  const entriesPerMs = hashedNew / elapsedMs;
  return formatDuration(remaining / entriesPerMs);
}

function printProgressReadout({ phase, mode, targetIds, existingEntries, skiplist, stats, startedAtMs, retryParked }) {
  const alreadyFingerprinted = countTargetExisting(targetIds, existingEntries);
  const parked = countTargetParked(targetIds, existingEntries, skiplist);
  const remaining = countTargetRemaining(targetIds, existingEntries, skiplist, { retryParked });

  console.log(`[build-card-hashes] ${PROGRESS_BANNER}`);
  console.log(`[build-card-hashes] Progress (${phase})`);
  if (mode) console.log(`[build-card-hashes] Mode: ${mode}`);
  console.log(`[build-card-hashes] Total target: ${targetIds.length}`);
  console.log(`[build-card-hashes] Already fingerprinted: ${alreadyFingerprinted}`);
  console.log(`[build-card-hashes] Done this run: ${stats.hashedNew}`);
  console.log(`[build-card-hashes] Remaining: ${remaining}`);
  console.log(`[build-card-hashes] Parked: ${parked}`);
  console.log(`[build-card-hashes] Rough ETA at current run rate: ${formatEta({ hashedNew: stats.hashedNew, remaining, startedAtMs })}`);
}

async function hashFileSha256(filePath) {
  const hash = createHash("sha256");
  const stream = fs.createReadStream(filePath);
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest("hex");
}

function assertByteEqual(label, actual, expected) {
  if (actual.length !== expected.length) {
    throw new Error(`${label} length mismatch: ${actual.length} !== ${expected.length}`);
  }
  for (let i = 0; i < actual.length; i += 1) {
    if (actual[i] !== expected[i]) {
      throw new Error(`${label} byte mismatch at ${i}: ${actual[i]} !== ${expected[i]}`);
    }
  }
}

function createSyntheticCard(seed) {
  const data = new Uint8Array(CARD_WIDTH * CARD_HEIGHT * 3);
  for (let y = 0; y < CARD_HEIGHT; y += 1) {
    for (let x = 0; x < CARD_WIDTH; x += 1) {
      const p = (y * CARD_WIDTH + x) * 3;
      data[p] = (x * seed + y) & 0xff;
      data[p + 1] = (x + y * seed) & 0xff;
      data[p + 2] = (seed * 53 + x + y) & 0xff;
    }
  }
  return { width: CARD_WIDTH, height: CARD_HEIGHT, data };
}

function runSelfTest() {
  const entries = [1, 2, 3].map((seed) => ({
    id: `synthetic-${seed}`,
    hash: phashRegionPacked(cropRegionA(createSyntheticCard(seed)))
  }));
  const db = buildDb(entries);
  const bytes = writeDb(db);
  const readBack = readDb(bytes);

  if (readBack.count !== db.count) {
    throw new Error(`count mismatch: ${readBack.count} !== ${db.count}`);
  }
  if (JSON.stringify(readBack.ids) !== JSON.stringify(db.ids)) {
    throw new Error(`ids mismatch: ${JSON.stringify(readBack.ids)} !== ${JSON.stringify(db.ids)}`);
  }
  assertByteEqual("hashes", readBack.hashes, db.hashes);
  assertByteEqual("rewritten DB", writeDb(readBack), bytes);

  console.log(`[build-card-hashes] self-test entries: ${readBack.count}`);
  console.log(`[build-card-hashes] self-test bytes: ${bytes.length}`);
  console.log("[build-card-hashes] self-test round trip OK");
}

async function buildResumable(options) {
  const targets = resolveBuildTargets({
    output: options.output,
    manifest: options.manifest,
    liveOutput: DEFAULT_OUTPUT,
    liveManifest: DEFAULT_MANIFEST,
    fresh: options.fresh,
    force: options.force,
    outputExplicit: options.outputExplicit,
    manifestExplicit: options.manifestExplicit
  });
  options.output = targets.output;
  options.manifest = targets.manifest;

  if (!fs.existsSync(options.input)) {
    throw new Error(`Input file not found: ${options.input}`);
  }
  const startedAtMs = Date.now();

  const stats = {
    parsed: 0,
    skippedByFilter: 0,
    hashedNew: 0,
    skippedTransient: 0,
    skippedPermanent: 0
  };
  let existingEntries =
    targets.readExistingOutput && fs.existsSync(options.output) ? entriesFromDb(readDb(new Uint8Array(fs.readFileSync(options.output)))) : [];
  const existingIds = new Set(existingEntries.map((entry) => entry.id));
  let skiplist = readSkiplist(options.skiplist);
  let skiplistDirty = false;
  const imageMap = new Map();
  const planCards = [];

  for await (const card of readScryfallCards(options.input)) {
    stats.parsed += 1;
    if (!shouldIncludeScanPrinting(card)) {
      stats.skippedByFilter += 1;
      continue;
    }

    const frontUrl = getFrontImageUrl(card);
    const backUrl = getBackImageUrl(card);
    imageMap.set(card.id, { frontUrl, backUrl });
    planCards.push({ id: card.id, hasBack: backUrl.length > 0 });
  }

  const cardBackReferencePath = path.join(options.imageDir, CARD_BACK_REFERENCE_NAME);
  const hasCardBackReference = fs.existsSync(cardBackReferencePath);
  const targetIds = planTargetEntryIds(planCards, { hasCardBackReference });
  const parkedIds = Object.entries(skiplist)
    .filter(([, entry]) => entry.parked)
    .map(([id]) => id);
  const missing = diffMissingEntries(targetIds, existingIds, parkedIds, { retryParked: options.retryParked });
  let newEntries = [];
  let lastCheckpoint = null;
  let lastCheckpointHashedNew = -1;
  const sourceSha256 = await hashFileSha256(options.input);

  printProgressReadout({
    phase: "start",
    mode: targets.fresh ? "fresh rebuild" : "resumable live build",
    targetIds,
    existingEntries,
    skiplist,
    stats,
    startedAtMs,
    retryParked: options.retryParked
  });

  async function writeCheckpoint() {
    const merged = mergeEntries(existingEntries, newEntries);
    const db = buildDb(merged);
    const bytes = writeDb(db);
    const manifest = {
      version: VERSION,
      count: db.count,
      sourceSnapshot: {
        path: path.relative(process.cwd(), options.input),
        sha256: sourceSha256
      },
      byteSize: bytes.length,
      generatedAt: new Date().toISOString()
    };

    writeFileAtomic(options.output, bytes);
    writeFileAtomic(options.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileAtomic(options.skiplist, serializeSkiplist(skiplist));

    existingEntries = merged;
    newEntries = [];
    lastCheckpoint = { count: db.count, byteSize: bytes.length };
    lastCheckpointHashedNew = stats.hashedNew;
    skiplistDirty = false;
    return lastCheckpoint;
  }

  async function recordHashedEntry(entry) {
    newEntries.push(entry);
    stats.hashedNew += 1;
    skiplist = applySkiplistOutcome(skiplist, entry.id, "success", { parkThreshold: PARK_THRESHOLD });
    skiplistDirty = true;

    if (stats.hashedNew % CHECKPOINT_EVERY === 0) {
      await writeCheckpoint();
    }

    return evaluateBudget(
      { hashedNew: stats.hashedNew },
      { limit: options.limit, maxMinutes: options.maxMinutes, startedAtMs }
    );
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cardhash-build-"));
  let budgetStopReason = null;
  try {
    if (path.resolve(tempDir) === path.resolve(options.imageDir)) {
      throw new Error(`Transient temp dir must not equal --image-dir: ${tempDir}`);
    }

    for (const id of missing) {
      if (id === CARD_BACK_ID) {
        if (!fs.existsSync(cardBackReferencePath)) {
          stats.skippedPermanent += 1;
          const message = `reference not found at ${cardBackReferencePath}`;
          skiplist = applySkiplistOutcome(skiplist, id, "permanent", { parkThreshold: PARK_THRESHOLD, error: message });
          skiplistDirty = true;
          console.warn(`[build-card-hashes] Skipped ${CARD_BACK_ID}: ${message}`);
          continue;
        }
        let hash;
        try {
          hash = hashCanonicalPng(cardBackReferencePath);
        } catch (error) {
          stats.skippedPermanent += 1;
          skiplist = applySkiplistOutcome(skiplist, id, "permanent", { parkThreshold: PARK_THRESHOLD, error: errorMessage(error) });
          skiplistDirty = true;
          logSkipped("permanent", id, error);
          continue;
        }

        const budget = await recordHashedEntry({ id, hash });
        if (budget.stop) {
          budgetStopReason = budget.reason;
          break;
        }
        continue;
      }

      const isBack = id.endsWith(BACK_FACE_SUFFIX);
      const baseId = isBack ? id.slice(0, -BACK_FACE_SUFFIX.length) : id;
      const urls = imageMap.get(baseId);
      const url = isBack ? urls?.backUrl : urls?.frontUrl;
      const tempFile = path.join(tempDir, `${sanitizeTempName(id)}.png`);

      try {
        const download = await downloadPngWithRetry(url, tempFile, options.rateMs);
        if (!download.ok) {
          if (download.kind === "transient") {
            stats.skippedTransient += 1;
          } else {
            stats.skippedPermanent += 1;
            skiplist = applySkiplistOutcome(skiplist, id, "permanent", {
              parkThreshold: PARK_THRESHOLD,
              error: errorMessage(download.error)
            });
            skiplistDirty = true;
          }
          logSkipped(download.kind, id, download.error);
          continue;
        }

        let hash;
        try {
          hash = hashCanonicalPng(tempFile);
        } catch (error) {
          const kind = classifyFetchFailure(null, error);
          if (kind === "transient") {
            stats.skippedTransient += 1;
          } else {
            stats.skippedPermanent += 1;
            skiplist = applySkiplistOutcome(skiplist, id, "permanent", { parkThreshold: PARK_THRESHOLD, error: errorMessage(error) });
            skiplistDirty = true;
          }
          logSkipped(kind, id, error);
          continue;
        }

        const budget = await recordHashedEntry({ id, hash });
        if (budget.stop) {
          budgetStopReason = budget.reason;
          break;
        }
      } finally {
        fs.rmSync(tempFile, { force: true });
      }
    }

    if (budgetStopReason) {
      console.log(`[build-card-hashes] Budget reached (${budgetStopReason}), stopping after ${stats.hashedNew} entries this run.`);
    }

    if (newEntries.length > 0 || lastCheckpointHashedNew !== stats.hashedNew || skiplistDirty) {
      await writeCheckpoint();
    }

    const finalArtifact = lastCheckpoint ?? { count: existingEntries.length, byteSize: fs.existsSync(options.output) ? fs.statSync(options.output).size : 0 };

    printProgressReadout({
      phase: "end",
      mode: targets.fresh ? "fresh rebuild" : "resumable live build",
      targetIds,
      existingEntries,
      skiplist,
      stats,
      startedAtMs,
      retryParked: options.retryParked
    });

    console.log(`[build-card-hashes] Parsed cards: ${stats.parsed}`);
    console.log(`[build-card-hashes] Skipped by filter: ${stats.skippedByFilter}`);
    console.log(`[build-card-hashes] Hashed new: ${stats.hashedNew}`);
    console.log(`[build-card-hashes] Skipped transient: ${stats.skippedTransient}`);
    console.log(`[build-card-hashes] Skipped permanent: ${stats.skippedPermanent}`);
    console.log(`[build-card-hashes] Parked: ${Object.values(skiplist).filter((entry) => entry.parked).length}`);
    console.log(`[build-card-hashes] Total entries: ${finalArtifact.count}`);
    console.log(`[build-card-hashes] Wrote: ${options.output} (${finalArtifact.byteSize} bytes)`);
    console.log(`[build-card-hashes] Wrote: ${options.manifest}`);
    console.log(`[build-card-hashes] Wrote: ${options.skiplist}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (options.selfTest) {
    runSelfTest();
    return;
  }

  await buildResumable(options);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
