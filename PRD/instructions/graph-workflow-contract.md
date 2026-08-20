# Graph Workflow Contract

## Purpose and precedence

This contract governs one autonomous graph run: a single work package advanced
through the existing TheJudge lifecycle with no per-step user input. It
coordinates the existing `thejudge-*` contracts without replacing them.

Active decisions and requirements in `PRD/sections/` remain product truth. When
a `thejudge-*` phase skill conflicts with this contract during a graph run,
this contract governs continuation and approval behavior; the phase skill
continues to govern its own artifacts.

## Delegation boundary

Graph skills never reimplement a `thejudge-*` phase. `graph-run` dispatches the
existing skill and records its outcome. A change to lifecycle behavior belongs
in the `thejudge-*` skill, not in a graph skill copy.

Exactly three graph skills exist in the spine: `graph-preflight`, `graph-run`,
and `graph-gate-review` — the owner-facing half of the `define` gate, which
walks the recorded `PRD/sections/` diff one stable ID at a time and resumes the
run. Domain node packs (`graph-ui-shape`, `graph-enrich-define`) attach as extra
nodes and are specified separately.

## Run predicate

Graph mode is active only when the driver explicitly states
`graph-run is controlling` when handing work to each node. Without that
observable predicate every phase skill runs directly and preserves its normal
user questions, approval pauses, and handoffs — the same mechanism as the
`thejudge-prepare is controlling` predicate in `preparation-contract.md`.

Six skills gate on the predicate — `thejudge-kickoff`, `thejudge-refinement`,
`thejudge-quality-check`, `thejudge-map-out`, `thejudge-implement-all`, and
`thejudge-cleanup` — and each accepts either orchestrator name in its `## Mode`
section. Nodes 6 and 9 are on that list because a skill `graph-run` dispatches
which checks nothing has undeclared autonomous behavior: whether it pauses for a
human in a run with no human is not knowable from the skill file.

Node 7's `superpowers:requesting-code-review` is deliberately **not** on it. It
is not a `thejudge-*` skill and not this repository's to gate; its independence
is nominal and recorded as a stated limit rather than papered over. The driver states
its own name and never claims `thejudge-prepare is controlling`: the predicate
attests which orchestrator is running.

## Node table

| # | Node | Delegates to | Model | Advances to |
| --- | --- | --- | --- | --- |
| 1 | `preflight` | `graph-preflight` | haiku | `shape` |
| 2 | `shape` | `thejudge-kickoff` | sonnet | `define` |
| 3 | `define` | `thejudge-refinement` | opus | `gate-qc` |
| 4 | `gate-qc` | `thejudge-quality-check` | sonnet | `plan` on PASS, `define` on FAIL — except a fourth FAIL, which parks at `owner-action` |
| 5 | `plan` | `thejudge-map-out` | sonnet | `build` |
| 6 | `build` | `thejudge-implement-all` | sonnet | `review` |
| 7 | `review` | `superpowers:requesting-code-review` | opus | `land` on approval, `build` on Critical/Important |
| 8 | `land` | human (PR merge) | — | `close` |
| 9 | `close` | `thejudge-cleanup` | sonnet | run complete |

Model rationale: mechanical and deterministic nodes take the cheapest capable
model; nodes whose output is judgment the run cannot recover from — product
definition and independent review — take the most capable one.

`gate-qc` may loop to `define` at most **three** times in one run. A fourth
FAIL parks the package at `owner-action` with the complete findings.

`review` may loop to `build` at most **two** times in one run for a Critical
or Important finding. A third occurrence parks the package at `owner-action`
with the open findings.

After every `gate-qc` node, `graph-run` records the result in the package
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
preparation runs; during graph runs `graph-run` owns it, because graph runs do
not delegate to `thejudge-prepare`.

## Autonomous metadata

`graph-run` records the branch that node 1 (`preflight`) created and pushed in
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
`graph-run` owns it, because graph runs do not delegate to `thejudge-prepare`.

## The owner's stop sentinel

A run is stopped in flight by creating `.worktrees/.graph-stop`. `graph-run`
checks for it immediately before every node dispatch, in the same pre-dispatch
block that runs `graph-ledger-check.mjs`.

A sentinel that appears mid-node lets that node finish. The halt is at the node
boundary, so no ledger is left half written. On halting, the run writes a
terminal state from `graph-run`'s `## Terminal states` table, records the halt
and the node it halted at under `## Open gate`, sets the package `STATUS.*`
marker and the `PRD/work/STATUS.md` board row, deletes the lock, and reports the
branch, the PR URL if one exists, and the ledger path. No fifth terminal state
exists for this, and no separate steering channel does either.

`graph-preflight` refuses to start while the sentinel exists, naming both it and
the file to remove. Resume is `/graph-run PRD/work/<slug>/` once the owner has
removed it, re-entering at the node the ledger records.

The sentinel and a gate park coincide → **the park wins**. It already carries the
owner's question and the resume command.

The boundary hook is the backstop for a driver that ignores its own check: while
the lock is held and the sentinel exists, `Task` and `Agent` calls are denied,
and so is deleting the sentinel. The halt path itself stays open, because a run
that could not write its own terminal state would strand exactly the state the
kill switch exists to avoid.

## Ledger

Every run writes `PRD/work/<slug>/GRAPH-RUN.md`, committed with the run's
documentation changes:

```markdown
# Graph run — <slug>

- Run ID: `graph-<YYYYMMDD>-<HHMMSS>`
- Profile: `unverified` | `<path> (stated by the user at launch)`
- Autonomous base: `origin/<branch>`
- Current node: `<node>`
- Next action: `/graph-run PRD/work/<slug>/`

## Node ledger

| # | Node | Model | Outcome | Evidence | Date |
| --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | branch `<branch>` pushed; stash `graph-preflight/<run-id>` | <date> |

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

`Outcome` is one of `ok`, `failed`, `parked`. `Evidence` names a command, path,
PR URL, or artifact URL — never a bare claim. A fresh agent reads this file and
`PRD/work/<slug>/README.md` and needs nothing else to resume.

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
every recorded dispatch prompt, and rejects a relative path. `graph-run` pins
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

**Its stated limit.** Both inputs are written by `graph-run` itself. A driver
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

## Stashed work handoff

When `graph-preflight` stashes, it records the stash under `## Open gate` in
the ledger and in the package README, naming the exact restore command:

```text
git stash list | grep graph-preflight/<run-id>
git stash apply <ref>
```

A graph run never drops, pops, or reorders any stash. The preflight stash
contains the user's uncommitted work and must be restored manually.

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
decisions and tests; a third `review`-to-`build` loop; any `blocked`
preflight classification; or a user instruction that would waive that
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
  branching, stashing, sequencing, commits, PR plumbing. It is not authorization
  to decide product behavior on their behalf.

Refusal under this rule is recorded, never silent. The driver quotes the refused
instruction in a `## Instruction ledger` row classified `refused`, naming the
rule that refused it, so the user who gave it can see it was not followed.

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

The permission profile at `.claude/graph-profile.json` enforces most of these
mechanically, but **only in a session launched with**
`claude --settings .claude/graph-profile.json`. In a session started without it,
every entry in the profile is inert and the list above is convention only —
binding on the agent's compliance rather than on the engine.

**Whether it loaded is now observed, not asserted.** The profile carries
`"env": { "THEJUDGE_GRAPH_PROFILE": "1" }`, which exists only in a session
launched with it. `graph-preflight` reads it at node 1 and prints
`Profile: loaded (env sentinel)` or `Profile: unverified`, and that line is what
the ledger records. Nothing forges it: the profile denies edits to itself, so a
run cannot write its own sentinel. The user's account of the launch command is
the fallback when the sentinel is absent, recorded as their statement.

**The sentinel proves the file loaded — not that any rule fired.** That limit is
stated rather than papered over. A loaded profile still says nothing about
whether a given deny was reached, and two boundaries can never fire under any
profile: `nohup` and the trailing `&` below. Treat an unverified profile as
absent, and a verified one as loaded, never as enforced.

**Staging is explicit because a wildcard is what committed the 2026-08-17
leak.** A fixture rep's dispatched subagent wrote product truth into the live
checkout, and `git add -A PRD/` during an unrelated cleanup is what turned that
contamination into a commit. Path-scoped `git add <path>` stays broadly
allowed: this narrows the wildcard, not the operation.

One `git add -A` survives, and it is stated rather than hidden. Node 1's
auto-commit path in `scripts/graph-preflight.mjs` runs `git add -A` through
`execFileSync`, so the Bash deny never sees it. That is deliberate — auto-commit
exists to capture a whole dirty tree — and it is bounded by a tested
classification (at or below 10 changed files and 200 changed lines), a
`--dry-run` preview of every planned command, and a secret gate that blocks
before any of it. It is not the ad-hoc cleanup that caused the leak. No other
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

Two boundaries stay convention-only even with the profile loaded. `nohup` is
stripped as a wrapper before Bash rules are matched, so the `Bash(nohup*)` deny
can never fire. A trailing `&` is consumed as a command separator before any
rule sees the command text, so no `&` rule is expressible at all — the profile
contains no background-`&` entry, and adding one would not help.

The list above is the reason each deny entry exists.

### Protected paths — three layers, each with a stated reach

Protected set: `.secrets/**`, `CLAUDE.md`, `.claude/graph-profile.json`,
`.claude/settings*.json`, and `thejudge-*/**` in both skill trees
(`.claude/skills/` and `.agents/skills/`).

No single mechanism covers every way a path can be written, so each writing
mechanism states its own reach. Nothing here claims more than it enforces.

| Writing mechanism | Enforcement | Reach |
| --- | --- | --- |
| Agent `Edit` / `Write` | `.claude/graph-profile.json` deny rules | Only in a session launched with `--settings`. `graph-preflight`'s env sentinel reports whether the profile loaded; treat an unverified profile as absent |
| `node scripts/*` | `scripts/lib/protected-paths.mjs`, guarded by `scripts/protected-write-guard.test.mjs` under `test:scripts` | Non-test `scripts/**/*.mjs`, protected-path writes only, with exactly one declared exemption — the helper itself |
| Raw Bash (`cp`, `rsync`, redirection) | none | **Convention.** Detected after the fact by the fixture rig's before/after snapshot and the skills-sync drift check. Never claimed as enforced |

The drift guard's subject is protected-path writes, not all writes. Eleven
scripts write to `data/`, `.tmp/`, and temp directories today; none of them is
refactored, and routing general writes through the helper is a non-goal. Two
limits are stated rather than assumed: the scan matches path **literals**, so a
path assembled at runtime evades it, and `*.test.mjs` is out of scan scope
because a graph run does not execute test files.

Writes into the mirror tree `.agents/skills/` belong to the sync path alone,
through `mirrorSkillTrees()`. Hand-editing a mirror is the drift this guards.

The `thejudge-*/**` deny is a **graph-run boundary, not an authoring
restriction**. Skill authoring happens in ordinary sessions, which do not load
the profile, and `graph-run` / `graph-preflight` skill files are not denied at
all.

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

## One run at a time

`graph-preflight` takes `.worktrees/.graph-run.lock` before any mutation — a
JSON record of the slug, run id, PID, and start time, under the already-ignored
`.worktrees/` root so it never travels with a branch. A second run refuses while
it is held and relays a message naming the holding slug, run id, and PID. A lock
whose PID is not running is reported **stale** with the reclaim command stated,
never silently stolen; an unparseable lock stops the run rather than reading as
absent. The decision is `classifyLock()` in `scripts/graph-preflight.mjs`, a
tested pure function.

Two runs against one launch checkout both commit to it, both rewrite
`GRAPH-RUN.md`, and both publish before `build` — the shared-working-directory
hazard of 2026-08-17 with no isolation between them.

The run releases the lock on every state in `graph-run`'s `## Terminal states`
table. That table is the definitive list and this contract does not restate it:
a release path enumerated in two places drifts, and a lock released on a state
one list omits is a stranded lock.

## Terminal states

`.claude/skills/graph-run/SKILL.md`'s `## Terminal states` table is the single
authority for the four run-ending states — `COMPLETE`, `PARKED`, `BLOCKED`, and
`PROMPTED` — including each one's required result and exact next step. This
contract deliberately keeps no second copy: two lists of terminal states drift,
and a lock released on a state one list omits is a stranded lock.

## Related material

- `PRD/instructions/preparation-contract.md` — the assumption ladder and
  genuine-blocker test this contract reuses verbatim
- `PRD/instructions/workflow-reference.md` — status vocabulary and marker rules
- `PRD/instructions/runtime-process-hygiene.md` — browser/server cleanup
- `.claude/skills/graph-run/reference.md` — operational node detail
- `AGENT-SKILLS.md` — skill catalog and sync workflow
