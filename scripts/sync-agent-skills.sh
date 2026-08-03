#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.cursor/skills"

mkdir -p "$ROOT/.agents/skills"
rsync -a --delete "$SRC/" "$ROOT/.agents/skills/"

mkdir -p "$ROOT/.claude/skills"
rsync -a --delete "$SRC/" "$ROOT/.claude/skills/"

echo "Synced $SRC → .agents/skills/ and .claude/skills/ (plain mirror)"
