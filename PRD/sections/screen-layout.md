# screen-layout.md

Durable **screen layout catalog** for agents refining or adding UI. Answers “what is this screen for, and how big should it be?” so layout is not invented from short feedback.

**Authoritative for layout direction** under DEC-149 / REQ-126. Mechanism stays DEC-117 (one mobile-first tree, fluid CSS, no UA/JS device modes). Feature existence and code location stay in `system-map.md`. Binding presentation truth lives in the feature specs under `sections/<feature>/README.md`; this catalog does not override them — it gives the shared size/containment language agents must apply. (The decision log is retired; a cited `DEC-ID` resolves via the `decisions.md` index.)

## How to read this

1. Apply **Shared layout language** (bands, hybrid %, fit rule, anti-overcalibration).
2. Find the **screen row** for the surface you are changing.
3. If a starting % band does not fit a screen, **tune that row** (or propose a catalog update) — do not silently stretch past the catalog.
4. New UI surfaces must add a row using the **New-screen template** during refinement (before map-out).

## Shared layout language

### Viewport bands

Product intent uses CSS viewport width (not device detection). Starting bands:

| Band | Viewport width | Role |
|---|---|---|
| phone | `< 768px` | Structural narrow band (matches DEC-117 / DEC-118 `768px` boundary) |
| tablet | `768px`–`1023px` | Wide enough for desktop shell rules; may still prefer compact density |
| desktop | `≥ 1024px` | Full desktop composition |

Use fluid interpolation inside a band when possible; reserve hard switches for non-interpolating structure (e.g. context sheet vs drawer at `768px`).

### Hybrid % model

- **Outer shell width** sizes as a **% of the viewport**, with rem/`min()` caps so ultra-wide screens do not produce content-less bands.
- **Inner panels / workspaces** size as a **% of the suite shell** (the app content frame after banner/chrome), not as a second free grab at the full viewport.
- Starting shell width intent (tunable per screen when a row says so):
  - **phone:** shell ≈ **100%** of viewport width (minus established page padding); no narrow “card floating in a phone desert.”
  - **tablet/desktop:** shell ≈ **92%** of viewport width, capped at `min(48rem, 92vw)` (DEC-145 / REQ-124). Tune the rem cap in product truth when mocks prove a different reading width; do not jump to edge-to-edge without a catalog/DEC update.
- Prose-dominant regions keep a **maximum reading measure inside the shell** — widening the shell does not mean every text column goes edge-to-edge.
- **Height:** do **not** stretch pre-submit staged steps to absorb lower viewport dead space (DEC-145 — content-sized vertically; empty region accepted until step content exists). Vertical fill applies only where a screen row cites it (answered chat workspace, Life Tracker one-screen table, scan camera chrome).

### Fit rule (default)

**No document/page scroll** for primary UI: chrome + primary controls for the screen’s job fit in the first viewport. Long content may scroll **inside a bounded region** (chat thread, history list, zone card grid, overlay body). Nested region scroll is allowed; inventing a second page-length scroll beneath stranded controls is not.

Exceptions must be explicit on the screen row (e.g. dense staged forms that already document unavoidable overflow).

### Anti-overcalibration

- “Fill available space” means fill the **shell or named region** in this catalog — not the entire browser chrome-to-chrome unless the row says full-bleed.
- Do not stretch a control or column across unused viewport just because width is available.
- Prefer tuning a row’s % / cap over inventing a one-off full-bleed layout mid-bugfix.

## Screen catalog

Columns: **Purpose** · **Phone** · **Desktop/tablet** · **Fit** · **Notes / backed by**

### Shared chrome

#### Suite shell (`PageShell` / portal shell bounds)

| | |
|---|---|
| Purpose | Outer content frame for portal destinations that use the standard shell |
| Phone | Width ≈ 100% viewport (minus page padding); height follows content (not forced full-viewport stretch) |
| Desktop/tablet | Width ≈ 92% viewport, cap `min(48rem, 92vw)`; height follows content for staged/pre-submit destinations |
| Fit | No page scroll from shell chrome alone |
| Notes | DEC-145, REQ-124, DEC-117. Do not invent vertical fill for empty lower bands. Life Tracker / answered workspace / scan use their own height rows |

#### Destination load fallback (route `Suspense` boundary)

| | |
|---|---|
| Purpose | Transient placeholder shown while a lazily-loaded destination's code chunk arrives (DEC-157 / NFR-014) |
| Phone / Desktop | Occupies the destination content region **inside** the existing shell — the suite shell, corner rail, and brand block stay mounted and visible; it never replaces or resizes the shell, and never renders as a full-viewport takeover |
| Fit | Reserves the region rather than collapsing it, so the shell does not jump height when the chunk resolves; no page scroll, no layout shift of surrounding chrome |
| Notes | DEC-157, NFR-014, DEC-095. Appears at most **once per destination per session** — keep-alive mounting means a revisited destination is already loaded and shows no fallback. Keep it quiet and minimal; this is a sub-second chunk fetch, not a data-loading state, so it must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules (NFR-006). Do not invent vertical fill for the empty region |

#### Mock-mode banner

| | |
|---|---|
| Purpose | Persistent mock-provider indicator |
| Phone / Desktop | Full viewport width strip; content below offset so headers stay clear |
| Fit | Fixed chrome; must not cover destination headers (REQ-123) |
| Notes | DEC-085 |

#### Feature-portal Menu rail + tray

| | |
|---|---|
| Purpose | Suite navigation + Theme |
| Phone | ☰ Menu button (≥44px) at the left of the banner header. Open tray: slides in from the left, full height of the **visible shell side**; opaque over destination content |
| Desktop/tablet | Same ☰ trigger; the open tray is a floating card inset from the viewport edges, rounded, sized to its content (not full height) |
| Theme band | Six equal cells, each ≥40px; when six no longer fit, the band slides with an arrow at each end nudging two cells, the chosen cell scrolled into view on open; from 320px up all six fit with no arrows; Colorless's colour well and Reset to gray sit beneath, wrapping |
| Fit | Overlay; no page scroll. The tray closes on its ✕, a tap outside it, and Escape; the ☰ trigger is covered and not hit-testable while it is open (REQ-127) |
| Notes | DEC-122, DEC-133, DEC-137, DEC-147, DEC-150, REQ-127, REQ-131, REQ-207. The destination list is REQ-206's |

#### Shared sheet (card detail, Question History, printing picker, Send feedback, confirm)

| | |
|---|---|
| Purpose | One overlay shell for the suite's small sheets (REQ-208) |
| Phone | Below `600px`: bottom sheet, content-sized up to the viewport; fixed head (title, ✕) and foot (actions) |
| Desktop/tablet | From `600px`: floating card centred in the viewport, content-sized; Question History widens to two panes (REQ-213) |
| Fit | Overlay; only the body region-scrolls; never a second page-length scroll for the host screen |
| Notes | REQ-208, REQ-128, REQ-142, REQ-143, REQ-205. View Context keeps its own row; Life Tracker's counter panel keeps DEC-139 |

#### Card detail popup (suite-wide)

| | |
|---|---|
| Purpose | Read oracle/local card detail without stacking it under the image |
| Phone | The shared sheet (REQ-208): a bottom sheet below `600px`, **sized to its own content — not to the card image's bounding box**; opened from the top-right corner control on the image |
| Desktop/tablet | From `600px`: a floating card centred in the viewport, fading up into place; content-sized (REQ-208) |
| Fit | Overlay; popup body may region-scroll if detail is long; the close control lays out **inside** the overlay's own bounds at every width; must not invent a second page-length scroll for the hosting step |
| Notes | DEC-151, DEC-158, DEC-159, REQ-128, REQ-142, REQ-175, REQ-208, FLOW-024 — applies whenever a card image is shown across all six surfaces: Quick Question card search, In-Depth Enrichment, View Context, In-Depth zone selected-card/add preview, In-Depth zone strip, and Scan review. Superseded geometry: `absolute inset-0` over the image, measured at 92×128px holding 356px of content with its close X overflowing by 37px (DEC-158); the `768px` side panel (DEC-158) is further superseded by REQ-208's `600px` centred card. **On-demand load state (REQ-128 / FLOW-024):** the descriptive block is fetched on first card-detail open, so the popup shows a brief loading state confined to the descriptive-content region while the already-local name, image, and color ring stay rendered and do not move. Keep it quiet and minimal — it must not introduce a branded splash, a full-overlay spinner takeover, a progress bar, or motion beyond the existing CSS-motion rules (NFR-006), and must not resize the overlay or shift surrounding content (no layout jump when the block resolves). A minimal inline placeholder/skeleton in the descriptive region is allowed; a failed load falls soft to the name identity fallback (FLOW-001) with a retry affordance, never an error takeover |

#### Question History (REQ-213 — superseded the conversation history drawer)

| | |
|---|---|
| Purpose | Question History: list, reopen and delete saved conversations of both question kinds (REQ-213) |
| Phone | The shared sheet (REQ-208) as a bottom sheet below `600px`; one list; a tap reopens the conversation |
| Desktop/tablet | The shared sheet as a floating centred card from `600px` up, in two panes: the list and the chosen conversation with Open conversation / Delete this question. Superseded geometry: a left-edge full-height drawer, `min(22rem, 88vw)` phone / `min(30rem, 90vw)` desktop (DEC-134) |
| Fit | Overlay; the list and the reading pane region-scroll inside the sheet body; head and foot fixed |
| Notes | DEC-124, DEC-126, REQ-208, REQ-213. Opened from the Menu's Question History row; no rail History zone |

#### View Context / adaptive context overlay

| | |
|---|---|
| Purpose | Read-only frozen context for answered workspace |
| Phone | Bottom sheet / overlay within workspace rules (DEC-118); surface height caps so a dismissible scrim of **≥25% of viewport height** remains at 390×844 — i.e. ≤`75dvh`, tightening the shipped `min(85dvh, 48rem)` (REQ-135) |
| Desktop/tablet | Right drawer within workspace; not a second app shell |
| Fit | Overlay; body may region-scroll. The scrim outside the surface is a dismiss region (DEC-142) and must stay reachable clear of the app header rather than reading as page content showing through. The frozen card rendered inside this sheet sizes to the sheet's own content column under DEC-160 — its growth consumes body scroll, never the ≥25% scrim floor |
| Notes | DEC-118, DEC-142, DEC-159, DEC-160, REQ-135, REQ-141, REQ-142. The card here is the same shared `CardPresentation` as the staged surfaces; do not shrink it to buy room elsewhere (REQ-141) |

### Destinations

#### Ask a Question — pre-submit

| | |
|---|---|
| Purpose | Up to 10 cards (card stage, REQ-167 as amended) + question → Ask AI; Add in-depth details carries the cards into In-depth details (REQ-206) |
| Phone | Shell 100% width band; content-sized vertically (DEC-145). **Card stage** (only when a card is attached): the front card full size on a solid-panel stage, the one other card peeking (two cards peek on one side only; three or more peek each side) — so the stage height does not grow with the card count; ✕ Remove / ⓘ Details straddle the front card's top corners; a dark count pill reads `n / cap`. **Question box:** one pill (Add in-depth details · text · count · send pill) |
| Desktop/tablet | Shell 92%/48rem cap; content-sized vertically; the front card grows with the wider column; box growth must not force page scroll or clip chrome below the box (REQ-110 / DEC-146) |
| Fit | No page scroll for the primary submit path: the send pill's `bottom` stays inside the first viewport at every attached-card count up to the cap. The stage replaces the stacked per-image list whose measured overflow this row previously bounded (history below); the per-image `25dvh` / `42dvh` cap retires with that list |
| Notes | DEC-107, DEC-145, DEC-146, DEC-151, DEC-153, DEC-158, DEC-160, REQ-129, REQ-133, REQ-141, REQ-167, REQ-174, REQ-200, REQ-206, FLOW-024. The on-demand card-detail load state follows the `#### Card detail popup (suite-wide)` row (REQ-174 / FLOW-024): quiet, in-region, no layout jump, failing soft to the name fallback. **History (superseded by REQ-206's card stage, `ui-reimagining-build`, 2026-10-01):** earlier passes bounded a stacked per-image list — a 2026-08-07 measurement capped each image at `max-height: 25dvh` / `42dvh` (`.card-shell-column img`) after an unbounded image pushed Send Request to `top` 868px; a 2026-08-30 re-measurement found the per-image cap held for up to five stacked cards but let the page scroll past the composer with 2+ attached; a 2026-09-24 re-measurement (two cards, 1159px document against an 844px viewport, Send Request `bottom` 1067) withdrew that as unacceptable and bound the attached-card **region** instead of each image. The card stage is the `ui-reimagining-build` pass's replacement for that bounded-region list — not a further re-measurement of it |

#### Ask a Question — answered workspace

| | |
|---|---|
| Purpose | Ask a Question — answered: chat follow-up after the first ruling, with the attached cards and Edit cards / Start over beside the title (REQ-206, REQ-075) |
| Phone / Desktop | Thread fills **available shell/workspace height**; composer (the one-pill question box with the send pill, REQ-206) docked in workspace; thread region-scrolls. The title row carries **✎ Edit cards** and **↺ Start over** at its right once a ruling exists; the thread opens with the player's question as a right-aligned bubble (REQ-025), then the judge's messages, with an attached-card name rendered as a tappable chip when it matches |
| Fit | No page scroll; thread is the scroll region (DEC-127/131) |
| Rail clearance | The corner rail participates in layout (`.portal-menu-rail` is `position: relative`, giving the header's left column a real 44px band), so the first element under the header needs **no compensating clearance**. `.adaptive-context-trigger`'s `margin-top: calc(2.75rem - var(--layout-panel-padding))` is retired; spacing is plain `--layout-surface-gap` — measured 8px at 390x844 and 16px at 1440x900, with the rail's bottom 12px / 32px above View Context and no overlap. Do not reintroduce a rail-sized clearance constant here (ui-review, 2026-08-11) |
| Notes | DEC-118, DEC-127, DEC-131, REQ-139, REQ-025, REQ-075, REQ-206 |

#### In-Depth — Game context

| | |
|---|---|
| Purpose | Players, phase, notes before zones |
| Phone | Shell width band; roster/controls in first viewport when practical; expanded secondary details stay within width and align to their player row (DEC-128) |
| Desktop/tablet | Shell 92%/48rem cap; **content-sized vertically** — do not stretch the step card to fill empty lower viewport (DEC-145); expanded secondary details contained and aligned (DEC-128) |
| Fit | Prefer no page scroll for primary confirm path; dense multiplayer may region-scroll inside roster panel if needed |
| Player-detail controls | Shipped shapes (ui-review, 2026-08-11), measured identical at 390x844 and 1440x900: both disclosures paint **one shared 20x20 inline-SVG triangle** rotated 90 degrees when expanded, inside an unboxed hit area (56x44 outer roster, 44x44 per-player) — no text glyph, no border/fill box. Commander-damage, named-counter, and scalar rows share **one grouped row pattern**: content-sized leading element, one declared 8px gap, then the control (the retired `grid-cols-[1fr_auto]` stretched that gap to 457px on desktop). Poison / energy / experience are **stacked 78px content-sized selects** with an explicit `Unset` option and fixed ranges 0-11 / 0-100 / 0-100; a seeded out-of-range value stays selectable. Three expanded players occupy 720px of secondary-detail height. Commander damage stays a free-typed unbounded numeric input |
| Notes | DEC-120, DEC-128, REQ-106, DEC-145, REQ-137, REQ-138, REQ-144 |

#### In-Depth — Zone confirmation

| | |
|---|---|
| Purpose | Select zones for the question |
| Phone / Desktop | Shell width bands as suite shell; content-sized vertically (DEC-145); primary confirm reachable in the first viewport when practical |
| Fit | No page scroll for the confirm action |
| Notes | FLOW-001, DEC-145 |

#### In-Depth — Zone collection

| | |
|---|---|
| Purpose | Add cards to selected zones (search/scan) |
| Phone | Shell width band. **Search / scan:** the flexible search input and labeled Scan button share one non-wrapping row; Scan keeps the 44px touch floor while search takes remaining width (DEC-050/REQ-125). **Selected-card/add preview:** image uses the legibility-first shell-column treatment (clear majority of content width); the search field shows the exact selected name; no duplicate name/title renders below the art; Add action sits directly below and remains in the first viewport (REQ-125/129/141). The row height reclaimed from Scan may support the larger image but does not relax that Add bound. **Added cards:** horizontal L→R strip with region scroll (REQ-130), tiles sized so **at least three are visible at 390×844 without scrolling the strip**, with images filling tile interiors under DEC-160. Superseded geometry: fixed `w-40` / 160px tiles, measured live on 2026-09-24 as 146×203 images in a 256px-tall region with a 265px visible width against a 326px scroll width — about 1.8 tiles visible, which is the owner-reported "cards get too big once a zone fills" friction. Detail uses the corner popup everywhere (REQ-128/DEC-158) |
| Desktop/tablet | Shell 92%/48rem; content-sized vertically (DEC-145). Search and Scan keep the same single-row composition as phone. The selected-card/add preview grows with the shell column rather than retaining phone pixels; the added-card strip keeps one shared tile width and sizing rule across widths, growing tile count rather than tile size. Keep primary add reachable without inventing empty-band fill |
| Fit | No page scroll past a stranded add CTA — the selected-card preview's Add action `top` stays ≤ 844px at 390×844 (REQ-125/129). The card strip region-scrolls horizontally and must not become document horizontal scroll |
| Notes | DEC-050, DEC-151, DEC-160, REQ-125, REQ-128–130, REQ-141, REQ-200, DEC-145. The selected-card/add preview is a card-reading surface and intentionally uses the large image. Added strip tiles are scannable add-order items — do not widen them to chase legibility; the corner popup is their read path. Search/Scan placement changes no scan, selection, owner, or add behavior. If either card form violates the Fit row, record a container bound here rather than forking `CardPresentation` or adding a size prop |

#### In-Depth — Enrichment

| | |
|---|---|
| Purpose | Optional per-card notes + question before decrypt |
| Phone / Desktop | Shell width bands; content-sized vertically (DEC-145); card images size to the content column (DEC-160) — a clear majority of column width at 390×844, growing further at desktop — with the corner detail popup for metadata (DEC-151/DEC-158) and only **Remove card** beside/below the image (REQ-133); question composer matches FollowUp composition with initial **Send Request** label (DEC-146/153); lists region-scroll |
| Fit | Composer growth must not force page scroll or clip chrome below the field (REQ-110); card image growth is bounded by the same no-page-scroll rule (REQ-129), with any needed cap recorded on this row |
| Notes | DEC-146, DEC-153, REQ-110, REQ-132, DEC-145, DEC-151, DEC-158, DEC-160, REQ-133, REQ-141 |

#### In-Depth — Answered workspace

| | |
|---|---|
| Purpose | Frozen game context + chat follow-ups |
| Phone / Desktop | Same shared conversation workspace rules as Quick Question answered |
| Fit | No page scroll; thread region-scrolls |
| Notes | DEC-118, DEC-127, DEC-131 |

#### Scan camera surface

| | |
|---|---|
| Purpose | On-device card capture into a zone |
| Phone | Camera frame grows to fill **available viewport height** in the scan chrome (DEC-090); overlays stay non-overlapping. Scan review bubble: card images size to their list-row width under DEC-160 (they are no longer pixel-capped at 92×128px); the review list keeps its own vertical region scroll |
| Desktop/tablet | Same fill intent inside scan chrome; not a reason to widen unrelated suite shell; same review-list sizing rule |
| Fit | Scan UI is its own full-bleed workspace; region overlays only. The review list region-scrolls — larger images mean more scrolling, which is accepted (DEC-160) — but the count pill must not displace or overlap the camera frame (DEC-090/REQ-129) |
| Chrome | A square ✕ exit box sits above the camera's top-right corner on every host (accessible name "Exit scan"); the count pill (and, when open, its caution note) sits beneath it, non-overlapping; the opt-in Debug panel keeps its own bottom-left placement with a themed accent border (REQ-214) |
| Notes | DEC-090, DEC-160, REQ-129, DEC-052 family, REQ-214 — do not re-layout scanner internals from generic “stretch” feedback. Scan review was outside `ui-review`'s original scope and is affected only because `ScanReviewBubble` consumes the shared `CardPresentation`; the density trade is documented in DEC-160. **Verify live at 390×844**: if the enlarged count pill starves the camera frame, record a bounded image cap on this row — never fork the shared component |

#### Player Life Tracker

| | |
|---|---|
| Purpose | Live table life/counters |
| Phone / Desktop | **One-screen fit** for the life table at every player count (DEC-136); full-bleed destination chrome |
| Fit | No page scroll for the life table; counter panel is full-height overlay (DEC-139) |
| Sheets | Game Setup fits one phone screen; a player's Counters panel keeps its full-height overlay (DEC-139) with two tabs; Reset / New game confirm in the shared sheet (REQ-208). The table itself is pixel-untouched; every touching slice attaches the 390x844 and 1440x900 before/after pair (REQ-202) |
| Notes | DEC-101, DEC-136, DEC-139 |

#### Trade Balancer

| | |
|---|---|
| Purpose | Two-sided USD trade comparison |
| Phone | Shell/full destination width; the two sides are **tabs sharing one panel**, not stacked (REQ-204) — one side's list, search, scan control and total render at a time, while both side totals and the difference stay visible whichever tab is active; lists region-scroll. Superseded geometry: vertically stacked sides, measured 2026-09-24 at 390x844 with both sides empty as Side A heading y 305 / Side B heading y 529, i.e. 224px per side before a card is added |
| Desktop/tablet | Shell 92%/48rem (or destination equivalent); paired sides use shell width, not unused ultra-wide bands; content-sized vertically (DEC-145) |
| Fit | No page scroll for totals/primary actions; entry lists **and the printing picker** region-scroll |
| Balance | Two piles of gold on a solid panel with the verdict line and dollar difference beneath; the whole screen fits 390×844 and 1440×900 with only the entry lists scrolling (REQ-215) |
| Printing picker | Opens in the shared sheet (REQ-208); rows of set name, code, thumbnail, and Nonfoil / Foil price pills; the body region-scrolls at about 5-6 rows so the page never grows with a card's printing count (Sol Ring 128, corpus maximum 771); row images lazy-load; a set-name/code filter appears past 5 printings; the selected printing is scrolled into view on open (REQ-065; live observation 2026-09-09: 128 rows once rendered 10,748 px tall on an 844 px viewport) |
| Price freshness | Date-level copy only — `Prices as of 5 June 2026`, formatted from the artifact's ISO `snapshotDate` with no raw `T`, milliseconds, or zone suffix, so it never reads as a live quote. One line at 390x844 (`scrollWidth` 299 = `clientWidth`). An unparseable artifact value omits the line entirely rather than printing raw data (ui-review, 2026-08-11, REQ-145); at `768px`+ it sits in the staged header's right-hand slot instead (REQ-215) |
| Notes | DEC-087, DEC-145, REQ-145, REQ-065, REQ-204, REQ-215. Desktop/tablet paired sides are protected scope — the phone tab treatment must not reach the `768px`+ composition |

#### Feedback modal

| | |
|---|---|
| Purpose | Send feedback / bug report |
| Phone / Desktop | The shared sheet (REQ-208): bottom sheet below `600px`, floating centred card from `600px` up, width capped for readability; fixed head and foot, body scrolls |
| Fit | Overlay; form body may region-scroll if needed |
| Notes | DEC-105, REQ-087, REQ-208 |

## New-screen template

Copy into this file (and link from the feature’s refinement brief) when a feature adds a user-visible screen or major overlay:

```markdown
#### <Screen name>

| | |
|---|---|
| Purpose | <one job> |
| Phone | <shell/region % of viewport or shell; key caps> |
| Desktop/tablet | <shell/region %; key caps> |
| Fit | no page scroll \| region-scroll: <what scrolls> \| exception: <why> |
| Notes | <DEC/REQ ids; full-bleed? prose measure?> |
```

Refinement of any package that introduces UI must land this row before quality-check PASS. Implementation must not invent sizes when a row exists.

## Agent read contract

- UI layout, containment, density, or “make it fill / stretch / tighter” work: read this file + the relevant feature spec `sections/<feature>/README.md` (resolve any cited `DEC-ID` via the `decisions.md` index).
- Do not treat `system-map.md` summaries as size specs.
- Do not treat short user/bug phrasing as license to exceed this catalog.
