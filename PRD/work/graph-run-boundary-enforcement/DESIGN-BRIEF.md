# Design Brief — graph-run-boundary-enforcement

## What the owner gets

A graph run bounded by machinery instead of by the agent's good behavior, and a
run the owner can stop mid-flight without stranding the lock or leaving the
ledger half written.

Today an autonomous run's safety boundaries are mostly convention.
`.claude/graph-profile.json` binds only in a session launched with
`claude --settings .claude/graph-profile.json`; without that flag every entry is
inert. The contract's own reach table records raw Bash writes — `cp`, `rsync`,
redirection — as enforcement "none". Two boundaries cannot fire even with the
profile loaded. After this work, every boundary fires whether or not anyone
remembered a launch flag.

## Scope

All six findings from `docs/whatIsGraph/graph-hardening-handoff.md`, plus the
node-7 reviewer change. Five of the seven ride one mechanism.

### One hook, six jobs

A `PreToolUse` hook in a committed `.claude/settings.json` — a file this
repository does not have today, holding only the personal, gitignored
`settings.local.json`. It reads raw command text and file paths on every tool
call, denies by exit code 2, and fires inside every dispatched subagent, which
is what every graph node is.

1. **Enforcement without a launch flag** (REQ-152). Covers what the profile
   cannot: `cp` / `rsync` / redirection into protected paths, `nohup` — stripped
   as a wrapper before rules match — and a trailing background `&`, which is
   consumed as a command separator before any rule sees the command text.
2. **Two tiers, gated by the lock** (REQ-153). The universal tier always denies:
   secrets, force-push, remote branch deletion, trunk pushes, `rm -rf`, `sudo`,
   `pkill`, `killall`. The graph tier denies only while
   `.worktrees/.graph-run.lock` is held: `thejudge-*` skills, `CLAUDE.md`,
   `.claude/settings*.json`, `nohup`, background `&`.
3. **Kill switch** (REQ-154, FLOW-020). `.worktrees/.graph-stop`. The driver
   checks it before each node dispatch and halts cleanly — terminal state
   written, lock released. The hook denies new dispatches as the backstop.
4. **Per-dispatch tool-call cap** (REQ-156). The hook counts and denies past the
   node table's cap, which is a budget for one dispatch of that node. Overrun
   parks as `PARKED`. A `PreToolUse` hook is stateless per call, so the driver
   writes the node it is about to dispatch, and the attempt number, into
   `.worktrees/.graph-run-state.json` first, and the hook reads it to know what
   to count against.
5. **Default-FAIL slice criteria** (REQ-157). Every acceptance criterion starts
   `false` and cannot flip without a hook-observed evidence read. Each criterion
   carries an `evidence` block — a command pattern, file paths, or both —
   authored beside it in the slice doc; that block is what tells the hook which
   read belongs to which criterion.
6. **The no-pre-authorization rule re-read before every dispatch** (REQ-158) —
   the one behavior not carried by the hook itself, but by the driver, at the
   point `graph-ledger-check.mjs` already runs.

### The hook is proven, not assumed

REQ-159. A hook that is present, committed, and trusted still reads exactly
like a working hook when it is not firing, so the run proves it twice.
`graph-preflight` issues a canary call the universal tier must deny; no deny
and the run never starts, ending at `BLOCKED`. Between nodes the driver checks
that the hook's own counter advanced during the node just finished, which
catches a hook that stops firing mid-run without spending a deliberate denial
at every boundary. Nothing falls back to `.claude/graph-profile.json` — the
contract already directs treating an unverified profile as absent, and the
profile binds only under the launch flag this work removes reliance on.

### Node 7 changes independently

REQ-155. The reviewer becomes a fresh-context subagent holding no Write or Edit
tools, grading against the slice's own stated acceptance criteria and
instructed to flag only correctness-or-requirements gaps.
`superpowers:requesting-code-review` drops off node 7.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Scope | All six findings plus node 7 | Owner call. Five ride one mechanism, so the marginal cost of the later three is small |
| Profile fate | Kept as belt-and-braces | The hook is authoritative; the profile narrows the tool surface in ways a hook does not, and keeping it avoids re-testing ~120 deny rules as hook code |
| Hook scope | Committed and always on, graph tier gated by the lock | Ordinary sessions must stay able to author skills and edit `CLAUDE.md`; the lock is a run-active signal that already exists |
| Kill switch | Graceful at node boundary, hook as backstop | A hard halt at the next tool call leaves the run unable to write its own terminal state — the exact Ctrl-C failure being fixed |
| Steer | Out of scope | Every steer line needs an `## Instruction ledger` row; that is a package |
| Node 7 | Replace, not wrap | `requesting-code-review` is not this repository's to gate, so its internals can change under a wrapper |
| Cap units | Tool calls, per dispatch of a node | Keyed by run id, node, and attempt. A per-run total would starve a loop-back retry and park it before it did any work, for a reason unrelated to runaway behavior. See the correction below |
| Loop-backs | Fresh budget per attempt | The contract's loop caps — three FAIL returns to `define`, two to `build` — stay the only bound on dispatch count. The cap adds no third loop limit |
| Hook liveness | Canary at preflight, counter heartbeat between nodes | A failed proof is refused, not downgraded. The profile cannot be the fallback: the contract treats an unverified profile as absent, and it needs the flag this work drops |
| Overrun state | `PARKED`, no fifth state | `graph-run`'s `## Terminal states` table stays the single authority; a second list drifts |
| Compaction | Re-read at each dispatch, not `CLAUDE.md` | Avoids diluting a file every ordinary session reads |
| Default-FAIL depth | Criteria file with hook-enforced evidence | The full mechanism; a criteria file without enforcement is still a self-report |
| Criterion-to-evidence | Declared `evidence` block per criterion | The agent declaring which criterion it is on would re-introduce the self-report at the attach step; a session-wide rule would let one passing test unlock the whole slice |
| Current-node source | New `.worktrees/.graph-run-state.json`, driver-written | Keeps the lock single-writer. An unreadable lock blocks the next run, so the concurrency guard must not be rewritten at every node boundary |

### Correction to finding 4

The handoff proposed `max_turns` and `max_budget_usd`. Those are Agent SDK
options. `graph-run` is a skill dispatching subagents inside an interactive
session, not an SDK program, so neither lever exists here — and dollar cost is
not observable to a hook. The enforceable cap is tool calls per dispatch of a
node, which catches the runaway shape that actually burns a run: a node looping
on itself.

## Stated limits — recorded, not papered over

- **`bypassPermissions` is unverified.** The docs do not explicitly state that a
  hook deny survives it. A slice measures this against the running binary and
  records the result; the contract does not claim it until then.
- **The hook matches literals.** A path assembled at runtime evades it. This is
  the same limit the protected-path drift guard already states.
- **`graph-ledger-check.mjs` stays a self-report.** Its inputs are written by
  `graph-run` itself. REQ-157 closes that shape for node 6's slice criteria and
  does not close it for the ledger.
- **Workspace trust.** Project hooks require it. An untrusted checkout must
  surface that as a named condition, not as a silent no-op.
- **A `manual` criterion proves the check happened, not that it passed.** The
  hook observes the write of the observation line; the line's content is still
  the agent's word.
- **A missing run-state file degrades the cap.** The hook cannot attribute the
  call to a node, so the cap does not fire. It never blocks a run, and the
  condition is reported rather than silent.
- **A degraded cap degrades the heartbeat with it.** The heartbeat reads the
  hook's counter, so a missing run-state file leaves nothing to advance. That
  is reported as a degraded heartbeat rather than as a hook failure, and the
  preflight canary stays the binding proof.

## Non-goals

- Rewriting the node table, changing the lifecycle, or adopting a graph
  framework — the "graph shell, loop nodes" hybrid is settled
- Re-litigating what the source research confirms: the `define` gate, per-node
  checkpoints, fresh-subagent retries, parking instead of prompting
- Mid-run steering (`STEER.md`)
- Deleting `.claude/graph-profile.json`
- Adding the rule to `CLAUDE.md`
- Any product UI, API, prompt, provider, or data change

## Contract text this retires

- The protected-path reach table's raw-Bash row (`enforcement: none`)
- The two convention-only boundary notes (`nohup`, trailing `&`)
- The stray line naming `graph-ui-shape` / `graph-enrich-define` as domain node
  packs — never built, referenced exactly once, and the only frontend/backend
  split anywhere in the workflow. `graph-single-door-workflow`'s idea records
  the same deletion as belonging here, and DEC-166's impact list now names it,
  so one package owns it
- The env sentinel and the ledger's `Profile:` field survive, demoted from
  load-bearing to informational

## PRD references

- **DEC-166** — `PRD/sections/decisions/doc-process.md`, router line in
  `PRD/sections/decisions.md`

New IDs resume at REQ-152 / NFR-016 / FLOW-020 and run through REQ-159. REQ-146..151, NFR-015, and
FLOW-019 stay reserved for the 2026-08-17 leak preserved on
`rescue/fixture-leak-card-collection-20260817`, per DEC-164 and Q-005.

- **REQ-152** hook enforcement without a launch flag
- **REQ-153** two tiers gated by the run lock
- **REQ-154** kill switch with clean halt
- **REQ-155** node 7 no-write reviewer
- **REQ-156** per-node tool-call cap
- **REQ-157** default-FAIL slice criteria
- **REQ-158** no-pre-authorization re-read at every dispatch
- **REQ-159** hook liveness proven at run start and between nodes
- **NFR-016** always-on enforcement stays invisible to ordinary sessions
- **FLOW-020** owner halts a run in flight

No new screen or overlay, so no `PRD/sections/screen-layout.md` row.

## Source material

- `docs/whatIsGraph/graph-hardening-handoff.md` — findings, evidence, current
  state
- `docs/whatIsGraph/loop-vs-graph-engineering.md` — the research behind it
- Claude Code hooks reference — the `PreToolUse` contract, subagent firing, and
  deny forms this brief relies on

## Related work, not in this package

`graph-single-door-workflow` — collapsing the 14 invocable skills behind one
front door for ideas, observations, and bugs alike. Captured separately at
`PRD/work/graph-single-door-workflow/`. It rewrites the same contract for an
unrelated reason, so it lands after this.
