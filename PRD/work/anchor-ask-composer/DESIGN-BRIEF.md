# Design brief — anchor-ask-composer

## What the player gets

Type a long question on the Ask screen and the cards stay on screen, the send
button stays put, and the box grows **upward in place** instead of the whole
page sliding so the cards leave the screen and the send button drops below the
fold. The In-depth chip and the mic|send pill stay on a stable bottom row the
whole time. On a phone the box floats above the on-screen keyboard rather than
hiding behind it. Same on both Ask screens — Quick lookup (**Ask a Question**)
and In-depth details — on desktop and mobile.

## Scope

The whole Ask screen becomes a screen-height (`100dvh`) frame with no page
scroll. The header, mock banner, title/actions row and flow head take their
natural height; the **card stage (Ask a Question) or the per-card context list
(In-depth)** flexes in the middle and shrinks/region-scrolls; the **question
box pins at the bottom** as the anchor. Typed text grows the box upward to a cap,
then the text area scrolls inside itself — the box never pushes the page.

In scope:

- Put both Ask screens in the existing no-page-scroll frame — the `page-shell-fit`
  outer shell with the `narrow-fit` content child (`PageShell` variant
  `narrow-fit` → `page-content page-content-narrow page-content-narrow-fit`), the
  36rem/92vw fit sibling of the `wide-fit` child Trade Balancer ships. Same
  pattern, not a new one; the Ask column width is unchanged (stays `narrow`,
  36rem / 92vw). On In-depth the frame is applied only at the Enrichment station
  (station 4 / Context), not the earlier staged steps.
- Composer pinned at the bottom; stage/context region flexes and region-scrolls.
- Box grows upward in place to a cap, then scrolls internally; the chip + mic|send
  pill stay on a stable bottom row; the page never scrolls from box growth.
- Composer stays above the on-screen mobile keyboard (`dvh` + `visualViewport`).
- Keep working: the phone search-fold (stage folds to a strip while searching),
  the card-detail popup, and the answered-view follow-up composer.

Out of scope (non-goals, from the idea):

- No change to the `ComposerPill` structure, the card stage, or either request
  mode / prompt / route.
- No new fit pattern invented — reuse `page-shell-fit`, do not re-add
  `overflow: hidden` on the inner column at 1440px (the Trade Balancer review's
  clipping gotcha).
- No backend or mock-default change — frontend layout only.

## Design direction (chosen)

Both Ask surfaces become a `100dvh` flex-column frame reusing the existing
`page-shell-fit` shell with the `narrow-fit` content child (the 36rem/92vw fit
variant already in `PageShell.tsx` — the column width does not change from today's
`narrow`). `PageShell`'s `variant` prop is set per page/step, so the frame turns on
only where the Ask composer lives: the Quick lookup page uses the `narrow-fit`
variant, and In-depth flips only the Enrichment station (station 4 / Context) from
`narrow` to `narrow-fit` while Game / Zones / Cards keep `narrow` and stay
content-sized vertically (DEC-145). Inside the frame:

- Header / mock banner / title+actions row / flow head: natural height.
- Card stage region (Ask a Question's `.qq`) or the per-card context list
  (In-depth's Enrichment surface): `flex: 1; min-height: 0`, shrinks and
  region-scrolls so it gives up room as the box grows.
- `ComposerPill` (shared by both surfaces via `flow.css` `.q-box`): natural
  height, pinned as the bottom anchor. Its grown two-row shape stays; with the
  page no longer scrolling, the grow now reads as the box expanding in place over
  a stable control row, not the question leaping over the UI. The text area caps,
  then scrolls internally (the existing `max-height` cap on the textarea).
- Mobile keyboard: the pinned composer resolves its height against the visual
  viewport so it floats above the on-screen keyboard when focused, not behind it.

The change is one shared layout move applied to the two page columns
(`QuickLookupApp.tsx`'s `.qq` section and `MtgAssistantApp.tsx`'s `.idq` /
Enrichment composer surface); the `ComposerPill` itself is untouched.

## PRD truth this proposes to change

Proposed in `GATE-QUESTIONS.md` (not written to `PRD/sections/` here — build
applies the approved proposal). Four stable IDs:

- **REQ-110** (amend) — the pre-submit composers now grow upward in place inside
  an anchored frame: pinned at the bottom, grow to a cap then scroll internally,
  controls on a stable bottom row, page never scrolls; both Ask a Question and
  In-depth Enrichment.
- **REQ-218** (new, reserved) — the anchored Ask-screen frame itself: both Ask
  screens are a `100dvh` no-page-scroll frame (reusing `page-shell-fit`) with the
  stage/context region flexing and region-scrolling and the composer pinned;
  composer stays above the on-screen keyboard; search-fold, card-detail popup,
  and the answered follow-up composer keep working. Carries the `screen-layout.md`
  Ask-a-Question-pre-submit and In-Depth-Enrichment row edits.
- **REQ-129** (amend) — the send-pill-in-first-viewport guarantee is now
  delivered structurally by the anchored frame (composer pinned + stage flexes),
  not only by bounding the attached-card region; the card-image ceiling is
  unchanged.
- **REQ-206** (amend) — the two-row question box wording reconciled to the
  don't-yank-the-text decision: pinned at the bottom of the frame, text grows
  upward above a stable control row in place, caps then scrolls internally, stays
  above the keyboard.

## Material assumptions (orchestrated mode — assumption ladder)

Recorded because the owner approval pause is replaced by the assumption ladder
(`PRD/instructions/preparation-contract.md`). Each surfaces at the `define` gate.

1. **Reuse `page-shell-fit`, don't invent a frame.** Ladder #3 (established local
   pattern): the intake names the Trade Balancer frame as the shipped
   no-page-scroll pattern and the idea's non-goals forbid a new one. The brief
   adopts it; `GATE-QUESTIONS.md` surfaces the anchored frame as REQ-218 for the
   owner.
2. **A new REQ (REQ-218) for the frame + keyboard, not only amendments.** Ladder
   #1 (no existing home): REQ-110 is composer *growth* and REQ-129 is card-image
   *size*; neither states "the whole Ask screen is a pinned `100dvh` frame" or
   "the composer stays above the keyboard." That behavior needs its own id. The
   amendments to REQ-110/129/206 reconcile their wording to it.
3. **In-depth parity lands on the Enrichment step (station 4 / Context), where
   the question composer lives** — the per-card context list is the flexing
   region and the composer pins beneath it. The earlier staged steps
   (Game / Zones / Cards) stay content-sized (DEC-145) and are not re-framed.
   Ladder #2 (tested behavior): the In-depth composer is the same `ComposerPill`
   on the Enrichment surface, so parity means re-framing that surface only.
4. **REQ-218 reserved, not REQ-217.** Ladder #4 (smallest reversible, avoid
   collision): a concurrent life-tracker run already proposes REQ-217, so this
   run reserves the next free id, REQ-218.
5. **Growth-cap value stays the shipped textarea cap.** Ladder #2 (tested
   behavior): the idea's non-goals keep the `ComposerPill` structure, so the cap
   is the existing textarea `max-height`, not a new product number. The box reads
   as expand-in-place; softening the 1→2-line reorder further is left to
   implementation within the no-yank intent, not re-decided here.

No genuine decision blocker: every uncertainty resolved from the ladder, and the
smaller option (amend-only) would silently decide the frame/keyboard behavior, so
the frame is surfaced as REQ-218 for the owner rather than assumed into an amend.

## Verify at build

Measure in the browser (code reading alone has produced wrong layout premises
here before): type a 300-char question in both Ask screens at 1440×716 and
390×740, confirm the document height never exceeds the viewport and the send
pill's `bottom` stays inside it; confirm the composer sits above the keyboard on
a focused phone viewport; confirm the phone search-fold, the card-detail popup,
and the answered follow-up composer still work after the frame change.

## References

- Idea: `IDEA.md`. Intake (evidence only): `intake/GRAPH-BRIEF.md`.
- Current truth amended: `PRD/sections/quick-lookup/README.md`,
  `PRD/sections/in-depth/README.md`, `PRD/sections/screen-layout.md`,
  `PRD/sections/functional-requirements.md` (REQ-110/129/206, new REQ-218),
  `PRD/sections/user-flows.md`.
