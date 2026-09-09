import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

import {
  createBulkDownloadTargets,
  createJsonlToJsonArrayTransform,
  runHeadlineBulkDownloads
} from "./refresh-scryfall-data.mjs";

const silent = { log() {} };

// ---- createBulkDownloadTargets: URI selection (A1) ----

test("createBulkDownloadTargets: prefers jsonl_download_uri and reports compressed_size", () => {
  const payload = {
    data: [
      { type: "default_cards", jsonl_download_uri: "https://x/default.jsonl.gz", compressed_size: 100, updated_at: "t" },
      { type: "rulings", jsonl_download_uri: "https://x/rulings.jsonl.gz" }
    ]
  };
  const targets = createBulkDownloadTargets(payload);
  assert.equal(targets[0].downloadUrl, "https://x/default.jsonl.gz");
  assert.equal(targets[0].isJsonlGz, true);
  assert.equal(targets[0].estimatedSize, 100);
  assert.equal(targets[1].downloadUrl, "https://x/rulings.jsonl.gz");
});

test("createBulkDownloadTargets: falls back to a legacy download_uri when jsonl is absent", () => {
  const payload = {
    data: [
      { type: "default_cards", download_uri: "https://x/default.json", size: 50 },
      { type: "rulings", download_uri: "https://x/rulings.json" }
    ]
  };
  const targets = createBulkDownloadTargets(payload);
  assert.equal(targets[0].downloadUrl, "https://x/default.json");
  assert.equal(targets[0].isJsonlGz, false);
  assert.equal(targets[0].estimatedSize, 50);
});

test("createBulkDownloadTargets: throws only when neither URI is present", () => {
  const payload = {
    data: [
      { type: "default_cards", name: "Default Cards" },
      { type: "rulings", jsonl_download_uri: "https://x/rulings.jsonl.gz" }
    ]
  };
  assert.throws(() => createBulkDownloadTargets(payload), /Could not find default_cards download URI/);
});

// ---- createJsonlToJsonArrayTransform (A2) ----

async function runTransform(text) {
  const t = createJsonlToJsonArrayTransform();
  const chunks = [];
  const collected = (async () => {
    for await (const c of t) chunks.push(Buffer.from(c));
  })();
  Readable.from([Buffer.from(text, "utf8")]).pipe(t);
  await collected;
  return Buffer.concat(chunks).toString("utf8");
}

test("jsonlToJsonArray: converts multi-line JSONL into a valid JSON array, skipping blank lines", async () => {
  const out = await runTransform('{"id":1}\n{"id":2}\n\n{"id":3}\n');
  assert.deepEqual(JSON.parse(out), [{ id: 1 }, { id: 2 }, { id: 3 }]);
});

test("jsonlToJsonArray: empty input yields an empty array", async () => {
  assert.equal(await runTransform(""), "[]");
});

test("jsonlToJsonArray: a final line without a trailing newline is still emitted", async () => {
  const out = await runTransform('{"a":1}\n{"b":2}');
  assert.deepEqual(JSON.parse(out), [{ a: 1 }, { b: 2 }]);
});

test("jsonlToJsonArray: a line split across chunks is reassembled", async () => {
  const t = createJsonlToJsonArrayTransform();
  const chunks = [];
  const collected = (async () => {
    for await (const c of t) chunks.push(Buffer.from(c));
  })();
  t.write('{"a":1}\n{"b":');
  t.write("2}\n");
  t.end();
  await collected;
  assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString("utf8")), [{ a: 1 }, { b: 2 }]);
});

// ---- runHeadlineBulkDownloads: fail-loud (B) ----

test("runHeadlineBulkDownloads: a failed target download rejects and does not swallow (fail-loud)", async () => {
  const targets = [
    { label: "default_cards", outputPath: "/x/default.json", updatedAt: "t", estimatedSize: null },
    { label: "rulings", outputPath: "/x/rulings.json", updatedAt: "t", estimatedSize: null }
  ];
  await assert.rejects(
    runHeadlineBulkDownloads({
      fetchTargets: async () => targets,
      downloadTarget: async (t) => {
        if (t.label === "default_cards") throw new Error("boom");
      },
      sizeOf: () => 10,
      logger: silent
    }),
    /boom/
  );
});

test("runHeadlineBulkDownloads: a metadata fetch failure rejects (fail-loud)", async () => {
  await assert.rejects(
    runHeadlineBulkDownloads({
      fetchTargets: async () => {
        throw new Error("meta down");
      },
      logger: silent
    }),
    /meta down/
  );
});

test("runHeadlineBulkDownloads: all targets succeed returns the download count", async () => {
  const targets = [
    { label: "default_cards", outputPath: "/x/d.json", updatedAt: "t", estimatedSize: 100 },
    { label: "rulings", outputPath: "/x/r.json", updatedAt: "t", estimatedSize: null }
  ];
  let calls = 0;
  const n = await runHeadlineBulkDownloads({
    fetchTargets: async () => targets,
    downloadTarget: async () => {
      calls += 1;
    },
    sizeOf: () => 10,
    logger: silent
  });
  assert.equal(n, 2);
  assert.equal(calls, 2);
});
