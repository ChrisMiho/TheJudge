# Slice C — Mobile Question History Delete button looks like a control

## Status: planned

## Goal

Give `.history-item-delete` real button chrome in its own slot so it no longer overlaps the answer line or the chevron, at the 600px phone breakpoint (REQ-213), meeting the 44px touch floor.

## Requirements

1. REQ-118 / FLOW-018 (delete affordance, unchanged behaviour)
2. REQ-213 (600px breakpoint)
3. REQ-205 (44px floor)
4. REQ-207

No product-truth change. Use the 600px breakpoint, not a generic phone width. The Delete button only renders when `!isWide` in `ConversationHistoryDrawer.tsx`; markup may gain a wrapper or slot but no behaviour change. The `aria-label`, the confirm step and select-to-resume stay as they are.

Browser risk: yes (overlap, hit area). Dependencies: none (parallel-ready).

## Acceptance criteria

- [ ] C1: `.history-item-delete` has real chrome (border/background affordance or icon control) and no longer uses a bare absolute overlay on the row content; any phone-path rules use the 600px breakpoint
- [ ] C2: `ConversationHistoryDrawer.tsx` keeps `aria-label="Delete: ..."`, the `setPendingDeleteEntry` click path and the `!isWide` render condition; the drawer tests pass
- [ ] C3: Visual: phone 390x844 with three seeded entries; on every row Delete sits in its own slot and does not overlap the answer line or the `›` chevron, measured by bounding boxes not intersecting (manual)
- [ ] C4: Visual: Delete hit area >= 44px high; tapping it still opens the confirm sheet, tapping the row still resumes (manual)
- [ ] C5: Visual: at >= 600px wide the layout is unchanged (isWide path has no Delete button) (manual)
- [ ] C6: Browser closed, owned dev server stopped, ports released; captures written under `PRD/work/ui-pass-2/.playwright-mcp/` (manual)
- [ ] C7: Frontend typecheck and lint pass

## Verification

```bash
npm --workspace apps/frontend run test -- --run src/components/ConversationHistoryDrawer
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/index.css` (`.history-item`, `.history-item-delete`, possibly `.history-row`/`.h-chev`)
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx` (markup slot only, if needed)

Evidence for manual criteria: dated lines in `slice-c.evidence.md`.
