# Slice F — Compact card images + suite-wide detail popup

## Status: planned

## Goal

Shrink card images enough that hosting screens' primary chrome and CTAs fit the
first viewport, and replace the image↔metadata three-dot swap with a corner
control that opens a dismissible popup over the card (REQ-128, REQ-129, DEC-151
parts 1–2, superseding DEC-148).

## Requirements

1. In `CardPresentation.tsx`, reduce the rendered image size (currently
   `mx-auto h-auto w-4/5 object-contain`, full intrinsic width) to a compact size
   that keeps the hosting step's primary CTA in the first viewport at 390×844.
   Images stay uncropped and aspect-ratio preserving.
2. Replace the existing `showMetadata` image↔metadata toggle (the `⋯` button and
   its inline swap) with a corner control positioned top-right of the image that
   opens a **popup overlay** — the image stays visible, the popup layers over it
   with oracle text and the same locally-carried descriptive fields (mana cost,
   mana value, type line, colors, supertypes, subtypes) currently in the fallback
   `<dl>`. The popup has a visible X close control; Escape/outside-dismiss may
   match other overlays (`ConversationHistoryDrawer` pattern) but are not required
   by this slice's acceptance criteria.
3. Every suite surface that renders `CardPresentation` with an available image
   gets the corner control automatically (no new fetch — popup content comes from
   the same `ZoneCardItem`/`CardMetadataItem` fields already passed in).
4. When the image is unavailable or fails to load, the existing text-first
   fallback (`data-testid="card-presentation-fallback"`) renders unchanged — no
   corner control, no popup, no broken-image icon.
5. Do not add sticky or floating chrome over the card preview beyond the corner
   control itself.

## Acceptance criteria

- [ ] At 390×844, zone-collection card detail's "Add card" action `top` is
      ≤ 844px (baseline: y=1088 before the first DEC-148 pass, y=956 after; REQ-125)
- [ ] Enrichment and Quick Question pre-submit card surfaces do not force page
      scroll solely because of full-intrinsic-size images
- [ ] Every card-image surface with an available image shows a corner detail
      control (top-right); activating it opens a popup containing oracle text
      (when present) and the other locally-carried fields, with a working X close
- [ ] Oracle/detail text is not rendered stacked under the image by default when an
      image is present (the popup is the only path to it)
- [ ] With no image or a failed image load, the existing fallback still renders its
      descriptive text and no corner control/popup appears
- [ ] No new network request fires when the popup opens
- [ ] `CardPresentation` existing fallback tests pass unchanged; new tests cover
      the corner control and popup open/close

## Verification

```bash
npm --workspace apps/frontend run test -- CardPresentation ZoneCollectionStep CardSelectionPreview ZoneCardPicker
npm run quality:check
```

Playwright MCP at 390×844 and 1440×900: In-Depth → zone collection → search
"lightning bolt" → select the result → `browser_evaluate` for add-action `top` and
corner-control presence; open the popup and check for the X control and content;
screenshots at both viewports. Call `browser_close` when finished.

## Files touched

- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `apps/frontend/src/components/CardPresentation.test.tsx`

## Prior pass (2026-08-05) — superseded, not carried forward

The first pass capped preview image height below `sm` and dropped the duplicate
oracle paragraph (DEC-148), recovering 133px of the ~245px needed and leaving "Add
card" 112px below the fold. DEC-148 is now `superseded` by DEC-151 — this slice
replaces that approach rather than extending it. Do not reintroduce the `⋯`
image↔metadata swap; DEC-151 explicitly makes the corner popup the primary detail
affordance.
