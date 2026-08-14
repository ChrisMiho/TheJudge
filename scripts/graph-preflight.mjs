// Deterministic working-tree resolution for autonomous graph runs.
//
// The graph workflow may auto-commit or auto-stash a dirty launch checkout
// (user decision, 2026-08-14). That is a destructive operation, so the
// decision lives here as a pure, tested function rather than as agent prose.

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const DEFAULT_THRESHOLDS = { maxFiles: 10, maxLines: 200 };

export const SECRET_PATTERNS = [
  /(^|\/)\.secrets\//,
  /(^|\/)\.env($|\.)/,
  /\.pem$/,
  /\.key$/,
  /(^|\/)id_rsa($|\.)/,
];

export function classifyWorkingTree(entries, thresholds = DEFAULT_THRESHOLDS) {
  const files = entries.map((entry) => entry.path);
  const fileCount = entries.length;
  const changedLines = entries.reduce(
    (total, entry) => total + entry.changedLines,
    0,
  );

  const base = { files, fileCount, changedLines };

  if (fileCount === 0) {
    return { ...base, action: "clean", reason: "working tree is clean" };
  }

  // A renamed entry's `path` is only the destination. Check the source too —
  // a file moving *out of* a secret-bearing location is equally sensitive.
  const secretCandidates = entries.flatMap((entry) =>
    entry.renamedFrom ? [entry.path, entry.renamedFrom] : [entry.path],
  );
  const secret = secretCandidates.find((path) =>
    SECRET_PATTERNS.some((pattern) => pattern.test(path)),
  );
  if (secret) {
    return {
      ...base,
      action: "blocked",
      reason: `refusing to auto-resolve a working tree containing a secret-bearing path: ${secret}`,
    };
  }

  if (fileCount > thresholds.maxFiles) {
    return {
      ...base,
      action: "stash",
      reason: `file count ${fileCount} exceeds ${thresholds.maxFiles}`,
    };
  }

  if (changedLines > thresholds.maxLines) {
    return {
      ...base,
      action: "stash",
      reason: `changed lines ${changedLines} exceeds ${thresholds.maxLines}`,
    };
  }

  return {
    ...base,
    action: "commit",
    reason: `${fileCount} file(s), ${changedLines} changed line(s) is within auto-commit thresholds`,
  };
}

const AUTO_COMMIT_MESSAGE =
  "chore(graph): auto-commit working tree before graph run";

// `git diff --numstat` compacts a rename into one line instead of reporting
// the source and destination paths plainly. It can appear as:
//   {old => new}/suffix        (empty common prefix)
//   prefix/{old => new}        (empty common suffix)
//   prefix/{old => new}/suffix (both a common prefix and suffix)
//   old => new                 (no common prefix or suffix at all)
// Expand any of these back into real paths so downstream consumers (the
// secret check in particular) never see the compact/braced form.
function normalizeRenamePath(rawPath) {
  const braceMatch = rawPath.match(/^(.*)\{(.*) => (.*)\}(.*)$/);
  if (braceMatch) {
    const [, prefix, oldPart, newPart, suffix] = braceMatch;
    return {
      oldPath: `${prefix}${oldPart}${suffix}`,
      newPath: `${prefix}${newPart}${suffix}`,
    };
  }
  const bareMatch = rawPath.match(/^(.*) => (.*)$/);
  if (bareMatch) {
    const [, oldPath, newPath] = bareMatch;
    return { oldPath, newPath };
  }
  return null;
}

// A file with both staged and unstaged hunks appears once in each numstat
// call. Merge those back into a single entry per physical path so fileCount
// — which directly feeds the maxFiles threshold — isn't inflated.
function mergeByPath(entries) {
  const merged = new Map();
  for (const entry of entries) {
    const existing = merged.get(entry.path);
    if (existing) {
      existing.changedLines += entry.changedLines;
      if (existing.renamedFrom === undefined && entry.renamedFrom !== undefined) {
        existing.renamedFrom = entry.renamedFrom;
      }
    } else {
      merged.set(entry.path, { ...entry });
    }
  }
  return [...merged.values()];
}

export function collectEntries(runGit) {
  const entries = [];

  for (const args of [
    ["diff", "--numstat"],
    ["diff", "--numstat", "--cached"],
  ]) {
    const output = runGit(args);
    for (const line of output.split("\n")) {
      if (!line.trim()) continue;
      const [insertions, deletions, rawPath] = line.split("\t");
      if (!rawPath) continue;
      // Binary files report "-" for both counts.
      const added = insertions === "-" ? 0 : Number(insertions);
      const removed = deletions === "-" ? 0 : Number(deletions);
      const changedLines = added + removed;
      const rename = normalizeRenamePath(rawPath);
      if (rename) {
        entries.push({
          path: rename.newPath,
          changedLines,
          renamedFrom: rename.oldPath,
        });
      } else {
        entries.push({ path: rawPath, changedLines });
      }
    }
  }

  const untracked = runGit(["ls-files", "--others", "--exclude-standard"]);
  for (const line of untracked.split("\n")) {
    if (!line.trim()) continue;
    entries.push({ path: line.trim(), changedLines: 0 });
  }

  return mergeByPath(entries);
}

export function planActions(classification, { branch, runId }) {
  if (classification.action === "blocked") return [];

  const commands = [];

  if (classification.action === "commit") {
    commands.push("git add -A");
    commands.push(`git commit -m ${JSON.stringify(AUTO_COMMIT_MESSAGE)}`);
  }

  if (classification.action === "stash") {
    commands.push(
      `git stash push -u -m ${JSON.stringify(`graph-preflight/${runId}`)}`,
    );
  }

  commands.push(`git switch -c ${branch}`);
  commands.push(`git push -u origin ${branch}`);

  return commands;
}

function parseArgs(argv) {
  const get = (name) => {
    const index = argv.indexOf(name);
    return index !== -1 ? argv[index + 1] : null;
  };
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return {
    branch: get("--branch"),
    runId: get("--run-id") ?? `graph-${stamp}-1`,
    dryRun: argv.includes("--dry-run"),
    thresholds: {
      maxFiles: Number(get("--max-files") ?? DEFAULT_THRESHOLDS.maxFiles),
      maxLines: Number(get("--max-lines") ?? DEFAULT_THRESHOLDS.maxLines),
    },
  };
}

function main(argv) {
  const options = parseArgs(argv);
  if (!options.branch) {
    console.error("graph-preflight: --branch <name> is required");
    process.exit(2);
  }

  const runGit = (args) =>
    execFileSync("git", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });

  const entries = collectEntries(runGit);
  const classification = classifyWorkingTree(entries, options.thresholds);
  const commands = planActions(classification, options);

  console.log(`action: ${classification.action}`);
  console.log(`reason: ${classification.reason}`);
  console.log(`files: ${classification.fileCount}`);
  console.log(`changed lines: ${classification.changedLines}`);
  console.log(`run id: ${options.runId}`);
  console.log("planned commands:");
  for (const command of commands) console.log(`  ${command}`);

  if (classification.action === "blocked") {
    console.error(
      "graph-preflight: blocked — resolve the listed paths manually before a graph run",
    );
    process.exit(1);
  }

  if (options.dryRun) {
    console.log("dry run: no commands executed");
    return;
  }

  for (const command of commands) {
    execFileSync("git", parseCommandArgs(command), { stdio: "inherit" });
  }
}

export function parseCommandArgs(command) {
  // Splits `git a b "c d"` into ["a", "b", "c d"], dropping the leading `git`.
  const matches = command.match(/"(?:[^"\\]|\\.)*"|\S+/g) ?? [];
  return matches
    .slice(1)
    .map((token) =>
      token.startsWith('"') ? JSON.parse(token) : token,
    );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
