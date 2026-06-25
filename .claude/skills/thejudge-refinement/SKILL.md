---
name: thejudge-refinement
description: >-
  Shapes a feature idea and writes aligned PRD content — DESIGN-BRIEF plus
  sections/ updates. Use after kickoff when an idea needs product definition.
---

# TheJudge Refinement

## Goal

Turn an idea into approved product truth in `PRD/sections/` and a work-package brief.

## Shared output guidance

Read the shared response guidance at `../thejudge-output-guidance.md` (canonical path: `.cursor/skills/thejudge-output-guidance.md`) and apply it to this workflow's user-facing output. This affects response length only; preserve all reads, writes, gates, verification, and handoff requirements below.

## Inputs

User provides work slug (e.g. `card-wotc-rule-enrichment`).

## Reads

1. `PRD/work/<slug>/IDEA.md` (or user description)
2. `PRD/sections/decisions.md` router, then relevant `PRD/sections/decisions/<domain>.md` files
3. Relevant `PRD/sections/*.md` for the feature
4. `PRD/instructions/requirement-format.md`
5. `PRD/instructions/technical-design-rules.md`

## Process

1. Ask up to **3** clarifying questions per round (batch, not one-at-a-time).
2. If approach is non-obvious, propose 2 options with tradeoffs.
3. Present design summary — **wait for user approval**.
4. After approval, write PRD artifacts.

## Writes

- `PRD/work/<slug>/DESIGN-BRIEF.md` — scope, decisions, non-goals, REQ/FLOW references
- Updates to `PRD/sections/` (`REQ-###`, `FLOW-###`; promote `DEC-###` into the relevant `PRD/sections/decisions/<domain>.md` and add the router index line in `PRD/sections/decisions.md` as needed)
- `PRD/sections/open-questions.md` only for genuine ambiguity (`Q-###`)
- `PRD/work/<slug>/README.md` → `status: refined`

## Rules

- `decisions.md` is the read-first override router; DEC bodies live in `decisions/<domain>.md`
- No code, no slice docs
- No scope from open questions without user confirmation
- Preserve stable IDs; add new IDs, do not renumber

## Handoff

After writes and `status: refined`, end with **Next step** — all three platforms, in order: Cursor, Codex, Claude Code. Substitute `<slug>` from this session. Templates: `PRD/instructions/workflow-reference.md` (Handoff blocks).

Next skill: `thejudge-quality-check`.
