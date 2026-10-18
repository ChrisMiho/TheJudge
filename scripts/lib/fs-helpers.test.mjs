import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { ensureParentDirectory, escapeRegExp, formatBytes, writeWhole } from "./fs-helpers.mjs";
import { makeTempDir } from "./temp-dir.mjs";

test("ensureParentDirectory creates every missing parent folder and is safe to repeat", () => {
  const root = makeTempDir("fs-helpers-");
  const target = join(root, "a", "b", "file.json");
  ensureParentDirectory(target);
  assert.ok(existsSync(join(root, "a", "b")));
  assert.ok(!existsSync(target));
  ensureParentDirectory(target);
  assert.ok(existsSync(join(root, "a", "b")));
});

test("writeWhole writes the full text, replaces an older file, and leaves no temp file behind", async () => {
  const root = makeTempDir("fs-helpers-");
  const target = join(root, "out.txt");
  await writeWhole(target, "first");
  await writeWhole(target, "second");
  assert.equal(readFileSync(target, "utf8"), "second");
  assert.deepEqual(readdirSync(root), ["out.txt"]);
});

test("escapeRegExp makes every regular-expression character match itself", () => {
  const raw = "a.b*c+d?e^f${g}(h)|i[j]\\k";
  assert.ok(new RegExp(`^${escapeRegExp(raw)}$`).test(raw));
  assert.ok(!new RegExp(`^${escapeRegExp("a.b")}$`).test("axb"));
});

test("formatBytes uses three tiers: B, KB, MB", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1023), "1023 B");
  assert.equal(formatBytes(1024), "1.0 KB");
  assert.equal(formatBytes(1024 * 1024 - 1), "1024.0 KB");
  assert.equal(formatBytes(1024 * 1024), "1.0 MB");
  assert.equal(formatBytes(5 * 1024 * 1024 * 1024), "5120.0 MB");
});
