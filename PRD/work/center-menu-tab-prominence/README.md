---
status: active
---

# center-menu-tab-prominence

Started as a narrow "widen and emphasize the center menu tab" pass (approved but never
implemented). Pivoted into a bigger corner-rail + sliding-drawer restructure of the app-chrome
header: Menu trigger relocates to a top-left corner rail, brand block centers, step-name text
moves out of the header into an in-flow eyebrow label. See `DESIGN-BRIEF.md` for the approved
scope and `PRD/sections/decisions/navigation.md` (DEC-122) for the full decision body.

## Product truth

- DEC-122 (new) — supersedes DEC-095's top-middle placement and DEC-121 outright; preserves
  DEC-109's never-fixed guarantee and DEC-110's Theme hosting.
- REQ-045, REQ-067, REQ-089 — amended with notes pointing to DEC-122.
- REQ-101 — superseded outright alongside DEC-121 (never implemented).

## Implementation map

See `GAMEPLAN.md` for architecture and data flow.

| Slice | Objective | Depends on |
| --- | --- | --- |
| [A](./slice-a-header-recenter-and-eyebrow.md) | Recenter brand block; relocate step-name into an in-flow `StepEyebrow` above each step's own content | none |
| [B](./slice-b-corner-rail-drawer.md) | Rebuild Menu trigger as a top-left corner rail opening a sliding drawer | A |

## Next step

`/thejudge-implement PRD/work/center-menu-tab-prominence/ slice A`
