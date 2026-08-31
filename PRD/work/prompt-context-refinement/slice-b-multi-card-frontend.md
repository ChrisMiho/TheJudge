# Slice B — Multi-card lookup: pre-submit UI, follow-up wiring, screen-layout

## Status: done

## Goal

The Quick Question pre-submit view lets a player add, preview, and remove up
to 5 cards (typed search or camera scan), submits the card set with no game
state, freezes the whole set for text-only follow-ups, and blocks adding past
the cap with a stated limit. Depends on slice A shipping the `cards` wire
contract.

## Requirements

REQ-167 (pre-submit UI acceptance criteria), FLOW-023 (full flow).

1. `quick-lookup/QuickLookupApp.tsx` — `selectedCard: CardMetadataItem | null`
   becomes a capped list; add via typed autocomplete search or camera scan
   (existing REQ-001/002/FLOW-006 paths), each resolved card previewed then
   added, each removable; an add beyond the cap is blocked with a stated
   limit message, mirroring existing bounded-add UX patterns (e.g. the
   In-Depth zone-collection strip).
2. `lib/contextFlow/flow.ts` — `buildLookupAskAiRequest` sends the card list
   (`cards`) per the updated contract instead of a single `card`.
3. `hooks/useAskAiSubmitOrchestration.ts` — `FrozenAskAiContext`'s
   `{ kind: "lookup"; card: ... }` becomes `{ kind: "lookup"; cards: ... }`;
   the answered workspace's frozen-context view shows every attached card;
   follow-up requests rebuild from the frozen card set
   (`{ mode: "lookup", question, cards: frozen, conversationHistory }`).
4. `components/CardSelectionPreview.tsx` (and any shared card-preview
   component reused here) supports rendering the multi-card add strip without
   forking `CardPresentation`.
5. `PRD/sections/screen-layout.md` — the "Quick Question — pre-submit" row's
   single-card measured image-cap bound is re-measured for the multi-card add
   strip at 390×844 and 1440×900, following the row's existing measured-bound
   convention (dated ui-review entries), and the row updated in place.
6. `PRD/sections/quick-lookup/README.md` — the current-state feature spec is
   updated for the shipped multi-card pre-submit behavior (per the
   DESIGN-BRIEF note that this README is current-state truth updated at
   implementation, not at design time).

## Acceptance criteria

- [x] B1 — The pre-submit view supports adding, previewing, and removing more
  than one card; each add resolves to one oracle-level card via typed search
  or camera scan.
- [x] B2 — An add attempted past the 5-card cap is blocked and a stated limit
  is shown to the player.
- [x] B3 — On submit, the request carries the full attached card list and no
  game state; with zero or one card attached, behavior is unchanged from
  today.
- [x] B4 — The answered workspace's frozen-context view shows every attached
  card; a follow-up sends `{ mode: "lookup", question, cards: frozen,
  conversationHistory }` with the card set frozen (text-only follow-ups).
- [x] B5 — Component tests (`QuickLookupApp.test.tsx` and any touched flow/hook
  tests) cover add/remove/cap-blocked/frozen-context/follow-up for the
  multi-card case.
- [x] B6 — **Browser-risk (manual):** at 390×844 and at 1440×900, add cards up
  to the 5-card cap, confirm the blocked-add message on a 6th attempt, submit,
  and confirm the answered workspace shows all attached cards in the frozen
  context. Record the re-measured image-cap bound (or confirm the existing
  bound already holds for the multi-card strip) as the `screen-layout.md`
  update. See `slice-b.evidence.md` (2026-08-30).
- [x] B7 — Browser closed, owned dev server(s) stopped, ports released;
  captures (if any) written to
  `PRD/work/prompt-context-refinement/.playwright-mcp/`. See
  `slice-b.evidence.md` (2026-08-30).

## Verification

```bash
npm --workspace apps/frontend run test
npm run quality:check
```

Manual (B6/B7): Playwright MCP verification per
`PRD/instructions/runtime-process-hygiene.md` — start an isolated dev server
on an assigned port, exercise the scenarios above at both viewports, record
measurements/observations in this slice's evidence log, then close the
browser and stop the owned server.

## Files touched

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`,
  `QuickLookupApp.test.tsx`
- `apps/frontend/src/lib/contextFlow/flow.ts`, `flow.test.ts`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`,
  `useAskAiSubmitOrchestration.test.ts`
- `apps/frontend/src/components/CardSelectionPreview.tsx` (if the multi-card
  strip needs a shared-component change)
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (onSubmit wiring,
  if its signature changes)
- `PRD/sections/screen-layout.md` ("Quick Question — pre-submit" row)
- `PRD/sections/quick-lookup/README.md`
