import assert from "node:assert/strict"
import test from "node:test"

import {
  COPY_COMMANDS,
  DESTRUCTIVE_COMMANDS,
  PROTECTED_BRANCHES,
  RULES,
  RUN_LOCK_PATH,
  RUN_RECORD_PATHS,
  WRAPPER_COMMANDS,
  classifyToolCall,
  isRunActive,
  extractRedirections,
  normalizeCommand,
  splitSegments,
  stripWrappers,
  tokenize
} from "./boundary-rules.mjs"

function verdict(command) {
  return classifyToolCall({ toolName: "Bash", toolInput: { command } })
}

test("segments split on every separator the shell honours", () => {
  const { segments } = splitSegments("a && b || c ; d | e")
  assert.deepEqual(segments, ["a", "b", "c", "d", "e"])
})

test("a separator inside quotes is not a separator", () => {
  const { segments } = splitSegments(`echo "a && b" ; echo 'c | d'`)
  assert.equal(segments.length, 2)
  assert.match(segments[0], /a && b/)
})

test("a trailing ampersand is observed, not swallowed", () => {
  // The shell consumes this before any permission rule can match on it, which
  // is exactly why the profile could never express a background launch.
  const backgrounded = splitSegments("npm run dev &")
  assert.equal(backgrounded.trailingAmpersand, true)
  assert.equal(backgrounded.backgrounded, true)

  const foreground = splitSegments("npm run dev")
  assert.equal(foreground.trailingAmpersand, false)
  assert.equal(foreground.backgrounded, false)

  const midChain = splitSegments("npm run dev & npm run test")
  assert.equal(midChain.backgrounded, true)
  assert.equal(midChain.trailingAmpersand, false)
})

test("tokenize honours quotes and backslash escapes", () => {
  assert.deepEqual(tokenize(`git commit -m "a b" 'c d' e\\ f`), [
    "git",
    "commit",
    "-m",
    "a b",
    "c d",
    "e f"
  ])
})

test("wrappers and inline assignments are stripped off the head", () => {
  const { argv, stripped } = stripWrappers(
    tokenize("FOO=1 env -i nohup time git push --force origin x")
  )
  assert.equal(argv[0], "git")
  assert.deepEqual(stripped, ["FOO=1", "env", "-i", "nohup", "time"])
})

test("every wrapper in the list actually unwraps", () => {
  for (const wrapper of WRAPPER_COMMANDS) {
    const { argv } = stripWrappers(tokenize(`${wrapper} sudo ls`))
    assert.equal(argv[0], "sudo", `${wrapper} must not hide the command behind it`)
  }
})

test("redirection targets are pulled out with the redirection removed", () => {
  const single = extractRedirections("cat a > out.txt")
  assert.deepEqual(single.targets, ["out.txt"])
  assert.equal(single.remainder, "cat a")

  const append = extractRedirections("cat a >>out.txt")
  assert.deepEqual(append.targets, ["out.txt"])

  const descriptor = extractRedirections("run 2> err.log")
  assert.deepEqual(descriptor.targets, ["err.log"])
  assert.equal(descriptor.remainder, "run")

  const quoted = extractRedirections(`cat a > "spaced name.txt"`)
  assert.deepEqual(quoted.targets, ["spaced name.txt"])
})

test("a redirection inside quotes is not a redirection", () => {
  const { targets } = extractRedirections(`echo "a > b"`)
  assert.deepEqual(targets, [])
})

test("copy commands expose their destination as a write target", () => {
  for (const command of COPY_COMMANDS) {
    const { segments } = normalizeCommand(`${command} source.txt destination.txt`)
    assert.deepEqual(
      segments[0].writeTargets,
      ["destination.txt"],
      `${command} must expose its destination`
    )
  }
})

test("rsync flags do not confuse the destination", () => {
  const { segments } = normalizeCommand("rsync -a --delete source/ destination/")
  assert.deepEqual(segments[0].writeTargets, ["destination/"])
})

test("an ordinary command is allowed", () => {
  assert.equal(verdict("npm run test:scripts").decision, "allow")
})

test("destructive commands expose every positional as a write target", () => {
  for (const command of DESTRUCTIVE_COMMANDS) {
    const { segments } = normalizeCommand(`${command} -v first.txt second.txt`)
    assert.deepEqual(
      segments[0].writeTargets,
      ["first.txt", "second.txt"],
      `${command} must expose what it touches`
    )
  }
})

test("sed exposes its targets only with an in-place flag", () => {
  const inPlace = normalizeCommand("sed -i '' s/a/b/ notes.txt")
  assert.ok(inPlace.segments[0].writeTargets.includes("notes.txt"))

  const streaming = normalizeCommand("sed s/a/b/ notes.txt")
  assert.deepEqual(streaming.segments[0].writeTargets, [])
})

test("every rule declares a tier the classifier knows", () => {
  assert.ok(RULES.length > 0)
  for (const rule of RULES) {
    assert.ok(["universal", "graph"].includes(rule.tier), `${rule.id} has an unknown tier`)
    assert.equal(typeof rule.evaluate, "function")
  }
  assert.ok(RULES.some((rule) => rule.tier === "graph"), "the graph tier must exist")
})

test("a lock is active only when it parses into an object", () => {
  assert.equal(isRunActive(null), false)
  assert.equal(isRunActive(undefined), false)
  assert.equal(isRunActive(""), false)
  assert.equal(isRunActive("{ not json"), false)
  assert.equal(isRunActive("[]"), false)
  assert.equal(isRunActive("null"), false)
  assert.equal(isRunActive("42"), false)
  assert.equal(isRunActive('{"slug":"x","runId":"r","pid":1}'), true)
})

test("the record paths and the lock path are distinct", () => {
  assert.equal(RUN_RECORD_PATHS.includes(RUN_LOCK_PATH), false)
  assert.equal(RUN_RECORD_PATHS.length, 2)
})

test("each protected branch is denied and each tier field is populated", () => {
  for (const branch of PROTECTED_BRANCHES) {
    const result = verdict(`git push origin ${branch}`)
    assert.equal(result.decision, "deny")
    assert.equal(result.tier, "universal")
    assert.equal(result.rule, "protected-branch-push")
    assert.match(result.reason, new RegExp(branch))
  }
})

test("a deny in any segment of a chain denies the whole call", () => {
  const result = verdict("git status && sudo rm -rf /")
  assert.equal(result.decision, "deny")
})

test("a non-Bash tool with no path fields is allowed", () => {
  assert.equal(classifyToolCall({ toolName: "Glob", toolInput: { pattern: "**/*.ts" } }).decision, "allow")
})

test("an absent tool input does not throw", () => {
  assert.equal(classifyToolCall({ toolName: "Bash" }).decision, "allow")
  assert.equal(classifyToolCall().decision, "allow")
})
