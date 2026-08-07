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
| Phone / Desktop | Compact popup over the card image; opened from a top-right corner control on the image; closed via X (Escape/outside optional) |
| Fit | Overlay; popup body may region-scroll if detail is long; must not invent a second page-length scroll for the hosting step |
| Notes | DEC-151, REQ-128 — applies whenever a card image is shown |

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
| Phone | Bottom sheet / overlay within workspace rules (DEC-118) |
| Desktop/tablet | Right drawer within workspace; not a second app shell |
| Fit | Overlay; body may region-scroll |
| Notes | DEC-118, DEC-142 |

### Destinations

#### Quick Question — pre-submit

| | |
|---|---|
| Purpose | Optional card + question → Ask AI |
| Phone | Shell 100% width band; content-sized vertically (DEC-145); compact card image + corner detail popup when a card is attached (DEC-151); primary fields and **Send Request** submit in first viewport when practical; topics/lists may region-scroll |
| Desktop/tablet | Shell 92%/48rem cap; content-sized vertically; composer/field growth must not force page scroll or clip chrome below the field (REQ-110 / DEC-146 / DEC-153) |
| Fit | No page scroll for primary submit path |
| Notes | DEC-107, DEC-145, DEC-146, DEC-151, DEC-153, REQ-132 |

#### Quick Question — answered workspace

| | |
|---|---|
| Purpose | Chat-first follow-up after first answer |
| Phone / Desktop | Thread fills **available shell/workspace height**; composer docked in workspace; thread region-scrolls |
| Fit | No page scroll; thread is the scroll region (DEC-127/131) |
| Notes | DEC-118, DEC-127, DEC-131 |

#### In-Depth — Game context

| | |
|---|---|
| Purpose | Players, phase, notes before zones |
| Phone | Shell width band; roster/controls in first viewport when practical; expanded secondary details stay within width and align to their player row (DEC-128) |
| Desktop/tablet | Shell 92%/48rem cap; **content-sized vertically** — do not stretch the step card to fill empty lower viewport (DEC-145); expanded secondary details contained and aligned (DEC-128) |
| Fit | Prefer no page scroll for primary confirm path; dense multiplayer may region-scroll inside roster panel if needed |
| Notes | DEC-120, DEC-128, REQ-106, DEC-145 |

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
| Phone | Shell width band; compact card images; add action in first viewport (REQ-125/129); added cards horizontal L→R strip with region scroll (REQ-130); detail via corner popup (REQ-128) |
| Desktop/tablet | Shell 92%/48rem; content-sized vertically (DEC-145); same density rules; keep primary add reachable without inventing empty-band fill |
| Fit | No page scroll past a stranded add CTA; card strip region-scrolls horizontally |
| Notes | DEC-151, REQ-125, REQ-128–130, DEC-145 |

#### In-Depth — Enrichment

| | |
|---|---|
| Purpose | Optional per-card notes + question before decrypt |
| Phone / Desktop | Shell width bands; content-sized vertically (DEC-145); compact card images + corner detail popup (DEC-151); question composer matches FollowUp composition with initial **Send Request** label (DEC-146/153); lists region-scroll |
| Fit | Composer growth must not force page scroll or clip chrome below the field (REQ-110) |
| Notes | DEC-146, DEC-153, REQ-110, REQ-132, DEC-145, DEC-151 |

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
| Phone | Camera frame grows to fill **available viewport height** in the scan chrome (DEC-090); overlays stay non-overlapping |
| Desktop/tablet | Same fill intent inside scan chrome; not a reason to widen unrelated suite shell |
| Fit | Scan UI is its own full-bleed workspace; region overlays only |
| Notes | DEC-090, DEC-052 family — do not re-layout scanner internals from generic “stretch” feedback |

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
| Notes | DEC-087, DEC-145 |

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
