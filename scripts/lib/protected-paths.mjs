/**
 * The protected set, and the single declared write into it.
 *
 * Three mechanisms can write these paths — the agent's `Edit`/`Write` tools,
 * `node scripts/*`, and raw Bash. This file covers the second one only. Its
 * reach is stated, not assumed: `scripts/protected-write-guard.test.mjs` fails
 * any non-test script under `scripts/` that pairs an `fs` write call with a
 * protected-path literal, and this file is that guard's one declared exemption.
 *
 * `mirrorSkillTrees()` is the exempted write. Everything else here reads.
 */

import { chmod, cp, mkdir, readdir, rm, stat, utimes } from "node:fs/promises"
import path from "node:path"

/** The mode bits `rsync -a` preserves. */
const PERMISSION_BITS = 0o777

/**
 * Protected paths, repo-relative and POSIX-separated.
 *
 * Glob semantics are the profile's: `**` matches any number of segments, `*`
 * matches within one segment.
 */
export const PROTECTED_PATH_PATTERNS = Object.freeze([
  ".secrets/**",
  "CLAUDE.md",
  ".claude/graph-profile.json",
  ".claude/settings*.json",
  ".claude/skills/thejudge-*/**",
  ".agents/skills/thejudge-*/**"
])

/**
 * The source-text forms a script would use to name a protected path.
 *
 * `scripts/protected-write-guard.test.mjs` scans for these as literals. The
 * skill-tree entry is the bare `thejudge-` skill-name prefix rather than a full
 * tree path, because a script naming a `thejudge-*` skill by name is naming a
 * protected path however it later joins it.
 */
export const PROTECTED_PATH_LITERALS = Object.freeze([
  ".secrets/",
  "CLAUDE.md",
  ".claude/graph-profile.json",
  ".claude/settings",
  "thejudge-"
])

/** The canonical skill tree. Edit here; never hand-edit the mirror. */
export const CANONICAL_SKILL_TREE = ".claude/skills"

/** The mirror Codex reads. Written only by `mirrorSkillTrees()`. */
export const MIRROR_SKILL_TREE = ".agents/skills"

function patternToRegExp(pattern) {
  let source = "^"
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    if (character === "*") {
      if (pattern[index + 1] === "*") {
        source += ".*"
        index += 1
      } else {
        source += "[^/]*"
      }
      continue
    }
    source += character.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
  }
  return new RegExp(`${source}$`)
}

const PROTECTED_PATH_MATCHERS = PROTECTED_PATH_PATTERNS.map(patternToRegExp)

/**
 * Whether a repo-relative path falls inside the protected set.
 *
 * Read-only: callers decide what to do about the answer.
 */
export function isProtectedPath(repoRelativePath) {
  const normalized = repoRelativePath.split(path.sep).join("/").replace(/^\.\//, "")
  return PROTECTED_PATH_MATCHERS.some((matcher) => matcher.test(normalized))
}

async function listTree(root) {
  const entries = new Map()
  async function walk(relative) {
    const absolute = relative === "" ? root : path.join(root, relative)
    const dirents = await readdir(absolute, { withFileTypes: true })
    for (const dirent of dirents) {
      const child = relative === "" ? dirent.name : `${relative}/${dirent.name}`
      if (dirent.isDirectory()) {
        entries.set(child, "directory")
        await walk(child)
      } else {
        entries.set(child, dirent.isSymbolicLink() ? "symlink" : "file")
      }
    }
  }
  await walk("")
  return entries
}

async function pathExists(target) {
  try {
    await stat(target)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

/**
 * The single declared protected-path write.
 *
 * Mirrors the canonical skill tree onto the mirror tree with `rsync -a --delete`
 * semantics: recursive copy preserving mode and mtime, plus deletion of anything
 * in the destination the source no longer has. A skill removed from the
 * canonical tree disappears from the mirror rather than lingering as ghost
 * behavior in the other runtime.
 *
 * Both ends are pinned. The mirror is never a source and the canonical tree is
 * never a destination.
 */
export async function mirrorSkillTrees({ repoRoot } = {}) {
  const root = repoRoot ?? process.cwd()
  const source = path.join(root, CANONICAL_SKILL_TREE)
  const destination = path.join(root, MIRROR_SKILL_TREE)

  if (!(await pathExists(source))) {
    throw new Error(`Canonical skill tree is missing: ${CANONICAL_SKILL_TREE}`)
  }

  await mkdir(destination, { recursive: true })

  const sourceEntries = await listTree(source)
  const destinationEntries = await pathExists(destination)
    ? await listTree(destination)
    : new Map()

  // --delete: drop what the source no longer has, deepest path first so a
  // removed directory is empty by the time it is unlinked.
  const stale = [...destinationEntries.keys()]
    .filter((relative) => !sourceEntries.has(relative))
    .sort((a, b) => b.length - a.length)
  for (const relative of stale) {
    await rm(path.join(destination, relative), { recursive: true, force: true })
  }

  let copied = 0
  for (const [relative, kind] of sourceEntries) {
    const from = path.join(source, relative)
    const to = path.join(destination, relative)
    if (kind === "directory") {
      await mkdir(to, { recursive: true })
      continue
    }
    await cp(from, to, {
      recursive: true,
      force: true,
      preserveTimestamps: true,
      verbatimSymlinks: true
    })
    if (kind === "file") {
      const sourceStat = await stat(from)
      await chmod(to, sourceStat.mode & PERMISSION_BITS)
      await utimes(to, sourceStat.atime, sourceStat.mtime)
      copied += 1
    }
  }

  return {
    source: CANONICAL_SKILL_TREE,
    destination: MIRROR_SKILL_TREE,
    copied,
    deleted: stale.length
  }
}
