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

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"

import {
  RUN_LOCK_PATH,
  RUN_STATE_PATH,
  RUN_STOP_PATH,
  callCountKey,
  classifyToolCall,
  isRunActive,
  parseRunState
} from "./lib/boundary-rules.mjs"

/** The counter file. The hook is its sole writer; the graph tier denies the rest. */
const CALL_COUNT_PATH = ".worktrees/.graph-node-calls.json"

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

/** Read a run record, or report its absence. Never throws. */
function readRecord(root, relative, read) {
  try {
    return read(path.join(root, relative), "utf8")
  } catch {
    return null
  }
}

/**
 * Increment this attempt's tool-call count and return the new value.
 *
 * The hook is the counter file's only writer, which is what makes the count
 * evidence rather than a self-report: the graph tier denies every other write
 * to it, so a run can neither reset it nor inflate it.
 *
 * The write goes through a temporary file and a rename, so a hook interrupted
 * mid-write leaves the previous count rather than a truncated file that the
 * next call would read as "no counts at all".
 */
export function recordCall(root, runState, io = {}) {
  const read = io.read ?? readFileSync
  const write = io.write ?? writeFileSync
  const move = io.move ?? renameSync
  const ensure = io.ensure ?? mkdirSync

  const key = callCountKey(runState)
  const target = path.join(root, CALL_COUNT_PATH)

  let counts = {}
  const raw = readRecord(root, CALL_COUNT_PATH, read)
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) counts = parsed
    } catch {
      // A corrupt counter file restarts the count rather than blocking the run.
      counts = {}
    }
  }

  const next = (Number.isInteger(counts[key]) ? counts[key] : 0) + 1
  counts[key] = next

  ensure(path.dirname(target), { recursive: true })
  const temporary = `${target}.${process.pid}.tmp`
  write(temporary, `${JSON.stringify(counts, null, 2)}\n`, "utf8")
  move(temporary, target)

  return { key, count: next }
}

/** Whether the owner's stop sentinel is on disk. Its contents do not matter. */
export function readStopSentinel(root, read = readFileSync) {
  try {
    read(path.join(root, RUN_STOP_PATH), "utf8")
    return true
  } catch {
    return false
  }
}

/** Turn the raw payload into a verdict. Exported so the test drives it directly. */
export function decide(rawPayload, io = {}) {
  const { environment, read } = io
  const payload = JSON.parse(rawPayload === "" ? "{}" : rawPayload)
  const root = projectRoot(payload, environment ?? process.env)
  const runActive = isRunActive(readRunLock(root, read))

  // Counting is a run-time concern. With no run holding the lock there is
  // nothing to attribute a call to, and no budget being spent.
  let runState = null
  let callCount = null
  let degraded = null
  if (runActive) {
    runState = parseRunState(readRecord(root, RUN_STATE_PATH, read ?? readFileSync))
    if (runState === null) {
      degraded = `no usable run state at ${RUN_STATE_PATH}; the tool-call cap cannot attribute this call and is not enforced`
    } else {
      try {
        callCount = recordCall(root, runState, io).count
      } catch (error) {
        degraded = `could not record the tool call (${error?.message ?? error}); the cap is not enforced for this call`
      }
    }
  }

  const verdict = classifyToolCall({
    toolName: payload.tool_name,
    toolInput: payload.tool_input,
    runActive,
    stopRequested: readStopSentinel(root, read),
    runState,
    callCount
  })
  return { ...verdict, degraded }
}

export async function main({ stdin, stderr, argv } = {}) {
  const input = stdin ?? process.stdin
  const errorStream = stderr ?? process.stderr
  try {
    const raw = argv?.payload ?? (await readStdin(input))
    const verdict = decide(raw, { environment: argv?.environment, read: argv?.read })
    if (verdict.degraded) {
      // Reported, never silent: a cap that quietly stopped counting looks
      // exactly like a run that stayed inside it.
      errorStream.write(`[graph-boundary] degraded: ${verdict.degraded}\n`)
    }
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
