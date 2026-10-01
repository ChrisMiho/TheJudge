# Slice P — Card scanner takes the look

## Status: planned

## Goal

The scanner keeps the header and brand instead of hiding them, under a
"Scan a card" `h1` and a 44px ✕ exit. The viewfinder becomes one panel with
a corner-ticked guide, a marching dashed lock outline, a "Locking on <card>"
indicator with a vote bar, and a foot row of mute pill / round shutter /
Debug pill — replacing the nested nested frames, rectangular Capture
button, and scrolling page.

Behaviour does not change in this slice. Slice H already built the
viewfinder, holding list and count pill; this slice restyles what H built
to match the mockup pixel values below, inside the frame slice L just
landed.

## Dependencies

Slice L (frame — the header this screen keeps, unlike today's build) and
slice H (viewfinder, holding list, count pill — restyled here, both
`done`).

## Mockup source

`docs/design/ui-reimagining/direction-1/card-scan.html`.

## LOOK-GAPS.md section closed

`## Card scanner` (`PRD/work/ui-reimagining-build/LOOK-GAPS.md:208-235`).

## Requirements

No new `GATE-QUESTIONS.md` id beyond what slice H already applied (REQ-214,
the owner's holding-list edit) — presentation only, except where the owner
question below says otherwise.

1. Keep the header and mock-mode strip visible (they are hidden today).
   Add a "Scan a card" `h1` and a 44px ✕ exit (`card-scan.html:28-30`
   `.scan-exit`, 0.7rem radius) at the header's right, replacing the ✕-only
   top bar and the nested rounded frames.
2. Viewfinder becomes one panel: `:40-51` `.feed` and its error state.
3. Guide: `:58-66` `.guide` and its four `.tick` corners (16px, 2px
   accent-soft), plus `guide-breathe` 3.2s. Lock outline:
   `:88-90` `.lock-outline` (`stroke-dasharray: 10 6`, `march` 2.4s marching
   dashes round the card).
4. Indicator: `:93-101` `.indicator` ("Locking on <card>", a vote bar,
   progress count) top-left, replacing the blank status dot.
5. Foot row: `:76-85` `.vf-foot`, `.mute`, `.shutter` (54px ring + 40px
   filled disc, press-sinks), plus the Debug pill — replacing the
   full-width rectangular Capture button outside the frame. The 🔈 mute
   glyph and "Powered by Cardomancer" credit move to the foot per the
   mockup's `.credit` placement, under the panel.
6. Holding-count pill: keep H's "✓ N" pill (top-right, per the mockup's
   placement), with a round ⚠ caution button beside it.
7. The viewfinder fits the viewport; the page stops scrolling (the build is
   1,020px tall on phone today).

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx` (+ `.test.tsx`) —
  header kept visible, ✕ exit, one-panel viewfinder, guide ticks, lock
  outline, indicator, foot row (mute/shutter/Debug), viewport fit.
- `apps/frontend/src/components/ScanReviewBubble.tsx` — restyled caution
  pop-up, unchanged trigger.
- `apps/frontend/src/components/ScanDebugOverlay.tsx` — restyled Debug
  pill/panel.
- `apps/frontend/src/components/ScanCardOutline.tsx` — restyled detection
  outline to the mockup's lock-outline dashes; detection logic unchanged.

## Tests

- `ScanCameraSurface.test.tsx` — updated for the new markup/classes (header
  visible, foot-row controls, accessible names kept per `DESIGN-BRIEF.md`
  A12: "Exit scan" and "Capture" unchanged).

## Owner questions — the build follows the accepted requirement until answered

Carried verbatim from LOOK-GAPS.md's `## Card scanner`
`### Conflicts with accepted requirements`:

- "When a scanned card joins (REQ-214, your edit). Your edit says scanned
  cards wait in a holding list inside the scanner and join the zone or
  trade side only when the scanner closes; the count pill shows that list.
  The mockup's hint under the viewfinder still reads 'Auto-scan is on: a
  confident match adds the card and keeps scanning' (`card-scan.html:217`).
  Should the look pass keep the mockup's '✓ 2' pill as the holding-list
  count, and reword that hint to say cards wait until you close the
  scanner?" Until answered, this slice keeps the "✓ N" pill as the
  holding-list count (already built by slice H, matching REQ-214) and
  leaves the hint text exactly as slice H wrote it — it does not adopt the
  mockup's "adds the card and keeps scanning" wording, which describes the
  rejected earlier behaviour.

## Acceptance criteria

- [ ] P1. `npm run quality:check` passes.
- [ ] P2. `npm --workspace apps/frontend run test` passes.
- [ ] P3. The header and mock-mode strip remain visible on the scan screen,
      with a "Scan a card" `h1` and a 44px ✕ exit, in
      `ScanCameraSurface.tsx`.
- [ ] P4. The viewfinder is one panel (no nested frames) with corner-ticked
      guide, marching lock outline, and a "Locking on <card>" indicator
      with a vote bar, in `ScanCameraSurface.tsx`.
- [ ] P5. The foot row shows a mute pill, a 54px round shutter, and a Debug
      pill, replacing the rectangular Capture button, in
      `ScanCameraSurface.tsx`.
- [ ] P6. The "✓ N" holding-count pill and its hint text are unchanged from
      slice H (per the owner question above), in `ScanCameraSurface.tsx`.
- [ ] P7 (manual). Side-by-side pair saved under
      `docs/design/ui-reimagining/build-screenshots/p/`, build next to
      mockup, Blue, at 390×844 and 1440×900, for the "locking on" state
      (`card-scan-build-*.png`, `card-scan-mockup-*.png`) — 4 files. The
      camera-unavailable state has no build partner (the headless test
      browser has no camera); the existing mockup-only reference captures
      (`card-scan-camera-error-mockup-390x844.png`,
      `card-scan-camera-error-mockup-1440x900.png`) are carried forward
      unchanged from `docs/design/ui-reimagining/build-screenshots/look-gaps/`
      — 6 files total, matching LOOK-GAPS.md's Card scanner pairs list.
- [ ] P8 (manual). The pair in P7 was compared side by side against the
      build; every `### Differences` bullet under LOOK-GAPS.md's `## Card
      scanner` is closed, or is the owner question above (never resolved
      past the stated interim reading).
- [ ] P9 (manual). Browser scenario at 390×844 and 1440×900: open the
      scanner from Ask a Question, confirm the header stays visible, the
      guide and lock outline render, the foot row's shutter and mute
      controls are reachable, and the page does not scroll.
- [ ] P10 (manual). Cleanup evidence recorded: browser closed, owned dev
      server(s) stopped, ports released, disposable captures under
      `PRD/work/ui-reimagining-build/.playwright-mcp/` named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
