# Gameplan — graph-single-door-workflow

- Slug: `graph-single-door-workflow`
- Decision: DEC-167
- Requirements: REQ-160, REQ-161, REQ-162, REQ-163, REQ-164
- Flows: FLOW-021, FLOW-022
- Authority: `DESIGN-BRIEF.md`. This file plans how to build it; the brief
  decides what is built.

## What the owner gets

The owner types `/graph-run "<what is wrong or what they want>"` and stops
typing. No branch name, no orchestrator choice, no deciding whether the thing
is an idea or a bug. They can hand over one or more markdown documents in the
same breath. The next time they are asked anything is the `define` gate, where
new product truth is walked one stable ID at a time.

## Build mode — an ordinary session, never a graph run

This is the one package the graph cannot build itself.

REQ-161, REQ-162, and REQ-163 edit `thejudge-kickoff`, `thejudge-refinement`,
and `thejudge-cleanup`. `graph-workflow-contract.md`'s `## Boundaries` forbids a
graph run from modifying any `thejudge-*` skill in either synced tree, and
`.claude/graph-profile.json` denies `Edit(./.claude/skills/thejudge-*/**)` plus
its `.agents/` twin. A graph run would terminate `PROMPTED` on slices B, D, E,
and G.

The boundary is not relaxed. Implement with `/thejudge-implement` or
`/thejudge-implement-all` in an ordinary interactive session.

## Architecture

Nothing new is built. Every change is text in a skill file or a contract, and
the machinery it drives already exists.

| Existing mechanism | What this package adds |
| --- | --- |
| `graph-run` accepts a request plus `--branch` | `--branch` becomes optional; the door derives it |
| `graph-preflight` accepts a caller-chosen `--run-id` | The door mints the id before node 1 and derives the staging path from it |
| Node 2 delegates to `thejudge-kickoff`, which proposes a slug | Kickoff accepts a supplied slug instead |
| `.worktrees/` is gitignored and `git stash push -u` spares ignored paths | Intake stages at `.worktrees/.graph-intake/<run-id>/` |
| `PRD/instructions/receipts/` is named `<slug>-<date>.md` | Node 2 greps it and writes `## Prior run` lines |
| `graph-run`'s four terminal states | `BLOCKED` widens to cover a request too thin to package |
| Cleanup folds `GRAPH-RUN.md` into the receipt before deleting | It also folds an `## Intake` section |

No fifth terminal state. No new node. No change to the node table, models,
caps, loop limits, the `define` gate trigger, or `## Boundaries`.

## Data flow — one run, end to end

```
owner: /graph-run "<request>" [paths...] | pasted markdown
  │
  ├─ door: read intake material (paths and pasted markdown)
  │        a supplied path that cannot be read → report and stop before node 1
  ├─ door: propose slug — intake's own proposed slug wins over derivation
  ├─ door: branch = thejudge-auto/<slug>, unless --branch overrides
  ├─ door: mint --run-id; write intake verbatim to
  │        .worktrees/.graph-intake/<run-id>/   ← outside the working tree
  │
  ├─ node 1  preflight   --branch <derived|supplied> --run-id <minted>
  │          takes the lock, resolves the dirty tree, pushes the branch
  │          (this sweep is exactly why intake is staged outside the tree)
  │
  ├─ node 2  shape → thejudge-kickoff
  │          receives the slug, uses it; greps receipts → ## Prior run lines
  │          creates PRD/work/<slug>/; copies staging → intake/; commits;
  │          deletes the staged copy; first ledger write records staging path
  │          └─ NO ACTIONABLE PACKAGE → run ends BLOCKED (slice F)
  │
  ├─ node 3  define → thejudge-refinement
  │          reads intake/ as evidence; decides no product truth from it alone
  │          non-empty PRD/sections/ diff → park at the define gate
  │
  └─ nodes 4–9 unchanged … node 9 close → thejudge-cleanup
             writes ## Intake into the receipt before deleting the package
```

The one ordering trap, stated once: the package folder does not exist until
node 2 creates it. So the ledger cannot record anything before node 1, and
intake cannot live in the package before node 2. Both are handled at node 2's
first ledger write.

## Slices

| Slice | Objective | Requirement | Depends on |
| --- | --- | --- | --- |
| A | `thejudge-prepare` retired as an entry point; `graph-run` named as the door | REQ-160 | — |
| B | The door names the work before node 1 | REQ-161 | A |
| C | Intake is staged, copied, and committed | REQ-162, FLOW-022 | B |
| D | Intake is evidence, never authority | REQ-162 | C |
| E | Prior shipped runs are linked from receipts | REQ-163, FLOW-021 | B |
| F | A request too thin to package ends `BLOCKED` | REQ-164 | C |
| G | Cleanup folds intake into the receipt | REQ-162 | — |
| H | Skill fixtures for every changed skill | DEC-167 | A–G |
| I | Mirror sync, promotion checklist, ship gates | DEC-167 | H |

A, B, C, D, and F run sequentially: they share
`.claude/skills/graph-run/SKILL.md` and
`PRD/instructions/graph-workflow-contract.md`, and concurrent edits to either
would collide. E and G are parallel-ready — E touches only
`thejudge-kickoff/SKILL.md` after B has landed, G only
`thejudge-cleanup/SKILL.md`.

## Files touched across the package

| File | Slices |
| --- | --- |
| `.claude/skills/graph-run/SKILL.md` | B, C, F |
| `.claude/skills/thejudge-kickoff/SKILL.md` | B, C, E |
| `.claude/skills/thejudge-refinement/SKILL.md` | D |
| `.claude/skills/thejudge-cleanup/SKILL.md` | G |
| `PRD/instructions/graph-workflow-contract.md` | A, B, C, D, F |
| `AGENT-SKILLS.md` | A |
| `PRD/instructions/skill-fixtures/**` | H |
| `.agents/skills/**` | every skill-editing slice, via `npm run skills:ai-sync` |

Deliberately not touched: `.claude/skills/thejudge-prepare/SKILL.md`,
`PRD/instructions/preparation-contract.md`, `.claude/graph-profile.json`,
`scripts/graph-preflight.mjs`, `scripts/graph-boundary-hook.mjs`, and the
contract's `## Boundaries` list. A diff touching any of them is out of scope.

## Verification checklist

Run at the end of every slice that edits a skill file:

```bash
npm run skills:ai-sync
diff -rq .claude/skills .agents/skills   # must print nothing
```

Run at the end of the package:

```bash
npm run quality:check
git diff --name-only main...HEAD         # must match the table above
```

No browser-observable risk. This package changes agent instructions and
contract prose; nothing renders. Per
`PRD/instructions/runtime-process-hygiene.md`, Playwright verification is not
required and no slice carries browser scenarios or cleanup-evidence criteria.

Behavioral proof is skill fixtures, not unit tests. Per
`PRD/instructions/skill-testing.md`, every skill whose gates, refusal
conditions, outcome taxonomy, or `description` change gets a fixture run before
merge — four skills here, authored and measured in slice H. Fixture runs
dispatch subagents and cost real tokens; they are a pre-merge check, never a
`quality:check` gate.

## Stated limits carried into implementation

- Slug derivation is a guess. `--branch` overrides it; a slug proposed by intake
  beats derivation from the request text.
- Prior-run matching is keyword matching over receipt filenames and text. It
  misses a receipt sharing no words with the request, and may offer an
  irrelevant one. A false match costs refinement a read.
- "Evidence, not authority" is a contract rule with no enforcement. The `define`
  gate is what catches an intake claim adopted wholesale.
- A `BLOCKED` thin-request run leaves a pushed branch and a staged intake folder
  behind. Both are named in the report; neither is cleaned up.
