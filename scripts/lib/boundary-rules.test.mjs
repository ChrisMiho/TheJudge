import assert from "node:assert/strict"
import test from "node:test"

import {
  COPY_COMMANDS,
  DESTRUCTIVE_COMMANDS,
  NODE_CALL_CAPS,
  PARK_GRACE_CALLS,
  PROTECTED_BRANCHES,
  REMEDIABLE_RULES,
  RULES,
  RUN_LOCK_PATH,
  RUN_RECORD_PATHS,
  WRAPPER_COMMANDS,
  callCountKey,
  capForNode,
  classifyToolCall,
  extractRedirections,
  gitSubcommand,
  isRunActive,
  normalizeCommand,
  parseRunState,
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

function capped({ node = "plan", attempt = 1, callCount, runActive = true, toolName = "Bash" }) {
  return classifyToolCall({
    toolName,
    toolInput: toolName === "Bash" ? { command: "git status" } : { prompt: "dispatch" },
    runActive,
    runState: { runId: "graph-1", node, attempt },
    callCount
  })
}

test("the deny fires exactly at the cap and not before", () => {
  // Changed 2026-08-24: the cap used to deny *every* tool at this boundary,
  // which made the park it demands impossible to write. It now stops dispatches
  // at exactly the cap and gives the park a bounded budget — see the park-path
  // tests below. The boundary itself is unchanged; what it denies is narrower.
  const cap = capForNode("plan")
  assert.equal(capped({ callCount: cap - 1, toolName: "Task" }).decision, "allow")
  const denied = capped({ callCount: cap, toolName: "Task" })
  assert.equal(denied.decision, "deny")
  assert.equal(denied.rule, "tool-call-cap")
  assert.equal(denied.tier, "graph")
})

test("the reason names the node, the attempt, and the count", () => {
  const denied = capped({ node: "build", attempt: 2, callCount: capForNode("build"), toolName: "Task" })
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

// ---------------------------------------------------------------------------
// Regressions found by the node-7 reviewer against slices A and B.
// ---------------------------------------------------------------------------

test("`&` inside a redirection is not a background launch", () => {
  // `2>&1` appears in almost every command. Splitting on its `&` corrupted the
  // segment into `npm run build 2>` and `1`, and tripped the background rule
  // on a form that has nothing to do with backgrounding.
  for (const command of ["npm run build 2>&1", "node x.mjs >&2", "make &>build.log"]) {
    const { segments, backgrounded, trailingAmpersand } = splitSegments(command)
    assert.equal(segments.length, 1, `${command} is one segment`)
    assert.equal(segments[0], command)
    assert.equal(backgrounded, false, `${command} does not background`)
    assert.equal(trailingAmpersand, false)
  }
})

test("a real background launch is still seen", () => {
  assert.equal(splitSegments("npm run dev &").backgrounded, true)
  assert.equal(splitSegments("npm run dev & npm run test").backgrounded, true)
  assert.equal(splitSegments("npm run build 2>&1 &").backgrounded, true)
})

test("git's global options do not hide the subcommand", () => {
  // `git -C /elsewhere push --force` is a force-push. A rule keying on
  // `argv[1] === "push"` never saw it.
  assert.deepEqual(gitSubcommand(["git", "push", "origin", "x"]), {
    subcommand: "push",
    args: ["origin", "x"]
  })
  assert.equal(gitSubcommand(["git", "-C", "/elsewhere", "push", "origin"]).subcommand, "push")
  assert.equal(gitSubcommand(["git", "-c", "a.b=c", "push"]).subcommand, "push")
  assert.equal(gitSubcommand(["git", "--no-pager", "push"]).subcommand, "push")
  assert.equal(gitSubcommand(["git"]).subcommand, null)
})

test("a force-push is denied through git's global options", () => {
  for (const command of [
    "git -C /elsewhere push --force origin topic",
    "git -c pack.threads=1 push -f origin topic",
    "git --no-pager push origin main",
    "git -C /elsewhere push origin :topic"
  ]) {
    assert.equal(verdict(command).decision, "deny", `must still be seen: ${command}`)
  }
})

test("the secrets rule denies access, not discussion", () => {
  // A substring test denied `rg '\.secrets/'`, `git log -S`, and any doc edit
  // quoting the path — none of which touch a secret.
  for (const command of [
    "grep -rn '\\.secrets/' scripts/",
    "rg '\\.secrets/' --files-with-matches",
    "grep -c '.secrets/' PRD/instructions/graph-workflow-contract.md",
    "git log -S.secrets/ --oneline"
  ]) {
    assert.equal(verdict(command).decision, "allow", `discussion must be allowed: ${command}`)
  }
})

test("actual secrets access is still denied in every form", () => {
  for (const command of [
    "cat .secrets/openai-dev.env",
    "cat ./.secrets/openai-dev.env",
    "cat apps/.secrets/local.env",
    "cp local.env .secrets/openai-dev.env",
    "echo x > .secrets/openai-dev.env",
    "rsync -a local/ .secrets/",
    "ls .secrets"
  ]) {
    const result = verdict(command)
    assert.equal(result.decision, "deny", `must stay denied: ${command}`)
    assert.equal(result.rule, "secrets-access")
  }
})

test("a pattern command still cannot read a secret by path", () => {
  // The first positional is the pattern; the operands after it are paths.
  assert.equal(verdict("grep -rn TOKEN .secrets/openai-dev.env").rule, "secrets-access")
})

test("every removal mechanism reaches the run lock, not just `rm`", () => {
  // `unlink` was absent from DESTRUCTIVE_COMMANDS, so `run-lock-removal`
  // matched `rm .worktrees/.graph-run.lock` and allowed the identical
  // `unlink .worktrees/.graph-run.lock`. A guardrail one synonym clears is
  // not a guardrail.
  for (const command of [
    "rm .worktrees/.graph-run.lock",
    "rm -f .worktrees/.graph-run.lock",
    "unlink .worktrees/.graph-run.lock",
    "mv .worktrees/.graph-run.lock /tmp/elsewhere"
  ]) {
    const result = classifyToolCall({
      toolName: "Bash",
      toolInput: { command },
      runActive: true
    })
    assert.equal(result.decision, "deny", `must stay denied without a release record: ${command}`)
    assert.equal(result.rule, "run-lock-removal")
  }
})

test("a declared terminal state gives lock release a path the rule recognises", () => {
  // The contract requires the run to delete its lock as the last act of every
  // terminal state; the rule denied exactly that, and the two could not both
  // hold. Release is permitted only when the driver has declared a terminal
  // state naming this run.
  const release = { runId: "graph-20260823-173948", state: "COMPLETE" }
  for (const command of [
    "rm .worktrees/.graph-run.lock",
    "unlink .worktrees/.graph-run.lock"
  ]) {
    const result = classifyToolCall({
      toolName: "Bash",
      toolInput: { command },
      runActive: true,
      lockRunId: "graph-20260823-173948",
      release
    })
    assert.equal(result.decision, "allow", `release must be permitted: ${command}`)
  }
})

test("a release record for a different run does not release this lock", () => {
  const result = classifyToolCall({
    toolName: "Bash",
    toolInput: { command: "rm .worktrees/.graph-run.lock" },
    runActive: true,
    lockRunId: "graph-20260823-173948",
    release: { runId: "graph-19990101-000000", state: "COMPLETE" }
  })
  assert.equal(result.decision, "deny")
  assert.equal(result.rule, "run-lock-removal")
})

test("the stop sentinel is still not removable at a terminal state", () => {
  // Release covers the lock alone. The owner clears their own kill switch.
  const result = classifyToolCall({
    toolName: "Bash",
    toolInput: { command: "rm .worktrees/.graph-stop" },
    runActive: true,
    lockRunId: "graph-20260823-173948",
    release: { runId: "graph-20260823-173948", state: "COMPLETE" }
  })
  assert.equal(result.decision, "deny")
  assert.equal(result.rule, "stop-sentinel-removal")
})

test("a heredoc body is data, not commands", () => {
  // Observed 2026-08-24: a commit message describing this very hook was denied.
  // The body line "...to prove; nohup discriminates" split at the `;` and
  // `nohup` matched as a segment head, so a run could be denied for recording
  // what it found. Recording findings is the run's job.
  const cases = [
    "cat > msg.txt <<EOF\nclaims to prove; nohup discriminates\nEOF\ngit commit -F msg.txt",
    "cat > msg.txt <<'EOF'\nthe rule denies; pkill is one of them\nEOF\ngit add msg.txt",
    "cat > msg.txt <<-EOF\n\tindented; sudo appears here\n\tEOF\ngit add msg.txt",
    'cat > msg.txt <<"EOF"\nwe removed; rm -rf from the list\nEOF\ngit add msg.txt'
  ]
  for (const command of cases) {
    const result = classifyToolCall({ toolName: "Bash", toolInput: { command }, runActive: true })
    assert.equal(result.decision, "allow", `prose must not be read as a command: ${command}`)
  }
})

test("skipping a heredoc body does not skip what follows it", () => {
  // The failure mode of the fix: consume too much and a real command after the
  // terminator stops being seen at all.
  for (const [command, rule] of [
    ["cat > f.txt <<EOF\nbody\nEOF\nnohup echo after", "nohup-wrapper"],
    ["cat > f.txt <<EOF\nbody\nEOF\npkill -f something", "denied-command"],
    ["cat > f.txt <<EOF\nbody\nEOF\ngit push --force origin main", "force-push"]
  ]) {
    const result = classifyToolCall({ toolName: "Bash", toolInput: { command }, runActive: true })
    assert.equal(result.decision, "deny", `a command after the terminator must still be seen: ${command}`)
    assert.equal(result.rule, rule)
  }
})

test("a heredoc still resolves its own write target", () => {
  // The redirection is kept even though the body is skipped, so writing a
  // protected path through a heredoc is still a write.
  const result = classifyToolCall({
    toolName: "Bash",
    toolInput: { command: "cat > CLAUDE.md <<EOF\nanything\nEOF" },
    runActive: true
  })
  assert.equal(result.decision, "deny")
  assert.equal(result.rule, "protected-path-write")
})

test("an unterminated heredoc is body all the way down", () => {
  // Treating the tail as commands is exactly the false positive being fixed.
  const result = classifyToolCall({
    toolName: "Bash",
    toolInput: { command: "cat > f.txt <<EOF\nmentions; nohup and never closes" },
    runActive: true
  })
  assert.equal(result.decision, "allow")
})

test("a here-string is not a heredoc", () => {
  // `<<<` puts one word on stdin; it has no delimited body to skip.
  const { segments } = splitSegments("cat <<< hello ; nohup true")
  assert.equal(segments.length, 2)
  assert.match(segments[1], /nohup/)
})

test("a node at its cap can no longer dispatch", () => {
  const atCap = classifyToolCall({
    toolName: "Task",
    toolInput: { prompt: "another node" },
    runActive: true,
    runState: { runId: "r", node: "close", attempt: 1 },
    callCount: NODE_CALL_CAPS.close
  })
  assert.equal(atCap.decision, "deny")
  assert.equal(atCap.rule, "tool-call-cap")
  assert.match(atCap.reason, /Dispatching\s+another node is denied/)
})

test("a node at its cap can still write its own park", () => {
  // Observed 2026-08-24: at the cap every tool was denied, including Read, so
  // the contract's own instruction — park at `owner-action` with the node, the
  // cap, and the count as evidence — could not be carried out. Parking is four
  // writes and a commit, and all of them were refused.
  for (const call of [
    { toolName: "Bash", toolInput: { command: "git add PRD/work/example" } },
    { toolName: "Bash", toolInput: { command: "git commit -m park" } },
    { toolName: "Write", toolInput: { file_path: "PRD/work/example/GRAPH-RUN.md", content: "parked" } },
    { toolName: "Read", toolInput: { file_path: "PRD/work/example/GRAPH-RUN.md" } }
  ]) {
    const result = classifyToolCall({
      ...call,
      runActive: true,
      runState: { runId: "r", node: "close", attempt: 1 },
      callCount: NODE_CALL_CAPS.close + 5
    })
    assert.equal(result.decision, "allow", `the park path must stay open: ${call.toolName}`)
  }
})

test("the park budget is bounded, so the cap still means something", () => {
  const spent = classifyToolCall({
    toolName: "Bash",
    toolInput: { command: "git status" },
    runActive: true,
    runState: { runId: "r", node: "close", attempt: 1 },
    callCount: NODE_CALL_CAPS.close + PARK_GRACE_CALLS
  })
  assert.equal(spent.decision, "deny")
  assert.equal(spent.rule, "tool-call-cap")
  assert.match(spent.reason, /park budget/)
})

test("a loop-back gets a fresh budget, cap and grace alike", () => {
  const result = classifyToolCall({
    toolName: "Task",
    toolInput: { prompt: "retry the node" },
    runActive: true,
    runState: { runId: "r", node: "build", attempt: 2 },
    callCount: 1
  })
  assert.equal(result.decision, "allow")
})

test("REMEDIABLE_RULES stays narrow, and every member is a real rule", () => {
  // Widening this set weakens the retry guard, so it is pinned rather than
  // described. A rule belongs here only when its denial names something the
  // contract already requires the run to go and do — adding one is a decision,
  // and this assertion is where that decision has to be made on purpose.
  assert.deepEqual([...REMEDIABLE_RULES], ["run-lock-removal"])

  const known = new Set(RULES.map((rule) => rule.id))
  for (const id of REMEDIABLE_RULES) {
    assert.ok(known.has(id), `REMEDIABLE_RULES names \`${id}\`, which is not a rule`)
  }
  assert.ok(!REMEDIABLE_RULES.has("denied-command-retry"), "the guard cannot exempt itself")
})
