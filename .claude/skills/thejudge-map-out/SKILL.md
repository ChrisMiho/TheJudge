---
name: thejudge-map-out
description: >-
  Creates GAMEPLAN and lettered slice docs in PRD/work/<slug>/ for agent
  implementation. Use after quality-check passes.
disable-model-invocation: true
---

# TheJudge Map Out

## Goal

Produce an implementation-ready work package with lettered slices.

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
- Include file paths and verification commands
- Final slice includes PRD promotion checklist (execution in cleanup skill)
- Default parallel-ready; sequential only with stated blocker

## Do not

- Write product code
- Persist to tool-specific plan folders

## Handoff

User implements slices via normal agent sessions:

```
Implement slice B from PRD/work/<slug>/
```

When all slices done, user runs `thejudge-cleanup`.
