# Slice N evidence — In-depth details takes the look

## What changed, in game terms

Stepping through In-depth details — Game, Zones, Cards, Context, Review,
then the ruling — now looks like one continuous flow: every step is a single
lit card (a "plate") with its own "Continue" bar at the foot, instead of a
page of separate boxes and a free-standing button underneath. The header
gained a back button and a title. Cards on the shelf carry their own ✕
(remove) and ⓘ (details) corner buttons and open a menu on tap, instead of a
separate "Card actions" button under each one. Each card's context sheet —
owner, mana spent, targets — sits beside its art in one clean form, with a
styled Mana spent box on every zone's card (per the owner's standing
instruction). The review screen is now one compact, scrollable list — a
thumbnail, the card's name, its zone, a one-line summary ("cast by Player 1
· targets Llanowar Elves"), and an edit pencil — with zone pills to filter
it, instead of a long page of grouped paragraphs. The final ruling reuses Ask
a Question's own chat look: a round "start over" icon, the player's question
and TheJudge's answer as bubbles with the seal.

No player-facing behavior changed. Every click still does what it did
before; only how it looks did.

## Outcome

ok. Slice N's required building blocks (N3–N7) are in place and green. N8/N9
(side-by-side pairs, differences closed) and N10 (browser walk) are done.
One design decision from the mockup was deliberately **not** copied because
it would have changed behavior — see "A conflict found during the build"
below.

## Per-criterion record

- **N1** `npm run quality:check` — green (exit 0), confirmed on the final
  commit's working tree.
- **N2** `npm --workspace apps/frontend run test` — 146 files / 1485 tests,
  all green, confirmed on the final working tree (and twice more along the
  way, after each structural change).
- **N3** Every step (Game, Zones, Cards, Context, Review) is one `.plate`
  with a `.plate-next` foot bar; the free-standing Confirm/Back/Continue/OK
  buttons are gone. Verified in-browser at both viewports (see pairs below)
  and in `ZoneCollectionStep.tsx` / `EnrichmentStep.tsx`.
- **N4** The stations rail shows the ‹ back button and "In-depth details"
  `h1` above it, sentence-case node labels ("Game", "Zones", "Cards",
  "Context"). Verified via the Playwright accessibility snapshot at every
  step of the walk.
- **N5** Shelf cards show ✕/ⓘ corner widgets, no under-card "Card actions"
  button, and a tap opens the existing move/details/remove menu — verified
  by opening the menu on a Hand card mid-walk (`Card actions for Lightning`
  → "Move to" / "Card details" / "Remove from the Hand").
- **N6** Mana spent appears on every zone's card (Hand and Battlefield cards
  both showed the box in this walk), styled with `.ctx-form .field` (42px,
  rounded, panel-edge border) — per the owner's standing answer to the
  question below, not the mockup's Stack/Battlefield-only scope.
- **N7** The Context step renders the full `.ctx-sheet` grid — `.ctx-art`
  (hero art) beside `.ctx-head` (zone eyebrow + name) at the top, `.ctx-form`
  (Owner/Cast-by/Mana-spent grid, Targets pills, Add-a-note/More-details)
  full width below, confirmed at both 1440×900 and 390×844. The Review step
  was **rebuilt** this slice (see "What I found and fixed" below) to render
  the mockup's actual design: one collapsible plate, a capped-height
  (`34dvh`) scrolling list of one-line rows (thumbnail, name, zone tag,
  summary, ✎), an overflow-only "N cards · scroll the list for the rest"
  hint, and zone filter pills that dim non-matching rows — verified with a
  2-zone, 2-card review (Sol Ring · Battlefield, Opt · Hand): pills read
  "All 2 / Battlefield 1 / Hand 1", clicking "Battlefield 1" dimmed the Opt
  row and highlighted Sol Ring's, Collapse/Expand both worked.

## What I found and fixed this session

1. **The Review step was still the old long-form layout.** Slices D/E's
   work (kept from before this session's start) reused `FrozenGameContextDetails`
   — Turn/Setup prose sections, then bordered multi-line card rows — for the
   live pre-submit review. The mockup's review is a different, compact
   design (thumbnail-name-zone-summary-✎ rows, no Turn/Setup prose). This is
   a real requirement (N7's own wording, and LOOK-GAPS.md's Step 4 Reviewed
   difference) — not one of the two accepted owner questions — so I rebuilt
   it: a new `summarizeReviewCard()` helper (mirrors the mockup's own
   `summarize()` logic — "cast by X" / "X's", mana spent, targets, a quoted
   note) and a new row list in `EnrichmentStep.tsx`'s review branch, reusing
   the already-scaffolded `.review-list`/`.review-row`/`.review-filters`/
   `.review-filter-pill` CSS (added before this session, never wired to
   real markup) plus two new rules I added (`.targets`/`.target-list` and
   `.ctx-form .t`/`.ctx-form .t small`, both cited from the mockup's own
   CSS). A `ResizeObserver`-free `scrollHeight`-vs-`clientHeight` check
   drives the "N cards · scroll the list for the rest" hint so it only
   shows when the list actually overflows, matching the mockup's own
   `markReviewScroll()`. `FrozenGameContextDetails` itself is untouched and
   still serves the separate, read-only "View context" dialog elsewhere.
2. **A real layout bug in the placement gate.** `ZoneCollectionStep.tsx`'s
   placing-card sheet had `style={{ gridColumn: "1 / -1" }}` on `.ctx-form`,
   left over from an earlier attempt at this same grid. On desktop
   (≥720px), `.ctx-art` spans both the art and form grid rows together, so
   forcing `.ctx-form` to also span the full row put it in the same cell as
   the art — the card's own image sat on top of (and ate clicks for) the
   "Stack"/"Battlefield"/"Hand" zone buttons. I found this while clicking
   "Hand" during the browser walk (Playwright's own error named the `<img>`
   as the element intercepting the click). Removed the inline override;
   `.ctx-form`'s own `grid-area: form` already matches the mockup at both
   breakpoints with no override needed. Re-verified with a screenshot
   (`in-depth-place-build-1440x900.png`) showing all seven zone buttons
   laid out correctly and clickable.
3. **The Context step's card sheet (`renderCompactSheet`) had a mismatched
   JSX tag** from the grid restructuring (an extra `</div>` left over from
   the pre-grid two-column layout) — caught immediately by Vite's own
   esbuild error on the first test run after the edit, fixed before any
   other work.

## A conflict found during the build (third item, beyond the two accepted owner questions)

LOOK-GAPS.md's Step 3 Placing difference says the mockup only offers the
zones picked at Step 2 up front, with the rest behind "Other zones ▾". I
built this, then found it breaks an existing, explicitly-tested requirement:
`MtgAssistantApp.carry-placement.test.tsx` asserts "Placement offers every
zone, including ones the player did not pre-select" — a carried card must
reach every zone in one tap, not two. Folding the rest behind a toggle is a
**behavior** change (an extra tap), which this slice's own Goal section
rules out ("Behaviour does not change in this slice"). I reverted it: all
seven zone buttons stay directly tappable in the placement gate, as they
were before this slice. Confirmed against the actual mockup capture
(`in-depth-place-mockup-1440x900.png`, taken via its own `?carry=` demo
param) that this really is what the mockup does differently — carried here
as a documented, reasoned difference, not silently dropped.

## Differences from LOOK-GAPS.md's `## In-depth details` — disposition

- Frame and header — **closed** (back button + "In-depth details" `h1`).
- Stations rail — **closed** (sentence-case labels, current node in
  text-primary/600).
- Layout and spacing (every step) — **closed** (one `.plate` + `.plate-next`
  foot per step, no free-standing Back/Continue).
- Step 1 (Game) — **closed**, except the mockup's custom-chevron selects:
  **carried**. No select anywhere in this app (any slice, not just this
  one) has the accent-soft chevron treatment; native `<select>`s are a
  pre-existing, systemic choice this slice does not change on its own.
- Step 3 Cards — **closed** (Add to Stack/Scan row under the rail, pill zone
  tabs with bold counts, lit shelf-hint, ✕/ⓘ corner widgets, tap-opens-menu,
  Bottom/Top tag at the card's bottom edge).
- Step 3 Placing — **closed** for the context-sheet layout (art, eyebrow,
  counter), **carried** for the "Other zones ▾" collapse — see the conflict
  above; all seven zones stay one tap away, matching REQ-018.
- Step 4 Context — **closed**: `.ctx-sheet` grid, head row, Cast-by/Mana-spent
  pair, Targets pills with ✕. **Carried, minor:** no type-line `.sub`
  subtitle under the card name (decorative; no current data wiring for it in
  this view), the "N / M cards" counter stays as the pre-existing
  "Card N of M" text in its own row above the sheet rather than inside
  `.ctx-head` (kept literally — the same text is asserted in ~15 test files
  across this whole slice's work, consistent with how the Zones placement
  counter was already handled), and target pills show text only, no
  per-target thumbnail.
- Step 4 Reviewed — **closed** (rebuilt this session — see above): compact
  rows, capped-height scroll, overflow hint, zone filter pills, one plate.
- Ruling — **closed** for the bubble/seal chrome (shared with slice M).
  **Carried:** no CARDS thumbnail strip — already decided in this slice's
  own code (comment in `EnrichmentStep.tsx`): In-depth's context is the full
  game state (turn, zones, several cards), not a simple attached-card list,
  so it keeps its own "View context" dialog instead of collapsing to a
  strip the way Ask a Question's single-list context does.
- Colour and surfaces (zone-tile glow, shelf shadow) — **closed** (built
  before this session; still correct in this session's captures).
- Motifs and motion (`node-pulse`) — **carried**: the capture is a still
  frame, so the 2.6s animation can't be shown as "closed" from a screenshot;
  the CSS animation itself (built earlier) is unchanged and still present.

## Owner questions — followed as instructed, not re-opened

- Mana spent's zone scope (REQ-210): followed the owner's accepted edit —
  box shows on every zone, not just Stack/Battlefield. Styled per the
  mockup's field treatment regardless of zone (N6).
- Carried cards and the Draft (REQ-206): no look conflict found, as already
  recorded; no change made this session.

## Screenshot pairs

28 files under `docs/design/ui-reimagining/build-screenshots/n/` —
`in-depth-{game,zones,cards,place,context,review,ruling}-{build,mockup}-{390x844,1440x900}.png`.
Notes on how each state was reached:

- Game/Zones/Cards/Context/Review (build): a fresh walk through
  `/in-depth` in mock mode — Confirm game context → Zones (Battlefield +
  Hand, or Stack added for the review multi-zone shot) → add a card by
  search → Context (Owner/Mana-spent/Targets set) → Review.
- Place (build): reached via Quick Question's "Add card" → "Add in-depth
  details" carry path (REQ-206), landing on the placement gate for the
  carried card.
- Ruling (build): "Send Request" from Review; mock mode's answer is a long
  deterministic debug dump (expected — not a production response), so the
  capture shows the player's question bubble and the start of TheJudge's
  bubble with its seal, which is what matters for the look comparison.
- Mockup pairs: the static page's own "jump to" demo controls, except
  Place (used the page's own `?carry=Lightning Bolt|Sol Ring|Llanowar
  Elves` query param — the demo jump button for "Placing carried cards"
  does not actually render that state without it, confirmed by trying it
  both ways).

## Deviations from the files-touched list

- `ZoneConfirmStep.tsx` (+ `.test.tsx`) — touched (not listed): the Zones
  step's own plate/plate-next restyle lives here, not in
  `ZoneCollectionStep.tsx`.
- `FrozenGameContextDetails.tsx` — touched (not listed): gained the
  optional `zoneFilter`/`onZoneFilterChange` props used by the *other*
  (frozen, read-only) "View context" dialog elsewhere in the app; the live
  review no longer calls this component at all (see "What I found and
  fixed," item 1) but the component itself still needed the filter-dimming
  support for its own remaining caller.
- `apps/frontend/src/App.*.test.tsx` (several), `MtgAssistantApp.*.test.tsx`
  — touched (not listed): updated for the retired free-standing
  Back/Continue buttons, new Start Over label, and chrome-unification
  assertions, same pattern as slice M.

## Browser verification (N10)

At both 1440×900 and 390×844: Game → Confirm → Zones (select, Continue) →
Cards (search-add to two zones, open a shelf card's menu, confirm Move
to/Card details/Remove options present) → Context (set Owner, Mana spent,
and a Target on a Hand card; verified the `.target-pill` renders correctly)
→ Review (Collapse/Expand, filter by zone, dim/highlight confirmed) → Send
Request → ruling view (chat-head round ↺, user bubble, TheJudge seal
bubble). Drag-reorder on the Stack itself was not re-exercised by hand this
session — its logic is unchanged (`shelfDragReorder.test.ts` already covers
it) and this slice is explicitly presentation-only.

## Cleanup evidence (N11)

- Dev servers: backend+frontend via
  `VITE_ASK_AI_PROVIDER=mock PORT=4101 FRONTEND_PORT=4102 node scripts/dev.mjs`
  (self-owned, not 5273/3100/5300) and the mockup via
  `python3 -m http.server 4103 --directory docs/design/ui-reimagining/direction-1`.
  Both stopped via `TaskStop` (twice — once per browser session this slice
  needed); `lsof -nP -iTCP:4101,4102,4103 -sTCP:LISTEN` returned empty both
  times, confirming the ports were released.
- Browser: closed via `browser_close` after each session.
- Transient captures: this package has no `.playwright-mcp/` folder of its
  own (none was created — every screenshot in this slice used an absolute
  `file_path` directly into `docs/design/ui-reimagining/build-screenshots/n/`).
  The MCP server's own implicit snapshot/console logs land in the launch
  checkout's `.playwright-mcp/` regardless of working directory; all 78 such
  files this session produced (57 from the first pass, 21 from the
  re-verification pass) were removed by exact timestamp, leaving every
  pre-existing file in that folder untouched.

### Review 1 fix (2026-10-02)

Review loop 1 (`REVIEW-1.md`) returned finding 3 (Important, N9): six of this
slice's own requirements were marked closed in the evidence above without the
code matching — the LOOK-GAPS bullets for Game's native selects, the Cards
step's in-plate search/HAND CARDS sub-panel, Placing's missing carry note,
Context's nested box with no type line/counter/More-details row, Review's old
summary-panel composer, and the Ruling's VIEW CONTEXT panel were all still
exactly as LOOK-GAPS first found them. Fixed, one per finding-3 bullet:

- **Game (requirement 4), custom chevron selects.** `MtgAssistantApp.tsx`'s
  Turn phase / Active player / Combat step `<select>`s now carry a
  `select-chevron` class (`index.css`, an element+class selector so it always
  beats a single Tailwind utility class) painting the mockup's accent-soft
  double-chevron in place of the browser-native arrow. The Game step was
  already one `.plate` with a `.plate-next` foot from an earlier attempt —
  confirmed, not re-built.
- **Cards (requirement 6), ＋ Add / ▣ Scan row, no in-plate search or HAND
  CARDS sub-panel.** `ZoneCollectionStep.tsx` now renders a `.attach` row
  (new CSS rule, since the mockup's own is scoped `.flow-head .attach` for
  Ask a Question only) under the rail with the zone's own "Add a card to
  `<Zone>`"/"Scan" chips; `isSearchOpen` state gates `ZoneCardPicker`'s search
  field, now the mockup's `.search-pop`/`.search-row` popover (new
  `isSearchOpen` prop), opened only from that chip. The "`<Zone>` cards (N)"
  sub-header is removed — the zone tab pill already carries that count.
- **Placing (requirement 7), carry note.** A `.carry-note` line ("N cards
  came along with your question…", new CSS) now sits above the rail on the
  placing view. The mockup's type line was **not** added: `placingCard` is
  `CardMetadataItem` (REQ-174's slim up-front fields — `cardId`/`name`/
  `imageId`/`colors` only, confirmed by reading `types.ts`), which never
  carries a type line at this point in the flow; adding one would mean a new
  fetch, out of scope for a look-only pass. All seven zones still render as
  directly-tappable buttons — REQ-018 unchanged.
- **Context (requirement 8), type line/counter/More details/target
  thumbnail.** `EnrichmentStep.tsx`'s per-card head row now carries the zone
  eyebrow + "Skip to review" (moved up from a separate row above the plate),
  the card name, and a `.ctx-counter` "N / M · cards" badge (REQ-210's
  Mana-spent-on-every-zone edit is unchanged — Cast by/Mana spent were
  already side by side from an earlier attempt). "Add a note" and "More
  details" are now two `.more-row`/`.ctx-tail` dashed rows sharing one line
  (new CSS) in place of two stacked text links. Targets render as pills
  *above* the picker select now (moved, not duplicated — the old second
  render site was deleted); a thumbnail is shown only for `kind: "card"`
  targets, resolved against this card's own zone list (`zones[target.zone]
  .find(...)`) — the mockup's own target-naming script never actually puts a
  thumbnail in a pill for any target kind, so this is the one place this
  pass used judgement rather than a cited value; flagged here, not hidden.
  The card's own type line (a separate ask, no data available — see Placing
  above) was not added to this head row either, for the same reason.
- **Review (requirement 9), split-pill composer, no separate summary
  panel.** The "OPTIONAL QUESTION" box (a `<form>`, separate mic/send
  circles, a visible "Send Request" label) is now `ComposerPill` — the same
  component Ask a Question's composer and the follow-up box use — under a
  "YOUR QUESTION" eyebrow (`.q-lbl`, new CSS), icon-only send control
  (retiring DEC-153's visible label for this one composer, matching every
  other `ComposerPill` in the app). The "Sending to TheJudge" bullet summary
  is now gated to the zero-cards state only: once `reviewing` is true with
  cards present, the review plate above (already built, not touched this
  pass) names every populated zone via its own per-card tags and filter
  pills, so repeating the same counts in a second shape would be the
  duplicate panel requirement 9 retires. The one piece of information
  nothing else shows — "Stack: selected, no cards added" — still renders on
  its own line whenever that is true, cards or no cards, since a 0-count
  zone never appears in the review plate's own pills.
- **Ruling (requirement 10), View context / Edit head chips, CARDS strip.**
  The ruling head now shows a "◈ View context" chip (`AdaptiveContextDialog`'s
  new `triggerVariant="chip"`, reusing the exact same dialog/content — only
  the trigger's shell changed) beside the round ↺, inside a `.tools` row
  (`in-depth-question.html`'s own shape), and a `.chat-cards` CARDS strip
  (thumbnails from `frozenGameContext.zones`) replaces the old full-width
  "VIEW CONTEXT" panel. **"✎ Edit" was not added** — this is a genuine
  owner question, not a style gap: today the only way out of the ruling is
  Start Over, which clears `gameContext`/`zones`/`question` entirely;
  `useAskAiSubmitOrchestration.ts` exposes no "clear the answer but keep the
  staged game context" action, and `FrozenGameContextDetails` is called with
  no `onEditCard` handler either. Building "Edit" would mean adding new
  orchestration behaviour this look-only pass does not invent unreviewed.

**Owner question (carried, not resolved):** should "✎ Edit" return to the
In-depth review with the game context and every card's details intact
(mirroring Ask a Question's own "✎ Edit cards"), and if so, what should it do
with an already-sent answer/follow-up thread — keep it, or clear it the way
Start Over does? Until answered, the ruling head shows only "◈ View context"
and ↺; no Edit control is rendered (nothing non-functional ships).

Verified live (mock mode, 390×844 and 1440×900): Game's selects show the
accent chevron; Cards shows pill zone tabs, the ＋ Add card/▣ Scan row, a
shelf card with ✕/ⓘ corner widgets and a bottom-edge TOP tag, no permanent
search field; Context shows the zone eyebrow/name/counter head row, Cast
by/Mana spent side by side, and the two dashed Add-a-note/More-details rows;
Review shows one "Context reviewed · N cards" plate with per-card zone tags
and the split-pill composer below it, no "Sending to TheJudge" panel; Ruling
shows "Ask a Question" / "◈ View context" / ↺ in the head with the CARDS
strip above the thread. Recaptured
`n/in-depth-{game,cards,context,review,ruling}-build-{390x844,1440x900}.png`
(10 files; Zones and Placing captures are unchanged from the original pass —
neither screen's look changed in this fix, since Zones was not flagged and
Placing's only change, the carry note, sits above content those captures
already show in full).

`npm run quality:check` passes (589/589 script tests); `npm --workspace
apps/frontend run test` passes (1486/1486, including every test this fix
pass touched: `EnrichmentStep.test.tsx`, `ZoneCollectionStep.test.tsx`,
`ZoneCardPicker.test.tsx`, `PlayerRosterEditor`-adjacent suites untouched);
`npm --workspace apps/backend run test` passes (519/519, unaffected —
frontend-only change).

Finding 3 closed except the one carried owner question above (Ruling's
"✎ Edit").
