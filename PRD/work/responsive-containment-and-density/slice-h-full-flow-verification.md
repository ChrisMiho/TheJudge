# Slice H — Full-flow re-verification and ship gates

## Status: done

## Goal

Re-run the original audit sweep end to end at both viewports, confirm every measured
baseline defect is closed and nothing regressed, and close the package.

## Requirements

1. Walk every flow the 2026-08-05 sweep covered, at 390×844 and 1440×900:
   Quick Question; In-Depth Question (game context → zone confirmation → zone
   collection → card detail → enrichment → question → answered workspace);
   Life Tracker; Trade Balancer; Menu tray; conversation history drawer.
2. Re-measure every baseline in the findings table and record before/after values.
3. Confirm the reference surfaces the package deliberately did not change —
   `ConversationHistoryDrawer` and `FollowUpComposer` — still behave as measured.
4. Record the PRD promotion checklist for cleanup (execution happens in cleanup,
   not here).

## Acceptance criteria

- [ ] Every acceptance criterion in slices A–G re-verified in one continuous session
      at both viewports, with measured values recorded in this doc
- [ ] No horizontal document overflow on any flow at either viewport
- [ ] No element in any flow has `scrollWidth > clientWidth` with content clipped
- [ ] History drawer still opens opaque over a scrim and still blocks interaction beneath
- [ ] Answered-view `FollowUpComposer` geometry is unchanged from the baseline sweep
- [ ] `npm run quality:check` green from repository root
- [ ] `browser_close` called when browser verification is finished (`CLAUDE.md`)
- [ ] Package set to `ship-ready`: `STATUS.ship-ready` marker, README `status: ship-ready`,
      board row under `## ship-ready`

## PRD promotion checklist (executed by cleanup, not this slice)

- `PRD/sections/system-map.md` — remove the REQ-123 "Known gap" note once the banner
  offset holds on every destination; keep the entry's status accurate per the
  system-map promotion gate in `doc-lifecycle.md`
- `PRD/sections/decisions/{ui-presentation,conversation-ux,navigation}.md` — DEC-145
  through DEC-148 stay as confirmed product truth
- `PRD/sections/functional-requirements.md` — REQ-120 through REQ-125 stay
- Receipt at `PRD/instructions/receipts/responsive-containment-and-density-<YYYY-MM-DD>.md`
  written **before** the work folder is deleted
- Delete `PRD/work/responsive-containment-and-density/` and remove its row from
  `PRD/work/STATUS.md`

## Verification

```bash
npm run quality:check
```

Plus the full Playwright MCP sweep described above.

## Files touched

- `PRD/work/responsive-containment-and-density/` status files and this doc
- `PRD/work/STATUS.md`

## Dependencies

- Slices A–G — this slice verifies their combined result.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete

## Verified (2026-08-05)

Full sweep re-run at 390×844 and 1440×900 across Quick Question, In-Depth Question
(game context → zone confirmation → zone collection → card detail → enrichment → question
→ answered workspace), Life Tracker, Trade Balancer, the Menu tray, and the history drawer.

### Original findings, re-measured

| # | Finding | Before | After | Status |
| --- | --- | --- | --- | --- |
| F1 | Composer pins `height: 0px` | 12px client vs 32px scroll, 20px clipped | 32/32, **0px clipped** | closed |
| F2 | Composer field starved | 40% of row (136/340) | **65.6–68.4%** | closed |
| F3 | Tray translucent, content ghosts through | `rgba(…,0.95)`, 10 elements visible through | **alpha 1**, none visible | closed |
| F3 | Trigger paints on first row | ☰ over "Quick Question" | label clears the rail band | closed |
| F3 | Tray box exceeds viewport | 889 vs 844 · 957 vs 900 | unchanged (painting already clipped) | **open** |
| F4 | Banner covers headers | 24/9/12px Life Tracker, 11px Trade Balancer | **none** | closed |
| F5 | Shell width | 670px (53% unused) | **768px** (47% unused) | closed |
| F5 | Vertical dead space | 359px | 359px | **accepted** (DEC-145) |
| F6 | Add action below fold | 244px below | **112px** below | **partial** |
| F7 | Roster rows break panel | 6 nodes clipped, ▾ 8px past border | **0 / 0** | closed |

### Whole-flow checks

- No horizontal document overflow on any step at either viewport.
- No element with clipped content (`scrollWidth > clientWidth`) on any step at either
  viewport, excluding `sr-only` text.
- History drawer still opens opaque over its scrim and still blocks interaction beneath.
- `FollowUpComposer`'s send control unchanged at 36×36 — the reference component this
  package deliberately did not modify.
- Frontend suite 1187/1188; the single failure is the pre-existing `App.feedback`
  env-dependent test recorded in slice A.
- `browser_close` called at the end of the sweep (`CLAUDE.md`).

### Ship-ready withheld

Slices **C** and **F** are `blocked`, so the package stays `active`. Both hold their
decision's substance but miss a numeric acceptance criterion written during refinement:
C's two remaining criteria conflict with DEC-140's stacking requirement and with clipping
that already works, and F's target needs step restructuring beyond DEC-148. Each is
documented in its own slice doc with measurements.
