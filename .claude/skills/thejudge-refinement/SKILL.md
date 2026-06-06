---
name: thejudge-refinement
description: >-
  Shapes a feature idea and writes aligned PRD content — DESIGN-BRIEF plus
  sections/ updates. Use after kickoff when an idea needs product definition.
---

# TheJudge Refinement

## Goal

Turn an idea into approved product truth in `PRD/sections/` and a work-package brief.

## Inputs

User provides work slug (e.g. `card-wotc-rule-enrichment`).

## Reads

1. `PRD/work/<slug>/IDEA.md` (or user description)
2. `PRD/sections/decisions.md`
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
- Updates to `PRD/sections/` (`REQ-###`, `FLOW-###`, `DEC-###` as needed)
- `PRD/sections/open-questions.md` only for genuine ambiguity (`Q-###`)
- `PRD/work/<slug>/README.md` → `status: refined`

## Rules

- `decisions.md` is override layer
- No code, no slice docs
- No scope from open questions without user confirmation
- Preserve stable IDs; add new IDs, do not renumber

## Handoff

User runs `thejudge-quality-check` with same slug when ready.
