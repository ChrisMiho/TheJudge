// Tests the privacy scan on a synthetic fixture (never on practice-suite text).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSuiteIndex, collectSuiteTexts, countMatchesInText, scanFiles } from "./privacy-scan.mjs";
import { makeTempDir } from "./lib/temp-dir.mjs";

const SYNTHETIC_QUESTION = "Does the purple wizard of imaginary valley untap during the upkeep of the fictional player?";
const SYNTHETIC_ANSWER = "No, the imaginary wizard stays tapped because the fictional stasis effect says so.";

function makeSuite() {
  const dir = makeTempDir("privacy-scan-");
  mkdirSync(join(dir, "cases"));
  writeFileSync(
    join(dir, "cases", "fixture-1.case.json"),
    JSON.stringify({ id: "fixture-1", question: SYNTHETIC_QUESTION, expected: { answer: SYNTHETIC_ANSWER, shortAnswer: "No" } })
  );
  return dir;
}

test("collects the question and answer of each case, ignoring short labels", () => {
  const texts = collectSuiteTexts(makeSuite());
  assert.equal(texts.length, 2);
});

test("finds suite text inside a file regardless of case, punctuation and line breaks", () => {
  const index = buildSuiteIndex(collectSuiteTexts(makeSuite()));
  const leaked = `notes:\n  "${SYNTHETIC_QUESTION.toUpperCase().replace(/ /g, "\n ")}"\n`;
  assert.equal(countMatchesInText(leaked, index), 1);
});

test("reports 0 for unrelated text and for a partial phrase", () => {
  const index = buildSuiteIndex(collectSuiteTexts(makeSuite()));
  assert.equal(countMatchesInText("A rule about untapping permanents during the untap step.", index), 0);
  assert.equal(countMatchesInText("Does the purple wizard of imaginary valley", index), 0);
});

test("scanFiles returns counts only and skips binary files", () => {
  const index = buildSuiteIndex(collectSuiteTexts(makeSuite()));
  const files = new Map([
    ["clean.md", "nothing to see here"],
    ["leak.md", `copied: ${SYNTHETIC_ANSWER}`],
    ["blob.bin", Buffer.from([0, 1, 2, 3])]
  ]);
  const result = scanFiles([...files.keys()], index, (file) => files.get(file));
  assert.deepEqual(result, { filesScanned: 2, matches: 1, filesWithMatches: 1 });
});
