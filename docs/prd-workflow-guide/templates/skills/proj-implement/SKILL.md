---
name: proj-implement
description: >-
  Implements one lettered slice from an existing PRD/work/<slug>/ GAMEPLAN end
  to end — code, tests, verification, status update. When the last slice is
  done, sets STATUS.ship-ready. Use after map-out, or whenever a single slice
  needs to be executed in this session. For completing every remaining slice in
  one unattended session, use proj-implement-all instead.
---

# <Product> Implement

## Goal

Take one slice from `planned` to `done`, with verification evidence.

## Inputs

A work package slug or path. Optionally a slice letter — defaults to the first
slice that is not `done`, in alphabetical order.

## Reads

- `PRD/work/<slug>/README.md` and `GAMEPLAN.md`
- The selected slice document, including any `### Handoff` block
- The files named in the slice's `Files touched`, and their tests
- `PRD/instructions/technical-design-rules.md`
- `PRD/instructions/test-naming.md`
- `PRD/instructions/workflow-reference.md`
- `reference.md` in this skill folder

## Writes

- Product code and tests, within the slice's scope
- The slice's status line and verification evidence
- The README slice table
- `STATUS.ship-ready` when the last slice completes

## Procedure

1. Select the slice. If it has a `### Handoff` block, that block plus the status
   line is your full briefing — resume from `Next`.
2. Confirm every prerequisite slice is `done`. Refuse to proceed otherwise.
3. Set the slice to `in-progress` **before** making any edit. This is what makes
   an interrupted session recoverable.
4. Implement, staying inside the slice's stated scope. Work outside it belongs
   to another slice or a new package.
5. Run the slice's verification command. Record the evidence in the slice doc.
6. For browser-risk slices, complete and record the runtime cleanup contract.
7. Set the slice to `done` **only after** verification passes. If it cannot be
   completed, set `blocked` and write the handoff block.
8. Update the README slice table.
9. If this was the last remaining slice, set the package to `ship-ready`.

## Status transitions

- Slice: `planned` → `in-progress` → `done` (or `blocked`)
- Package: stays `active` until the last slice is `done`, then `ship-ready`

## Gates

- Never mark a slice `done` without passing verification.
- Never begin a slice whose prerequisites are unfinished.
- Never commit unless the user explicitly asks.
- Never expand scope beyond the slice. Note the discovery and move on.
- If you stop before `done`, write the handoff block before stopping. Always.

## Next step

Slices remain: run `/proj-implement PRD/work/<slug>/ slice <next letter>`.

All slices done: run `/proj-cleanup PRD/work/<slug>/`.

(Codex: `$proj-*`.)
