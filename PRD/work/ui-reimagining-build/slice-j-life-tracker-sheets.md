# Slice J — Life Tracker's sheets take the look

## Status: done

## Goal

Life Tracker's back menus take the new look: Game Setup fits one phone
screen; Reset and New game ask first through the shared confirm sheet; a
player's Counters panel gets two tabs (commander-damage seat map with LETHAL
at 21; counters as tiles with a ⋯ menu). The table itself — seats, life,
layout, day/night, seat map, state, persistence — stays untouched to the
pixel.

## Dependencies

Slice A (frame, tokens), slice B (shared sheet, confirm sheet — Reset/New
game move onto it).

## Requirements

Realises this `GATE-QUESTIONS.md` id, applied to `PRD/sections/` by intent
together with the code:

1. REQ-202 — Life Tracker's back menus (Game Setup, Counters) take the new
   look; the table (seats, life, layout, day/night, seat map, state,
   persistence) is untouched and pixel-reviewed. Game Setup fits one phone
   screen. Reset and New game ask first through the shared confirm sheet.
   Counters gets two tabs: commander-damage seat map (LETHAL at 21) and
   counters as tiles with a ⋯ menu. Every control, option, default and
   range stays today's.

## Files touched

- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx` (+
  `.test.tsx`) — reskinned to fit one phone screen; Reset/New game wired to
  `ConfirmSheet`; today's two-step in-place confirm (`:27-37,108-170`)
  removed.
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` (+
  `.test.tsx`) — two tabs: commander-damage seat map, counters-as-tiles with
  a ⋯ menu.
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`,
  `PlayerLifeTrackerApp.tsx` — unchanged except where they host the above
  panels; the table itself is not touched by this slice.
- `PRD/sections/life-tracker/README.md`,
  `PRD/sections/functional-requirements.md` — apply REQ-202 by intent.

## Tests

- `GameSetupPanel.test.tsx` — fits one phone screen, Reset/New game route
  through `ConfirmSheet`.
- `CounterPanel.test.tsx` — two tabs, LETHAL at 21, ⋯ menu on counter tiles.
- `PlayerLifeTrackerApp.player-counters.test.tsx` — table state and
  persistence byte-for-byte unchanged.

## Acceptance criteria

- [x] J1. `npm run quality:check` passes.
- [x] J2. `npm --workspace apps/frontend run test` passes.
- [x] J3. Game Setup fits within one phone screen's viewport (390×844) with
      no page scroll.
- [x] J4. Reset and New game open the shared confirm sheet before acting;
      today's in-place two-step confirm is gone.
- [x] J5. Counters shows two tabs: a commander-damage seat map with LETHAL
      marked at 21, and counters as tiles with a ⋯ menu.
- [x] J6. Every control, option, default and range in Game Setup and
      Counters matches today's values (no behavioural change, presentation
      only).
- [x] J7. The life-total table itself (seats, life, layout, day/night, seat
      map, state, persistence) is byte-for-byte unchanged in behaviour and
      test coverage.
- [x] J8. `PRD/sections/` carries REQ-202 by intent.
- [x] J9 (manual). REQ-202 pair: Life Tracker screenshot before/after this
      slice, at 390×844 and 1440×900 — the canonical pair this requirement
      names, pixel-reviewed by the owner's eye, saved to
      `docs/design/ui-reimagining/build-screenshots/j/`.
- [x] J10 (manual). Browser scenario at 390×844: open Game Setup, confirm no
      page scroll; tap Reset, confirm the shared sheet opens before
      anything resets.
- [x] J11 (manual). Cleanup evidence recorded: browser closed, owned
      servers stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
