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

import { appendFileSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import {
  CRITERIA_FILE_SUFFIX,
  DENIAL_LOG_PATH,
  EVIDENCE_EARNING_NODE,
  EVIDENCE_LOG_PATH,
  RUN_LOCK_PATH,
  RUN_RELEASE_PATH,
  RUN_STATE_PATH,
  RUN_STOP_PATH,
  callContext,
  callCountKey,
  classifyToolCall,
  criteriaFlippedTrue,
  denialKey,
  evidenceSubject,
  isRunActive,
  manualObservationIds,
  matchesEvidence,
  parseCriteriaFile,
  parseRunState,
  writtenText
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

/** The work-package slug this run is advancing, from the lock it holds. */
export function slugFromLock(lockContents) {
  try {
    const parsed = JSON.parse(lockContents)
    return typeof parsed?.slug === "string" ? parsed.slug : null
  } catch {
    return null
  }
}

/** The run id in the lock, so a release record can be matched against it. */
export function runIdFromLock(lockContents) {
  try {
    const parsed = JSON.parse(lockContents)
    return typeof parsed?.runId === "string" ? parsed.runId : null
  } catch {
    return null
  }
}

/**
 * The run's declaration that it has reached a terminal state, or null.
 *
 * Malformed is treated as absent. A release record that does not parse is not a
 * release, and the lock stays denied — the safe direction for a rule whose job
 * is to keep a live run from deleting its own bookkeeping.
 */
export function readRelease(root, read = readFileSync) {
  const raw = readRecord(root, RUN_RELEASE_PATH, read)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Every slice's criteria file for one work package.
 *
 * Read fresh on each call rather than cached: a run emits and edits these files
 * as it goes, and a cached view would judge a flip against a stale criterion.
 */
export function loadCriteria(root, slug, io = {}) {
  const list = io.list ?? readdirSync
  const read = io.read ?? readFileSync
  if (slug === null) return []

  const directory = path.join(root, "PRD", "work", slug)
  let names
  try {
    names = list(directory)
  } catch {
    return []
  }

  const files = []
  for (const name of names) {
    if (!String(name).endsWith(CRITERIA_FILE_SUFFIX)) continue
    let contents
    try {
      contents = read(path.join(directory, name), "utf8")
    } catch {
      continue
    }
    const parsed = parseCriteriaFile(contents)
    if (parsed === null) continue
    files.push({ name: String(name), ...parsed })
  }
  return files
}

/**
 * The evidence ids already observed for this run.
 *
 * The log is append-only and the hook is its sole writer, which is what makes a
 * flip check meaningful: a run cannot pre-seed its own evidence.
 */
export function readObservedEvidence(root, runId, io = {}) {
  const read = io.read ?? readFileSync
  const observed = new Set()
  const raw = readRecord(root, EVIDENCE_LOG_PATH, read)
  if (raw === null) return observed
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue
    try {
      const entry = JSON.parse(line)
      if (entry?.runId === runId && typeof entry?.criterionId === "string") {
        observed.add(entry.criterionId)
      }
    } catch {
      // A damaged line is skipped, never rewritten. Append-only means the hook
      // does not get to tidy this file.
    }
  }
  return observed
}

/** Append observed-evidence entries. Only ever appends. */
export function appendEvidence(root, entries, io = {}) {
  if (entries.length === 0) return
  const append = io.append ?? appendFileSync
  const ensure = io.ensure ?? mkdirSync
  const target = path.join(root, EVIDENCE_LOG_PATH)
  ensure(path.dirname(target), { recursive: true })
  append(target, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n", "utf8")
}

/**
 * The criteria this call proves, and the criteria it is trying to set `true`.
 *
 * Ordinary calls earn evidence. A write to a criteria file is judged against
 * what has already been earned. A dated observation line is the evidence event
 * for a `manual` criterion, whose check no command can stand in for.
 */
export function assessCriteria({ context, criteriaFiles, observed, runId, now }) {
  const subject = evidenceSubject(context)
  const text = writtenText(context.toolName, context.toolInput)
  const manualIds = new Set(manualObservationIds(text))
  const flippedIds = new Set(criteriaFlippedTrue(text))

  const earned = []
  const flipped = []

  for (const file of criteriaFiles) {
    for (const criterion of file.criteria) {
      const isManual = criterion.evidence?.manual === true

      if (isManual ? manualIds.has(criterion.id) : matchesEvidence(criterion.evidence, subject)) {
        if (!observed.has(criterion.id)) {
          earned.push({
            runId,
            slice: file.slice,
            criterionId: criterion.id,
            via: isManual ? "manual-observation" : "tool-call",
            observedAt: now
          })
        }
      }

      if (flippedIds.has(criterion.id) && !criterion.value) {
        flipped.push({
          id: criterion.id,
          missing: isManual
            ? `a dated observation line naming \`${criterion.id}\``
            : describeEvidence(criterion.evidence)
        })
      }
    }
  }

  return { earned, flipped }
}

function describeEvidence(evidence) {
  const parts = []
  if (typeof evidence?.command === "string" && evidence.command !== "") {
    parts.push(`a command matching \`${evidence.command}\``)
  }
  const paths = Array.isArray(evidence?.paths) ? evidence.paths : []
  if (paths.length > 0) parts.push(`a call naming ${paths.map((p) => `\`${p}\``).join(" or ")}`)
  return parts.length === 0 ? "an evidence block that names nothing" : parts.join(" or ")
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

/**
 * The denial keys this run has already been given.
 *
 * Same append-only discipline as the evidence log, and for the same reason: a
 * run that could rewrite this could clear its own denial and retry.
 */
export function readPriorDenials(root, runId, io = {}) {
  const read = io.read ?? readFileSync
  const keys = new Map()
  const raw = readRecord(root, DENIAL_LOG_PATH, read)
  if (raw === null) return keys
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue
    try {
      const entry = JSON.parse(line)
      // Keyed to the rule that first refused it, so a retry's message can name
      // the original reason instead of only saying "you already tried this".
      if (entry?.runId === runId && typeof entry?.key === "string") keys.set(entry.key, entry.rule ?? null)
    } catch {
      // A damaged line is skipped, never rewritten.
    }
  }
  return keys
}

/** Record one denial. Only ever appends. */
export function appendDenial(root, entry, io = {}) {
  const append = io.append ?? appendFileSync
  const ensure = io.ensure ?? mkdirSync
  const target = path.join(root, DENIAL_LOG_PATH)
  ensure(path.dirname(target), { recursive: true })
  append(target, JSON.stringify(entry) + "\n", "utf8")
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

  // Criteria are a run-time concern too: outside a run there is no run id to
  // key evidence against and no node to attribute it to.
  let flippedCriteria = []
  let observedEvidence = null
  if (runActive && runState !== null) {
    const context = callContext({
      toolName: payload.tool_name,
      toolInput: payload.tool_input,
      runActive
    })
    context.toolInput = payload.tool_input
    const slug = slugFromLock(readRunLock(root, read))
    const criteriaFiles = loadCriteria(root, slug, io)
    if (criteriaFiles.length > 0) {
      observedEvidence = readObservedEvidence(root, runState.runId, io)
      const assessment = assessCriteria({
        context,
        criteriaFiles,
        observed: observedEvidence,
        runId: runState.runId,
        now: (io.now ?? (() => new Date().toISOString()))()
      })
      flippedCriteria = assessment.flipped
      // Defect 3 (Q4): earn evidence only during the build node. An earlier
      // node's file listings and searches must not pre-satisfy build's criteria
      // — the 2026-08-23 shakedown saw the planner earn 7 of 21 checks before
      // build began. The flip guard above still fires in every node, so gating
      // earning here cannot let a non-build node forge a pass.
      if (runState.node === EVIDENCE_EARNING_NODE) {
        try {
          appendEvidence(root, assessment.earned, io)
          for (const entry of assessment.earned) observedEvidence.add(entry.criterionId)
        } catch (error) {
          degraded = `could not append observed evidence (${error?.message ?? error})`
        }
      }
    }
  }

  const verdict = classifyToolCall({
    toolName: payload.tool_name,
    toolInput: payload.tool_input,
    runActive,
    stopRequested: readStopSentinel(root, read),
    runState,
    callCount,
    flippedCriteria,
    observedEvidence,
    lockRunId: runActive ? runIdFromLock(readRunLock(root, read)) : null,
    release: runActive ? readRelease(root, read ?? readFileSync) : null,
    priorDenials: runActive && runState !== null ? readPriorDenials(root, runState.runId, io) : null
  })

  // Record the denial so a second attempt at the same call is refused as a
  // retry rather than re-evaluated from scratch. Only genuine denials are
  // logged, and never the retry rule's own denial — that would be the log
  // feeding itself.
  if (verdict.decision === "deny" && runActive && runState !== null && verdict.rule !== "denied-command-retry") {
    try {
      appendDenial(
        root,
        {
          runId: runState.runId,
          node: runState.node ?? null,
          rule: verdict.rule,
          key: denialKey(callContext({ toolName: payload.tool_name, toolInput: payload.tool_input, runActive })),
          deniedAt: (io.now ?? (() => new Date().toISOString()))()
        },
        io
      )
    } catch (error) {
      // A denial that could not be recorded is still a denial. Report the
      // degraded condition rather than allowing the call.
      degraded = `could not record the denial (${error?.message ?? error}); a retry of this call would not be caught`
    }
  }

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
  // `pathToFileURL` percent-encodes; a raw `file://` template does not. A repo
  // path containing a space would otherwise never match, and the hook would
  // load without running — failing open, silently.
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  process.exitCode = await main()
}
