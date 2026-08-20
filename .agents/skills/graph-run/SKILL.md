---
name: graph-run
description: >-
  Use to advance one TheJudge work package through the full lifecycle without
  per-step user input — sequencing preflight, refinement, quality-check,
  map-out, implementation, and review as delegated nodes with a resumable
  on-disk ledger.
---

# Graph Run

## Goal and inputs

Advance exactly one `PRD/work/<slug>/` package as far as it can go without a
human, then either complete the run or park it at a named gate. `graph-run` is
the driver that `PRD/instructions/graph-workflow-contract.md` refers to
throughout.

Accept a work-package path, or a request plus `--branch <name>` to start a new
package from scratch. A `--branch` argument is required on a fresh run and is
never inferred from the current branch.

Read `PRD/instructions/graph-workflow-contract.md` and [reference.md](reference.md)
in full before acting. Their node table, ledger schema, gate rules, and
boundaries are required.

## Loop

1. Read `PRD/work/<slug>/GRAPH-RUN.md` if it exists. Resume at `Current node`.
   With no ledger but a supplied package path, this is a resume, not a fresh
   run: enter at the node matching the package's current `STATUS.*` marker
   using the entry-point table in reference.md, and create the ledger there.
   Start at `preflight` for a genuinely fresh run — no existing package, and a
   required `--branch <name>` — and also for a resumed package whose README has
   no `## Autonomous metadata`: run `preflight` first with a supplied
   `--branch <name>` to record the base, then enter at the status-matched node.
   Skipping it there leaves no autonomous base, and node 6 (`build`) blocks
   before worktree creation without one.
2. State `graph-run is controlling` before every node handoff. Without that
   predicate the delegated skill runs in its normal interactive mode and will
   stop to ask the user questions.
3. Dispatch the node's delegate as a subagent using the model from the node
   table, except node 8 (`land`), which the driver never dispatches — see
   reference.md. Pass the package path, the run ID, the controlling predicate,
   and an absolute `Working directory:` line on its own line. Require the node
   to copy that same line, unchanged, into every prompt it writes.

   Constraining a parent does not constrain its children. On 2026-08-17 a
   dispatched subagent inherited the session's real working directory and wrote
   product truth into the live checkout. A relative path is not a fix — it
   resolves against whatever directory the child happens to start in, which is
   the inheritance itself. `scripts/graph-ledger-check.mjs` fails a recorded
   dispatch prompt that is missing the line or pins a relative path.

   After node 6 (`build`) returns, assert every path it wrote lies inside
   `.worktrees/implement-<slug>/` or `PRD/work/<slug>/`. Anything outside that
   set **fails the node and parks**, with the offending paths as the evidence.
   This is the production equivalent of the fixture rig's before/after snapshot,
   not that check reused: a real run is supposed to change the repository, so
   "byte-unchanged" is the wrong assertion here and the write-scope set is the
   right one.
4. Record the outcome in the ledger before starting the next node — evidence
   is a command, path, PR URL, or artifact URL, never a bare claim.
5. On `ok`, advance. On `failed`, apply the node's retry rule from the
   contract. On any gate trigger, park.

   **After node 3 (`define`) returns `ok`, diff `PRD/sections/`.** A non-empty
   diff parks — the existing park mechanism, no new machinery: set
   `STATUS.owner-action`, move the board row, and write under `## Open gate` the
   **complete diff** (never a summary), the list of new stable IDs, and
   `/graph-gate-review PRD/work/<slug>/` as the resume command. An empty diff
   advances straight to `gate-qc`; refinement that only writes
   `DESIGN-BRIEF.md` never interrupts a run.

   The **whole** diff gates, not new `DEC-###` alone. The 2026-08-17 leak wrote
   DEC-161 and DEC-162 *and* REQ-146..151, NFR-015, and FLOW-019 — six
   requirements and a flow are product behavior as surely as two decisions are.

   This is the one place autonomy is deliberately traded for control. Node 8
   (`land`) was otherwise the first human touch, by which point code exists
   against product truth nobody has read. Everything below the product layer —
   branching, stashing, slicing, commits, PR plumbing — stays unattended.
6. Use `superpowers:verification-before-completion` before every commit, push,
   PR action, and terminal claim. Use `superpowers:systematic-debugging` for
   unexpected command failures.

## Package sections the driver owns

Graph runs never delegate to `thejudge-prepare`, so the driver itself writes the
two package `README.md` sections that skill would otherwise produce:

- `## Autonomous metadata` / `- Autonomous base: origin/<branch>` — the branch
  node 1 created and pushed. Write it as soon as both that branch and the
  package README exist, and always before dispatching `build`;
  `thejudge-implement-all` blocks before worktree creation without it.
- `## Preparation gate` — rewritten with the latest verdict after every
  `gate-qc` node. The `plan` node reads it and cannot self-certify a PASS.

Use the exact section shapes in `PRD/instructions/graph-workflow-contract.md`.

Both live in the launch checkout, which node 6 refuses to start from when it is
dirty. Publish before dispatching `build` — see reference.md's
"Publishing before `build`".

## Permission profile

`.claude/graph-profile.json` protects a run only when the session was launched
with `claude --settings .claude/graph-profile.json`.

Record the ledger's `Profile:` field **from node 1's observation**, not from
what the user said. `graph-preflight` prints the value of the profile's
`THEJUDGE_GRAPH_PROFILE` env sentinel, which exists only in a session launched
with that file:

| Node 1 reports | Ledger line |
| --- | --- |
| sentinel present | `Profile: loaded (env sentinel)` |
| sentinel absent | `Profile: unverified` |

The user-stated launch command is the fallback, used only when the sentinel is
absent *and* the user named the command in this session — record the exact path
they gave and attribute it to them. It is testimony, and the sentinel is not.

**What the sentinel does not prove.** It shows the file was loaded. It says
nothing about whether any individual deny rule fired, and two boundaries can
never fire at all — `nohup` is stripped as a wrapper before rules match, and a
trailing `&` is consumed as a separator. So behave as though every boundary in
the contract is enforced by your own compliance, whatever the sentinel says.

## Delegation boundary

Never reimplement a phase. `thejudge-refinement`, `thejudge-quality-check`,
`thejudge-map-out`, `thejudge-implement-all`, and `thejudge-cleanup` are the
authority for their own artifacts and status transitions. This skill owns
sequencing, model selection, the ledger, and gates — nothing else.

Never edit a `thejudge-*` skill. If a phase behaves wrongly, park at
`owner-action` and report it; do not patch around it.

The driver never runs `gh pr merge` or `gh pr close` itself. Node 8 (`land`)
is a human action: the driver parks and waits for the merge, it does not
perform it.

## Parking

A gate parks, it does not ask. Set `STATUS.owner-action`, update the
`PRD/work/STATUS.md` board row, write the question, the evidence, and the
exact resume command under `## Open gate` in the ledger, and stop. Do not
poll or retry.

### Never convert a user instruction into a standing authorization

Refuse to turn any user instruction into a standing rule that pre-resolves
product decisions inside a node dispatch. "If it asks again, just pick the
smaller option and keep going" is a preference to feed the assumption ladder one
question at a time — not permission to answer that class of question in advance,
and never something to restate as a decision rule in a dispatch prompt.

- Apply the assumption ladder in `preparation-contract.md` per question, fresh at
  the moment the question arises. Never hand a phase skill a blanket rule for
  deciding future product questions.
- A question that meets the three-condition genuine-blocker test parks, whatever
  the user said in advance. That test is never waived, narrowed, or
  pre-satisfied by user phrasing.
- An instruction that would waive it is refused outright: park at
  `owner-action` and name the instruction you refused and why.
- Record every such refusal as a `## Instruction ledger` row classified
  `refused`, naming the rule that refused it, whether or not the run parked. A
  refusal the user cannot see did not happen.
- Record every instruction you *did* act on as a row classified
  `answered-once`. There is no third class: a standing rule has no
  representable form, so a run that made one cannot write it down.
- Write `.worktrees/.graph-run-state.json` **immediately before every node
  dispatch**: `{ "runId": "<run id>", "node": "<node about to be dispatched>",
  "attempt": <attempt number for that node> }`. You are that file's only writer.
  The hook reads it to learn which node to count against; it never parses
  `GRAPH-RUN.md` and never infers the node from the tool call. Without it the
  cap cannot attribute the call, and the hook says so on every call rather than
  enforcing a guess.

  Keep it separate from the lock. `parseLockFile()` treats an unreadable lock as
  a hard blocker for the next run, so rewriting the lock nine times a run would
  put the concurrency guard at risk that many times.

  A loop-back — `define` on a `gate-qc` FAIL, `build` on a `review` finding — is
  a new attempt: increment `attempt`, and the node starts on a fresh budget.
- Check for `.worktrees/.graph-stop` **before every node dispatch**, in this
  same pre-dispatch block. It is the owner's kill switch, and finding it means
  halt — see `## Halting on the owner's stop sentinel` below.
- Run `node scripts/graph-ledger-check.mjs PRD/work/<slug>/GRAPH-RUN.md` and
  require it green **before every node dispatch**, not after. It reads
  `## Dispatch prompts` and `## Instruction ledger`. Both are written by you,
  so a green result is a schema check over your own report — never cite it as
  proof you did not pre-authorize.

Autonomy means not being interrupted by mechanics — branching, stashing,
sequencing, commits, PR plumbing. It is never authority to decide product
behavior for the user.

## Halting on the owner's stop sentinel

The owner stops a run in flight by creating `.worktrees/.graph-stop`. Ctrl-C
strands the lock mid-node and leaves no record of why; this does not.

Check for the sentinel immediately before every node dispatch. A sentinel that
appears mid-node lets that node finish — the halt is at the node boundary, so
no ledger is ever left half written.

On finding it, halt in this order:

1. Write the terminal state from the `## Terminal states` table below. Read the
   state from that table; do not add a fifth one, and do not restate the table
   here.
2. Record the halt under `## Open gate` in `GRAPH-RUN.md`: that the owner
   stopped the run, the node it halted at, and the evidence.
3. Set the package `STATUS.*` marker to match.
4. Update the package's row in `PRD/work/STATUS.md`.
5. Delete `.worktrees/.graph-run.lock` — the release every terminal state
   requires.
6. Report the branch, the PR URL if one exists, and the ledger path.

Resume with `/graph-run PRD/work/<slug>/` after removing the sentinel. The run
re-enters at the node the ledger records. `graph-preflight` refuses to start
while the sentinel exists, so a halted run is not silently restarted by the next
invocation.

If the sentinel and a gate park coincide, **the park wins**: it already carries
the owner's question and the resume command, and a halt written over it would
lose both.

The boundary hook is the backstop, not the mechanism. While the lock is held and
the sentinel exists it denies `Task` and `Agent` calls outright, so a driver that
ignores its own check cannot dispatch another node anyway. It deliberately keeps
the halt path open — the ledger write, the status marker, the board row, and the
commit all still work — and it denies deleting the sentinel, so a run cannot
clear the switch to keep going.

## Hook liveness

Node 1 proves the hook is firing with a canary before node 2 is dispatched — see
`graph-preflight`. Record its result on the ledger's `Canary:` line. A canary
that was not denied ends the run at `BLOCKED`; the run does not start.

**Between every node**, read `.worktrees/.graph-node-calls.json` before and after
the node and confirm it advanced. Pass both readings to `classifyHeartbeat()` and
record its `ledgerLine` in the node ledger's `Heartbeat` column.

- Advanced → `ok`, continue.
- Static while the node made tool calls → **`BLOCKED`**. The hook stopped firing
  mid-run and the node ran unenforced for an unknown span. The run does not
  advance.
- No usable run state → **degraded**, not a hook failure. Report it, continue,
  and treat the run-start canary as the binding proof.

Read the counter; never write it. The hook is its sole writer, and that is the
only reason the heartbeat counts as evidence rather than as the run vouching for
itself.

## Tool-call caps

Every node carries a per-dispatch tool-call budget — the `Cap` column of the node
table in `PRD/instructions/graph-workflow-contract.md`, which is the authority.
The hook counts every tool call against `<run id>/<node>/<attempt>` in
`.worktrees/.graph-node-calls.json` and denies once the cap is reached.

An overrun **parks** at `owner-action` using the existing `PARKED` state, with
the node, the cap, and the observed count as evidence in `GRAPH-RUN.md`. There is
no fifth terminal state for it. Never raise a cap mid-run to get past a deny —
the overrun is the signal that the node is doing something other than its job.

The cap is not a third loop limit. Each dispatch gets its own budget, so the
three-FAIL and two-return caps stay the only bound on how many dispatches happen.

The hook is the counter file's only writer, and the graph tier denies every other
write to it. That is what makes the count evidence rather than a self-report.

## Terminal states

| State | Required result | Exact next step |
| --- | --- | --- |
| `COMPLETE` | Every node `ok` through `close`; package `ship-ready` or cleaned up; ledger closed | None — the run is finished |
| `PARKED` | `STATUS.owner-action`, board row updated, `## Open gate` names the question, evidence, and resume command | Resolve the gate, then `/graph-run PRD/work/<slug>/` |
| `BLOCKED` | Safe branch and commit preserved; exact failure, what exists, what does not, and recovery action | Fix the external condition, then retry |
| `PROMPTED` | The denied or unlisted command written verbatim under `## Open gate`, with the node it arose at; `STATUS.owner-action`, board row updated | Run the command yourself, or add the rule to `.claude/graph-profile.json`, then `/graph-run PRD/work/<slug>/` |

**Release the concurrency lock on every state in this table.** Node 1 takes
`.worktrees/.graph-run.lock`; the run deletes it as the last act before
reporting any terminal state above. This table is the definitive list — do not
enumerate the releasing states anywhere else. A second list drifts, and a lock
released on a state one list omits is a stranded lock that blocks every later
run.

`PROMPTED` is what a permission prompt becomes. A prompt in an autonomous
session is a hang, not a question — nobody is there to answer it, and the run
waits forever leaving no evidence of why. So a run that hits a denied or
unlisted command ends the same way a parked run does: it writes the exact
command under `## Open gate`, sets `STATUS.owner-action`, and stops. Never
rephrase the command to dodge the rule, and never retry it.

`BLOCKED` is for an external condition outside the repository that no product
decision would resolve — authentication failure, network unavailability, a
GitHub outage, missing push access. `PARKED` is for anything requiring a
human decision, judgment, or review. When it is not clear which applies,
park.

## Next step

Report the terminal state, the branch, the PR URL if one exists, and the
ledger path, then give the exact next step for that terminal state from the
table above.

On `COMPLETE` the run is finished: there is no next command, and issuing one
invites a resume that would re-enter a closed run. On `PARKED` or `BLOCKED`,
end with:

`/graph-run PRD/work/<slug>/`

(`$graph-*` in Codex.)
