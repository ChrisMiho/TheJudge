---
name: thejudge-map-out-parallel
description: >-
  Creates GAMEPLAN and lettered slice docs in PRD/work/<slug>/ with slices
  grouped into dependency waves for concurrent implementation. Use after
  quality-check passes when the work has independent slices worth running in
  parallel.
---

# TheJudge Map Out (Parallel)

## Goal

Produce an implementation-ready work package whose slices are grouped into
dependency **waves**, so independent slices can be implemented concurrently.

This is the parallel-oriented flavor of `thejudge-map-out`. Use the plain
`thejudge-map-out` when the work is inherently sequential or too small to wave.

## Inputs

User provides work slug.

## Reads

1. `PRD/work/<slug>/DESIGN-BRIEF.md`
2. Refined `PRD/sections/` referenced in brief
3. `PRD/instructions/workflow-reference.md` (slice template)
4. `PRD/instructions/doc-lifecycle.md`

## Writes

- `PRD/work/<slug>/GAMEPLAN.md` — architecture, data flow, **wave plan**, verification checklist
- `PRD/work/<slug>/slice-a-*.md` … `slice-n-*.md`
- Update `PRD/work/<slug>/README.md` — slice table (with wave + depends-on columns), implementation map, `status: active`

## Slice rules

- One primary objective per slice
- Explicit dependencies in README table
- Each slice: Status, Goal, Requirements, Files touched, Tests, Acceptance criteria
- Each acceptance criterion must be verifiable (test command or explicit manual check)
- Include file paths and verification commands
- Final slice includes PRD promotion checklist (execution in cleanup skill) and Ship gates from `workflow-reference.md`

## Wave rules

- Build a dependency graph from each slice's stated dependencies.
- Group slices into numbered waves. **Wave N** holds every slice whose
  dependencies all live in waves `< N`. Wave 1 has no dependencies.
- Slices in the same wave MUST be safe to run concurrently:
  - No ordering dependency between them.
  - **Disjoint `Files touched` sets.** If two same-wave slices edit the same
    file, either merge them or push one to a later wave.
- A wave may contain a single slice — that is fine; not everything parallelizes.
- Record the plan in GAMEPLAN as a wave table and mirror it in the README slice table:

  ```markdown
  | Wave | Slices | Depends on |
  | ---- | ------ | ---------- |
  | 1    | A, B   | —          |
  | 2    | C      | A          |
  ```

- State any slice that cannot be parallelized and why (shared file, shared
  migration, ordering constraint).

## Do not

- Write product code
- Persist to tool-specific plan folders
- Force parallelism by splitting a cohesive change across slices that touch the same files

## Handoff

After GAMEPLAN, slices, and the wave table are written, end with **Next step** —
all three platforms, in order: Cursor, Codex, Claude Code. Substitute `<slug>`
and the first wave's slice letters from the README slice table. Templates:
`PRD/instructions/workflow-reference.md` (Handoff blocks).

- Cursor / Claude Code → next skill: `thejudge-implement-codex` (dispatches a whole wave concurrently)
- Codex → next skill: `thejudge-implement` (one slice at a time; the codex-delegation flavor is orchestrator-only)
