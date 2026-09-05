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
# here if it is not already warm from a prior `npm run data:build`.
if [ ! -f "$repo_root/apps/backend/data/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx" ]; then
  echo "Warming local embedding model cache..." >&2
  (cd "$repo_root" && npm run data:build-rule-embeddings >&2) || true
fi

cp "$repo_root/package.json" "$package_root/package.json"
cp "$repo_root/package-lock.json" "$package_root/package-lock.json"
cp "$repo_root/apps/backend/package.json" "$package_root/apps/backend/package.json"
cp -R "$repo_root/apps/backend/dist" "$package_root/apps/backend/dist"
cp -R "$repo_root/apps/backend/data" "$package_root/apps/backend/data"

(
  cd "$package_root"
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
