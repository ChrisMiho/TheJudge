# Slice B — Shared sheet shell + confirm sheet

## Status: planned

## Goal

Every pop-up in the app — card detail, Question History, the printing
picker, Send feedback, and "are you sure?" — opens from one shared shell: a
bottom sheet below 600px, a floating centred card from 600px, fixed head and
foot, body scrolls.

## Dependencies

Slice A (tokens, colour roles, the shared stylesheet the sheet shell is
written against).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-208 — one pop-up shape, hosting card detail (now centred on desktop),
   Question History, the printing picker, Send feedback and the confirm
   sheet. View Context keeps its own 768px sheet/drawer (unchanged, out of
   this slice's scope).
2. REQ-128 — the card detail opens centred on desktop inside the shared
   shell, not in its prior position.
3. REQ-087 — Send feedback: type as three pills, snapshot folded behind a
   dashed row, hosted in the shared shell.
4. FLOW-014 — Send feedback flow opens through the ☰ Menu into the shared
   sheet.

The confirm sheet ("are you sure?") is new chrome this slice builds, used
later by Trade Balancer's New trade (slice G) and Life Tracker's Reset/New
game (slice J) — this slice ships the shell and confirm sheet themselves,
not those callers.

## Files touched

- New `apps/frontend/src/components/SheetShell.tsx` (+ `.test.tsx`) — the
  shared shell: sheet below 600px, centred card from 600px, fixed head/foot,
  scrolling body.
- New `apps/frontend/src/components/ConfirmSheet.tsx` (+ `.test.tsx`) — the
  shared "are you sure?" confirm, built on `SheetShell`.
- `apps/frontend/src/components/feedback/FeedbackModal.tsx` (+
  `.test.tsx`) — rehosted on `SheetShell`; type as three pills, snapshot
  folded.
- Card detail component (wherever it mounts today, per
  `CardPresentation.tsx` / `CardSelectionPreview.tsx` callers) — rehosted on
  `SheetShell`, centred on desktop.
- `apps/frontend/src/index.css` — the 600px sheet-family boundary (DEC-117 /
  NFR-011: structural, scoped to the sheet family only).
- `PRD/sections/functional-requirements.md`, `PRD/sections/user-flows.md`,
  `PRD/sections/shared-chrome/README.md` — apply REQ-208, REQ-128, REQ-087
  and FLOW-014 by intent.

## Tests

- New `SheetShell.test.tsx`, `ConfirmSheet.test.tsx` — shape at both sides
  of 600px, fixed head/foot, scrolling body.
- `FeedbackModal.test.tsx` — three pills, folded snapshot row, hosted shell.
- Card detail's existing test file — centred-on-desktop assertion.

## Acceptance criteria

- [ ] B1. `npm run quality:check` passes.
- [ ] B2. `npm --workspace apps/frontend run test` passes.
- [ ] B3. `SheetShell` renders as a bottom sheet below 600px and a floating
      centred card at and above 600px, with a fixed head/foot and a
      scrolling body.
- [ ] B4. Card detail opens inside `SheetShell`, centred on desktop (REQ-128).
- [ ] B5. `FeedbackModal` is hosted on `SheetShell`, shows the feedback type
      as three pills, and folds the snapshot behind a dashed row (REQ-087).
- [ ] B6. `ConfirmSheet` exists and is built on `SheetShell` (consumed by
      later slices, not called from this one).
- [ ] B7. `PRD/sections/` carries REQ-208, REQ-128, REQ-087 and FLOW-014 by
      intent.
- [ ] B8 (manual). REQ-202 pair: Life Tracker screenshot before/after this
      slice's shared-stylesheet change (the new 600px boundary), at 390×844
      and 1440×900, saved to `docs/design/ui-reimagining/build-screenshots/b/`.
- [ ] B9 (manual). Browser scenarios observed at 390×844 and 1440×900: card
      detail and Send feedback open as a bottom sheet on phone and a
      centred floating card on desktop; the body scrolls while the head and
      foot stay fixed.
- [ ] B10 (manual). Cleanup evidence recorded: browser closed, owned servers
      stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
