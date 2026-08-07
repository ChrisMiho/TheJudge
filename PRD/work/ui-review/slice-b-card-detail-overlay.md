# Slice B — Portal-hosted card detail overlay

## Status: done

## Goal

Free suite-wide card detail from the image's bounding box into the approved
bottom-sheet / side-panel overlay geometry.

## Requirements

1. Rehost `CardDetailPopup` through a portal, outside the image container, using
   slice A's shared close and outside-dismiss primitives.
2. Follow `screen-layout.md` exactly: content-sized bottom sheet below `768px`;
   right-side panel at `768px+` with View Context-family width; long detail
   region-scrolls inside the surface.
3. Keep the top-right image trigger, locally carried field list, image mounting,
   readable missing/failed-image fallback, Escape/focus behavior, and no-fetch
   rule unchanged.
4. Because `CardPresentation` is shared, the geometry must work identically on
   all six surfaces without a surface variant: Quick Question, In-Depth
   Enrichment, View Context, zone selected-card preview, zone strip, Scan review.
5. Add/adjust focused tests before implementation, including portal cleanup and
   trigger `aria-expanded` behavior.

## Acceptance criteria

- [x] Component tests prove the dialog portals outside the card image container, uses the shared close/dismiss primitives, closes by close/Escape/outside, stays open on inside click, and restores the trigger state
- [x] Component tests prove all detail fields still come from the passed card and missing/failed image still renders the text-first fallback with no network request
- [x] At 390×844, open details from each of the six surfaces and record: bottom-sheet geometry below `768px`, dialog bounds independent of the image, close control fully inside bounds, long content region-scrolls, and no second document-length scroll is introduced — five surfaces live; Scan review by component test only, see "Scan review live-verification limit" below
- [x] At 1440×900, repeat all six surfaces and record: right-side panel geometry, width aligned with the View Context family, close inside bounds, and host layout unchanged behind the portal — same five/six split
- [x] The former baseline cannot reproduce: dialog is not 92×128px, its 356px content is not squeezed to a 66px text column, and close does not overflow the dialog by 37px
- [x] No per-screen popup copy, size variant, or new metadata fetch exists
- [x] `npm run quality:check` is green
- [x] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification evidence

- Checkout: `.worktrees/implement-ui-review` (branch `thejudge-impl/ui-review-root-20260807-1`), autonomous base `origin/feature/routing`, shared branch `origin/thejudge-auto/ui-review` (PR #86).
- Servers **started by this agent** (never attached): backend `PORT=3901`, frontend `FRONTEND_PORT=5901`, via `PORT=3901 FRONTEND_PORT=5901 npm run dev:mock`. Browser: Playwright MCP (`plugin-playwright-playwright`), this session's handle.
- Portal rehost: `CardDetailPopup` now returns `createPortal(..., document.body)` wrapped in `.card-detail-overlay` > `.card-detail-surface`. Measured live at 390×844 from four structurally different host boxes — Quick Question card (91.8×128), In-Depth zone selected-card preview (91.8×128), zone strip tile (160×177), Enrichment card header (272.8×65.5) — and every one produced the **identical** sheet: `x=0 y=627 390×217`, `overlay.parentElement === document.body`, host `contains(popup) === false`. Host geometry no longer bounds the dialog.
- Superseded baseline cannot reproduce (DEC-158): dialog measures 390×217 (phone) / 480×900 (desktop), not 92×128px; its content column measures **364px** at 390×844 and **430px** at 1440×900, not a 66px squeeze; the close control measures 44×44 and sits fully inside the dialog bounds on every surface and viewport (`closeInside === true`), never overflowing by 37px.
- Long-content region scroll: injecting 60 lines of oracle text capped the sheet at exactly `633px` (75dvh of 844) with `scrollHeight 1395 > clientHeight 631`, leaving a `211px` (25%) dismissible scrim band above it and `document.scrollHeight === clientHeight === 844` — no second document-length scroll. Close stayed inside bounds under stress.
- No new document scroll from the popup: measured `scrollHeight` before/after opening on the zone-collection step — `882` both times against an `844` client height, i.e. the step's own pre-existing scroll, unchanged by the overlay.
- 1440×900 side panel: `x=960 y=0 480×900`, right-edge anchored, `align-items: stretch; justify-content: flex-end`, `border-radius: 16px 0 0 16px`, `max-height: none`. Width parity with the View Context family measured directly — with both open, `.adaptive-context-surface` and the card-detail surface each measured **exactly 480px** wide and both right-edge anchored (`min(30rem, 90vw)`). Host layout behind the portal was unchanged (see the desktop capture).
- Dismiss contracts at both viewports: explicit close, Escape, and outside/scrim mousedown each close the popup and restore focus to the ⓘ trigger (`document.activeElement === trigger`, `aria-expanded` back to `false`); an inside mousedown on the popup title never closes it.
- **Nested overlay (View Context → card detail).** The rehosted popup's own full-viewport scrim covers View Context, so both surfaces' `useOutsideDismiss` instances read one outside mousedown as "outside" and two layers collapsed at once. Fixed inside the shared slice A hook (which slice B's file list authorises adjusting) by adding a module-level enabled-adopter stack: only the topmost enabled surface handles an outside interaction. Verified live at 390×844 — one scrim click closed **only** the card detail (`cardDetailOpen: false`, `viewContextStillOpen: true`, focus restored to the card's ⓘ trigger), and a second click then closed View Context with focus restored to its own trigger. Covered by two new `useOutsideDismiss.test.ts` cases (unmount and disable paths). Layering is explicit: `.card-detail-overlay` `z-index: 70` over `.adaptive-context-overlay` `z-index: 60`, confirmed by `elementFromPoint` at desktop.
- No new fetch: the popup renders only fields already on the passed card object; `vi.spyOn(globalThis, "fetch")` records zero calls while the popup is open.
- Captures: `PRD/work/ui-review/.playwright-mcp/slice-b-quick-question-bottom-sheet-390x844.png`, `slice-b-card-detail-side-panel-1440x900.png` (in this worktree).
- Runtime cleanup: `browser_close` called after the last interaction; the owned `node scripts/dev.mjs` tree was stopped by `SIGTERM` to its own handle and exited (background task exit code 0); `lsof` confirms **no listener on 3901 or 5901**. A separate `node scripts/dev.mjs` (PID 52408, started 08:46:20, cwd = main checkout `/Users/chrismiho/Coding/Projects/TheJudge`) is **pre-existing and user-owned** — identified, reported, and deliberately left running per `runtime-process-hygiene.md`.

### Scan review live-verification limit

Scan review is the one card surface that could not be opened live. Its review
bubble derives from `scan.sessionInstanceIds`, which only populates after the
client-side perceptual-hash identifier converges on a real card image. The
Playwright browser exposes Chrome's synthetic fake-camera pattern, so the
scanner stays in `phase: searching` (`reason: glare`, quality 0.57, votes 0/3)
and never resolves an identity; `Capture` only writes a debug frame. Feeding a
real card image would need `--use-file-for-fake-video-capture`, and this MCP
server exposes no launch-argument control.

What covers it instead: `ScanReviewBubble.test.tsx` asserts the portal contract
directly (popup is not inside the review row, the row shows no duplicated name,
the detail surface carries the card name), and the surface shares one component,
one portal target, and one CSS rule with the five surfaces measured live across
host boxes from 91.8×128 to 272.8×65.5 — all yielding byte-identical dialog
geometry, which is exactly what the criterion guards against. Slice C and slice H
should re-attempt live Scan review if a real-camera path becomes available.

## Verification

```bash
npm --workspace apps/frontend run test -- CardPresentation CardSelectionPreview ZoneCardPicker ScanReviewBubble EnrichmentStep QuickLookupApp
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/CardPresentation.test.tsx`
- `apps/frontend/src/components/OverlayCloseButton.tsx` (reuse from slice A, only if integration requires adjustment)
- Shared outside-dismiss helper/hook from slice A (reuse, only if integration requires adjustment)
- `apps/frontend/src/index.css`
- Focused consumer tests only where portal behavior needs explicit regression coverage
