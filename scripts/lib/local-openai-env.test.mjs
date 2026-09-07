import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  BACKEND_ENV_RELATIVE_PATH,
  SECRETS_ENV_RELATIVE_PATH,
  loadLocalOpenAiEnv,
  parseEnvFile,
  resolveMainCheckoutRoot
} from "./local-openai-env.mjs";

// Every root here is a temp dir; the real `.secrets/` is never touched.
function makeRoot() {
  return mkdtempSync(join(tmpdir(), "local-openai-env-"));
}

function writeUnder(root, relative, text) {
  const filePath = join(root, relative);
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, text, "utf8");
  return filePath;
}

test("parseEnvFile reads KEY=VAL lines, strips quotes, skips comments and blanks, and treats a missing file as empty", () => {
  const root = makeRoot();
  try {
    const filePath = writeUnder(root, "x.env", '# comment\n\nA=1\nB="two"\nC=\'three\'\nBAD LINE\n=nokey\n');
    assert.deepEqual(parseEnvFile(filePath), { A: "1", B: "two", C: "three" });
    assert.deepEqual(parseEnvFile(join(root, "missing.env")), {});
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("loadLocalOpenAiEnv fills blanks from apps/backend/.env then .secrets/openai-dev.env, and the process environment always wins", () => {
  const root = makeRoot();
  try {
    mkdirSync(join(root, ".git"));
    writeUnder(root, BACKEND_ENV_RELATIVE_PATH, "OPENAI_MODEL=from-backend\nOPENAI_API_KEY=\n");
    writeUnder(root, SECRETS_ENV_RELATIVE_PATH, "OPENAI_API_KEY=sk-file\nOPENAI_MODEL=from-secrets\n");

    const filled = loadLocalOpenAiEnv({ repoRoot: root, env: {} });
    assert.equal(filled.env.OPENAI_API_KEY, "sk-file");
    assert.equal(filled.env.OPENAI_MODEL, "from-backend", "the first file to set a value keeps it");
    assert.deepEqual(filled.sources, [join(root, BACKEND_ENV_RELATIVE_PATH), join(root, SECRETS_ENV_RELATIVE_PATH)]);

    const exported = loadLocalOpenAiEnv({ repoRoot: root, env: { OPENAI_API_KEY: "sk-exported" } });
    assert.equal(exported.env.OPENAI_API_KEY, "sk-exported", "an exported value is never overridden by a file");
    assert.deepEqual(exported.sources, [join(root, BACKEND_ENV_RELATIVE_PATH)], "only files that contributed are listed");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a linked worktree falls back to the main checkout's files; a regular checkout has no fallback", () => {
  const main = makeRoot();
  try {
    mkdirSync(join(main, ".git", "worktrees", "implement-x"), { recursive: true });
    const worktree = join(main, ".worktrees", "implement-x");
    mkdirSync(worktree, { recursive: true });
    writeFileSync(join(worktree, ".git"), `gitdir: ${join(main, ".git", "worktrees", "implement-x")}\n`, "utf8");
    writeUnder(main, SECRETS_ENV_RELATIVE_PATH, "OPENAI_API_KEY=sk-main\n");

    assert.equal(resolveMainCheckoutRoot(worktree), main);
    assert.equal(resolveMainCheckoutRoot(main), null);
    assert.equal(resolveMainCheckoutRoot(join(main, "nowhere")), null);

    const loaded = loadLocalOpenAiEnv({ repoRoot: worktree, env: {} });
    assert.equal(loaded.env.OPENAI_API_KEY, "sk-main");
    assert.deepEqual(loaded.sources, [join(main, SECRETS_ENV_RELATIVE_PATH)]);

    // A copy inside the worktree takes precedence over the main checkout's.
    writeUnder(worktree, SECRETS_ENV_RELATIVE_PATH, "OPENAI_API_KEY=sk-worktree\n");
    assert.equal(loadLocalOpenAiEnv({ repoRoot: worktree, env: {} }).env.OPENAI_API_KEY, "sk-worktree");
  } finally {
    rmSync(main, { recursive: true, force: true });
  }
});

test("the helper performs no fs write call, so the protected-write guard has nothing to pair with its .secrets/ literal", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("./local-openai-env.mjs", import.meta.url), "utf8");
  assert.match(source, /\.secrets\//);
  assert.doesNotMatch(source, /\b(?:writeFileSync|writeFile|appendFile|appendFileSync|createWriteStream)\b/);
});
