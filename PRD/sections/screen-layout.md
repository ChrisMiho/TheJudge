# screen-layout.md

Durable **screen layout catalog** for agents refining or adding UI. Answers “what is this screen for, and how big should it be?” so layout is not invented from short feedback.

**Authoritative for layout direction** under DEC-149 / REQ-126. Mechanism stays DEC-117 (one mobile-first tree, fluid CSS, no UA/JS device modes). Feature existence and code location stay in `system-map.md`. Binding presentation DECs stay in `decisions/ui-presentation.md` and related domain files; this catalog does not override those DECs — it gives the shared size/containment language agents must apply.

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
| Phone / Desktop | Rail: corner band (hit box capped per DEC-137) when tray closed. Open tray: full-height of **visible shell side**, width per navigation DECs (not a free full-viewport panel past shell). Theme orbs on one row (DEC-152). |
| Fit | Overlay; no page scroll. Opaque over destination content; rail Menu/History icons hidden/unclickable while open; close via outside click / Escape (DEC-140/147/150) |
| Notes | DEC-122, DEC-133, DEC-137, DEC-147, DEC-150, DEC-152, REQ-127, REQ-131 |

#### Card detail popup (suite-wide)

| | |
|---|---|
| Purpose | Read oracle/local card detail without stacking it under the image |
| Phone | Bottom sheet in the overlay family (DEC-158), **sized to its own content — not to the card image's bounding box**; opened from the top-right corner control on the image |
| Desktop/tablet | Side panel at `768px`+ matching `AdaptiveContextDialog`'s composition; width tracks the View Context row, not a free full-viewport panel |
| Fit | Overlay; popup body may region-scroll if detail is long; the close control lays out **inside** the overlay's own bounds at every width; must not invent a second page-length scroll for the hosting step |
| Notes | DEC-151, DEC-158, DEC-159, REQ-128, REQ-142 — applies whenever a card image is shown across all six surfaces: Quick Question card search, In-Depth Enrichment, View Context, In-Depth zone selected-card/add preview, In-Depth zone strip, and Scan review. Superseded geometry: `absolute inset-0` over the image, measured at 92×128px holding 356px of content with its close X overflowing by 37px (DEC-158) |

#### Conversation history drawer

| | |
|---|---|
| Purpose | List/restore/delete saved conversations |
| Phone | Left-edge full-height; width ≈ `min(22rem, 88% viewport)` (DEC-134) |
| Desktop/tablet | Left-edge full-height; width ≈ `min(30rem, 90% viewport)` |
| Fit | Overlay; list may region-scroll inside drawer |
| Notes | DEC-124, DEC-134, DEC-126. Mutually exclusive with Menu tray |

#### View Context / adaptive context overlay

| | |
|---|---|
| Purpose | Read-only frozen context for answered workspace |
| Phone | Bottom sheet / overlay within workspace rules (DEC-118); surface height caps so a dismissible scrim of **≥25% of viewport height** remains at 390×844 — i.e. ≤`75dvh`, tightening the shipped `min(85dvh, 48rem)` (REQ-135) |
| Desktop/tablet | Right drawer within workspace; not a second app shell |
| Fit | Overlay; body may region-scroll. The scrim outside the surface is a dismiss region (DEC-142) and must stay reachable clear of the app header rather than reading as page content showing through. The frozen card rendered inside this sheet sizes to the sheet's own content column under DEC-160 — its growth consumes body scroll, never the ≥25% scrim floor |
| Notes | DEC-118, DEC-142, DEC-159, DEC-160, REQ-135, REQ-141, REQ-142. The card here is the same shared `CardPresentation` as the staged surfaces; do not shrink it to buy room elsewhere (REQ-141) |

### Destinations

#### Quick Question — pre-submit

| | |
|---|---|
| Purpose | Optional card + question → Ask AI |
| Phone | Shell 100% width band; content-sized vertically (DEC-145); attached card image sizes to the content column (DEC-160) — a clear majority of column width, replacing the 92×128px `max-h-32` render — with the corner detail popup for metadata (DEC-151/DEC-158); only **Remove card** beside/below the image (REQ-133); primary fields and **Send Request** submit in first viewport when practical; topics/lists may region-scroll |
| Desktop/tablet | Shell 92%/48rem cap; content-sized vertically; card image grows with the wider column rather than holding the phone size (DEC-160); composer/field growth must not force page scroll or clip chrome below the field (REQ-110 / DEC-146 / DEC-153) |
| Fit | No page scroll for primary submit path — this bounds card image growth (REQ-129); if the two conflict, the Fit rule wins and a bounded cap is recorded on this row. **Measured bound (ui-review, 2026-08-07):** the two did conflict. An unbounded content-column image rendered 265x369 at 390x844 and pushed **Send Request** to `top` 868px with 1004px of document scroll. The shared shell column (`.card-shell-column img`) is therefore capped at `max-height: 25dvh` below 768px and `42dvh` at 768px+ — a host-row height bound, never a reinstated component `max-h-32` or a per-surface variant. Result: 151x211 at 390x844 with Send Request fully inside the first viewport (`bottom` 754px) and document scroll back to 846px vs the 844px baseline; 271x378 at 1440x900 with Send Request `bottom` 892px. Consequence to accept: at 390x844 the image is 45.3% of content width (151px of a 333px column, re-measured on ship 2026-08-11), so REQ-141's "clear majority" is **not** met on this surface — REQ-129 binds first, exactly as DEC-160 anticipates. It remains 1.65x the superseded 92x128 render and grows with the viewport (271x378 at 1440x900). Closing the gap requires changing the surrounding Quick Question column, not this cap. |
| Notes | DEC-107, DEC-145, DEC-146, DEC-151, DEC-153, DEC-158, DEC-160, REQ-132, REQ-133, REQ-141 |

#### Quick Question — answered workspace

| | |
|---|---|
| Purpose | Chat-first follow-up after first answer |
| Phone / Desktop | Thread fills **available shell/workspace height**; composer docked in workspace; thread region-scrolls |
| Fit | No page scroll; thread is the scroll region (DEC-127/131) |
| Rail clearance | The corner rail participates in layout (`.portal-menu-rail` is `position: relative`, giving the header's left column a real 44px band), so the first element under the header needs **no compensating clearance**. `.adaptive-context-trigger`'s `margin-top: calc(2.75rem - var(--layout-panel-padding))` is retired; spacing is plain `--layout-surface-gap` — measured 8px at 390x844 and 16px at 1440x900, with the rail's bottom 12px / 32px above View Context and no overlap. Do not reintroduce a rail-sized clearance constant here (ui-review, 2026-08-11) |
| Notes | DEC-118, DEC-127, DEC-131, REQ-139 |

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
| Phone | Shell width band. **Search / scan:** the flexible search input and labeled Scan button share one non-wrapping row; Scan keeps the 44px touch floor while search takes remaining width (DEC-050/REQ-125). **Selected-card/add preview:** image uses the legibility-first shell-column treatment (clear majority of content width); the search field shows the exact selected name; no duplicate name/title renders below the art; Add action sits directly below and remains in the first viewport (REQ-125/129/141). The row height reclaimed from Scan may support the larger image but does not relax that Add bound. **Added cards:** horizontal L→R strip with region scroll (REQ-130), fixed `w-40` / 160px tiles, and images filling tile interiors under DEC-160 (≈92px → ≈144px). Detail uses the corner popup everywhere (REQ-128/DEC-158) |
| Desktop/tablet | Shell 92%/48rem; content-sized vertically (DEC-145). Search and Scan keep the same single-row composition as phone. The selected-card/add preview grows with the shell column rather than retaining phone pixels; the added-card strip keeps the same fixed tile width and sizing rule. Keep primary add reachable without inventing empty-band fill |
| Fit | No page scroll past a stranded add CTA — the selected-card preview's Add action `top` stays ≤ 844px at 390×844 (REQ-125/129). The card strip region-scrolls horizontally and must not become document horizontal scroll |
| Notes | DEC-050, DEC-151, DEC-160, REQ-125, REQ-128–130, REQ-141, DEC-145. The selected-card/add preview is a card-reading surface and intentionally uses the large image. Added strip tiles are scannable add-order items — do not widen them to chase legibility; the corner popup is their read path. Search/Scan placement changes no scan, selection, owner, or add behavior. If either card form violates the Fit row, record a container bound here rather than forking `CardPresentation` or adding a size prop |

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
| Fit | Scan UI is its own full-bleed workspace; region overlays only. The review list region-scrolls — larger images mean more scrolling, which is accepted (DEC-160) — but the review bubble must not displace or overlap the camera frame (DEC-090/REQ-129) |
| Notes | DEC-090, DEC-160, REQ-129, DEC-052 family — do not re-layout scanner internals from generic “stretch” feedback. Scan review was outside `ui-review`'s original scope and is affected only because `ScanReviewBubble` consumes the shared `CardPresentation`; the density trade is documented in DEC-160. **Verify live at 390×844**: if the enlarged review bubble starves the camera frame, record a bounded image cap on this row — never fork the shared component |

#### Player Life Tracker

| | |
|---|---|
| Purpose | Live table life/counters |
| Phone / Desktop | **One-screen fit** for the life table at every player count (DEC-136); full-bleed destination chrome |
| Fit | No page scroll for the life table; counter panel is full-height overlay (DEC-139) |
| Notes | DEC-101, DEC-136, DEC-139 |

#### Trade Balancer

| | |
|---|---|
| Purpose | Two-sided USD trade comparison |
| Phone | Shell/full destination width; sides stack; lists region-scroll; primary totals visible without hunting |
| Desktop/tablet | Shell 92%/48rem (or destination equivalent); paired sides use shell width, not unused ultra-wide bands; content-sized vertically (DEC-145) |
| Fit | No page scroll for totals/primary actions; entry lists region-scroll |
| Price freshness | Date-level copy only — `Prices as of 5 June 2026`, formatted from the artifact's ISO `snapshotDate` with no raw `T`, milliseconds, or zone suffix, so it never reads as a live quote. One line at 390x844 (`scrollWidth` 299 = `clientWidth`). An unparseable artifact value omits the line entirely rather than printing raw data (ui-review, 2026-08-11, REQ-145) |
| Notes | DEC-087, DEC-145, REQ-145 |

#### Card Collection — feature home

| | |
|---|---|
| Purpose | Entry point offering exactly two primary actions (Scan cards / View collection) |
| Phone | Shell width ≈ 100% viewport minus page padding; the two actions stack as full-width targets |
| Desktop/tablet | Shell 92%/`min(48rem, 92vw)`; the two actions sit side by side within the shell, not stretched across unused ultra-wide bands |
| Fit | No page scroll — two actions and header always fit the first viewport |
| Notes | DEC-161, REQ-146, DEC-145. Content-sized vertically; do not invent vertical fill for the empty lower band |

#### Card Collection — overview (pie + total)

| | |
|---|---|
| Purpose | Read card distribution across lists and total collection value in one glance |
| Phone | Pie sized to a % of shell width with a rem cap so it never crowds out the list legend; legend/list region-scrolls beneath it |
| Desktop/tablet | Pie and legend may sit side by side within the shell 92%/48rem; pie does not grow to fill unused width |
| Fit | No page scroll for the pie and centered total; the list legend region-scrolls when lists are many |
| Notes | DEC-161, REQ-147. Centered total must stay legible inside the pie at 390×844 — if it cannot, shrink the pie, never overflow the text. Inline SVG/CSS only; no charting dependency |

#### Card Collection — list detail

| | |
|---|---|
| Purpose | View and edit the entries in one list (printing, quantity, foil, remove) |
| Phone | Full shell width; entry rows stack; list region-scrolls |
| Desktop/tablet | Shell 92%/48rem; entry rows use shell width, not unused ultra-wide bands |
| Fit | No page scroll for list header/actions; the entry list region-scrolls |
| Notes | DEC-161, REQ-151. Entry rows reuse the shared card presentation and printing picker — do not fork either for this surface |

#### Card Collection — scan batch review

| | |
|---|---|
| Purpose | Correct printings in a scanned batch before committing it to one list |
| Phone / Desktop | Follows the shipped scan chrome rows for the camera surface; the review batch region-scrolls like the scan review list |
| Fit | Scan UI keeps its own full-bleed workspace; the batch review is a region overlay and must not displace or overlap the camera frame (DEC-090/REQ-129) |
| Notes | DEC-161, REQ-148, DEC-090, REQ-129. Same rule as scan review: larger images mean more region scrolling, which is accepted — never fork the shared component |

#### Feedback modal

| | |
|---|---|
| Purpose | Send feedback / bug report |
| Phone / Desktop | Modal centered within viewport; width capped for readability (not full-bleed) |
| Fit | Overlay; form body may region-scroll if needed |
| Notes | DEC-105 |

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

- UI layout, containment, density, or “make it fill / stretch / tighter” work: read this file + `decisions.md` → `decisions/ui-presentation.md` (and any cited domain DECs).
- Do not treat `system-map.md` summaries as size specs.
- Do not treat short user/bug phrasing as license to exceed this catalog.
