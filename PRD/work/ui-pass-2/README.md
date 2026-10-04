status: owner-action

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
| E | (owner-directed, post-review) | Card-scan caution triangle always shown in the scanner's top-right (like the mockup); warning pops up only on click. Exit ✕ moved to the panel header (above the camera, per REQ-214) so it no longer covers the triangle. REQ-214 truth amended. | none | done |

Implementation map: `GAMEPLAN.md`. Criteria: `slice-<letter>.criteria.json` (A–D). All slices parallel-ready; REQ-215 truth is applied by intent in slice A.

Slices A–D are built and node 7 review returned APPROVE (full suite 1498 pass). The owner then approved the four fixes live and directed one addition — slice E, the always-visible card-scan caution (above). Slice E is built, its REQ-214 amendment applied, full suite 1498 pass, verified live (triangle tappable, warning on click, no overlap with the Exit ✕). Awaiting the owner's approval of the final look before `close`. The A–D criteria files stay `false` because of the known evidence-log-root gap and the auto-mode audit guardrail; see `GRAPH-RUN.md` `## Open gate` for the close decision. Code PR #254 is open.

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ui-pass-2/DESIGN-BRIEF.md`
- Findings: none (one non-blocking note for map-out: item 3 uses the 600px breakpoint per REQ-213, not a generic phone width; and a line-number slip in the brief — `.drawer-panel` padding override is near `shell.css:892`, not 872)

## Autonomous metadata

- Autonomous base: origin/main
