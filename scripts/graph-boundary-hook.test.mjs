import assert from "node:assert/strict"
import { Readable } from "node:stream"
import test from "node:test"

import { decide, main } from "./graph-boundary-hook.mjs"

// The universal tier's whole surface, exercised through real PreToolUse
// payloads rather than through the pure rules module. A rule that is correct in
// `boundary-rules.mjs` but unreachable through the payload shape is not enforced.

function bash(command) {
  return decide(JSON.stringify({ tool_name: "Bash", tool_input: { command } }))
}

function tool(toolName, toolInput) {
  return decide(JSON.stringify({ tool_name: toolName, tool_input: toolInput }))
}

function collectStderr() {
  const chunks = []
  return { write: (chunk) => chunks.push(chunk), text: () => chunks.join("") }
}

async function runHook(payload) {
  const stderr = collectStderr()
  const code = await main({ stdin: Readable.from([payload]), stderr })
  return { code, stderr: stderr.text() }
}

const DENIED_UNIVERSAL = [
  ["force-push, long flag", "git push --force origin topic", "force-push"],
  ["force-push, short flag", "git push -f origin topic", "force-push"],
  ["force-push, lease flag", "git push --force-with-lease origin topic", "force-push"],
  ["force-push, lease with value", "git push --force-with-lease=topic origin topic", "force-push"],
  ["force-push, leading + refspec", "git push origin +topic:topic", "force-push"],
  ["remote delete, long flag", "git push --delete origin topic", "remote-branch-delete"],
  ["remote delete, short flag", "git push -d origin topic", "remote-branch-delete"],
  ["remote delete, colon refspec", "git push origin :topic", "remote-branch-delete"],
  ["push to main", "git push origin main", "protected-branch-push"],
  ["push to master", "git push origin master", "protected-branch-push"],
  ["push to main by refspec", "git push origin HEAD:main", "protected-branch-push"],
  ["push to main by full ref", "git push origin HEAD:refs/heads/main", "protected-branch-push"],
  ["recursive force remove", "rm -rf build", "recursive-force-remove"],
  ["recursive force remove, split flags", "rm -r -f build", "recursive-force-remove"],
  ["recursive force remove, long flags", "rm --recursive --force build", "recursive-force-remove"],
  ["sudo", "sudo npm install -g something", "sudo"],
  ["pkill", "pkill -f node", "pkill"],
  ["killall", "killall node", "killall"],
  ["secrets read", "cat .secrets/openai-dev.env", "secrets-access"],
  ["secrets write by redirection", "echo x > .secrets/openai-dev.env", "secrets-access"],
  ["secrets write by cp", "cp local.env .secrets/openai-dev.env", "secrets-access"],
  ["secrets write by rsync", "rsync -a local/ .secrets/", "secrets-access"]
]

for (const [name, command, rule] of DENIED_UNIVERSAL) {
  test(`universal tier denies ${name}`, () => {
    const result = bash(command)
    assert.equal(result.decision, "deny", `expected a deny for: ${command}`)
    assert.equal(result.rule, rule)
    assert.equal(result.tier, "universal")
    assert.ok(result.reason.length > 0, "a deny must carry a reason the caller can read")
  })
}

test("a nohup wrapper is unwrapped before matching", () => {
  // The profile's `Bash(nohup*)` deny only ever caught the wrapper by name; the
  // command behind it was never matched at all.
  const result = bash("nohup git push --force origin topic")
  assert.equal(result.decision, "deny")
  assert.equal(result.rule, "force-push")
})

test("a backgrounded, wrapped, chained deny is still a deny", () => {
  const result = bash("cd /tmp && nohup env FOO=1 git push -f origin main &")
  assert.equal(result.decision, "deny")
  assert.equal(result.trailingAmpersand, true)
})

test("a trailing ampersand is observed on an allowed call", () => {
  const result = bash("npm run dev &")
  assert.equal(result.decision, "allow")
  assert.equal(result.trailingAmpersand, true)
  assert.equal(result.backgrounded, true)
})

const ALLOWED = [
  "git push origin main-line-feature",
  "git push origin maintenance",
  "git push origin HEAD:main-line-feature",
  "git push -u origin thejudge-auto/some-slug",
  "git status",
  "git log --oneline -5",
  "rm build/stale.txt",
  "rm -r build",
  "npm run test:scripts",
  "cp source.txt destination.txt",
  "echo hello > notes.txt"
]

for (const command of ALLOWED) {
  test(`universal tier allows: ${command}`, () => {
    assert.equal(bash(command).decision, "allow", `wrongly denied: ${command}`)
  })
}

test("branch matching is whole-name, so near-misses stay pushable", () => {
  // The same false-positive boundary `graph-preflight.test.mjs` asserts for the
  // permission profile: no trailing wildcard after the branch name.
  for (const branch of ["main-line-feature", "maintenance", "mainly", "remaster"]) {
    assert.equal(
      bash(`git push origin ${branch}`).decision,
      "allow",
      `${branch} is not a protected branch`
    )
  }
})

test("file-editing tools are denied on the secrets subtree", () => {
  assert.equal(tool("Read", { file_path: ".secrets/openai-dev.env" }).decision, "deny")
  assert.equal(tool("Write", { file_path: "./.secrets/new.env" }).decision, "deny")
  assert.equal(tool("NotebookEdit", { notebook_path: ".secrets/x.ipynb" }).decision, "deny")
  assert.equal(
    tool("MultiEdit", { edits: [{ file_path: ".secrets/openai-dev.env" }] }).decision,
    "deny"
  )
  assert.equal(tool("Read", { file_path: "PRD/README.md" }).decision, "allow")
})

test("a deny exits 2 with the reason on stderr", async () => {
  const { code, stderr } = await runHook(
    JSON.stringify({ tool_name: "Bash", tool_input: { command: "git push --force origin main" } })
  )
  assert.equal(code, 2)
  assert.match(stderr, /graph-boundary/)
  assert.match(stderr, /Force-push is denied/)
})

test("an allow exits 0 and says nothing", async () => {
  const { code, stderr } = await runHook(
    JSON.stringify({ tool_name: "Bash", tool_input: { command: "git status" } })
  )
  assert.equal(code, 0)
  assert.equal(stderr, "")
})

test("the hook never fails closed", async () => {
  // A hook that denies on its own bugs bricks every session in the repository.
  for (const payload of ["not json", "", "[]", '{"tool_name":null}']) {
    const { code } = await runHook(payload)
    assert.equal(code, 0, `a malformed payload must not deny: ${JSON.stringify(payload)}`)
  }
})

test("an internal error prints a diagnostic before allowing", async () => {
  const { code, stderr } = await runHook("not json")
  assert.equal(code, 0)
  assert.match(stderr, /hook error, allowing the call/)
})
