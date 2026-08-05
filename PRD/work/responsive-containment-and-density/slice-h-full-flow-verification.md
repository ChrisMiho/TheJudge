# Slice H — Full-flow re-verification and ship gates

## Status: planned

## Goal

Re-run the full audit sweep end to end at both viewports after slices C, F, I, G,
J, K, and L land, confirm every measured defect from `issues.md` #1–8 is closed
and nothing shipped in the first pass (A, B, D, E, and the earlier sweep below)
regressed, then close the package.

## Requirements

1. Walk every flow the original sweep and this re-refinement cover, at 390×844
   and 1440×900: Quick Question; In-Depth Question (game context → zone
   confirmation → zone collection → card detail → enrichment → question →
   answered workspace); Life Tracker; Trade Balancer; Menu tray (rest + open);
   conversation history drawer.
2. Re-measure every `issues.md` #1–8 item against its slice's acceptance criteria
   and record before/after values in this doc.
3. Confirm the first-pass fixes (composer collapse, composer composition, banner
   clearance, shell width, roster containment) have not regressed — see "Prior
   full-flow sweep" below for the baseline to hold.
4. Confirm the reference surfaces the package deliberately did not change —
   `ConversationHistoryDrawer` and the answered-view `FollowUpComposer` (icon-only
   send control at every width) — still behave as measured.
5. Record the PRD promotion checklist for cleanup (execution happens in cleanup,
   not here).

## Acceptance criteria

- [ ] Every acceptance criterion in slices C, F, I, G, J, K, L verified in one
      continuous session at both viewports, with measured values recorded in this
      doc
- [ ] Every regression check carried from the first pass (A, B, D, E, prior G)
      still holds — see "Prior full-flow sweep" table below
- [ ] No horizontal document overflow on any flow at either viewport
- [ ] No element in any flow has `scrollWidth > clientWidth` with content clipped,
      excluding intended horizontal-scroll regions (zone-card strip)
- [ ] History drawer still opens opaque over a scrim and still blocks interaction
      beneath
- [ ] Answered-view `FollowUpComposer` geometry and icon-only send control are
      unchanged from the baseline sweep
- [ ] `npm run quality:check` green for touched areas (pre-existing worktree/env
      red per `HANDOFF.md` is not a regression to fix here)
- [ ] `browser_close` called when browser verification is finished (`CLAUDE.md`)
- [ ] Package set to `ship-ready`: `STATUS.ship-ready` marker, README
      `status: ship-ready`, board row under `## ship-ready`

## PRD promotion checklist (executed by cleanup, not this slice)

- `PRD/sections/system-map.md` — flip the shipped-vs-planned signal for the
  card-presentation, tray, Theme, and submit-label entries per the system-map
  promotion gate in `doc-lifecycle.md` (product code exists **and** a cleanup
  receipt exists)
- `PRD/sections/decisions/{navigation,ui-presentation,conversation-ux,personalization}.md`
  — DEC-150 through DEC-153 stay as confirmed product truth; DEC-148 stays
  `superseded`
- `PRD/sections/functional-requirements.md` — REQ-127 through REQ-132 stay;
  amended REQ-106/REQ-110/REQ-122/REQ-125 stay in their amended form
- Receipt at
  `PRD/instructions/receipts/responsive-containment-and-density-<YYYY-MM-DD>.md`
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

- Slices C, F, I, G, J, K, L — this slice verifies their combined result.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete

## Prior full-flow sweep (2026-08-05) — regression baseline, not this slice's scope

Full sweep re-run at 390×844 and 1440×900 across Quick Question, In-Depth Question
(game context → zone confirmation → zone collection → card detail → enrichment →
question → answered workspace), Life Tracker, Trade Balancer, the Menu tray, and
the history drawer, before the re-refinement in `issues.md`.

| # | Finding | Before | After | Status |
| --- | --- | --- | --- | --- |
| F1 | Composer pins `height: 0px` | 12px client vs 32px scroll, 20px clipped | 32/32, 0px clipped | closed |
| F2 | Composer field starved | 40% of row (136/340) | 65.6–68.4% | closed |
| F3 | Tray translucent, content ghosts through | `rgba(…,0.95)`, 10 elements visible through | alpha 1, none visible | closed |
| F3 | Trigger paints on first row | ☰ over "Quick Question" | label clears the rail band | closed (superseded by DEC-150 rail-hide in slice C) |
| F4 | Banner covers headers | 24/9/12px Life Tracker, 11px Trade Balancer | none | closed |
| F5 | Shell width | 670px (53% unused) | 768px (47% unused) | closed |
| F5 | Vertical dead space | 359px | 359px | accepted (DEC-145) |
| F6 | Add action below fold | 244px below | 112px below | superseded by DEC-151 density path (slices F/I) |
| F7 | Roster rows break panel | 6 nodes clipped, ▾ 8px past border | 0 / 0 | closed, alignment defect open (slice G) |

Frontend suite was 1187/1188 with the single pre-existing `App.feedback` env
failure. `browser_close` was called at the end of that sweep.
