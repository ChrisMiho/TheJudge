#!/usr/bin/env bash
# Mirrors the canonical skill tree into each runtime's discovery path.
# Canonical source is .cursor/skills — edit there and nowhere else.
#
# Wire up as:  "skills:ai-sync": "bash scripts/sync-agent-skills.sh"
#
# Verify after running:
#   diff -rq .cursor/skills .claude/skills   # expect no output
#   diff -rq .cursor/skills .agents/skills   # expect no output

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/.cursor/skills"

# Confirm these paths against your runtimes' current documentation; they change.
DESTS=(
  "$ROOT/.agents/skills"   # Codex
  "$ROOT/.claude/skills"   # Claude Code
)

for dest in "${DESTS[@]}"; do
  mkdir -p "$dest"
  # --delete keeps the mirror honest: a skill removed from the canonical tree
  # disappears everywhere, instead of lingering as ghost behavior in one runtime.
  rsync -a --delete "$SRC/" "$dest/"
done

echo "Synced $SRC -> ${DESTS[*]} (plain mirror)"
