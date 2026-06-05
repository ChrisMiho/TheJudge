import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

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
    if (!record?.download_uri) {
      throw new Error(`Could not find ${config.type} download URI from Scryfall.`);
    }

    return {
      ...config,
      downloadUrl: record.download_uri,
      updatedAt: record.updated_at ?? "unknown",
      estimatedSize: typeof record.size === "number" ? record.size : null
    };
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
  const { downloadUrl, label, outputPath, tempPath } = target;
  const response = await fetch(downloadUrl, createScryfallRequestOptions());
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${label}: ${response.status} ${response.statusText}`);
  }

  ensureParentDirectory(outputPath);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempPath));
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

async function main() {
  let successfulDownloads = 0;

  console.log("Fetching Scryfall bulk-data metadata...");
  try {
    const targets = await fetchBulkDownloadTargets();

    for (const target of targets) {
      console.log(`Found ${target.label} feed (updated: ${target.updatedAt}).`);
      if (target.estimatedSize !== null) {
        console.log(`Estimated ${target.label} source size: ${formatBytes(target.estimatedSize)}.`);
      }

      try {
        console.log(`Downloading ${target.label} to ${target.outputPath}...`);
        await downloadBulkTarget(target);
        successfulDownloads += 1;
        const downloadedBytes = fs.statSync(target.outputPath).size;
        console.log(`Download complete for ${target.label}: ${formatBytes(downloadedBytes)} at ${target.outputPath}.`);
      } catch (error) {
        console.warn(`Warning: skipped ${target.label} download. ${error.message}`);
      }
    }
  } catch (error) {
    console.warn(`Warning: skipped Scryfall bulk downloads. ${error.message}`);
  }

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

  if (!shouldRunDataBuildAfterRefresh(successfulDownloads)) {
    console.warn("No data downloads succeeded; skipping npm run data:build.");
    return;
  }

  console.log("Running data transforms (npm run data:build)...");
  await runDataBuild();

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
