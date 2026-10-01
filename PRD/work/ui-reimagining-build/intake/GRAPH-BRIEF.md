# Graph-run brief — build the re-imagined UI (direction 1) into TheJudge

Self-contained intake for `graph-kickoff`. The design questions are
**settled by the owner across fourteen mockup rounds** (2026-09-24 →
2026-09-29), so refinement can go straight to a DESIGN-BRIEF and the gate
questions. The owner's closing verdict, Round 14: "I think everything is
finalized and ready to be turned into a proper prd for an agent to implement
into the judge."

Two sources of truth travel together:

- **The look** is the static mockup at `docs/design/ui-reimagining/direction-1/`
  (on `main` once PR #237 merges): `shared-chrome-menu.html`,
  `quick-question.html`, `in-depth-question.html`, `trade-balancer.html`,
  `card-scan.html`, `life-tracker-menus.html`, with `tokens.css`, `shell.css`,
  `flow.css`/`flow.js`, `ambience.css`/`ambience.js`, `motifs.js`, `motifs/`.
  Open `docs/design/ui-reimagining/index.html`; serve the folder and add
  `?profile=<colour>` to preview any colour. The renders in
  `docs/design/ui-reimagining/renders/` are the approved final frames.
- **The behaviour** is this brief: every rule the owner set, flow by flow,
  and the list of what already stands in `PRD/sections/` versus what the run
  must amend or gate. The full round-by-round record with the owner's words
  is `docs/design/ui-reimagining/README.md` → "Iteration log" and
  `OWNER-FEEDBACK.md`; nothing below needs them to stand.

When a page and this brief disagree, the brief is wrong about the look and
right about the behaviour; raise it as a gate question rather than guessing.

## What the player gets

A player picks a mana colour in the Menu and the whole app becomes that
colour's place: a flat dark ground with a slow, faint scene of the colour's
element playing behind every screen (falling leaves for Green, runes and
constellations for Blue, fog and brambles for Black, heat and embers for Red,
beams for White, turning geometry for Colorless), the colour's own badge
faint in the centre, panel edges and focus rings in the colour's light. Card
art stays the hero everywhere and every card keeps its own colour-identity
ring.

Quick Question and In-Depth Question become one door, **Ask a Question**:
attach up to 10 cards on a lit stage, type or dictate a question, send from
inside the question box, and — when the ruling needs more — "Add in-depth
details" carries the same cards into the step flow where each is placed in a
zone. The In-depth flow keeps every question today's form asks, as four
stations (Game · Zones · Cards · Context) with the way forward built into
each panel, card-by-card context with the card beside a short form, drag
reorder on the Stack with BOTTOM … TOP tags, a card menu with Move to / order
/ details / remove, and the same chat for the ruling.

Trade Balancer weighs two sides as two piles of gold that grow with each
side's value, a verdict line in plain words, and on a phone Side A and Side B
as tabs. Card scan is the same scanner in the new chrome with a shutter,
an ✕ way out, one count pill, and a caution pop-up. Question History reopens
any of the last 20 conversations live. Send feedback is today's form in the
shared sheet. Life Tracker's table is untouched to the pixel; only the sheets
behind it (Game Setup, a player's Counters) wear the shared language.

## Why (settled — do not re-derive)

There is no benchmark to re-run. The evidence is the owner's reaction to
each render across fourteen rounds; the rules below are the ones the owner
said must hold ("Rule" in the README) or accepted after seeing them ("Try"
that drew no objection and survived to Round 14). Round 14 closed every open
question. Directions 2 and 3, once planned as follow-ons, are **not being
made**: direction 1 is final.

## Decisions already made — do not re-litigate

Global, every screen:

- One typeface: Inter, for titles too (heavier, tighter tracking). No display
  face (Cinzel was tried and removed).
- The ground is flat: one colour per profile, no gradient. Neutral ground and
  panel fills stay the visual majority (REQ-200's restraint holds).
- No corner decoration of any kind on any surface ("too sci-fi"). No hairline
  brackets, no flourishes.
- The six colour symbols are final: White a rising sun, Blue a wave crest,
  Black a line-drawn skull, Red a flame, Green a curling sprout, Colorless a
  vortex of broken rings — each drawn for this app inside a badge (dark disc,
  ring of the colour's element). `direction-1/motifs/*.svg` + `motifs.js` are
  the sources. No Wizards of the Coast glyph, icon font, logo or art anywhere
  (REQ-201).
- The ambience layer (per colour: two drifting sheets of haze, a field of
  glowing dust, the colour's badge large, blurred and faint in the centre,
  and the colour's element animated on one canvas) plays behind every page
  and, at a whisper, inside the Menu tray. Density and alpha are one number
  each per scene. Everything obeys reduced motion (NFR-006).
- The stage the cards sit on and every in-depth plate are solid panels (the
  judge's bubble fill), so the badge shows around them, never through them.
- Every card keeps its colour-identity ring (`cardIdentityRing.ts`: one
  colour, WUBRG gradient for multicolour, silver for colourless) on every
  card surface. The theme owns the glow behind a card, never its edge.
- The chosen colour is a saved setting carried across every page (REQ-099);
  a custom Colorless colour applies to every token-driven surface and is
  lifted where it would fail contrast (accent text/dust to 7:1 on the ground,
  fills to 2.4:1, text on a fill white or near-black — the hue survives).
- The card-detail box opens in the centre of the screen on desktop (fades up
  into place) and as a bottom sheet on a phone, everywhere it appears.
  Question History, the printing picker, Send feedback and the confirm sheet
  share that shell: bottom sheet under 600 px, floating card from 600 px up,
  fixed head and foot, only the body scrolls.
- The header is a banner: ☰ at the left (about a quarter larger than today
  on a phone, a third on desktop), the brand centred (a breathing orb with
  the colour's badge, the wordmark, "MTG Assistant"), on a lit band with a
  hairline of the colour's light along its foot; each colour paints its own
  element across the band (White low-sun rays, toned to half; Blue a subtle
  scatter of arcane shapes; Black fog pooling at the ends; Red a hot band
  with embers; Green an abstract scatter of leaf-and-tree shapes; Colorless
  a random scatter of small triangles, rings, arcs, dots and crosses). The
  right-hand slot keeps Trade Balancer's price date on desktop.
- The brand mark keeps the cat-wizard Easter egg (REQ-203).
- Every control meets the 44 px floor (REQ-205); the mockup was built to it.

## Rules per flow

### Shared chrome and Menu (`shared-chrome-menu.html`, `shell.css`, `flow.js`)

- The tray slides in from the left on phone and desktop. On desktop it is a
  floating glass card, inset and rounded, sized to its content; it closes on
  its ✕, on a tap outside it, and on Escape.
- Destinations are a plain list with a small accent glyph each, the current
  screen lit with a bar and a ✓: **Ask a Question** (glyph: a card
  silhouette) · **Question History** directly under it · **Life Tracker** ·
  **Trade Balancer**. Quick Question and In-Depth Question rows are gone —
  one door. **Send feedback** sits at the foot of the list past a slim
  hairline, no gap.
- **Theme** is one segmented band the width of the tray, six equal cells,
  one per colour: an unchosen cell a faint wash of its colour with the symbol
  in the colour's light; the chosen cell filled with the colour's light, the
  symbol dark on it, a small glow. No colour names, no blurb, no footer line
  (a hover title still names the colour). A cell is never narrower than
  40 px; when six no longer fit, the band keeps its cells and slides, with an
  arrow at each end that nudges two cells at a time, the exhausted end's arrow
  fading, and the chosen colour brought into view when the Menu opens. From
  320 px up all six fit and no arrow shows. With Colorless current the row
  shows a colour well and "Reset to gray", wrapping cleanly.
- The colour's element plays across the whole tray at a whisper (behind the
  rows faintly, fuller in the space below Theme) over a pool of the colour's
  light that fades in from nothing at the foot. Colorless's tray gets a
  fuller scatter of smaller, slightly brighter shapes so it does not vanish.

### Ask a Question (`quick-question.html`)

- The attached card is the hero: the front card full size on a lit stage,
  one neighbour peeking out each side, the rest off-stage; arrows, ←/→, or a
  tap on a neighbour turns the ring. No caption under a card (text only when
  the image is unavailable). No stage at all when nothing is attached.
- ✕ Remove straddles the card's top-left corner, ⓘ Details the top-right,
  half above the frame so the printed name is never covered. The dots under
  the ring sit in a small dark pill with a "n / 10" count.
- Up to **10** cards attach (today's stack limit, `stackLimits.ts`), not 5.
- The glow round the front card is a plain drop shadow plus a whisper of the
  colour's light; the stage's glow is dim.
- **Add card** and **Scan** sit beside the title; Add card opens the search
  above the question box (thumbnail, name, type per result; a pick slides the
  card onto the stage). On a phone with search open the ring folds into a
  strip of thumbnails so search, results and the box stay on one screen.
- The question box is one pill: **Add in-depth details** as a pill at its
  left end (glyph only under 480 px), the text, the count, and the round
  send. One line of text: one row. Once the text wraps, the text takes the
  full top row and the controls step down to a row of their own beneath it
  (In-depth left, count + send right). The box grows to about seven lines
  then scrolls. The hint shortens in tiers to whatever fits on one line
  ("What would you like to know?" → "Ask your question…" → "Ask…").
- The 300-character budget is a ring traced round the send pill's edge in
  the colour's light, over a faint track, brighter in the last 30 characters,
  closed at 300. **It starts at the top of the split between the mic and the
  arrow and runs clockwise** (over the arrow, round, back under the mic), and
  **at 0 characters nothing is drawn** — no track, no fill, no dot — until the
  first character (Round 15). The count is hidden while the box is empty. No
  separate Send Request button, no bar under the box, no hint phrases under
  the title.
- **The send is one pill with two halves: a microphone at the left, the
  arrow at the right**, in every place a question is typed (here, the
  follow-up, In-depth's question and its follow-up). A tap on the mic
  listens — the half glows, the box reads "Listening…", and what is said
  types into the box — using the browser's own speech recognition (the
  phone's dictation engine). Nothing server-side. Where the browser has no
  recognition the mic half is absent and the pill is the arrow alone.
- "Add in-depth details" carries the attached cards into In-depth, where
  each is placed in a zone at the Cards step (below). No line explaining
  that; the pill says it.
- The answered view is today's chat: a **Cards strip** at the top (every
  attached card one tap away; a card appears once — the judge's message
  keeps tappable names, never thumbnails), your question in the accent on
  the right, the ruling in a solid panel-filled bubble under the colour's
  seal, a pill composer with the same send. **A card the judge names sits in
  a chip** (a tint of the colour's light, a hairline, a solid underline;
  hover/press brightens; a tap opens the card's detail).
- Two ways on from a ruling: **✎ Edit cards** returns to the request exactly
  as it was (cards and question kept) to change and ask again; **↺ Start
  over** wipes to a clean page. Both top-right beside the title.
- **The wait is the shipped one** (`askAiWaitStages.ts`, word for word, at
  the app's own thresholds — 3 s, 8 s, 15 s, 25 s, 40 s) played inside the
  judge's bubble: each line inks itself in letter by letter with a glow that
  fades, the line before lifts and fades, an elapsed clock ticks at the foot,
  two motes of the colour's light drift up through the bubble, a faint
  dashed ring turns round the seal, and the bubble's edge breathes in the
  colour's light. The absurd lines lean into italics.
- The card-detail sheet: art leads, name over it with the mana cost, one type
  line with colour pips, oracle text in a framed box, three fact tiles (mana
  value · subtypes · price). Sizes to its content; close top-right.

### In-depth details (`in-depth-question.html`)

- Title "In-depth details"; the Menu marks Ask a Question as current; the
  round ‹ beside the title goes back a card inside the context step, then to
  Cards, and on step 1 back to the question page. Every in-depth detail
  today's form carries is kept — nothing deleted.
- **Four stations on a progress rail**: 1 Game · 2 Zones · 3 Cards · 4
  Context. The ruling is not a station: when it arrives the rail and flow
  leave and the chat takes the panel. The rail's stations are tappable but
  Context bounces back to Cards while any carried card is unplaced.
- **The way forward is part of each panel**: a lit bar along the foot of each
  step's plate (and of the card shelf and the context sheet) that names the
  next step ("Continue · next: which zones are in play", "Next card", "Finish
  context · next: your question"). No floating confirm button. Back and
  Continue are the same width where both show; Continue is full width on a
  phone, right-aligned on desktop.
- **Step 1 Game is one plate**: players (a square − / + stepper, 2–8, today's
  roster cap) with names and life totals behind an expander, then Turn phase
  and Active player, under one "Game context" heading. Behind one shared
  "More details for all players" toggle each player keeps Poison · Energy ·
  Experience, Commander damage from each other player, and Named counters
  with "Add a named counter". A player's typed name carries through the
  whole flow (Active player, Owner, Cast by, Targets, "Commander damage
  from …", the review, the frozen context, the ruling). No round steppers
  anywhere.
- **Step 2 Zones**: the seven-zone checklist as tiles that glow when chosen
  (the zone tiles and summary chips are solid, empty zones dashed).
- **Step 3 Cards**: **Add card** and **Scan** on a row of their own directly
  under the rail and above the zone tabs (equal halves on a phone, own width
  from 480 px). A tab per chosen zone with its count. A lit shelf of real
  card images; on the Stack the reorder reminder sits lit between the tabs
  and the shelf ("Top resolves first, then 2nd, 3rd… down to the bottom.
  Drag a card to reorder it (hold first on a phone), or tap it for Move up /
  Move down"). A walk from step 1 starts with empty zones ("Begin
  stackening!" on an empty Stack). Cards arrive by search, scan, or carried
  from the question.
- **Stack tags**: TOP alone for one card; BOTTOM / TOP for two; from three,
  the ends read BOTTOM and TOP and the cards between count down from the top
  (TOP, 2ND, 3RD … BOTTOM). Only the Stack wears tags, because only there
  does order change the ruling.
- **Every zone reorders by drag** (a mouse drags at once; touch after a
  short hold, a plain swipe still scrolls the shelf; the card's image is
  inert so the browser's own image drag never starts); the tags renumber.
  The Stack also offers ↓ Down · ↑ Up · ⤒ To top; other zones ‹ Left ·
  Right ›.
- **Carried cards are placed one at a time**: the same sheet as the context
  step, the card as hero, "Which zone is it in?", one tile per zone chosen at
  step 2, "Other zones ▾" for the rest (picking one adds that zone to the
  chosen set and it alone joins the tiles for the next card; the rest fold
  back). A counter reads "1 / n to place"; "Leave this card out" drops it.
  **Guardrail**: nothing past the Cards step until every carried card has a
  zone. Search excludes carried cards.
- **A tap on any shelf card opens its menu** (a pop-over beside the card on
  desktop — under, over, or beside it, pointing at it; a bottom sheet on a
  phone): the card's thumb, zone and name; **Move to** as a wrap of small
  pills with the current zone lit; the order control as one segmented pill;
  **Card details** and **Remove from the Stack / <zone>** as tray-style rows
  (glyph, words, chevron) under a hairline. Each Move to pill wears a small
  line-drawn sign, 15–16 px, stroked in the colour's light at 0.50 opacity,
  nothing filled; the current zone's sign at full with a small glow. **The
  signs are dealt at random** from a pool of fourteen (a pile of cards, a
  shield, a fan of cards, a headstone, a spark, a closed book, a crown, a
  crescent moon, an eye, a key, an hourglass, a rune, a comet, a sigil ring)
  every time the menu opens, one per pill, no two alike; a sign never names
  its zone. The pool's paths are in the page (`SIGN_POOL`).
- **Step 4 Context is one compact sheet per card**: the card's art at the
  left (210 px desktop, 96 px phone with the form below), a small counter
  ("1 / n cards"), "Skip to review" in the eyebrow. Fields are selects, not
  chips, per zone as today: Owner for every zone but the Stack; Cast by on
  the Stack; **Mana spent** on the Stack and the Battlefield as a plain
  number box **prefilled with the printed cost** (hint "printed {R}");
  **Targets is one picker** whose list is No target · Just on the board
  (Battlefield / Command Zone) · each player · All players · every other card
  in context (with its zone) · Something else (one line) — each pick becomes
  a pill with ✕ (a card pill carries its thumbnail), the picker resets to
  "Add another target…", a target can be picked once, naming every player
  folds into All players, "No target" and "Just on the board" replace the
  rest, blank means no target. Hand and Library skip Targets.
- **The note is folded** behind a slim "＋ Add a note" row beside **More
  details** on one line; a card with a note opens with it showing. More
  details is a sheet that slides over the card sheet (Done slides it away)
  holding the rarer settings: **Copies** (0–99, a five-row picker; the storm
  case — the review reads "+3 copies"). Future rare settings join that sheet.
- **The review**: rows show what was said ("cast by Chris · targets
  Counterspell") with ✎ to jump back; the list stops at a third of the screen
  and scrolls with a fade and a "10 cards · scroll the list for the rest"
  line; the zone tags at its foot (All · Stack 3 · …) light that zone's rows
  and dim the rest, never hiding any, scrolling to the first. The reviewed
  list collapses to one line of names so the question box has room. The
  question box is slim and grows; a blank box asks "How does this resolve?".
  No "Sending to TheJudge — phase, active player" line.
- **The chat** is today's chat with the Cards strip, **View context** beside
  the title (the frozen game context with each card's context), the same
  bubble, wait, chip, mic, ring and follow-up as Ask a Question; **✎ Edit**
  returns to the reviewed context with everything kept; **↺ Start over**
  goes to a clean Ask a Question.

### Trade Balancer (`trade-balancer.html`)

- The whole screen fits the viewport at 390×844 and 1440×900; only the entry
  lists scroll (one per side). On desktop the sides stop about 36 px short of
  the foot with each side's total in its foot; on a phone the sides keep a
  small buffer above the edge. Nothing below the fold.
- **Card images on every entry** (a tap opens the detail panel); card-as-hero
  does not apply here. Entries keep the order they were added; changing a
  printing or finish edits the row in place. Foil entries carry a moving
  sheen.
- Per entry: foil toggle, quantity stepper, Change printing. The **printing
  picker** rides the shared sheet: the card's art and name, one line of
  instruction, one row per set (name, code · year, thumbnail) with Nonfoil
  and Foil price pills — a tap picks that printing and that finish; a set
  with no foil price shows a disabled Foil pill; the filter box appears past
  five printings. A card with one printing reads "only printing".
- **Two piles of gold replace the scale** on a solid panel (same fill as the
  side panels, no glow, no wash). Each side's pile grows through five tiers —
  loose coins and a two-coin stack · two taller stacks · a mound with a stack
  at its peak · a larger mound with a purple gem and taller side stacks · the
  hoard, a chalice on the largest mound with coins scattered. Flat fills,
  gold and amber with a bronze outline, one purple gem. **Tiers are
  relative**: the richer side is always tier 5 and the lighter side's tier is
  its share of the richer (95%+ → 5 · 75%+ → 4 · 50%+ → 3 · 25%+ → 2 · under →
  1); the richer pile glows, the lighter dims a step. Tier-up drops in from
  above with a slight overshoot (550 ms, ~90 ms stagger); tier-down lifts and
  fades; nothing loops idle. The piles update live as cards are added. Empty
  state: the bare ground line and "Add cards to weigh the trade".
- **The verdict line** (under the piles), by the smaller side's share of the
  larger: 95%+ "Fair trade" · 85–95% "Slightly favors …" · 60–85% "Leans
  toward …" · under 60% "Lopsided — … by NN%"; "Even" when equal. The plain
  dollar difference sits beneath it ("Side A +$1.85"). No "even within $0 /
  $1 / $5" window.
- **New trade** is the only action: a ↺ New trade chip top-right beside the
  title on every screen. It asks first through the shared confirm sheet
  ("Start a new trade?", how many cards and how much clear, side names stay;
  Keep this trade / ↺ Clear both sides); an already-empty trade opens
  nothing. A side is renamed by tapping its name. The mockup's Add cash,
  Swap sides and Copy summary were tried and removed; today's app never had
  them, so nothing is taken from the shipped screen.
- On a phone: Side A / Side B as tabs sharing one panel, both totals in the
  tab labels (REQ-204 as written). Desktop: side by side, unchanged. The
  price date sits in the header on desktop and under the title on a phone.

### Card scan (`card-scan.html`)

Today's scanner (`ScanCameraSurface`, `ScanReviewBubble`; DEC-052…062) with
every part kept, in the new chrome:

- The viewfinder is a lit frame in the colour's edge with three bands that
  never overlap: the indicator pill and the count pill on top, the card
  guide in the middle, sound · credit · Debug at the foot.
- The guide is a thin line of the colour's light that breathes slowly while
  locking (no flashing glow); the lock outline on the card is a thin, slow
  marching dash of the colour's light. The indicator ("Locking on Lightning
  Bolt" with the vote bar · "Good — hold steady" · "Camera unavailable" ·
  the searching hints) is a themed pill.
- **Capture is a camera shutter** in the middle of the foot band: a ring of
  the colour's light round a filled disc that sinks when pressed (54 px ring,
  40 px disc). It still reads one frame by hand and the hint says so. "Powered
  by Cardomancer" is a quiet line under the frame, above the hint.
- **The way out is a box with an ✕** above the camera's top-right corner, and
  the only way out; the ‹ back arrow is absent while the camera is open.
- **One count**: the pill in the frame's top right. Its list is only what
  was scanned here ("Scanned just now"), never typed cards, with Remove; its
  foot says "These join your question (the Stack, Side A) when you close the
  scanner." No "Adding to your question" line, no "✓ n added" chip.
- **A yellow caution triangle** beside the count; a tap opens a pop-up:
  "Card scanning is experimental — this feature is experimental and isn't
  fully functioning yet…" with Got it.
- **Debug** dresses the shipped overlay in the colour: the detected card's
  outline and the art region on the feed, and the live numbers (match,
  thresholds, frame, camera) as a grouped panel under the frame with small
  bars for votes, glare, sharpness and quality.
- Every Scan button on the three flows opens the scanner and comes back to
  where it was, adding into the zone or side it left from.

### Question History and Send feedback (shared sheets, `flow.js`)

- **Question History** holds one list for both modes (today each screen shows
  only its own mode's; the store keeps the last 20, `MAX_ENTRIES` in
  `conversationHistory/persistence.ts`). Header: the title and "n of 20"; no
  "Past questions from this session". Every row: the question's cards as a
  small fan of thumbnails (three, then "+n"; a dashed frame for none), the
  question, the first line of the ruling, and one meta line (Quick or
  In-depth · cards · the game context for In-depth · follow-ups · when). On a
  phone a tap closes the sheet and reopens that conversation live in Ask a
  Question (cards in the strip, the thread, "Reopened from your history"
  under the title, the follow-up box ready). From 600 px the panel is two
  panes — the list, and the chosen conversation read in full with **Open
  conversation** and **Delete this question** at its foot.
- **Send feedback** is today's form (`FeedbackModal.tsx`) in the shared
  sheet: the type as three pills (Bug · Suggestion · Other) with the box's
  hint changing with it, what happened, an optional reply email, the app
  snapshot folded behind one dashed row that opens to what it holds, Send
  turning the sheet into a thank-you under the colour's seal, an empty box
  told so before anything sends.

### Life Tracker (`life-tracker-menus.html`; REQ-202)

- **The table is untouched to the pixel**: the 2×2 seat grid, life numbers,
  rotated labels, rounded cards, gutters, inboard + / −, day/night, the seat
  map, the gear. Only the header above it reads the new chrome (the
  before/after pair in `before/` and `after/` proves it).
- **Game Setup** (behind the ⚙ gear) is one phone screen: **Reset life
  totals** and **New game** as tray-style rows that ask first through the
  shared confirm sheet, one line each; a **Players** stepper (2–8) with the
  name fields as compact boxes carrying the seat number at the left, two to a
  row; **Starting life** directly under Players as pills (20 · 25 · 30 · 40 ·
  Custom, 1–999) with its rule line ("2 players start at 20 · 3+ at 40" and
  "applies at the next reset"); **Layout** (Grid · List) and **Card style**
  (Ombre · Flat) closing the sheet as a labelled pair of segmented pills.
  Every control, option, default and range is the shipped one
  (`GameSetupPanel.tsx`); only the clothes changed.
- **A player's Counters** (the seat map on their card): two tabs. **Commander
  damage · lethal at 21** is the seat map and nothing else — a tile per other
  seat with the player's name, the number and one joined − / + pill; at 21
  the tile's edge lights red with a small LETHAL tag; your own seat is drawn
  like your card (name, life total muted behind, "your seat"); no explaining
  line. **Counters**: today's eleven named counters as tiles that add one on
  a tap and light above zero, a ⋯ on each tile opening a row to take one
  away, set a number or clear (today's long-press stays too), and Custom
  counters as the same tiles with a remove ✕ and the add field with today's
  three errors (`CounterPanel.tsx`).

## Current-state PRD truth: what stands, what to amend, what to gate

**Stands as written** (applied to `PRD/sections/` by the mockup package on
2026-09-24, receipt `PRD/instructions/receipts/ui-reimagining-2026-09-24.md`):
REQ-200 (token set, restraint, the measured contrast floors), REQ-201 (the
motif kit and the no-Wizards-art rule), REQ-203 (the suite-wide Easter egg),
REQ-204 (phone side tabs), REQ-205 (the 44 px floor and its named offenders),
and the eleven amendments to REQ-044, REQ-046, REQ-056, REQ-060, REQ-099,
REQ-124, REQ-129, REQ-130, REQ-167, NFR-011, FLOW-007. Refinement should
read them, not rewrite them.

**Amend** (each is a settled design decision that today's text contradicts
or does not cover; the decision log is retired — amend in place, no new DEC):

- **REQ-202** says Game Setup, Reset/New Game, the commander-damage matrix
  and the counter palette are "untouched by the redesign packages". The
  owner asked for the back menus redrawn (Round 11) and approved the result
  (Rounds 13–14). Narrow it: Life Tracker's **table, state, persistence and
  behaviour** stay untouched and pixel-reviewed; the **sheets that open from
  it** (Game Setup, a player's Counters, the confirm) take the shared look
  with every control, option, default and range unchanged. The screenshot
  pair still gates every touching slice.
- **The Menu inventory / FLOW-007 and the two question flows' entries**:
  Quick Question and In-Depth Question become one destination, **Ask a
  Question**, with "Add in-depth details" as the seam and the attached cards
  carrying into the Cards step. Today's two routes stay as the in-depth
  flow's steps; what changes is the door and the carry. Amend the flow and
  screen-layout text that lists two question destinations.
- **Question History**: one list for both modes; a row reopens the
  conversation live; the phone's straight-in behaviour and the desktop two
  panes. Amend the history requirement's per-mode scoping.
- **Trade Balancer**'s composition: the gold piles with relative tiers, the
  verdict line and its four bands, the confirm on New trade, the printing
  picker's pill-per-finish. Amend the Trade Balancer README / REQ-064 family
  where they describe the scale or totals band; the pricing, totals
  arithmetic, price route and ephemeral posture are unchanged.
- **Card scan** presentation: shutter, ✕-only exit while the camera is open,
  one count pill scoped to this session's scans, the caution pop-up, Debug's
  look. Amend the scan DECs' presentation text; detection, thresholds and
  the review-bubble behaviour are unchanged.
- **The wait lines** are unchanged in text (`askAiWaitStages.ts`) but gain
  the inscription treatment; note it where the wait stages are specified.

**Gate at refinement** (behaviour that reaches past presentation; the owner
approved the look, but the run must decide the contract and ask if unsure):

- **Copies** on a Stack card (More details, 0–99). Today's context has no
  such field (`grep -ri copies apps/frontend/src` finds nothing). It either
  reaches the request and the prompt as a real field, or is dropped from the
  build. The owner accepted it as a "Try" (Rounds 7–8); ask whether it ships
  in the first build or waits.
- **Mana spent prefilled with the printed cost** on Stack and Battlefield
  cards: a default-value change to a field the request carries. Confirm the
  request still sends what today's form would, and that "printed" is what
  the prompt expects.
- **The Targets picker** replaces today's kind → value → Add rows with one
  list. Map every pick ("Just on the board", "Something else", All players,
  a card with its zone) onto today's target kinds so the request contract is
  unchanged, or amend the contract and say so.
- **Speech recognition** in the send pill is new: browser-native only,
  nothing server-side, absent where unsupported. Needs a REQ; decide whether
  it ships in the first build or as a follow-on slice.
- **Every zone reorders by drag**: confirm order in non-Stack zones is
  presentation only and does not change the request.
- **Cards carried from Ask a Question into In-depth**: new state hand-off
  between the two routes; confirm it lives in the existing context store.
- **Directions 2 and 3**: closed by the owner; the docs-PR text and README
  that promise them should say so.

## Constraints (do not rediscover)

- **Presentation-first.** Nothing here changes prompts, backend routes, card
  metadata, the data pipeline, or the mock/live posture; mock mode (the
  default) must still work on every screen. Anything in "Gate at refinement"
  above that touches the request contract is the exception and must be
  named as such in the DESIGN-BRIEF.
- **The mockup is not the code.** It is static HTML/CSS/vanilla JS in one
  folder with demo scaffolding (the DEMO strip, seeded cards, a still for the
  camera feed, six demo history conversations). The build ports the language
  into `apps/frontend`'s React components and today's state; it never ships
  the mockup files or copies its demo plumbing.
- **Fonts and assets ship locally.** The mockup loads Inter from Google
  Fonts; the build self-hosts it (or uses the system stack) — no runtime
  request to a font CDN, no new art ceiling (REQ-201, NFR-013). Card images
  stay Scryfall's as today.
- **The ambience canvas must be cheap on a phone** and fully obey
  `prefers-reduced-motion` through the existing motion baseline (NFR-006);
  density and alpha are single numbers per scene so they can be tuned down.
- **Life Tracker's table is pixel-untouched** and every slice touching shared
  chrome, tokens or the shared stylesheet attaches the 390×844 and 1440×900
  before/after pair to its PR (REQ-202).
- **The 44 px floor** on every control (REQ-205); the measured offenders in
  REQ-205 must clear it; nothing already at or above the floor shrinks.
- **The contrast floors in REQ-200** hold in all six profiles and for the
  custom Colorless lift; the wash never goes fully black.
- **No Wizards of the Coast glyph, icon font, logo, set symbol or card art**
  in chrome or decoration (REQ-201); the six symbols, the badges, the zone
  signs and the banner elements are this app's own drawings.
- **Card identity rings are a rule** (`cardIdentityRing.ts` on every card
  surface); the theme never colours a card's edge.
- **The Easter egg** (REQ-203) survives the new brand mark and header.
- **Parked, not this run**: combo over-assertion, rule-excerpt caps, NFR-002
  latency — unrelated queues; do not fold them in.

## Evidence + reusable tooling

- `docs/design/ui-reimagining/README.md` → "Iteration log": every round's
  rules and the owner's quoted words, Round 14 back to Round 2.
- `docs/design/ui-reimagining/OWNER-FEEDBACK.md`: the owner's notes per
  round, verbatim.
- `docs/design/ui-reimagining/renders/`: the approved final frames
  (`r13-menu-*`, `r13-lt-*`, `r14-idq-*`); earlier rounds' renders are in git
  history at the commits the README names.
- `docs/design/ui-reimagining/before/`: screenshots of the shipped app on
  2026-09-24 (the baseline every mockup page was paired against) and
  `after/` for the Life Tracker pair.
- To view: serve `docs/design/ui-reimagining/` (`python3 -m http.server 8138
  --bind 127.0.0.1`), open `direction-1/<page>.html?profile=<colour>`, phone
  390×844 and desktop 1440×900. Hard-reload after editing a `.css`/`.js`.

## What the graph run should produce

A DESIGN-BRIEF for **building direction 1 into `apps/frontend`** — the
token/ambience/shell layer first (REQ-200's tokens, the banner header, the
tray with the theme band, the shared sheet shell, the ambience canvas, the
Life Tracker before/after pair), then the flows one at a time (Ask a
Question with the carry; In-depth details; Trade Balancer; Card scan;
Question History and Send feedback; Life Tracker's two sheets), each slice
paired against its mockup page and today's tests. The gate questions carry
the amendments listed above and the seven "gate at refinement" items as
stable IDs so the owner answers each once. Map-out owns the slicing; the
order above is the dependency order, not a slice list. Nothing in the
"Decisions already made" list is reopened.

## How to hand this off

After PR #237 is merged, from the `main` checkout:

```
/graph-kickoff "Build the agreed direction-1 UI re-imagining into the shipped app" docs/design/ui-reimagining/GRAPH-BRIEF.md
```
