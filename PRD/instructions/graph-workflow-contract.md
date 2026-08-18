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

Exactly two graph skills exist in the spine: `graph-preflight` and `graph-run`.
Domain node packs (`graph-ui-shape`, `graph-enrich-define`) attach as extra
nodes and are specified separately.

## Run predicate

Graph mode is active only when the driver explicitly states
`graph-run is controlling` when handing work to each node. Without that
observable predicate every phase skill runs directly and preserves its normal
user questions, approval pauses, and handoffs — the same mechanism as the
`thejudge-prepare is controlling` predicate in `preparation-contract.md`.

The four phase skills that gate on the predicate — `thejudge-kickoff`,
`thejudge-refinement`, `thejudge-quality-check`, and `thejudge-map-out` —
accept either orchestrator name in their `## Mode` section. The driver states
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

## Refused instructions

- None
```

`Outcome` is one of `ok`, `failed`, `parked`. `Evidence` names a command, path,
PR URL, or artifact URL — never a bare claim. A fresh agent reads this file and
`PRD/work/<slug>/README.md` and needs nothing else to resume.

`## Refused instructions` quotes every user instruction the run declined to
follow under `## Human gates` — one bullet per instruction, with the rule that
refused it and the node it arose at. It reads `None` only when nothing was
refused; a run that silently absorbed such an instruction leaves no trace here,
which is the failure this section exists to prevent.

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
instruction under `## Refused instructions` in the ledger, so the user who gave
it can see it was not followed.

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

The permission profile at `.claude/graph-profile.json` enforces most of these
mechanically, but **only in a session launched with**
`claude --settings .claude/graph-profile.json`. Nothing detects, enforces, or
records that launch flag, and the driver cannot read its own settings: in a
session started without it, every entry in the profile is inert and the list
above is convention only — binding on the agent's compliance rather than on the
engine. Treat an unverified profile as absent.

Two boundaries stay convention-only even with the profile loaded. `nohup` is
stripped as a wrapper before Bash rules are matched, so the `Bash(nohup*)` deny
can never fire. A trailing `&` is consumed as a command separator before any
rule sees the command text, so no `&` rule is expressible at all — the profile
contains no background-`&` entry, and adding one would not help.

The list above is the reason each deny entry exists.

## Related material

- `PRD/instructions/preparation-contract.md` — the assumption ladder and
  genuine-blocker test this contract reuses verbatim
- `PRD/instructions/workflow-reference.md` — status vocabulary and marker rules
- `PRD/instructions/runtime-process-hygiene.md` — browser/server cleanup
- `.claude/skills/graph-run/reference.md` — operational node detail
- `AGENT-SKILLS.md` — skill catalog and sync workflow
