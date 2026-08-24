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

cp "$repo_root/package.json" "$package_root/package.json"
cp "$repo_root/package-lock.json" "$package_root/package-lock.json"
cp "$repo_root/apps/backend/package.json" "$package_root/apps/backend/package.json"
cp -R "$repo_root/apps/backend/dist" "$package_root/apps/backend/dist"
cp -R "$repo_root/apps/backend/data" "$package_root/apps/backend/data"

(
  cd "$package_root"
  npm ci --omit=dev --workspace apps/backend --include-workspace-root=false >&2
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
