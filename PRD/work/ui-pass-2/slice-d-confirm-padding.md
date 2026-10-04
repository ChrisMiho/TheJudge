# Slice D — Mobile delete-confirm sheet no longer clips its text

## Status: planned

## Goal

Make `.confirm-panel`'s padding win over the base `.drawer-panel { padding: 0 }` reset (raise specificity, e.g. `.confirm-panel.drawer-panel`) so headings and body sit inside the sheet and wrap instead of clipping.

## Requirements

1. REQ-208 (shared sheet, padded body)
2. NFR-001 (copy readable at all widths)

No product-truth change. The cascade bug: `.confirm-panel` padding at `shell.css:687` loses to `.drawer-panel { padding: 0 }`, which sits inside the `.drawer-panel` rule starting `shell.css:872` (the brief's `~892` pointer is approximate; use the real `padding: 0` line, found by grep). Keep the 599px phone block (`shell.css:695`) padding-top rule working. Do not weaken the shared sheet. Affects every ConfirmSheet (Trade New trade, Life Tracker reset, history delete); the centred desktop card must still look right.

Browser risk: yes (clipping, geometry). Dependencies: none (parallel-ready).

## Acceptance criteria

- [ ] D1: `.confirm-panel` padding rules are raised to a selector that beats `.drawer-panel` (e.g. `.confirm-panel.drawer-panel`) in `shell.css`; the base `.drawer-panel` rule is unchanged
- [ ] D2: The sheet's words, buttons, grab handle and animation are unchanged; ConfirmSheet and drawer tests pass
- [ ] D3: Visual: phone 390x844, delete-confirm on a long seeded question; computed panel padding is non-zero (about 1.1rem sides) and the heading wraps fully inside the panel with no clipped text at left or right edge (manual)
- [ ] D4: Visual: desktop 1440x900, the centred confirm card and the Trade Balancer New trade confirm still look right with the restored padding (manual)
- [ ] D5: Browser closed, owned dev server stopped, ports released; captures written under `PRD/work/ui-pass-2/.playwright-mcp/` (manual)
- [ ] D6: Frontend typecheck passes and the full frontend suite is green
- [ ] D7: PRD promotion checklist reviewed: REQ-215 truth landed in slice A; slices B-D need no `PRD/sections/` change; PRD/work/ui-pass-2/ ready for cleanup deletion (manual)

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run quality:check
```

## Files touched

- `apps/frontend/src/styles/shell.css`

Evidence for manual criteria: dated lines in `slice-d.evidence.md`.

## PRD promotion checklist

- [ ] REQ-215 amendment is present in `PRD/sections/functional-requirements.md` (applied in slice A)
- [ ] No other durable truth changed; REQ-206/118/208/NFR-001 stand as written
- [ ] Cleanup deletes `PRD/work/ui-pass-2/` and writes the receipt

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ui-pass-2/` ready to delete
