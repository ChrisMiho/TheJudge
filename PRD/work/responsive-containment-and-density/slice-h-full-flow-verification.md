# Slice H — Full-flow re-verification and ship gates

## Status: planned

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
