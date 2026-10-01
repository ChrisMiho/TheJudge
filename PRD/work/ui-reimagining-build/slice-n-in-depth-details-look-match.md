# Slice N — In-depth details takes the look

## Status: planned

## Goal

Each of In-depth details' four steps (Game, Zones, Cards, Context/Review)
becomes one lit plate with its own foot bar — "Continue · next: …" — instead
of several bordered panels with free-standing Back/Continue buttons. The
stations rail gains a back button and a page title. The Cards step's shelf
cards carry ✕/ⓘ corner widgets and open a card menu on tap, with a lit reorder
hint. The context sheet and review list take the mockup's compact layout.

Behaviour does not change in this slice. Slices D and E already built the
stations rail, shelf, card menu, placement, context sheet and review; this
slice restyles what they built to match the mockup pixel values below,
inside the frame slice L just landed.

## Dependencies

Slice L (frame — the header this screen's back button and page title sit
under) and slices D, E (stations rail, shelf, card menu, placement, context
sheet, review — restyled here, both `done`).

## Mockup source

`docs/design/ui-reimagining/direction-1/in-depth-question.html`, with
`flow.css` (chat/wait bubble only — the rest of this page's rules are
inline in the HTML file itself, per the citations below).

## LOOK-GAPS.md section closed

`## In-depth details` (`PRD/work/ui-reimagining-build/LOOK-GAPS.md:120-169`).

## Requirements

No new `GATE-QUESTIONS.md` id beyond what slices D and E already applied
(REQ-209, REQ-005, REQ-006, REQ-007, REQ-008, REQ-018, REQ-056, FLOW-001,
REQ-017, REQ-021, REQ-100, REQ-045, REQ-058, REQ-210, REQ-136) — presentation
only, except where an owner question below says otherwise.

1. Header: add a round ‹ back button plus "In-depth details" as the page
   `h1`, above the rail (`in-depth-question.html:14-16` column,
   `:67-75` `.flow-head .lead`).
2. Stations rail: keep D's four-node structure; restyle labels to sentence
   case at 0.72rem, current node in `--text-primary` at 600 weight, per
   `in-depth-question.html:20-48` (`.rail`, `.fill` gradient+glow, `.node`
   26px, done/current states, `node-pulse` 2.6s double ring).
3. Every step becomes one `.plate` (`:80-87`, 1rem radius, `--surface-panel`,
   shadow) with its way forward as the plate's own lit foot bar:
   `:55-66` `.plate-next` (accent gradient 24%→6%, hairline top, 52px tall,
   "Continue · next: <what's next> ›"). Free-standing "Confirm game
   context" / "Back" / "Continue" / "OK — next card" / "Back to zones"
   buttons are retired; the ‹ in the header is the only way back.
4. Step 1 (Game): one plate holding Players in game and Turn phase/Active
   player, with custom selects (`:121-122` chevrons) in place of native
   `<select>`s. The player stepper keeps D's −/+ squares; restyle the + to
   an accent-outlined square and the players-count row to one wide
   "▶ 2 players" expander per the mockup.
5. Step 2 (Zones): zone tiles get the glow treatment on check
   (`:125-138`): border accent-soft, fill accent 22% into the panel, outer
   glow, the colour's motif faint in the corner, ✓ mark filled.
6. Step 3 (Cards): ＋ Add to Stack / ▣ Scan become a row of their own under
   the rail (`:67-75` `.attach`), not inside the shelf panel. Zone tabs
   become pills with the count in accent-soft (`:141-144`). The reorder
   hint becomes a lit `.shelf-hint` with ⇄ (`:169-173`). Shelf cards
   (`:174-195` `.shelf` and card/drag states) carry ✕/ⓘ corner widgets
   instead of a "Card actions" button underneath; a tap opens the card
   menu (D's existing menu, restyled, not rebuilt). The Bottom/Top tag
   moves to straddle the card's bottom edge (`:233-243` `.pos` order tag).
7. Step 3 Placing: the placing view becomes the context-sheet layout
   (`:149-167` place zones and Other zones): a 96px card on the left; "FROM
   YOUR QUESTION / LEAVE THIS CARD OUT" eyebrow, name, type line, and a
   "N / M to place" counter box on the right; only the chosen zones show as
   48px tiles with a radio mark, the rest behind "Other zones ▾". A carry
   note above the rail reads "N cards came along with your question…"
   (`:67-75` `.carry-note`).
8. Step 4 Context: becomes the full context-sheet grid (`:255-299`
   `.ctx-art`, `.ctx-head`, `.counter`, `.ctx-form`, `.pill`): art plus a
   head row (zone eyebrow, card name at 1.2rem/700, type line, "N / M
   cards" counter), Cast by and Mana spent side by side, Targets as pills
   with a thumbnail above the picker, "＋ Add a note" and "More details ▴"
   as two dashed rows sharing one line (`:361-374`), and the "Next card ›"
   plate-next foot. See the owner question below on Mana spent's zone
   scope.
9. Step 4 Review: becomes one plate, "CONTEXT REVIEWED · N CARDS · Collapse
   ▴" (`:302-319`, `:410-424`): rows with a 30×42 thumbnail, name, zone tag,
   "cast by · targets" line, and a ✎ icon, in a scrolling area capped at
   34dvh with a fade, "N cards · scroll the list for the rest", and zone
   filter pills. Under the plate: "YOUR QUESTION — optional" with the same
   composer/split-send-pill slice M builds for Ask a Question.
10. Ruling: becomes the Ask a Question ruling view (requirement 10 in slice
    M) — an "Ask a Question" `h1`, "◈ View context", "✎ Edit" and a round
    ↺, a CARDS thumbnail strip, then bubbles with the seal. The wait bubble
    (`flow.css:393-414` `.msg.judge.waiting`) is unchanged — slice F already
    built the inking-in wait inside the judge's bubble; this slice only
    restyles the bubble shell around it.

## Files touched

- `apps/frontend/src/components/ZoneCollectionStep.tsx` (+ `.test.tsx`) —
  stations rail header/back button, plate shells, plate-next foot bars.
- `apps/frontend/src/components/ZoneCardPicker.tsx` (+ `.test.tsx`) — shelf
  card corner widgets, lit reorder hint, zone pill tabs, Bottom/Top tag
  position.
- `apps/frontend/src/components/StagedStepHeader.tsx`, `StepEyebrow.tsx` —
  rail label casing/weight, node-pulse.
- `apps/frontend/src/components/EnrichmentStep.tsx` (+ `.test.tsx`) —
  context-sheet grid, review plate, zone filter pills, placing-sheet
  layout.
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx` — header back
  button wiring, placement-gate presentation only (gate logic unchanged).
- `apps/frontend/src/components/ConversationThread.tsx` — shared with
  slice M; ruling-view restyle applies here too (same component).

## Tests

- `ZoneCollectionStep.test.tsx`, `ZoneCardPicker.test.tsx`,
  `EnrichmentStep.test.tsx`, `StagedStepHeader.test.tsx` — updated for the
  new markup/classes, plate-next navigation replacing the retired
  Back/Continue buttons (same navigation outcomes, new control).
- Byte-identical golden prompt assertion stays green (`DESIGN-BRIEF.md` A9;
  slice E's existing test) — this slice touches no prompt-building code.

## Owner questions — the build follows the accepted requirement until answered

Carried verbatim from LOOK-GAPS.md's `## In-depth details`
`### Conflicts with accepted requirements`:

- "Mana spent on every zone (REQ-210, your edit: 'just include in all the
  zones for now'). The mockup shows the Mana spent box only on Stack and
  Battlefield cards (`in-depth-question.html:712`, `hasMana = zone ===
  'Stack' || zone === 'Battlefield'`), so a Hand or Graveyard card's sheet
  in the mockup has no box. Should the look pass copy the mockup's field
  styling but show the box on every zone's card, as your edit says?" Until
  answered, this slice follows REQ-210 as already accepted (the box shows
  on every zone's card, per slice E) and applies the mockup's field styling
  to that box on every zone, rather than restricting it to Stack and
  Battlefield.
- "Carried cards and the Draft (REQ-206, your edit: the Draft starts at the
  first attached card, and carried cards survive a reload, placed or not).
  The mockup's carry note says the cards 'came along with your question',
  and its placing sheet offers 'Leave this card out'. Neither shows
  anything that contradicts saving them. No look conflict found. The
  build's placing sheet already survives a reload by design. Nothing to
  decide here unless you want a visible 'saved' cue the mockup does not
  have." No action taken on this item beyond the carry note's styling
  (requirement 7); no visible "saved" cue is added absent an owner request
  for one.

## Acceptance criteria

- [ ] N1. `npm run quality:check` passes.
- [ ] N2. `npm --workspace apps/frontend run test` passes.
- [ ] N3. Every step (Game, Zones, Cards, Context, Review) renders as one
      `.plate`-shaped panel with a lit `.plate-next` foot bar replacing the
      old free-standing Back/Continue buttons, in `ZoneCollectionStep.tsx`
      and `EnrichmentStep.tsx`.
- [ ] N4. The stations rail shows a ‹ back button and "In-depth details"
      `h1` above it, and sentence-case node labels, in
      `ZoneCollectionStep.tsx`.
- [ ] N5. The Cards step's shelf cards show ✕/ⓘ corner widgets (no
      under-card "Card actions" button) and open the existing card menu on
      tap, in `ZoneCardPicker.tsx`.
- [ ] N6. The Mana spent field appears on every zone's card context sheet
      (REQ-210, per the owner question above), styled per the mockup's
      field treatment, in `EnrichmentStep.tsx`.
- [ ] N7. The Context step renders the full `.ctx-*` grid (art, head row
      with counter, Cast by/Mana spent pair, Targets pills with thumbnail,
      dashed Add-a-note/More-details rows) and the Review step renders one
      collapsible plate with the capped-height scrolling list and zone
      filter pills, in `EnrichmentStep.tsx`.
- [ ] N8 (manual). Side-by-side pairs saved under
      `docs/design/ui-reimagining/build-screenshots/n/`, build next to
      mockup, Blue, at 390×844 and 1440×900, one pair per state: Game,
      Zones, Cards, Placing, Context, Review, Ruling
      (`in-depth-{game,zones,cards,place,context,review,ruling}-{build,mockup}-{390x844,1440x900}.png`)
      — 28 files, matching LOOK-GAPS.md's In-depth details pairs list.
- [ ] N9 (manual). Each pair in N8 was compared side by side against the
      build at the matching state; every `### Differences` bullet under
      LOOK-GAPS.md's `## In-depth details` is closed, or is one of the two
      owner questions above (never resolved past the stated interim
      reading).
- [ ] N10 (manual). Browser scenario at 390×844 and 1440×900: step through
      Game → Zones → Cards (reorder the Stack, open a card's menu) → place
      a carried card → Context (set Targets and Mana spent on a Hand card)
      → Review (collapse the list, filter by zone) → submit, confirming
      each plate's foot bar advances correctly and the ruling view matches
      slice M's bubble styling.
- [ ] N11 (manual). Cleanup evidence recorded: browser closed, owned dev
      server(s) stopped, ports released, disposable captures under
      `PRD/work/ui-reimagining-build/.playwright-mcp/` named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
