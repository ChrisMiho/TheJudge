---
status: active
---

## Autonomous metadata

- Autonomous base: origin/feature/graph-workflow-hardening

# graph-single-door-workflow

One front door for the whole workflow. The owner describes an idea, an
observation, or a bug — or hands over a context document — and the same flow
runs it through refinement, PRD review, and implementation. The owner names no
branch, picks no orchestrator, classifies nothing, and reviews product truth at
the `define` gate.

`graph-run-boundary-enforcement` landed first and discharged one of this
package's original premises — DEC-166 already deleted the stray domain-node-pack
line.

Refined 2026-08-20 as DEC-167: REQ-160..164, FLOW-021, FLOW-022.
Mapped out 2026-08-20 into nine slices.

## Build mode — an ordinary session, not a graph run

REQ-161, REQ-162, and REQ-163 edit three `thejudge-*` skills, and the graph
contract forbids a graph run from modifying any of them in either synced tree. A
graph run would terminate `PROMPTED` on slices B, D, E, and G. The boundary
stays as written; implement this package interactively.

## Slices

| Slice | Objective | Requirement | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-retire-the-second-door.md) ✅ | `thejudge-prepare` retired as an entry point; `graph-run` named as the door | REQ-160 | — |
| [B](./slice-b-door-names-the-work.md) ✅ | The door names the work before node 1 | REQ-161 | A |
| [C](./slice-c-intake-staging.md) ✅ | Intake is staged, copied, and committed | REQ-162, FLOW-022 | B |
| [D](./slice-d-intake-is-evidence.md) ✅ | Intake is evidence, never authority | REQ-162 | C |
| [E](./slice-e-prior-run-linking.md) ✅ | Prior shipped runs are linked from receipts | REQ-163, FLOW-021 | B |
| [F](./slice-f-thin-request-blocked.md) ✅ | A request too thin to package ends `BLOCKED` | REQ-164 | C |
| [G](./slice-g-cleanup-receipt-intake.md) | Cleanup folds intake into the receipt | REQ-162 | — |
| [H](./slice-h-skill-fixtures.md) | Skill fixtures for every changed skill | DEC-167 | A–G |
| [I](./slice-i-sync-and-promotion.md) | Mirror sync, promotion checklist, ship gates | DEC-167 | H |

A, B, C, D, and F are sequential: they share
`.claude/skills/graph-run/SKILL.md` and
`PRD/instructions/graph-workflow-contract.md`. E and G are parallel-ready — E
after B, G at any time.

## Implementation map

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

Out of scope and untouched: `.claude/skills/thejudge-prepare/SKILL.md`,
`PRD/instructions/preparation-contract.md`, `.claude/graph-profile.json`,
`scripts/graph-preflight.mjs`, `scripts/graph-boundary-hook.mjs`, and the
contract's `## Boundaries` list.

## Refinement history

Quality-check returned it twice.

Round one: intake stages in `.worktrees/.graph-intake/<run-id>/` and is
committed into the package by node 2, because node 1 stashes the working tree
before the branch exists. The `BLOCKED` argument and its recovery action were
rewritten to match.

Round two, four fixes. This package is built in an **ordinary session** — a
graph run may not edit `thejudge-*` skills and three of them change here, so
the brief now says so and the boundary stays as written. `graph-run`'s
`BLOCKED` definition is widened on purpose, as an acceptance criterion DEC-167
claims, because a thin request is neither external nor outside the repository
and the tiebreak would otherwise park it. The staging path is recorded at node
2's first ledger write, since the ledger lives in a package folder node 2
creates. And the `AGENT-SKILLS.md` edits are named: the `## Workflow sequence`
mermaid diagram (`:37-38`), which `graph-run` joins in `thejudge-prepare`'s
place, and the catalog `When` cell (`:72`). Folded in alongside: the "Two
`graph-*` skills" miscount, the caller-chosen `--run-id`, a scope file list,
and the correction that the contract never named `thejudge-prepare` as an entry
point at all.

`DESIGN-BRIEF.md` is authoritative for this package. `GAMEPLAN.md` plans how it
gets built. `IDEA.md` is the capture record the brief supersedes.
