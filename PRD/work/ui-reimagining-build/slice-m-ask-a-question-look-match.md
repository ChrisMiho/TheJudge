# Slice M — Ask a Question takes the look

## Status: done

## Goal

Ask a Question becomes three things, not four: the card stage, the pill
composer, and search (opened from ＋ Add card inside the composer, not a
permanent panel). The stage shows one lit front card with dimmed neighbours
either side; the composer is one split mic/send pill; the ruling view opens
with your question as a bubble, the judge's reply in a sealed bubble, and a
card-thumbnail strip above both.

Behaviour does not change in this slice. Slice C already built the door,
stage, composer and ruling view; this slice restyles what C built to match
the mockup pixel values below, inside the frame slice L just landed.

## Dependencies

Slice L (frame, shared sheets — the header, Menu, and search/sheet chrome
this screen sits inside) and slice C (door, stage, composer, ruling view —
restyled here, both `done`).

## Mockup source

`docs/design/ui-reimagining/direction-1/quick-question.html`, with
`flow.css`.

## LOOK-GAPS.md section closed

`## Ask a Question` (`PRD/work/ui-reimagining-build/LOOK-GAPS.md:71-117`).

## Requirements

No new `GATE-QUESTIONS.md` id — presentation only, built on slice C's
accepted behaviour (REQ-167, REQ-025, REQ-206, REQ-029, REQ-075, REQ-132,
REQ-012, REQ-121, FLOW-005, FLOW-011).

1. Collapse to three things: the stage, the composer (search opens from its
   ＋ Add card chip), and the ruling view. Remove the permanent "Search to
   add another card" panel and the "General rules topics" disclosure's
   placement relative to them stays as today (A6 in `DESIGN-BRIEF.md`: the
   disclosure itself is kept, only the permanent search panel goes).
2. Page title becomes an `h1` "Ask a Question" (`quick-question.html`'s
   plain heading, not the old gradient eyebrow): 18.4px/700 (21.6px
   desktop), `#e2e8f0`, -0.015em.
3. Stage: `flow.css:52-61` `.stage` (359×341px phone, 576×459 desktop,
   `--surface-panel` fill, accent-tinted edge, 17.6px radius, drop shadow).
   Front card and ring: `flow.css:66-99` `.ring` (`--card-w: 196px`,
   `--step: 100px`; 280px/160px at ≥720px; neighbour transform/opacity/blur
   formula; front-card accent glow `0 0 28px -10px` accent 45%).
4. Card widget and arrows: `flow.css:118-146` `.card-widget`, `.arrow` (40px
   round buttons, not bare ‹ ›).
5. Position indicator becomes the dots pill: `flow.css:150-155` `.dots`
   (`● ○ ○ ○ ○ 1 / 5` style, centred under the card) — see the owner
   question below on what the dots and the number mean once REQ-167's
   10-card cap applies.
6. ＋ Add card / ▣ Scan become `.icon-chip` (`flow.css:26-46`, 106×44px,
   glyph in accent-soft, panel fill, 9.6px radius) sitting in the composer's
   head row, not full-width grey buttons.
7. Search, opened from ＋ Add card, becomes `flow.css:169-182` `.search-pop`
   (opens inside the composer, ⌕ glyph field, thumbnail/name/type result
   rows) — see the owner question below on the 3-character minimum.
8. Composer becomes `flow.css:187-216` `.composer`/`.q-box` (25.6px radius,
   `--surface-edge` border, content-sized height) with the split send pill:
   `flow.css:224-235` `.send-pair`, `flow.css:250-255` `.send-wrap`/
   `.send-ring` (one 80×40 pill, mic | ➤, the 300-character budget ring
   drawn round it) replacing the two separate circles.
9. In-depth button becomes the "◈ In-depth" pill (`flow.css:263-270`
   `.q-box .deep`).
10. Ruling view: `flow.css:345-353` `.chat`, `.chat-head`, `.chat-cards`,
    `.thread` (a CARDS thumbnail strip of five 32×45 thumbnails above the
    thread) and `flow.css:355-374` `.msg.you`/`.msg.judge`/`.seal`/`.who`/
    `.ref` (your question as a right-aligned accent bubble, the judge's
    reply in a bordered bubble with the colour's seal and a "THEJUDGE"
    label; card names in the reply as lit chips). The follow-up box reuses
    the same split send pill as the composer (requirement 8), replacing the
    "0/300" count plus separate mic/send circles.
11. Start Over: keep today's "✎ Edit cards" affordance; it gains the round
    ↺ icon shown in the mockup's ruling-view head row, replacing the
    separate "Start Over" text button under the follow-up box. The "VIEW
    CONTEXT · 5 cards" panel the build shows on this screen is retired here
    (it belongs on In-depth details only, per the mockup and slice C's own
    `A` dependency notes) in favour of the CARDS thumbnail strip.

## Files touched

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` (+
  `.test.tsx`) — three-thing layout, search moved behind ＋ Add card, "VIEW
  CONTEXT" panel retired in favour of the CARDS strip.
- `apps/frontend/src/components/CardStage.tsx` (+ `.test.tsx`) — stage
  sizing, ring geometry, dots indicator, 40px arrows.
- `apps/frontend/src/components/ComposerPill.tsx` (+ `.test.tsx`) — composer
  shell sizing, icon-chip Add/Scan, search-pop, split send pill, deep pill.
- `apps/frontend/src/components/ConversationThread.tsx` (+ `.test.tsx`) —
  chat head, cards strip, message bubbles, seal, card-name chips.
- `apps/frontend/src/components/CardSelectionPreview.tsx` — restyled where
  it composes the stage/search result rows.

## Tests

- `QuickLookupApp.test.tsx`, `CardStage.test.tsx`, `ComposerPill.test.tsx`,
  `ConversationThread.test.tsx` — updated for the new markup/classes; the
  3-character search minimum and the 5-of-10 count semantics stay whatever
  this slice decides per the owner questions below, asserted explicitly so
  a reviewer can see which reading shipped.

## Owner questions — the build follows the accepted requirement until answered

Carried verbatim from LOOK-GAPS.md's `## Ask a Question`
`### Conflicts with accepted requirements`:

- "The count shown on the stage. The build shows '5 / 10', meaning how many
  of the 10 allowed cards are attached (REQ-167 raised the limit from 5 to
  10). The mockup's stage shows '1 / 5', meaning which card you are looking
  at, and keeps '5 of 10 attached' in a thumbnail strip that is hidden by
  default. Should the look pass replace the build's count pill with the
  mockup's position dots, or keep the 10-card count on the stage?" Until
  answered, this slice keeps the build's "N / 10" attached-count meaning
  (REQ-167) and applies the mockup's dots-pill *styling* to that count,
  rather than switching to a position-within-stage meaning.
- "Searching before typing. The mockup's Add card opens a ready list of
  cards with nothing typed. The build, like today's app, waits for 3 typed
  characters ('Type at least 3 characters'). Should the search keep the
  3-character minimum, with the mockup's look applied to the list it
  produces?" Until answered, this slice keeps the 3-character minimum and
  applies the mockup's `.search-pop` styling to the list once 3 characters
  are typed.

## Acceptance criteria

- [x] M1. `npm run quality:check` passes.
- [x] M2. `npm --workspace apps/frontend run test` passes.
- [x] M3. The page shows exactly three things — stage, composer, ruling
      view — with no permanent search panel, in `QuickLookupApp.tsx`.
- [x] M4. The stage matches `flow.css:52-99` sizing and the front-card glow,
      with 40px round arrows, in `CardStage.tsx`.
- [x] M5. The composer is one `.q-box` shell with an icon-chip Add/Scan row
      and a split mic/send pill with the budget ring, in `ComposerPill.tsx`.
- [x] M6. The ruling view shows a CARDS thumbnail strip, a right-aligned
      question bubble, and a sealed judge bubble with card-name chips, in
      `ConversationThread.tsx`.
- [x] M7. The "VIEW CONTEXT · N cards" panel does not render on Ask a
      Question (retired per requirement 11), in `QuickLookupApp.tsx`.
- [x] M8 (manual). Side-by-side pairs saved under
      `docs/design/ui-reimagining/build-screenshots/m/`, build next to
      mockup, Blue, at 390×844 and 1440×900: empty question with five cards
      attached (`ask-question-build-*.png`, `ask-question-mockup-*.png`),
      Add card search open (`ask-question-search-build-*.png`,
      `ask-question-search-mockup-*.png`), answered
      (`ask-question-answered-build-*.png`,
      `ask-question-answered-mockup-*.png`) — 12 files, one pair per state
      named in LOOK-GAPS.md's Ask a Question pairs list.
- [x] M9 (manual). Each pair in M8 was compared side by side against the
      build at the matching state; every `### Differences` bullet under
      LOOK-GAPS.md's `## Ask a Question` is closed, or is one of the two
      owner questions above (never resolved past the stated interim
      reading).
- [x] M10 (manual). Browser scenario at 390×844 and 1440×900: attach five
      cards, confirm the front card and dimmed neighbours render per
      requirement 3; tap ＋ Add card, type 3 characters, confirm
      `.search-pop` opens inside the composer; submit a question and
      confirm the ruling view's CARDS strip and bubbles render per
      requirement 10.
- [x] M11 (manual). Cleanup evidence recorded: browser closed, owned dev
      server(s) stopped, ports released, disposable captures under
      `PRD/work/ui-reimagining-build/.playwright-mcp/` named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
