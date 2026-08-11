---
name: proj-map-out
description: >-
  Creates GAMEPLAN.md and lettered slice docs in PRD/work/<slug>/ for agent
  implementation, and sets STATUS.active. Use after quality-check passes, once
  the work is ready to be sliced for implementation.
---

# <Product> Map Out

## Goal

Turn an approved brief into an architecture note and a set of slices that a cold
agent can execute one at a time.

## Inputs

A work package slug or path. Requires a recorded quality-check PASS.

## Reads

- `PRD/work/<slug>/DESIGN-BRIEF.md` and `README.md`
- The `PRD/sections/` files the brief references
- `PRD/instructions/doc-lifecycle.md`
- `PRD/instructions/requirement-format.md`
- `PRD/instructions/workflow-reference.md`
- `PRD/instructions/runtime-process-hygiene.md` (if any surface is browser-observable)
- `reference.md` in this skill folder

## Writes

- `PRD/work/<slug>/GAMEPLAN.md`
- `PRD/work/<slug>/slice-<letter>-<name>.md`, one per slice
- `PRD/work/<slug>/README.md` — slice table, implementation map, `status: active`
- `STATUS.active` marker and the board row

## Procedure

1. Verify the package is `refined` with a recorded quality-check PASS. Refuse
   otherwise.
2. Write `GAMEPLAN.md`: architecture seams, the explicit "what must not change"
   list, the slice dependency graph, and the verification contract.
3. Cut slices. Each slice has **one** objective — if the goal sentence needs an
   "and", split it.
4. Write each slice from the template in `reference.md`. Every acceptance
   criterion must be verifiable by a named command or an explicitly described
   manual check.
5. Default every slice to parallel-ready. A sequential slice must name its
   prerequisite letter and a one-line reason.
6. Give browser-risk slices a runtime-cleanup acceptance criterion.
7. Append the PRD promotion checklist and the ship gates block to the **final**
   slice only.
8. Update the README and set the package to `active`.

## Status transitions

`refined` → `active`.

## Gates

- Never write product code.
- Never start without a recorded quality-check PASS.
- Never leave a dependency vague. "Depends on other slices" is not a dependency.
- `Files touched` in each slice is a real prediction, not a formality.

## Next step

Run `/proj-implement PRD/work/<slug>/ slice <first letter>` to execute the first
slice, or `/proj-implement-all PRD/work/<slug>/` for an unattended full run.
(Codex: `$proj-*`.)
