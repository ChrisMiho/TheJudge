#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.claude/skills"

mkdir -p "$ROOT/.agents/skills"
rsync -a --delete "$SRC/" "$ROOT/.agents/skills/"

echo "Synced $SRC → .agents/skills/ (plain mirror)"
