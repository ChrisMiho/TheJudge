# Receipt — overnight-run-tuning

- Date: 2026-08-28
- Slug: `overnight-run-tuning`
- Status: **shipped** (PR #133 merged to `main`, merge `6a4e18b`)
- Kind: interactive package (not a graph run, not a sweep) — Package 2 of the
  docs-refactor

## What shipped

Tuned the autonomous graph workflow so an overnight batch runs unattended and
reviews on the owner's schedule. Design record: `DESIGN-BRIEF.md` (in the deleted
work folder) + the edited `PRD/instructions/graph-workflow-contract.md`.

- **Two-run split.** Run one drives `preflight → shape → define → gate-qc` and
  stops at quality-check PASS with a docs-only base→main PR and a
  `GATE-QUESTIONS.md`; run two applies the answers and implements. Only the stop
  condition and the gate's answer mechanism moved — the contract node table,
  per-node models, caps, and boundary deny list are byte-unchanged.
- **Async markdown gate.** `graph-gate-review` rewritten from a live terminal
  walk into a reader that applies an answered `GATE-QUESTIONS.md` and refuses any
  blank verdict slot.
- **base→main made un-skippable.** Run one opens the `thejudge-auto/<slug> → main`
  PR up front (create, not merge). New pure function `classifyPendingBaseToMain`
  in `graph-preflight.mjs` refuses the next fresh run while a prior base→main PR
  is open, and fails closed if `gh` cannot answer.
- **Morning digest.** New read-only `npm run graph:digest`
  (`scripts/graph-digest.mjs`) summarizes each package's run state, recent
  receipts, and pending base→main PRs.
- **Loose ends.** Dropped the per-run `CODE-HEALTH.md` requirement from
  `refactor-gameplan.md`; unblocked Package 2 in `PROGRESS.md` and marked its
  base→main / CODE-HEALTH loose ends resolved.

## Files created

- `scripts/graph-digest.mjs`
- `scripts/graph-digest.test.mjs`

## Files updated

- `scripts/graph-preflight.mjs` — `classifyPendingBaseToMain` + guard wiring
- `scripts/graph-preflight.test.mjs` — 6 guard tests
- `package.json` — `graph:digest` script
- `.claude/skills/graph-run/SKILL.md`, `.claude/skills/graph-run/reference.md`
- `.claude/skills/graph-gate-review/SKILL.md` (reader rewrite)
- `.claude/skills/graph-preflight/SKILL.md` (guard step)
- `.agents/skills/**` — mirror of the four edited skills (`skills:ai-sync`)
- `PRD/instructions/graph-workflow-contract.md` — `## The two runs`, async gate,
  run-one PR, guard reference
- `PRD/work/adhoc/refactor-gameplan.md` — CODE-HEALTH dropped
- `PRD/work/adhoc/PROGRESS.md` — Package 2 unblocked, loose ends resolved

## Files deleted

- `PRD/work/overnight-run-tuning/` — the work package (this cleanup)

## Verification

- `npm run quality:check` — green (exit 0)
- `npm run test:scripts` — 420 pass (13 new: 6 preflight guard + 7 digest)
- C5 byte-unchanged asserts — contract node table rows and boundary deny list
  unchanged (grep-assert)
- `npm run graph:digest` — runs read-only (no working-tree change), output as
  designed
- `.agents/skills/` mirror byte-identical to `.claude/skills/` after
  `skills:ai-sync`

## Note

This changes *how the graph runs behave*; it takes effect on the **next** graph
run, which will be the first to exercise the two-run split and the async gate
live.
