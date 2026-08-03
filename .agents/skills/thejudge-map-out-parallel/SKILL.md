---
name: thejudge-map-out-parallel
description: >-
  Creates GAMEPLAN.md and lettered slice docs in PRD/work/<slug>/, grouped
  into dependency waves of slices with disjoint files that can be implemented
  concurrently. Use after quality-check passes when the work has independent
  slices worth running in parallel — otherwise use thejudge-map-out, which
  sequences slices without wave grouping.
---

# TheJudge Map Out (Parallel)

## Goal

Produce an implementation-ready work package whose slices are grouped into dependency **waves**, so independent slices can be implemented concurrently.

## Inputs

Work slug.

## Reads

1. `PRD/work/<slug>/DESIGN-BRIEF.md`
2. Refined `PRD/sections/` referenced in the brief
3. `PRD/instructions/doc-lifecycle.md`
4. This skill's `reference.md` for the slice template, Ship gates block, and wave table format

## Writes

- `PRD/work/<slug>/GAMEPLAN.md` — architecture, data flow, **wave plan**, verification checklist
- `PRD/work/<slug>/slice-a-*.md` … `slice-n-*.md`
- Update `PRD/work/<slug>/README.md` — slice table with wave + depends-on columns, implementation map, `status: active`

## Gates

- One primary objective per slice; each slice: Status, Goal, Requirements, Files touched, Tests, Acceptance criteria; each acceptance criterion verifiable.
- Build a dependency graph from each slice's stated dependencies. Wave N holds every slice whose dependencies all live in waves `< N`. Wave 1 has no dependencies.
- Same-wave slices must have **disjoint `Files touched`** — overlap means merge the slices or push one to a later wave.
- A single-slice wave is fine; not everything parallelizes.
- Any slice that cannot be parallelized states why (shared file, shared migration, ordering constraint).
- Never split a cohesive change across same-wave slices just to manufacture parallelism.
- Final slice carries the PRD promotion checklist (execution happens in cleanup) and the Ship gates block from `reference.md`.
- Never write product code from this skill; never persist plans to tool-specific plan folders.

## Next step

`/thejudge-implement-parallel PRD/work/<slug>/ wave 1` (Cursor / Claude Code) or `$thejudge-implement-parallel PRD/work/<slug>/ wave 1` (Codex, sequential — no in-session subagent primitive).

For one unattended agent executing dependency-ready slices sequentially, use `/thejudge-implement-all PRD/work/<slug>/` (`$thejudge-implement-all` in Codex).
