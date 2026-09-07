// Local OpenAI credentials for explicitly invoked live scripts.
//
// `npm run openai:verify-credentials` has always read the developer's key
// from `.secrets/openai-dev.env` itself, so the owner never exports anything
// by hand; the backend does the same in development through dotenv. This
// helper gives `scripts/eval-answer-quality.mjs` the same behavior, with two
// deliberate differences from the verify script:
//
//   1. The process environment wins. Files only fill in what is unset, so a
//      value exported on purpose (a different key, a different provider) is
//      never silently overridden by a file.
//   2. A linked git worktree falls back to the main checkout. `.secrets/` is
//      gitignored, so a worktree under `.worktrees/` has no copy of its own;
//      the `.git` file in a worktree names the main repository's git dir, and
//      the main checkout root is derived from it.
//
// Read-only by design: it never writes, so `protected-write-guard.test.mjs`
// (which pairs a protected-path literal with an fs write call) has nothing to
// flag here, exactly as for `openai-verify-credentials.mjs`.

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

export const SECRETS_ENV_RELATIVE_PATH = ".secrets/openai-dev.env";
export const BACKEND_ENV_RELATIVE_PATH = "apps/backend/.env";

/** Parse KEY=VAL lines from a dotenv-style file. Missing file → empty object. */
export function parseEnvFile(filePath, { read = readFileSync } = {}) {
  let text;
  try {
    text = read(filePath, "utf8");
  } catch {
    return {};
  }
  const out = {};
  for (const rawLine of String(text).split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

/**
 * The main checkout root when `repoRoot` is a linked worktree, else null.
 *
 * A linked worktree's `.git` is a file reading
 * `gitdir: <main>/.git/worktrees/<name>`; the main root is the parent of that
 * `.git` directory. A regular checkout has a `.git` directory and no fallback.
 */
export function resolveMainCheckoutRoot(repoRoot, { read = readFileSync, stat = statSync } = {}) {
  const dotGit = join(repoRoot, ".git");
  try {
    if (stat(dotGit).isDirectory()) return null;
  } catch {
    return null;
  }
  let pointer;
  try {
    pointer = String(read(dotGit, "utf8"));
  } catch {
    return null;
  }
  const match = /^gitdir:\s*(.+)\s*$/m.exec(pointer);
  if (!match) return null;
  const gitDir = isAbsolute(match[1]) ? match[1] : resolve(repoRoot, match[1]);
  // <main>/.git/worktrees/<name> → <main>
  const worktreesDir = dirname(gitDir);
  const mainGitDir = dirname(worktreesDir);
  if (worktreesDir.endsWith("worktrees") && mainGitDir.endsWith(".git")) return dirname(mainGitDir);
  return null;
}

/**
 * Returns a copy of `env` with OpenAI-related values filled in from the
 * local env files, never overriding a value the environment already carries.
 *
 * Search order for each file: `repoRoot` first, then the main checkout when
 * `repoRoot` is a linked worktree. Within a root, `apps/backend/.env` is read
 * before `.secrets/openai-dev.env`, and the secrets file fills what the
 * backend env left blank. The returned `sources` array names every file that
 * contributed at least one value, for the run's own reporting.
 */
export function loadLocalOpenAiEnv({ repoRoot, env = process.env, exists = existsSync, read = readFileSync, stat = statSync } = {}) {
  const merged = { ...env };
  const sources = [];
  const roots = [repoRoot];
  const mainRoot = resolveMainCheckoutRoot(repoRoot, { read, stat });
  if (mainRoot && mainRoot !== repoRoot) roots.push(mainRoot);

  for (const root of roots) {
    for (const relative of [BACKEND_ENV_RELATIVE_PATH, SECRETS_ENV_RELATIVE_PATH]) {
      const filePath = join(root, relative);
      if (!exists(filePath)) continue;
      const parsed = parseEnvFile(filePath, { read });
      let contributed = false;
      for (const [key, val] of Object.entries(parsed)) {
        if (!val) continue;
        if (merged[key] === undefined || String(merged[key]).trim() === "") {
          merged[key] = val;
          contributed = true;
        }
      }
      if (contributed) sources.push(filePath);
    }
  }

  return { env: merged, sources };
}
