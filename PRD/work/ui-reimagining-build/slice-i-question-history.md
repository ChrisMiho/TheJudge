# Slice I — Question History: one list for every question, reopened live

## Status: planned

## Goal

Question History becomes a Menu row: one list of both question kinds
("n of 20"), rows with a fan of card thumbnails; a tap reopens a
conversation live in its own flow. Two panes from 600px. The History rail
icon is retired.

## Dependencies

Slice A (frame, Menu), slice B (shared sheet — History is hosted in it),
slice C (Ask a Question conversations), slice D (In-depth conversations).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-213 — Question History: one list for every question (both kinds),
   "n of 20", rows with a fan of card thumbnails; opened from the Menu; the
   History rail icon is retired.
2. REQ-103 — one list in the shared sheet, opened from the Menu.
3. REQ-107 — History is always one tap away, from the Menu.
4. FLOW-016 — resuming from Question History reopens that conversation live
   in its own flow (Ask a Question's chat or In-depth's, with View Context —
   `A15`).
5. FLOW-017 — the Draft shows as its own row at the top of the one list,
   per flow (`A16`); this replaces the old rail-based Draft indicator.
6. FLOW-018 — delete, with confirm, through the shared confirm sheet; below
   600px each row keeps a delete control (`A17`).

## Files touched

- `apps/frontend/src/components/ConversationHistoryDrawer.tsx` (+
  `.test.tsx`) — one combined list, "n of 20", card-thumbnail fan, two
  panes from 600px, hosted on `SheetShell`.
- `apps/frontend/src/lib/conversationHistory/persistence.ts` — read path for
  a combined list across both modes; Draft-per-mode row logic (`A16`)
  unchanged in shape.
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` — History
  Menu row (rail icon retired, covered partly by slice A's REQ-115/116;
  this slice wires the row's destination).
- `apps/frontend/src/App.conversation-history-delete.test.tsx`,
  `App.persist-active-destination.test.tsx` — combined-list and delete
  flows.
- `PRD/sections/shared-chrome/README.md`, `PRD/sections/user-flows.md`,
  `PRD/sections/functional-requirements.md` — apply REQ-213, REQ-103,
  REQ-107, FLOW-016, FLOW-017, FLOW-018 by intent.

## Tests

- `ConversationHistoryDrawer.test.tsx` — combined list ordering, Draft rows,
  thumbnail fan, delete control visibility below 600px.
- `App.conversation-history-delete.test.tsx` — delete through the confirm
  sheet.
- `App.persist-active-destination.test.tsx` — reopening a conversation
  resumes live in its own flow.

## Acceptance criteria

- [ ] I1. `npm run quality:check` passes.
- [ ] I2. `npm --workspace apps/frontend run test` passes.
- [ ] I3. Question History shows one list combining both question kinds,
      labelled "n of 20", each row with a fan of card thumbnails.
- [ ] I4. History opens from the Menu, hosted in the shared sheet; no
      separate History rail icon remains.
- [ ] I5. Tapping a row reopens that conversation live in its own flow (Ask
      a Question's chat, or In-depth's with View Context).
- [ ] I6. Each flow's Draft appears as its own row at the top of the list.
- [ ] I7. Deleting a row asks first through the shared confirm sheet; below
      600px the row keeps its own delete control.
- [ ] I8. `PRD/sections/` carries REQ-213, REQ-103, REQ-107, FLOW-016,
      FLOW-017, FLOW-018 by intent.
- [ ] I9 (manual). REQ-202 pair: Life Tracker screenshot before/after this
      slice's shared-sheet History integration, at 390×844 and 1440×900,
      saved to `docs/design/ui-reimagining/build-screenshots/i/`.
- [ ] I10 (manual). Browser scenarios at 390×844 (single pane) and 1440×900
      (two panes): open History from the Menu, reopen a past In-depth
      conversation, confirm it resumes live with View Context available.
- [ ] I11 (manual). Cleanup evidence recorded: browser closed, owned
      servers stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
