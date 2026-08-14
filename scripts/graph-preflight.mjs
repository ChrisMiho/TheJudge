// Deterministic working-tree resolution for autonomous graph runs.
//
// The graph workflow may auto-commit or auto-stash a dirty launch checkout
// (user decision, 2026-08-14). That is a destructive operation, so the
// decision lives here as a pure, tested function rather than as agent prose.

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

  const secret = files.find((path) =>
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
