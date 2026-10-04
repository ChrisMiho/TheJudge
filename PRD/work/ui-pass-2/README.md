status: active

# ui-pass-2

See IDEA.md. Intake: intake/observations.md.

## Refinement output (2026-10-04)

- Design brief: `DESIGN-BRIEF.md` — four findings, each reproduced live, with the
  intended look, surfaces/classes, and non-goals.
- Gate questions: `GATE-QUESTIONS.md` — one amendment (`REQ-215`: trade pile art
  follows the direction-1 mockup drawing). Items 2-4 need no product-truth change.
- Before-state screenshots: `.playwright-mcp/`.

## Slices

| Slice | Doc | Scope | Depends on | Status |
| --- | --- | --- | --- | --- |
| A | `slice-a-pile-art.md` | Trade gold-pile art follows the direction-1 mockup | none | planned |
| B | `slice-b-search-pill.md` | Add-card search box mirrors the question-box pill | none | planned |
| C | `slice-c-history-delete.md` | Mobile Question History Delete button looks like a control | none | planned |
| D | `slice-d-confirm-padding.md` | Mobile delete-confirm sheet no longer clips its text | none | planned |

Implementation map: `GAMEPLAN.md`. Criteria: `slice-<letter>.criteria.json`. All slices parallel-ready; REQ-215 truth is applied by intent in slice A.

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ui-pass-2/DESIGN-BRIEF.md`
- Findings: none (one non-blocking note for map-out: item 3 uses the 600px breakpoint per REQ-213, not a generic phone width; and a line-number slip in the brief — `.drawer-panel` padding override is near `shell.css:892`, not 872)

## Autonomous metadata

- Autonomous base: origin/main
