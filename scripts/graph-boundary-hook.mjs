#!/usr/bin/env node
/**
 * The `PreToolUse` boundary hook.
 *
 * Reads the hook payload from stdin, asks `boundary-rules.mjs` for a verdict,
 * and speaks the only protocol the harness understands: exit 2 with the reason
 * on stderr denies the call, exit 0 allows it.
 *
 * This file deliberately names no path from the protected set. It performs
 * counter and evidence writes in later slices, and `protected-write-guard.test.mjs`
 * fails any non-test script that pairs an `fs` write call with a protected-path
 * literal. The literals live in the pure rules module; this file does the I/O.
 *
 * It never fails closed. An internal error prints a diagnostic and exits 0,
 * because a hook that denies on its own bugs bricks every session in the
 * repository. A hook that has stopped deciding is caught by the run canary and
 * the between-node heartbeat, not by blocking the user.
 */

import { readFileSync } from "node:fs"
import path from "node:path"

import { RUN_LOCK_PATH, classifyToolCall, isRunActive } from "./lib/boundary-rules.mjs"

const DENY_EXIT_CODE = 2

export function readStdin(stream) {
  return new Promise((resolve, reject) => {
    let raw = ""
    stream.setEncoding("utf8")
    stream.on("data", (chunk) => {
      raw += chunk
    })
    stream.on("end", () => resolve(raw))
    stream.on("error", reject)
  })
}

/**
 * The repository root, as the harness reports it.
 *
 * The hook runs with the tool call's own working directory, which inside a
 * worktree or a subdirectory is not the root. `$CLAUDE_PROJECT_DIR` is what the
 * harness sets, and the payload carries a fallback.
 */
export function projectRoot(payload = {}, environment = process.env) {
  return environment.CLAUDE_PROJECT_DIR ?? payload.cwd ?? process.cwd()
}

/**
 * Read the run lock, or report its absence.
 *
 * Returns `null` when the file is missing or unreadable for any reason. The
 * pure module decides what that means; this only reports what was on disk.
 */
export function readRunLock(root, read = readFileSync) {
  try {
    return read(path.join(root, RUN_LOCK_PATH), "utf8")
  } catch {
    return null
  }
}

/** Turn the raw payload into a verdict. Exported so the test drives it directly. */
export function decide(rawPayload, { environment, read } = {}) {
  const payload = JSON.parse(rawPayload === "" ? "{}" : rawPayload)
  const lockContents = readRunLock(projectRoot(payload, environment ?? process.env), read)
  return classifyToolCall({
    toolName: payload.tool_name,
    toolInput: payload.tool_input,
    runActive: isRunActive(lockContents)
  })
}

export async function main({ stdin, stderr, argv } = {}) {
  const input = stdin ?? process.stdin
  const errorStream = stderr ?? process.stderr
  try {
    const raw = argv?.payload ?? (await readStdin(input))
    const verdict = decide(raw)
    if (verdict.decision === "deny") {
      errorStream.write(`[graph-boundary] ${verdict.reason}\n`)
      return DENY_EXIT_CODE
    }
    return 0
  } catch (error) {
    errorStream.write(
      `[graph-boundary] hook error, allowing the call: ${error?.message ?? error}\n`
    )
    return 0
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href

if (invokedDirectly) {
  process.exitCode = await main()
}
