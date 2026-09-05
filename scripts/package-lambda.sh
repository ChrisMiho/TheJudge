#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
package_root="$repo_root/.tmp/lambda-package"
artifact_dir="$repo_root/dist"
artifact_path="$artifact_dir/lambda.zip"

rm -rf "$package_root"
# `zip` appends to an existing archive rather than replacing it, so a stale
# artifact silently doubles the package on a rebuild.
rm -f "$artifact_path"
mkdir -p "$package_root/apps/backend" "$artifact_dir"

# REQ-181: the local embedding model (bundled, not fetched at request time —
# SCOPE-B) must already be cached before this copy, or the package ships
# without it and the `local` provider fails on every cold start. Warm it once
# here if it is not already warm from a prior `npm run data:build`. Uses the
# dedicated cache-warm script, not `npm run data:build-rule-embeddings` —
# that script's job is rebuilding the committed `gameRulesRuleEmbeddings.json`
# artifact, a tracked file this deploy-time step must never rewrite (review
# loop 1, cheap finding #8).
if [ ! -f "$repo_root/apps/backend/data/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx" ]; then
  echo "Warming local embedding model cache..." >&2
  (cd "$repo_root" && npx tsx scripts/warm-embedding-model-cache.mjs >&2) || true
fi

cp "$repo_root/package.json" "$package_root/package.json"
cp "$repo_root/package-lock.json" "$package_root/package-lock.json"
cp "$repo_root/apps/backend/package.json" "$package_root/apps/backend/package.json"
cp -R "$repo_root/apps/backend/dist" "$package_root/apps/backend/dist"
cp -R "$repo_root/apps/backend/data" "$package_root/apps/backend/data"

(
  cd "$package_root"
  # onnxruntime-node's postinstall (`node ./script/install`) downloads the CUDA
  # build of the runtime on linux/x64 unless told to skip — several hundred MB
  # the Lambda CPU runtime never loads. The 2026-09-05 deploy of 0243e83 was
  # rejected by AWS ("Unzipped size must be smaller than 262144000 bytes") even
  # though the budget test passed: the 130MB non-data reserve was measured on
  # macOS, where that download never happens. Both spellings are set because
  # the installer reads the npm config form and the plain env form.
  ONNXRUNTIME_NODE_INSTALL_CUDA=skip \
  npm_config_onnxruntime_node_install_cuda=skip \
  npm ci --omit=dev --workspace apps/backend --include-workspace-root=false >&2

  # REQ-181/NFR-017: `onnxruntime-node` bundles all three platforms' native
  # binaries directly in its published package (not npm optionalDependencies),
  # so every `npm ci` pulls Windows and macOS binaries the Lambda runtime
  # (linux/x64) never loads — measured 2026-09-05: ~176MB of the ~283MB the
  # package installs. Pruning them here is what makes the re-measured
  # NON_DATA_RESERVE in scripts/lambda-package-budget.test.mjs true in the
  # real deployed artifact, not just in the test's arithmetic.
  onnx_platform_dir="node_modules/onnxruntime-node/bin/napi-v6"
  if [ -d "$onnx_platform_dir" ]; then
    rm -rf "$onnx_platform_dir/darwin" "$onnx_platform_dir/win32" "$onnx_platform_dir/linux/arm64"
  fi

  # NFR-017: measure what will actually be uploaded, in real file bytes (what
  # AWS counts), and refuse to build an artifact that Lambda will reject. The
  # per-entry breakdown is printed so a failure in CI names the culprit instead
  # of only the total; symlinks are skipped because `zip -y` stores them as
  # links, not as their targets.
  unzipped_bytes="$(node -e '
const fs = require("fs"), path = require("path")
const per = {}
let total = 0
function walk(dir, key) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) walk(full, key)
    else { const size = fs.statSync(full).size; total += size; per[key] = (per[key] || 0) + size }
  }
}
for (const top of ["apps", "package.json", "package-lock.json"]) {
  const stat = fs.lstatSync(top)
  if (stat.isDirectory()) walk(top, top)
  else { total += stat.size; per[top] = stat.size }
}
for (const entry of fs.readdirSync("node_modules", { withFileTypes: true })) {
  const full = path.join("node_modules", entry.name)
  if (entry.isSymbolicLink() || !entry.isDirectory()) continue
  if (entry.name.startsWith("@")) {
    for (const scoped of fs.readdirSync(full, { withFileTypes: true })) {
      const scopedFull = path.join(full, scoped.name)
      if (scoped.isSymbolicLink() || !scoped.isDirectory()) continue
      walk(scopedFull, "node_modules/" + entry.name + "/" + scoped.name)
    }
  } else walk(full, "node_modules/" + entry.name)
}
const mb = (bytes) => (bytes / 1048576).toFixed(1) + "MB"
console.error("lambda package unzipped: " + mb(total) + " (Lambda quota 250.0MB)")
for (const [key, size] of Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.error("  " + mb(size).padStart(9) + "  " + key)
console.log(total)
')"
  lambda_quota_bytes=$((250 * 1024 * 1024))
  if [ "$unzipped_bytes" -gt "$lambda_quota_bytes" ]; then
    echo "lambda package is $unzipped_bytes bytes unzipped, over Lambda's $lambda_quota_bytes-byte quota; the breakdown above names what grew (NFR-017, scripts/lambda-package-budget.test.mjs)." >&2
    exit 1
  fi

  if command -v zip >/dev/null 2>&1; then
    # `-y` stores symlinks as symlinks instead of following them. `npm ci` links
    # `node_modules/@thejudge/backend` back to `apps/backend`, so following it
    # wrote every data file into the archive a second time — 181.6MB where 93.2MB
    # was the real content, and the duplicate is what pushed the upload past
    # Lambda's request limit.
    zip -qry "$artifact_path" apps node_modules package.json package-lock.json
  elif command -v powershell.exe >/dev/null 2>&1; then
    artifact_path_win="$(cygpath -w "$artifact_path")"
    package_root_win="$(cygpath -w "$package_root")"
    powershell.exe -NoProfile -Command "\$ErrorActionPreference = 'Stop'; Compress-Archive -Path @('$package_root_win\\apps', '$package_root_win\\node_modules', '$package_root_win\\package.json', '$package_root_win\\package-lock.json') -DestinationPath '$artifact_path_win' -Force"
  else
    echo "zip is required to package the Lambda artifact." >&2
    exit 1
  fi
)

echo "$artifact_path"
