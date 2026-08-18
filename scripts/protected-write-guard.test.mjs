import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { PROTECTED_PATH_LITERALS } from "./lib/protected-paths.mjs";

// The protected set has three possible writers — the agent's Edit/Write tools,
// `node scripts/*`, and raw Bash. This guard covers the second one, and only
// that one. Its subject is protected-path writes, not all writes: the eleven
// scripts that write to `data/`, `.tmp/`, and temp dirs are untouched by it, and
// refactoring them through the helper is an explicit non-goal.
//
// Two limits, stated rather than assumed:
//
// 1. It matches path *literals*. A protected path assembled at runtime evades
//    it. That is a known ceiling, not a bug to fix by guessing.
// 2. `*.test.mjs` files are out of scan scope. A graph run does not execute
//    them, and `graph-preflight.test.mjs` legitimately pairs temp-dir writes
//    with `.secrets/` fixture strings. That is a scope boundary, not a second
//    exemption.

const SCRIPTS_DIR = new URL("./", import.meta.url);

// Adding an entry here is a reviewable act, not an accident.
const PROTECTED_WRITE_EXEMPTIONS = [
  {
    file: "scripts/lib/protected-paths.mjs",
    why: "the helper itself; mirrorSkillTrees() is the single declared protected-write"
  }
];

// Anchored as calls, never as substrings. This is load-bearing: `SIGTERM` and
// `platform` both contain `rm`, and `renameSources` / `renamedFrom` contain
// `rename`. Both of those files also name a protected path, so a substring
// matcher fails two clean scripts on day one — and reads as a dirty tree rather
// than as a wrong regex.
const FS_WRITE_CALL = new RegExp(
  String.raw`(?<![\w$.])(?:fs\.|fsp\.|fsPromises\.)?(?:` +
    [
      "writeFileSync",
      "writeFile",
      "appendFileSync",
      "appendFile",
      "createWriteStream",
      "mkdirSync",
      "mkdir",
      "renameSync",
      "rename",
      "rmSync",
      "rm",
      "cpSync",
      "cp"
    ].join("|") +
    String.raw`)\s*\(`
);

function scriptSources(dir = SCRIPTS_DIR, prefix = "scripts") {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files.push(...scriptSources(new URL(`${entry.name}/`, dir), `${prefix}/${entry.name}`));
      continue;
    }
    if (!entry.name.endsWith(".mjs")) continue;
    if (entry.name.endsWith(".test.mjs")) continue;
    files.push({
      file: `${prefix}/${entry.name}`,
      source: readFileSync(fileURLToPath(new URL(entry.name, dir)), "utf8")
    });
  }
  return files;
}

/** The whole rule, in one place, so a fixture is judged exactly as a real script is. */
export function classify({ file, source }) {
  const literal = PROTECTED_PATH_LITERALS.find((candidate) => source.includes(candidate));
  const write = FS_WRITE_CALL.exec(source);
  const exempt = PROTECTED_WRITE_EXEMPTIONS.some((entry) => entry.file === file);
  return {
    file,
    literal: literal ?? null,
    write: write?.[0] ?? null,
    offending: Boolean(literal) && Boolean(write) && !exempt
  };
}

test("no script writes to a protected path outside the helper", () => {
  const offenders = scriptSources()
    .map(classify)
    .filter((result) => result.offending)
    .map((result) => `${result.file} (${result.write.trim()} + "${result.literal}")`);

  assert.deepEqual(
    offenders,
    [],
    "These scripts pair an fs write call with a protected-path literal. Route " +
      "the write through mirrorSkillTrees() in scripts/lib/protected-paths.mjs, " +
      "or declare a deliberate entry in PROTECTED_WRITE_EXEMPTIONS."
  );
});

test("the exemption list holds exactly one entry", () => {
  assert.equal(
    PROTECTED_WRITE_EXEMPTIONS.length,
    1,
    "the helper is the single declared protected-write; a second entry needs review"
  );
  assert.equal(PROTECTED_WRITE_EXEMPTIONS[0].file, "scripts/lib/protected-paths.mjs");
});

test("call-form matching passes dev.mjs and graph-preflight.mjs", () => {
  // Named explicitly rather than left to the suite being green: these two are
  // exactly what a substring matcher gets wrong.
  const sources = scriptSources();
  for (const name of ["scripts/dev.mjs", "scripts/graph-preflight.mjs"]) {
    const entry = sources.find((candidate) => candidate.file === name);
    assert.ok(entry, `${name} must be in scan scope`);
    const result = classify(entry);
    assert.ok(result.literal, `${name} is only an interesting case if it names a protected path`);
    assert.equal(result.write, null, `${name} performs no fs write call — a substring matcher says it does`);
    assert.equal(result.offending, false);
  }
});

test("a substring matcher would have failed those two, so the anchoring matters", () => {
  const sources = scriptSources();
  const substringTokens = /\b(?:writeFile|appendFile|createWriteStream|mkdir|rename|rm|cp)/;
  const wouldFail = sources
    .filter(({ file }) => ["scripts/dev.mjs", "scripts/graph-preflight.mjs"].includes(file))
    .filter(({ source }) => new RegExp(substringTokens.source.replace(/\\b/, "")).test(source));

  assert.equal(
    wouldFail.length,
    2,
    "if these stop containing the colliding substrings, this guard's anchoring note is stale"
  );
});

test("a planted protected-path writer is caught", () => {
  const planted = {
    file: "scripts/planted-offender.mjs",
    source: [
      'import { writeFile } from "node:fs/promises";',
      'await writeFile(".claude/graph-profile.json", "{}");'
    ].join("\n")
  };
  const result = classify(planted);
  assert.equal(result.offending, true, "the guard must catch a direct protected-path write");
  assert.equal(result.literal, ".claude/graph-profile.json");
});

test("reading a protected path, or writing a non-protected one, stays legal", () => {
  const readsOnly = classify({
    file: "scripts/reads-only.mjs",
    source: 'const raw = readFileSync(".secrets/openai-dev.env", "utf8");'
  });
  assert.equal(readsOnly.offending, false);

  const writesElsewhere = classify({
    file: "scripts/writes-data.mjs",
    source: 'await writeFile("apps/frontend/public/data/cardMetadata.json", "{}");'
  });
  assert.equal(writesElsewhere.offending, false);
});
