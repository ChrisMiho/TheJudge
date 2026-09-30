# Design brief — ui-reimagining-build

**What this is:** the plan for building the owner-approved direction-1 UI
re-imagining into the shipped app. A player picks a mana colour and the whole
app becomes that colour's place; Quick Question and In-Depth Question become one
**Ask a Question** door whose cards carry into a four-station **In-depth
details** flow; Trade Balancer weighs two piles of gold; the card scanner, the
pop-up sheets and Life Tracker's back menus take the same look. Life Tracker's
table is untouched to the pixel.

**What you need to do:** answer `GATE-QUESTIONS.md` (57 blocks in three groups;
nine are real choices, and the rest follow from the look you already approved).
Nothing here is written into `PRD/sections/` until the build applies what you
accept.

**What it changes:** presentation almost everywhere, plus three named changes
to what the AI receives, each its own gate block: the Ask a Question card cap
rises from 5 to 10 (REQ-167), a changed Mana spent on a Battlefield card reaches
the prompt (REQ-210), and Copies on a Stack card (REQ-211, recommended to wait).
Everything else leaves `AskAiRequest`, the prompts, the backend routes, card
data and the data pipeline exactly as they are. Mock mode stays the default and
must work on every screen.

- Package: `PRD/work/ui-reimagining-build/`
- Intake (evidence, not authority): `intake/GRAPH-BRIEF.md` — the owner's build
  brief from mockup rounds 2–14 (2026-09-24 → 2026-09-29)
- Proposal: `GATE-QUESTIONS.md`
- Mode: refinement ran orchestrated (graph run `graph-20260930-055958`, node 3
  `define`); the approval pause was replaced by the preparation contract's
  assumption ladder, and every material assumption is recorded below.

## Scope — what the player gets

### 1. The frame: colour, header, Menu, Theme (REQ-207, delivering REQ-200 / REQ-201)

- The chosen colour becomes the whole app's place: a flat dark ground (one
  colour per profile, no gradient), a slow, faint CSS-animated scene of the
  colour's element behind every page (White beams, Blue runes, Black fog, Red
  embers, Green leaves, Colorless turning geometry), and the colour's badge
  faint in the centre. Density and opacity are one number each per scene. Under
  reduced motion the scene is still.
- The header is a banner: ☰ at the left, the brand centred on a lit band that
  carries the colour's element, the cat-wizard Easter egg kept (REQ-203).
- The Menu slides in from the left (full height on a phone, a floating card on
  desktop) and lists **Ask a Question · Question History · Life Tracker · Trade
  Balancer**, then **Send feedback** past a hairline, then the **Theme** band:
  six colour cells, no names, sliding with arrows only when six 40px cells no
  longer fit.
- One typeface (Inter, self-hosted, system stack fallback), no corner
  decoration, every card keeps its colour-identity ring (REQ-058).
- This is also the first code delivery of the colour roles and contrast floors
  (REQ-200) and the app's own motif kit (REQ-201), which stand as written since
  2026-09-24 but are not yet in the code (verified: the code still runs the
  four accent tokens, `apps/frontend/src/index.css:822-825`,
  `apps/frontend/src/lib/theme/applyPalette.ts:3-21`, and a hard-coded body
  gradient at `index.css:866-869`).

### 2. Ask a Question (REQ-206; cap REQ-167; send pill REQ-132; dictation REQ-212)

- One Menu door. The page is today's Quick Question page (route
  `/quick-lookup`, `mode: "lookup"`) recomposed: attached cards on a lit stage
  (front card full size, a neighbour peeking each side), **Add card** and
  **Scan** beside the title, one pill-shaped question box with the send inside
  it and a 300-character ring traced round the send.
- **Add in-depth details** carries the attached cards (and the typed question
  when In-depth's box is empty) into In-depth details (route `/in-depth`,
  `mode: "game"`), where each card is placed in a zone.
- The ruling view: your question first (REQ-025), the ruling in a solid bubble
  under the colour's seal, a Cards strip at the top, card names in the ruling
  as tappable chips (matched against the conversation's attached cards), and
  **✎ Edit cards** / **↺ Start over** beside the title.
- The General rules topics disclosure and the locked topic pill stay.

### 3. In-depth details (REQ-209; context sheet REQ-017; targets REQ-021; order REQ-005)

- Four stations on a tappable progress rail — Game · Zones · Cards · Context —
  each with the way forward built into its panel. Every detail today's form
  collects is kept, including the combat sub-step and Additional game state.
- Cards: a lit shelf of real card images per zone tab; a card menu (Move to ·
  order · Card details · Remove) with shuffled line-drawn signs; drag reorder
  in every zone, with Stack order sent as shown; BOTTOM … TOP tags on the Stack.
- Carried cards are placed one at a time; nothing passes the Cards station until
  each has a zone or is left out.
- Context: one compact sheet per card; Targets as one picker whose picks map
  onto today's four target kinds (request unchanged); the note folded; Mana
  spent prefilled with the printed cost.
- A review lists each card's context in words, then the question box; the chat
  is the same as Ask a Question's, with View Context beside the title.

### 4. Trade Balancer (REQ-215; picker REQ-065; phone tabs REQ-204 as written)

- Two piles of gold with relative tiers and a verdict line ("Fair trade" …
  "Lopsided — … by NN%", "Even"), the dollar difference beneath.
- **↺ New trade** asks first through the shared confirm sheet; a side is renamed
  by tapping its name (both new — verified absent today:
  `apps/frontend/src/components/trade/TradeSide.tsx:60` fixes the label, and no
  clear/reset action exists in `components/trade/`).
- The printing picker moves into the shared sheet with a Nonfoil and a Foil
  price pill per printing; the set filter appears past five printings.
- The whole screen fits 390×844 and 1440×900; the price date moves to the
  header on desktop.

### 5. Card scan (REQ-214)

- The same scanner in the new frame: lit viewfinder with three bands, a shutter,
  an ✕ exit, one count pill (now on every host), a caution pop-up, a themed
  Debug panel. Detection, lock, auto-add and the ding are unchanged.

### 6. The shared sheet, Question History, Send feedback (REQ-208, REQ-213, REQ-087)

- One sheet shell: a bottom sheet below 600px, a floating centred card from
  600px, fixed head and foot, body scrolls. It hosts the card detail (now
  centred on desktop), Question History, the printing picker, Send feedback and
  the confirm sheet. View Context keeps its own 768px sheet/drawer.
- Question History is a Menu row: one list of both question kinds ("n of 20"),
  rows with a fan of card thumbnails; a tap reopens a conversation live in its
  own flow; two panes from 600px. The History rail icon is retired.
- Send feedback: today's form with the type as three pills and the snapshot
  folded behind a dashed row.

### 7. Life Tracker (REQ-202 as amended)

- The table (seats, life, layout, day/night, seat map, state, persistence) is
  untouched and pixel-reviewed.
- Game Setup fits one phone screen; Reset and New game ask first through the
  shared confirm sheet; a player's Counters has two tabs (the commander-damage
  seat map with LETHAL at 21; counters as tiles with a ⋯ menu). Every control,
  option, default and range is today's (verified in
  `components/portal/life-tracker/GameSetupPanel.tsx` and `CounterPanel.tsx`).

## Build order (dependency order for map-out, not a slice list)

1. Tokens + ambient scene + banner header + Menu tray + Theme band + font
   (REQ-200, REQ-201, REQ-207), with the Life Tracker before/after pair.
2. The shared sheet shell and confirm sheet (REQ-208), moving card detail,
   feedback and history into it.
3. Ask a Question door, stage, pill composer and ruling view (REQ-206, REQ-025,
   REQ-132, REQ-167) and the carry hand-off.
4. In-depth details stations, shelf, card menu, placement, context sheet,
   review, reorder (REQ-209, REQ-017, REQ-021, REQ-005; REQ-210 if accepted).
5. Wait inscription (REQ-023).
6. Trade Balancer piles, verdict, New trade, rename, picker pills (REQ-215,
   REQ-065, REQ-204).
7. Card scan chrome (REQ-214).
8. Question History one list (REQ-213).
9. Life Tracker's sheets (REQ-202).
10. Late slices, only if accepted: dictation (REQ-212), Copies (REQ-211).

Each slice applies its accepted `GATE-QUESTIONS.md` diffs to `PRD/sections/`
by intent, together with its code (new entries REQ-206…REQ-215 go after REQ-205
in numeric order). Each slice touching shared chrome, tokens or the shared
stylesheet attaches the Life Tracker 390×844 and 1440×900 before/after pair
(REQ-202).

## Decisions (proposed; each is a gate block)

| Decision | Id | Recommendation |
| --- | --- | --- |
| Card cap 5 → 10 on Ask a Question | REQ-167 | accept |
| Show your own first question in the thread | REQ-025 | accept |
| Keep a custom Colorless colour readable (lift, hue kept) | REQ-099 | accept |
| Mana spent on Battlefield cards reaches the prompt when changed | REQ-210 (new) | accept |
| Copies on a Stack card | REQ-211 (new) | **reject for this build** |
| Dictation from the send pill | REQ-212 (new) | accept |
| One compact context sheet; keep Targets on Hand/Library | REQ-017 | accept |
| One Targets picker mapped onto today's kinds | REQ-021 | accept |
| Players can reorder the Stack | REQ-005 | accept |
| One question door and the carry | REQ-206 (new) | accept |
| The frame, scene, Menu, Theme band | REQ-207 (new) | accept |
| One shared sheet | REQ-208 (new) | accept |
| In-depth details four stations | REQ-209 (new) | accept |
| Question History one list | REQ-213 (new) | accept |
| Card scan chrome | REQ-214 (new) | accept |
| Trade piles, verdict, New trade, names | REQ-215 (new) | accept |
| Life Tracker's sheets take the look | REQ-202 | accept |

Group 3 of `GATE-QUESTIONS.md` holds the 40 follow-on wording amendments that
keep older entries from contradicting these (REQ-006/007/008/012/018/023/029/
045/056/058/064/065/067/075/087/100/103/107/113/114/115/116/121/127/128/131/132/
136/200, NFR-006, FLOW-001/005/007/009/010/011/014/016/017/018).

## Non-goals

- No change to Life Tracker's table, its state, persistence or behaviour.
- No directions 2 or 3; the owner closed them. (`PRD/sections/` holds no text
  promising them — grep for "direction 2/3" finds nothing — so no PRD edit is
  needed; the docs README that mentions them is intake-cited and outside
  `PRD/sections/`.)
- No change to prompts, backend routes, providers, card metadata, the data
  pipeline or mock/live posture, beyond REQ-167's validation bound and, if
  accepted, REQ-210's Battlefield prompt line and REQ-211's copies field.
- The mockup files and their demo scaffolding (DEMO strip, seeded cards, the
  still camera frame, demo history) never ship; the build ports the language
  into `apps/frontend`.
- No script-driven or canvas animation, no animation or drag-and-drop library,
  no font CDN.
- The mockup's tried-and-removed Trade Balancer extras (Add cash, Swap sides,
  Copy summary) do not ship.
- Parked queues stay parked: combo over-assertion, rule-excerpt caps, NFR-002
  latency.

## Constraints carried

- REQ-200 contrast floors in all six profiles over the scene; the wash never
  goes fully black.
- REQ-201: no Wizards of the Coast glyph, icon font, logo, set symbol or card
  art in chrome; all art ships locally within the asset budget (NFR-013).
- REQ-205: every control ≥44px; the named offenders clear it; nothing already at
  or above the floor shrinks.
- NFR-006: CSS-only motion, reduced-motion honoured, transform/opacity only.
- DEC-117 / NFR-011: one component tree, structural media queries only (the
  new 600px boundary is structural, for the sheet family only).
- DEC-157 / REQ-140: URL is the source of truth; keep-alive mounting unchanged.
- REQ-202: the screenshot pair on every touching slice; no automated pixel gate.
- Card identity rings on every card surface; the theme never colours a card's
  edge.

## Assumptions and evidence (orchestrated mode)

Each resolved by the preparation contract's ladder: (1) PRD, (2) tested
behaviour/public contracts, (3) local patterns, (4) smallest reversible scope,
(5) preserve user-visible behaviour, (6) no new dependency/contract without
authority.

| # | Assumption | Rung | Evidence |
| --- | --- | --- | --- |
| A1 | The ambient scene is CSS-animated layers, not the mockup's script/canvas loop | 1 | NFR-006 constraint "implementation stays CSS-based — no animation library"; REQ-201 "no new motion trigger or timing system" |
| A2 | Inter ships as a self-hosted local font within the asset budget; if it cannot fit, today's system stack stands | 1, 6 | `index.css:869` already names Inter first but never loads it (no `@font-face`, no `<link>` in `index.html`); REQ-201 / NFR-013 forbid a new asset ceiling and a font CDN |
| A3 | Ask a Question is today's `/quick-lookup` page; In-depth details is today's `/in-depth`; both routes and request modes stay | 1, 2 | REQ-140 / DEC-157 URL-as-truth; `destinationRegistry.tsx:78-107`; intake "today's two routes stay" |
| A4 | The carry is in-memory frontend state using the existing cross-destination hand-off pattern; unplaced carried cards are not written to the Draft slot | 3, 4 | `apps/frontend/src/lib/portal/seedContext.tsx` (Life Tracker → In-Depth seed) is the only existing hand-off; Draft shapes in `lib/conversationHistory/persistence.ts:142,156` stay unchanged |
| A5 | The carry adds only cards not already staged or waiting, and In-depth opens at its current station; the typed question carries only when In-depth's box is empty | 5 | nothing typed or staged is lost (ladder rung 5) |
| A6 | The General rules topics disclosure and topic pill stay on Ask a Question | 5 | REQ-079 / REQ-091 stand; the intake does not remove them |
| A7 | Targets map onto today's four kinds; Just on the board / All players / Something else ride `other` with that text | 2 | `apps/backend/src/validation/askAiRequest.ts:69-87` (player / card / none / other, ≤8 targets); no "all players" kind exists |
| A8 | Targets stay on Hand and Library cards, unlike the mockup | 5 | intake's own rule "every in-depth detail today's form carries is kept"; channel-style abilities target from hand. Posed openly in REQ-017's block |
| A9 | An untouched prefilled Mana spent box sends nothing, so today's prompts are byte-identical | 2 | Stack prompt already falls back to `manaValue` (`apps/backend/src/prompt/context.ts:276-279`, `promptFormatting.ts:218`); input starts empty today (`EnrichmentStep.tsx:239-254`) |
| A10 | Order in non-Stack zones is cosmetic | 2 | the prompt numbers non-Stack cards (`promptFormatting.ts:236-240`) but gives that order no meaning; only the Stack has an ordering instruction (`promptFormatting.ts:15`) |
| A11 | Scanned cards are still added the moment they are recognised; the count pill's foot names the destination instead of the mockup's "join when you close the scanner" | 1, 5 | REQ-040 hands-free auto-add; the review bubble "operates on the destination's own card list (no scan-only store)" (`scan/README.md`) |
| A12 | The ✕ exit and the shutter keep the accessible names "Exit scan" and "Capture", so REQ-040 / REQ-056 / FLOW-006 wording stands | 3, 5 | today's buttons in `ZoneCardPicker.tsx:152-158`, `TradeSide.tsx:143-149`, `QuickLookupApp.tsx:449-455`, `ScanCameraSurface.tsx:535-541` |
| A13 | The wait keeps its place (it replaces the question box while waiting) and gains the inscription treatment; the chat opens on the first answer as today | 1, 5 | REQ-023 / REQ-092 "waiting panel replaces the submit form"; thresholds 0/3/8/15/25/40 s in `lib/askAiWaitStages.ts` |
| A14 | In-depth ↺ Start over lands on a clean Ask a Question page and still preserves the player roster | 1, 5 | REQ-029 roster rule; intake "goes to a clean Ask a Question" |
| A15 | Question History reopens each conversation in its own flow (In-depth conversations in In-depth details' chat with View Context) | 2, 5 | one store with a per-flow filter today (`persistence.ts:100`, callers `MtgAssistantApp.tsx:684,721`, `QuickLookupApp.tsx:335,359`) |
| A16 | Each flow's Draft shows as its own row at the top of the one list | 5 | Draft is per mode today (`persistence.ts` key `thejudge.conversationDraft.{game,lookup}`), shown as its own row (`ConversationHistoryDrawer.tsx:169-173`) |
| A17 | Below 600px each history row keeps a delete control | 5 | REQ-118 delete-with-confirm stands; the intake names delete only in the desktop pane |
| A18 | Answer chips match exact names of cards attached to the conversation only | 4 | no linkification exists today (`ConversationThread.tsx` has none); smallest scope that meets "a card the judge names sits in a chip" |
| A19 | Reset / New game's confirm moves from today's in-place two-step to the shared confirm sheet with today's copy | 3, 5 | `GameSetupPanel.tsx:27-37,108-170` already confirms in place |
| A20 | Drag reorder uses pointer events, no library | 6 | NFR-004 lightweight architecture; no DnD dependency in `apps/frontend/package.json` |
| A21 | The 600px sheet switch is new but structural and scoped to the sheet family; the 768px suite bands stay | 1 | DEC-117 / NFR-011 permit structural media queries; no 600px breakpoint exists today (`index.css` uses 640/768) |
| A22 | "Quick Question" / "In-Depth Question" in older entries remain internal labels for the two routes rather than being rewritten corpus-wide | 4 | REQ-206 note; the rename is carried where an entry asserts the Menu inventory, a label, or a behaviour that changes |
| A23 | `system-map.md` lines naming the old rail, drawer or labels are updated by the code slice that changes that code, not by this proposal | 1 | REQ-200's own note sets this precedent for `Built:` / system-map lines |
| A24 | REQ-070 (1651) and REQ-145 (3496) clauses that say "copy unchanged" are scoped to their own past passes, not standing bans | 1 | each is a constraint on that entry's own change |

No uncertainty met the genuine-blocker test: every open matter either has a PRD
basis (rungs 1–2) or is posed as its own gate block, so `GATE-QUESTIONS.md` →
`## Blocker questions` is empty.

## Amendment-set disposition (line-level grep, 2026-09-30)

One quoted grep per cross-cutting rule over `PRD/sections/` (excluding the
retired `decisions.md` index). Every hit has a disposition.

| Rule (grep) | Hit | Disposition |
| --- | --- | --- |
| Stack append-only (`append-only\|append order\|newest card becomes the top`) | F:70 REQ-005 | REQ-005 block |
| | F:290 REQ-018 | REQ-018 block |
| | F:743 REQ-039, F:3644/3650 REQ-157 | unrelated (fingerprint build, hook evidence log) |
| | in-depth:146 | REQ-018 block |
| | in-depth:156 | REQ-005 block |
| No manual reorder | F REQ-008 constraint | REQ-008 block |
| First question hidden (`not shown as a visible bubble\|initial user question is not shown`) | user-flows:120 FLOW-005 | FLOW-005 block |
| | user-flows:258 FLOW-011 step 8 | FLOW-011 block |
| | quick-lookup:142 | REQ-075 block |
| | F:442, F:446 REQ-025 | REQ-025 block |
| | F:1788 REQ-075 | REQ-075 block |
| | in-depth closed door (~485) | REQ-025 block |
| Send Request label | user-flows:14 FLOW-001 | FLOW-001 block |
| | screen-layout:130, :132 | REQ-206 block |
| | screen-layout:180 | REQ-209 block |
| | system-map:367 | A23 (code slice) |
| | F:169 REQ-012 | REQ-012 block |
| | F:1651 REQ-070, F:2144 REQ-091, F:3235 REQ-134, F:3899 REQ-167 note | A24 / historical note; REQ-167 note rewritten in the REQ-167 block |
| | F:2923 REQ-121 description | no change (describes a compact submit, still true) |
| | F:2927 REQ-121 | REQ-121 block |
| | F:3116 REQ-129 | no change: "Send Request" names the send control per REQ-132 as amended |
| | F:3184–3188 REQ-132 | REQ-132 block |
| | quick-lookup:117 | REQ-132 block |
| | quick-lookup:345 | REQ-206 block (measured bullet rewritten) |
| | in-depth:41, :214 | REQ-132 block |
| | in-depth:497 | historical closed door, no change |
| History rail / zone / icon | user-flows:389, :402 | FLOW-017 block |
| | user-flows:415 | FLOW-018 block |
| | screen-layout:90 | REQ-207 block |
| | system-map:367, :389, :563 | A23 |
| | F:2499 REQ-103 | REQ-103 block |
| | F:2596–2605 REQ-107 | REQ-107 block |
| | F:2769, :2770 REQ-114 | REQ-114 block |
| | F:2800 REQ-115 | REQ-115 block |
| | F:2825 REQ-116 | REQ-116 block |
| | F:3066–3069 REQ-127 | REQ-127 block |
| | F:3281 REQ-136 | REQ-136 block |
| | shared-chrome:134, :375 | REQ-107 block |
| | shared-chrome:141, :143 | REQ-127 block |
| | shared-chrome:228 | REQ-213 block |
| | shared-chrome:425, :450 | historical closed doors, no change |
| Exit scan | user-flows:136, :157 FLOW-006; F:715 REQ-040; F:1182 REQ-056; scan:182, :214, :307; in-depth:180 | no change (A12: the ✕ keeps the name "Exit scan") |
| | F:1608 REQ-071 | historical root-cause note |
| | scan:187 | REQ-214 block |
| | system-map:323, :326 | A23 |
| Even trade / which side is higher | user-flows:203 FLOW-009 | FLOW-009 block |
| | F:1467 REQ-064; trade-balancer:41 | REQ-064 block |
| | F:3496 REQ-145 | A24 |
| Printing filter above eight | screen-layout:220; F:1497; trade-balancer:164 | REQ-065 block |
| | system-map:556 | A23 |
| Menu inventory / top-middle | user-flows:226–227 FLOW-010 | FLOW-010 block |
| | user-flows:316 FLOW-014 | FLOW-014 block |
| | F:1549, :1551, :1554 REQ-067 | REQ-067 block |
| | F:1577 REQ-067 note; F:2072, :2090 REQ-089 | historical amendment notes, no change |
| | F:2377 REQ-099, F:2484 REQ-102, F:2972 REQ-123, F:4837 REQ-200, F:5115 REQ-205; shared-chrome:24 | A22 (internal labels) |
| | system-map:563 | A23 |
| Card cap 5 | screen-layout:128–133 | REQ-206 block (cap written as "the lookup cap") |
| | quick-lookup:22, :50, :171–172, :337 | REQ-167 block |
| | quick-lookup:47 (label copy) | REQ-206 block |
| | F:3879, F:3899 REQ-167 | REQ-167 block |
| | F:3418 REQ-141, F:4753 REQ-197 | unrelated ("five" consuming surfaces / headers) |
| Life Tracker untouched | user-flows:169 FLOW-007 | FLOW-007 block |
| | F:4966–4967, :4987–4988, :5010 REQ-202 | REQ-202 block |
| Sheet / drawer geometry (768 side panel, left-edge drawer) | screen-layout:108–109 | REQ-213 block |
| | F:2509 REQ-103 | REQ-103 block |
| | F:3086, :3089 REQ-128; shared-chrome:287, :395; screen-layout:98–99 | REQ-128 block |
| | shared-chrome:231 | inside the bullet REQ-213 replaces |
| | system-map:200, :388 | A23 |
| Theme orbs / swatches | screen-layout:89 | REQ-207 block |
| | F:3167–3172 REQ-131; shared-chrome:169, :175, :183–186 | REQ-131 block |
| | shared-chrome:379 | REQ-113 block (measured bullet) |
| | user-flows:167 FLOW-007 | FLOW-007 block |
| | F:883 REQ-044, F:1555 REQ-067, F:2069 REQ-089, F:2276 REQ-096, F:2368–2375 REQ-099 matrix | no change: the band's cells are swatches, named by hover title and accessible name; values unchanged |
| View all cards | user-flows:13 FLOW-001 | FLOW-001 block |
| | F:914 REQ-045 | REQ-045 block |
| | F:1183 REQ-056 | REQ-056 block |
| | F:1253 REQ-058 | REQ-058 block |
| | in-depth:436 | REQ-017 block |
| Start over → game-context step | F:525 REQ-029; in-depth:263, :492 | REQ-029 block |
| Waiting panel replaces the form | user-flows:257 FLOW-011 7a; quick-lookup:126; F:395–397 REQ-023; F:2149–2158 REQ-092 | no change (A13: the panel keeps its place) |
| | in-depth:227 | REQ-023 block |
| | NFR-006 "wait-state motion unchanged" | NFR-006 block |
| Custom Colorless uncorrected | F:2380–2381, 2390 REQ-099 | REQ-099 block |
| | F REQ-200 exemption criterion | REQ-200 block |
| | user-flows FLOW-007 steps 6 and edge case | FLOW-007 block |
| Per-player arrows / Players in game | user-flows:10 FLOW-001 step 1 | FLOW-001 block (note) |
| | F:2415–2425 REQ-100 | REQ-100 block |
| | F:1614 REQ-069, F:1643 REQ-070, F:3305 REQ-137; in-depth:100, :124 | no change: the Players expander, −/+ stepper and helper copy stay |
| Answered-workspace rows (`#### Quick Question — answered workspace`, `#### In-Depth — Answered workspace`; added after gate-qc attempt 1) | screen-layout:139–140, :143 (Quick Question answered: Purpose, Phone / Desktop, Notes) | REQ-206 block (row rewritten: send-pill composer, Cards strip, question-first thread, solid bubble under the seal, card-name chips, ✎ Edit cards / ↺ Start over beside the title) |
| | screen-layout:188–189, :191 (In-Depth answered: Purpose, Phone / Desktop, Notes) | REQ-209 block (row rewritten: the rail gives way to the chat; same chat as Ask a Question; View Context, ✎ Edit, ↺ Start over beside the title) |
| | screen-layout:141, :190 (Fit lines) | no change: no page scroll, the thread is the scroll region |
| Corner-rail clearance (`portal-menu-rail\|Rail clearance`) | screen-layout:142 | REQ-206 block (the line becomes `Header clearance` against the banner header, REQ-207; rail geometry kept as superseded) |
| | shared-chrome:497 (CSS class list) | A23 (code-location line, updated by the code slice that retires the class) |
| | system-map:564 | A23 |

## Verification the build must show

- `npm run quality:check` green; mock mode works on every screen.
- The tests each new or amended requirement names (tier and verdict bands,
  target mapping, Stack order reaching the request, carry, history merge,
  sheet shell, scan pill scope, band arrows, reduced motion, contrast floors).
- Byte-identical golden prompts for every untouched form (A9, REQ-210, REQ-211).
- The Life Tracker 390×844 / 1440×900 before/after pair on every touching slice.
- Each slice paired against its mockup page by the owner's eye, as the intake
  asks; the mockup is reference, never shipped.

## Intake citations (recorded, not opened)

Per the intake rule, these were cited by `intake/GRAPH-BRIEF.md` and were not
opened, read or fetched:

- `docs/design/ui-reimagining/direction-1/` (`shared-chrome-menu.html`,
  `quick-question.html`, `in-depth-question.html`, `trade-balancer.html`,
  `card-scan.html`, `life-tracker-menus.html`, `tokens.css`, `shell.css`,
  `flow.css`, `flow.js`, `ambience.css`, `ambience.js`, `motifs.js`, `motifs/`)
- `docs/design/ui-reimagining/index.html`, `README.md` (Iteration log),
  `OWNER-FEEDBACK.md`, `renders/`, `before/`, `after/`
- `PRD/instructions/receipts/ui-reimagining-2026-09-24.md` and the other
  receipts listed under `IDEA.md` → Prior run
- `apps/frontend/src/lib/stackLimits.ts`, `askAiWaitStages.ts`,
  `cardIdentityRing.ts`, `conversationHistory/persistence.ts`,
  `FeedbackModal.tsx`, `GameSetupPanel.tsx`, `CounterPanel.tsx`,
  `ScanCameraSurface.tsx`, `ScanReviewBubble.tsx` — these are also first-party
  code the refinement skill lists as read-first truth, and were read as code,
  not as intake claims.
