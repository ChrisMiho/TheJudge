---
name: thejudge-map-out
description: >-
  Creates GAMEPLAN.md and lettered slice docs in PRD/work/<slug>/ for
  sequential agent implementation, and sets STATUS.active. Use after
  quality-check passes, once the work is ready to be sliced for
  implementation.
---

# TheJudge Map Out

## Goal

Produce an implementation-ready work package with lettered slices.

## Inputs

Work slug.

## Mode

Direct invocation keeps the implementation handoffs below.

When the controlling agent explicitly states `thejudge-prepare is controlling`,
read `PRD/instructions/preparation-contract.md`, require `Quality-check: PASS`
in the package README's `Preparation gate` section, create the same
GAMEPLAN/slice contract, and return control to `thejudge-prepare` for
independent review, fresh verification, and publication. The successful
post-merge handoff remains
`$thejudge-implement-all PRD/work/<slug>/`.

## Reads

1. `PRD/work/<slug>/DESIGN-BRIEF.md`
2. Refined `PRD/sections/` referenced in the brief
3. `PRD/instructions/doc-lifecycle.md`
4. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties
5. This skill's `reference.md` for the slice template and Ship gates block

## Writes

- `PRD/work/<slug>/GAMEPLAN.md` — architecture, data flow, verification checklist
- `PRD/work/<slug>/slice-a-*.md` … `slice-n-*.md`
- Update `PRD/work/<slug>/README.md` — slice table, implementation map, `status: active`
- Empty marker `STATUS.active` (replace any prior STATUS.*); board row under `## active` in `PRD/work/STATUS.md`

## Gates

- One primary objective per slice; explicit dependencies stated in the README table.
- Each slice: Status, Goal, Requirements, Files touched, Tests, Acceptance criteria.
- Each acceptance criterion must be verifiable — a test command or an explicit manual check.
- Default parallel-ready; sequential only with a stated blocker.
- Final slice carries the PRD promotion checklist (execution happens in cleanup) and the Ship gates block from `reference.md`.
- Never write product code from this skill; never persist plans to tool-specific plan folders — `PRD/work/` is the only location.
- In orchestrated mode, do not map without `Quality-check: PASS` in the package
  README and do not publish directly.

## Next step

Orchestrated mode: return the mapped package to `thejudge-prepare` for review,
verification, and publication.

Direct mode: `/thejudge-implement PRD/work/<slug>/ slice <first letter>` (Cursor
/ Claude Code) or `$thejudge-implement PRD/work/<slug>/ slice <first letter>`
(Codex) — substitute the first slice letter from the README slice table, not
assumed `A`.

For one unattended agent completing every slice, use `/thejudge-implement-all PRD/work/<slug>/` (`$thejudge-implement-all` in Codex).
