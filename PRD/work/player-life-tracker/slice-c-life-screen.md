# Slice C — Tracker destination and full-table life screen

## Status: planned

## Goal

Register the `player-life-tracker` feature-portal destination and render the live
full-table life screen: rotated life-tinted player cards, edge `+`/`−` life
zones, name pill, skull death cue, and basic game setup with reset (REQ-081).

## Requirements

1. `components/portal/life-tracker/PlayerLifeTrackerApp.tsx` — destination root.
   Owns `useLifeTracker` (Slice B), renders a header containing `<PortalSlot />`
   (so the portal menu button mounts inline, as `StagedStepHeader` does), the
   `GameSetupPanel`, and the life table.
2. Register in `components/portal/destinationRegistry.tsx`:
   `{ id: "player-life-tracker", label: "Life Tracker", render: () => <PlayerLifeTrackerApp /> }`.
   Selecting it is a frontend-only view switch with no reload; DestinationOutlet
   keeps it mounted/hidden (in-session state preserved).
3. `components/portal/life-tracker/PlayerLifeCard.tsx` — one card per active
   player (2–8), laid out and rotated per `seatArrangement(count)` so each giant
   life total faces that seat. Card is life-tinted, shows a name pill
   (`formatPlayerDisplayLabel`), and exposes edge `+`/`−` tap zones that call
   `adjustLife`. Tapping the counter area opens the counter panel (Slice D wires
   the panel; this slice provides the trigger/affordance).
4. Skull death cue: at life ≤ 0 a skull overlays that card; it clears when life
   returns above 0. Visual only — no elimination, auto-KO, or card removal.
5. `components/portal/life-tracker/GameSetupPanel.tsx` — player count (2–8) and
   starting-life preset (20 / 25 / 30 / 40 / 60 / custom) driving
   `setPlayerCount` / `setStartingLife`; a plain **reset / New Game** returns all
   life and counters to starting values and clears persistence (no
   winner-selection step). Match `references/IMG_9509.PNG` Game Setup section
   (Players / Starting life); the Layout toggle and all Gameplay toggles are
   deferred/out of v1.
6. Mobile-first (NFR-001); rotation and any card motion stay CSS-only and
   `prefers-reduced-motion`-aware (DEC-079 / NFR-006). No animation library.

## Acceptance criteria

- [ ] "Life Tracker" appears in the feature-portal menu; selecting it switches to
      the tracker view with no reload and preserves state on switch-away/back.
- [ ] Choosing player count `n` (2–8) renders exactly `n` cards arranged per
      `seatArrangement`, each life total rotated to face its seat.
- [ ] Tapping a card's `+`/`−` edge zone changes only that player's life.
- [ ] A player at life ≤ 0 shows the skull overlay; raising life above 0 clears
      it; the card remains and life stays adjustable.
- [ ] Selecting a starting-life preset seeds every player to that value; reset /
      New Game returns life (and counters) to starting values and clears persisted
      state.
- [ ] The portal menu button renders inline in the tracker header (PortalSlot),
      not the fixed fallback tab.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/portal/life-tracker
npm --workspace apps/frontend run test -- src/components/portal/destinationRegistry
npm run typecheck
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx` (+ test)
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx` (+ test)
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx` (+ test)
- `apps/frontend/src/components/portal/destinationRegistry.tsx` (+ existing test update)
- `apps/frontend/src/index.css` (rotation / life-tint utility classes if needed)

## Notes

- UI direction fixed by `references/IMG_9504.PNG` (life screen) and
  `IMG_9509.PNG` (Game Setup). Do not invent layout.
- The shared roster (count + display names) is the same conceptual roster used by
  MTG Assistant game setup (REQ-015); the seed in Slice E maps between them.
- Deferred surfaces (game history, mana counter, dice & misc, per-player theming,
  saved profiles, reset-with-winner, layout toggle) are out of v1.
