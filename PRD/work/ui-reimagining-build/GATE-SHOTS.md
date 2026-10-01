# Gate shots — ui-reimagining-build

**What this is:** a visual aid for answering `GATE-QUESTIONS.md`. One entry per block, in the same order as that file, each with a plain-words caption and a **before** crop (today's shipped app, mock mode) beside an **after** crop (the approved direction-1 mockup). Read the block in `GATE-QUESTIONS.md` for what you are deciding; this file only shows you which thing on screen it is about.

**What you need to do:** nothing here. Answer the verdict slots in `GATE-QUESTIONS.md`; these images are reference only and are deleted with the package when the build closes.

**What it changes:** nothing. Captures were taken on 2026-09-30 at phone (390×844, 2×) and desktop (1440×900) widths; "after" crops come from `docs/design/ui-reimagining/direction-1/` served locally, "before" crops from the app in mock mode at the same commit. A block that only re-words an older entry to match another block says so and points at that block.

---

## REQ-167 — Ask a Question holds up to 10 cards, not 5

Today the page says "Add up to 5 cards" and lists the cards down the page. The mockup puts them on one stage with a count pill under it (here "1 / 9"); the cap becomes ten.

**Before (today):** ![REQ-167 before](gate-shots/qq-cap5-cards-390-before.png)

**After (mockup):** ![REQ-167 after](gate-shots/ask-stage-9cards-390-after.png)

## REQ-025 — Your own question opens the conversation

Today's answered page starts with the judge's text; your question is not drawn. The mockup starts with your question as a blue bubble on the right, then the judge's ruling.

**Before (today):** ![REQ-025 before](gate-shots/qq-answered-top-390-before.png)

**After (mockup):** ![REQ-025 after](gate-shots/ask-answered-390-after.png)

## REQ-099 — A custom Colorless colour is kept readable

The Colorless colour well and the Reset to gray row, shown with a deep indigo picked. The app lifts the colour just enough that the text stays readable while the hue stays. Today there is only a plain grey Colorless dot and no well in the Menu.

**Before (today):** ![REQ-099 before](gate-shots/theme-band-390-before.png)

**After (mockup):** ![REQ-099 after](gate-shots/colorless-well-390-after.png)

## REQ-210 — Mana spent can be set on Battlefield cards (new)

Today the Mana spent box appears only on a Stack card's form (Battlefield cards get none). The mockup shows the same box, prefilled with the printed cost, on a Battlefield card's sheet too.

**Before (today):** ![REQ-210 before](gate-shots/context-mana-390-before.png)

**After (mockup):** ![REQ-210 after](gate-shots/context-sheet-battlefield-390-after.png)

## REQ-211 — Copies on a Stack card (new) — recommend waiting

A Stack card's sheet gains a slim "More details" row; it opens a Copies picker (0 to 99) for storm-style questions. Before: no equivalent today.

**After (mockup):** ![REQ-211 after](gate-shots/copies-390-after.png)

## REQ-212 — Speak a question into the box (new)

The send button gets a microphone half on its left and the arrow on its right (outlined). Tapping the mic would start speech input.

**Before (today):** no equivalent today.

**After (mockup):** ![REQ-212 after](gate-shots/ask-sendpill-390-after.png)

## REQ-017 — The per-card context form becomes one compact sheet

Today one long form per card sits under a big card picture: Caster, Mana spent, Targets, Context notes. The mockup packs the same facts into one short sheet, card art at the left, with Add a note and More details as slim rows.

**Before (today):** ![REQ-017 before](gate-shots/context-form-390-before.png)

**After (mockup):** ![REQ-017 after](gate-shots/context-sheet-stack-390-after.png)

## REQ-021 — One Targets list that sends exactly what today's form sends

Today a target takes three steps: pick a kind (Player), pick a value (Player 2), press Add target. The mockup uses one list of ready choices; each pick becomes a removable pill. The list is a native dropdown, so it is shown here held open.

**Before (today):** ![REQ-021 before](gate-shots/targets-rows-390-before.png)

**After (mockup):** ![REQ-021 after](gate-shots/targets-picker-390-after.png)

## REQ-005 — Players can reorder the Stack

Today Stack cards sit in add order, first added is "bottom", newest is "top", with only Remove. The mockup shows the Stack as a shelf with BOTTOM, 2ND, TOP tags and a hint that a card can be dragged to a new place; the card menu (next block) also has Down, Up and To top.

**Before (today):** ![REQ-005 before](gate-shots/stack-order-390-before.png)

**After (mockup):** ![REQ-005 after](gate-shots/stack-shelf-390-after.png)

## REQ-206 — Ask a Question: one door for every question (new)

Today's Quick Question is a plain form with a card list and a Send Request button. The mockup is one page: card stage, one pill box with the round "In-depth" diamond at its left end (that is Add in-depth details, carrying your cards), and after sending, Edit cards and Start over beside the title with a Cards strip below. Phone view first, desktop under it.

**Before (today):** ![REQ-206 before](gate-shots/qq-cap5-cards-390-before.png)

**After (mockup):** ![REQ-206 after](gate-shots/ask-stage-9cards-390-after.png)

**Answered view with Edit cards / Start over:** ![REQ-206 answered](gate-shots/ask-answered-top-390-after.png)

**Desktop before (today):** ![REQ-206 desktop before](gate-shots/qq-page-1440-before.png)

**Desktop after (mockup):** ![REQ-206 desktop after](gate-shots/ask-page-1440-after.png)

## REQ-207 — The new frame: banner header, Menu, Theme band, and the colour's scene (new)

The frame around every screen. Today: a small ☰ and clock in the top-left corner, a plain dark ground, round theme dots. After: a banner with ☰ at the left and the orb and TheJudge wordmark centred, a Menu that slides in from the left, a six-cell Theme band, and a faint scene of the chosen colour behind the page (Green shown: falling leaves). The desktop mockup shows the Menu as a full-height left panel; the brief calls for a floating card, which the build makes (see the Menu-on-desktop block).

**Before (today):** ![REQ-207 before](gate-shots/header-390-before.png)

**Before (today):** ![REQ-207 before](gate-shots/menu-tray-390-before.png)

**Before (today):** ![REQ-207 before](gate-shots/theme-band-390-before.png)

**Before (today):** ![REQ-207 before](gate-shots/ambient-scene-390-before.png)

**After (mockup):** ![REQ-207 after](gate-shots/header-390-after.png)

**After (mockup):** ![REQ-207 after](gate-shots/menu-tray-390-after.png)

**After (mockup):** ![REQ-207 after](gate-shots/theme-band-390-after.png)

**After (mockup):** ![REQ-207 after](gate-shots/ambient-scene-390-after.png)

## REQ-208 — One pop-up shape for card detail, history, printings, feedback and "are you sure?" (new)

Every pop-up today is its own shape: card detail slides in from the right, history from the left, feedback is a tall sheet. After: one shared sheet, rising from the bottom on a phone and floating as a card on desktop. Card detail is shown first (phone), then Send feedback, then the printing picker and the new-trade confirm from Trade Balancer, then the desktop card.

**Before (today):** ![REQ-208 before](gate-shots/card-detail-390-before.png)

**Before (today):** ![REQ-208 before](gate-shots/feedback-390-before.png)

**Before (today):** ![REQ-208 before](gate-shots/trade-picker-390-before.png)

**After (mockup):** ![REQ-208 after](gate-shots/card-detail-390-after.png)

**After (mockup):** ![REQ-208 after](gate-shots/feedback-390-after.png)

**After (mockup):** ![REQ-208 after](gate-shots/trade-picker-390-after.png)

**After (mockup):** ![REQ-208 after](gate-shots/trade-newtrade-390-after.png)

**After (mockup):** ![REQ-208 after](gate-shots/card-detail-1440-after.png)


Before for the new-trade confirm: none pictured (today asks in the page itself); the printing picker before is Trade Balancer's picker from another block's capture.

## REQ-209 — In-depth details: four stations, the Cards shelf and the card menu (new)

Today's steps are separate screens with their own buttons. The mockup shows a four-station rail (Game, Zones, Cards, Context), a Continue bar inside each panel, a shelf of real card images with one tab per zone, and a menu that opens when you tap a card (Move to, order on the Stack, Card details, Remove). Phone, desktop, then the menu:

**Before (today):** ![REQ-209 before](gate-shots/stack-order-390-before.png)

**After (mockup):** ![REQ-209 after phone](gate-shots/indepth-stations-390-after.png)

![REQ-209 after desktop](gate-shots/indepth-stations-1440-after.png)

![REQ-209 card menu](gate-shots/card-menu-390-after.png)

## REQ-213 — Question History: one list for every question, reopened live (new)

Today History is a plain list of the last conversations in a left drawer, with a Delete button on each. After: one list in the shared sheet, each row a small card fan, the question, the first line of the answer, quick or in-depth, card count and how long ago. Tapping a row reopens it live.

**Before (today):** ![REQ-213 before](gate-shots/history-390-before.png)

**After (mockup):** ![REQ-213 after](gate-shots/history-390-after.png)

## REQ-214 — The card scanner in the new frame (new)

The card scanner. Today, with no camera, it is a black box with "Capture" and "Exit scan" text buttons and a Debug chip. The mockup adds a lit frame with status and count on top (locking on a card, progress), a round shutter button at the foot with sound and Debug beside it, an ✕ above the top right as the only way out, one count pill that opens the list of cards scanned this session, and a caution triangle that opens the "experimental" pop-up.

**Before (today):** ![REQ-214 before](gate-shots/scan-camera-390-before.png)

**After (mockup), locking on a card:** ![REQ-214 locking](gate-shots/scan-locking-390-after.png)

**After, count pill opened:** ![REQ-214 review list](gate-shots/scan-review-390-after.png)

**After, caution pop-up:** ![REQ-214 caution](gate-shots/scan-caution-390-after.png)

**After, camera unavailable:** ![REQ-214 camera error](gate-shots/scan-error-390-after.png)

## REQ-215 — Trade Balancer: piles of gold, a verdict line, New trade, named sides (new)

The band at the top of Trade Balancer. Today it is a text line ("Even trade" / "Side A is ahead by $0.32"). The mockup draws two piles of gold sized by each side's value, a verdict under them ("Leans toward Side A"), the dollar gap, and each side's total. A New trade button sits top right and asks before clearing (second after image). Each side's name is an editable field (the confirm says both sides keep their names). On a computer the two sides sit next to each other under the band (third after image).

**Before (today):** ![REQ-215 before](gate-shots/trade-piles-390-before.png)

**After (mockup):** ![REQ-215 after](gate-shots/trade-piles-390-after.png)

**After, New trade asks first:** ![REQ-215 New trade confirm](gate-shots/trade-newtrade-390-after.png)

**After, on a computer:** ![REQ-215 desktop](gate-shots/trade-sides-1440-after.png)

## REQ-202 — Life Tracker's back menus take the new look; the table stays untouched

Two sheets that open over the life table: Game Setup (gear) and a player's Counters panel (commander damage plus counters). Same content, new look. The table itself is unchanged; the last pair shows it today and in the mockup (only the header above it differs).

**Before (today), Game Setup:** ![REQ-202 setup before](gate-shots/lt-setup-390-before.png)

**After (mockup), Game Setup:** ![REQ-202 setup after](gate-shots/lt-setup-390-after.png)

**Before (today), a player's panel:** ![REQ-202 player before](gate-shots/lt-player-390-before.png)

**After (mockup), commander damage tab:** ![REQ-202 player after](gate-shots/lt-player-390-after.png)

**After (mockup), Counters tab:** ![REQ-202 counters after](gate-shots/lt-counters-390-after.png)

**The life table, today:** ![REQ-202 table before](gate-shots/lt-table-390-before.png)

**The life table, mockup:** ![REQ-202 table after](gate-shots/lt-table-390-after.png)

## REQ-006 — Stack order stays bottom-to-top when players reorder

Same meaning either way: first is bottom, last is top. Today it is shown as a "bottom / top" caption under each card; the mockup shows BOTTOM to TOP tags on the shelf, and a drag changes the order itself.

**Before (today):** ![REQ-006 before](gate-shots/stack-order-390-before.png)

**After (mockup):** ![REQ-006 after](gate-shots/stack-shelf-390-after.png)

## REQ-007 — The Stack's count lives on its zone tab

Today the Stack tab shows a count in brackets, "Stack (2)". The mockup's zone tab shows the live count as a number on the tab (outlined tab is Stack).

**Before (today):** ![REQ-007 before](gate-shots/stack-tab-390-before.png)

**After (mockup):** ![REQ-007 after](gate-shots/stack-tab-count-390-after.png)

## REQ-008 — Stack details live on the shelf and the card menu

Today the Stack is a row of cards with a Remove button under each. In the mockup the shelf is the Stack view and tapping a card opens its menu, which holds Remove and the reorder buttons.

**Before (today):** ![REQ-008 before](gate-shots/stack-order-390-before.png)

**After (mockup):** ![REQ-008 after](gate-shots/card-menu-390-after.png)

## REQ-018 — Card collection keeps bottom-to-top order and places carried cards

Nothing new to picture — see REQ-005 (the shelf order). Placing carried cards from Ask a Question has no equivalent today.

**Before (today):** ![REQ-018 before](gate-shots/stack-order-390-before.png)

**After (mockup):** ![REQ-018 after](gate-shots/stack-shelf-390-after.png)

## REQ-023 — The wait inks itself in, inside the judge's bubble

Today's wait panel could not be captured: mock mode answers instantly, so it never shows. The mockup's wait is the judge's bubble with one line inking in (here "Priority is passing to the LLM."), dots, and an elapsed clock (0:05) at its foot.

**Before (today):** not captured (mock mode answers instantly).

**After (mockup):** ![REQ-023 after](gate-shots/ask-wait-390-after.png)

## NFR-006 — Motion rule: the new wait and the colour scene stay CSS-only

Nothing new to picture — see REQ-023. The still shows the wait; the motion itself (glow, drifting lights, breathing edge) does not show in a still.

**After (mockup):** ![NFR-006 after](gate-shots/ask-wait-390-after.png)

## REQ-029 — Start over lands on a clean Ask a Question page

Today Start Over is a text button under the follow-up box. The mockup puts a round ↺ Start over (and ✎ Edit cards) beside the page title.

**Before (today):** ![REQ-029 before](gate-shots/qq-startover-390-before.png)

**After (mockup):** ![REQ-029 after](gate-shots/ask-answered-top-390-after.png)

## REQ-064 — Trade Balancer's difference gets a verdict and New trade

Same band as the block above. The difference line today only names an amount and the higher side; after it also carries the verdict wording and the New trade button beside the title.

**Before (today):** ![REQ-064 before](gate-shots/trade-piles-390-before.png)

**After (mockup):** ![REQ-064 after](gate-shots/trade-piles-390-after.png)

## REQ-065 — The printing picker gets a price pill per finish

Choosing a different printing of a card. Today it is a list inside the card's row, with a text price and a separate Foil toggle (the sample card has one printing; cards with many show one row each). In the mockup the picker is a sheet with the card's art and name, and each printing has a Nonfoil pill and a Foil pill with a price; one tap picks that printing and finish.

**Before (today):** ![REQ-065 before](gate-shots/trade-picker-390-before.png)

**After (mockup):** ![REQ-065 after](gate-shots/trade-picker-390-after.png)

## REQ-067 — The feature portal lists the one question door

The Menu's list of destinations. Today it lists Quick Question and In-Depth Question separately. After: one Ask a Question door, Question History under it, then Life Tracker, Trade Balancer, and Send feedback at the foot.

**Before (today):** ![REQ-067 before](gate-shots/menu-tray-390-before.png)

**After (mockup):** ![REQ-067 after](gate-shots/menu-tray-390-after.png)

## REQ-075 — Ask a Question's ruling view: your question first, cards in a strip

Today the answered view hides the attached cards behind a "View context — 2 cards" box and shows no question. The mockup shows a Cards strip of small card images at the top, then your question, then the ruling.

**Before (today):** ![REQ-075 before](gate-shots/qq-answered-top-390-before.png)

**After (mockup):** ![REQ-075 after](gate-shots/ask-answered-top-390-after.png)

## REQ-087 — Send feedback: type as three pills, snapshot folded

Today the feedback type is a dropdown and the snapshot note is a paragraph plus a button. After: Bug, Suggestion and Other as three pills, and the snapshot is one folded row you can open to see what goes with the report.

**Before (today):** ![REQ-087 before](gate-shots/feedback-390-before.png)

**After (mockup):** ![REQ-087 after](gate-shots/feedback-390-after.png)

## REQ-100 — One "More details for all players" toggle

Today each player row has an arrow, and either arrow opens or closes every player's extras at once (outlined). The mockup replaces them with one "More details for all players" link under the players (shown opened, reading "Hide details for all players").

**Before (today):** ![REQ-100 before](gate-shots/game-players-390-before.png)

**After (mockup):** ![REQ-100 after](gate-shots/game-more-390-after.png)

## REQ-103 — History: one list in the shared sheet, opened from the Menu

History moves from a clock in the corner to a row in the Menu that opens the shared sheet. Before is the left drawer with a short list; after is the sheet with one list.

**Before (today):** ![REQ-103 before](gate-shots/history-1440-before.png)

**After (mockup):** ![REQ-103 after](gate-shots/history-1440-after.png)

## REQ-107 — History is always one tap away in the Menu

The Menu row that opens History. Today there is no History row in the Menu; it is the clock button beside the ☰. After: Question History sits right under Ask a Question.

**Before (today):** ![REQ-107 before](gate-shots/menu-tray-390-before.png)

**After (mockup):** ![REQ-107 after](gate-shots/menu-tray-390-after.png)

## REQ-113 — The Menu tray floats as a card on desktop

The Menu on a wide screen. Today it is a narrow panel pinned inside the app frame. After: it slides in from the left; this mockup draws a full-height left panel, but the brief and this block call for an inset, rounded floating card sized to its content, so what you see is the direction, not the final look.

**Before (today):** ![REQ-113 before](gate-shots/menu-tray-1440-before.png)

**After (mockup):** ![REQ-113 after](gate-shots/menu-tray-1440-after.png)

## REQ-114 — The ☰ button's tap area matches what it paints

The ☰ button. Today it is drawn small in the corner rail. After: it sits at the left of the banner, about a quarter larger on a phone and a third on desktop, and the tap area is the same size as the drawn button.

**Before (today):** ![REQ-114 before](gate-shots/header-390-before.png)

**After (mockup):** ![REQ-114 after](gate-shots/header-390-after.png)

## REQ-115 — Menu-over-History occlusion has nothing left to cover

Nothing new to picture — see the header images in REQ-114. History now opens from the Menu, so today's clock button that the Menu could cover is gone.

**After (mockup):** ![REQ-115 after](gate-shots/header-390-after.png)

## REQ-127 — The open Menu hides the ☰ button and closes three ways

With the Menu open the ☰ is covered by the tray, so the only closers are the tray's own ✕, a tap outside, or Escape. Today the tray opens over the ☰ rail too, but the ✕ is not there.

**Before (today):** ![REQ-127 before](gate-shots/menu-tray-390-before.png)

**After (mockup):** ![REQ-127 after](gate-shots/menu-tray-390-after.png)

## REQ-128 — The card detail opens in the centre on desktop

Card detail on a wide screen. Today it is a tall panel pinned to the right edge. After: a card in the centre of the screen that fades up over the dimmed page.

**Before (today):** ![REQ-128 before](gate-shots/card-detail-1440-before.png)

**After (mockup):** ![REQ-128 after](gate-shots/card-detail-1440-after.png)

## REQ-131 — Theme orbs become the six-cell Theme band

The Theme picker. Today: six round colour dots with no names. After: one band of six flat cells, each with its colour's own symbol; the chosen one is lit.

**Before (today):** ![REQ-131 before](gate-shots/theme-band-390-before.png)

**After (mockup):** ![REQ-131 after](gate-shots/theme-band-390-after.png)

## REQ-132 — No separate Send Request button: send from inside the box

Today the box has a labelled "Send Request" button beside the text. The mockup sends from a round pill inside the box with no text label.

**Before (today):** ![REQ-132 before](gate-shots/qq-sendbutton-390-before.png)

**After (mockup):** ![REQ-132 after](gate-shots/ask-sendpill-390-after.png)

## REQ-012 — The submit action is the send pill

Nothing new to picture — see REQ-132 (same button, wording only).

**Before (today):** ![REQ-012 before](gate-shots/qq-sendbutton-390-before.png)

**After (mockup):** ![REQ-012 after](gate-shots/ask-sendpill-390-after.png)

## REQ-121 — The composer row's send control has no text label

Nothing new to picture — see REQ-132 (same button, wording only).

**Before (today):** ![REQ-121 before](gate-shots/qq-sendbutton-390-before.png)

**After (mockup):** ![REQ-121 after](gate-shots/ask-sendpill-390-after.png)

## REQ-200 — Colour rules: the custom Colorless exemption becomes the readability lift

Nothing new to picture — see REQ-099. The picked indigo here has been lifted to stay readable.

**After (mockup):** ![REQ-200 after](gate-shots/colorless-well-390-after.png)

## FLOW-001 — In-depth flow steps use the four stations

Nothing new to picture — see REQ-209. The steps are renamed to the stations Game, Zones, Cards, Context.

**Before (today):** ![FLOW-001 before](gate-shots/game-players-390-before.png)

**After (mockup):** ![FLOW-001 after](gate-shots/indepth-stations-390-after.png)

## FLOW-005 — Follow-up flow: the first question is shown

Nothing new to picture — see REQ-025.

**Before (today):** ![FLOW-005 before](gate-shots/qq-answered-top-390-before.png)

**After (mockup):** ![FLOW-005 after](gate-shots/ask-answered-top-390-after.png)

## FLOW-007 — Theme flow: a six-cell band, custom Colorless kept readable

Pick a colour in the Menu and the whole app takes it. Today: round dots. After: the six-cell band, and choosing Colorless shows the colour well and Reset to gray.

**Before (today):** ![FLOW-007 before](gate-shots/theme-band-390-before.png)

**After (mockup):** ![FLOW-007 after](gate-shots/theme-band-390-after.png)

**After (mockup):** ![FLOW-007 after](gate-shots/colorless-well-390-after.png)

## FLOW-009 — Trade flow: piles and verdict update live

Nothing new to picture — see REQ-215. The step is the same band: as cards are added or removed, the piles and the verdict change with the totals. Today's phone layout stacks Side A and Side B; the mockup uses a Side A / Side B tab switcher under the band.

**Before (today):** ![FLOW-009 before](gate-shots/trade-sides-390-before.png)

**After (mockup):** ![FLOW-009 after](gate-shots/trade-piles-390-after.png)

## FLOW-010 — Switching destinations: the ☰ Menu and one question door

Moving between screens through the ☰ Menu. Today two question rows; after, one Ask a Question row.

**Before (today):** ![FLOW-010 before](gate-shots/menu-tray-390-before.png)

**After (mockup):** ![FLOW-010 after](gate-shots/menu-tray-390-after.png)

## FLOW-011 — Ask a Question flow

The whole flow on one page: stage and pill box before sending, Cards strip, your question and the ruling after, with the follow-up pill at the foot. Today it is a single form (left) and a thread with no question bubble.

**Before (today):** ![FLOW-011 before](gate-shots/qq-cap5-cards-390-before.png)

**After (mockup):** ![FLOW-011 after](gate-shots/ask-answered-390-after.png)

## FLOW-014 — Send feedback flow: the ☰ Menu and the shared sheet

Send feedback opens from the foot of the Menu list into the shared sheet.

**Before (today):** ![FLOW-014 before](gate-shots/feedback-390-before.png)

**After (mockup):** ![FLOW-014 after](gate-shots/feedback-390-after.png)

## FLOW-016 — Resume from Question History

Nothing new to picture — see REQ-213. Tapping a row in the list reopens that question live.

**After (mockup):** ![FLOW-016 after](gate-shots/history-390-after.png)

## FLOW-017 — Draft flow: Question History instead of the rail

Nothing new to picture — see REQ-213. An unfinished question is found in the same Question History list, not a corner rail.

**After (mockup):** ![FLOW-017 after](gate-shots/history-390-after.png)

## FLOW-018 — Delete flow: from Question History, confirmed in the shared sheet

Nothing new to picture — see REQ-213. Deleting starts from a row in the list and asks first in the shared sheet; the mockup arms the button with a second tap. Today Delete sits beside each row in the drawer.

**After (mockup):** ![FLOW-018 after](gate-shots/history-390-after.png)

## REQ-045 — The enrichment view-mode toggle is retired

Today a button at the top of the context step flips between "View all cards" and "Card-by-card" (outlined, shown in its Card-by-card state). The mockup has no such toggle; the sheet is followed by a review list.

**Before (today):** ![REQ-045 before](gate-shots/viewall-toggle-390-before.png)

**After (mockup):** ![REQ-045 after](gate-shots/context-sheet-stack-390-after.png)

## REQ-056 — The View all cards row cap is retired

Nothing new to picture — see REQ-045. Today's View all cards mode caps edit rows per zone; the mockup's review list just scrolls.

**Before (today):** ![REQ-056 before](gate-shots/viewall-toggle-390-before.png)

**After (mockup):** ![REQ-056 after](gate-shots/context-sheet-stack-390-after.png)

## REQ-058 — Card rings on the context sheet instead of two enrichment modes

Nothing new to picture — see REQ-045. The card keeps its colour ring (red for Lightning Bolt) on the one sheet.

**Before (today):** ![REQ-058 before](gate-shots/context-form-390-before.png)

**After (mockup):** ![REQ-058 after](gate-shots/context-sheet-stack-390-after.png)

## REQ-116 — Top clearance no longer checks a History icon

Nothing new to picture — see REQ-114. With the clock button gone from the top corner, nothing there needs clearing any more.

**After (mockup):** ![REQ-116 after](gate-shots/header-390-after.png)

## REQ-136 — View Context clearance is measured against the ☰ header

Nothing new to picture — see REQ-207. View Context now clears the banner header (☰ and brand) instead of the old corner rail.

**After (mockup):** ![REQ-136 after](gate-shots/header-390-after.png)
