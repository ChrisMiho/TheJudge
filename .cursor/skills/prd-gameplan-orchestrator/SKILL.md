---
name: prd-gameplan-orchestrator
description: Routes PRD-driven planning tasks to the right gameplan workflow and writes or updates markdown artifacts under PRD/gameplan. Use when the user asks for project path-forward planning, roadmap updates, feature execution plans, or PRD-to-gameplan sync.
disable-model-invocation: true
---

# PRD Gameplan Orchestrator

## Purpose

Use this skill as the entry point for gameplan work. It decides whether to bootstrap baseline docs, draft a feature plan, or resync existing plans after PRD changes.

## Routing

Choose exactly one route:

1. **Bootstrap route**: first-time setup or missing `PRD/gameplan/README.md`
   - Run skill: `prd-gameplan-bootstrap`
2. **Feature route**: user asks for a plan for a specific feature/slice
   - Run skill: `prd-gameplan-feature-plan`
3. **Sync route**: PRD sections/instructions changed and gameplan docs may drift
   - Run skill: `prd-gameplan-sync`

If the request matches multiple routes, execute in this order:
1. bootstrap
2. feature plan
3. sync

## Required Inputs

- User objective in one sentence
- Feature name/slug when feature route is used
- Any explicit exclusions or sequencing constraints from the user

## Non-Negotiable Governance

Before writing gameplan docs, apply:

1. `PRD/sections/decisions.md` (override layer)
2. Active `PRD/sections/*.md`
3. `PRD/instructions/*.md`
4. `PRD/README.md` (navigation/status context)

Never allow a gameplan file to override product truth in section files.

## Output Contract

Every route writes markdown under `PRD/gameplan/` only, with:

- clear scope and exclusions
- explicit dependency/order logic
- traceability references (`REQ-*`, `FLOW-*`, `NFR-*`, `DEC-*`, `Q-*`, `STORY-*`)
- verifiable next actions
