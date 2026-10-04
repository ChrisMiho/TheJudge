# Gate questions — anchor-ask-composer

Answer each block's `- Verdict:` with `accept`, `edit`, or `reject` (a `- Reason:`
is required for edit and reject). The diffs are the complete proposed change to
`PRD/sections/`; nothing here is written to `PRD/sections/` until build applies
your answers. New stable IDs are reserved and named here, not written live.

Four stable IDs: **REQ-218** (new — the anchored frame), **REQ-110** (amend —
composer grows in place), **REQ-129** (amend — send pill stays in view),
**REQ-206** (amend — two-row box wording). No blocker questions.

---

## REQ-218 — the whole Ask screen becomes a screen-height frame with the question box pinned at the bottom

**What this decides:** whether both Ask screens — Quick lookup (**Ask a
Question**) and In-depth details — sit in a fixed screen-height frame where the
cards fill a flexing middle that scrolls on their own and the question box is
pinned at the bottom, instead of today's page that gets taller as you type.

**In plain terms:** right now the Ask page can grow taller than the screen. Type
a long question and the browser scrolls down to follow your cursor, which shoves
the cards off the top of the screen and drops the send button below the bottom
edge. This makes the page a fixed screen-height box (`100dvh` — "100% of the
visible screen height"): the header, title and controls keep their natural size,
the **card area in the middle flexes and scrolls by itself** when it runs out of
room, and the **question box stays pinned at the bottom** as the anchor. On a
phone the box also floats above the on-screen keyboard instead of hiding behind
it. It reuses the same no-page-scroll frame the Trade Balancer screen already
ships (`page-shell-fit`), rather than inventing a new one — and the phone
search-fold (the cards folding to a strip while you search), the card-detail
popup, and the follow-up box on the answered screen all keep working. (new rule;
leans on REQ-110 composer growth, REQ-129 first-viewport fit, REQ-206 the
Ask-a-Question page composition, the no-page-scroll Fit rule in `screen-layout.md`,
and NFR-001 44px touch targets)

**What happens if you say no:** the fix is limited to taming the box's growth
with no frame rule behind it, the "cards slide off / send drops below the fold"
behavior can come back the next time the page can grow taller than the screen,
and there is no stated rule that the box stays above the mobile keyboard.

```diff
# PRD/sections/functional-requirements.md — insert after the REQ-216 entry

+### REQ-218
+- Title: Anchored Ask-screen frame with pinned question box
+- Priority: high
+- Description: Both Ask screens — Ask a Question (route `/quick-lookup`, the pre-submit view) and In-depth details' Enrichment surface (route `/in-depth`, station 4 / Context) — lay out inside a screen-height (`100dvh`) flex-column frame that never scrolls the page. Header, mock-mode banner, title/actions row, and flow head take their natural height; the **card stage (Ask a Question) or the per-card context list (In-depth Enrichment)** flexes in the middle and shrinks/region-scrolls; the **question box is pinned at the bottom** as the anchor. The frame reuses the existing shipped no-page-scroll pattern (`page-shell-fit` / `page-content-wide-fit`), not a new one. On a phone the pinned box stays above the on-screen keyboard.
+- Acceptance Criteria:
+  - both Ask screens render as a `100dvh` (or `100dvh`-equivalent) flex column: page/document scroll does not appear at 1440×716 or 390×740 even with a 300-character question typed
+  - the card stage (Ask a Question) / per-card context list (In-depth Enrichment) is the flexing region (`flex: 1; min-height: 0`) and gives up room by region-scrolling, rather than lengthening the page, when the box grows or the content is tall
+  - the question box (`ComposerPill`) is the pinned bottom anchor on both screens; its structure is unchanged (no new row, no moved control)
+  - on a focused phone viewport the pinned box sits above the on-screen keyboard (height resolved against the visual viewport), not hidden behind it
+  - the frame reuses the Trade Balancer `page-shell-fit` / `page-content-wide-fit` pattern; it does **not** re-add `overflow: hidden` on the inner content column at 1440px (the clipping that the Trade Balancer review bound against, because the column is narrower than the viewport)
+  - after the frame change these keep working on both screens: the phone search-fold (card stage folds to a strip while the search field is open), the suite card-detail popup, and the answered-view follow-up composer
+  - the earlier staged In-depth steps (Game, Zones, Cards) are unchanged — they stay content-sized vertically (DEC-145); only the Enrichment composer surface is re-framed
+- Constraints:
+  - frontend layout only; no change to `ComposerPill` structure, the card stage, either request mode, `AskAiRequest`, Zod schemas, prompt assembly, routes, or the mock default
+  - reuse the existing fit pattern; do not invent a parallel frame (idea non-goal)
+- Dependencies:
+  - REQ-110
+  - REQ-129
+  - REQ-206
+  - REQ-124
+  - NFR-001
+- Notes:
+  - reserved and proposed by the `anchor-ask-composer` package (2026-10-03). Root cause of the defect: the composer sits below the card stage in normal document flow inside a `<main>` flex column allowed to grow past the viewport (`overflow: visible`, no `100dvh` cap) and is `position: relative`, not pinned — so box growth lengthens the page and the browser auto-scrolls to the caret. The textarea already caps and scrolls internally; the fix is the page frame, not the textarea
+  - the two page columns are `QuickLookupApp.tsx`'s `.qq` section and `MtgAssistantApp.tsx`'s `.idq` / Enrichment composer surface; `ComposerPill` and `flow.css` `.q-box` are shared and untouched
```

```diff
# PRD/sections/screen-layout.md — Ask a Question — pre-submit row

-| Phone | Shell 100% width band; content-sized vertically (DEC-145). **Card stage** (only when a card is attached): the front card full size on a glass stage (REQ-207), the one other card peeking (two cards peek on one side only; three or more peek each side) — so the stage height does not grow with the card count; ✕ Remove / ⓘ Details straddle the front card's top corners; a row of position dots lights the front card's place. **Question box:** two rows (text on top; Add in-depth details chip bottom-left, mic|send pill bottom-right) |
-| Desktop/tablet | Shell 92%/48rem cap; content-sized vertically; the front card grows with the wider column; box growth must not force page scroll or clip chrome below the box (REQ-110 / DEC-146) |
-| Fit | No page scroll for the primary submit path: the send pill's `bottom` stays inside the first viewport at every attached-card count up to the cap. The stage replaces the stacked per-image list whose measured overflow this row previously bounded (history below); the per-image `25dvh` / `42dvh` cap retires with that list |
+| Phone | Shell 100% width band inside a `100dvh` anchored frame (REQ-218): header/title/actions take natural height, the card stage flexes in the middle and region-scrolls, the question box is pinned at the foot. **Card stage** (only when a card is attached): the front card full size on a glass stage (REQ-207), the one other card peeking (two cards peek on one side only; three or more peek each side) — so the stage height does not grow with the card count; ✕ Remove / ⓘ Details straddle the front card's top corners; a row of position dots lights the front card's place. **Question box:** two rows (text on top; Add in-depth details chip bottom-left, mic|send pill bottom-right), pinned at the foot and growing upward in place above the stable control row (REQ-206 / REQ-110), staying above the on-screen keyboard (REQ-218) |
+| Desktop/tablet | Shell 92%/48rem cap inside the same `100dvh` anchored frame (REQ-218); the front card grows with the wider column; box growth grows the box upward in place without forcing page scroll or clipping chrome below the box (REQ-110 / DEC-146) |
+| Fit | No page scroll: the screen is a `100dvh` frame (REQ-218) with the card stage as the flexing/region-scrolling region and the composer pinned, so the send pill's `bottom` stays inside the first viewport at every attached-card count up to the cap and at every typed length. The stage replaces the stacked per-image list whose measured overflow this row previously bounded (history below); the per-image `25dvh` / `42dvh` cap retires with that list |
```

```diff
# PRD/sections/screen-layout.md — In-Depth — Enrichment row, Fit cell

-| Fit | Composer growth must not force page scroll or clip chrome below the field (REQ-110); card image growth is bounded by the same no-page-scroll rule (REQ-129), with any needed cap recorded on this row |
+| Fit | The Enrichment surface is the In-depth end of the `100dvh` anchored frame (REQ-218): the per-card context list is the flexing/region-scrolling region and the question box is pinned at the foot, growing upward in place without forcing page scroll or clipping chrome below the field (REQ-110); card image growth is bounded by the same no-page-scroll rule (REQ-129), with any needed cap recorded on this row |
```

```diff
# PRD/sections/quick-lookup/README.md — Measured bounds, Layout/fit line

-- Layout/fit: mobile-first and touch-friendly; the pre-submit stack and the
-  answered workspace follow the shared shell width and region-scroll rules of
-  `screen-layout.md`'s "Quick Question — pre-submit" and "— answered workspace"
-  rows. (NFR-001, `screen-layout.md`)
+- Layout/fit: mobile-first and touch-friendly; the pre-submit view is a `100dvh`
+  anchored frame (REQ-218) — card stage flexing in the middle, the question box
+  pinned at the foot — and the answered workspace follow the shared shell width
+  and region-scroll rules of `screen-layout.md`'s "Quick Question — pre-submit"
+  and "— answered workspace" rows. (NFR-001, REQ-218, `screen-layout.md`)
```

```diff
# PRD/sections/in-depth/README.md — Measured bounds, Layout/fit line

-- Layout/fit: staged steps are content-sized vertically (no stretch to fill lower
-  viewport); the answered workspace and the zone/enrichment lists region-scroll
-  per `screen-layout.md`'s five In-Depth rows. (DEC-145 via shared chrome, NFR-001)
+- Layout/fit: the Game, Zones, and Cards steps are content-sized vertically
+  (no stretch to fill lower viewport, DEC-145); the Enrichment surface is the
+  In-depth end of the `100dvh` anchored Ask-screen frame (REQ-218) — the per-card
+  context list flexes/region-scrolls and the question box is pinned at the foot;
+  the answered workspace and the zone/enrichment lists region-scroll per
+  `screen-layout.md`'s five In-Depth rows. (DEC-145 via shared chrome, REQ-218, NFR-001)
```

- Verdict:
- Reason:

---

## REQ-110 — the question box grows upward in place instead of pushing the page

**What this decides:** whether the pre-submit question boxes on both Ask screens
grow **upward in place** over a stable control row inside the pinned frame, up to
a cap and then scrolling inside themselves — the exact growth behavior, now that
the page no longer scrolls.

**In plain terms:** REQ-110 already requires the box to grow with what you type
without making the page scroll. Today's code does not honor it — the box sits in
a page that can grow taller than the screen, so typing scrolls the page. This
restates REQ-110 for the anchored frame (REQ-218): the box is pinned at the
bottom, the text grows the box **upward** while the Add-in-depth-details chip and
the mic|send pill stay put on a stable bottom row, and growth stops at a cap
after which the text area scrolls inside itself — the page never moves. It holds
on both Ask a Question and In-depth Enrichment, on desktop and mobile. (amends
REQ-110; anchored frame REQ-218; character cap REQ-011; two-row box REQ-206)

**What happens if you say no:** REQ-110 keeps its current wording that only says
"grow without page scroll," with no statement that the box grows upward over a
stable control row or caps-then-scrolls, so an implementer could reorder or move
the controls as the box grows.

```diff
# PRD/sections/functional-requirements.md — REQ-110

-- Description: The Enrichment optional-question field and the Quick Question question field must grow with typed content so long messages remain readable and editable, up to the available space before chrome **below** the composer, without causing the page/document to scroll from field growth or clipping that lower UI.
+- Description: The Enrichment optional-question field and the Quick Question (Ask a Question) question field must grow with typed content so long messages remain readable and editable. Both boxes are pinned at the bottom of the anchored Ask-screen frame (REQ-218); the box grows **upward in place** — the text expands above the box's own control row while that row (the Add in-depth details chip and the mic|send pill) stays put — up to a cap, past which the text area scrolls inside itself. The page/document never scrolls from field growth and chrome below the composer is never clipped.
- Acceptance Criteria:
-  - as the user types a long question on Enrichment (optional question) and on Quick Question, the field grows vertically with the content rather than staying a single-line-height box that clips text
-  - growth stops when further expansion would push UI below the composer (submit row / equivalent destination chrome) off-screen or force document/page scroll — not when the field's bottom merely reaches the viewport bottom while lower chrome is lost
-  - the same grow-without-page-scroll behavior holds on desktop (more available space) and mobile
-  - character counter and submit control remain usable while the field is expanded
+  - as the user types a long question on Enrichment (optional question) and on Ask a Question, the box grows upward with the content rather than staying a single-line-height box that clips text; the control row (chip + mic|send pill) stays on a stable bottom row and does not move or reorder as the box grows
+  - the box is pinned at the bottom of the `100dvh` anchored frame (REQ-218); its growth takes room from the flexing stage/context region above it, never from the page, so document/page scroll does not appear
+  - growth stops at a cap, past which the text area scrolls inside itself — never the page; lower chrome is never pushed off-screen or clipped
+  - the same grow-in-place-without-page-scroll behavior holds on desktop (more available space) and mobile, including above the on-screen keyboard (REQ-218)
+  - character counter and submit control remain usable while the box is expanded
- Dependencies:
-  - DEC-131
-  - REQ-011
-  - REQ-073
+  - DEC-131
+  - REQ-011
+  - REQ-073
+  - REQ-206
+  - REQ-218
- Notes:
-  - PR #75 review clarified the ceiling is the whole app composition under the field, not the field-vs-viewport-bottom alone
+  - PR #75 review clarified the ceiling is the whole app composition under the field, not the field-vs-viewport-bottom alone
+  - amended by `anchor-ask-composer` (2026-10-03): the no-page-scroll ceiling is now delivered structurally by the anchored `100dvh` frame (REQ-218, composer pinned + stage/context region flexing) rather than only by the field stopping before it forces scroll; the box grows upward in place over a stable control row, then scrolls internally at the cap
```

```diff
# PRD/sections/in-depth/README.md — Submit — Decrypt Stack, composer sentence

-  text (trimmed before submit). A blank trimmed question uses a zone-aware
-  fallback in request/prompt logic — **Resolve the stack** when the stack zone has
-  cards, otherwise **Explain the interaction with the provided game state** when
-  another selected zone has cards — which may be shown as a pre-submit hint. The
-  pre-submit composer presents the field as the dominant row element with an
-  inline counter and compact submit, and grows with typed content without forcing
-  page scroll or clipping chrome below it. (REQ-011, DEC-028, DEC-146, DEC-131,
-  REQ-121, REQ-110)
+  text (trimmed before submit). A blank trimmed question uses a zone-aware
+  fallback in request/prompt logic — **Resolve the stack** when the stack zone has
+  cards, otherwise **Explain the interaction with the provided game state** when
+  another selected zone has cards — which may be shown as a pre-submit hint. The
+  pre-submit composer presents the field as the dominant row element with an
+  inline counter and compact submit. It is pinned at the foot of the Enrichment
+  surface's `100dvh` anchored frame (REQ-218) and grows upward in place above its
+  stable control row, over the per-card context list that flexes and
+  region-scrolls above it — without forcing page scroll or clipping chrome below
+  it, and staying above the on-screen keyboard on a phone. (REQ-011, DEC-028,
+  DEC-146, DEC-131, REQ-121, REQ-110, REQ-218)
```

```diff
# PRD/sections/user-flows.md — composer growth bullet

-  - composer growth must not clip UI below the field or force page scroll from growth alone (REQ-110)
+  - the composer is pinned at the foot of the `100dvh` anchored Ask-screen frame and grows upward in place above its stable control row; its growth must not clip UI below the field or force page scroll from growth alone (REQ-110, REQ-218)
```

- Verdict:
- Reason:

---

## REQ-129 — the send button stays on screen because the box is pinned, not just because the cards are bounded

**What this decides:** whether the rule that keeps the send pill inside the first
screen on the Ask a Question pre-submit page is now satisfied by the pinned frame
(box at the bottom, cards flexing above) rather than only by capping how tall the
attached-card area can get.

**In plain terms:** REQ-129 is the ceiling that keeps the composer and send pill
inside the first screenful of the Ask a Question page no matter how many cards are
attached. It was written to be met by bounding the attached-card region. The
anchored frame (REQ-218) meets that same intent more directly — the box is pinned
at the bottom and the card stage flexes and scrolls above it, so the send pill's
bottom stays on screen by construction and at any typed length, not only because
the card region is capped. The card-image size ceiling in the rest of REQ-129 is
unchanged. (amends REQ-129; anchored frame REQ-218; card stage REQ-206; card cap
REQ-167)

**What happens if you say no:** REQ-129 keeps saying the send pill stays in view
"because the attached-card list becomes a bounded region," which describes the
old pre-frame mechanism and does not mention that box growth (not just card count)
could push the pill out — the exact defect this package fixes.

```diff
# PRD/sections/functional-requirements.md — REQ-129, pre-submit criterion

-  - on Quick Question pre-submit at 390x844, the composer and **Send Request** stay inside the first viewport (`bottom` no greater than 844px) with **every permitted number of attached cards up to the REQ-167 cap of five**, not only with one. Measured baseline this replaces (2026-09-24): with two cards attached the document measured 1159px against an 844px viewport and Send Request sat at `top` 1023 / `bottom` 1067, 179px below the fold. The per-image cap is not the fix — the attached-card list becomes a bounded region (a strip and/or a region-scrolled list) so total attached-card height stops growing with the card count
+  - on Ask a Question (Quick Question) pre-submit at 390x844, the composer and send pill stay inside the first viewport (`bottom` no greater than 844px) with **every permitted number of attached cards up to the REQ-167 cap**, not only with one, and at every typed question length up to the character cap. Measured baseline this replaces (2026-09-24): with two cards attached the document measured 1159px against an 844px viewport and Send Request sat at `top` 1023 / `bottom` 1067, 179px below the fold. This is now delivered structurally by the anchored `100dvh` frame (REQ-218) — the composer is pinned at the foot and the card stage flexes/region-scrolls above it — rather than only by bounding the attached-card region; the per-image cap is not the fix
```

```diff
# PRD/sections/functional-requirements.md — REQ-129, Dependencies

- Dependencies:
-  - DEC-151
-  - DEC-160
-  - REQ-125
-  - REQ-058
-  - REQ-141
-  - DEC-149
-  - DEC-090
-  - NFR-001
-  - REQ-167
-  - REQ-204
+ Dependencies:
+  - DEC-151
+  - DEC-160
+  - REQ-125
+  - REQ-058
+  - REQ-141
+  - DEC-149
+  - DEC-090
+  - NFR-001
+  - REQ-167
+  - REQ-204
+  - REQ-218
```

```diff
# PRD/sections/quick-lookup/README.md — Measured bounds, Pre-submit card stage line

-- Pre-submit card stage: the front card is the only full-size image; the one
-  other card peeks and the rest are off-stage, so the stage's height does not
-  grow with the card count and the send pill stays in the first viewport at
-  every card count up to the cap. The former per-image `25dvh` / `42dvh`
-  stacked cap (ui-review, 2026-08-30) retires with the stacked list it bounded.
-  (REQ-129, REQ-141, REQ-167, REQ-206, `screen-layout.md`)
+- Pre-submit card stage: the front card is the only full-size image; the one
+  other card peeks and the rest are off-stage, so the stage's height does not
+  grow with the card count. The send pill stays in the first viewport at every
+  card count up to the cap and at every typed length because the screen is a
+  `100dvh` anchored frame (REQ-218): the composer is pinned at the foot and the
+  card stage flexes/region-scrolls above it. The former per-image `25dvh` /
+  `42dvh` stacked cap (ui-review, 2026-08-30) retires with the stacked list it
+  bounded. (REQ-129, REQ-141, REQ-167, REQ-206, REQ-218, `screen-layout.md`)
```

- Verdict:
- Reason:

---

## REQ-206 — the two-row question box: text grows up over a stable control row, never yanking the page

**What this decides:** whether the Ask a Question two-row box wording states that
the chip and mic|send pill stay put on a stable bottom row while typed text grows
the box upward in place — the owner's "don't yank the text up over the UI"
decision — inside the pinned frame.

**In plain terms:** REQ-206 describes the Ask a Question box as two rows: text on
top, the Add in-depth details chip and the mic|send pill on a bottom row. It does
not say what happens as the text grows. This adds that the box is pinned at the
bottom of the anchored frame (REQ-218) and the text grows the box **upward in
place** above that bottom control row — the controls do not move, the page never
scrolls — up to a cap, past which the text area scrolls inside itself, and on a
phone the box stays above the on-screen keyboard. The box's structure, the mic
half (REQ-212), and the character ring are unchanged. (amends REQ-206; anchored
frame REQ-218; composer growth REQ-110; character cap REQ-011)

**What happens if you say no:** REQ-206 keeps describing the two rows with no rule
about growth, leaving it open for text to reflow or reorder the controls as the
box expands rather than reading as the box calmly growing upward in place.

```diff
# PRD/sections/functional-requirements.md — REQ-206, two-row box criterion

-  - the question box has two rows, as the mockup page draws it: the text on top; the Add in-depth details chip at the bottom-left (labelled or icon-only at each width as the mockup shows) and the send pill, with its microphone half (REQ-212), at the bottom-right; the character count sits where the mockup places it
+  - the question box has two rows, as the mockup page draws it: the text on top; the Add in-depth details chip at the bottom-left (labelled or icon-only at each width as the mockup shows) and the send pill, with its microphone half (REQ-212), at the bottom-right; the character count sits where the mockup places it. The box is pinned at the bottom of the anchored Ask-screen frame (REQ-218); as the player types, the box grows **upward in place** — the text expands above the bottom control row while the chip and send pill stay put and the page does not scroll — up to a cap, past which the text area scrolls inside itself; on a phone the box stays above the on-screen keyboard
- Dependencies:
-  - REQ-011
-  - REQ-079
-  - REQ-091
-  - REQ-103
-  - REQ-108
-  - REQ-134
-  - REQ-140
-  - REQ-167
-  - REQ-207
-  - FLOW-011
+ Dependencies:
+  - REQ-011
+  - REQ-079
+  - REQ-091
+  - REQ-103
+  - REQ-108
+  - REQ-110
+  - REQ-134
+  - REQ-140
+  - REQ-167
+  - REQ-207
+  - REQ-218
+  - FLOW-011
```

```diff
# PRD/sections/quick-lookup/README.md — Composing and submitting the question, box paragraph

-- Built: the Question box has two rows — the text on top, the Add in-depth
-  details chip at the bottom-left and the round mic|send pill at the
-  bottom-right, with the character count where the mockup places it. One line
-  of text is one row; typed content grows the box up to the space available
-  before bottom chrome, capped so the page itself never scrolls from field
-  growth. (DEC-146, DEC-131, REQ-110, REQ-121, REQ-206)
+- Built: the Question box has two rows — the text on top, the Add in-depth
+  details chip at the bottom-left and the round mic|send pill at the
+  bottom-right, with the character count where the mockup places it. The box is
+  pinned at the bottom of the anchored Ask-screen frame (REQ-218). One line of
+  text is one row; typed content grows the box **upward in place** above the
+  stable chip + mic|send control row — the controls do not move and the page
+  never scrolls — up to a cap, past which the text area scrolls inside itself;
+  on a phone the box stays above the on-screen keyboard. (DEC-146, DEC-131,
+  REQ-110, REQ-121, REQ-206, REQ-218)
```

- Verdict:
- Reason:

---

## Blocker questions

None. Every uncertainty resolved from the assumption ladder; see
`DESIGN-BRIEF.md` "Material assumptions."
