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

Accept a work-package path, or a request plus optional `--branch <name>` and
`--run-id <id>` to start a new package from scratch. On a fresh run, propose a
kebab-case slug from the request and any intake material before dispatching
node 1, and derive the branch as `thejudge-auto/<slug>` — the convention
already in the repository's merge history. A supplied `--branch` is used
verbatim and overrides derivation without changing the slug node 2 receives;
it is never inferred from the current branch. Mint the `--run-id` before node
1 when none is supplied, and pass that same id to `graph-preflight`. Pass the
proposed (or supplied-override) slug to node 2, so the branch and the package
share one name instead of being named independently at two nodes. A branch
collision surfaces as `graph-preflight`'s existing exit-code-2 condition;
report it with the derived name — never retry silently or invent a variant.

## Intake

Accept zero or more file paths alongside the request, and markdown pasted in
the same message: `/graph-run "<request>" [paths...]`. A supplied path that
does not exist or cannot be read is reported **before node 1** — the run does
not start on partial material.

Write each accepted item **verbatim** into
`.worktrees/.graph-intake/<run-id>/` before node 1 is dispatched, using the
run id minted above. The staging path is derived from that id.

**Why outside the working tree:** node 1 resolves the working tree before the
branch exists. `classifyWorkingTree` in `scripts/graph-preflight.mjs:99-113`
stashes a tree over 10 files or 200 changed lines, the untracked scan at line
213 feeds it, and line 246 stashes with `git stash push -u`. Intake written
into the package up front would be stashed off before the branch exists,
leaving node 2 an empty folder; under the threshold it would land only as a
side effect of `chore(graph): auto-commit working tree before graph run`. The
same sweep takes the untracked **source** file too, so the copy staged at
launch, outside the working tree, is the only one the run is guaranteed to
read. `.worktrees/` is gitignored and `git stash push -u` spares ignored
paths, which is why staging lives there.

Intake is copied, never referenced in place, and carries no size gate: a gate
would refuse exactly the thorough handoff this accepts.

Read `PRD/instructions/graph-workflow-contract.md` and [reference.md](reference.md)
in full before acting. Their node table, ledger schema, gate rules, and
boundaries are required.

## Loop

1. Read `PRD/work/<slug>/GRAPH-RUN.md` if it exists. Resume at `Current node`.
   With no ledger but a supplied package path, this is a resume, not a fresh
   run: enter at the node matching the package's current `STATUS.*` marker
   using the entry-point table in reference.md, and create the ledger there.

   **A resume takes the lock before it does anything else.** It never re-runs
   the branch and stash work, so nothing along that path arms the graph tier.
   Run `graph-preflight --take-lock --slug <slug> --run-id <id>`, then issue
   `GRAPH_CANARY_COMMAND` and require a deny. Before 2026-08-24 no step existed
   for this at all, and a resumed run advanced with caps, protected-path
   blocking, evidence checks, and stop-sentinel protection all switched off.
   Start at `preflight` for a genuinely fresh run — no existing package, with
   `--branch` and `--run-id` optional as described above — and also for a
   resumed package whose README has
   no `## Autonomous metadata`: run `preflight` first with a supplied
   `--branch <name>` to record the base, then enter at the status-matched node.
   Skipping it there leaves no autonomous base, and node 6 (`build`) blocks
   before worktree creation without one.
2. State `graph-run is controlling` before every node handoff. Without that
   predicate the delegated skill runs in its normal interactive mode and will
   stop to ask the user questions.
3. Dispatch the node's delegate as a subagent using the model from the node
   table, except node 8 (`land`), which the driver never dispatches — see
   reference.md. Node 7 is not a skill: it is a no-write reviewer subagent whose
   exact dispatch shape is in reference.md under `## Node 7 dispatch shape`. Pass the package path, the run ID, the controlling predicate,
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
   diff no longer parks live. Write `PRD/work/<slug>/GATE-QUESTIONS.md` — one
   `## <STABLE-ID>` block per new stable ID, each opening with the gate-question
   plain-language block from `PRD/instructions/plain-language-standard.md`
   (*What this decides · In plain terms · What happens if you say no*, with every
   cited `DEC`/`REQ` inlined and any technical term defined in the same breath),
   then that ID's **complete diff** (never a summary), and an `accept/edit/reject`
   answer slot — then **continue** to `gate-qc`. The owner must be able to answer
   each block without opening a file to decode an ID: that is the founding pain
   this gate exists to fix. An empty diff writes no questions file; refinement
   that only writes `DESIGN-BRIEF.md` produces no gate at all. The exact file
   format is in `graph-workflow-contract.md` under `## The two runs`.

   The **whole** diff gates — every new stable ID gets its own slot, not the
   headline ones alone. The 2026-08-17 leak wrote two decisions *and*
   REQ-146..151, NFR-015, and FLOW-019 — six requirements and a flow are product
   behavior as surely as the decisions were. Decisions are retired now, so new
   truth is `REQ`/`FLOW` written into the feature specs, and every one of those
   gets a slot.

   This is the one place autonomy is deliberately traded for control, now made
   off the terminal: the owner answers the file on their own schedule between the
   two runs (see `## The two runs` below). Node 8 (`land`) was otherwise the first
   human touch, by which point code exists against product truth nobody has read.
   Everything below the product layer — branching, stashing, slicing, commits, PR
   plumbing — stays unattended.
6. Use `superpowers:verification-before-completion` before every commit, push,
   PR action, and terminal claim. Use `superpowers:systematic-debugging` for
   unexpected command failures.

## The two runs

A graph run reaches the owner as two owner-triggered runs. Which run this is is
read from the entry point, not a flag.

**Run one** is the fresh run — the one that began at `preflight`. It drives
`preflight → shape → define → gate-qc` and **stops at the first `gate-qc` PASS**
instead of advancing to `plan`. A `gate-qc` FAIL still loops to `define` (max
three) as normal; only PASS stops. To stop, run one:

1. Publishes the design to the base branch — `DESIGN-BRIEF.md`, any
   `PRD/sections/` truth, `GATE-QUESTIONS.md` (when the define diff was
   non-empty), the package `README.md` (with `## Autonomous metadata` and
   `## Preparation gate`), and the ledger — committed and pushed to
   `origin/<autonomous base>`.
2. Opens the **docs-only base→main PR**:
   `gh pr create --base main --head thejudge-auto/<slug>`. This *creates* a PR; it
   never merges one, so no boundary is crossed. Record its URL in the ledger. It
   is the PR the implementation grows into and the owner merges last — the
   base→main hop `graph-preflight`'s guard makes un-skippable for the next fresh
   run. The `--body` opens with the PR-body plain-language block from
   `PRD/instructions/plain-language-standard.md` — *What this is · What you need
   to do · What it changes* — so the owner sees, at the top of the PR, that this
   is a docs-only design PR, that their action is to answer `GATE-QUESTIONS.md`
   and hold the PR open (not merge yet), and what product truth it proposes;
   the design brief, sections diff, and ledger stay in the body below it.
3. Parks at `owner-action`: set the marker, update the board row, and write under
   `## Open gate` either "answer `GATE-QUESTIONS.md`, then resume" (with the file
   path) or, on an empty diff, "review the docs PR, then resume to implement" —
   with `/graph-run PRD/work/<slug>/` as the resume command in both cases. End.

**Run two** is `/graph-run PRD/work/<slug>/` resuming that `owner-action` park.
Before re-entering the node graph it resolves the gate:

- **`GATE-QUESTIONS.md` fully answered** → dispatch `graph-gate-review` to apply
  the accept/edit/reject verdicts. It restores `STATUS.refined`. Then re-enter at
  `gate-qc` via the entry-point table, so an owner edit is re-graded, and continue
  `plan → build → review → land → close`.
- **any answer slot still blank** → re-park at `owner-action` unchanged and end.
  The gate is not resolved, so run two stays a single owner command with nothing
  to guess.
- **no `GATE-QUESTIONS.md`** (run one's diff was empty) → nothing to apply;
  restore `STATUS.refined`, re-enter at `gate-qc`, and continue.

The base→main PR opened in run one stays the owner's to merge and stays open
across both runs; the run never merges it.

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

The `## Open gate` write and the board row are owner-facing, so both follow
`PRD/instructions/plain-language-standard.md`: open with what the owner must do,
say in plain product terms what stopped the run and what happens next, and inline
the substance of any `DEC`/`REQ` you name rather than leaving a bare ID.

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
- Every dispatch runs the ordered `## Pre-dispatch sequence` below first. Step 2
  of it re-reads this rule from the contract, because a rule held only in context
  is a rule compaction can take away halfway through a long run.

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
5. Declare the terminal state, then delete `.worktrees/.graph-run.lock` — the
   release every terminal state requires. Write
   `.worktrees/.graph-run-release.json` first, in its own tool call, in the
   exact shape `## Terminal states` gives; the hook denies removing a live lock
   without it. That record is what makes the release *declared* rather than
   silent — it does not authorise the release, and the rule says so.
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

## Pre-dispatch sequence

One ordered block, run before **every** node dispatch — not once at run start.
Three of these steps used to sit in three different places; scattered
instructions are how a step gets skipped on the seventh node of a nine-node run.

1. **Kill switch.** Check for `.worktrees/.graph-stop`. Present → halt at this
   boundary; see `## Halting on the owner's stop sentinel`.
2. **Re-read the no-pre-authorization rule.** Read
   `### No pre-authorization of product decisions` from
   `PRD/instructions/graph-workflow-contract.md`, by that exact heading, and hold
   it while writing this dispatch prompt.

   Read it **every time**, not once at run start. The failure this prevents is
   specific: on a long run the rule falls out of context to compaction, and the
   node where it matters most is the one furthest from where it was read.

   The rule's text lives in the contract and nowhere else. This file points at
   it; it does not restate it. A second copy drifts, and then two rules disagree
   about what the driver may do. If that heading ever stops existing, this step
   fails loudly rather than quietly reading nothing — which is why it names the
   heading rather than a line number or a vague "the boundaries section".

   It is deliberately **not** in `CLAUDE.md`. It governs autonomous runs, not
   every ordinary session in this repository, and that file is diluted enough.
3. **Ledger check.** Run
   `node scripts/graph-ledger-check.mjs PRD/work/<slug>/GRAPH-RUN.md` and require
   it green. It reads `## Dispatch prompts` and `## Instruction ledger`. Both are
   written by you, so a green result is a schema check over your own report —
   never cite it as proof you did not pre-authorize.
4. **Run-state write.** Write `.worktrees/.graph-run-state.json`:
   `{ "runId": "<run id>", "node": "<node about to be dispatched>", "attempt":
   <attempt number for that node> }`. You are that file's only writer. The hook
   reads it to learn which node to count against; it never parses `GRAPH-RUN.md`
   and never infers the node from the tool call. Without it the cap cannot
   attribute the call, and the hook says so on every call rather than enforcing a
   guess.

   Keep it separate from the lock. `parseLockFile()` treats an unreadable lock as
   a hard blocker for the next run, so rewriting the lock nine times a run would
   put the concurrency guard at risk that many times.

   A loop-back — `define` on a `gate-qc` FAIL, `build` on a `review` finding — is
   a new attempt: increment `attempt`, and the node starts on a fresh budget.
5. **Dispatch.** Only now.

## Hook liveness

Node 1 proves the hook is firing with a canary before node 2 is dispatched — see
`graph-preflight`. Record its result on the ledger's `Canary:` line. A canary
that was not denied ends the run at `BLOCKED`; the run does not start.

**Two canaries, and only one of them proves the tier.** `CANARY_COMMAND` is a
universal-tier deny: it fires in every session, so it says the hook is loaded and
says nothing about whether the graph tier is armed. `GRAPH_CANARY_COMMAND` is
denied only while the lock is held. Issue it after the lock is taken and record
its `classifyGraphCanary()` line beside the first. An allowed graph canary is
`BLOCKED` on the same terms — a live hook over a disarmed tier is what a missing
lock looks like from the inside, and it is what went unnoticed on 2026-08-23.

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

**The park is writable, and bounded.** At the cap the hook denies `Task` and
`Agent` outright — no further node, ever — and allows `PARK_GRACE_CALLS` (30)
more calls so the park can actually be written. Past cap + grace every call is
denied and the run stops where it stands.

That carve-out exists because until 2026-08-24 there was none: at the cap every
tool was denied, including `Read`, so the park this section demands could not be
written at all. A session hit it and could not record why it had stopped — the
one thing an overrun most needs to leave behind. The stop sentinel already had
the right shape (`dispatch-after-stop` denies dispatches and deliberately leaves
the halt path open); the cap now matches it. Spend the grace on the park and
nothing else.

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
`.worktrees/.graph-run.lock`; the run declares its terminal state in
`.worktrees/.graph-run-release.json` and then deletes the lock as the last act before
reporting any terminal state above. This table is the definitive list — do not
enumerate the releasing states anywhere else. A second list drifts, and a lock
released on a state one list omits is a stranded lock that blocks every later
run.

**The release record's exact shape**, because the hook matches keys, not
intent:

```json
{ "runId": "<this run's id>", "state": "COMPLETE | PARKED | BLOCKED | PROMPTED" }
```

Both keys are required, both are non-empty strings, and `runId` must equal the
`runId` in the live lock. `releasesOwnLock()` in
`scripts/lib/boundary-rules.mjs` is the decision, and it reads `state` — not
`terminalState`. Extra keys are ignored, so `slug`, `node`, or a reason line
can ride along freely.

Write that file in **its own tool call**, before the call that removes the
lock. A single compound command is one tool call, so the hook evaluates the
removal against the disk as it stood before any of it ran — and denies.

A wrong key is recoverable: correct the record and issue the removal again.
`run-lock-removal` is a remediable rule, so the retry guard below steps aside
and the rule itself re-decides against the disk as it now stands. It is the only
place in this workflow where a second attempt at a denied call is the right
move, and it is right only because the denial named the thing to go and do.

Observed 2026-08-24 on `life-tracker-spec`, before that carve-out existed: a
record written with `terminalState` stranded the lock, the corrected retry was
refused, and the owner removed the lock by hand.

**A denied call is never retried.** The hook records every denial it issues for
the run and refuses an identical later call as `denied-command-retry`, naming the
rule that first refused it. On 2026-08-23 a push was refused, the build node ran
the same command again, and the second attempt went through — a guardrail cleared
by a second attempt is not a guardrail. On that rule, park: the command and its
original denial are the evidence.

**The one exception is a rule whose denial named a remedy** — today that is
`run-lock-removal` alone, listed in `REMEDIABLE_RULES` in
`scripts/lib/boundary-rules.mjs`. A rule shaped "do X first, then this is
permitted" is not cleared by a second attempt; it is *satisfied* by doing X. So
the guard stands aside and the original rule decides again. Do X, retry once,
and read what comes back: still denied means the remedy is still missing, and
the reason says which part. Never read this as licence to retry anything else.

Its limit, stated rather than implied: this covers denials **the hook issued**.
The 2026-08-23 block came from the harness's own permission classifier, which the
hook never sees, so that exact path is closed by discipline and by `PROMPTED`,
not by the rule.

`PROMPTED` is what a permission prompt becomes. A prompt in an autonomous
session is a hang, not a question — nobody is there to answer it, and the run
waits forever leaving no evidence of why. So a run that hits a denied or
unlisted command ends the same way a parked run does: it writes the exact
command under `## Open gate`, sets `STATUS.owner-action`, and stops. Never
rephrase the command to dodge the rule, and never retry it.

`BLOCKED` is for an external condition outside the repository that no product
decision would resolve — authentication failure, network unavailability, a
GitHub outage, missing push access — and for a request node 2 cannot turn into
an actionable package (`NO ACTIONABLE PACKAGE`, the same outcome
`thejudge-kickoff` and `thejudge-prepare` already have). `PARKED` is for
anything requiring a human decision, judgment, or review over an existing
artifact. When it is not clear which applies, park.

A thin request is `BLOCKED`, not `PARKED`. `PARKED` means the run resumes from
a recorded gate, and a thin request leaves no artifact to resume from.
Mechanically, parking needs a package folder for `## Open gate`, a `STATUS.*`
marker, and a board row — none exists, because `thejudge-kickoff` returns
`NO ACTIONABLE PACKAGE` without creating them, and intake stays staged outside
the working tree until node 2 creates the package folder.

Node 1 runs before node 2 can judge the request, so this `BLOCKED` always
leaves a pushed `thejudge-auto/<slug>` behind. The report names that branch,
states whether node 1 auto-committed or stashed the working tree, and names
the staging path holding any intake. The run does not delete the branch —
`graph-preflight`'s contract forbids tidying a failed run, and node 1 may have
auto-committed real working-tree changes onto it. The recovery action is a
fuller description or intake material **plus an explicit `--branch`**,
because the same description derives the same slug and `graph-preflight`
exits 2 on the collision (`.claude/skills/graph-preflight/SKILL.md:118`).

## Next step

Report the terminal state, the branch, the PR URL if one exists, and the
ledger path, then give the exact next step for that terminal state from the
table above.

On `COMPLETE` the run is finished: there is no next command, and issuing one
invites a resume that would re-enter a closed run. On `PARKED` or `BLOCKED`,
end with:

`/graph-run PRD/work/<slug>/`

(`$graph-*` in Codex.)
