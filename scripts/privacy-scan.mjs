// Privacy scan: does any tracked file hold text from the local practice suite?
//
// Reads every suite case's question and answer from the suite folder (the launch checkout's
// git-ignored copy), then scans every tracked file for any of that text. Prints counts only:
// never a question, an answer, an id, a card list or a file's matched text. Expected result: 0 matches.
//
// Usage: node scripts/privacy-scan.mjs [--suite <dir>]
// Exit status 1 when any match is found, 2 when the suite folder cannot be read.
import { readdirSync, readFileSync, existsSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { mainCheckoutSuiteDir } from "./lib/practice-suite.mjs";

/** A suite text shorter than this is a label, not a question or an answer; it would match by chance. */
export const MIN_TEXT_LENGTH = 30;
const GRAM = 6;

const normalize = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** The question and answer text of every case file in `<suiteDir>/cases`, normalised. */
export function collectSuiteTexts(suiteDir) {
  const casesDir = join(suiteDir, "cases");
  if (!existsSync(casesDir)) throw new Error(`Suite cases folder not found: ${casesDir}`);
  const texts = new Set();
  for (const file of readdirSync(casesDir)) {
    if (!file.endsWith(".case.json")) continue;
    const entry = JSON.parse(readFileSync(join(casesDir, file), "utf8"));
    for (const raw of [entry.question, entry.expected?.answer]) {
      if (typeof raw !== "string") continue;
      const text = normalize(raw);
      if (text.length >= MIN_TEXT_LENGTH) texts.add(text);
    }
  }
  return [...texts];
}

/** Builds a lookup from each text's first six words to the texts that start with them. */
export function buildSuiteIndex(texts) {
  const index = new Map();
  for (const text of texts) {
    const words = text.split(" ");
    if (words.length < GRAM) continue;
    const key = words.slice(0, GRAM).join(" ");
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(words);
  }
  return index;
}

/** Counts suite texts found whole inside `fileText`. */
export function countMatchesInText(fileText, index) {
  const words = normalize(fileText).split(" ");
  let count = 0;
  for (let i = 0; i + GRAM <= words.length; i++) {
    const candidates = index.get(words.slice(i, i + GRAM).join(" "));
    if (!candidates) continue;
    for (const target of candidates) {
      if (i + target.length > words.length) continue;
      let same = true;
      for (let k = GRAM; k < target.length; k++) {
        if (words[i + k] !== target[k]) {
          same = false;
          break;
        }
      }
      if (same) count++;
    }
  }
  return count;
}

/** Scans the given files; returns { filesScanned, matches, filesWithMatches } and nothing else. */
export function scanFiles(files, index, readText = (file) => readFileSync(file)) {
  let filesScanned = 0;
  let matches = 0;
  let filesWithMatches = 0;
  for (const file of files) {
    let buffer;
    try {
      buffer = readText(file);
    } catch {
      continue;
    }
    if (typeof buffer !== "string" && buffer.includes(0)) continue; // binary
    const text = typeof buffer === "string" ? buffer : buffer.toString("utf8");
    filesScanned++;
    const found = countMatchesInText(text, index);
    if (found > 0) {
      matches += found;
      filesWithMatches++;
    }
  }
  return { filesScanned, matches, filesWithMatches };
}

export function trackedFiles(cwd) {
  const result = spawnSync("git", ["ls-files", "-z"], { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0) throw new Error("git ls-files failed");
  return result.stdout.split("\0").filter(Boolean);
}

async function main() {
  const args = process.argv.slice(2);
  const suiteDir = args.includes("--suite") ? args[args.indexOf("--suite") + 1] : mainCheckoutSuiteDir();
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  let texts;
  try {
    texts = collectSuiteTexts(suiteDir);
  } catch (error) {
    console.error(`privacy-scan: ${error.message}`);
    process.exitCode = 2;
    return;
  }
  const index = buildSuiteIndex(texts);
  const files = trackedFiles(repoRoot).filter((file) => existsSync(join(repoRoot, file)));
  const { filesScanned, matches, filesWithMatches } = scanFiles(files, index, (file) => readFileSync(join(repoRoot, file)));
  console.log(`privacy-scan: ${texts.length} suite texts, ${filesScanned} tracked files scanned, ${matches} matches in ${filesWithMatches} files`);
  if (matches > 0) process.exitCode = 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  await main();
}
