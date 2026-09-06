# Graph Workflow Contract

- Backed by: DEC-154, DEC-163, DEC-164, DEC-166, DEC-167, REQ-152, REQ-153,
  REQ-154, REQ-155, REQ-156, REQ-160

## Purpose and precedence

This contract governs one autonomous graph run: a single work package advanced
through the existing TheJudge lifecycle with no per-step user input. It
coordinates the existing `thejudge-*` contracts without replacing them.

The run is split into two owner-triggered halves, each with its own driver skill
(collectively **the graph driver**):

- **`graph-kickoff`** drives the spec-forming half (`preflight → shape → define →
  gate-qc`) and is the entry point for new work — the single intake door.
- **`graph-implement`** drives the build half (`plan → build → review → land →
  close`) as a background loop over approved specs.

`graph-run` retired into these two; its name survives only in historical receipts.
`thejudge-prepare` no longer serves as an entry point, though it keeps its own
skill, contract, and predicate (DEC-167). The owner hands `graph-kickoff` a
request — an idea, an observation, a bug, or a pasted or referenced document —
and it drives that request through the spec-forming half unattended, stopping at
`gate-qc` PASS with a docs-only proposal PR. The owner answers the proposal's
verdict slots and merges; `graph-implement` picks the approved spec up and builds
it.

The current-state feature specs and their `REQ`/`FLOW` entries in `PRD/sections/`
are product truth; the decision log is retired to a demoted historical index.
When
a `thejudge-*` phase skill conflicts with this contract during a graph run,
this contract governs continuation and approval behavior; the phase skill
continues to govern its own artifacts.

## Overall flow

One graph run carries a single work package from a raw request to a merged
pull request, unattended except at the gates below.

1. **Kickoff.** The owner hands `graph-kickoff` a request — an idea, a bug, or a
   pasted or referenced document. `graph-kickoff` is the single intake door: it
   proposes a kebab-case slug, derives the branch as `thejudge-auto/<slug>`,
   and stages any supplied documents as evidence. `thejudge-prepare` no
   longer serves as an entry point for new work, though it keeps its own
   skill, contract, and predicate (DEC-167).
2. **Preflight.** `graph-preflight` (node 1) readies the run's own checkout
   before any other node runs: one branch cut from `origin/main`, checked out
   in `.worktrees/kickoff-<slug>`, one concurrency lock at the session root.
   The owner's launch checkout is never switched, committed to, or stashed
   (REQ-191); nodes 2–4 work in the kickoff worktree. This automates, for
   autonomous runs, the worktree and branch ownership DEC-154 established for
   the agent-workflow lifecycle generally; DEC-163 is the layer that chains
   that lifecycle's phases end to end with no human between steps.
3. **Refine (propose).** `thejudge-kickoff` (node 2) names the package and
   `thejudge-refinement` (node 3) writes the design brief and *records the
   proposed* `PRD/sections/` truth **in `GATE-QUESTIONS.md` (the work folder)**.
   Refinement does **not** edit `PRD/sections/`; the proposal lives entirely in
   the work package until implementation applies it (see `## Propose / apply /
   close`).
4. **Gate (async).** When refinement proposes product-truth changes, it writes
   them into `GATE-QUESTIONS.md` — one accept/edit/reject slot per stable ID — and
   the run **continues** to `gate-qc` rather than stopping live. The gate signal is
   the *presence of a proposed change in `GATE-QUESTIONS.md`*, not a live
   `PRD/sections/` diff. Run one ends at quality-check PASS (see `## The two
   runs`), leaving that questions file and a docs-only PR for the owner to answer
   on their own schedule — the one place this workflow trades autonomy for a human,
   because no script can judge whether the product truth proposed there is the
   product the owner wants (DEC-164). The trade is made off the terminal, in the
   file.
5. **Build (apply).** Once quality-checked and sliced, `thejudge-implement-all`
   (node 6) implements sequentially inside `.worktrees/implement-<slug>/`, and
   *applies the approved proposal*: it writes the real `PRD/sections/` truth **by
   intent** (re-derived from the approved `GATE-QUESTIONS.md` diff and
   `DESIGN-BRIEF.md` against current truth) **together with the code**, in the
   slice's PR. A committed `PreToolUse` hook — not the driver's own say-so —
   proves every acceptance criterion before the node can report `ok` (DEC-166).
6. **Review.** A fresh-context, no-write reviewer subagent (node 7) grades
   the slice against its own stated acceptance criteria and can loop the run
   back to `build` on a Critical or Important finding, up to twice (DEC-166).
7. **Merge.** `land` (node 8) is the owner merging the pull request by
   hand — the one merge in this workflow that stays human and is never
   automated. `thejudge-cleanup` (node 9, `close`) then folds the run's ledger
   into a receipt and deletes the package; durable `PRD/sections/` truth is
   already applied by build, so cleanup promotes it **once** and never re-writes
   it.

## Propose / apply / close

Durable product truth (`PRD/sections/`) is written in exactly one place: the
implementation (`build`), together with the code. This splits the lifecycle into
three roles:

- **Propose (`thejudge-refinement`, node 3).** Writes only inside
  `PRD/work/<slug>/`: the design brief and, when the change needs product truth,
  the *proposed* `PRD/sections/` edits as the exact diff in `GATE-QUESTIONS.md`
  (one `## <STABLE-ID>` block per stable id). It never edits `PRD/sections/` or
  code. New stable ids are named and reserved in the proposal, not written live.
- **Apply (`thejudge-implement-all` / `thejudge-implement`, node 6).** Reads the
  approved proposal (`GATE-QUESTIONS.md` diff + `DESIGN-BRIEF.md` intent) and
  writes the real `PRD/sections/` edits **by intent against current truth** — it
  re-derives the edit rather than blind-replaying a possibly-stale frozen patch —
  **together with the code**, in the slice's PR.
- **Close (`thejudge-cleanup`, node 9).** Promotion already happened at apply, so
  cleanup writes durable truth **once** (or confirms it is present), never assumes
  refinement pre-wrote `PRD/sections/`, folds the ledger into the receipt, and
  deletes the work folder.

**The gate signal is the proposal's existence, not a `PRD/sections/` diff.** Since
refinement no longer writes `PRD/sections/`, a live diff after `define` is always
empty. The run gates when `GATE-QUESTIONS.md` carries a proposed product-truth
change, and does not gate when it carries none. `graph-gate-review` applies the
owner's verdicts to the proposed diff **inside `GATE-QUESTIONS.md`** (finalizing
the proposal in the work folder), never to live `PRD/sections/`.

This changes *where* durable truth is written, not the two-run split, the node
table, the caps, or the boundary deny list.

## The two runs

A graph run is split into two owner-triggered runs, so a night's work reviews on
the owner's schedule instead of holding a live terminal open at the gate. **Run
one is `graph-kickoff`; run two is `graph-implement`.** The node table, the
per-node models, the caps, and the boundary deny list are all unchanged: `define`
still advances to `gate-qc`, it simply writes the questions file on the way rather
than parking live.

**Run one** (`graph-kickoff`) drives `preflight → shape → define → gate-qc` and stops at
quality-check PASS. At `define`, when refinement proposes product-truth changes it
records them in `PRD/work/<slug>/GATE-QUESTIONS.md` (never in `PRD/sections/`) and
the run continues. At gate-qc PASS run one parks at `owner-action`, opens a
**docs-only PR into `main`**, and ends. The PR is opened, not merged:
`graph-preflight` created and pushed the base branch `thejudge-auto/<slug>`, and
run one opens it with `gh pr create --base main --head thejudge-auto/<slug>`,
carrying the design brief, the proposal (`GATE-QUESTIONS.md`), and the ledger — no
`PRD/sections/` edits, which apply only at `build`. `gh pr
create` opens a PR and never merges one, so it crosses no boundary; the merge
stays the owner's. That PR is the same
one the implementation later grows into, and the owner merges it last — this is
the base→main hop that used to be an unremembered manual step. It does **not**
block the next idea: a fresh run starts from `origin/main` in its own kickoff
worktree, so a second `graph-kickoff` runs while this PR waits for the owner.

**`GATE-QUESTIONS.md`** carries one `## <STABLE-ID>` block per new stable ID. Each
block opens with the plain-language block `PRD/instructions/plain-language-standard.md`
requires for a gate question — three labelled lines, in this order:

- **What this decides:** the one thing the owner is choosing, in product terms.
- **In plain terms:** what a player or the owner experiences, with the substance
  of every cited `DEC`/`REQ` inlined into the sentence and any technical term
  defined in the same breath — never a bare ID the owner must go look up.
- **What happens if you say no:** the state that stands if this ID is rejected.

Then that ID's **complete diff** (never a summary), then
`- Verdict: <accept | edit | reject>` and `- Reason:` (required for edit and
reject). The diff and IDs are both the owner's decision record and the
implementer's source for `build`'s apply-by-intent step; the three lines above are
what lets the owner answer without decoding anything. A trailing
`## Blocker questions` section holds any genuine decision blocker, written to the
same standard. When refinement proposes no product-truth change it writes no
questions file; run one still stops at gate-qc PASS with the docs PR.

**The owner** answers the file whenever they choose — the review the live gate
once took in the terminal, now made on their own schedule.

**Run two** (`graph-implement`) is `/graph-implement PRD/work/<slug>/`. On
resuming an `owner-action` park whose questions file is fully answered, the driver
dispatches `graph-gate-review` to apply the verdicts (restoring `STATUS.refined`),
then re-enters at `gate-qc` via the entry-point table — so an owner edit is
re-graded — and continues `plan → build → review → land → close`. A questions file
with any blank slot re-parks at `owner-action`, so run two stays a single owner
command. When run one wrote no questions file, run two resolves the empty gate and
proceeds the same way. (Slice B makes `graph-implement` a background loop that
watches `main` and resolves this resume for each approved spec in turn.)

## Delegation boundary

Graph skills never reimplement a `thejudge-*` phase. The graph driver
(`graph-kickoff` / `graph-implement`) dispatches the existing skill and records
its outcome. A change to lifecycle behavior belongs in the `thejudge-*` skill, not
in a graph skill copy.

Exactly four graph skills exist in the spine: `graph-preflight`, `graph-kickoff`
(spec-forming driver, nodes 1–4), `graph-gate-review`, and `graph-implement`
(build driver, nodes 5–9). `graph-gate-review` is the owner-facing half of the
`define` gate, which reads the owner's answered `GATE-QUESTIONS.md`, applies its
accept/edit/reject verdicts to the proposed diff **inside `GATE-QUESTIONS.md`**
(finalizing the proposal in the work folder; `build` applies it to `PRD/sections/`
later), and resumes the run.

## Intake is evidence, never authority

`PRD/work/<slug>/intake/` may state findings, mark matters settled, and
propose a slug. It may not decide product truth: every product decision it
raises is still made with the owner at the `define` gate, same as any other
source.

**Never open, read, or otherwise fetch a document intake cites — record only
its path, as a citation.** This holds even to verify the claim: verification
of adopted product truth is the `define` gate's job, not a research step
refinement takes on a citation's word. Following a citation's own citations
is unbounded, but the rule is broader than that — the cited document itself
is never opened.

This rule is unenforced. Nothing stops `thejudge-refinement` from adopting an
intake claim wholesale; what catches it is the `define` gate surfacing the
resulting proposed change in `GATE-QUESTIONS.md`, the same mechanism that catches
any other unreviewed product truth.

Node 2 also greps `PRD/instructions/receipts/` — each already named
`<slug>-<date>.md` — for prior runs against the same ground, and writes one
`## Prior run` line per match into `IDEA.md`. This is a flat list of matches,
not a chain walk: receipts carry no parent pointer (DEC-167).

## Run predicate

Graph mode is active only when the driver explicitly states
`graph is controlling` when handing work to each node. Both graph drivers
(`graph-kickoff` and `graph-implement`) emit this one shared predicate. Without
that observable predicate every phase skill runs directly and preserves its normal
user questions, approval pauses, and handoffs — the same mechanism as the
`thejudge-prepare is controlling` predicate in `preparation-contract.md`.

Six skills gate on the predicate — `thejudge-kickoff`, `thejudge-refinement`,
`thejudge-quality-check`, `thejudge-map-out`, `thejudge-implement-all`, and
`thejudge-cleanup` — and each accepts either orchestrator name (`thejudge-prepare
is controlling` or `graph is controlling`) in its `## Mode` section. Nodes 6 and 9
are on that list because they are a skill the graph driver dispatches which checks
nothing has undeclared autonomous behavior: whether it pauses for a human in a run
with no human is not knowable from the skill file.

Node 7's reviewer is deliberately **not** on it, and does not need to be. It is
not a `thejudge-*` skill and has no autonomous behavior to declare: it is a
subagent the graph driver dispatches with no write tools at all, so the question
the predicate exists to answer — whether a skill pauses for a human who is not
there — cannot arise. Its independence is structural rather than nominal. The
driver states the graph predicate and never claims `thejudge-prepare is
controlling`: the predicate attests which orchestrator is running.

## Node table

| # | Node | Delegates to | Model | Cap | Advances to |
| --- | --- | --- | --- | --- | --- |
| 1 | `preflight` | `graph-preflight` | haiku | 40 | `shape` |
| 2 | `shape` | `thejudge-kickoff` | sonnet | 60 | `define` |
| 3 | `define` | `thejudge-refinement` | opus | 150 | `gate-qc` |
| 4 | `gate-qc` | `thejudge-quality-check` | sonnet | 60 | `plan` on PASS, `define` on FAIL — except a fourth FAIL, which parks at `owner-action` |
| 5 | `plan` | `thejudge-map-out` | sonnet | 120 | `build` |
| 6 | `build` | `thejudge-implement-all` | sonnet | 1200 | `review` |
| 7 | `review` | no-write reviewer subagent | opus | 120 | `land` on approval, `build` on Critical/Important |
| 8 | `land` | human (PR merge) | — | — | `close` |
| 9 | `close` | `thejudge-cleanup` | sonnet | 120 | run complete |

`Cap` is the tool-call budget for **one dispatch** of that node. The hook counts
every tool call against `<run id>/<node>/<attempt>` and denies once the cap is
reached; the run parks at `owner-action` with the node, the cap, and the observed
count as evidence. A loop-back is a new attempt with a fresh budget, so this is
never a third loop limit — the three-FAIL and two-return caps below stay the only
bound on how many dispatches happen. `land` has no cap because the driver never
dispatches it.

At the cap, dispatches (`Task`, `Agent`) are denied outright and a bounded
`PARK_GRACE_CALLS` budget stays open so the park can be written; past cap +
grace, nothing is permitted. Before 2026-08-24 the cap denied every tool at the
boundary, which made the park the sentence above requires impossible to carry
out — a run could not even read a file to record why it had stopped. The stop
sentinel already kept its halt path open for the same reason; the cap now
matches it.

On a fresh run, the driver names the work before dispatching node 1: propose a
kebab-case slug from the request and any intake material, derive the branch as
`thejudge-auto/<slug>` unless `--branch` overrides it, and mint `--run-id`
unless one is supplied. Node 1 (`preflight`) receives the branch and run id;
node 2 (`shape`) receives the same slug, so the branch and the package share
one name instead of being named independently at two nodes.

Node 2 (`shape`) can return `NO ACTIONABLE PACKAGE` — the same outcome
`thejudge-kickoff` and `thejudge-prepare` already have — when the request
cannot be turned into an actionable package. The run ends `BLOCKED`, not
`PARKED`: no package folder exists yet for a gate to park against.

This table is the authority. `graph-kickoff/reference.md` (nodes 1–4) and
`graph-implement/reference.md` (nodes 5–9) mirror it; when they
disagree, the contract wins.

Model rationale: mechanical and deterministic nodes take the cheapest capable
model; nodes whose output is judgment the run cannot recover from — product
definition and independent review — take the most capable one.

`gate-qc` may loop to `define` at most **three** times in one run. A fourth
FAIL parks the package at `owner-action` with the complete findings.

`review` may loop to `build` at most **two** times in one run for a Critical
or Important finding. A third occurrence parks the package at `owner-action`
with the open findings.

After every `gate-qc` node, the graph driver records the result in the package
`README.md` using the exact section shape from `preparation-contract.md`:

```markdown
## Preparation gate

- Quality-check: PASS | FAIL
- Checked artifact: `PRD/work/<slug>/DESIGN-BRIEF.md`
- Findings: none | <complete issue list>
```

Replace this section with the latest result on every re-check. The `plan` node
verifies `Quality-check: PASS` here before writing any planning artifact and
cannot self-certify one. `thejudge-prepare` writes this section during
preparation runs; during graph runs the graph driver owns it, because graph runs do
not delegate to `thejudge-prepare`.

## Autonomous metadata

the graph driver records the branch that node 1 (`preflight`) created and pushed in
the package `README.md`, using the exact section shape from
`preparation-contract.md`:

```markdown
## Autonomous metadata

- Autonomous base: origin/<branch>
```

The driver writes it immediately after node 1 succeeds — or, on a fresh run
where node 2 (`shape`) creates that README, immediately after node 2 — and
always before dispatching `build`. `thejudge-implement-all` blocks before
worktree creation when this section is missing, so node 6 cannot start without
it. `thejudge-prepare` writes it during preparation runs; during graph runs
the graph driver owns it, because graph runs do not delegate to `thejudge-prepare`.

## The owner's stop sentinel

A run is stopped in flight by creating `.worktrees/.graph-stop`. The graph driver
checks for it immediately before every node dispatch, in the same pre-dispatch
block that runs `graph-ledger-check.mjs`.

A sentinel that appears mid-node lets that node finish. The halt is at the node
boundary, so no ledger is left half written. On halting, the run writes a
terminal state from this contract's `## Terminal states` table, records the halt
and the node it halted at under `## Open gate`, sets the package `STATUS.*`
marker and the `PRD/work/STATUS.md` board row, deletes the lock, and reports the
branch, the PR URL if one exists, and the ledger path. No fifth terminal state
exists for this, and no separate steering channel does either.

`graph-preflight` refuses to start while the sentinel exists, naming both it and
the file to remove. Resume is the graph driver for the halted half —
`/graph-kickoff` or `/graph-implement PRD/work/<slug>/` — once the owner has
removed it, re-entering at the node the ledger records.

The sentinel and a gate park coincide → **the park wins**. It already carries the
owner's question and the resume command.

The boundary hook is the backstop for a driver that ignores its own check: while
the lock is held and the sentinel exists, `Task` and `Agent` calls are denied,
and so is deleting the sentinel. The halt path itself stays open, because a run
that could not write its own terminal state would strand exactly the state the
kill switch exists to avoid.

## Node 7 — the no-write reviewer

`review` dispatches a fresh-context subagent that grades the slice against its
own stated acceptance criteria. It replaces the borrowed review skill this node
used to call.

**No write tools.** The reviewer holds no `Write`, `Edit`, or `NotebookEdit`. A
reviewer that can modify the work it is grading is not reviewing it.

**Fresh context.** It reads the diff, the slice doc, and the package artifacts.
It never sees the build node's transcript — a reviewer that watched the work
being justified is grading the justification.

**The rubric is the slice's own acceptance criteria**, not the reviewer's taste.
Flag gaps affecting correctness or those stated requirements, and nothing else.

**A preference is never Critical or Important.** A style note, or an improvement
outside the slice's stated requirements, does not trigger a loop back to `build`.
The risk being managed is specific: a reviewer with a two-loop budget and an
incentive to look useful will manufacture findings, and each manufactured finding
spends a loop the run cannot get back.

The loop cap is unchanged. `review` returns to `build` at most twice; a third
occurrence parks at `owner-action`.

## Acceptance criteria are earned, not written

`thejudge-map-out` emits one `slice-<letter>.criteria.json` beside each slice
doc, with every criterion initialised `false` and carrying an `evidence` block —
a command pattern, one or more file paths, or `"manual": true`. The schema and a
worked example live in `thejudge-map-out/reference.md`. The slice doc format in
`PRD/instructions/requirement-format.md` is unchanged; the criteria file is
emitted from it, not a replacement for it.

The hook matches every observed tool call against every criterion's evidence
block and appends matching ids to `.worktrees/.graph-evidence.jsonl`, keyed by run
id and slice. The hook is that log's only writer and the graph tier denies every
other write to it, so a run cannot pre-seed its own evidence. The log is
append-only: an earned id is never re-logged, and a damaged line is skipped
rather than repaired.

**Evidence is earned per step, not per run.** Only the `build` node (node 6)
earns criteria evidence. Criteria belong to slices and slices are implemented in
`build`, so an earlier node's file listings and searches cannot pre-satisfy a
check the builder was supposed to earn — the 2026-08-23 shakedown saw the `plan`
node earn 7 of 21 criteria before `build` had started, because earning was keyed
by run id alone. The gate is on *earning* only: the flip guard below still fires
in every node, so nothing lets a non-build node forge a pass.

A write setting a criterion to `true` is denied unless that id is already in the
log for this run, and the denial names the criterion and the evidence still
missing. Evidence from another run does not carry over.

Node 6 (`build`) reports `ok` only when every criterion in every slice's file is
`true`. Any remaining `false` fails the node, and the check reads the emitted
files rather than a summary of them.

**Every check proves the command ran, not that it passed.** The hook is a
`PreToolUse` hook: it fires *before* the tool call executes, so it never sees an
exit code or any output. A criterion whose evidence is `"npm run test:scripts"`
is earned the moment that command is *issued* — a failing run earns it exactly as
a passing one does. This is not a limit of `manual` criteria alone; it is
structural, and it holds for command and path criteria too. Closing it would take
a `PostToolUse` hook that inspects the result — a different evidence model, out of
scope here. Until then, "the criteria are earned" means every check *ran*, never
that every check *passed*; do not describe a passing build node as proof the work
is correct.

**The `manual` limit.** A `manual` criterion is earned by a dated observation
line naming its id. That proves the check *happened* — that someone looked on
that day and wrote down what they saw. It does not prove the check passed. It is
the sharpest case of the structural limit above: no command stands in for the
observation at all, so calling a `manual` criterion "verified" overclaims what
the evidence supports.

## Hook liveness

A run never proceeds on an unproven enforcer.

**At run start.** `graph-preflight` issues a canary — a Bash tool call the
universal tier is defined to deny — and treats the observed deny, the reason
text the hook returns, as the proof. The canary targets a non-existent path
under `.worktrees/`, so executing it removes nothing, prints nothing, and exits
0: an absent hook costs a failed proof and no side effect.

A canary that is **not** denied ends the run at `BLOCKED` before node 2 is
dispatched, naming what was tried, what came back, and the recovery action. An
untrusted workspace is a separately named `BLOCKED` condition, because a project
hook that was never trusted cannot deny anything either — and "your hook is
broken" and "you never trusted this checkout" have different fixes.

`.claude/graph-profile.json` is **not a fallback**. A failed proof is refused,
never downgraded to a weaker one.

**Between nodes.** the graph driver reads `.worktrees/.graph-node-calls.json` before
and after each node and confirms it advanced. A node that made tool calls while
the counter stood still means the hook stopped firing mid-run, which the
run-start canary cannot catch. That ends the run at `BLOCKED` with the node, the
expected advance, and the observed counter as evidence; the run does not advance.

The heartbeat is read-only over the counter file, whose sole writer is the hook.
That is what makes it evidence: the driver cannot manufacture its own proof.

A missing or unparseable run-state file leaves no counter key to advance. That is
a **degraded heartbeat**, not a hook failure — it is reported, the run continues,
and the run-start canary remains the binding proof.

The ledger records the canary result at run start and the heartbeat at every node
boundary.

## Ledger

Every run writes `PRD/work/<slug>/GRAPH-RUN.md`, committed with the run's
documentation changes:

```markdown
# Graph run — <slug>

- Run ID: `graph-<YYYYMMDD>-<HHMMSS>`
- Profile: `unverified` | `<path> (stated by the user at launch)`
- Canary: `denied — hook live (<command>)` | `allowed — BLOCKED (<reason>)`
- Autonomous base: `origin/<branch>`
- Worktree: `<absolute path>/.worktrees/kickoff-<slug>`
- Staging: `<absolute path>/.worktrees/.graph-intake/<run-id>/`
- Current node: `<node>`
- Next action: `/graph-implement PRD/work/<slug>/` (or `/graph-kickoff` in the spec-forming half)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 14` | branch `<branch>` pushed from `.worktrees/kickoff-<slug>`; launch checkout untouched | <date> |

## Open gate

- None

## Dispatch prompts

### <node>

<the prompt this node was dispatched with, verbatim>

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "if it asks again, pick the smaller option" | refused | define | No pre-authorization of product decisions |
| "prefer the existing table over a new one" | answered-once | define | — |
```

`Heartbeat` is the counter reading before and after that node, or
`degraded (no run state)`, or `static at <n> — BLOCKED`. See
`## Hook liveness` below.

`Outcome` is one of `ok`, `failed`, `parked`. `Evidence` names a command, path,
PR URL, or artifact URL — never a bare claim. A fresh agent reads this file and
`PRD/work/<slug>/README.md` and needs nothing else to resume.

`Staging` is recorded at node 2's first ledger write, never before node 1: the
ledger lives inside `PRD/work/<slug>/`, and that folder is born at node 2, so
there is nothing to write it to earlier. Intake is copied into
`PRD/work/<slug>/intake/` and committed, never referenced in place; no size
gate is applied to it.

`## Dispatch prompts` records every node's dispatch prompt verbatim, one `### `
subsection per node. Verbatim, not summarized: a paraphrase is the run grading
its own compliance.

`## Instruction ledger` carries one row per user instruction — quoted, the node
it arose at, and for a refusal the rule that refused it. It **replaces**
`## Refused instructions` outright rather than sitting beside it, so a refusal
cannot be recorded in one section and missed by the other, and the validator has
a single parse target.

`Class` is `answered-once` or `refused`. **There is deliberately no
`standing-rule` class.** Pre-authorizing a class of future product decisions has
no representable form here — a run that did it cannot record what it did, which
is what makes the omission a boundary rather than a gap. A run that silently
absorbed such an instruction leaves no trace, which is the failure this section
exists to prevent.

`scripts/graph-ledger-check.mjs` reads both sections and must pass **before**
each node dispatch, never after: it fails a dispatch prompt carrying
conditional-future authorization language, a quoted instruction with no matching
ledger row, a class outside the two, a refusal naming no rule, a missing ledger,
and the legacy section name. A violating run stops at `define`, before any
product fork is decided — a post-hoc audit of the 2026-08-17 failure could only
have reported seven forks already decided.

It also requires an absolute `Working directory:` line, on its own line, in
every recorded dispatch prompt, and rejects a relative path. the graph driver pins
that line at dispatch and requires each node to copy it unchanged into every
prompt the node itself writes — constraining a parent does not constrain its
children, and a node fanning out to its own subagents is where the 2026-08-17
leak got through.

Node 6 (`build`) carries the return-side half: every path it wrote must lie
inside `.worktrees/implement-<slug>/` or `PRD/work/<slug>/`, and a write outside
that set fails the node and parks with the offending paths as evidence. The
fixture rig's before/after snapshot does not port to production — it asserts the
invoking checkout is byte-unchanged, which a real run is supposed to violate —
so the write-scope assertion is its production equivalent rather than the same
check under a new name.

**Its stated limit.** Both inputs are written by the graph driver itself. A driver
that pre-authorizes and then paraphrases its own dispatch prompt passes this
clean. It is a schema check over a self-report — the one check in this workflow
that does not read ground truth. Closing that honestly is transcript-side work
and is out of scope. Never describe a passing run as proof it did not
pre-authorize.

`Profile` is evidence, not a constant. The driver cannot inspect the settings
its own session was launched with, so it writes `unverified` unless the user
stated the launch command in this session — in which case it records that exact
path and attributes it to the user. Never write a profile path the run did not
observe: a later run reads this field and would otherwise believe the deny list
was active when it may never have been loaded.

`Worktree` is the kickoff worktree node 1 created; the ledger itself lives at
`<Worktree>/PRD/work/<slug>/GRAPH-RUN.md`, and a resume reads it there. A
resume that finds the worktree missing ends `BLOCKED` naming it.

## Human gates

A gate parks rather than asks. To park, the driver:

1. Sets `STATUS.owner-action` (replacing the existing marker; exactly one).
2. Updates the `PRD/work/STATUS.md` board row.
3. Writes the question, the evidence, and the exact resume command under
   `## Open gate` in the ledger.
4. Stops. It does not poll, retry, or continue to the next node.

Gate triggers: a genuine decision blocker under the three-condition test in
`preparation-contract.md`; a fourth `gate-qc` FAIL; a `build` blocker; a
`review` finding rated Critical that the run cannot resolve from confirmed
decisions and tests; a third `review`-to-`build` loop; a dirty in-place
checkout that preflight refused; or a user instruction that would waive that
three-condition test, per the rule below.

### No pre-authorization of product decisions

The driver never converts a user instruction into a standing authorization that
pre-resolves product decisions inside a delegated dispatch.

- The assumption ladder in `preparation-contract.md` is applied **per question**,
  evaluated fresh at the moment that question arises. It is never pre-applied
  wholesale to a class of future questions.
- A stated user preference — "prefer the smaller option", "pick whichever is
  simpler" — is an **input** to that ladder, not a bypass of it.
- The three-condition genuine-blocker test can never be waived, narrowed, or
  pre-satisfied by user phrasing. An instruction that would waive it is refused:
  the run parks and names the instruction it refused.
- A user asking for autonomy is asking not to be interrupted by **mechanics** —
  branching, worktrees, sequencing, commits, PR plumbing. It is not authorization
  to decide product behavior on their behalf.

Refusal under this rule is recorded, never silent. The driver quotes the refused
instruction in a `## Instruction ledger` row classified `refused`, naming the
rule that refused it, so the user who gave it can see it was not followed.

## The boundary hook, and what it does not reach

`scripts/graph-boundary-hook.mjs` is registered as a `PreToolUse` hook in the
committed `.claude/settings.json`. It fires in every session and every dispatched
subagent, with no launch flag. Decision logic is pure and lives in
`scripts/lib/boundary-rules.mjs`, which holds every protected-path and command
literal in this system; the hook does the file I/O and holds none of them.

**Two tiers.** The universal tier fires in every session, run or no run: secrets
access, force-push in every flag and refspec form, remote branch deletion,
`main` / `master` pushes, `rm -rf`, `sudo`, `pkill`, `killall`. The graph tier
fires only while a run holds `.worktrees/.graph-run.lock`: protected-path writes,
writes to the hook's own records, removal of the lock or the stop sentinel,
`nohup`, a background `&`, the per-node tool-call cap, and a criterion flipped to
`true` without observed evidence.

**It never fails closed.** An internal error prints a diagnostic and exits 0. A
hook that denied on its own bugs would brick every session in this repository. A
hook that has stopped deciding is caught by the canary and the heartbeat, not by
blocking the user.

### Stated limits

Each of these is a limit, recorded once, not a claim.

1. **Literal matching.** The hook matches path literals and normalized argv. A
   path or command assembled at runtime — through a variable, a heredoc, or an
   interpreter the hook allowed — evades it. The normalizer models a shell; it is
   not one.
2. **`graph-ledger-check.mjs` is a self-report.** It reads `## Dispatch prompts`
   and `## Instruction ledger`, both written by the driver. A driver that
   pre-authorizes and then paraphrases its own prompt passes it clean. It is a
   schema check over a self-report — never cite a passing run as proof it did not
   pre-authorize.
3. **A criterion proves the command ran, not that it passed.** The hook is
   `PreToolUse`: it fires before the tool executes, so it never sees an exit code
   or output. A command criterion is earned when the command is *issued* — a
   failing run earns it exactly as a passing one does. This is structural and
   applies to command and path criteria, not only to `manual` ones. A `manual`
   criterion is the sharpest case: its only evidence is a dated observation line,
   and no command stands in for it at all. Closing the gap would take a
   `PostToolUse` hook that inspects the result — a different evidence model, not
   built here.
4. **A missing run-state file degrades the cap.** With nothing to attribute a
   call to, the tool-call cap does not fire. The hook reports the degraded
   condition on every call rather than staying silent, and never blocks the run
   for it.

   A **stale** run-state file is worse than a missing one. It parses, so the cap
   fires and attributes every call to a node that finished long ago. Observed
   2026-08-24: a leftover `close/1` entry plus a fresh lock denied an unrelated
   session outright. Delete the run-state file at a terminal state, with the lock.
5. **The heartbeat degrades with it.** No counter key to advance means the
   between-node heartbeat reports `degraded`, not a hook failure. The run
   continues and the run-start canary remains the binding proof — which means a
   run whose run-state file never appears has canary-only liveness evidence for
   its whole length.
6. **Project hooks require workspace trust.** An untrusted checkout never loads
   `.claude/settings.json`, so the hook cannot deny anything. This is a named
   `BLOCKED` condition at the run-start canary, never a silent no-op — and it is
   reported separately from a broken hook, because the two have different fixes.
7. **`bypassPermissions` — a measurement, not a guarantee.** On 2026-08-20, in a
   session run with `--permission-mode bypassPermissions` on `claude` 2.1.234,
   the command `pkill -f definitely-no-such-process-xyz` returned:

   ```
   PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"]: [graph-boundary] `pkill` is denied in every session.
   ```

   **Observed result: denied.** That is one command, at one moment, on one binary
   version. It is recorded as the measurement it is. Do not restate it as
   "hook denies survive `bypassPermissions`" — nothing here establishes that as a
   property of the harness.

## Boundaries

A graph run may not:

- merge or close a pull request, or force-push by any flag (`--force`, `-f`,
  `--force-with-lease`) or by the leading-`+` refspec form
  (`git push origin +main:main`), which forces without a flag
- delete a remote branch, by `--delete`, `-d`, or the `:branch` refspec form
- modify any `thejudge-*` skill in either synced tree
- modify its own permission profile, `.claude/settings*.json`, or `CLAUDE.md`
- run `npm run data:refresh` or any Scryfall network refresh
- read, write, or commit anything matching `.secrets/`
- create or adopt a worktree outside the repo-local `.worktrees/` root
- drop, pop, or reorder any stash
- use `nohup`, untracked background `&`, `pkill`, or `killall`
- stage with `git add -A`, `git add --all`, or `git add .` — a run stages
  explicit paths and nothing else
- push `main` or `master`, or merge anything into them
- merge or pull with a strategy that discards one side — `-s ours`,
  `-X ours`, `-X theirs`, `--allow-unrelated-histories`, `git pull --force`

**The boundary hook enforces this list, in every session.**
`scripts/graph-boundary-hook.mjs` is registered as a `PreToolUse` hook in the
committed `.claude/settings.json`, so it fires with no launch flag, at top level
and inside every dispatched subagent. It is the enforcer.

The permission profile at `.claude/graph-profile.json` is a **second layer**, not
the primary one. It enforces many of the same rules, but **only in a session
launched with** `claude --settings .claude/graph-profile.json`. It is kept rather
than deleted — belt and braces — but nothing depends on it being loaded.

**Whether it loaded is observed, not asserted — and it is informational.** Since
the hook is the enforcer, the sentinel and the ledger's `Profile:` field record
which session configuration was in play, not whether the boundaries held. Hook
liveness is what proves that, and it has its own canary and heartbeat above. The
profile carries
`"env": { "THEJUDGE_GRAPH_PROFILE": "1" }`, which exists only in a session
launched with it. `graph-preflight` reads it at node 1 and prints
`Profile: loaded (env sentinel)` or `Profile: unverified`, and that line is what
the ledger records. Nothing forges it: the profile denies edits to itself, so a
run cannot write its own sentinel. The user's account of the launch command is
the fallback when the sentinel is absent, recorded as their statement.

**The sentinel proves the file loaded — not that any rule fired.** That limit is
stated rather than papered over. A loaded profile still says nothing about
whether a given deny was reached. Treat an unverified profile as absent, and a
verified one as loaded, never as enforced. An unverified profile is no longer a
gap in enforcement, because the hook does not depend on it.

**Staging is explicit because a wildcard is what committed the 2026-08-17
leak.** A fixture rep's dispatched subagent wrote product truth into the live
checkout, and `git add -A PRD/` during an unrelated cleanup is what turned that
contamination into a commit. Path-scoped `git add <path>` stays broadly
allowed: this narrows the wildcard, not the operation.

No script runs `git add -A` any more. Until 2026-09-06 node 1's auto-commit
path did, through `execFileSync`, bounded by a tested classification; that path
retired with the rest of the launch-checkout resolution (REQ-191), and no
script may add one.

**Merging and pulling are allowed; merging into the trunk is not.** A run may
`git merge` and `git pull` — integrating an updated base is ordinary mechanics,
not a product decision. What it may not do is discard one side of that
integration, so the strategy overrides are denied: `-s ours` produces a merge
commit keeping none of the incoming work, and `-X ours` / `-X theirs`
auto-resolves conflicts by picking a side, which is this contract's
"preserve both flows' intended behavior" inverted. There is no
`git merge --force`; those flags are its equivalent.

**Where "not into `main`" is actually enforced — and where it cannot be.** A
permission rule reads command text, and `git merge <ref>` names the branch
merged **from**, never the branch merged **into**. The target is the current
checkout, which no rule can see. So this boundary is not, and cannot be, a rule
about `git merge`.

It is enforced at the push instead. Only `origin` pushes are permitted at all,
and every `main` / `master` spelling reachable through those two allows is
denied — `git push origin main`, `origin HEAD:main`, `-u origin main`, and the
refspec forms, for both names. The denies deliberately carry no trailing `*`
after the branch name, so a branch merely *starting* with `main` —
`main-line-feature`, `maintenance` — stays pushable. A rule that blocked those
would surface mid-run as a prompt, which is a hang.

What remains reachable, stated plainly: a run can make a local merge into `main`
in its own checkout. It cannot publish it — the push is denied and force-push
has been denied all along, so nothing lands that is not fast-forward. It also
cannot erase it: `git reset --hard` and `git clean` are denied, so the mistake
stays visible for the owner to unwind. The guarantee is "cannot be published and
cannot be hidden", not "cannot be made". `scripts/graph-preflight.test.mjs`
asserts each of these rules, including the false-positive check.

The one merge that matters is still human. Node 8 (`land`) is the owner merging
the pull request; `gh pr merge` and `gh pr close` stay denied, and nothing here
changes that.

**Two boundaries no permission rule can express — and why the hook exists.**
`nohup` is stripped as a wrapper before Bash rules are matched, so the
`Bash(nohup*)` deny can never fire. A trailing `&` is consumed as a command
separator before any rule sees the command text, so no `&` rule is expressible
at all — the profile contains no background-`&` entry, and adding one would not
help.

That reasoning still holds, and it is exactly the gap the boundary hook was built
to close. The hook normalizes the command before matching: it strips wrappers and
sees what is behind them, and it splits on separators while *observing* a
trailing `&` rather than losing it. Both are graph-tier denies (`nohup-wrapper`,
`background-launch`), enforced whenever a run holds the lock, with or without the
profile. Neither is convention any more.

The list above is the reason each deny entry exists.

### Protected paths — three layers, each with a stated reach

Protected set: `.secrets/**`, `CLAUDE.md`, `.claude/graph-profile.json`,
`.claude/settings*.json`, and `thejudge-*/**` in both skill trees
(`.claude/skills/` and `.agents/skills/`).

No single mechanism covers every way a path can be written, so each writing
mechanism states its own reach. Nothing here claims more than it enforces.

| Writing mechanism | Enforcement | Reach |
| --- | --- | --- |
| Agent `Edit` / `Write` | `scripts/graph-boundary-hook.mjs`, with `.claude/graph-profile.json` as a second layer | The hook fires in every session and every subagent with no launch flag, and denies protected-path writes while a run holds the lock. The profile's deny rules add a second layer, but only in a session launched with `--settings` |
| `node scripts/*` | `scripts/lib/protected-paths.mjs`, guarded by `scripts/protected-write-guard.test.mjs` under `test:scripts` | Non-test `scripts/**/*.mjs`, protected-path writes only, with exactly one declared exemption — the helper itself |
| Raw Bash (`cp`, `rsync`, redirection, `rm`, `mv`, `tee`, `sed -i`, `>` / `>>`) | `scripts/graph-boundary-hook.mjs`, registered as a committed `PreToolUse` hook in `.claude/settings.json` | Every session and every subagent, no launch flag. The hook resolves each command's write targets before matching, so a redirection or a copy into a protected path is visible as a write. Graph tier: fires while a run holds the lock. Matches literals and normalized argv — a path assembled at runtime still evades it |

The drift guard's subject is protected-path writes, not all writes. Eleven
scripts write to `data/`, `.tmp/`, and temp directories today; none of them is
refactored, and routing general writes through the helper is a non-goal. Two
limits are stated rather than assumed: the scan matches path **literals**, so a
path assembled at runtime evades it, and `*.test.mjs` is out of scan scope
because a graph run does not execute test files.

Writes into the mirror tree `.agents/skills/` belong to the sync path alone,
through `mirrorSkillTrees()`. Hand-editing a mirror is the drift this guards.

The `thejudge-*/**` deny is a **graph-tier boundary, not an authoring
restriction**. Skill authoring happens in ordinary sessions, which do not load
the profile, and the `graph-kickoff` / `graph-implement` / `graph-preflight`
skill files are not denied at all.

The profile is deliberately **not** narrowed to an allowlist of script names:
that would block a run every time a script is added, which is the opposite of
what the profile is for. `Bash(npm run *)` and `Bash(node scripts/*)` stay
broadly allowed, and enforcement lives in `quality:check` — `test:scripts` runs
`node --test scripts/*.test.mjs`, so a new guard joins the gate by existing.

## The ledger outlives the run

`thejudge-cleanup` deletes `PRD/work/<slug>/`, and `GRAPH-RUN.md` lives inside
it. Before that delete, cleanup folds the run's `## Node ledger` and
`## Instruction ledger` **verbatim** into a `## Graph run` section of the durable
receipt, and refuses the delete when a ledger exists and that section does not.

Verbatim rather than summarized: a summary of a refusal ledger is the driver
grading its own compliance. Without this, the proof that a run refused a
pre-authorization survives exactly until the run succeeds — cleanup deletes the
folder the ledger lives in.

Cleanup also writes an `## Intake` section naming each staged intake file and
its stated origin, so anything the graph driver copied into
`PRD/work/<slug>/intake/` is not lost when the folder is deleted (DEC-167).

## One run at a time

`graph-preflight` takes `.worktrees/.graph-run.lock` before any mutation — a
JSON record of the slug, run id, PID, and start time, under the already-ignored
`.worktrees/` root so it never travels with a branch. A second run refuses while
it is held and relays a message naming the holding slug, run id, and PID. A lock
whose PID is not running is reported **stale** with the reclaim command stated,
never silently stolen; an unparseable lock stops the run rather than reading as
absent. The decision is `classifyLock()` in `scripts/graph-preflight.mjs`, a
tested pure function.

Two runs in one root would share the hook's control plane — one run state, one
counter, one evidence log — so the second run's calls would be charged to the
first run's node and denied on its rules. The lock keeps one run per root; a
second run at the same moment belongs in a second session rooted in a second
checkout (`graph-preflight`, `## Running two ideas at once`). Runs that follow
one another need nothing: a parked run holds no lock.

The run releases the lock on every state in the `## Terminal states` table below.
That table is the definitive list and lives in this contract alone: a release path
enumerated in two places drifts, and a lock released on a state one list omits is
a stranded lock.

## Terminal states

This table is the single authority for the four run-ending states, including each
one's required result and exact next step. It lives here in the contract; the
`graph-kickoff` and `graph-implement` skills point to it and never re-enumerate
it.

| State | Required result | Exact next step |
| --- | --- | --- |
| `COMPLETE` | Every node `ok` through `close`; package `ship-ready` or cleaned up; ledger closed | None — the run is finished |
| `PARKED` | `STATUS.owner-action`, board row updated, `## Open gate` names the question, evidence, and resume command | Resolve the gate, then `/graph-implement PRD/work/<slug>/` (or `/graph-kickoff` in the spec-forming half) |
| `BLOCKED` | Safe branch and commit preserved; exact failure, what exists, what does not, and recovery action | Fix the external condition, then retry |
| `PROMPTED` | The denied or unlisted command written verbatim under `## Open gate`, with the node it arose at; `STATUS.owner-action`, board row updated | Run the command yourself, or add the rule to `.claude/graph-profile.json`, then resume |

**Release the concurrency lock on every state in this table.** Node 1 takes
`.worktrees/.graph-run.lock`; the run declares its terminal state in
`.worktrees/.graph-run-release.json` and then deletes the lock as the last act
before reporting any terminal state above. The release record's exact shape,
because the hook matches keys, not intent:

```json
{ "runId": "<this run's id>", "state": "COMPLETE | PARKED | BLOCKED | PROMPTED" }
```

Both keys are required, both non-empty strings, and `runId` must equal the `runId`
in the live lock. `releasesOwnLock()` in `scripts/lib/boundary-rules.mjs` is the
decision, and it reads `state` — not `terminalState`. Write that file in **its own
tool call**, before the call that removes the lock. `run-lock-removal` is a
remediable rule, so a wrong key is recoverable: correct the record and issue the
removal again.

**A denied call is never retried** (except a `run-lock-removal` denial that named
a remedy). `PROMPTED` is what a permission prompt becomes in an autonomous session
— a hang, not a question — so a run that hits a denied or unlisted command writes
it under `## Open gate`, sets `STATUS.owner-action`, and stops. `BLOCKED` is for an
external condition outside the repository, and for a request node 2 cannot turn
into an actionable package (`NO ACTIONABLE PACKAGE`); `PARKED` is for anything
requiring a human decision over an existing artifact. When it is not clear which
applies, park.

## Related material

- `PRD/instructions/plain-language-standard.md` — the plain-language opening
  block every gate question, PR body, and receipt this workflow generates carries
- `PRD/instructions/preparation-contract.md` — the assumption ladder and
  genuine-blocker test this contract reuses verbatim
- `PRD/instructions/workflow-reference.md` — status vocabulary and marker rules
- `PRD/instructions/runtime-process-hygiene.md` — browser/server cleanup
- `.claude/skills/graph-kickoff/reference.md` — spec-forming node detail (nodes 1–4)
- `.claude/skills/graph-implement/reference.md` — build node detail (nodes 5–9)
- `AGENT-SKILLS.md` — skill catalog and sync workflow
