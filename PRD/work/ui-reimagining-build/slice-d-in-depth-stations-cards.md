# Slice D — In-depth details: stations rail, Cards shelf, card menu, placement, Stack reorder

## Status: planned

## Goal

In-depth details gets a tappable progress rail — Game · Zones · Cards ·
Context — each station built so the way forward is on the panel. The Cards
station shows a lit shelf of real card images per zone, a card menu (Move to
· order · Card details · Remove), drag reorder, and BOTTOM…TOP tags on the
Stack. Carried cards are placed one at a time; nothing passes Cards until
each card has a zone or is explicitly left out.

## Dependencies

Slice A (frame, tokens), slice B (shared sheet — card detail from the card
menu), slice C (the carry hand-off this slice receives cards from).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-209 — four stations on a tappable progress rail; every detail
   today's form collects is kept, including the combat sub-step and
   Additional game state.
2. REQ-005, REQ-006 — players can reorder the Stack; order stays
   bottom-to-top as reordered, and Stack order is sent exactly as shown
   (`A10`: non-Stack order stays cosmetic, no prompt-meaning change there).
3. REQ-007 — the Stack's count lives on its zone tab.
4. REQ-008 — Stack details (BOTTOM…TOP tags) live on the shelf and the card
   menu.
5. REQ-018 — the card collection keeps bottom-to-top order and places
   carried cards one at a time; nothing passes Cards until every carried
   card has a zone or is left out.
6. REQ-056 — the "View all cards" row cap is retired (the shelf shows every
   card in the zone, no truncation).
7. FLOW-001 — the in-depth flow's steps are the four stations.

## Files touched

- `apps/frontend/src/components/ZoneCollectionStep.tsx` (+ `.test.tsx`) —
  stations rail, Cards station composition.
- `apps/frontend/src/components/ZoneCardPicker.tsx` (+ `.test.tsx`) — lit
  shelf, card menu (Move to · order · Card details · Remove), BOTTOM…TOP
  tags, drag reorder (pointer events, no library — `A20`).
- `apps/frontend/src/components/StagedStepHeader.tsx`, `StepEyebrow.tsx` —
  progress rail presentation.
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (+
  `.player-counters.test.tsx` sibling if touched) — placement gate: nothing
  passes Cards until every carried card has a zone or is left out.
- `PRD/sections/in-depth/README.md`, `PRD/sections/functional-requirements.md`,
  `PRD/sections/user-flows.md` — apply REQ-209, REQ-005, REQ-006, REQ-007,
  REQ-008, REQ-018, REQ-056, FLOW-001 by intent.

## Tests

- `ZoneCollectionStep.test.tsx`, `ZoneCardPicker.test.tsx` — reorder,
  BOTTOM…TOP tags, card menu actions, shelf with no row cap.
- `App.zoneFlow.test.tsx`, `App.game-setup-zones.test.tsx` — placement gate,
  station rail navigation.
- Prompt fixture test asserting Stack order reaches the request exactly as
  shown, and non-Stack order stays cosmetic (`A10`).

## Acceptance criteria

- [ ] D1. `npm run quality:check` passes.
- [ ] D2. `npm --workspace apps/frontend run test` passes.
- [ ] D3. The Cards station renders a lit shelf of real card images per zone
      tab, with no "View all cards" truncation.
- [ ] D4. Dragging a Stack card reorders it; the shown order (bottom-to-top)
      is what the request sends.
- [ ] D5. Every zone tab shows its own card count, including the Stack's.
- [ ] D6. The Stack's shelf and card menu show BOTTOM…TOP tags.
- [ ] D7. A carried card cannot leave the Cards station without a zone or an
      explicit "leave out"; the gate blocks progression until every carried
      card is resolved.
- [ ] D8. `PRD/sections/` carries REQ-209, REQ-005, REQ-006, REQ-007,
      REQ-008, REQ-018, REQ-056, FLOW-001 by intent.
- [ ] D9 (manual). Prompt fixture shows Stack order sent exactly as shown in
      the UI; non-Stack zone order has no effect on the prompt (A10).
- [ ] D10 (manual). Browser scenario at 390×844: drag-reorder two Stack
      cards by pointer/touch, confirm the shelf and the card menu both
      reflect the new BOTTOM…TOP order.
- [ ] D11 (manual). Cleanup evidence recorded: browser closed, owned servers
      stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
