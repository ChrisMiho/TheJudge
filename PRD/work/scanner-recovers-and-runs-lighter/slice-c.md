# Slice C — One shared scanner panel

## Status: done

## Goal

In-Depth, Quick Question and Trade Balancer render the scanner through one
panel, with the exit ✕ as the same 44 px square box in a slim row directly
above the camera, never over the camera or the caution triangle.

## Requirements

1. New `ScanPanel` host component owns the head row (optional title plus the
   ✕), the "Loading scan data..." line, the error line (`role="alert"`, from
   slice A), the camera surface and the held-entries mapping into
   `ScanReviewBubble`. Each host passes only its title (or none), destination
   label and handlers. `ScanCameraSurface`, `ScanReviewBubble` and
   `useScanCapture` are not changed by this slice.
2. Hosts: `components/ZoneCardPicker.tsx` (lines 262-304),
   `components/portal/quick-lookup/QuickLookupApp.tsx` (lines 547-582),
   `components/trade/TradeSide.tsx` (lines 243-288). Quick Question keeps
   "Scan a card", Trade keeps "Scanning onto <side>", In-Depth shows the ✕ only.
3. CSS in `index.css`: head-row rules move off the Trade-only `.side .scan-head`
   / `.side .scan-title` scope; the ✕ uses the `.scan-exit` box everywhere
   (44 px square, rounded corners, right edge aligned with the camera's right
   edge). Quick Question's desktop rule
   `.page-content-narrow-fit:has(> .idq > .flow-head .scan-exit)` (~line 4386)
   must keep matching after the markup moves.
4. Rewrite the `ZoneCardPicker.test.tsx` lines 176-184 pin (`absolute right-3
   top-3`, ✕ inside the camera box). It contradicts REQ-068; assert instead, on
   all three hosts, that the ✕ renders outside the camera overlay in the row
   above it and does not overlap the caution control.
5. Fit: In-Depth gains a slim row. Measure In-Depth at 360 and 390 wide:
   the exit row and Capture button stay visible without page scroll on tall
   phones (REQ-068).
6. Apply, by intent, the accepted `GATE-QUESTIONS.md` diffs: REQ-214 in
   `functional-requirements.md` (Description, the exit-box criterion, the new
   shared-panel criterion, the tests line), `screen-layout.md` (Chrome row), and
   `scan/README.md` (### Scan-screen layout and theming, two bullets); REQ-056
   `scan focus` criterion in `functional-requirements.md`.
7. QC A4: after the Chrome-row edit, re-read the other `screen-layout.md`
   scanner and host rows and confirm none contradicts it; edit only a row that
   does and note it in the slice evidence log.
8. Scan README "Where it lives" lists `ScanPanel.tsx` (housekeeping).

## Tests added or changed

- `ZoneCardPicker.test.tsx`: pin rewritten as above.
- `QuickLookupApp.test.tsx` and `TradeBalancer.scan.test.tsx`: the ✕ renders
  outside the camera overlay and does not overlap the caution control.
- New `ScanPanel` test: title shown when passed, absent when not; ✕ accessible
  name "Exit scan"; loading line; error line with `role="alert"`; held entries
  passed to the bubble.

## Acceptance criteria

- [ ] `ScanPanel` is used by all three hosts; each passes only title, destination label and handlers (tests pass)
- [ ] On every host the "Exit scan" box renders outside the camera overlay in the row above it (tests pass)
- [ ] The old in-camera `right-3 top-3` pin is gone and replaced by the REQ-068 assertion on all three hosts (tests pass)
- [ ] The ✕ does not overlap the caution control on any host (tests pass)
- [ ] Quick Question's `:has(> .idq > .flow-head .scan-exit)` desktop rule still matches after the markup move (test or stylesheet check passes)
- [ ] REQ-214 and REQ-056 diffs applied once each in `functional-requirements.md`, `screen-layout.md` and `scan/README.md`, matching the accepted text
- [ ] No other `screen-layout.md` scanner row contradicts the new Chrome row (A4 check recorded)
- [ ] Frontend tests, typecheck, lint and format check pass
- [ ] Live: on In-Depth, Quick Question and Trade Balancer the ✕ is a 44 px square box above the camera's top-right corner and the caution triangle is visible and tappable (manual, dated observation)
- [ ] Live: In-Depth at 360 and 390 wide shows the exit row and Capture without page scroll (manual, dated observation)
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- ScanPanel ZoneCardPicker QuickLookupApp TradeBalancer.scan
npm run typecheck && npm run lint && npm run format:check
```

## Files touched

- `apps/frontend/src/components/ScanPanel.tsx` (new, with its test)
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/trade/TradeSide.tsx`
- `apps/frontend/src/index.css`
- the host tests listed above
- `PRD/sections/functional-requirements.md`, `PRD/sections/screen-layout.md`, `PRD/sections/scan/README.md`
