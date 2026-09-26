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
- `motifs/` — one original SVG per colour (`REQ-201`), each a badge (round
  4): a dark disc holding the colour's own symbol, wrapped in a ring of its
  element — White a halo pierced by light in scattering rays, Blue a spiral
  in a sweeping wave, Black an eclipse in thorns with ink dripping below,
  Red an ember burst in a swirl of flame, Green three leaves round a seed in
  a leaf wreath, Colorless a hexagonal cog in an inscribed riveted band.
  Drawn for this app; no official Wizards of the Coast mana glyph, icon
  font, logo, or card art anywhere in this tree.
- `shell.css` — the single source of the shared chrome skeleton (page shell,
  header/menu rail, brand mark slot, menu tray, theme orbs, overlay/drawer
  primitives) every page below imports rather than redeclaring.
- `flow.css` + `flow.js` — the question-flow components and demo helpers
  Quick Question, In-Depth Question and Trade Balancer share (see round 2),
  plus the shared menu tray, chat and card-detail panel (round 3).
- `ambience.css` + `ambience.js` — the per-colour personality layer behind
  every page: two sheets of drifting haze and a field of magical dust
  (round 5), plus the colour's badge faint and drifting. The round-3
  `ornaments/` are gone — corners are hairline brackets from `shell.css`.
- `motif-gallery.html` — four candidate symbols per colour at orb size and
  large, for the owner to pick from (round 5).
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

### Round 5 (2026-09-26, from `OWNER-FEEDBACK.md` → "Round 5")

Every Round 5 note applied. Renders are `renders/r5-*.png` (phone 390×844,
desktop 1440×900) — the only renders in the folder; Round 4's live in git
history at commit `525c0ae`.
**Rule** = the owner said it must hold; **Try** = shown for a verdict.

Global, on every page:

- Rule: **the rays of light are gone.** The ambience is now two sheets of
  soft, blurred colour that drift past each other very slowly (the haze /
  smoke) plus a field of fine magical dust — finer, slower and softer than
  round 4, every mote a small glow that twinkles. The badge still drifts
  faintly behind the page. Try: is this the subtle, mystical movement you
  meant? Density and speed are one number each.
- Try: **the motif gallery** (`motif-gallery.html`, `r5-motif-gallery-1440`)
  — four candidate symbols per colour on the dark disc, at brand-orb size,
  theme-orb size and large. A is what the pages use today. Pick one letter
  per colour (or "none, because …") in Round 6; the pick then gets its
  elemental ring and the full badge treatment.
- Try: **the header is a banner.** ☰ at the left, the brand centred — the
  breathing orb, the wordmark, the "MTG Assistant" tagline — on a lit band
  that rises under the brand, a hairline of the colour's light along its
  foot, and the badge stamped faintly at each end on wide screens (never
  near the text). The right-hand slot keeps the Trade Balancer's price
  date.
- Rule: the desktop tray closes on its ✕ **and on a tap anywhere outside
  it** — `flow.js` binds the backdrop click and Escape as well.

#### Quick Question — `quick-question.html` (`r5-qq-*`)

- Rule: **Send lives inside the question box** — the box is the same pill
  the chat uses, with the count and the round ➤ inside the frame and the
  budget meter along its foot. It grows to about seven lines, then scrolls.
- Rule: **Start over is a round ↺** at the top right of the chat, beside
  the title. The bottom row is gone.
- Try: **"Add in-depth details"** sits under the box. It carries the
  attached cards into the In-Depth flow (`in-depth-question.html?carry=…`);
  see In-Depth below. The two flows keep their names for now — when they
  become one "Question", this button is the seam.

#### In-Depth Question — `in-depth-question.html` (`r5-idq-*`)

- Try, the future "one Question" flow: cards carried from Quick Question
  wait in a **"From Quick Question · n to place"** strip above the zone
  tabs at the Cards step (`r5-idq-390-3-cards-carry`); each row has a
  "Place in…" picker of the zones chosen at step 2, and placing a card
  summons it onto that zone's shelf. A one-line note under the title says
  the cards came along. Search excludes carried cards.
- Rule: **Back is a round ‹** beside the title (hidden on step 1). Inside
  the context step it walks back a card first, then to Cards. Each step has
  one **Continue**: full width on a phone, right-aligned on desktop.
- Rule: **Send lives inside the question box**, as Quick Question.
- Rule: **Start over is a round ↺** at the top right of the chat, beside
  View context.
- The context sheet is re-laid: **the card's art at the left, the form
  beside it** (210px art on desktop, 96px on a phone, where the form drops
  below). Nothing stretches wider than the form column; the art column has
  no dead space under it. The row of thumbnails is gone; a small **counter
  box** ("1 / 6 cards") counts up as you go. "Skip to review" stays.
- Rule: the **zone bubbles are solid** (zone tabs and the summary chips).
- Rule: the Stack's tags read **TOP** alone for one card, **BOTTOM / TOP**
  for two, and **#1 … TOP** from three cards up.

#### Trade Balancer — `trade-balancer.html` (`r5-tb-1440`)

- Rule: on desktop **New trade sits top right, opposite the title**; on a
  phone it keeps the bottom tray.

#### Shared chrome and Menu — `shell.css` + `flow.js` (`r5-menu-*`)

- Rule: **Question History** (renamed) sits right under In-Depth Question,
  among the destinations. Send feedback sits alone under the divider.
- Try: **more flair at the foot** — the badge large and slowly drifting,
  a pool of the colour's light, and a scatter of twinkling dust fill the
  tray's dead space.

### Open for the owner's verdict (Round 5)

- Global: the haze + dust; a letter per colour from the gallery; the banner.
- Quick Question: "Add in-depth details" and the carry-over.
- In-Depth: the art-beside-form sheet; the ‹ arrow as the only Back.
- Menu: the foot flair.

### Round 4 (2026-09-26, from `OWNER-FEEDBACK.md` → "Round 4")

Every Round 4 note applied. The Round 4 renders (`r4-*`) were removed on
2026-09-26; they remain in git history at commit `525c0ae`.
**Rule** = the owner said it must hold; **Try** = shown for a verdict.

Global, on every page:

- Rule: **one typeface.** Cinzel is gone; Inter carries titles too (heavier,
  tighter tracking). `--font-display` still exists so a page never has to
  know, but it resolves to Inter.
- The six **motifs are redrawn as badges** (`motifs/*.svg`), the icon
  language the owner's sticker references use: a dark disc holding a flat
  symbol, wrapped in a painterly ring of the colour's element. Our own
  symbols, never the Wizards glyphs (the owner's D2 ruling): White a halo
  pierced by a shard of light in scattering rays · Blue a spiral of charged
  water in a sweeping wave · Black an eclipse in thorns with ink dripping
  below · Red an ember burst in a swirl of flame · Green three leaves round
  a seed in a leaf wreath · Colorless a hexagonal cog in an inscribed,
  riveted band. Try: the badge shows in the brand orb, the header edge, the
  judge's seal, the theme orbs, and drifts huge behind every page.
- Rule: the drawn **corner flourishes are gone**; every lit surface keeps a
  hairline L-bracket in each corner instead (`shell.css .ornate`).
- Try: the **ambience is turned up** — the drifting badge at twice the
  weight, brighter light fields, about half again as many particles. The
  header and tray watermarks are stronger too. Intensity is one number per
  layer if it needs to move either way.
- The desktop **side tray is a floating glass card** (`shell.css
  .drawer-panel`): inset from the edge, rounded, blurred over the ambience,
  sized to its content — no full-height grey column. Card details, the
  printing picker and History all ride it.
- Rule: a card appears **once** in the chat — the Cards strip at the top.
  The judge's message keeps tappable names, never thumbnails.
- The **personality board** and the motif kit on `shared-chrome-menu.html`
  are gone; the tray is the only place a colour is picked.

#### Quick Question — `quick-question.html` (`r4-qq-*`)

- Rule: on desktop **Send Request sits in line with the question box**,
  hugging its bottom edge as the box grows; on a phone it keeps its own line
  under the box.
- The card widgets keep straddling the corners (no objection in round 4).
- `r4-qq-1440-detail` is the floating glass tray; `r4-qq-1440-red` and
  `r4-qq-1440-green` show two other colours' badges and ambience.

#### In-Depth Question — `in-depth-question.html` (`r4-idq-*`)

- Rule: the **context sheet is a clean form again** — the card beside a
  short set of fields, selects not chips (owner: round 3's chips were "a
  regression"). Per zone, the same rules as today's app: Owner for every
  zone but the Stack; Cast by on the Stack; **Mana spent** on the Stack and
  the Battlefield, **prefilled with the printed cost** (a card with nothing
  special to say costs zero taps; the hint reads "printed {R}").
- **Targets is one picker.** Its list is everything the owner named: No
  target · Just on the board (Battlefield / Command Zone) · each player ·
  All players · every other card in context (with its zone) · Something
  else (a one-line description). Each pick becomes a pill with a ✕ (a card
  pill carries its thumbnail); the picker resets to "Add another target…",
  so several targets are several picks, no kind → value → Add. "No target"
  and "Just on the board" replace whatever was there. Blank means no target.
  Try: is this the streamlined version you meant?
- Notes stays one slim optional line. "Skip to review" sits in the
  eyebrow; the row of thumbnails still jumps between cards.
- Rule: **no round steppers** — the mana field is a plain number box, the
  player count keeps its square − / +.
- Rule: **Back and Continue are the same width** on every step and in the
  card sheet.
- The reviewed list **collapses** (Collapse ▴ / Expand ▾) to one line of
  card names so the question box has the room.
- Chat: cards only in the Cards strip; View context beside the title.
- Send in line with the box on desktop, as Quick Question.

#### Trade Balancer — `trade-balancer.html` (`r4-tb-*`)

- Rule: **Add cash is gone** (state, rows, the footer button). **Swap
  sides and Copy summary are gone**; the action row is New trade alone.
- Rule: the verdict is **just the difference** — "Side A +$1.85", or
  "Even" inside the chosen window. The "adds … to even it" line is gone.
  The "even within $0 / $1 / $5" pills stay in the band.
- The printing picker rides the floating glass tray: the card's art and
  name, one line of instruction, one row per set with the Nonfoil / Foil
  price pills. The filter box only appears past five printings.

#### Shared chrome and Menu — `shared-chrome-menu.html` + `shell.css` + `flow.js` (`r4-menu-*`)

- Rule: the **colour names and the one-line blurb under the orbs are
  gone**, and so is the tray's footer line. The orbs are a touch larger; a
  hover title still says the colour.
- Everything else from round 3 holds: from the left, plain rows, Send
  feedback and History under the destinations, Theme at the foot.

### Open for the owner's verdict (Round 4)

- Global: the badge motifs — right direction? Ambience level — hold, or up
  again?
- In-Depth: the one-picker targets; Mana spent on Battlefield cards as well
  as the Stack.
- Trade Balancer: "Even" vs. showing the small gap inside the window.

### Round 3 (2026-09-25, from `OWNER-FEEDBACK.md` → "Round 3")

Every Round 3 note applied, plus the global ask ("more animations, more
graphics, more personality within each color profile … magical, mythical,
ethereal"). The Round 3 renders (`r3-*`) were removed on 2026-09-26; they
remain in git history at commit `dfaa319`.
**Rule** = the owner said it must hold; **Try** = shown for a verdict.

The personality layer, shared by every page:

- `direction-1/ambience.css` + `ambience.js` — a fixed layer behind every
  screen with three parts per colour: a slow large-scale light movement
  (White dawn rays sweep · Blue vortex turns · Black breathes with one violet
  ember · Red heat flickers up · Green canopy light shifts · Colorless brass
  rings turn), the colour's motif huge and faint and drifting, and a canvas
  particle field (motes · orbiting sparks · falling ash · rising embers ·
  drifting pollen · settling dust). All of it obeys reduced-motion.
- `direction-1/ornaments/*.svg` — one corner flourish per colour (gilded
  filigree · rune arc with a spark · briar thorn with a drip · a cracked,
  burning corner · vine with two leaves · riveted brass bracket), drawn for
  this app, painted into the corners of every lit surface (`.ornate`).
  `tokens.css` carries it as `--ornament` beside `--motif`.
- Type: **Cinzel** (a carved display face) for titles, card names, totals and
  the wordmark; Inter for everything read at length. Both from Google Fonts
  with system fallbacks (`--font-display` / `--font-body`).
- Motion: the brand orb breathes; a light sweeps across every primary button;
  a card added to a stage "summons" in (rises, blooms, settles); the ruling
  arrives under a seal that turns into place; the current rail station
  pulses; foil entries carry a moving sheen; zone tiles glow and wear the
  motif when chosen.
- The demo bar on each page is now a dashed strip labelled **DEMO** and sits
  below the composition. It is mockup scaffolding only and will not exist in
  the app.

#### Quick Question — `quick-question.html` (`r3-qq-*`)

- Rule: the two hint phrases are gone; the question box carries the prompt.
- Rule: no motif icon beside the title — the brand orb is the only one.
- ✕ and ⓘ now **straddle the card's top corners**, half above the frame's
  edge, so the printed name is never covered (this also fixes the In-Depth
  shelf complaint). Try: keep them there, or hide them until the card is
  tapped?
- Try: with Add card open on a phone, the ring **folds into a strip of
  thumbnails** ("2 of 5 attached") so the search, its results (three rows,
  then scroll) and the question box all stay on one screen.
- The card-detail sheet: the card's **art leads**, name in the display face
  over it with the mana cost, one type line with colour pips, the oracle
  text in a framed box, three fact tiles (mana value · subtypes · price). The
  sheet **sizes to its content** (no grey void) and the close sits in the
  top-right corner. Desktop: the same as a right-hand side panel.
- Rule: the question box is **slim (one line) until text arrives**, grows to
  about seven lines, then scrolls; count and meter stay inside the frame.
- Answered: **today's chat** — your question in the accent on the right, the
  ruling as open text under a small seal, tappable card names, a pill
  composer with a round send, Start over — plus a **Cards strip** at the top
  so every attached card is one tap away.

#### In-Depth Question — `in-depth-question.html` (`r3-idq-*`)

- The rail stays (owner: "top tier"), now **four stations**. Answer is no
  longer a station: when the ruling arrives the rail and the flow leave and
  the chat takes the whole panel (`r3-idq-*-5-chat`).
- Shelf: widgets straddle the top edge (26px); the Stack's **#n / TOP tag
  straddles the bottom edge**, over the copyright line only.
- Context step, rebuilt as **one compact sheet per card**: a small hero with
  the card name, "Card 1 of 6 · Stack", and a row of thumbnails to jump
  between cards. The questions depend on the zone: Stack asks Cast by,
  Mana paid, Targets; other zones ask Owner (and Targets where they make
  sense); Hand and Library skip Targets. Owner / Cast by are player chips.
  Mana paid is a stepper preset to the printed cost ("as printed" / "+1 over
  the printed cost"). **Targets are tap-all-that-apply chips**: the players,
  every other card in context (with its thumbnail), No target, and a
  free-text Other — no more picking a kind first, then a value, then Add.
  Notes stay optional and slim. Try: this replaces today's kind→value→Add
  target rows entirely; is anything you need to say about a card missing?
- The reviewed list **scrolls** (never taller than a third of the screen),
  each row shows what was said ("cast by Player 1 · targets Counterspell")
  with **✎ to jump back to that card**. The Card-by-card button is gone.
- The "Sending to TheJudge — phase, active player" line is gone; the zone
  bubbles stay (empty zones dashed). The question box is slim and grows;
  a one-line label says a blank box asks "How does this resolve?".
- Chat: today's chat, with the **Cards strip** and **View context** beside
  the title (opens the frozen game context with each card's context).

#### Trade Balancer — `trade-balancer.html` (`r3-tb-*`)

- Rule: **the whole screen fits the viewport** at 390×844 and 1440×900.
  Only the entry lists scroll (one per side); header, scale, tabs, side
  headers, footers and the action row stay put. Verified in the render:
  the action row's bottom edge lands at 844 on the phone.
- The scale is a **compact band**: totals at the edges (display face,
  the heavier side lit), the beam and the plain-words verdict between, and
  the "even within $0 / $1 / $5" pills inside the band rather than on their
  own row. Same tilt animation.
- The **printing picker** leads with the card's art and lists **one row per
  set** (name, code · year, thumbnail) with two price pills — Nonfoil and
  Foil — tapping a pill picks that printing *and* that finish. Foil rows
  show a sheen; a set with no foil price shows a disabled Foil pill.
- Actions are one row of chips (Swap sides · Copy summary · New trade). The
  price date sits in the header on desktop and under the title on phones.

#### Shared chrome and Menu — `shared-chrome-menu.html` + `shell.css` + `flow.js` (`r3-menu-*`, `r3-chrome-*`)

- Rule: the tray **slides in from the left**, on phone and desktop, like
  today's app. ☰ sits at the left end of the header.
- Rule: **Send feedback and History sit right under the destinations**,
  above Theme.
- The tiles are gone: destinations are a **plain list** with a small accent
  glyph, the current screen lit with a bar and a ✓. Theme is the six orbs
  at the foot (smaller), one line naming the colour's personality.
- The tray is themed the same way as the pages: glass over the ambience,
  the motif low in the corner, a lit hairline down its edge. Try: is this
  the "premium" you meant, or should the tray be plainer still?
- Every page now mounts this same tray, the Send feedback modal and the
  History panel from `flow.js` (`mountMenu`), so the Menu is identical
  everywhere.
- `shared-chrome-menu.html` doubles as the **personality board**: six tiles,
  one per colour, that re-theme the page live and say what each brings.

### Open for the owner's verdict (Round 3)

- Global: does the ambience + ornaments + display face reach "magical,
  mythical, ethereal", or push further (more motion? bolder ornaments?
  card-frame-like borders on panels?). Intensity is easy to tune.
- Quick Question: widgets straddling the card corners.
- In-Depth: the rebuilt context sheet (chips + tap-to-target).
- Trade Balancer: the compact scale band; the new printing picker.
- Menu: the themed tray from the left.

### Round 2 (2026-09-24, from `OWNER-FEEDBACK.md`)

All four flows reworked against the owner's written feedback. The Round 2
renders (`qq-v2-*`, `idq-*`, `tb-*`, `menu-*`) were removed on 2026-09-25 so
`renders/` holds only the current round; they remain in git history at
commit `843dbd9`.
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

### Open for the owner's verdict (Round 2 — superseded by Round 3 above)

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
