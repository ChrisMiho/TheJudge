# Agent Workflow Skills

TheJudge uses 11 `thejudge-*` skills to drive PRD-based feature work, plus 2
`graph-*` skills that chain them into autonomous runs, including
autonomous preparation, sequential single-slice, unattended all-slice, and
cross-package fanout modes. All 11 are
**model-invocable** — the agent may select the matching skill when context
clearly indicates it — and every skill remains callable explicitly
(`/thejudge-*` in Cursor and Claude Code, `$thejudge-*` in Codex).

## Single source + sync

Skills are **not** maintained in three separate copies. Edit only:

`.cursor/skills/thejudge-*/`

Codex and Claude Code load skills from their own conventional paths. This repo
copies the canonical tree into those paths with:

```bash
npm run skills:ai-sync
```

| Platform | Discovery path | Role |
| --- | --- | --- |
| Cursor | `.cursor/skills/` | **Canonical** — edit here |
| Codex | `.agents/skills/` | Synced copy |
| Claude Code | `.claude/skills/` | Synced copy |

Run `npm run skills:ai-sync` after any skill change, then commit
`.cursor/skills/`, `.agents/skills/`, and `.claude/skills/` together. All
three trees are byte-identical after a sync — every skill runs in every
runtime.

## Workflow sequence

```mermaid
flowchart LR
  prepare[thejudge-prepare] -. controls .-> kickoff
  prepare -. READY after human merge .-> implementall
  kickoff[thejudge-kickoff] --> refinement[thejudge-refinement]
  refinement --> qc[thejudge-quality-check]
  qc --> mapout[thejudge-map-out]
  mapout --> implement[thejudge-implement]
  mapout --> implementall[thejudge-implement-all]
  implement --> cleanup[thejudge-cleanup]
  implementall --> cleanup
  fanout[thejudge-implement-fanout] -. dispatches one package each .-> implementall
  amend[thejudge-amend] -. FOLD .-> implement
  amend -. RECORD / scope exceeded .-> refinement
```

`thejudge-amend` is the intake door for new items arriving at an `active`
package. It routes each item to an existing slice, holds it for refinement, or
refuses it — and owns no status transitions, so a mid-flight package keeps
implementing while a batch is triaged. It exists so that folding a few reports
into already-sliced work does not require a full
refinement → quality-check → map-out round-trip. Before map-out it refuses:
refinement is the cheap path while nothing is sliced.

`thejudge-implement-fanout` is the cross-package entry point: given two or
more simultaneously `active` packages, it dispatches one isolated worktree +
agent per package, each running `thejudge-implement-all` against that
package's own GAMEPLAN. It does not replace `thejudge-implement` or
`thejudge-implement-all` — it drives one unattended run per package.

`thejudge-defer` can move any non-`ship-ready` package to `deferred` and back,
orthogonal to the pipeline shown above.

## Skill catalog

| Skill | When | Writes | Status | Next |
| --- | --- | --- | --- | --- |
| `thejudge-prepare` | One arbitrary request needs autonomous preparation before an unattended implementation loop | One reviewed `PRD/work/<slug>/` package plus a docs-only preparation branch/PR, or `NO ACTIONABLE PACKAGE` | READY → `active`; BLOCKED preserves the furthest valid status | After human merge, `thejudge-implement-all` |
| `thejudge-kickoff` | New session or new feature idea | `IDEA.md`, `README.md`, `STATUS.ideation`, board row | → `ideation` | `thejudge-refinement` |
| `thejudge-refinement` | An idea needs product definition | `DESIGN-BRIEF.md`, section updates | `refining` → (on approval) `refined` | `thejudge-quality-check` |
| `thejudge-quality-check` | After refinement, before slicing | PASS/FAIL report only | PASS keeps `refined`; FAIL → `refining` | `thejudge-map-out` (PASS) or `thejudge-refinement` (FAIL) |
| `thejudge-map-out` | Quality-check passed; slices are sequential | `GAMEPLAN.md`, `slice-*.md`, README | → `active` | `thejudge-implement` or unattended `thejudge-implement-all` |
| `thejudge-implement` | Executing one planned slice | Product code and tests for that slice | Last slice done → `ship-ready` | `thejudge-implement` (next slice) or `thejudge-cleanup` |
| `thejudge-implement-all` | Executing every remaining slice in one unattended single-agent run | Product code, tests, milestone commits, shared GitHub branch, and review PR | All slices done → `ship-ready` | Manual review/merge, then `thejudge-cleanup` after shipping |
| `thejudge-implement-fanout` | Two or more packages are `active` and should implement concurrently | Nothing directly; dispatches one isolated worktree/agent per package into `thejudge-implement-all` | Owned per-package by the dispatched skill | Manual review/merge each PR, then `thejudge-cleanup` per package |
| `thejudge-amend` | New issues/requests arrive for an `active` package that is already mapped out | Slice requirements for folded items; a dated `## Amendments` entry for held items; nothing else | None — never transitions status | `thejudge-implement` for folded work; `thejudge-refinement` for held items |
| `thejudge-defer` | A package should be parked as not-next work, or a parked package restored | README deferral record, `STATUS.deferred` marker, board row | Toggles current ⇄ `deferred` | None when deferring; the typical next skill for the restored status when restoring |
| `thejudge-cleanup` | Package is `ship-ready` (or force override), or explicit corpus hygiene | Receipt under `PRD/instructions/receipts/`, section promotions, board strip | Delete folder + remove board row | Optional `thejudge-kickoff` |

## Graph workflow skills

Two `graph-*` skills chain the lifecycle above into one autonomous run. They
**delegate** to the `thejudge-*` skills rather than reimplementing them — the
eleven skills above stay unchanged.

| Skill | When | Writes | Delegates to |
| --- | --- | --- | --- |
| `graph-preflight` | Before an autonomous run, to guarantee a clean freshly branched checkout | Auto-commit or stash, new pushed branch, handoff record | `scripts/graph-preflight.mjs` |
| `graph-run` | Advancing one package through the full lifecycle without per-step input | `PRD/work/<slug>/GRAPH-RUN.md` ledger, status transitions, gate parks | Every `thejudge-*` phase skill |

Graph runs load `.claude/graph-profile.json` as their permission profile:

```bash
claude --settings .claude/graph-profile.json
```

Full contract, node table, model map, and boundaries:
`PRD/instructions/graph-workflow-contract.md`.

Package status signals (skill-maintained on every transition):

- `PRD/work/<slug>/README.md` — `status: <value>`
- Exactly one empty `PRD/work/<slug>/STATUS.<value>` marker
- Board: `PRD/work/STATUS.md` (canonical list; `PRD/README.md` has a single-line pointer only)

Full vocabulary and rules: `PRD/instructions/workflow-reference.md`.

## Session handoffs

Every skill that hands off ends with a **Next step**: one sentence plus the
literal command, prefixed `/thejudge-*` (Cursor, Claude Code) or `$thejudge-*`
(Codex).

## Adding or updating a skill

1. Create or edit under `.cursor/skills/<skill-name>/`.
2. If the edit changes behavior — gates, refusal conditions, outcome taxonomy,
   rationalizations, or the `description` — run that skill's fixture under
   `PRD/instructions/skill-fixtures/` before merging. Format and re-run triggers:
   `PRD/instructions/skill-testing.md`. Method: `superpowers:writing-skills`.
3. Run `npm run skills:ai-sync`.
4. Verify: `diff -rq .cursor/skills .claude/skills` and `diff -rq .cursor/skills .agents/skills` — both must produce no output (the trees are now a plain three-way mirror; no expected exclusions).
5. Commit all three skill trees.

## Related docs

- `PRD/instructions/workflow-reference.md` — handoff prefix rule, work-folder lifecycle, package status vocabulary + STATUS.* markers
- `PRD/work/STATUS.md` — skill-maintained work-package board
- `PRD/instructions/preparation-contract.md` — autonomous one-package preparation, assumptions, blockers, and publication
- `PRD/README.md` — product control plane
- `.cursor/skills/thejudge-kickoff/reference.md` — PRD quick map
