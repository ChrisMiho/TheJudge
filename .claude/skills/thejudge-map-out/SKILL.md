---
name: thejudge-map-out
description: >-
  Creates GAMEPLAN.md and lettered slice docs in PRD/work/<slug>/ for
  sequential agent implementation, and sets STATUS.active. Use after
  quality-check passes, when the work's slices should be implemented one at a
  time. For work with independent slices worth running concurrently, use
  thejudge-map-out-parallel instead, which adds dependency-wave grouping.
---

# TheJudge Map Out

## Goal

Produce an implementation-ready work package with lettered slices.

## Inputs

Work slug.

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

## Next step

`/thejudge-implement PRD/work/<slug>/ slice <first letter>` (Cursor / Claude Code) or `$thejudge-implement PRD/work/<slug>/ slice <first letter>` (Codex) — substitute the first slice letter from the README slice table, not assumed `A`.

For one unattended agent completing every slice, use `/thejudge-implement-all PRD/work/<slug>/` (`$thejudge-implement-all` in Codex).
