---
name: proj-kickoff
description: >-
  Loads minimal onboarding context for <Product> (root README.md +
  PRD/README.md) and optionally captures a new idea in PRD/work/<slug>/IDEA.md
  with STATUS.ideation. Use when starting a new session or beginning work on a
  new feature idea.
---

# <Product> Kickoff

## Goal

Orient with the smallest possible read, and — if the user described an idea —
capture it as a new work package at `ideation`.

## Inputs

Optional: a description of a new idea.

## Reads

- `README.md` (repo root)
- `PRD/README.md`

Nothing else. Do not pre-load section or instruction files unless the user names
a specific path. The narrow read is the point of this skill: it establishes
orientation cheaply, and every later skill loads what it actually needs.

## Writes

Only when the user described an idea:

- `PRD/work/<slug>/IDEA.md` — three to five sentences: problem, outcome,
  non-goals
- `PRD/work/<slug>/README.md` — with `status: ideation`
- `PRD/work/<slug>/STATUS.ideation` — empty marker
- A row under `## ideation` in `PRD/work/STATUS.md`

If the user only wants orientation, write nothing.

## Procedure

1. Read the two files above.
2. If no idea was described, summarize where the project is and stop.
3. If an idea was described, propose a kebab-case `<slug>` and confirm it.
4. Create the four artifacts listed under Writes, in that order.
5. Hand off.

## Status transitions

New package → `ideation`.

## Gates

- Never read beyond the two required files in this skill.
- Never write product code.
- Never encode status by renaming a folder.
- Exactly one `STATUS.*` marker per package.

## Next step

Idea captured: run `/proj-refinement PRD/work/<slug>/` to shape it into a design
brief. (Codex: `$proj-refinement PRD/work/<slug>/`.)

Orientation only: no handoff. Point the user at `AGENT-SKILLS.md` for the
workflow and `reference.md` for the PRD map.
