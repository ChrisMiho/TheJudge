import { test } from "node:test"
import assert from "node:assert/strict"

import {
  claudeArgs,
  defaultSessionName,
  mainCheckoutRoot,
  resolveSessionName,
  sessionWorktreePath,
  worktreeAddArgs
} from "./graph-session.mjs"

const NOW = new Date(2026, 9, 13, 9, 5)

test("graph-session - defaultSessionName - is a local YYYYMMDD-HHMM stamp", () => {
  assert.equal(defaultSessionName(NOW), "20261013-0905")
})

test("graph-session - resolveSessionName - no name falls back to the stamp", () => {
  assert.deepEqual(resolveSessionName(undefined, NOW), { name: "20261013-0905", error: null })
  assert.deepEqual(resolveSessionName("  ", NOW), { name: "20261013-0905", error: null })
})

test("graph-session - resolveSessionName - a plain name is kept", () => {
  assert.deepEqual(resolveSessionName("card-search"), { name: "card-search", error: null })
})

test("graph-session - resolveSessionName - a leading session- is not doubled", () => {
  assert.equal(resolveSessionName("session-card-search").name, "card-search")
})

test("graph-session - resolveSessionName - unsafe names are refused", () => {
  for (const bad of ["Card", "../escape", "a/b", "-x", "has space", "under_score"]) {
    const result = resolveSessionName(bad)
    assert.equal(result.name, null, bad)
    assert.match(result.error, /not a usable name/, bad)
  }
})

test("graph-session - sessionWorktreePath - lives under .worktrees/", () => {
  assert.equal(sessionWorktreePath("card-search"), ".worktrees/session-card-search")
})

test("graph-session - mainCheckoutRoot - from the main checkout", () => {
  assert.equal(mainCheckoutRoot(".git\n", "/repo"), "/repo")
})

test("graph-session - mainCheckoutRoot - from inside a linked worktree", () => {
  assert.equal(mainCheckoutRoot("/repo/.git\n", "/repo/.worktrees/session-x"), "/repo")
})

test("graph-session - worktreeAddArgs - detached, cut from origin/main", () => {
  assert.deepEqual(worktreeAddArgs(".worktrees/session-x"), [
    "worktree",
    "add",
    "--detach",
    ".worktrees/session-x",
    "origin/main"
  ])
})

test("graph-session - claudeArgs - loads the graph profile", () => {
  assert.deepEqual(claudeArgs(), ["--settings", ".claude/graph-profile.json"])
})
