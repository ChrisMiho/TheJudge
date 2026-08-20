import assert from "node:assert/strict"
import test from "node:test"

import {
  COPY_COMMANDS,
  DESTRUCTIVE_COMMANDS,
  NODE_CALL_CAPS,
  PROTECTED_BRANCHES,
  RULES,
  RUN_LOCK_PATH,
  RUN_RECORD_PATHS,
  WRAPPER_COMMANDS,
  callCountKey,
  capForNode,
  classifyToolCall,
  isRunActive,
  parseRunState,
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

// ---------------------------------------------------------------------------
// Slice D — the per-dispatch tool-call cap.
// ---------------------------------------------------------------------------

const NODES = [
  "preflight",
  "shape",
  "define",
  "gate-qc",
  "plan",
  "build",
  "review",
  "land",
  "close"
]

test("every node in the contract's table carries a cap value", () => {
  assert.deepEqual(Object.keys(NODE_CALL_CAPS), NODES)
  for (const node of NODES) {
    const cap = capForNode(node)
    if (node === "land") {
      assert.equal(cap, null, "node 8 is a human PR merge and is never dispatched")
      continue
    }
    assert.ok(Number.isInteger(cap) && cap > 0, `${node} needs a positive integer cap`)
  }
})

test("an unknown node has no cap rather than a default one", () => {
  assert.equal(capForNode("not-a-node"), null)
  assert.equal(capForNode(undefined), null)
})

test("run state parses only when every attribution field is present", () => {
  assert.deepEqual(parseRunState('{"runId":"r","node":"build","attempt":2}'), {
    runId: "r",
    node: "build",
    attempt: 2
  })
  for (const bad of [
    null,
    undefined,
    "",
    "{ not json",
    "[]",
    "null",
    '{"runId":"r","node":"build"}',
    '{"runId":"r","attempt":1}',
    '{"node":"build","attempt":1}',
    '{"runId":"r","node":"build","attempt":"2"}'
  ]) {
    assert.equal(parseRunState(bad), null, `must not attribute: ${JSON.stringify(bad)}`)
  }
})

test("the counter key carries run id, node, and attempt", () => {
  assert.equal(callCountKey({ runId: "graph-1", node: "plan", attempt: 3 }), "graph-1/plan/3")
})

function capped({ node = "plan", attempt = 1, callCount, runActive = true }) {
  return classifyToolCall({
    toolName: "Bash",
    toolInput: { command: "git status" },
    runActive,
    runState: { runId: "graph-1", node, attempt },
    callCount
  })
}

test("the deny fires exactly at the cap and not before", () => {
  const cap = capForNode("plan")
  assert.equal(capped({ callCount: cap - 1 }).decision, "allow")
  const denied = capped({ callCount: cap })
  assert.equal(denied.decision, "deny")
  assert.equal(denied.rule, "tool-call-cap")
  assert.equal(denied.tier, "graph")
})

test("the reason names the node, the attempt, and the count", () => {
  const denied = capped({ node: "build", attempt: 2, callCount: capForNode("build") })
  assert.match(denied.reason, /build/)
  assert.match(denied.reason, /attempt 2/)
  assert.match(denied.reason, new RegExp(String(capForNode("build"))))
  assert.match(denied.reason, /owner-action/, "an overrun parks; it does not invent a state")
})

test("the verdict reports the node, attempt, and count it counted against", () => {
  const observed = capped({ node: "define", attempt: 3, callCount: 7 })
  assert.equal(observed.node, "define")
  assert.equal(observed.attempt, 3)
  assert.equal(observed.callCount, 7)
})

test("a node with no cap is never capped", () => {
  assert.equal(capped({ node: "land", callCount: 100000 }).decision, "allow")
})

test("an unattributable call is never capped", () => {
  const unattributed = classifyToolCall({
    toolName: "Bash",
    toolInput: { command: "git status" },
    runActive: true,
    runState: null,
    callCount: null
  })
  assert.equal(unattributed.decision, "allow")
})

test("the cap does not fire outside a run", () => {
  assert.equal(capped({ callCount: capForNode("plan") + 500, runActive: false }).decision, "allow")
})

test("build carries the largest budget, land the smallest", () => {
  // Sanity on the ordering rather than the exact numbers: the node that
  // implements every slice cannot have a smaller budget than the one that
  // reads a design brief.
  assert.ok(capForNode("build") > capForNode("plan"))
  assert.ok(capForNode("define") > capForNode("gate-qc"))
})
