---
status: ship-ready
---

# overnight-run-tuning

Package 2 of the docs-refactor — tune the graph workflow so an overnight batch
runs unattended and reviews on the owner's schedule. Design record: `IDEA.md` →
`DESIGN-BRIEF.md` → `GAMEPLAN.md`.

Interactive package (not a graph run, not a sweep): kickoff → refinement →
quality-check → map-out → implement. PR to `main`; the owner merges.

## Slices

| Slice | Objective | Status | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-base-to-main-guard.md) | base→main preflight guard (`classifyPendingBaseToMain` + test + skill) | done | — |
| [B](./slice-b-morning-digest.md) | morning digest script (`graph-digest.mjs` + test + `graph:digest`) | done | — |
| [C](./slice-c-async-two-run-workflow.md) | async two-run workflow (contract + `graph-run` + `graph-gate-review`) | done | A |
| [D](./slice-d-loose-ends-and-closeout.md) | loose ends + mirror sync + ship gates | done | A, B, C |

Sequential: A → B → C → D.

## Implementation map

- **Scripts:** `scripts/graph-preflight.mjs` (+ `classifyPendingBaseToMain`, test),
  new `scripts/graph-digest.mjs` (+ test), `package.json` (`graph:digest`).
- **Skills:** `graph-preflight` (guard step), `graph-run` SKILL + reference
  (two-run stop, questions-file write, run-one base→main PR), `graph-gate-review`
  (reader rewrite). Mirrored to `.agents/skills/` via `skills:ai-sync` in slice D.
- **Contract:** `PRD/instructions/graph-workflow-contract.md` (stop condition,
  async gate, run-one PR, guard reference) — node table / models / caps / deny
  list byte-unchanged.
- **Docs:** `PRD/work/adhoc/refactor-gameplan.md` (drop CODE-HEALTH),
  `PRD/work/adhoc/PROGRESS.md` (unblock Package 2, strike base→main loose end).

## Verification

`npm run test:scripts` and `npm run quality:check` green; node table + deny list
byte-unchanged (grep-assert, slice C); `.agents/skills/` in sync (slice D).
