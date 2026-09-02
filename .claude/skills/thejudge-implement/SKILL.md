---
name: thejudge-implement
description: >-
  Implements one lettered slice from an existing PRD/work/<slug>/ GAMEPLAN end
  to end — code, tests, verification, status update. When the last slice is
  done, sets STATUS.ship-ready. Use after map-out, or whenever a single slice
  needs to be executed in this session. For completing every remaining slice
  in one unattended session, use thejudge-implement-all instead.
---

# TheJudge Implement

## Goal

Execute one existing implementation slice from `PRD/work/<slug>/` end to end —
including *applying* the approved product-truth proposal. Refinement proposed the
`PRD/sections/` truth in `GATE-QUESTIONS.md`; implementation is where it is
written to `PRD/sections/` **by intent, together with the code**, in the slice's
PR (see `PRD/instructions/graph-workflow-contract.md`, `## Propose / apply /
close`).

## Inputs

Work slug or `PRD/work/<slug>/` path. Optional slice letter or slice doc path — if omitted, choose the first slice whose status is not `done`, ordered alphabetically.

## Reads

1. `PRD/work/<slug>/README.md`
2. `PRD/work/<slug>/GAMEPLAN.md`
3. The selected `PRD/work/<slug>/slice-*.md`
4. Files listed in the selected slice's `Files touched`
5. Relevant existing tests and local code patterns
6. This skill's `reference.md` for the binding implementation constraints
7. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties
8. `PRD/work/<slug>/GATE-QUESTIONS.md` (the approved proposal) and
   `DESIGN-BRIEF.md` (the intent) when the slice applies durable product truth

Read other PRD files only when the selected slice references them or the change needs a decision check.

## Writes

- Product code and tests within the selected slice's `Files touched`
- Durable `PRD/sections/` truth, when this slice applies the proposal: the real
  edits **derived by intent** from the approved `GATE-QUESTIONS.md` diff and
  `DESIGN-BRIEF.md` against *current* truth — re-derived, never a blind replay of
  the frozen patch — committed **together with the code** that realizes them. A
  `reject`ed id is not applied; its number stays burned. Applied **exactly once**
  across the package: the slice the GAMEPLAN assigns, else the slice whose code
  realizes that product behavior
- Slice doc status line (see `reference.md`)
- `PRD/work/<slug>/README.md` slice table/status notes, when present
- Package status when the last remaining slice becomes `done` (see Status transitions)

## Status transitions

- While any slice is not yet `done`: keep package `active` / `STATUS.active`.
- When this session marks the **last** remaining slice `done`: set
  `status: ship-ready`, replace marker with `STATUS.ship-ready`, move board
  row under `## ship-ready` in `PRD/work/STATUS.md`.

## Gates

- Follow `GAMEPLAN.md` and the selected slice doc; do not regenerate them.
- Confirm the selected slice's dependencies are done before starting.
- Mark the slice `in-progress` before code edits; `done` only after its verification command passes in this session; `blocked` only when the blocker cannot be resolved in-session — report the failing command and the blocker.
- Keep edits limited to the selected slice unless a dependency forces a small supporting change.
- A slice with browser or dev-server acceptance criteria is not `done` until `PRD/instructions/runtime-process-hygiene.md`'s cleanup contract evidence (browser-close, process-stop, port-release, capture output path) is recorded, and the recorded capture path resolves under the active package folder — `PRD/work/<slug>/.playwright-mcp/` — or the documented fallback. An unresolved ownership/cleanup failure keeps the slice `blocked`, not `done`.
- Apply durable `PRD/sections/` truth **only** as the approved proposal by intent,
  in the slice that carries it, together with the code — never invent product truth
  the proposal did not carry, and never re-apply what an earlier slice already did.
- Never run `thejudge-map-out`, rewrite `GAMEPLAN.md`/slice docs (beyond status),
  start multiple slices in one session unless asked, run cleanup, or do cleanup's
  close-time promotion (the `system-map.md` shipped flip and the receipt).
- Every implementation constraint in `reference.md` is binding.

## Next step

More slices remain → `/thejudge-implement PRD/work/<slug>/ slice <next letter>` (or `next slice` for Claude Code).
All slices done (`ship-ready`) → `/thejudge-cleanup PRD/work/<slug>/`.

(`$thejudge-*` in Codex.)
