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
user questions, approval pauses, and handoffs — identical to the
`thejudge-prepare is controlling` predicate in `preparation-contract.md`.

## Node table

| # | Node | Delegates to | Model | Advances to |
| --- | --- | --- | --- | --- |
| 1 | `preflight` | `graph-preflight` | haiku | `shape` |
| 2 | `shape` | `thejudge-kickoff` | sonnet | `define` |
| 3 | `define` | `thejudge-refinement` | opus | `gate-qc` |
| 4 | `gate-qc` | `thejudge-quality-check` | sonnet | `plan` on PASS, `define` on FAIL |
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

## Ledger

Every run writes `PRD/work/<slug>/GRAPH-RUN.md`, committed with the run's
documentation changes:

```markdown
# Graph run — <slug>

- Run ID: `graph-<YYYYMMDD>-<n>`
- Profile: `.claude/graph-profile.json`
- Autonomous base: `origin/<branch>`
- Current node: `<node>`
- Next action: `/graph-run PRD/work/<slug>/`

## Node ledger

| # | Node | Model | Outcome | Evidence | Date |
| --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | branch `<branch>` pushed; stash `graph-preflight/<run-id>` | <date> |

## Open gate

- None
```

`Outcome` is one of `ok`, `failed`, `parked`. `Evidence` names a command, path,
PR URL, or artifact URL — never a bare claim. A fresh agent reads this file and
`PRD/work/<slug>/README.md` and needs nothing else to resume.

## Stashed work handoff

When `graph-preflight` stashes, it records the stash under `## Open gate` in
the ledger and in the package README, naming the exact restore command:

```text
git stash list | grep graph-preflight/<run-id>
git stash apply <ref>
```

A graph run never drops, pops, or reorders any stash. The preflight stash contains the user's uncommitted work and must be restored manually.

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
decisions and tests; a third `review`-to-`build` loop; or any `blocked`
preflight classification.

## Boundaries

A graph run may not:

- merge or close a pull request, or force-push by any flag
- modify any `thejudge-*` skill
- run `npm run data:refresh` or any Scryfall network refresh
- read, write, or commit anything matching `.secrets/`
- create or adopt a worktree outside the repo-local `.worktrees/` root
- drop, pop, or reorder any stash
- use `nohup`, untracked background `&`, `pkill`, or `killall`

The permission profile at `.claude/graph-profile.json` enforces these
mechanically. The list above is the reason each deny entry exists.

## Related material

- `PRD/instructions/preparation-contract.md` — the assumption ladder and
  genuine-blocker test this contract reuses verbatim
- `PRD/instructions/workflow-reference.md` — status vocabulary and marker rules
- `PRD/instructions/runtime-process-hygiene.md` — browser/server cleanup
- `.cursor/skills/graph-run/reference.md` — operational node detail
- `AGENT-SKILLS.md` — skill catalog and sync workflow
