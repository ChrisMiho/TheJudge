#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.cursor/skills"

# Orchestrator-only skills: they drive the `codex` CLI, so they must NOT sync
# into the Codex runtime's own skill path (.agents/skills). Codex uses the plain
# (non-delegated) flavors instead.
CODEX_RUNTIME_EXCLUDES=(--exclude='thejudge-implement-codex/')

# .agents/skills = Codex runtime → apply orchestrator-only excludes.
mkdir -p "$ROOT/.agents/skills"
rsync -a --delete --delete-excluded "${CODEX_RUNTIME_EXCLUDES[@]}" "$SRC/" "$ROOT/.agents/skills/"

# .claude/skills = full mirror of canonical.
mkdir -p "$ROOT/.claude/skills"
rsync -a --delete "$SRC/" "$ROOT/.claude/skills/"

echo "Synced $SRC → .agents/skills/ (codex-delegation flavors excluded) and .claude/skills/"
