import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { slimScanMap, slimScanMapFile } from "./slim-card-scan-map.mjs";

const FULL = {
  "bbb-2": { oracleId: "o2", name: "Second", imageUrl: "https://x/b.jpg?1" },
  "aaa-1": { oracleId: "o1", name: "First", imageUrl: "https://x/a.jpg?2" }
};

test("slimScanMap drops only imageUrl and keeps key order", () => {
  const slim = slimScanMap(FULL);
  assert.deepEqual(Object.keys(slim), ["bbb-2", "aaa-1"]);
  assert.deepEqual(slim["bbb-2"], { oracleId: "o2", name: "Second" });
  assert.deepEqual(slim["aaa-1"], { oracleId: "o1", name: "First" });
});

test("slimScanMapFile writes compact JSON and is idempotent", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slim-scan-map-"));
  const file = path.join(dir, "cardScanMap.json");
  try {
    fs.writeFileSync(file, JSON.stringify(FULL));
    assert.equal(slimScanMapFile(file), 2);
    const first = fs.readFileSync(file, "utf8");
    assert.equal(
      first,
      '{"bbb-2":{"oracleId":"o2","name":"Second"},"aaa-1":{"oracleId":"o1","name":"First"}}'
    );
    slimScanMapFile(file);
    assert.equal(fs.readFileSync(file, "utf8"), first);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
