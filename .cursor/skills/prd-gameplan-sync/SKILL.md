---
name: prd-gameplan-sync
description: Reconciles PRD/gameplan markdown files with the latest PRD/instructions and PRD/sections changes and records drift, impacts, and required updates. Use when requirements or decisions changed and the gameplan needs re-baselining.
disable-model-invocation: true
---

# PRD Gameplan Sync

## Purpose

Keep gameplan docs aligned whenever source PRD guidance changes.

## Trigger Conditions

Run when any of these change:
- `PRD/sections/*.md`
- `PRD/instructions/*.md`
- `PRD/README.md`
- active roadmap analysis file

## Mandatory Reads

1. `PRD/README.md`
2. all `PRD/instructions/*.md`
3. all `PRD/sections/*.md`
4. all current `PRD/gameplan/*.md`
5. all current `PRD/gameplan/features/*.md` (if directory exists)

## Sync Workflow

1. Identify changed product truth and classify:
   - scope change
   - sequencing change
   - constraint change
   - wording-only change
2. For each changed item, map impacted gameplan files.
3. Update impacted files with smallest correct edits.
4. Add/update `PRD/gameplan/DRIFT-REPORT.md` with:
   - source change
   - affected files
   - action taken
   - unresolved ambiguity
5. Append `PRD/gameplan/CHANGELOG.md`.

## Required Drift Report Shape

```markdown
# Gameplan Drift Report

## Summary
- ...

## Detected Source Changes
- source:
  - type:
  - impact:

## File Updates Applied
- file:
  - change:
  - reason:

## Unresolved Items
- ...

## Next Sync Check
- trigger:
- owner:
```

## Guardrails

- `PRD/sections/decisions.md` always wins on conflicts.
- Never remove traceability references without replacement.
- Keep unresolved ambiguity in queue form; do not guess.
- Do not convert `Q-*` into committed scope.
