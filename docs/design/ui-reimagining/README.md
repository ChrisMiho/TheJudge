# UI re-imagining — direction 1

The first clickable mockup direction for re-imagining TheJudge's player
screens (everything except Player Life Tracker) around the mana colour a
player picks, at a restrained intensity — the redesign this repo's PRD
approved in `PRD/sections/` (`REQ-200`-`REQ-205`) but has not yet built.
**Nothing here is shipped app code.** `apps/frontend` and `apps/backend` are
untouched; this is a static, self-contained preview the owner reviews before
a later package builds it for real.

Directions 2 and 3 are a follow-on package, kicked off after the owner has
reacted to this one. Mirrors `docs/design/tab-icon/`'s precedent for kept
design-candidate art living outside `PRD/work/`.

## How to open it

Every page under `direction-1/` is plain HTML/CSS/vanilla JS — no build step,
no bundler, no framework. Open `index.html` in this folder in any browser
(`file://` works fine) and click through from there, or open any
`direction-1/*.html` file directly. Resize the window, or use your browser's
device toolbar, to see both the phone (390×844) and desktop (1440×900)
compositions each page targets.

## What's in `direction-1/`

- `tokens.css` — the one authoritative source of the `REQ-200` surface-role
  token set (page ground, colour wash, raised panel fill, panel edge, focus
  ring, primary text, muted text, filled-accent text), one block per profile
  switched by `[data-profile="white|blue|black|red|green|colorless"]`. The
  four `accent`/`accent-strong`/`accent-soft`/`accent-contrast` values in
  each profile are unchanged from `REQ-099`'s shipped values.
- `motifs/` — one original SVG per colour (`REQ-201`): White's gilded
  filigree, Blue's charged vortex/lightning, Black's decay with one hot
  glow, Red's burst inside darkness, Green's forest vines with a pinpoint
  glow, Colorless's inscribed brass-and-bone bands. Drawn for this app; no
  official Wizards of the Coast mana glyph, icon font, logo, or card art
  anywhere in this tree.
- `shell.css` — the single source of the shared chrome skeleton (page shell,
  header/menu rail, brand mark slot, menu tray, theme orbs, overlay/drawer
  primitives) every page below imports rather than redeclaring.
- `flow.css` + `flow.js` — the question-flow components and demo helpers
  Quick Question, In-Depth Question and Trade Balancer share (see round 2).
- `shared-chrome-menu.html` — the Menu, brand mark, Theme section, mock-mode
  banner, and overlay demos (feedback modal, history drawer, View Context
  overlay, card-detail popup).
- `quick-question.html` — Quick Question, pre-submit and answered.
- `in-depth-question.html` — every In-Depth Question step.
- `trade-balancer.html` — Trade Balancer, phone tabs and desktop side-by-side.

## Previewing all six colours

Every page's `<html>` tag carries `data-profile="blue"` by default (Blue is
the shipped default, `REQ-099`). To preview another colour, either use the
Theme section on `shared-chrome-menu.html` (it live-updates the page with no
reload) or edit the `data-profile` attribute directly in your browser's
DevTools — valid values are `white`, `blue`, `black`, `red`, `green`,
`colorless`.

## `before/`, `after/` and `renders/`

`before/*.png` are screenshots of **today's shipped app**, captured live from
`npm run dev` on 2026-09-24, one per in-scope destination plus Player Life
Tracker at phone (390×844) and desktop (1440×900) width — the baseline each
mockup page is paired against. `after/life-tracker-*.png` is the one
screenshot pair in this tree: Life Tracker's real screen content composed
inside the new shared chrome, proving `REQ-202`'s inheritance causes no drift
to Life Tracker's own counters or layout. There is no clickable Life Tracker
mockup — Life Tracker's own redesign is out of scope for this pass.

## Entry point

`index.html` is the one page to open for the full review: it links every
mockup above and the Life Tracker before/after pair.

## Iteration log (owner-in-the-loop rework)

The graph build (PR #237, commits `f527ae9..60e5f94`) met every slice
criterion but the owner rejected the mockups' feel on 2026-09-24: shared chrome
looked unchanged, cards were lettered chips instead of card art, In-Depth lost
its questions and context, Trade Balancer had no card images. The pages are now
being reworked **one flow at a time with the owner reacting to each render**,
on this same branch, before anything is handed back to the graph. When all
four flows are agreed, the agreed pages plus one written rule per flow become
the intake for the next kickoff (product truth + app code).

How to work on it: serve this folder (`python3 -m http.server 8137 --bind
127.0.0.1` from `docs/design/ui-reimagining/`), open a page, screenshot at
390×844 and 1440×900, show the owner, adjust. Card images are the app's own
representative printings via `https://cards.scryfall.io/normal/front/<a>/<b>/<id>.jpg`;
ids come from `apps/frontend/public/data/cardMetadata.json` (`imageId`).

### Round 2 (2026-09-24, from `OWNER-FEEDBACK.md`)

All four flows reworked against the owner's written feedback. Renders of
every state below live in `renders/` (phone 390×844, desktop 1440×900).
**Rule** = the owner said it must hold; **Try** = shown for a verdict.

Shared pieces added this round, so the flows read as one product:

- `direction-1/flow.css` — the question-flow components both question pages
  share (flow header with attach chips, the lit stage and card ring, the ✕/ⓘ
  card widgets, card search, the question box with its 300-character budget
  built into the frame, the card-detail sheet/side panel).
- `direction-1/flow.js` — demo plumbing: the card library with real corpus
  fields (`cardMetadata.json` image ids, `cardDetailByOracleId` oracle text),
  the card-detail panel, the question-box budget.
- `tokens.css` now carries `--motif` per profile so any page can paint the
  current colour's art without knowing which profile is active.
- If a render looks stale after editing a `.css`/`.js` file, hard-reload:
  the demo server sends `Last-Modified`, and browsers cache the linked files.

#### Quick Question — `quick-question.html`

- Rule: **the attached card is the hero.** Three cards on stage: the front
  card full size, one neighbour peeking out each side. The rest wait
  off-stage and slide in as the ring turns (arrows, ←/→, or tap a neighbour).
- Rule: **no caption under the card.** Text appears only when the image is
  unavailable (the "1 card, image unavailable" demo state shows the
  name-only fallback).
- Rule: ⓘ is back on the card's top-right corner and opens the card-detail
  panel — bottom sheet on phone, right side panel on desktop, exactly where
  today's app puts it — with mana cost, mana value, type, colours,
  subtypes, price and the oracle text.
- Try: ✕ Remove moved to the card's top-left corner (mirrors ⓘ).
- Try: **Add card and Scan sit beside the Quick Question title.** Pressing
  Add card opens the search just above the question box with a result list
  (thumbnail, name, type); picking a result slides the card onto the stage.
  With five attached the chip reads "5 / 5" and disables.
- Rule: **no stage when no card is attached** — title, hint and question box
  only.
- Try: the character count lives inside the question box's bottom-right
  corner, with a hairline meter along the box's bottom edge that fills as you
  type and turns accent past 270. Send Request is full width on phone, right
  aligned on desktop.
- Demo bar states: 5 / 2 / 1 / 1-without-image / 0 cards.
- Lightning Bolt now opens the ring so the odd black-and-white Sol Ring
  printing is not the first thing seen (data note unchanged).

#### In-Depth Question — `in-depth-question.html`

- Rule: **today's questions and game-context fields are back**, step for
  step: 1 Game (players in game with the expander for names and life totals,
  turn phase, active player) → 2 Zones (the seven-zone checklist) → 3 Cards
  (a tab per selected zone, Add card / Scan in the title row, real card
  images on a lit shelf, Stack shows #1…TOP order and "Begin stackening!"
  when empty) → 4 Context (card-by-card: the card as hero beside Owner,
  Caster, Mana spent, Targets, Context notes; "View all cards" skips to the
  review; then "Sending to TheJudge" with zone chips, the optional question
  box and the fallback question) → 5 Answer (the conversation: your
  question, TheJudge's answer with tappable card refs, View context opens
  the frozen game context, follow-up composer, Start over).
- Rule: **same components as Quick Question** — the same attach chips,
  search, question box and detail panel — so the owner's future "go
  in-depth from Quick Question" button is a step, not a jump. The
  transition itself stays out of scope.
- Try: a five-station progress rail replaces the step buttons; done
  stations fill, the current one glows, the path lights up behind you.
- Try: zone tiles glow when selected instead of plain checkboxes.

#### Trade Balancer — `trade-balancer.html`

- Rule: **card images are back** on every entry (tap one for the detail
  panel). Card-as-hero deliberately does not apply here.
- Try: **the scale is the hero** — both totals on one beam that tilts toward
  the heavier side, with the verdict in plain words ("Side A is ahead by
  $2.75 — Side B adds $2.75 in cards or cash to even it").
- Try, the "functional trade menu" pieces: a "call it even within $0 / $1 /
  $5" window that changes the verdict; foil toggle, quantity stepper and
  Change printing per entry (the printing picker lists sets with nonfoil and
  foil prices and re-prices the row); Add cash on either side; rename a side
  by tapping its name; Swap sides; Copy summary; Start a new trade.
- Phone keeps one side per tab with both totals in the tab labels
  (REQ-204); desktop keeps both sides side by side.

#### Shared chrome and Menu — `shared-chrome-menu.html` + `shell.css`

- Rule: **the theme is worked into the chrome, not tinted over it.** The
  header carries the colour's motif faintly along its right edge and a lit
  hairline along its bottom; the brand mark sits in a lit orb. Every page
  inherits this from `shell.css`.
- Try: the Menu tray is themed the same way (motif watermark, accent glow),
  and the destinations are tiles with a glyph and a one-line hint; the
  current screen is marked.
- Try: **Theme is six mana orbs** — lit spheres in each colour; the chosen
  one wears its motif and lights a ring, with a line naming the motif
  ("Blue — charged vortex. Every screen follows.").
- Life Tracker still inherits only the chrome (REQ-202).

#### Global

- Rule (owner, 2026-09-24): **every card keeps its colour-identity ring.**
  Today's app draws a one-pixel ring in the card's own colours around every
  card tile (one colour, a WUBRG-ordered gradient for multicolour, silver
  grey for colourless — `apps/frontend/src/lib/cardIdentityRing.ts`). Round
  2 had replaced it with a ring in the theme accent; that was a regression,
  not a design choice. Fixed: `flow.css .card-identity-ring` uses the same
  colours and masked-border technique on every card surface (ring, shelf,
  context hero, thumbnails, trade entries, printing picker). The theme owns
  the glow behind a card, never its edge. Lightning Helix (white/red) was
  added to In-Depth's Hand and Trade Balancer's Side B to show the gradient.
- Every page uses the motif as the ornament: stage watermark, corner marks
  on the lit surfaces, the header edge, the judge's answer bubble. Intensity
  stays restrained (0.06–0.16 opacity) so card art wins.

### Open for the owner's verdict

- Quick Question: ✕ on the card corner; count inside the box; attach chips
  beside the title (or should search open under the chips instead of above
  the question box?).
- In-Depth: progress rail; card-by-card context with the card as hero.
- Trade Balancer: the beam; the "call it even within" window; cash rows.
- Chrome: tiles + orbs in the Menu.

### Earlier round (2026-09-24, morning)

#### Quick Question — agreed direction

- Rule for this flow: **the attached card is the hero.** One real card image
  centre stage on a lit, theme-coloured surface; the other attached cards sit
  behind it on either side, scaled down and dimmed; arrows on each side (and
  ←/→ keys, or tapping a background card) rotate which card is front.
- Caption under the card: name · type · price. Details / Remove under that.
- Composer below the stage: question box, then a row of `+ Card` and `Scan`
  chips, the character count, and Send Request — all inside the first phone
  viewport with five cards attached.
- Desktop uses the same vertical composition (bigger card, wider spread); the
  owner preferred it to a two-column layout.
- A demo bar (not part of the design) switches 5 / 2 / 1 / 0 cards.
- Owner's verdict on the ring: "now we're cooking". Open questions he has not
  answered yet: show only three cards in the ring on phone; move Remove to a ✕
  on the card corner and Details to a tap on the card to buy back ~50px.
- Data note, not a mockup issue: Sol Ring's representative printing in the
  corpus is a black-and-white MSCHF one, so it looks odd in the hero slot.

#### Still to rework (superseded by round 2 above)

In-Depth Question (restore the real questions and game-context fields first,
then re-theme), Trade Balancer (card images per side; the owner has said the
card-as-hero rule may *not* apply here because more information competes),
shared chrome and Menu (last, so it matches the page style). Card-as-hero is a
per-flow decision, not a global rule.
