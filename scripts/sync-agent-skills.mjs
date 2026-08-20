#!/usr/bin/env node
/**
 * Mirrors the canonical skill tree into Codex's discovery path.
 *
 * `.claude/skills/` is canonical — edit there and nowhere else. The write goes
 * through `mirrorSkillTrees()`, the protected-path helper's single declared
 * protected-write, so the drift guard can cover every other script with no
 * allowlist of script names.
 *
 * Verify after running:
 *   diff -rq .claude/skills .agents/skills   # expect no output
 */

import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  CANONICAL_SKILL_TREE,
  MIRROR_SKILL_TREE,
  mirrorSkillTrees
} from "./lib/protected-paths.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const result = await mirrorSkillTrees({ repoRoot })

console.log(
  `Synced ${path.join(repoRoot, CANONICAL_SKILL_TREE)} → ${MIRROR_SKILL_TREE}/ ` +
    `(plain mirror: ${result.copied} copied, ${result.deleted} deleted)`
)
