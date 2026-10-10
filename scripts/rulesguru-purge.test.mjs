import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { purgeSuite } from "./rulesguru-purge.mjs";

function fixture() {
  const base = mkdtempSync(join(tmpdir(), "purge-suite-"));
  test.after(() => rmSync(base, { recursive: true, force: true }));
  const suiteDir = join(base, "suite");
  mkdirSync(join(suiteDir, "raw"), { recursive: true });
  mkdirSync(join(suiteDir, "cases"));
  writeFileSync(join(suiteDir, "raw", "1.json"), "{}");
  writeFileSync(join(suiteDir, "raw", "2.json"), "{}");
  writeFileSync(join(suiteDir, "cases", "a.case.json"), "{}");
  writeFileSync(join(suiteDir, "import-state.json"), "{}");
  writeFileSync(join(base, "keep.txt"), "not suite data");
  return { base, suiteDir };
}

test("without --yes purge deletes nothing and reports the file count", async () => {
  const { suiteDir } = fixture();
  const result = await purgeSuite({ suiteDir });
  assert.deepEqual(result, { count: 4, deleted: false });
  assert.ok(existsSync(join(suiteDir, "raw", "1.json")));
});

test("with --yes purge deletes the suite folder and nothing else", async () => {
  const { base, suiteDir } = fixture();
  const result = await purgeSuite({ suiteDir, yes: true });
  assert.deepEqual(result, { count: 4, deleted: true });
  assert.equal(existsSync(suiteDir), false);
  assert.ok(existsSync(join(base, "keep.txt")));
});

test("purge of a folder that does not exist is a no-op", async () => {
  const { base } = fixture();
  assert.deepEqual(await purgeSuite({ suiteDir: join(base, "never-made"), yes: true }), { count: 0, deleted: false });
});

test("purge refuses any target that is not exactly the suite folder", async () => {
  const { base, suiteDir } = fixture();
  await assert.rejects(() => purgeSuite({ suiteDir, target: base, yes: true }), /not (exactly )?the suite folder/);
  await assert.rejects(() => purgeSuite({ suiteDir, target: join(suiteDir, "raw"), yes: true }), /not exactly the suite folder/);
  await assert.rejects(() => purgeSuite({ suiteDir, target: join(suiteDir, ".."), yes: true }), /not (exactly )?the suite folder/);
  assert.ok(existsSync(join(base, "keep.txt")));
  assert.ok(existsSync(join(suiteDir, "raw", "1.json")));
});

test("purge refuses when the suite folder is a symbolic link", async () => {
  const { base } = fixture();
  const real = join(base, "real");
  mkdirSync(real);
  writeFileSync(join(real, "x.json"), "{}");
  const link = join(base, "link");
  symlinkSync(real, link);
  await assert.rejects(() => purgeSuite({ suiteDir: link, yes: true }));
  assert.ok(existsSync(join(real, "x.json")));
});
