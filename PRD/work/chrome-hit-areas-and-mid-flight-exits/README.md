---
status: ship-ready
---

# chrome-hit-areas-and-mid-flight-exits

Post-ship audit findings from the three ship-ready UX packages, captured after PR #71 landed its
own set of fixes on top of them.

Idea and evidence: [`IDEA.md`](./IDEA.md).

Two load-bearing findings: the Menu corner rail's invisible hit area intercepts taps on destination
content (worst on Life Tracker, where DEC-136 made the whole card a life zone), and opening a saved
conversation from mid-flight staging discards the staged attempt without the Draft snapshot that
DEC-130 gives Menu-leave and reload. Three lower-severity consistency findings ride along.

All five were reproduced with Playwright MCP at 430 × 900 and are recorded with measurements in
`IDEA.md`. Refinement re-verified every finding against `main` at `6f4b1d7` before shaping.

## Scope after refinement

Findings 1–4. Finding 5 stays deferred (DEC-131 non-goal). Findings 1 and 2 collapse into one
root cause — the rail's hit box exceeds what it paints — so one fix closes both.

Refinement and quality-check corrected three claims that changed the build: finding 3 affects
**both** conversation destinations rather than In-Depth alone; the counter panel is not
"non-scrollable" as the sibling package described it; and the first-draft rail fix (narrow the
width) would have left 4,773px² of the mis-tap in place. Details in
[`DESIGN-BRIEF.md`](./DESIGN-BRIEF.md).

Product truth written: `DEC-137`, `DEC-138`, `DEC-139`, `REQ-114`; `REQ-108`, `REQ-082`, and
`FLOW-017` amended. `DEC-137` amends `DEC-126`'s stacked two-zone rail arrangement.

This package also took ownership of the counter panel's surface geometry from
`life-tracker-me-map-and-tray`, which now covers the `"me"`-map placement only.

## Preparation gate

- Quality-check: **PASS** (after one FAIL round; both blockers resolved with measured geometry)

## Slices

Plan: [`GAMEPLAN.md`](./GAMEPLAN.md).

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](./slice-a-rail-hit-area.md) | Bound the corner rail's hit area to what it paints; split rail goes side-by-side | — | **done** |
| [B](./slice-b-draft-on-history-select.md) | Snapshot the mid-flight Draft when opening a saved conversation, both modes | — | **done** |
| [C](./slice-c-counter-panel-surface.md) | Counter panel joins the full-height overlay family | — | **done** |

All three touch disjoint files and are parallel-ready. Sequenced A → B → C by severity, not by
dependency. Slice C carries the ship gates and PRD promotion checklist.

## Implementation map

| Area | Files |
| --- | --- |
| A — rail | `index.css`, `components/portal/FeaturePortalMenu.tsx` (+ 3 test files) |
| B — draft | `components/portal/MtgAssistantApp.tsx`, `components/portal/quick-lookup/QuickLookupApp.tsx`, `App.mid-flight-draft.test.tsx` |
| C — panel | `components/portal/life-tracker/CounterPanel.tsx` (+ test) |

## Next step

`/thejudge-implement PRD/work/chrome-hit-areas-and-mid-flight-exits/ slice A`

For one unattended agent completing every slice:
`/thejudge-implement-all PRD/work/chrome-hit-areas-and-mid-flight-exits/`
