# Slice L — Composer growth ceiling accounts for chrome below the field

## Status: planned

## Goal

Change the auto-grow ceiling so a composer field stops growing when further
expansion would push the UI below it (submit row / destination chrome)
off-screen — not merely when the field's own bottom reaches the viewport bottom
(REQ-110 amended, DEC-131 Notes; `issues.md` #8).

## Requirements

1. In `useAutoGrowTextarea.ts`, the current ceiling calculation
   (`window.innerHeight - top - VIEWPORT_BOTTOM_MARGIN_PX`, line ~76) uses only
   the textarea's own top and the viewport bottom. Replace it with a ceiling that
   accounts for the height of the composer's own chrome below the field (submit
   row / counter / equivalent destination chrome) so that chrome — and the rest
   of the composition below it — never gets pushed off-screen or forces
   document/page scroll purely from field growth.
2. Preserve the existing floor: the field never shrinks below one line of its own
   text (`measureSingleLineHeight`) even if that would violate the new ceiling —
   REQ-120's fix (never pin a collapsed height) must not regress.
3. Preserve the existing re-activation behavior (skip-measurement-when-unrendered
   plus `ResizeObserver` remeasure) — this slice changes only what the ceiling
   maths accounts for, not the render-detection logic around it.
4. Applies to both call sites sharing this hook (Enrichment optional question,
   Quick Question question field) without introducing per-field divergence
   (DEC-131 prefers one shared implementation).
5. Desktop and mobile both get the same growth-stops-before-lower-chrome-is-lost
   behavior — this is not a mobile-only fix.

## Acceptance criteria

- [ ] Holding Enter to add many newlines on mobile no longer pushes the UI under
      the composer (submit button, counter, or destination chrome) off-screen or
      causes document/page scroll (baseline defect: field grows to the viewport
      bottom while UI below it disappears)
- [ ] The same behavior holds on desktop (more available space, same rule)
- [ ] The field still never collapses below one line of readable text
      (REQ-120 regression check)
- [ ] Switching destinations and back while a field holds typed content still
      restores the correct height (REQ-120 regression check via
      `useAutoGrowTextarea` existing tests)
- [ ] Character counter and submit control remain visible and usable at the
      field's maximum grown height
- [ ] `useAutoGrowTextarea` existing tests pass; new test(s) cover the
      below-field-chrome ceiling

## Verification

```bash
npm --workspace apps/frontend run test -- useAutoGrowTextarea EnrichmentStep QuickLookupApp
npm run quality:check
```

Playwright MCP at 390×844 and 1440×900: Enrichment optional question and Quick
Question — type/paste a long multi-line question, `browser_evaluate` for the
submit row's bounding box staying within the viewport and
`document.documentElement.scrollHeight` vs `innerHeight` (no page scroll induced),
plus a screenshot mid-growth. Call `browser_close` when finished.

## Files touched

- `apps/frontend/src/hooks/useAutoGrowTextarea.ts`
- `apps/frontend/src/hooks/useAutoGrowTextarea.test.ts` (or equivalent)

## Dependencies

None — touches a file no other slice in this package edits.
