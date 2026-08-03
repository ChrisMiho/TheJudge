---
name: thejudge-kickoff
description: >-
  Loads minimal onboarding context for TheJudge (root README.md + PRD/README.md)
  and optionally captures a new idea in PRD/work/<slug>/IDEA.md. Use when
  starting a new session or beginning work on a new feature idea.
---

# TheJudge Kickoff

## Goal

Orient in this repo without pre-loading the full PRD, and optionally seed a new work package when the user describes an idea.

## Inputs

Optional: a feature idea description in the same message.

## Reads

1. `README.md` — stack, layout, quality gates, current product status
2. `PRD/README.md` — control plane, source-of-truth precedence, navigation

Nothing else. Do not pre-load `PRD/sections/` or `PRD/instructions/` — see `reference.md` for the full precedence model and task → read-order table used by later skills.

## Writes

Only when the user describes a new idea:

- `PRD/work/<slug>/IDEA.md` — 3–5 sentences: problem, outcome, non-goals
- `PRD/work/<slug>/README.md` — `status: ideation` at top

`<slug>` is a new kebab-case name proposed from the idea (e.g. `card-wotc-rule-enrichment`). If the user only wants orientation, write nothing.

## Gates

- Never read PRD content beyond the two required files without the user naming paths in the same message.
- Never write product code from this skill.

## Next step

Orient-only: none — point the user at `AGENT-SKILLS.md` and this skill's `reference.md`.

Idea captured: `/thejudge-refinement PRD/work/<slug>/` (Cursor / Claude Code) or `$thejudge-refinement PRD/work/<slug>/` (Codex).
