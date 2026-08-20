---
name: thejudge-kickoff
description: >-
  Loads minimal onboarding context for TheJudge (root README.md + PRD/README.md)
  and optionally captures a new idea in PRD/work/<slug>/IDEA.md with
  STATUS.ideation. Use when starting a new session or beginning work on a new
  feature idea.
---

# TheJudge Kickoff

## Goal

Orient in this repo without pre-loading the full PRD, and optionally seed a new work package when the user describes an idea.

## Inputs

Optional: a feature idea description in the same message.

## Mode

Direct invocation keeps the minimal reads and user handoff below.

When the controlling agent explicitly states that an orchestrator is
controlling — `thejudge-prepare is controlling` or `graph-run is controlling` —
read `PRD/instructions/preparation-contract.md`, investigate only
request-relevant PRD and code, select exactly one evidence-backed candidate (or
return `NO ACTIONABLE PACKAGE`), and create the normal `IDEA.md`/README outputs.
Return the selected evidence and artifacts to the named orchestrator without
pausing for user approval.

## Reads

1. `README.md` — stack, layout, quality gates, current product status
2. `PRD/README.md` — control plane, source-of-truth precedence, navigation

In direct mode, nothing else. Do not pre-load `PRD/sections/` or
`PRD/instructions/` — see `reference.md` for the full precedence model and task
→ read-order table used by later skills.

## Writes

Only when the user describes a new idea:

- `PRD/work/<slug>/IDEA.md` — 3–5 sentences: problem, outcome, non-goals
- `PRD/work/<slug>/README.md` — `status: ideation` at top
- Empty marker `PRD/work/<slug>/STATUS.ideation` (exactly one STATUS.* per package)
- Row under `## ideation` in `PRD/work/STATUS.md` (create the board if missing)

`<slug>` is a new kebab-case name proposed from the idea (e.g. `card-wotc-rule-enrichment`). If the user only wants orientation, write nothing.

## Gates

- In direct mode, never read PRD content beyond the two required files without
  the user naming paths in the same message.
- Never write product code from this skill.
- Never rename `PRD/work/<slug>/` to encode status — use `STATUS.*` + README + board only (see `PRD/instructions/workflow-reference.md`).

## Next step

Orchestrated mode: return `NO ACTIONABLE PACKAGE` or the selected evidence and
created artifacts to `thejudge-prepare`.

Direct orient-only: none — point the user at `AGENT-SKILLS.md` and this skill's
`reference.md`.

Direct idea captured: `/thejudge-refinement PRD/work/<slug>/` (Claude Code)
or `$thejudge-refinement PRD/work/<slug>/` (Codex).
