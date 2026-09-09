import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

import { COMBO_SOURCE_MARKER_PATH, performCommanderSpellbookRefresh } from "./refresh-commander-spellbook-data.mjs";
import { hashCardIdentityFile, writeComboSourceMarker } from "./lib/combo-source-marker.mjs";

const bulkDataEndpoint = "https://api.scryfall.com/bulk-data";
const sourceOutputPath = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const rulingsOutputPath = path.resolve("apps/backend/data/scryfall/rulings.json");
const metadataOutputPath = path.resolve("apps/frontend/public/data/cardMetadata.json");
const comprehensiveRulesPageUrl = "https://magic.wizards.com/en/rules";
const comprehensiveRulesOutputPath = path.resolve("apps/backend/data/cr/source.txt");
const tempDownloadPath = `${sourceOutputPath}.tmp`;
const rulingsTempDownloadPath = `${rulingsOutputPath}.tmp`;
const comprehensiveRulesTempDownloadPath = `${comprehensiveRulesOutputPath}.tmp`;
const bulkDownloadConfigs = [
  {
    type: "default_cards",
    label: "default_cards",
    outputPath: sourceOutputPath,
    tempPath: tempDownloadPath
  },
  {
    type: "rulings",
    label: "rulings",
    outputPath: rulingsOutputPath,
    tempPath: rulingsTempDownloadPath
  }
];

export function createScryfallRequestOptions() {
  return {
    headers: {
      Accept: "application/json",
      "User-Agent": "TheJudge/0.0.1 (https://github.com/local/thejudge)"
    }
  };
}

export function createComprehensiveRulesDownloadTarget(downloadUrl) {
  return {
    label: "Comprehensive Rules TXT",
    downloadUrl,
    outputPath: comprehensiveRulesOutputPath,
    tempPath: comprehensiveRulesTempDownloadPath
  };
}

export function shouldRunDataBuildAfterRefresh(successfulDownloads) {
  return successfulDownloads > 0;
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getBulkDataRecords(payload) {
  if (!Array.isArray(payload?.data)) {
    throw new Error("Unexpected Scryfall bulk metadata response shape.");
  }

  return payload.data;
}

export function createBulkDownloadTargets(payload) {
  const records = getBulkDataRecords(payload);

  return bulkDownloadConfigs.map((config) => {
    const record = records.find((entry) => entry?.type === config.type);
    // Scryfall retired the plain-JSON `download_uri` in favor of a gzipped JSONL
    // export exposed as `jsonl_download_uri`. Prefer the JSONL URL; fall back to a
    // legacy `download_uri` only if a record still carries one (forward-safe).
    const downloadUrl = record?.jsonl_download_uri ?? record?.download_uri;
    if (!downloadUrl) {
      throw new Error(`Could not find ${config.type} download URI from Scryfall.`);
    }

    return {
      ...config,
      downloadUrl,
      isJsonlGz: Boolean(record.jsonl_download_uri),
      updatedAt: record.updated_at ?? "unknown",
      estimatedSize:
        typeof record.compressed_size === "number"
          ? record.compressed_size
          : typeof record.size === "number"
            ? record.size
            : null
    };
  });
}

/**
 * Scryfall's `jsonl_download_uri` serves a gzip-compressed JSONL document (one card
 * object per line), served as `application/gzip` with no `Content-Encoding`, so
 * `fetch` yields raw gzip bytes. The downstream builders still consume a single JSON
 * **array** at `default-cards.json` / `rulings.json`, so this transform streams the
 * decompressed JSONL and rewrites it as an array — `[obj,obj,...]` — line by line,
 * never holding the whole ~600MB document as one string. Blank lines are skipped;
 * empty input yields `[]`.
 */
export function createJsonlToJsonArrayTransform() {
  let leftover = "";
  let started = false;

  const emitLine = (line) => {
    const trimmed = line.trim();
    if (trimmed === "") return "";
    const chunk = (started ? "," : "[") + trimmed;
    started = true;
    return chunk;
  };

  return new Transform({
    transform(chunk, _enc, cb) {
      leftover += chunk.toString("utf8");
      let out = "";
      let nl;
      while ((nl = leftover.indexOf("\n")) !== -1) {
        out += emitLine(leftover.slice(0, nl));
        leftover = leftover.slice(nl + 1);
      }
      cb(null, out);
    },
    flush(cb) {
      let out = emitLine(leftover);
      out += started ? "]" : "[]";
      cb(null, out);
    }
  });
}

async function fetchBulkDownloadTargets() {
  const response = await fetch(bulkDataEndpoint, createScryfallRequestOptions());
  if (!response.ok) {
    throw new Error(`Could not fetch Scryfall bulk metadata: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return createBulkDownloadTargets(payload);
}

async function downloadBulkTarget(target) {
  const { downloadUrl, label, outputPath, tempPath, isJsonlGz } = target;
  const response = await fetch(downloadUrl, createScryfallRequestOptions());
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${label}: ${response.status} ${response.statusText}`);
  }

  ensureParentDirectory(outputPath);
  const source = Readable.fromWeb(response.body);
  if (isJsonlGz) {
    // gzip JSONL → decompress → rewrite as the JSON array the builders consume.
    await pipeline(
      source,
      zlib.createGunzip(),
      createJsonlToJsonArrayTransform(),
      fs.createWriteStream(tempPath)
    );
  } else {
    // Legacy plain-JSON `download_uri` (already an array): passthrough.
    await pipeline(source, fs.createWriteStream(tempPath));
  }
  fs.renameSync(tempPath, outputPath);
}

async function downloadTextTarget(target) {
  const { downloadUrl, label, outputPath, tempPath } = target;
  const response = await fetch(downloadUrl, createScryfallRequestOptions());
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${label}: ${response.status} ${response.statusText}`);
  }

  ensureParentDirectory(outputPath);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempPath));
  fs.renameSync(tempPath, outputPath);
}

export function findComprehensiveRulesTxtUrl(pageHtml, baseUrl = comprehensiveRulesPageUrl) {
  const hrefPattern = /href=["']([^"']+\.txt(?:\?[^"']*)?)["']/gi;
  const matches = [...pageHtml.matchAll(hrefPattern)];
  const preferredMatch =
    matches.find((match) => /comprehensive|rules/i.test(match[1])) ??
    matches.find((match) => /magic\.wizards\.com|media\.wizards\.com/i.test(match[1])) ??
    matches[0];

  if (!preferredMatch) {
    throw new Error("Could not find a Comprehensive Rules TXT link on the WotC rules page.");
  }

  return new URL(preferredMatch[1], baseUrl).toString();
}

async function fetchComprehensiveRulesDownloadTarget() {
  const response = await fetch(comprehensiveRulesPageUrl, createScryfallRequestOptions());
  if (!response.ok) {
    throw new Error(`Could not fetch WotC rules page: ${response.status} ${response.statusText}`);
  }

  const pageHtml = await response.text();
  return createComprehensiveRulesDownloadTarget(findComprehensiveRulesTxtUrl(pageHtml));
}

function runDataBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "data:build"], {
      stdio: "inherit",
      shell: true
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm run data:build failed with exit code ${code ?? "unknown"}`));
    });
  });
}

/**
 * Download the headline Scryfall bulk sources (`default_cards`, `rulings`). These
 * are the freshness headline of the weekly refresh, so a failure here is a HARD
 * failure — the caller must not fall through to a build/PR that ships stale prices
 * (fail-loud). Contrast the Comprehensive-Rules and combo steps, which stay
 * graceful because they are not the headline. Effects are injectable for testing;
 * defaults hit the real network.
 */
export async function runHeadlineBulkDownloads({
  fetchTargets = fetchBulkDownloadTargets,
  downloadTarget = downloadBulkTarget,
  sizeOf = (p) => fs.statSync(p).size,
  logger = console
} = {}) {
  logger.log("Fetching Scryfall bulk-data metadata...");
  const targets = await fetchTargets();

  let downloaded = 0;
  for (const target of targets) {
    logger.log(`Found ${target.label} feed (updated: ${target.updatedAt}).`);
    if (target.estimatedSize !== null && target.estimatedSize !== undefined) {
      logger.log(`Estimated ${target.label} source size: ${formatBytes(target.estimatedSize)}.`);
    }
    logger.log(`Downloading ${target.label} to ${target.outputPath}...`);
    // No try/catch: a failed headline download propagates and hard-fails the run.
    await downloadTarget(target);
    downloaded += 1;
    logger.log(`Download complete for ${target.label}: ${formatBytes(sizeOf(target.outputPath))} at ${target.outputPath}.`);
  }
  return downloaded;
}

async function main() {
  // Headline card + rulings bulk: a failure here is a hard failure (fail-loud),
  // so no try/catch — it propagates to the invocation handler, which exits
  // non-zero, and the weekly wrapper then opens no pull request.
  let successfulDownloads = await runHeadlineBulkDownloads();

  try {
    console.log("Fetching WotC Comprehensive Rules TXT target...");
    const target = await fetchComprehensiveRulesDownloadTarget();
    console.log(`Downloading ${target.label} to ${target.outputPath}...`);
    await downloadTextTarget(target);
    successfulDownloads += 1;
    const downloadedBytes = fs.statSync(target.outputPath).size;
    console.log(`Download complete for ${target.label}: ${formatBytes(downloadedBytes)} at ${target.outputPath}.`);
  } catch (error) {
    console.warn(`Warning: skipped WotC Comprehensive Rules download. ${error.message}`);
  }

  // REQ-196: the combo refresh is hash-gated. The card-identity hash — the set of
  // oracle ids in the freshly downloaded card pool — is one half of the gate; the
  // combo refresh computes the template-set hash and decides whether to re-run the
  // throttle-prone Scryfall template expansion or reuse the committed artifacts.
  const cardIdentityHash = await hashCardIdentityFile(sourceOutputPath);

  // DEC-162: invoking `npm run data:refresh` is itself REQ-093's explicit human
  // approval for the Commander Spellbook combo download, exactly as it already is
  // for the two downloads above — no second `--confirm-live-calls` gate here. The
  // standalone `data:refresh-combos` script keeps that flag for direct invocation.
  let comboResult = null;
  try {
    console.log("Refreshing Commander Spellbook combo data...");
    comboResult = await performCommanderSpellbookRefresh({ cardIdentityHash });
    if (comboResult.skipped) {
      console.log("Commander Spellbook combos unchanged; reused committed artifacts.");
    } else {
      successfulDownloads += 1;
      console.log(
        `Commander Spellbook refresh complete: ${comboResult.variantCount} variants, ` +
          `${comboResult.resolvedTemplateCount} templates resolved, ${comboResult.unresolvedTemplateCount} unresolved.`
      );
    }
  } catch (error) {
    console.warn(`Warning: skipped Commander Spellbook combo download. ${error.message}`);
  }

  if (!shouldRunDataBuildAfterRefresh(successfulDownloads)) {
    console.warn("No data downloads succeeded; skipping npm run data:build.");
    return;
  }

  console.log("Running data transforms (npm run data:build)...");
  await runDataBuild();

  // REQ-196: write the combo source marker only after a successful build, so the
  // marker and the committed combo artifacts always agree. A build failure above
  // throws before this line, leaving the marker untouched.
  if (comboResult && !comboResult.skipped && comboResult.cardIdentityHash && comboResult.templateSetHash) {
    writeComboSourceMarker(COMBO_SOURCE_MARKER_PATH, comboResult);
    console.log(`Wrote combo source marker: ${COMBO_SOURCE_MARKER_PATH}`);
  }

  if (!fs.existsSync(metadataOutputPath)) {
    throw new Error(`Expected output metadata was not found: ${metadataOutputPath}`);
  }

  const metadataBytes = fs.statSync(metadataOutputPath).size;
  console.log(`Metadata refresh complete: ${metadataOutputPath} (${formatBytes(metadataBytes)}).`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    for (const target of bulkDownloadConfigs) {
      if (fs.existsSync(target.tempPath)) {
        fs.rmSync(target.tempPath, { force: true });
      }
    }
    if (fs.existsSync(comprehensiveRulesTempDownloadPath)) {
      fs.rmSync(comprehensiveRulesTempDownloadPath, { force: true });
    }
    console.error(error);
    process.exitCode = 1;
  });
}
