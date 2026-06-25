---
name: thejudge-map-out
description: >-
  Creates GAMEPLAN and lettered slice docs in PRD/work/<slug>/ for agent
  implementation. Use after quality-check passes.
---

# TheJudge Map Out

## Goal

Produce an implementation-ready work package with lettered slices.

## Shared output guidance

Read the shared response guidance at `../thejudge-output-guidance.md` (canonical path: `.cursor/skills/thejudge-output-guidance.md`) and apply it to this workflow's user-facing output. This affects response length only; preserve all reads, writes, gates, verification, and handoff requirements below.

## Inputs

User provides work slug.

## Reads

1. `PRD/work/<slug>/DESIGN-BRIEF.md`
2. Refined `PRD/sections/` referenced in brief
3. `PRD/instructions/workflow-reference.md` (slice template)
4. `PRD/instructions/doc-lifecycle.md`

## Writes

- `PRD/work/<slug>/GAMEPLAN.md` — architecture, data flow, verification checklist
- `PRD/work/<slug>/slice-a-*.md` … `slice-n-*.md`
- Update `PRD/work/<slug>/README.md` — slice table, implementation map, `status: active`

## Slice rules

- One primary objective per slice
- Explicit dependencies in README table
- Each slice: Status, Goal, Requirements, Files touched, Tests, Acceptance criteria
- Each acceptance criterion must be verifiable (test command or explicit manual check)
- Include file paths and verification commands
- Final slice includes PRD promotion checklist (execution in cleanup skill) and Ship gates from `workflow-reference.md`
- Default parallel-ready; sequential only with stated blocker

## Do not

- Write product code
- Persist to tool-specific plan folders

## Handoff

After GAMEPLAN and slices are written, end with **Next step** — all three platforms, in order: Cursor, Codex, Claude Code. Substitute `<slug>` and the first slice letter from the README slice table (not assumed `A`). Templates: `PRD/instructions/workflow-reference.md` (Handoff blocks).

Next skill: `thejudge-implement` with first slice letter.
