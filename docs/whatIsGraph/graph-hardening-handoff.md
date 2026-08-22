# Handoff — graph-run boundary enforcement

Source material: `docs/whatIsGraph/loop-vs-graph-engineering.md` (1,230 lines,
compiled 17 Aug 2026) and its companion explorer HTML. Section numbers below
refer to that file.

This document exists to be read once at kickoff and then to feed refinement.
It carries the findings, the evidence, the grounded "what is true today"
statements, and the questions refinement will need answered. Nothing here is a
decision — refinement makes those with the owner.

Proposed slug: `graph-run-boundary-enforcement`

---

## The idea, in kickoff's shape

**Problem.** An autonomous graph run's safety boundaries are mostly convention.
The permission profile that enforces them is inert unless the session was
launched with `--settings`, one whole class of writes (raw Bash) has no
enforcement at all by the contract's own admission, the code reviewer at node 7
grades work it helped produce, and the owner has no way to stop or steer a
running graph short of Ctrl-C.

**Outcome.** Every boundary in `graph-workflow-contract.md` is enforced by a
mechanism that fires whether or not anyone remembered a launch flag; node 7's
independence is real rather than nominal; and the owner can halt a run in
flight.

**Non-goals.** Not rewriting the node table. Not changing the lifecycle. Not
adopting a graph framework — the workflow is already a hybrid of the shape the
source doc calls "graph shell, loop nodes," and that choice is settled.

---

## What is already right — do not re-litigate

The source doc validates most of the current design. Refinement should treat
these as confirmed, not as open scope.

- **The `define` gate is the highest-leverage thing in the workflow.** MAST
  (arXiv:2503.13657, Berkeley, 1,600+ annotated traces, Cohen's kappa 0.88)
  attributes **44.2% of multi-agent failures to specification** — the graph
  author's bug, not the model's. Parking on a non-empty `PRD/sections/` diff is
  the direct countermeasure. (§4.4)
- **Per-node checkpoints are correctly sized.** METR's 80% success horizon —
  the one you can actually ship — was about 27 minutes for Opus 4.5 and roughly
  70 minutes for the Aug 2026 figures, against 50% horizons roughly 10x longer.
  A full graph run far exceeds that, which is exactly why it checkpoints per
  node rather than running as one long session. (§4.3)
- **Dispatching each retry as a fresh subagent is load-bearing, not incidental.**
  Sinha et al. (arXiv:2509.09677, ICLR 2026) measured **self-conditioning**:
  models become likelier to err when their own prior errors sit in context, and
  this does not go away with scale. `gate-qc` loops to `define` up to three
  times and `review` loops to `build` up to twice; a fresh context per retry is
  what keeps those loops from compounding. Worth stating as a rationale in the
  contract so nobody "optimizes" it away.
- **Parking instead of asking is correct.** A permission prompt in an
  unattended session is a hang, which the `PROMPTED` terminal state already
  handles.

---

## Findings, ranked

### 1. Move the boundaries from the profile into hooks — highest leverage

**Today.** `PRD/instructions/graph-workflow-contract.md` states plainly that
`.claude/graph-profile.json` enforces the boundary list "**only in a session
launched with** `claude --settings .claude/graph-profile.json`," and that in a
session started without it "every entry in the profile is inert and the list
above is convention only." The protected-paths reach table has three rows; its
third reads: raw Bash (`cp`, `rsync`, redirection) — enforcement **none** —
reach **convention**, "never claimed as enforced." Two further boundaries can
never fire even with the profile loaded: `nohup` is stripped as a wrapper
before rules match, and a trailing `&` is consumed as a separator before any
rule sees the command text.

**What the doc adds (§6.6).** Hooks are the mechanism for graph-like guarantees
without a graph. The architecturally important property, quoted: "Hooks run in
your application process, not inside the agent's context window, so they don't
consume context. Hooks can also short-circuit the loop: a `PreToolUse` hook that
rejects a tool call prevents it from executing, and Claude receives the
rejection message instead." Precedence across multiple hooks is
`deny > defer > ask > allow` — any `deny` blocks regardless of the others.
Multiple matching hooks run in parallel with nondeterministic completion order.

**Proposed change.** A `PreToolUse` hook, configured in the project's
`.claude/settings.json` rather than a profile passed at launch, that inspects
the command or file path and denies the contract's boundary set. It fires
whether or not anyone remembered the flag. Because it reads the command text
itself rather than matching a rule pattern, it can also catch the `cp` / `rsync`
/ redirection writes into protected paths that currently have no enforcement,
and it can see a `nohup` wrapper the rule matcher strips.

**What this retires.** The `Profile: unverified` field and the env-sentinel
mechanism become far less load-bearing. Refinement should decide whether they
survive as belt-and-braces or get removed.

### 2. Node 7's reviewer needs no write tools and a narrow brief

**Today.** The contract states that node 7's `superpowers:requesting-code-review`
is "deliberately **not**" on the predicate list, and that "its independence is
nominal and recorded as a stated limit rather than papered over."

**What the doc adds (§6.8, gate 4).** The named failure is **self-preferential
bias** — Anthropic documents models "confidently praising the work — even when
quality is obviously mediocre," and describes the tendency to "prefer its own
results or findings, especially when asked to verify or judge them against a
rubric." The fix is a fresh-context adversarial evaluator: a subagent **with no
Write/Edit tools** that grades from a context window which never saw the build.

The doc pairs it with a counter-warning that matters more here than usual,
because `review` may only loop to `build` twice before parking: "A reviewer
prompted to find gaps will usually report some, even when the work is sound,
because that is what it was asked to do. Chasing every finding leads to
over-engineering... Tell the reviewer to flag only gaps that affect correctness
or the stated requirements."

**Evidence it pays.** MAST's interventions: adding a high-level task
verification step gained **+15.6%**; improving role specification gained
**+9.4%**. Task verification and termination account for 23.5% of multi-agent
failures.

**Proposed change.** Node 7 dispatches a no-write reviewer whose brief names
the slice's stated requirements as the grading rubric and instructs it to flag
only correctness-or-requirements gaps.

### 3. A kill switch

**Today.** Node 1 takes `.worktrees/.graph-run.lock`. There is no counterpart
that stops a run. The owner's only in-flight lever is Ctrl-C, which leaves the
lock held and the ledger mid-node.

**What the doc adds (§6.9).** From Anthropic's long-running-agents reference
repo (`github.com/anthropics/cwc-long-running-agents`): a `kill-switch.sh` hook
that halts every tool call while an `AGENT_STOP` file exists, and a `steer.sh`
hook that surfaces `STEER.md` mid-run so a running loop can be redirected
without being killed.

**Proposed change.** A sentinel file beside the existing lock —
`.worktrees/.graph-stop` — checked by the same `PreToolUse` hook from finding 1.
On halt the run writes the terminal state and releases the lock rather than
dying mid-node.

**The steer half needs care.** A `STEER.md` read mid-run is a user instruction
arriving inside an autonomous run, which is exactly what the "no
pre-authorization of product decisions" rule governs. If steer ships, every
line it carries needs an `## Instruction ledger` row classified `answered-once`
or `refused`, same as any other instruction. That constraint is what makes it
safe; it is also an argument for shipping stop first and steer later.

### 4. No run has a spend or turn cap

**Today.** The contract's `## Boundaries` section governs *what* a run may do.
Nothing governs *how much*. There is no turn cap, no budget cap, and no
runaway stop anywhere in `graph-run/SKILL.md` or the contract.

**What the doc adds (§2.3, §8).** `max_turns` counts tool-use turns only and
yields `error_max_turns`. `max_budget_usd` is compared against `total_cost_usd`
and **subagent spend counts toward it** — directly relevant to a driver whose
entire job is dispatching subagents. `AgentDefinition.maxTurns` gives a
per-subagent cap. The SDK docs are blunt: "Setting a budget is a good default
for production agents."

Cost context: agents run roughly 4x the tokens of chat, multi-agent roughly
15x, and a KV-cache miss costs 10x a hit ($3.00 vs $0.30/MTok on Sonnet)
against a typical ~100:1 input:output ratio. Nodes 3 and 7 run on opus.

**Proposed change.** A per-node cap in the node table and a run-level budget
recorded in the ledger. Exceeding either becomes a new gate trigger that parks
rather than a silent overrun.

### 5. The no-pre-authorization rule is compaction-fragile

**Today.** The rule lives in `graph-workflow-contract.md` and
`graph-run/SKILL.md`, both read once at run start.

**What the doc adds (§2.3).** "Compaction drops early instructions." The SDK
docs, quoted: "Persistent rules belong in CLAUDE.md ... because CLAUDE.md
content is re-injected on every request." The doc's warning is specific: a
critical constraint placed only in the opening prompt of a long-running loop
"will silently evaporate around hour two."

A graph run is exactly that shape. The rule most likely to evaporate is the one
written to prevent the 2026-08-17 failure.

**Proposed change.** Either a line in `CLAUDE.md`, or an explicit re-read of the
rule at each node dispatch. Refinement picks — `CLAUDE.md` has its own dilution
cost ("over-long CLAUDE.md leads to rules getting ignored," §2.4).

### 6. Node 6's `ok` is a self-report

**Today.** The contract already names this limit for the ledger check: "It is a
schema check over a self-report — the one check in this workflow that does not
read ground truth." The same shape applies to `build`: `thejudge-implement-all`
reports slice completion and the driver records it.

**What the doc adds (§6.9).** The **default-FAIL contract**: a
`test-results.json` where every criterion starts `false`, and the agent cannot
flip one to `true` without first opening evidence — enforced by a `PreToolUse`
hook that counts evidence reads.

**Proposed change.** Slice docs already carry verification steps. Emitting them
as a machine-readable criteria file that starts all-false would make node 6's
outcome ground truth rather than testimony. This is the largest of the six and
the most likely to want its own package.

---

## Questions refinement will need answered

Grouped in threes, matching the skill's batching rule.

**Round 1 — scope.**
1. One package for all six findings, or split findings 1–3 (enforcement and
   control) from 4–6 (budget, durability, verification)?
2. Does the hook work replace `.claude/graph-profile.json`, or sit alongside it?
3. Is finding 6 (default-FAIL criteria) in scope now, or parked as a follow-on?

**Round 2 — mechanism.**
1. Where does the `PreToolUse` hook live — project `.claude/settings.json`,
   committed and always on, or somewhere it can be scoped to graph runs only?
   Always-on affects every ordinary session in the repo.
2. Does the kill switch halt at the next tool call, or finish the current node
   first and halt at the node boundary?
3. Ship `steer` with `stop`, or stop first?

**Round 3 — contract surface.**
1. Which existing contract text gets retired — the reach table's third row, the
   env sentinel, the `Profile:` ledger field, the two convention-only boundary
   notes?
2. Do budget caps park as `PARKED` or need a fifth terminal state?
3. Does the no-write reviewer replace `superpowers:requesting-code-review` at
   node 7, or wrap it?

---

## Walk-through commands

```
/thejudge-kickoff        # then describe the idea; it writes IDEA.md + STATUS.ideation
/thejudge-refinement PRD/work/graph-run-boundary-enforcement/
/thejudge-quality-check PRD/work/graph-run-boundary-enforcement/
/thejudge-map-out PRD/work/graph-run-boundary-enforcement/
```

Kickoff reads only `README.md` and `PRD/README.md` in direct mode and will not
pre-load `PRD/sections/`. Hand it the "The idea, in kickoff's shape" section
above; hand refinement this whole file.

`/superpowers:writing-plans` is superseded in this repo — `CLAUDE.md` routes
plan authoring through `thejudge-refinement` and `thejudge-map-out`, with
`DESIGN-BRIEF.md` plus a `DEC-` entry as the design record. No spec file goes to
`docs/superpowers/specs/`.

---

## Reading map back into the source

| Finding | Section |
| --- | --- |
| 1 — hooks | §6.6 Hooks — deterministic gates inside a nondeterministic loop |
| 2 — no-write reviewer | §6.8 gate 4; §2.4 self-preferential bias; §4.4 MAST |
| 3 — kill switch | §6.9 The default-FAIL contract (operator controls) |
| 4 — budget caps | §2.3 The levers you actually pull; §8 How to bound a loop; §4.2 cost |
| 5 — compaction | §2.3 context budget; §2.4 compaction amnesia |
| 6 — default-FAIL | §6.9 |
| Confirmations | §4.3 METR and self-conditioning; §4.4 MAST; §4.5 end-state evaluation |

Also worth a read before refinement, though it changes nothing here: §4.6 on
Meta's "Agents Rule of Two" — of private data access, untrusted content
exposure, and external communication, an agent operating without human approval
may satisfy at most two. The doc's framing is that this is a graph constraint,
a statement about which edges may exist without a human in the path. Node 8
(`land`) staying human is what keeps a graph run inside it.
