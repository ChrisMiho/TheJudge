# LOOK-GAPS — the running build against the approved direction-1 mockup

**What this decides:** what a look-matching pass has to change so the app on screen looks like the mockup you approved, screen by screen — and five questions only you can answer, where the mockup shows behaviour that a requirement you accepted later says differently.

**In plain terms:** The build works, but it does not wear the new look. Every screen still sits inside the old rounded "card" frame on a flat black page, with the old header (no glowing orb, no banner header, no mock-mode strip) and no visible colour scene behind it. Inside that frame, most new pieces exist but in the old styling: plain grey buttons where the mockup has glowing chips, stacked separate panels where the mockup has one lit panel with a "Continue ›" bar at its foot, and long scrolling pages (Trade Balancer is 2,909 px tall on a phone) where the mockup fits one screen. The Menu is the worst case: it opens clipped inside the old frame, with one oversized clock icon. The gap is the frame and the styling, not the features.

**What happens if you say no:** the build ships with today's look plus the new features, and the mockup stays a picture. The five questions at the end of the relevant sections still need an answer before a look-matching slice copies those mockup parts.

How this was made (2026-10-01): the build ran in mock mode (`PORT=3111 FRONTEND_PORT=5283 node scripts/dev.mjs`, backend log `askAiProvider: "mock"`) and the mockup was served from `docs/design/ui-reimagining/direction-1/` on port 4602. Both were driven with Playwright to the same state, Blue colour (the build's default Theme band cell; every mockup page's `data-profile="blue"`, forced with `?profile=blue`), and captured at 390×844 and 1440×900, full page. Measurements are `getComputedStyle` / `getBoundingClientRect` readings from the live pages. All captures live in `docs/design/ui-reimagining/build-screenshots/look-gaps/`. On the phone, the mockup hides its own demo strip; on desktop the dashed "DEMO" strip and foot note under each mockup page are mockup scaffolding, not app UI.

Card data differs in one honest way: the build's mock mode still uses the real card and price corpus, so prices, printings and the Trade verdict differ from the mockup's demo numbers. The mock AI answer is the prompt echo, not a ruling.

---

## Frame, Menu, Theme band and shared sheets

Applies to every screen below — fix this once and every screen moves most of the way.

- Mockup page: `direction-1/shared-chrome-menu.html` with `shell.css`, `tokens.css`, `flow.css`, `ambience.css`; the card-detail sheet from `quick-question.html` (ⓘ on the front card).
- States: page at rest; Menu open; Send feedback open; Question History open; card detail open.
- Colour: Blue. Build page used for the frame: empty Ask a Question (`/quick-lookup`).
- Pairs: `chrome-{build,mockup}-*`, `chrome-menu-*`, `chrome-feedback-*`, `chrome-history-*`, `card-detail-sheet-*` (each at 390x844 and 1440x900).

### Differences

Frame
- The build wraps every screen in the old `section.page-card`: a rounded card 359×616 px inset 16 px on a phone (768 px wide, x=336 on desktop), radius 24 px, fill `rgba(24,24,27,0.7)`, border `rgba(63,63,70,0.7)`. The mockup has no card: the header is full-bleed and the content column is `min(36rem, 92vw)` (359 px phone / 576 px desktop) on the page itself.
- Header: the build has no banner header. The mockup's `.app-header` is sticky, full width, 64 px tall (68 px desktop), a radial accent glow plus a vertical gradient, a hairline bottom border, `backdrop-filter: blur(8px)`. The build's header is a grid row inside the card, 49 px (56 px desktop), no background, no border.
- Brand: no orb in the build. The mockup has a 38 px round orb showing the colour's motif (`motifs/blue.svg`) with a breathing glow (`orb-breathe` 4.5 s). Wordmark: build 24 px / 700 (30 px on desktop), gradient `#38e1ff → #1e3a9c` (accent-soft → accent-strong). Mockup 19.2 px / 800 at every width, gradient accent-soft → accent-soft mixed 45% with text-primary (a light cyan, not dark blue). Tagline: build 14 px, regular, `#d4d4d8`, sentence case. Mockup 9.6 px / 600, uppercase, letter-spacing 0.18em, `#a1a1aa`.
- ☰ button: build is an 88×56 tab with a 24 px top-left corner radius, sitting inside the card at (17,13). Mockup is a 50×50 button (54×54 on desktop), 22.4 px glyph, in the header at x=10.
- Mock-mode strip: absent in the build. The frontend shows it only when `VITE_ASK_AI_PROVIDER` is `mock` (`apps/frontend/src/lib/env.ts:68`), and `scripts/dev.mjs` never sets it, so no slice ever saw it. The mockup's strip sits under the header: 0.72rem, fill accent 20% over the ground, hairline bottom.
- Page ground: build body `rgb(9,9,11)` flat. Mockup body is `--surface-wash` (wash-tint 55% into `#0d0d10`, a faint blue-black).

Colour scene and motion
- The build mounts `[data-testid="ambient-scene"]` (haze, dust, badge, runes layers), but it is positioned inside the page shell and none of it is visible in any capture: the page reads as flat black. The mockup's `.ambience` is `position: fixed; inset: 0` behind everything: two haze sheets (`blur(46px)`, opacity 0.62 / 0.5, 46 s / 64 s drift), the colour's line art (constellations and runes for Blue), and the colour's badge faintly in the centre. This is the single biggest "doesn't look like it" gap.

Menu (☰)
- Build: the Menu opens inside the old card and is clipped by it. On a phone it ends at y≈360 (the card's bottom), and the "Ask a Question" row is scrolled out of view at the top. On desktop it is a 256 px box whose top row is cut in half.
- Build: the Question History row shows a clock icon about 100 px tall (an SVG with no size set). The other rows have no icon, and labels are centred.
- Build: the Theme band is six separate 40 px square tiles, with the current one filled cyan and a ✓, plus ‹ › arrows. Only four tiles fit on a phone.
- Mockup tray: full height, `min(20rem, 86vw)` wide, slides from the left over a `rgba(0,0,0,0.55)` + `blur(2px)` backdrop. Head row has the orb, wordmark and a ✕. Rows are 48 px with a 28 px glyph column. The current row is lit, with a left accent bar and a ✓. A divider sits before Send feedback. Theme is one pill-shaped band of six motif icons, and the colour's flair animates at the tray foot.
- Desktop: the mockup tray is the same left drawer. The build's desktop Menu is a small floating box inside the card.

Shared sheets (Send feedback, Question History, card detail)
- Phone shape is right in both (a bottom sheet). Build sheets have no grab handle and no backdrop blur: the page behind is dimmed only. The mockup blurs it (`.drawer-panel` uses `backdrop-filter: blur(18px) saturate(1.3)` on the sheet, and the page behind is blurred).
- Sheet surface: the build is flat dark. The mockup has a radial accent glow in the top-right corner, a hairline in accent-soft at 32%, and a soft outer accent glow.
- Close button: build is a round button with a cyan ✕ and a cyan ring. Mockup is a 44 px rounded-square `.overlay-close` with a white ✕ on a glass fill.
- Send feedback: the build's type pills have no glyphs, and the selected one is a solid blue fill. Mockup pills are `✕ Bug` / `✦ Suggestion` / `… Other`, with the selected one outlined and glowing. Build labels are sentence case ("Feedback type", "What happened?"). Mockup labels are small uppercase eyebrows. The build's snapshot notice is a tall block with a "Show app-state details" button. Mockup: one dashed row, "◈ Your report includes a snapshot of the app right now ▾". The build sheet starts at y≈128. The mockup sheet starts at y≈348 (content-sized). The build's yellow "Feedback delivery isn't configured" line is environment-specific, not a look gap.
- Question History: the build's title reads "Question History — 1 of 20". The mockup has the title plus a muted "6 of 20". Build rows overflow to the right edge with no ellipsis, and have no mode badge and no chevron. Mockup rows have a stacked thumbnail fan with a "+3" badge, title, a one-line answer preview, a QUICK / IN-DEPTH badge, meta, and a › chevron. The mockup also has a foot note ("Your last 20 answered questions are kept on this device…"). The build had one entry (seeded by one real ask) against the mockup's six demo entries.
- Card detail: the build is a plain label list: Mana cost, Mana value, Type, Oracle text, Colors as stacked label/value pairs. The mockup has a 150 px art-crop hero with the name over it and the cost `{R}` in accent-soft. Under it: a type line with a colour dot, the oracle text in a lit box, and three fact chips (Mana value, Subtypes, Price in accent-soft). The build shows no price.

### Mockup values to reuse

- Tokens (copy whole): `tokens.css:40-47` (Blue accents and `--wash-tint`), `tokens.css:108-124` (`--surface-ground #09090b`, `--surface-wash`, `--surface-panel`, `--surface-edge` = accent 38%, `--text-primary #e2e8f0`, `--text-muted #a1a1aa`, fonts).
- Body: `shell.css:31-37` (`background: var(--surface-wash)`, flex column, `min-height: 100dvh`) — and remove the `section.page-card` wrapper.
- Header: `shell.css:63-81` `.app-header` (sticky, `grid-template-columns: 1fr auto 1fr`, `min-height: 64px`, gradient, border, shadow, blur). Orb: `shell.css:216-233` (38 px, motif background, `orb-breathe`). Wordmark: `shell.css:240-249` (800, 1.2rem, -0.01em, gradient). Tagline: `shell.css:251-259`. ☰: `shell.css:287-316`.
- Mock strip: `shell.css:325-332`.
- Content column: `shell.css:814-819` `.page-content` (pages override the width: Ask and In-depth `min(36rem, 92vw)`, `quick-question.html:17`).
- Scene: `ambience.css:32-58` `.ambience` (fixed, inset 0, z-index 0) and the haze sheets. The build's existing scene layers need this placement, not a new scene.
- Menu tray: `shell.css:336-345` backdrop, `shell.css:347-366` `.menu-tray`, `shell.css:453-470` tray brand, `shell.css:477-550` nav list (rows 48 px, glyph SVG 20×20 at `:550`), `shell.css:374-411` flair.
- Theme band: `shell.css:571-592` `.theme-band` / `.theme-orbs` (one pill, 3 px padding, 2 px gaps), `shell.css:614-657` `.theme-orb` (40 px cells, 46 px tall, end caps rounded at `:629-630`, current cell scale 1.08).
- Sheets: `shell.css:872-915` `.drawer-panel` (desktop centred card, glass fill, glow, blur, `.overlay-close`), `shell.css:917-935` phone bottom sheet (`max-height: 88dvh`, radius 1.1rem top), `shell.css:433-447` `.sheet-backdrop`, `shell.css:738-741` feedback desktop size `min(30rem, 92vw)`, `shell.css:792-795` history desktop size `min(52rem, 94vw)`.
- Card detail: `flow.css:280-317` `.detail-panel .art` / `.typeline` / `.oracle` / `.facts` / `.fact.price`.

### Conflicts with accepted requirements

- None found on this screen. The Menu's single Ask a Question entry, History right under it, and the six-cell Theme band all match the accepted blocks (REQ-067, REQ-107, REQ-131).

---

## Ask a Question

- Mockup page: `direction-1/quick-question.html`.
- States: five cards attached, empty question (the page's default); Add card search open; answered (quick wait).
- Colour: Blue. Build state: `/quick-lookup` with Lightning Bolt, Sol Ring, Llanowar Elves, Swords to Plowshares, Counterspell attached (the mockup's first five), Lightning Bolt in front. Search state: "Lig" typed (the build needs 3 characters). Answered: the question "How do Lightning Bolt and Counterspell interact on the stack?" sent and answered by the mock.
- Pairs: `ask-question-{build,mockup}-*`, `ask-question-search-*`, `ask-question-answered-*`.

### Differences

Layout and spacing
- The build stacks four panels inside the old card: the card stage, a separate search panel ("Search to add another card", always shown), the composer, and a "General rules topics" disclosure. The mockup has three things: the stage, the composer, and the search, which opens only from ＋ Add card, inside the composer. The mockup has no General rules topics row.
- Stage: build 333×257 px (718×302 desktop). Mockup 359×341 (576×459).

Type
- Page title: the build shows "ASK A QUESTION" as an eyebrow: 17 px / 600, uppercase, 0.08em tracking, gradient text. The mockup has an `h1` "Ask a Question": 18.4 px / 700 (21.6 px on desktop), `#e2e8f0`, -0.015em.

Colour and surfaces
- Stage: build fill `rgba(24,24,27,0.55)`, grey border, radius 16 px, no shadow. Mockup `--surface-panel`, accent-tinted `--surface-edge` border, radius 17.6 px (1.1rem), drop shadow `0 12px 30px -18px rgba(0,0,0,.9)`.
- Composer: build radius 24 px, border accent at 24%, 70 px tall on the phone. Mockup radius 25.6 px (1.6rem), border `--surface-edge`, 106 px on the phone when the controls wrap under the text (56 px on desktop).

Components present or absent
- Front card: build 160×223 px (192×268 on desktop), radius 8 px. The neighbour cards show as 10-px slivers. Mockup 196×274 (280×391), radius 11 px. Neighbours sit ±100 px (±160 on desktop), scaled 0.84 and dimmed, clearly visible. The build's arrows are bare ‹ ›. The mockup's are 40 px round buttons.
- Position indicator: the build has a "5 / 10" count pill in the bottom-right of the stage. The mockup has a dots pill "● ○ ○ ○ ○ 1 / 5", centred under the card.
- Add card / Scan: the build's are 87×44 grey buttons, 14 px / 600, no glyph, with Scan filled blue. Mockup: 106×44 `.icon-chip` with a ＋ / ▣ glyph in accent-soft, 13.6 px / 400, panel fill, radius 9.6 px.
- In-depth button: the build's is an icon-only 38×44 pill on the phone ("In-depth details" text on desktop), placed at the box's left on the phone. Mockup: "◈ In-depth" pill (35 px icon-only on the phone, 96 px with its label on desktop).
- Send: the build has two separate 44 px circles, a grey mic and a blue send with ↑. The mockup has one 80×40 pill split in two (mic | ➤), gradient accent → accent-strong, with the 300-character budget ring drawn round it (`.send-ring`).
- Search open: the build's results are a plain list under the field. The mockup's `.search-pop` opens inside the composer with a ⌕ glyph field and result rows (thumbnail, name, type).
- Answered: the build's head has the gradient eyebrow plus "✎ Edit cards", but no ↺ icon. Instead, a "Start Over" text button sits under the follow-up box. The build also shows a "VIEW CONTEXT · 5 cards" panel on Ask a Question, which the mockup has only on In-depth. There is no "CARDS" thumbnail strip. The mockup has the `h1` plus "✎ Edit cards" and a round ↺, a CARDS strip of five 32×45 thumbnails, your question as a right-aligned accent bubble, and the judge's reply in a bordered bubble with the colour's seal and a "THEJUDGE" label. Card names in the reply are lit chips.
- Follow-up box: the build shows a "0/300" count above the box, with separate mic and send circles. The mockup uses the same split pill as the composer.

Motifs and motion
- No card summon animation or colour scene visible in the build. The mockup's front card carries a quiet accent glow (`0 0 28px -10px` accent 45%).

### Mockup values to reuse

- `quick-question.html:17-23` (column width, `.qq` gap 0.8rem).
- `flow.css:26-46` `.flow-head` / `h1` 1.35rem / `.icon-chip` (44 px, radius 0.6rem, glyph accent-soft).
- `flow.css:52-61` `.stage`; `flow.css:66-99` `.ring` (`--card-w: 196px`, `--step: 100px`; 280 / 160 at ≥720 px; neighbour transform, opacity and blur formula; front-card shadow).
- `flow.css:118-146` `.card-widget` and `.arrow`; `flow.css:150-155` `.dots`; `flow.css:159-162` `.strip`.
- `flow.css:169-182` `.search-pop`; `flow.css:187-216` `.composer` / `.q-box` / textarea / `.q-count`; `flow.css:224-235` `.send-pair`; `flow.css:250-255` `.send-wrap` / `.send-ring`; `flow.css:263-270` `.q-box .deep`.
- Chat: `flow.css:345-353` `.chat`, `.chat-head`, `.chat-cards`, `.thread`; `flow.css:355-374` `.msg.you` / `.msg.judge` / `.seal` / `.who` / `.ref`.

### Conflicts with accepted requirements

- The count shown on the stage. The build shows "5 / 10", meaning how many of the 10 allowed cards are attached (REQ-167 raised the limit from 5 to 10). The mockup's stage shows "1 / 5", meaning which card you are looking at, and keeps "5 of 10 attached" in a thumbnail strip that is hidden by default. Should the look pass replace the build's count pill with the mockup's position dots, or keep the 10-card count on the stage?
- Searching before typing. The mockup's Add card opens a ready list of cards with nothing typed. The build, like today's app, waits for 3 typed characters ("Type at least 3 characters"). Should the search keep the 3-character minimum, with the mockup's look applied to the list it produces?

---

## In-depth details

- Mockup page: `direction-1/in-depth-question.html`.
- States: 1 Game (default); 2 Zones (Stack, Battlefield, Hand ticked); 3 Cards (Stack: Lightning Bolt, Counterspell · Battlefield: Sol Ring, Llanowar Elves · Hand: Swords to Plowshares, Lightning Helix; the Stack tab open); 3 Placing carried cards (three cards carried from Ask a Question, Stack and Battlefield chosen, first card up); 4 Context (Lightning Bolt targeting Llanowar Elves); 4 Reviewed; Ruling.
- Colour: Blue. The build reached each state through its own UI: cards added by search, "Begin stackening!" / "Add to Stack" / "Add card" confirm, Bolt's target set to "Battlefield: Llanowar Elves", "Skip to review", "Decrypt Stack". The placing state came from Ask a Question with three cards and the In-depth details button. The mockup's placing state used `?carry=Lightning Bolt|Sol Ring|Llanowar Elves` (its own demo-strip "Placing" jump shows nothing to place once its seed cards exist).
- Pairs: `in-depth-game-*`, `in-depth-zones-*`, `in-depth-cards-*`, `in-depth-place-*`, `in-depth-context-*`, `in-depth-review-*`, `in-depth-ruling-*` (build and mockup, both sizes).
- Timing note: the ruling pair is not like for like. The mockup page was caught 5 s into its wait (the wait bubble, "Priority is passing to the LLM.", 0:05). The build was caught answered (the mock answer).

### Differences

Frame and header
- Build: there is no screen title and no back button. The rail sits straight under the brand. The mockup has a round ‹ back button plus "In-depth details" as the page `h1`, then the rail.

Stations rail
- Close in structure: four nodes, a lit path, the current node ringed. Build labels are uppercase and tracked ("GAME", "ZONES"), and later stations are greyed and disabled. Mockup labels are sentence case at 0.72rem ("Game", "Zones"), with the current one in text-primary at 600.

Layout and spacing (every step)
- Build: each step is a gradient uppercase eyebrow ("GAME CONTEXT", "ADD CARDS TO ZONES", "CONTEXT ENRICHMENT") followed by two or three separately bordered panels, with free-standing buttons under them ("Confirm game context" full-width gradient; "Back" / "Continue" pair; "OK — next card"; "Back to zones").
- Mockup: each step is one `.plate` (radius 1rem, `--surface-panel`, shadow). Its way forward is the plate's own foot, a lit bar: "Continue · next: which zones are in play ›". The `.plate-next` has an accent gradient at 24%→6%, a hairline top, and is 52 px tall. There are no separate Back buttons; the ‹ in the header does that.
- Step 1: the build splits "Players in game" and "Turn phase / Active player" into two panels, with native selects. The mockup puts them in one plate, with custom selects (accent-soft chevron). The player stepper is − / + square buttons in both, but the mockup's + is accent-outlined and its "▶ 2 players" expander is one wide button.
- Step 3 Cards: the build has a search field plus a "Scan" button inside the panel, a "STACK CARDS (2)" sub-panel, and a "Card actions" button under each card. Bottom/Top tags sit at the card's top edge. The mockup puts an "＋ Add to Stack / ▣ Scan" pair as a row of its own under the rail, with the search opening from it. Zone tabs are pills "Stack 2" with the count in accent-soft (the build's are "Stack (2)" grey). The reorder hint is a lit `.shelf-hint` with ⇄. Cards carry ✕ and ⓘ widgets on their corners and have no button under them; a tap opens the card menu. The Bottom/Top tag straddles the card's bottom edge.
- Step 3 Placing: the build centres a large card, then the name, "Card 1 of 3", and all seven zones as small grey pills. The mockup uses the context-sheet layout: a 96 px card on the left; "FROM YOUR QUESTION / LEAVE THIS CARD OUT" eyebrow, name, type line, and a "1 / 3 to place" counter box on the right. Under them, only the chosen zones are shown as 48 px tiles with a radio mark, then "Other zones ▾". The mockup also shows a carry note above the rail ("3 cards came along with your question…"). The build shows none at step 1.
- Step 4 Context: the build puts the card art (≈96 px) in a left column, and all fields (Cast by, Mana spent, Targets, Add a note, More details) in a narrow right column, inside a nested bordered box. It has no zone eyebrow, no card name heading, no type line, and no counter box ("Card 1 of 6" is plain text above). The mockup has art plus a head row (eyebrow "STACK · SKIP TO REVIEW", name "Lightning Bolt" at 1.2rem / 700, "Instant · {R}", counter "1 / 6 cards"). Under it, the form is full width: Cast by and Mana spent side by side, then Targets as pills with a thumbnail ("Llanowar Elves ✕") above the picker. "＋ Add a note" and "More details ▴" sit as two dashed rows sharing one line. The foot is the "Next card ›" bar.
- Step 4 Reviewed: the build's review is a long grouped list (Turn, Setup, then each zone's cards as bordered rows with "✎ Edit"), then a "Sending to TheJudge" summary panel, an "OPTIONAL QUESTION" box with a text "Send Request" pill, and a "Back to zones" button. The page is 1,290 px tall on the phone. The mockup has one plate, "CONTEXT REVIEWED · 6 CARDS · Collapse ▴". Its rows carry a 30×42 thumbnail, the name, a zone tag in accent-soft, a "cast by · targets" line, and a ✎ icon. The list is a scrolling area capped at 34dvh, with a fade, then "6 cards · scroll the list for the rest" and zone filter pills (All 6 · Stack 2 · Battlefield 2 · Hand 2). Under the plate: "YOUR QUESTION — optional" and the same composer as Ask a Question, with the split mic | ➤ pill.
- Ruling: the build has no chat head. It shows a "VIEW CONTEXT" panel at the top, the answer as plain text (no bubble, no seal), and a "Start Over" text button under the follow-up box. The mockup has an "Ask a Question" `h1` with "◈ View context", "✎ Edit" and a round ↺. Under them: a CARDS thumbnail strip, then your question as a right-aligned bubble and the judge's bubble with its seal.

Colour and surfaces
- Zone tiles (step 2) and zone pills: the build uses checkbox tiles. The mockup's checked tile glows: border accent-soft, fill accent 22% into the panel, outer glow `0 0 22px -6px`, the colour's motif faint in the corner, and the mark filled with ✓.
- Shelf cards: the build adds a coloured border round the whole shelf plate. The mockup's shelf cards carry `0 10px 24px -10px` accent shadows on a plain plate.

Motifs and motion
- Current-node pulse: the mockup's `node-pulse` runs 2.6 s with a double ring. The build's ring is static in the captures.

### Mockup values to reuse

All in `in-depth-question.html`:
- `:14-16` column.
- `:20-48` rail (`.rail`, `.fill` gradient + glow, `.node` 26 px, done and current states, `node-pulse`).
- `:55-66` `.plate-next`; `:67-75` `.flow-head .lead`, `.attach`, `.carry-note`; `:80-87` `.plate` and its `h2` / `.lede`; `:121-122` custom select chevrons.
- `:125-138` zone tiles; `:141-144` zone tabs; `:149-167` place zones and Other zones; `:169-173` `.shelf-hint`; `:174-195` `.shelf` and its card, drag and drop states; `:233-243` shelf widgets and the `.pos` order tag.
- `:255-299` context sheet grid, `.ctx-art`, `.ctx-head`, `.counter`, `.ctx-form`, `.pill`; `:361-374` `.more-row` / `.ctx-tail` / `.note-row`.
- `:302-319` and `:410-424` review list, rows, filters, count line, question label.

From `flow.css`: `:345-374` chat and messages; `:393-414` wait bubble (`.msg.judge.waiting`).

### Conflicts with accepted requirements

- Mana spent on every zone (REQ-210, your edit: "just include in all the zones for now"). The mockup shows the Mana spent box only on Stack and Battlefield cards (`in-depth-question.html:712`, `hasMana = zone === 'Stack' || zone === 'Battlefield'`), so a Hand or Graveyard card's sheet in the mockup has no box. Should the look pass copy the mockup's field styling but show the box on every zone's card, as your edit says?
- Carried cards and the Draft (REQ-206, your edit: the Draft starts at the first attached card, and carried cards survive a reload, placed or not). The mockup's carry note says the cards "came along with your question", and its placing sheet offers "Leave this card out". Neither shows anything that contradicts saving them. No look conflict found. The build's placing sheet already survives a reload by design. Nothing to decide here unless you want a visible "saved" cue the mockup does not have.

---

## Trade Balancer

- Mockup page: `direction-1/trade-balancer.html`.
- States: the default "Leans" trade (Side A: Rhystic Study, Lightning Bolt · Side B: Birds of Paradise ×2, Counterspell (foil), Sol Ring ×2, Swords to Plowshares, Path to Exile, Lightning Helix); the printing picker open.
- Colour: Blue. Build: the same cards added through each side's search and printing picker (first priced printing, Counterspell foil). Real prices put the build at "Lopsided — Side A by 57%" against the mockup's "Leans toward Side A". The picker pair is Rhystic Study in both.
- Pairs: `trade-balancer-*`, `trade-balancer-printing-*`.

### Differences

Layout and spacing
- Fit: the mockup screen fits the viewport (`.tb` height = `100dvh` minus header and strip). The build page is 2,909 px tall on the phone and 2,218 px on desktop.
- Sides: on the phone, the mockup shows one side at a time behind a "Side A $35.20 | Side B $22.60" tab pair. Both sides show on desktop. The build stacks Side A then Side B on the phone, and puts them in two columns on desktop, both full length.
- Row height: build rows are about 150 px. Each has its own Foil / − 1 + row and a "Change printing" / "Remove" button row. Mockup rows are about 80 px: thumbnail, name, "set · code · Change" with Change as an inline accent link, unit price on the right, then Foil, a − 1 + stepper, and ✕ on one line.
- Add a card: the build has an "ADD A CARD" label, a full-width search, and a full-width "Scan" button inside each side. The mockup has an "＋ Add card / ▣ Scan" chip pair in the side's head row.

Components present or absent
- Scale: the build shows a verdict panel with two gold-pile icons and a bold sans verdict "Lopsided — Side A by 57%" / "Side A +$57.83". The prices date is inside that panel on the phone and in the header corner on desktop. The mockup has one `.scale` band: Side A's label, total ($35.20 at 1.35rem / 700, glowing accent-soft when heavier) and "2 cards" on the left; Side B's mirrored on the right. The piles are drawn SVG hoards with a gem and cup. The verdict is a serif italic line ("Leans toward Side A", Georgia), with the difference in small sans beneath. "Prices as of 8 Sep 2026 · USD" sits under the title.
- Title: the build shows a "TRADE BALANCER" gradient eyebrow. The mockup has an `h1` "Trade Balancer" plus a "↺ New trade" chip. The build's New trade is a small grey button.
- Side foot: the mockup has a "Side A total $35.20" foot bar. The build has none.
- Printing picker: the build lists every printing as rows with separate "Nonfoil $x" / "Foil $y" buttons ("Choose a printing — Rhystic Study · 11 printings"), with no art. The mockup has an art-crop hero with the name and cost, "Tap a price to use that printing and finish.", then rows with price pills (the `.detail-panel` shape).

### Mockup values to reuse

All in `trade-balancer.html`:
- `:16` `.tb` fit-to-viewport.
- `:23` `.asof`.
- `:30-42` `.scale`, `.pan`, `.total`, `.count`; `:51-52` piles; `:65-67` `.verdict` (serif italic, `small` for the difference); `:69-80` desktop and narrow variants.
- `:84-93` `.side-tabs` and `.sides` (tabs hidden and two columns on desktop).
- The `fit()` measurement at `:259-260`.

### Conflicts with accepted requirements

- The same card added twice. The mockup shows one row with a quantity ("Birds of Paradise ×2"). The build adds a second, separate row each time the same printing is picked. Should picking an identical printing raise that row's quantity, as the mockup shows, or stay as separate rows, as today?

---

## Card scanner

- Mockup page: `direction-1/card-scan.html`.
- States: "locking on" (the page default) and "camera unavailable" (mockup reference only).
- Colour: Blue. Build: Scan from Ask a Question. The headless test browser has no camera, so the build's viewfinder is black. The build did not switch to a camera-unavailable state, so the mockup's error state has no build partner.
- Pairs: `card-scan-*` (build and mockup), plus `card-scan-camera-error-mockup-*`.

### Differences

Frame
- The build hides the header and brand entirely: only ☰ shows, top-left. The viewfinder sits inside two nested rounded frames, about 358 px and 333 px. The page is 1,020 px tall on the phone, so it scrolls.
- The mockup keeps the header and mock strip, with a "Scan a card" `h1` and a 44 px ✕ exit (radius 0.7rem) on the right. The viewfinder is one panel and the page fits.

Components present or absent
- Build: a blank status dot and ✕ in a top bar; cyan hairlines above and below the feed; a 🔈 mute glyph inside the feed; "Powered by Cardomancer" inside the feed; a "Debug" pill under it; a full-width rectangular "Capture" button (about 305×36) outside the frame.
- Mockup: a lock indicator top-left ("Locking on Lightning Bolt", progress bar, 3/5). A round ⚠ caution button and a holding-count pill "✓ 2" top-right. Corner ticks on the guide (16 px, 2 px accent-soft) and a marching dashed lock outline round the card. A foot row with a mute pill, a 54 px round shutter, and a Debug pill. "Powered by Cardomancer" and the hint sit below the panel.

### Mockup values to reuse

All in `card-scan.html`:
- `:23` `.scan`; `:28-30` `.scan-exit`; `:40-51` `.feed` and the error state.
- `:58-66` `.guide` and its `.tick` corners, plus `guide-breathe`; `:76-85` `.vf-foot`, `.mute`, `.shutter` (54 px ring + 40 px disc); `:88-90` `.lock-outline` (`stroke-dasharray: 10 6`, `march` 2.4 s); `:93-101` `.indicator`.
- `:166-168` camera-error state.

### Conflicts with accepted requirements

- When a scanned card joins (REQ-214, your edit). Your edit says scanned cards wait in a holding list inside the scanner and join the zone or trade side only when the scanner closes; the count pill shows that list. The mockup's hint under the viewfinder still reads "Auto-scan is on: a confident match adds the card and keeps scanning" (`card-scan.html:217`). Should the look pass keep the mockup's "✓ 2" pill as the holding-list count, and reword that hint to say cards wait until you close the scanner?

---

## Life Tracker menus

- Mockup page: `direction-1/life-tracker-menus.html` (slice J compared these first; re-captured here so the record is complete).
- States: Game setup; Reset confirm; Counters for Player 2 (commander damage); Counters tab.
- Colour: Blue. Build: `/life-tracker` default (4 players at 40, Grid, Ombre), "Open game setup", "Reset current game", "Open counters for Player 2", and the Counters tab.
- Pairs: `life-tracker-setup-*`, `life-tracker-reset-*`, `life-tracker-counters-*`, `life-tracker-counters-tab-*`. Also `life-tracker-table-build-*`; its mockup partner is the existing `direction-1/life-tracker-table-{390x844,1440x900}.png`.
- Demo data differs: the mockup seeds Player 2 with 14 commander damage from Player 3, Poison 3, Treasure 2, and a custom "Storm count 4". The build is freshly reset.

### Differences

Game setup (closest of all screens)
- Sheet: no grab handle, and no blur behind (the table is only dimmed). The build sheet starts at y≈178. The mockup's starts at y≈215.
- Grouping: the mockup has a "THIS GAME" eyebrow over Reset and New game. The build has none.
- Players: the build has separate − (grey) and + (filled accent) circles, with a bare "4" between them. The mockup has one stepper pill "− 4 PLAYERS +" (`.stepper`), with "Edit names ▾" on the right.
- Starting life: the build's selected pill is a solid accent fill. The mockup's is an outline glow (border accent-soft, fill accent 24%, text accent-soft).
- Layout and Card style: the build shows separate pill buttons. The mockup shows joined segmented controls (`.seg`, full width) with glyphs.
- Foot: no "Done ›" foot bar in the build. Slice J kept the ✕-only close; see the conflicts below.

Counters (commander damage)
- Sheet height: the build sheet takes the whole screen (top at y≈10) and hides the table. The mockup's is a bottom sheet from y≈385, with the table blurred above.
- Title: the build shows "Counters for Player 2". The mockup shows "Counters · Player 2" plus a muted "40 life".
- Tabs: the build's are text only, "Player / Counters". The mockup's are glyph tabs, "⚔ Commander damage / ◈ Counters".
- Tiles: the build centres the name and value, with − above and + below. Mockup tiles have the name top-left, a large value, then a joined − | + stepper (`.seat`, value 1.9rem / 800). The mockup also has "lethal at 21" beside the eyebrow, and the own seat reads "your seat · life total" (build: "ME").

Counters tab
- Grid: the build uses 2 columns. The mockup uses 3.
- Icons and labels: the build's counter icons render greyscale and its labels are uppercase ("MONARCH"). The mockup's emoji are full colour and its labels title case ("Monarch").
- Options and active tiles: the build puts ⋯ beside the label. The mockup puts it in the tile's top-right corner. In the mockup, non-zero tiles glow in the accent (Treasure 2, Poison 3).
- Hint: the build reads "Tap to increment. Hold for more options.". The mockup reads "tap to add one · ⋯ for more".
- Custom counters: the mockup has a CUSTOM COUNTERS section with a name field and "＋ Add". It is not in the build's first screen.

Reset confirm
- Captured as a pair for the record. Not measured further: slice J already matched its words and its Keep / Reset buttons to the mockup. The remaining gaps are the shared-sheet ones listed under Frame (handle, blur, glass surface).

### Mockup values to reuse

All in `life-tracker-menus.html`:
- `:70-75` `.stepper` (pill, 46×44 buttons, value 6.5rem wide with a small uppercase caption).
- `:90-95` `.seg` (joined segmented control, pressed fill accent 24%).
- `:102-113` `.life-pills`, `.life-custom`, `.life-note`.
- `:116-122` `.seat-map` and `.seat` (two columns; `.who` with the LETHAL tag; `.dmg` 1.9rem / 800; lethal glow `rgba(255,77,109,0.6)`).

The sheet itself comes from `shell.css:872-935` (see Frame).

### Conflicts with accepted requirements

- Slice J already ruled two of these by following the requirement over the mockup, and this record should not re-decide them. The mockup's "Edit names ▾" toggle hides the name fields, but the accepted Game Setup copy shows them. The mockup's "Done ›" foot bar was not built, because the slice's own acceptance criterion keeps the ✕-only close. Should the look pass leave both as slice J built them? Slice J's reading is that both are leftovers from an earlier mockup round.

---

## Summary

- Frame, Menu, Theme band and shared sheets: far. The old rounded card frame, flat black page and old header are still in place. The colour scene is invisible, the mock strip is missing, and the Menu opens clipped inside the frame. The sheets have the right shape but lack the mockup's glass, blur and handle.
- Ask a Question: far. The pieces are all there, but in the old styling: a small card stage, a permanent search panel, grey buttons, a separate mic and send, and an extra rules-topics row. The answer view lacks the question-first bubbles and the card strip.
- In-depth details: far. The four-station rail is close, but every step is several old-style panels with free-standing buttons instead of one lit plate with a "Continue ›" foot. The context sheet, review list and ruling view are laid out differently from the mockup.
- Trade Balancer: far. The page is a 2,900 px scroll instead of one screen. There is no scale band with side totals, no side tabs on the phone, and the rows are oversized.
- Card scanner: far. The header and title are gone, the frames are nested, and there is a rectangular Capture button. There is no lock indicator, corner guide, holding count or round shutter.
- Life Tracker menus: close for Game setup (wrong control shapes and no sheet glass). Medium for Counters: a full-screen sheet, plain tabs, a 2-column greyscale grid, and stacked steppers.

## Captures

All under `docs/design/ui-reimagining/build-screenshots/look-gaps/` (92 PNGs):

- Frame: `chrome-build-390x844.png`, `chrome-build-1440x900.png`, `chrome-mockup-390x844.png`, `chrome-mockup-1440x900.png`, `chrome-menu-build-390x844.png`, `chrome-menu-build-1440x900.png`, `chrome-menu-mockup-390x844.png`, `chrome-menu-mockup-1440x900.png`, `chrome-feedback-build-390x844.png`, `chrome-feedback-build-1440x900.png`, `chrome-feedback-mockup-390x844.png`, `chrome-feedback-mockup-1440x900.png`, `chrome-history-build-390x844.png`, `chrome-history-build-1440x900.png`, `chrome-history-mockup-390x844.png`, `chrome-history-mockup-1440x900.png`, `card-detail-sheet-build-390x844.png`, `card-detail-sheet-build-1440x900.png`, `card-detail-sheet-mockup-390x844.png`, `card-detail-sheet-mockup-1440x900.png`
- Ask a Question: `ask-question-build-390x844.png`, `ask-question-build-1440x900.png`, `ask-question-mockup-390x844.png`, `ask-question-mockup-1440x900.png`, `ask-question-search-build-390x844.png`, `ask-question-search-build-1440x900.png`, `ask-question-search-mockup-390x844.png`, `ask-question-search-mockup-1440x900.png`, `ask-question-answered-build-390x844.png`, `ask-question-answered-build-1440x900.png`, `ask-question-answered-mockup-390x844.png`, `ask-question-answered-mockup-1440x900.png`
- In-depth details: `in-depth-game-{build,mockup}-{390x844,1440x900}.png`, `in-depth-zones-{build,mockup}-{390x844,1440x900}.png`, `in-depth-cards-{build,mockup}-{390x844,1440x900}.png`, `in-depth-place-{build,mockup}-{390x844,1440x900}.png`, `in-depth-context-{build,mockup}-{390x844,1440x900}.png`, `in-depth-review-{build,mockup}-{390x844,1440x900}.png`, `in-depth-ruling-{build,mockup}-{390x844,1440x900}.png` (28 files)
- Trade Balancer: `trade-balancer-{build,mockup}-{390x844,1440x900}.png`, `trade-balancer-printing-{build,mockup}-{390x844,1440x900}.png` (8 files)
- Card scanner: `card-scan-{build,mockup}-{390x844,1440x900}.png`, `card-scan-camera-error-mockup-390x844.png`, `card-scan-camera-error-mockup-1440x900.png` (6 files)
- Life Tracker menus: `life-tracker-setup-{build,mockup}-{390x844,1440x900}.png`, `life-tracker-reset-{build,mockup}-{390x844,1440x900}.png`, `life-tracker-counters-{build,mockup}-{390x844,1440x900}.png`, `life-tracker-counters-tab-{build,mockup}-{390x844,1440x900}.png`, `life-tracker-table-build-390x844.png`, `life-tracker-table-build-1440x900.png` (18 files; the table's mockup partner is `direction-1/life-tracker-table-{390x844,1440x900}.png`)
