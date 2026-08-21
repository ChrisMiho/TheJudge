/**
 * The boundary tiers, as pure data and pure functions.
 *
 * This module holds every protected-path and command literal in the graph
 * boundary system. `scripts/graph-boundary-hook.mjs` does the file I/O and
 * holds none of them, because `scripts/protected-write-guard.test.mjs` fails
 * any non-test script that pairs an `fs` write call with a protected-path
 * literal — and the hook grows counter and evidence writes in later slices.
 *
 * Nothing here touches the filesystem, the clock, or the environment. A tier
 * decision is a function of the tool call and the run state the caller read.
 */

import { PROTECTED_PATH_PATTERNS, isProtectedPath } from "./protected-paths.mjs"

/**
 * The secrets subtree, which the universal tier denies in every session.
 *
 * It is one entry of `PROTECTED_PATH_PATTERNS` rather than a second list: the
 * graph tier (slice B) denies the whole set, the universal tier denies this
 * part of it always.
 */
export const SECRETS_PATH_PREFIX = ".secrets/"

/**
 * Branch names no session may push to, in any refspec form.
 *
 * Matched whole, never as a prefix: `main-line-feature` and `maintenance` stay
 * pushable, the same false-positive boundary `scripts/graph-preflight.test.mjs`
 * asserts for the permission profile.
 */
export const PROTECTED_BRANCHES = Object.freeze(["main", "master"])

/**
 * Command words that wrap another command rather than being one.
 *
 * Stripped before matching, because a permission rule cannot see past them:
 * `nohup git push --force` is a force-push, and the profile's `Bash(nohup*)`
 * deny only ever caught the wrapper by name.
 */
export const WRAPPER_COMMANDS = Object.freeze([
  "nohup",
  "command",
  "builtin",
  "exec",
  "time",
  "setsid",
  "stdbuf",
  "caffeinate",
  "env"
])

/**
 * The liveness canary: a command the universal tier denies, and which would do
 * nothing at all if it ever executed.
 *
 * Inertness is the whole design constraint. The canary exists to prove the hook
 * is wired, and a proof that has a side effect when it fails is not a proof
 * worth running. `rm -rf` on a path that does not exist under `.worktrees/` —
 * which `.gitignore` already covers — removes nothing, prints nothing, and
 * exits 0. So an absent hook costs a failed proof and no more.
 */
export const CANARY_COMMAND = "rm -rf .worktrees/.graph-canary-nonexistent"

/** Commands whose very presence at a segment head is denied. */
export const DENIED_COMMANDS = Object.freeze(["sudo", "pkill", "killall"])

/**
 * Commands that copy, whose final positional argument is a write target.
 *
 * `mv` is deliberately not here. It belongs to `DESTRUCTIVE_COMMANDS`, which
 * exposes every positional — a move writes its destination *and* removes its
 * source, so destination-only would miss half of what it does.
 */
export const COPY_COMMANDS = Object.freeze(["cp", "rsync", "install"])

/**
 * Commands where every positional argument is a thing being written or removed.
 *
 * `rm` is the reason this list exists: deleting the run lock is a write to the
 * run's own bookkeeping, and no destination-only rule would see it.
 */
export const DESTRUCTIVE_COMMANDS = Object.freeze([
  "rm",
  "mv",
  "tee",
  "truncate",
  "shred",
  "ln",
  "chmod",
  "chown"
])

/** The run lock. Its presence is what turns the graph tier on. */
export const RUN_LOCK_PATH = ".worktrees/.graph-run.lock"

/**
 * The owner's kill switch.
 *
 * Creating this file stops a run at its next node boundary. `graph-run` checks
 * for it before every dispatch; the rules below are the backstop for a driver
 * that ignores its own check.
 */
export const RUN_STOP_PATH = ".worktrees/.graph-stop"

/**
 * The run-state file `graph-run` writes immediately before every node dispatch.
 *
 * Deliberately separate from the lock. `parseLockFile()` in
 * `graph-preflight.mjs` treats an unreadable lock as a hard blocker for the next
 * run, so rewriting the lock at every node boundary would put the concurrency
 * guard at risk nine times a run.
 */
export const RUN_STATE_PATH = ".worktrees/.graph-run-state.json"

/**
 * Per-dispatch tool-call budget, by node.
 *
 * One dispatch of one node. A loop-back is a new attempt with a fresh budget,
 * so this is never a third loop limit — the contract's three-FAIL and
 * two-return caps stay the only bound on how many dispatches happen.
 *
 * `land` is `null`: node 8 is a human PR merge and the driver never dispatches
 * it, so it has no budget to spend. The basis for every other number is recorded
 * in the slice doc, not asserted here.
 */
export const NODE_CALL_CAPS = Object.freeze({
  preflight: 40,
  shape: 60,
  define: 150,
  "gate-qc": 60,
  plan: 120,
  build: 600,
  review: 120,
  land: null,
  close: 120
})

/**
 * The tools that dispatch a subagent — which is what a node dispatch *is*.
 *
 * Denying these is how the kill switch stops a run that is not reading its own
 * sentinel. It deliberately does not deny every tool: the halting run still has
 * to write its terminal state, its ledger, and its board row.
 */
export const DISPATCH_TOOLS = Object.freeze(["Task", "Agent"])

/**
 * The hook's own records, which no agent may write.
 *
 * A run that could reset its call count or append to its evidence file would be
 * grading its own homework, so the graph tier denies agent writes to both. The
 * hook itself writes them, which is why these literals live here and not in the
 * hook: `protected-write-guard.test.mjs` scans scripts for protected-path
 * literals paired with fs write calls, and the hook is a writer.
 */
export const RUN_RECORD_PATHS = Object.freeze([
  ".worktrees/.graph-node-calls.json",
  ".worktrees/.graph-evidence.jsonl"
])

const VARIABLE_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/

/**
 * Git's global options, which sit between `git` and its subcommand.
 *
 * `git -C /elsewhere push --force` is a force-push, and a rule keying on
 * `argv[1] === "push"` never sees it.
 */
const GIT_GLOBAL_FLAGS_WITH_VALUE = new Set(["-C", "-c", "--exec-path", "--git-dir", "--work-tree", "--namespace"])

/** The subcommand and its arguments, with git's global options stripped. */
export function gitSubcommand(argv) {
  let index = 1
  while (index < argv.length) {
    const token = argv[index]
    if (GIT_GLOBAL_FLAGS_WITH_VALUE.has(token)) {
      index += 2
      continue
    }
    if (token.startsWith("-")) {
      index += 1
      continue
    }
    break
  }
  return { subcommand: argv[index] ?? null, args: argv.slice(index + 1) }
}

const FORCE_PUSH_FLAGS = /^(?:-f|--force|--force-with-lease(?:=.*)?|--force-if-includes)$/

const DELETE_PUSH_FLAGS = /^(?:-d|--delete)$/

/**
 * Split raw command text into segments, quote-aware.
 *
 * Separators are `;`, `&&`, `||`, `|`, `&`, and newline. A `&` with nothing
 * after it is a background launch, which the caller is told about rather than
 * denied — the profile could not express it at all, because the shell consumes
 * a trailing `&` as a separator before any rule sees it.
 */
export function splitSegments(commandText) {
  const segments = []
  let current = ""
  let quote = null
  let trailingAmpersand = false
  let backgrounded = false

  const flush = () => {
    if (current.trim() !== "") segments.push(current.trim())
    current = ""
  }

  for (let index = 0; index < commandText.length; index += 1) {
    const character = commandText[index]

    if (quote) {
      current += character
      if (character === "\\" && quote === '"' && commandText[index + 1]) {
        current += commandText[index + 1]
        index += 1
      } else if (character === quote) {
        quote = null
      }
      continue
    }

    if (character === "'" || character === '"') {
      quote = character
      current += character
      continue
    }

    if (character === "\\" && commandText[index + 1]) {
      current += character + commandText[index + 1]
      index += 1
      continue
    }

    const pair = commandText.slice(index, index + 2)
    if (pair === "&&" || pair === "||") {
      flush()
      index += 1
      continue
    }

    if (character === ";" || character === "\n" || character === "|") {
      flush()
      continue
    }

    if (character === "&") {
      // `2>&1`, `>&2`, `&>log` — the shell reads these as redirections, not as
      // a background launch. Splitting here corrupts the segment *and* trips the
      // background rule on a form that appears in almost every command.
      if (current.trimEnd().endsWith(">") || commandText[index + 1] === ">") {
        current += character
        continue
      }
      flush()
      backgrounded = true
      if (commandText.slice(index + 1).trim() === "") trailingAmpersand = true
      continue
    }

    current += character
  }

  flush()
  return { segments, trailingAmpersand, backgrounded }
}

/** Split one segment into argv, honouring quotes and backslash escapes. */
export function tokenize(segmentText) {
  const tokens = []
  let current = ""
  let started = false
  let quote = null

  for (let index = 0; index < segmentText.length; index += 1) {
    const character = segmentText[index]

    if (quote) {
      if (character === quote) {
        quote = null
        continue
      }
      if (quote === '"' && character === "\\" && segmentText[index + 1]) {
        current += segmentText[index + 1]
        index += 1
        started = true
        continue
      }
      current += character
      started = true
      continue
    }

    if (character === "'" || character === '"') {
      quote = character
      started = true
      continue
    }

    if (character === "\\" && segmentText[index + 1]) {
      current += segmentText[index + 1]
      index += 1
      started = true
      continue
    }

    if (/\s/.test(character)) {
      if (started) {
        tokens.push(current)
        current = ""
        started = false
      }
      continue
    }

    current += character
    started = true
  }

  if (started) tokens.push(current)
  return tokens
}

/**
 * Pull `>` / `>>` redirection targets out of a segment, returning the targets
 * and the segment with the redirections removed.
 *
 * A redirection is a write, and it is the write form a permission rule is least
 * able to see: `cat x > CLAUDE.md` names `cat` as its command.
 */
export function extractRedirections(segmentText) {
  const targets = []
  let remainder = ""
  let quote = null

  for (let index = 0; index < segmentText.length; index += 1) {
    const character = segmentText[index]

    if (quote) {
      remainder += character
      if (character === quote) quote = null
      continue
    }

    if (character === "'" || character === '"') {
      quote = character
      remainder += character
      continue
    }

    if (character === ">") {
      // Drop a leading file-descriptor digit that belongs to the redirection.
      remainder = remainder.replace(/\d$/, "")
      let cursor = index + 1
      if (segmentText[cursor] === ">") cursor += 1
      while (/\s/.test(segmentText[cursor] ?? "")) cursor += 1
      let target = ""
      let targetQuote = null
      while (cursor < segmentText.length) {
        const targetCharacter = segmentText[cursor]
        if (targetQuote) {
          if (targetCharacter === targetQuote) targetQuote = null
          else target += targetCharacter
          cursor += 1
          continue
        }
        if (targetCharacter === "'" || targetCharacter === '"') {
          targetQuote = targetCharacter
          cursor += 1
          continue
        }
        if (/\s/.test(targetCharacter)) break
        target += targetCharacter
        cursor += 1
      }
      if (target !== "") targets.push(target)
      index = cursor - 1
      continue
    }

    remainder += character
  }

  return { targets, remainder: remainder.trim() }
}

/**
 * Strip wrapper commands and inline variable assignments from the head of argv.
 *
 * Returns the unwrapped argv and the wrappers that were removed, so a caller
 * can report what the raw text hid.
 */
export function stripWrappers(tokens) {
  const stripped = []
  let argv = [...tokens]

  while (argv.length > 0) {
    const head = argv[0]
    if (VARIABLE_ASSIGNMENT.test(head)) {
      stripped.push(head)
      argv = argv.slice(1)
      continue
    }
    const name = head.split("/").pop()
    if (WRAPPER_COMMANDS.includes(name)) {
      stripped.push(name)
      argv = argv.slice(1)
      // `env -i`, `time -p`, `stdbuf -oL` and friends: drop their own options.
      while (argv.length > 0 && argv[0].startsWith("-")) {
        stripped.push(argv[0])
        argv = argv.slice(1)
      }
      continue
    }
    break
  }

  return { argv, stripped }
}

/** Normalize one raw command string into everything the rules need to see. */
export function normalizeCommand(commandText) {
  const { segments, trailingAmpersand, backgrounded } = splitSegments(commandText ?? "")
  const normalized = segments.map((segmentText) => {
    const { targets, remainder } = extractRedirections(segmentText)
    const tokens = tokenize(remainder)
    const { argv, stripped } = stripWrappers(tokens)
    const positional = argv.slice(1).filter((token) => !token.startsWith("-"))
    const writeTargets = [...targets]
    const commandName = (argv[0] ?? "").split("/").pop()
    if (COPY_COMMANDS.includes(commandName) && positional.length >= 2) {
      writeTargets.push(positional[positional.length - 1])
    }
    if (DESTRUCTIVE_COMMANDS.includes(commandName)) {
      writeTargets.push(...positional)
    }
    if (commandName === "sed" && argv.some((token) => /^-[a-zA-Z]*i/.test(token))) {
      writeTargets.push(...positional)
    }
    return {
      text: segmentText,
      argv,
      command: commandName,
      wrappers: stripped,
      redirections: targets,
      writeTargets: [...new Set(writeTargets)]
    }
  })
  return { segments: normalized, trailingAmpersand, backgrounded }
}

function normalizePathText(value) {
  return String(value)
    .replace(/^["']|["']$/g, "")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "")
}

/**
 * Whether a token *is* a path into the secrets subtree, rather than merely
 * mentioning one.
 *
 * Anchored on purpose. A substring test denies `rg '\.secrets/'`, `git log -S`,
 * and any doc edit that quotes the path — none of which touch a secret. The rule
 * exists to stop access, not discussion.
 */
function touchesSecrets(value) {
  const normalized = normalizePathText(value)
  return (
    normalized === ".secrets" ||
    normalized.startsWith(SECRETS_PATH_PREFIX) ||
    normalized.includes(`/${SECRETS_PATH_PREFIX}`) ||
    normalized.endsWith("/.secrets")
  )
}

/**
 * Commands whose first positional argument is a pattern, not a path.
 *
 * `grep ".secrets/" file` searches for the text; it does not read the directory.
 */
const PATTERN_COMMANDS = Object.freeze(["grep", "egrep", "fgrep", "rg", "ag", "ack", "sed", "awk"])

/** The tokens of a call that could actually name a secret, pattern operands excluded. */
function secretsCandidates(context) {
  const candidates = [...context.paths]
  for (const segment of context.segments) {
    const positional = segment.argv.slice(1).filter((token) => !token.startsWith("-"))
    const skipPattern = PATTERN_COMMANDS.includes(segment.command)
    const operands = skipPattern ? positional.slice(1) : positional
    candidates.push(...operands, ...segment.writeTargets)
  }
  return candidates
}

/**
 * The current node, from the run-state file `graph-run` wrote.
 *
 * Pure: the caller reads the file, this decides what it means. Returns `null`
 * when the file is missing, unparseable, or missing any field needed to
 * attribute a call — the hook cannot attribute what it cannot read, and says so
 * rather than guessing the node from the tool call.
 */
export function parseRunState(contents) {
  if (contents === null || contents === undefined) return null
  try {
    const parsed = JSON.parse(contents)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
    const runId = typeof parsed.runId === "string" ? parsed.runId : null
    const node = typeof parsed.node === "string" ? parsed.node : null
    const attempt = Number.isInteger(parsed.attempt) ? parsed.attempt : null
    if (runId === null || node === null || attempt === null) return null
    return { runId, node, attempt }
  } catch {
    return null
  }
}

/**
 * Where a slice's machine-readable acceptance criteria live.
 *
 * One file beside each slice doc, emitted by `thejudge-map-out` from the doc's
 * `## Acceptance criteria` list. It is not a replacement for the slice doc —
 * `PRD/instructions/requirement-format.md` still defines that.
 */
export const CRITERIA_FILE_SUFFIX = ".criteria.json"

/** The append-only log of evidence the hook actually observed. */
export const EVIDENCE_LOG_PATH = ".worktrees/.graph-evidence.jsonl"

/**
 * A dated observation line for a `manual` criterion.
 *
 * `2026-08-20 A6 — attempted the denied command in a bypassPermissions session`
 *
 * The date is required so the line is an observation someone made on a day, not
 * a claim that could have been copied forward from an earlier run.
 */
export const MANUAL_OBSERVATION_PATTERN = /(\d{4}-\d{2}-\d{2})\s+([A-Za-z]+\d+)\s*[—\-:]/g

/**
 * Read a criteria file.
 *
 * Returns `null` rather than throwing on anything malformed: an unreadable
 * criteria file must not brick the session, and node 6's gate catches a slice
 * whose criteria could not be read.
 */
export function parseCriteriaFile(contents) {
  if (contents === null || contents === undefined) return null
  try {
    const parsed = JSON.parse(contents)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
    if (!Array.isArray(parsed.criteria)) return null
    const criteria = parsed.criteria
      .filter((entry) => entry && typeof entry.id === "string")
      .map((entry) => ({
        id: entry.id,
        statement: typeof entry.statement === "string" ? entry.statement : "",
        value: entry.value === true,
        evidence: entry.evidence && typeof entry.evidence === "object" ? entry.evidence : {}
      }))
    return {
      slug: typeof parsed.slug === "string" ? parsed.slug : null,
      slice: typeof parsed.slice === "string" ? parsed.slice : null,
      criteria
    }
  } catch {
    return null
  }
}

/** Everything a criterion's `evidence` block can be matched against. */
export function evidenceSubject(context) {
  const commands = context.segments.map((segment) => segment.text)
  return {
    toolName: context.toolName,
    commands,
    commandText: commands.join(" ; "),
    paths: namedPaths(context).map(normalizePathText)
  }
}

/**
 * Whether one tool call satisfies one criterion's `evidence` block.
 *
 * A block names a command pattern, one or more paths, or both. Either kind
 * matching is enough — a criterion proved by running a command and a criterion
 * proved by reading a file are both legitimate, and requiring both would make
 * most blocks unsatisfiable.
 *
 * A `manual` criterion never matches an ordinary call. Its evidence event is the
 * dated observation line, handled separately.
 */
export function matchesEvidence(evidence, subject) {
  if (!evidence || evidence.manual === true) return false

  if (typeof evidence.command === "string" && evidence.command !== "") {
    try {
      if (new RegExp(evidence.command).test(subject.commandText)) return true
    } catch {
      // A criterion with an invalid pattern simply never matches. It cannot be
      // allowed to throw: the hook runs on every tool call in the repository.
    }
  }

  const paths = Array.isArray(evidence.paths) ? evidence.paths : []
  for (const candidate of paths) {
    const target = normalizePathText(candidate)
    if (subject.paths.some((named) => named === target || named.endsWith(`/${target}`))) {
      return true
    }
  }

  return false
}

/**
 * The criterion ids a piece of written text sets to `true`.
 *
 * Tries the whole payload as JSON first, which is what a `Write` of a criteria
 * file looks like. Falls back to a scan, which is what an `Edit`'s `new_string`
 * or a shell heredoc looks like — a fragment that never parses on its own.
 */
export function criteriaFlippedTrue(text) {
  if (typeof text !== "string" || text === "") return []

  const parsed = parseCriteriaFile(text)
  if (parsed !== null) {
    return parsed.criteria.filter((entry) => entry.value === true).map((entry) => entry.id)
  }

  const found = new Set()
  const forward = /"id"\s*:\s*"([^"]+)"[^{}]*?"value"\s*:\s*true/g
  const reverse = /"value"\s*:\s*true[^{}]*?"id"\s*:\s*"([^"]+)"/g
  for (const pattern of [forward, reverse]) {
    let match
    while ((match = pattern.exec(text)) !== null) found.add(match[1])
  }
  return [...found]
}

/** The criterion ids named by dated observation lines in a piece of text. */
export function manualObservationIds(text) {
  if (typeof text !== "string" || text === "") return []
  const found = new Set()
  const pattern = new RegExp(MANUAL_OBSERVATION_PATTERN.source, "g")
  let match
  while ((match = pattern.exec(text)) !== null) found.add(match[2])
  return [...found]
}

/** The text a tool call would write, across the tools that write text. */
export function writtenText(toolName, toolInput) {
  if (!toolInput || typeof toolInput !== "object") return ""
  const parts = []
  for (const key of ["content", "new_string", "new_source", "command"]) {
    if (typeof toolInput[key] === "string") parts.push(toolInput[key])
  }
  if (Array.isArray(toolInput.edits)) {
    for (const edit of toolInput.edits) {
      if (edit && typeof edit.new_string === "string") parts.push(edit.new_string)
    }
  }
  return parts.join("\n")
}

/**
 * The counter key: run id, node, and attempt.
 *
 * Attempt is in the key so a loop-back never parks on a budget an earlier
 * attempt spent, and run id is in it so the count survives park and resume —
 * neither is keyed to a session.
 */
export function callCountKey({ runId, node, attempt }) {
  return `${runId}/${node}/${attempt}`
}

/** The budget for a node, or `null` when it has none. */
export function capForNode(node) {
  return Object.prototype.hasOwnProperty.call(NODE_CALL_CAPS, node)
    ? NODE_CALL_CAPS[node]
    : null
}

/**
 * Whether the lock file's contents mean a run is active.
 *
 * Pure: the caller reads the file, this decides what it means. A missing or
 * unparseable lock is "no run active" for the graph tier — and never a reason
 * to skip the universal tier, which fires either way.
 *
 * This is deliberately not `classifyLock()` from `graph-preflight.mjs`. That
 * one decides whether a *new* run may start, so it treats a corrupt lock as a
 * hard blocker. This one decides whether stricter rules apply to a call in
 * flight, where the safe reading of an unreadable lock is the permissive one:
 * a hook that hardened on garbage would brick ordinary work in this repository.
 */
export function isRunActive(lockContents) {
  if (lockContents === null || lockContents === undefined) return false
  try {
    const parsed = JSON.parse(lockContents)
    return Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed)
  } catch {
    return false
  }
}

/** Every path a call would write, across Bash segments and file-tool inputs. */
function writtenPaths(context) {
  const paths = [...context.paths]
  for (const segment of context.segments) paths.push(...segment.writeTargets)
  return paths
}

/** Every path a call so much as names. Reads count for the secrets rule. */
function namedPaths(context) {
  const paths = [...context.paths]
  for (const segment of context.segments) {
    paths.push(...segment.argv)
    paths.push(...segment.writeTargets)
  }
  return paths
}

function matchesPath(candidate, target) {
  const normalized = normalizePathText(candidate)
  return normalized === target || normalized.endsWith(`/${target}`)
}

/**
 * The tiers, as one table.
 *
 * Tier membership is a field on the rule, not logic split between the hook and
 * the permission profile. Universal rules fire in every session; graph rules
 * fire only while the run lock exists. Each rule returns a reason, or null.
 */
export const RULES = Object.freeze([
  {
    id: "secrets-access",
    tier: "universal",
    evaluate: (context) =>
      secretsCandidates(context).some(touchesSecrets)
        ? "Reading or writing the secrets subtree is denied in every session."
        : null
  },
  {
    id: "denied-command",
    tier: "universal",
    evaluate: (context) => {
      for (const segment of context.segments) {
        if (DENIED_COMMANDS.includes(segment.command)) {
          return `\`${segment.command}\` is denied in every session.`
        }
      }
      return null
    }
  },
  {
    id: "recursive-force-remove",
    tier: "universal",
    evaluate: (context) => {
      for (const segment of context.segments) {
        if (segment.command === "rm" && isRecursiveForce(segment)) {
          return "`rm -rf` is denied in every session."
        }
      }
      return null
    }
  },
  {
    id: "force-push",
    tier: "universal",
    evaluate: (context) => firstPushReason(context, "force-push")
  },
  {
    id: "remote-branch-delete",
    tier: "universal",
    evaluate: (context) => firstPushReason(context, "remote-branch-delete")
  },
  {
    id: "protected-branch-push",
    tier: "universal",
    evaluate: (context) => firstPushReason(context, "protected-branch-push")
  },
  {
    id: "protected-path-write",
    tier: "graph",
    evaluate: (context) => {
      for (const candidate of writtenPaths(context)) {
        const normalized = normalizePathText(candidate)
        if (isProtectedPath(normalized)) {
          return `Writing \`${normalized}\` is denied while a graph run holds the lock: a run may not edit its own enforcer or its own instructions.`
        }
      }
      return null
    }
  },
  {
    id: "run-record-write",
    tier: "graph",
    evaluate: (context) => {
      for (const candidate of writtenPaths(context)) {
        for (const record of RUN_RECORD_PATHS) {
          if (matchesPath(candidate, record)) {
            return `Writing \`${record}\` is denied while a graph run holds the lock: the hook is its sole writer, so a run cannot reset its own counter or forge its own evidence.`
          }
        }
      }
      return null
    }
  },
  {
    id: "run-lock-removal",
    tier: "graph",
    evaluate: (context) => {
      for (const candidate of writtenPaths(context)) {
        if (matchesPath(candidate, RUN_LOCK_PATH)) {
          return "Removing the run lock is denied while that lock is live. Release goes through the run's own terminal states, not through deleting the lock."
        }
      }
      return null
    }
  },
  {
    id: "stop-sentinel-removal",
    tier: "graph",
    evaluate: (context) => {
      for (const candidate of writtenPaths(context)) {
        if (matchesPath(candidate, RUN_STOP_PATH)) {
          return "Removing the owner's stop sentinel is denied while a run holds the lock. The run halts first and releases the lock; the owner removes the sentinel to resume."
        }
      }
      return null
    }
  },
  {
    id: "criterion-flip-without-evidence",
    tier: "graph",
    evaluate: (context) => {
      const { flippedCriteria, observedEvidence } = context
      if (!Array.isArray(flippedCriteria) || flippedCriteria.length === 0) return null
      const observed = observedEvidence instanceof Set ? observedEvidence : new Set()
      const unproven = flippedCriteria.filter((entry) => !observed.has(entry.id))
      if (unproven.length === 0) return null
      const detail = unproven
        .map((entry) => `\`${entry.id}\` (still needs: ${entry.missing})`)
        .join(", ")
      return (
        `Setting ${unproven.length === 1 ? "an acceptance criterion" : "acceptance criteria"} ` +
        `to \`true\` is denied without observed evidence: ${detail}. A criterion ` +
        `starts \`false\` and is earned by the hook seeing the evidence, not by ` +
        `writing the value.`
      )
    }
  },
  {
    id: "tool-call-cap",
    tier: "graph",
    evaluate: (context) => {
      const { runState, callCount } = context
      if (runState === null || callCount === null) return null
      const cap = capForNode(runState.node)
      if (cap === null) return null
      if (callCount < cap) return null
      return (
        `Node \`${runState.node}\` attempt ${runState.attempt} has reached its ` +
        `tool-call cap of ${cap} (this call is number ${callCount}). Park at ` +
        `\`owner-action\` with the node, the cap, and the observed count as ` +
        `evidence. A loop-back to this node is a new attempt with a fresh budget.`
      )
    }
  },
  {
    id: "dispatch-after-stop",
    tier: "graph",
    evaluate: (context) =>
      context.stopRequested && DISPATCH_TOOLS.includes(context.toolName)
        ? "The owner asked this run to stop. Dispatching another node is denied. Halt at this boundary: write the terminal state, record the halt under `## Open gate`, set the package status and board row, and release the lock."
        : null
  },
  {
    id: "nohup-wrapper",
    tier: "graph",
    evaluate: (context) => {
      for (const segment of context.segments) {
        if (segment.wrappers.includes("nohup")) {
          return "`nohup` is denied while a graph run holds the lock: a detached command outlives the run that started it."
        }
      }
      return null
    }
  },
  {
    id: "background-launch",
    tier: "graph",
    evaluate: (context) =>
      context.backgrounded
        ? "Launching a command in the background with `&` is denied while a graph run holds the lock: the run cannot own a process it never waits for."
        : null
  }
])

function isRecursiveForce(segment) {
  let recursive = false
  let force = false
  for (const flag of segment.argv.slice(1).filter((argument) => argument.startsWith("-"))) {
    if (flag === "--recursive") recursive = true
    else if (flag === "--force") force = true
    else if (/^-[a-zA-Z]+$/.test(flag)) {
      if (/[rR]/.test(flag)) recursive = true
      if (flag.includes("f")) force = true
    }
  }
  return recursive && force
}

/** `git push` analysis, returning the reason for whichever rule is asking. */
function firstPushReason(context, ruleId) {
  for (const segment of context.segments) {
    if (segment.command !== "git") continue
    const { subcommand, args } = gitSubcommand(segment.argv)
    if (subcommand !== "push") continue

    for (const argument of args) {
      if (ruleId === "force-push" && FORCE_PUSH_FLAGS.test(argument)) {
        return `Force-push is denied in every session (saw \`${argument}\`).`
      }
      if (ruleId === "remote-branch-delete" && DELETE_PUSH_FLAGS.test(argument)) {
        return `Deleting a remote branch is denied in every session (saw \`${argument}\`).`
      }
    }

    for (const refspec of args.filter((argument) => !argument.startsWith("-"))) {
      if (ruleId === "force-push" && refspec.startsWith("+")) {
        return `A leading \`+\` refspec is a force-push and is denied in every session (saw \`${refspec}\`).`
      }
      if (ruleId === "remote-branch-delete" && refspec.startsWith(":")) {
        return `A \`:branch\` refspec deletes a remote branch and is denied in every session (saw \`${refspec}\`).`
      }
      if (ruleId !== "protected-branch-push") continue
      if (refspec.startsWith("+") || refspec.startsWith(":")) continue
      // `HEAD:main`, `main`, `refs/heads/main` — the destination half decides.
      const destination = refspec.includes(":") ? refspec.slice(refspec.indexOf(":") + 1) : refspec
      const branch = destination.replace(/^refs\/heads\//, "")
      if (PROTECTED_BRANCHES.includes(branch)) {
        return `Pushing to \`${branch}\` is denied in every session. Open a pull request instead.`
      }
    }
  }
  return null
}

/** The tool-input fields that name a file path across the file-editing tools. */
export function toolInputPaths(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return []
  const paths = []
  for (const key of ["file_path", "path", "notebook_path"]) {
    if (typeof toolInput[key] === "string") paths.push(toolInput[key])
  }
  if (Array.isArray(toolInput.edits)) {
    for (const edit of toolInput.edits) {
      if (edit && typeof edit.file_path === "string") paths.push(edit.file_path)
    }
  }
  return paths
}

/** Everything the rules need to see about one tool call, in one shape. */
export function callContext({
  toolName,
  toolInput,
  runActive = false,
  stopRequested = false,
  runState = null,
  callCount = null,
  flippedCriteria = [],
  observedEvidence = null
} = {}) {
  const isBash = toolName === "Bash"
  const normalized = isBash
    ? normalizeCommand(toolInput?.command)
    : { segments: [], trailingAmpersand: false, backgrounded: false }
  return {
    toolName: toolName ?? null,
    segments: normalized.segments,
    trailingAmpersand: normalized.trailingAmpersand,
    backgrounded: normalized.backgrounded,
    paths: isBash ? [] : toolInputPaths(toolInput),
    runActive: Boolean(runActive),
    stopRequested: Boolean(stopRequested),
    runState,
    callCount,
    flippedCriteria,
    observedEvidence
  }
}

/**
 * The decision function.
 *
 * `{ decision, tier, rule, reason, runActive, trailingAmpersand, backgrounded }`.
 * Universal rules are evaluated in every session. Graph rules are evaluated only
 * when the caller reports the run lock present, so always-on enforcement never
 * blocks ordinary work in this repository.
 */
export function classifyToolCall(call = {}) {
  const context = callContext(call)
  const observations = {
    runActive: context.runActive,
    stopRequested: context.stopRequested,
    node: context.runState?.node ?? null,
    attempt: context.runState?.attempt ?? null,
    callCount: context.callCount,
    trailingAmpersand: context.trailingAmpersand,
    backgrounded: context.backgrounded
  }

  for (const rule of RULES) {
    if (rule.tier === "graph" && !context.runActive) continue
    const reason = rule.evaluate(context)
    if (reason) {
      return { decision: "deny", tier: rule.tier, rule: rule.id, reason, ...observations }
    }
  }

  return { decision: "allow", tier: null, rule: null, reason: null, ...observations }
}

/** Re-exported so a caller needs one import for the whole boundary vocabulary. */
export { PROTECTED_PATH_PATTERNS, isProtectedPath }
