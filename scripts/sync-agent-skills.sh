#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.cursor/skills"
for DEST in .agents/skills .claude/skills; do
  mkdir -p "$ROOT/$DEST"
  rsync -a --delete "$SRC/" "$ROOT/$DEST/"
done
echo "Synced $SRC → .agents/skills/ and .claude/skills/"
