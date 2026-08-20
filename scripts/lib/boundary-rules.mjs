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

/** Commands whose very presence at a segment head is denied. */
export const DENIED_COMMANDS = Object.freeze(["sudo", "pkill", "killall"])

/** Commands that copy, whose final positional argument is a write target. */
export const COPY_COMMANDS = Object.freeze(["cp", "rsync", "install", "mv"])

const VARIABLE_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/

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
    return {
      text: segmentText,
      argv,
      command: commandName,
      wrappers: stripped,
      redirections: targets,
      writeTargets
    }
  })
  return { segments: normalized, trailingAmpersand, backgrounded }
}

function normalizePathText(value) {
  return String(value).replace(/^["']|["']$/g, "").replace(/^\.\//, "")
}

function touchesSecrets(value) {
  const normalized = normalizePathText(value)
  return normalized === ".secrets" || normalized.includes(SECRETS_PATH_PREFIX)
}

function deny(rule, reason) {
  return { decision: "deny", tier: "universal", rule, reason }
}

const ALLOW = Object.freeze({ decision: "allow", tier: null, rule: null, reason: null })

function classifyGitPush(segment) {
  const args = segment.argv.slice(2)

  for (const argument of args) {
    if (FORCE_PUSH_FLAGS.test(argument)) {
      return deny("force-push", `Force-push is denied in every session (saw \`${argument}\`).`)
    }
    if (DELETE_PUSH_FLAGS.test(argument)) {
      return deny(
        "remote-branch-delete",
        `Deleting a remote branch is denied in every session (saw \`${argument}\`).`
      )
    }
  }

  const refspecs = args.filter((argument) => !argument.startsWith("-"))
  for (const refspec of refspecs) {
    if (refspec.startsWith("+")) {
      return deny(
        "force-push",
        `A leading \`+\` refspec is a force-push and is denied in every session (saw \`${refspec}\`).`
      )
    }
    if (refspec.startsWith(":")) {
      return deny(
        "remote-branch-delete",
        `A \`:branch\` refspec deletes a remote branch and is denied in every session (saw \`${refspec}\`).`
      )
    }
    // `HEAD:main`, `main`, `refs/heads/main` — the destination half decides.
    const destination = refspec.includes(":") ? refspec.slice(refspec.indexOf(":") + 1) : refspec
    const branch = destination.replace(/^refs\/heads\//, "")
    if (PROTECTED_BRANCHES.includes(branch)) {
      return deny(
        "protected-branch-push",
        `Pushing to \`${branch}\` is denied in every session. Open a pull request instead.`
      )
    }
  }

  return ALLOW
}

function classifyRemove(segment) {
  const flags = segment.argv.slice(1).filter((argument) => argument.startsWith("-"))
  let recursive = false
  let force = false
  for (const flag of flags) {
    if (flag === "--recursive") recursive = true
    else if (flag === "--force") force = true
    else if (/^-[a-zA-Z]+$/.test(flag)) {
      if (flag.includes("r") || flag.includes("R")) recursive = true
      if (flag.includes("f")) force = true
    }
  }
  if (recursive && force) {
    return deny("recursive-force-remove", "`rm -rf` is denied in every session.")
  }
  return ALLOW
}

/** Apply the universal tier to one normalized segment. */
export function classifySegment(segment) {
  if (segment.command === "") return ALLOW

  if (DENIED_COMMANDS.includes(segment.command)) {
    return deny(segment.command, `\`${segment.command}\` is denied in every session.`)
  }

  for (const token of segment.argv) {
    if (touchesSecrets(token)) {
      return deny(
        "secrets-access",
        "Reading or writing the secrets subtree is denied in every session."
      )
    }
  }

  for (const target of segment.writeTargets) {
    if (touchesSecrets(target)) {
      return deny(
        "secrets-access",
        "Reading or writing the secrets subtree is denied in every session."
      )
    }
  }

  if (segment.command === "rm") return classifyRemove(segment)

  if (segment.command === "git" && segment.argv[1] === "push") {
    return classifyGitPush(segment)
  }

  return ALLOW
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

/**
 * The decision function.
 *
 * `{ decision: "allow" | "deny", tier, rule, reason }`. Slice B adds the graph
 * tier behind the caller-supplied run state; today every deny is universal and
 * fires with or without a run lock.
 */
export function classifyToolCall({ toolName, toolInput } = {}) {
  if (toolName === "Bash") {
    const { segments, trailingAmpersand, backgrounded } = normalizeCommand(toolInput?.command)
    for (const segment of segments) {
      const verdict = classifySegment(segment)
      if (verdict.decision === "deny") {
        return { ...verdict, trailingAmpersand, backgrounded }
      }
    }
    return { ...ALLOW, trailingAmpersand, backgrounded }
  }

  for (const candidate of toolInputPaths(toolInput)) {
    if (touchesSecrets(candidate)) {
      return deny(
        "secrets-access",
        "Reading or writing the secrets subtree is denied in every session."
      )
    }
  }

  return ALLOW
}

/** Re-exported so a caller needs one import for the whole boundary vocabulary. */
export { PROTECTED_PATH_PATTERNS, isProtectedPath }
