# Navigation / feature-portal decisions

The top-level app navigation chrome that lets users move between TheJudge's suite
features. Elevated out of the trade-balancer decisions into its own package so the
portal owns app chrome and every feature reaches it as a registered destination.

### DEC-095
- Decision: The top-level in-app navigation is elevated into a first-class **feature-portal** package that owns app-navigation chrome for the whole suite. A single **menu button in the top-middle** of the header (filling the header deadspace) opens a dropdown of destinations — DEC-089's dropdown pattern, re-homed from the top-right corner to the header center — and the portal is backed by an **extensible destination registry** so new suite features register as destinations rather than shipping their own entry chrome. v1 destinations are **MTG Assistant** and **Trade Balancer**, with the current mode indicated; the registry is extensible so future features (e.g. `card-lookup-qa`, `rules-lookup`) register by adding a destination entry with no portal redesign. Mode switching stays a frontend-only view switch that preserves each mode's in-session state, with no persistence across reload and no backend/contract change. This **refines DEC-089** (placement moves top-right → top-middle; ownership moves out of the trade-balancer package into feature-portal; adds the destination registry); it does not change the frontend-only, state-preserving, contract-frozen semantics DEC-089 established.
- Status: confirmed
- Context: DEC-089 introduced the nav menu inside the `card-trade-balancer` work package and placed it in the top-right header next to `ThemeControl`. As TheJudge grows into a suite (MTG Assistant, Trade Balancer, Card Lookup, Rules Lookup, and more), navigation is a shared concern that should not be owned by one feature, and each new feature inventing its own entry chrome would fragment the UI. The header top-middle is currently deadspace between the left brand block and the top-right `ThemeControl`, so a centered menu button both declutters and gives navigation a deliberate, discoverable home without crowding either existing corner control. `ThemeControl` already occupies the top-right corner and a scan-control overlap once caused a misclick hazard (DEC-065), so the portal button, the brand block, and `ThemeControl` must occupy three non-overlapping regions. The user chose the dropdown-menu affordance (not a persistent inline switcher), keeping DEC-089's interaction model and only repositioning it. Because the trade balancer is now a destination that depends on the portal rather than the owner of the nav, the nav-menu build moves out of `card-trade-balancer` and the portal ships first.
- Impact:
  - a navigation **menu button** sits in the **top-middle** of the header on every screen; opening it shows a dropdown of destinations with the current mode indicated, and selecting a destination switches the active view (the same menu is the path back)
  - the portal button, the left **brand block**, and the top-right **`ThemeControl`** (which stays at `fixed right-3 top-3`, DEC-066 unchanged) have **non-overlapping** visual bounds and pointer hit areas at mobile and desktop sizes (DEC-065 precedent)
  - navigation is backed by an **extensible destination registry**: each destination is `{ id, label, current-view mount }`; features register a destination entry instead of shipping their own navigation chrome, and adding a destination requires no portal redesign
  - v1 registers exactly two destinations — **MTG Assistant** (the existing Decrypt-Stack flow / start screen) and **Trade Balancer** (DEC-087); `card-lookup-qa` and `rules-lookup` register when they ship
  - switching modes is a **frontend-only view switch**: each mode's in-session state is preserved while the app stays loaded; selecting the current mode is a no-op that does not reset state; nothing is persisted across a page reload (unchanged from DEC-089)
  - the MTG Assistant start screen, staged flow, and answered/conversation view are unchanged; the portal is additive chrome and alters no step logic or payload
  - chrome only: no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any product-facing endpoint; no backend route and no server-side navigation state
  - mobile-first: the button and its opened menu stay touch-friendly within the mobile chrome (NFR-001), and any open/close motion stays within the CSS-only, reduced-motion-aware carve-out (NFR-006)
  - ownership: the `feature-portal` package owns this chrome; `card-trade-balancer`'s planned nav-menu slice is retired and the balancer depends on the portal for its mount slot / mode switch
- Related requirements:
  - REQ-067
  - FLOW-010
  - NFR-001
  - NFR-006
- Notes:
  - refines DEC-089; DEC-089 stays resolvable and its frontend-only, state-preserving, contract-frozen semantics carry forward unchanged
  - `ThemeControl` (DEC-066) placement and behavior are unchanged; the palette control keeps the top-right corner
  - the registry is intentionally extensible but v1 lists only MTG Assistant and Trade Balancer

### DEC-104
- Decision: The feature-portal registry gains a second entry **kind** — an **action entry** — alongside the existing **destination** entries. A destination entry (DEC-095) switches the active view; an action entry instead invokes a handler when selected (v1: open the Feedback & Bug Report modal, DEC-105) and does **not** switch the active view or preserve/replace mode state. Action entries appear in the same top-middle portal dropdown, respect the same non-overlap (brand block / `ThemeControl`, DEC-065/DEC-095) and CSS-only reduced-motion (NFR-006) constraints, and are registered through the same registry so features still reach the portal as registered entries rather than shipping their own chrome. This is an **additive amendment** to DEC-095/REQ-067: destination semantics, placement, the frontend-only/state-preserving/contract-frozen guarantees, and the v1 destination list are all unchanged; the registry simply admits handler-backed entries in addition to view-mounting ones.
- Status: confirmed
- Context: DEC-095 defined the portal registry around destinations only — every entry mounts a view and switching preserves each mode's in-session state. Feedback & Bug Report (DEC-105) needs a portal entry that opens a modal **over the current screen** so the user keeps their place, which is not a view switch and would otherwise force feedback to ship its own header chrome — exactly the fragmentation DEC-095 exists to prevent. Rather than special-casing feedback, the registry is generalized to a tagged union of entry kinds so future non-view actions (e.g. a future "share", "report") have a reusable home. The alternative (a standalone header affordance outside the registry) was rejected because it splits navigation ownership and contradicts DEC-095's principle that features register with the portal.
- Impact:
  - the portal entry model becomes a discriminated set: `{ kind: "destination", ... }` (DEC-095, unchanged) and `{ kind: "action", id, label, onSelect }` (new); selecting an action entry runs `onSelect` and closes the menu without changing the active destination
  - action entries share the destination presentation, keyboard/focus behavior, non-overlap bounds (DEC-065/DEC-095), and CSS-only reduced-motion open/close motion (NFR-006)
  - v1 registers exactly one action entry — **Send feedback** (DEC-105) — which opens the feedback modal; no other action entries ship in v1
  - chrome only: no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any product-facing endpoint; no backend route and no server-side state
  - DEC-095's destination list, placement, and state-preserving view-switch semantics are untouched
- Related requirements:
  - REQ-086
  - REQ-067
  - NFR-001
  - NFR-006
- Notes:
  - additive amendment to DEC-095/REQ-067; DEC-095 stays fully resolvable and its semantics carry forward unchanged
  - the feedback feature that consumes this entry kind lives in `decisions/feedback.md` (DEC-105)

### DEC-109
- Decision: The feature-portal Menu control is the suite's single floating/attached app-chrome affordance. Every feature-portal destination screen renders its own lightweight header row containing a `PortalSlot`, so the Menu trigger always docks inline within that screen's own header — flush to its content card, scrolling away with the page like the rest of that screen's chrome — and never renders as a floating fixed overlay by design; the existing `fixed`-position fallback in `FeaturePortalMenu` remains only as a defensive safety net for a destination that ships with literally no header, not an intended UX state. The trigger itself becomes **icon-only** (drops the visible "Menu" text label, keeping the existing `aria-label="Switch feature"` for the accessible name). This refines DEC-095; it does not change destination semantics, the registry, or the top-middle placement established there.
- Status: confirmed
- Context: DEC-095 placed the Menu button top-middle and had it portal inline into a `PortalSlot` registered by a destination's own header — but only the 4 staged MTG Assistant steps register one. The answered/conversation screen renders its own slim brand-only header with no slot, so Menu fell back to `fixed left-1/2 top-0`, glued to the raw viewport edge above the content card (which is narrower than the viewport and begins with its own top padding) rather than docked flush to the card border like everywhere else. This read as disconnected, appeared misaligned with the actual centered content column, and stayed pinned in place while the user scrolled a growing conversation thread beneath it — the "doesn't feel elegant" first attempt this refines. Because the underlying fallback mechanism is a legitimate safety net (a hypothetical destination could ship with zero header), the fix is not to delete it but to make sure every actual screen exercises the inline path instead, and to make the trigger itself lighter (icon-only) as a further tidy-up.
- Impact:
  - the answered/conversation view (`isConversationActive` in `EnrichmentStep`) gains a minimal header row (brand block + `PortalSlot`) mirroring `StagedStepHeader`'s pattern, so Menu docks flush to the content card there exactly as it does on the 4 staged steps, using the existing `.portal-slot-tab` flush treatment
  - Menu never renders as a floating fixed pill on any currently-shipped screen; the `fixed left-1/2 top-0` fallback in `FeaturePortalMenu` is retained in code only as a defensive fallback for a future headerless destination, not as a designed-for state
  - the Menu trigger drops its visible "Menu" text label and renders icon-only (the existing `☰` glyph); `aria-label="Switch feature"` carries the accessible name unchanged; `aria-haspopup`/`aria-expanded` and keyboard/focus behavior are unchanged
  - Menu's top-middle placement, the destination/action-entry registry, dropdown contents, non-overlap bounds, and CSS-only reduced-motion behavior (DEC-095/DEC-104/NFR-006) are unchanged
  - presentation only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, or data-pipeline behavior; no change to conversation logic, message history, or any flow step
- Related requirements:
  - REQ-089
  - REQ-067
  - REQ-045
  - DEC-067
  - DEC-095
  - NFR-001
  - NFR-006
  - FLOW-001
- Notes:
  - refines DEC-095; DEC-095's placement, registry, and semantics stay fully resolvable and unchanged
  - non-goals: relocating Menu off top-middle on the 4 staged screens, removing the code-level fixed fallback, redesigning the dropdown contents or destination list, adding scroll-direction-aware show/hide behavior
  - visual size/border/glow prominence of the Menu trigger is refined by DEC-121 / REQ-101 without changing this decision's docking, icon-only, or placement clauses

### DEC-110
- Decision: `ThemeControl`'s palette-swatch picker retires as an independent fixed top-right corner control and folds into the feature-portal Menu dropdown as a **Theme** section, rendered below the destination list. This removes the top-right floating orb entirely, leaving the feature-portal Menu as the suite's one floating/attached chrome affordance (DEC-109). Palette values, persistence, fallback behavior, and every surface that already consumes palette tokens (DEC-066/068/078/081) are unchanged — only where the palette picker lives moves. DEC-117 later removes the former density picker from this hosted Theme section and replaces density with automatic responsive presentation. This decision supersedes DEC-066/068/095's "`ThemeControl` stays at `fixed right-3 top-3`, top-right corner" placement clause; their palette-token/persistence/reach content stays valid and unchanged.
- Status: confirmed
- Context: `ThemeControl`'s independent `fixed right-3 top-3 z-30` placement (DEC-066) competed with the staged-step header's step-name column at mobile widths. Rather than reserve clearance around a second floating control, hosting palette selection inside the Menu leaves one chrome affordance and eliminates the collision. The hosted section originally carried both palette and density controls; DEC-117 later confirms density was a spacing workaround rather than valid user personalization, so only the palette control remains.
- Impact:
  - the palette-swatch grid renders as a **Theme** section inside the feature-portal Menu dropdown, below the destination (and action-entry) list, separated by the same divider treatment the dropdown already uses
  - the standalone `fixed right-3 top-3` `ThemeControl` corner button is removed from the app root; no floating control remains at the top-right corner
  - palette selection, browser-local persistence, corrupt/missing-value fallback to the default palette, and every existing palette-token-consuming surface (DEC-066/068/078/081) are unchanged in behavior — only the picker's host/location changes
  - selecting a palette swatch keeps its existing immediate-apply behavior; DEC-117 separately removes density selection/persistence and does not change palette behavior
  - `PageShell`'s mock-mode banner offset and z-index layering (previously keyed to "below `ThemeControl`'s z-30") is re-keyed to the Menu's existing z-index; no visual regression to the banner
  - presentation only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, scan logic, or data-pipeline behavior
- Related requirements:
  - REQ-089
  - REQ-044
  - REQ-067
  - DEC-066
  - DEC-068
  - DEC-095
  - DEC-104
  - DEC-117
  - REQ-096
  - NFR-001
  - NFR-006
- Notes:
  - supersedes only the placement clause of DEC-066/068/095 ("stays top-right corner" / "`ThemeControl` unchanged"); their palette-token, persistence, and reach content carries forward unchanged and stays resolvable under this new hosting
  - DEC-117 supersedes this decision's former density-hosting and density-preservation clauses only
  - original non-goals: changing palette values or token roles, arbitrary color picker, per-component theme overrides, account-level/server-synced palette preferences; DEC-119 supersedes the catalog/value restriction and permits arbitrary color input for Colorless only, while the existing four token roles and every other boundary remain

### DEC-111
- Decision: DEC-095/REQ-067/FLOW-010's "nothing is persisted across a page reload" clause is narrowly amended: the feature-portal's **active destination selection** now persists across a page refresh within the same browser tab, using `sessionStorage`. A refresh restores whichever destination the user was last viewing instead of always resetting to the first registered destination (`mtg-assistant`). This is the only change — the frontend-only view switch, in-session state preservation while the app stays loaded, the no-op on reselecting the current mode, and the extensible registry model (DEC-095) are all unchanged. Because `sessionStorage` does not carry across tabs, windows, or browser restarts, a brand-new tab with no prior activity still opens on the first registered destination — the existing new-session default is unchanged.
- Status: confirmed
- Context: `App.tsx` tracked the active destination in plain `useState`, defaulting to `PORTAL_DESTINATIONS[0].id` on every mount. A full page refresh always dropped the user back onto MTG Assistant even if they were mid-session on Quick Lookup, with no way to resume where they left off. DEC-095 had deliberately scoped out reload persistence for v1's simpler frontend-only view switch, but that blanket exclusion now costs users their place on refresh. Reusing the theme-palette preference pattern (`themePrefs.ts`: try/catch-guarded storage read, validated against known values, fallback to default) was the smallest fit, with `sessionStorage` chosen over that pattern's `localStorage` specifically so this reads as resuming a session rather than a durable cross-session preference, and so a brand-new tab still lands on the default destination.
- Impact:
  - the active destination id is read from `sessionStorage` on mount, validated against the currently registered `PORTAL_DESTINATIONS` ids; a missing, corrupted, or unregistered value falls back to `PORTAL_DESTINATIONS[0].id`, mirroring the existing theme-palette fallback behavior
  - selecting a destination (existing DEC-095 flow) additionally writes the selection to `sessionStorage`, guarded the same try/catch way as theme preferences so storage failures never interfere with navigation
  - each destination's own in-session state (staged flow, conversation, follow-ups) still resets fresh on every reload, unchanged — only the choice of which destination screen mounts is restored
  - a brand-new tab/window with no prior activity in that tab opens on the first registered destination, unchanged from today
  - no URL-based routing is introduced; no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any backend route
- Related requirements:
  - REQ-090
  - REQ-067
- Notes:
  - "each destination's in-session state...resets fresh on every reload" is narrowly reopened for saved conversation history by DEC-124 and for mid-flight Draft auto-hydrate by DEC-130; the active-destination restore behavior described above is otherwise unchanged
  - DEC-095
- Notes:
  - supersedes only the "nothing is persisted across a page reload" clause of DEC-095/REQ-067/FLOW-010, scoped strictly to the active-destination choice; their registry, placement, and in-session state-preservation content is otherwise unchanged and stays resolvable
  - non-goals of this decision itself: URL-based routing, changing the new-session default destination; completed-history and mid-flight Draft persistence across refresh are owned by DEC-124 / DEC-130 (not restated here)

### DEC-121
- Decision: The feature-portal Menu trigger (DEC-109) gains a **discoverability presentation pass**: thicker accent border and a **medium** accent glow on every viewport, plus **automatic responsive width** — modest (~10–15%) widen below the `768px` structural breakpoint and ~25% wider at/above it — implemented with mobile-first CSS on the existing single trigger (no Theme/layout preference, no UA sniffing, no separate mobile/desktop trees). This amends only DEC-109's visual quietness; docking, top-middle placement, icon-only label, registry/dropdown behavior, and DEC-117's automatic responsive rules remain in force.
- Status: confirmed
- Context: Users reported missing the center Menu tab entirely. The original IDEA asked for ~25% width and a stronger edge; refinement confirmed desktop can take the full ~25% widen while mobile stays milder so the header is not overwhelmed, with the thicker border and medium glow shared across viewports. A user Desktop/Mobile "setting" was explicitly rejected in favor of CSS breakpoints to stay aligned with DEC-117.
- Impact:
  - Menu trigger horizontal padding (or equivalent width treatment) increases ~10–15% vs the pre-change `px-4` / `1rem` baseline below `768px`, and ~25% at/above `768px`
  - border weight increases beyond the pre-change `border` / `border-accent/55` treatment so the tab edge reads clearly on light and dark accent palettes
  - a medium accent ring and/or box-shadow glow is applied on every viewport so the control reads as primary chrome at a glance; glow is CSS-only and must respect `prefers-reduced-motion` (no new animation library; static emphasis may remain when motion is reduced)
  - `.portal-slot-tab` flush docking to `.page-card` remains correct; touch target stays ≥44px (NFR-001)
  - presentation only — no change to destination switching, action entries, Theme section, persistence, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, backend routes, card metadata, scan behavior, or data pipeline
- Related requirements:
  - REQ-101
  - REQ-067
  - REQ-089
  - DEC-109
  - DEC-117
  - REQ-096
  - NFR-001
  - NFR-006
- Notes:
  - amends DEC-109 visual treatment only; does not relocate Menu, restore a density/layout preference, or redesign the dropdown
  - approved glow intensity: medium (clearly glowing accent edge, not subtle-only and not strong bloom)
  - superseded outright by DEC-122: the Menu trigger is rebuilt as a corner rail with a different visual language (radial fade vs. border + glow ring), so none of this decision's width/border/glow treatment carries forward

### DEC-122
- Decision: The feature-portal Menu trigger relocates from the top-middle header tab (DEC-095/DEC-109) to a **top-left corner rail** — a radial-gradient glow anchored at the header's top-left corner that fades to fully transparent well inside its own bounding box, with no border and no separate button/pill rendered on top of the glow; the glow area itself is the trigger, at the same click target and role as today's Menu button. Selecting it opens a **partial-height drawer that slides in horizontally from the left edge** (`transform: translateX`), replacing the dropdown box, while staying docked inline per-screen and never fixed to the viewport (DEC-109's guarantee carries forward unchanged, just applied to the rail/drawer instead of the top-middle tab). The **brand block moves to true center** of the header row. The **step-name text drops the top-right header slot** and becomes an in-flow **eyebrow label** — small, uppercase, same accent-gradient family as the brand block — sitting directly above each step's own content heading instead of in header chrome, carrying the same step-name values as before (REQ-045's content is unchanged, only its position moves); it stays empty on Life Tracker and the conversation view, unchanged from today. This is a **placement/interaction pivot**, not a tweak: it supersedes DEC-095's top-middle tab placement and DEC-121's width/border/glow prominence pass (never implemented, does not carry forward — the rail uses a different visual language), while preserving DEC-095's extensible destination registry, DEC-109's "never floats fixed" guarantee, and DEC-110's Theme-section-inside-the-Menu hosting.
- Status: confirmed
- Context: DEC-121's approved widen-and-glow prominence pass for the top-middle tab was never implemented in code. Before it landed, the user pivoted to a bigger direction: move Menu off the header row into a corner-anchored trigger with a sliding drawer, closer to how corner navigation affordances read across other apps. Once the trigger moved to a corner, two more header problems surfaced: the header's `1fr auto 1fr` grid is mathematically centered, but the brand block read as visually off-center once one corner carried a solid glowing rail and the opposite corner carried only bare step-name text of varying width per screen — a visual-weight mismatch, not a math bug. Separately, that top-right step-name text read as a disconnected floating label rather than integrated chrome. Both were resolved together: relocating the step-name out of the header into an eyebrow label above each step's own content removes the weight mismatch (fixing the centering complaint) and gives the text a more natural, content-anchored home (fixing the disconnected-label complaint). Earlier live mockup iteration (radial-gradient corner fade, no border) fixed a first attempt that read as a "pasted-on box" — a clipped rectangle with a hard `border-right`, however subtly tinted, always reads as pasted-on regardless of color; the fix was geometry (fade to transparent inside its own bounds), not color.
- Impact:
  - Menu trigger renders as a top-left edge-strip rail: radial-gradient anchored at the corner, decreasing alpha stops, fully transparent well inside its own bounding box, `border: none`; hover/expanded states darken the same gradient rather than adding a border or a separate button chrome
  - selecting the trigger opens a partial-height drawer via `transform: translateX(-100%)` (closed) → `translateX(0)` (open), transitioning on `transform` only, so it visibly originates from the left edge rather than dropping from a seam under the header
  - drawer and rail stay docked inline per-screen exactly as DEC-109 established for the top-middle tab; the `fixed`-position fallback remains only as the same defensive safety net DEC-109 already carved out for a hypothetical headerless destination
  - brand block (`TheJudge` / `MTG Assistant`) renders centered in the header row on every destination screen
  - step-name text (game context, zone confirmation, zone collection, enrichment, trade balancer) renders as a small uppercase eyebrow label in the accent-gradient family, positioned directly above that step's own content heading; content/values are unchanged from REQ-045/DEC-067, only the position moves out of the header grid
  - Life Tracker and the conversation view keep no step-name slot, unchanged from today
  - reduced-motion: the drawer's slide transform respects `prefers-reduced-motion` (snaps instead of animating), per NFR-006, no new carve-out needed
  - rail/drawer pixel dimensions are an implementation detail against the real header, constrained only by NFR-001's 44px touch-target minimum — not fixed by this decision
  - presentation only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, scan behavior, the destination registry, action entries, or the Theme section's contents (DEC-095/DEC-104/DEC-110 unchanged)
- Related requirements:
  - REQ-045
  - REQ-067
  - REQ-089
  - DEC-095
  - DEC-109
  - DEC-110
  - DEC-121
  - NFR-001
  - NFR-006
- Notes:
  - supersedes DEC-095's top-middle tab placement clause and DEC-121's width/border/glow treatment outright (neither carries forward); DEC-095's registry, DEC-109's "never floats fixed" guarantee, and DEC-110's Theme-section hosting all remain in force, just applied to the rail/drawer
  - REQ-101 (DEC-121's acceptance criteria) is superseded outright alongside DEC-121
  - non-goals: redesigning the dropdown/drawer's contents or destination registry; consolidating `EnrichmentStep.tsx`'s pre-existing duplicated brand-block JSX (unrelated code-health item, left for a future pass); a step-progress indicator replacing the step-name text; any backend/contract change
  - open-tray height and bottom-left corner flush are refined by DEC-133 / REQ-113 (partial-height cutoff and missing bottom radius no longer apply); corner rail, slide motion, brand centering, and eyebrow clauses remain

### DEC-133
- Decision: The feature-portal Menu's open panel (DEC-122) becomes a **full-height left tray of the outer app shell**, not a partial-height floating panel. On standard destinations the tray stretches top→bottom of `.page-card`; on Life Tracker (and any other full-bleed shell) it uses the same full left-side treatment against that outer shell. The tray always fills that height even when destination/Theme content does not — unused lower space is acceptable and may host a quiet, non-interactive decorative TheJudge brand mark. On tall/scrollable shells the tray sizes to the **visible** shell side (viewport ∩ shell), staying flush with the on-screen top and bottom of the outer component rather than spanning the shell's full scrollable document height. The tray's bottom-left corner is flush with the shell's bottom-left and uses the **same bottom-left border radius** as the shell so it does not square over the curved edge (mirroring DEC-122's existing top-left radius treatment). Slide-in motion, corner rail, Theme/registry/actions, reduced-motion, and Menu↔History mutual exclusivity remain as DEC-122/DEC-125/DEC-126 established. The tray stays shell-docked chrome (DEC-109): tracking the shell's visible rectangle is allowed; a free-floating overlay disconnected from the shell is not.
- Status: confirmed
- Context: Post-ship live use of DEC-122's partial-height drawer found the hard bottom cutoff inelegant — the open Menu should read as the entire left side of the app shell. Users clarified this means the outer component (`.page-card` / full-bleed shell), not the raw viewport bottom outside the shell, and that the tray must meet the shell's bottom-left curve cleanly rather than overwriting it. Tall destinations must not produce a mile-tall tray; visible-bounds sizing keeps the left side covered as the user scrolls. Life Tracker has no `.page-card` but should not keep the old partial-height exception.
- Impact:
  - open Menu tray height is the outer shell's left side (full shell height when the shell fits the viewport; visible shell intersection when the shell is taller than the viewport)
  - empty vertical space below Theme is intentional; optional quiet decorative brand mark in that region is non-interactive and must not become a second nav control
  - bottom-left corner radius matches the shell; top-left radius treatment from DEC-122 remains
  - Life Tracker full-bleed shell gets the same full left-side + corner treatment as `.page-card` destinations
  - presentation only — no change to destination registry, action entries, Theme contents, History zone semantics beyond shared taller-tray geometry, `AskAiRequest`, Zod schemas, prompt assembly, providers, or backend routes
- Related requirements:
  - REQ-113
  - REQ-067
  - REQ-089
  - DEC-122
  - DEC-109
  - DEC-125
  - DEC-126
  - NFR-001
  - NFR-006
- Notes:
  - amends DEC-122's partial-height drawer and bottom-corner silence only; corner rail, brand centering, eyebrow, and slide-from-left motion stay
  - non-goals: redesigning tray contents/registry/Theme; EnrichmentStep brand-block consolidation; step-progress indicator; any backend/contract change

### DEC-135
- Decision: Two post-ship corrections to the feature-portal Menu. (1) **Quick Question is the suite's default destination** and leads the registry order: Quick Question, In-Depth Question, Life Tracker, Trade Balancer, then action entries. Registry order remains both the menu's rendered order (DEC-104) and the source of the no-stored-preference default (DEC-111's session-scoped active-destination persistence is otherwise unchanged). (2) Menu entries render as **full-bleed rows separated by horizontal rules that meet the tray's left wall**, rather than inset bordered pills. Each row keeps the left inset that clears the corner rail's icon zone, but that inset lives on the row rather than on the tray's padding box, so the rules themselves run edge to edge.
- Status: confirmed
- Context: Quick Question is the fastest path to an answer and the common entry point; opening on In-Depth Question's multi-step game-context form made the heavier flow the default cost of launching the app. Separately, live review of DEC-133's full-height tray found the inset pill borders stopping short of the tray's left wall, which read as floating boxes rather than as one list occupying the shell's left side.
- Impact:
  - `loadActiveDestinationId`'s fallback resolves to Quick Question; an unregistered stored id also falls back there
  - a stored destination still wins for the rest of the tab session, and Menu selection still persists as before
  - Life Tracker → In-Depth roster seeding (DEC-110) is keyed on the destinations themselves, not on registry position, and is unaffected
  - entry rows carry their own inset and a full-bleed bottom rule; the Theme block takes a normal inset (it sits well below the rail's icon zone and a 3.5rem inset would squeeze the 5-swatch grid) and adds no second rule of its own
  - active-entry treatment keeps its check mark and quiet fill; DEC-133's tray height/corner treatment, the corner rail, brand mark, Theme contents, and action-entry semantics are unchanged
  - presentation and default-selection only — no change to the destination set, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, or backend routes
- Related requirements:
  - REQ-113
  - REQ-067
  - DEC-095
  - DEC-104
  - DEC-110
  - DEC-111
  - DEC-122
  - DEC-133
  - NFR-001
- Notes:
  - App-level test suites that exercise the In-Depth flow now seed the active destination explicitly rather than depending on which destination leads the registry
  - non-goals: adding/removing destinations, per-user default preference UI, changing action-entry behavior

### DEC-137
- Decision: **Suite chrome's interactive box may not extend beyond the affordance it paints.** Applied to the feature-portal corner rail (DEC-122/DEC-126/DEC-133), in two parts.

  (1) **Single-zone rail (destinations without a History zone).** The rail's *interactive* box is capped to **`3.5rem` tall** — the icon zone — while its radial gradient keeps painting at exactly today's `5.5rem × 10.5rem` extent as **non-interactive decoration** (`pointer-events: none`). The interactive box **keeps the painted `5.5rem` width**: on the destination where this defect bites (Life Tracker), content begins below the rail's icon zone, so capping height alone reduces the overlap to zero and width is not load-bearing. Preserving the width also keeps the icon centered exactly where it renders today (centered in `5.5rem`); narrowing the box to `3.5rem` wide would re-center the icon 16px to the left, which would be a visual change this decision does not accept. Resulting touch target is `5.5rem × 3.5rem`, comfortably above NFR-001's floor.

  (2) **Two-zone split rail (destinations with a History zone).** The Menu and History zones move from **stacked to side-by-side** within the rail's existing `5.5rem` width — each zone `2.75rem` wide × `2.75rem` tall — so the rail occupies a single `2.75rem`-tall band instead of two stacked ones. This is required, not cosmetic: only **70px** of vertical space exists between the rail's top and the step-name eyebrow, while two stacked zones at NFR-001's 44px-per-zone floor need **88px**. Stacked geometry cannot satisfy both the touch-target floor and eyebrow clearance at the same time; side-by-side satisfies both with 26px to spare. This **amends DEC-126's stacked two-zone arrangement** and is a deliberate, visible change to the rail — the only one in this decision.

  Compliance is verified by **hit-testing** the contested regions (`document.elementFromPoint` over the overlap), not by visual inspection.
- Status: confirmed
- Context: Post-ship audit at 430 × 900, after PR #71, found the rail's invisible remainder intercepting real destination content. `.portal-menu-rail` is an `88 × 168` box whose only paint is a radial gradient reaching full transparency at 78% of its own extent, at `z-index: 3` — so the majority of the box is an invisible interceptor sitting above destination content. On Life Tracker, where the rail takes its tall single-zone form and DEC-136 made each whole card half a life zone, it shadows `75 × 111` px (8,325px²) of the "Decrease life for Player 1" button; `elementFromPoint` returns `Switch feature` at every contested point, so a tap meant to adjust life opens the Menu *during a game*. On destinations carrying a History zone, the same gap covers the first 76px of the step-name eyebrow. This is not a new direction: DEC-122 already specified that "the glow area itself is the trigger". The implementation drifted from that clause, and this decision restores it rather than superseding anything. A first pass at this decision proposed narrowing the rail's *width* only; hit-testing the proposed geometry against the real card showed it would leave `43 × 111` px (4,773px²) still overlapping — a 43% reduction presented as a fix — which is why the decision now caps height and why compliance is defined by hit-testing rather than by inspection. The stacked-vs-side-by-side conflict surfaced the same way: the 70px-available / 88px-required arithmetic is not visible without measuring.
- Impact:
  - the single-zone rail's interactive box is `5.5rem × 3.5rem`; its gradient renders from a `pointer-events: none` decorative layer at the current `5.5rem × 10.5rem` extent, so that variant's appearance is byte-for-byte unchanged and the icon does not move
  - the split rail's two zones sit side-by-side in a single `2.75rem`-tall band, each `2.75rem × 2.75rem`, clearing the step-name eyebrow while holding NFR-001's per-zone floor; this variant's arrangement visibly changes
  - Menu remains the leading (left) zone and History the trailing (right) zone, preserving DEC-126's reading order
  - the zone separator rule moves from a horizontal border between stacked zones to a vertical one between side-by-side zones
  - no destination content is inset, repositioned, or resized to accommodate chrome — the fix lives entirely in the chrome
  - hover / `aria-expanded` gradient states, the top-left radius treatment, slide-in motion, drawer mechanics, Menu↔History mutual exclusivity, registry, and Theme hosting are all unchanged (DEC-122/DEC-126/DEC-133/DEC-135)
  - presentation only — no change to the destination registry, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, or backend routes
- Related requirements:
  - REQ-114
  - REQ-113
  - DEC-122
  - DEC-126
  - DEC-133
  - DEC-135
  - DEC-136
  - NFR-001
- Notes:
  - enforces DEC-122's existing "the glow area itself is the trigger" clause for the single-zone rail; supersedes nothing there
  - **amends DEC-126's stacked two-zone arrangement to side-by-side**; DEC-126's ambient-glow visual language, equal-weight zone treatment, Menu-then-History order, and NFR-001 floor all carry forward unchanged
  - DEC-126's fluid `clamp()` zone height is superseded by the fixed `2.75rem` band, since the constraint that motivated the clamp (fitting two stacked zones at every viewport) no longer applies once the zones sit side-by-side
  - the 3.5rem figure is not a new invention — `index.css` already uses it as the menu-row inset that clears this exact icon zone
  - non-goals: redesigning the rail's visual language, the drawer's contents, the destination registry, or any destination's own layout

### DEC-140
- Decision: When the feature-portal Menu tray is open, the tray surface must paint **above** and **fully occlude** non-Menu corner-rail chrome — especially the History zone on In-Depth Question and Quick Question. Icons under the open tray must not show through the tray and must not receive pointer events. The Menu trigger itself remains interactive so the user can close the tray. Menu↔History mutual exclusivity (DEC-125) still applies when History is opened by other means.
- Status: confirmed
- Context: Live review after the full-height tray (DEC-133) and side-by-side History rail (DEC-137) found History still painting through the open tray and remaining clickable. Playwright verification confirmed `.portal-menu-rail` stacks at `z-index: 3` above `.portal-menu-drawer` at `z-index: 2`, so `elementFromPoint` over the History icon while Menu is open still hits History and can open the history drawer through the tray.
- Impact:
  - open Menu tray stacking/occlusion covers the History rail zone (and any other non-Menu rail chrome under the tray's painted bounds)
  - while Menu is open, History is not visible through the tray and is not clickable; Menu remains the close control
  - Life Tracker / Trade Balancer (Menu-only rail) must not regress: open tray still reads as an opaque left shell panel over destination content
  - presentation/interaction only — no change to destination registry, Theme, History persistence, `AskAiRequest`, Zod schemas, prompt assembly, providers, or backend routes
- Related requirements:
  - REQ-115
  - REQ-113
  - REQ-114
  - DEC-122
  - DEC-126
  - DEC-133
  - DEC-137
  - DEC-125
  - NFR-001
- Notes:
  - amends open-state stacking/occlusion for DEC-122/DEC-133 relative to DEC-126's History zone; does not redesign tray contents or the rail's rest-state visual language
  - non-goals: merging History into the Menu tray, changing Menu outside-click-to-close, or altering History drawer geometry

### DEC-147
- Decision: Three corrections to the open Menu tray's presentation. (1) **Opacity extends to all destination content, not only rail chrome.** DEC-140 required the open tray to fully occlude non-Menu corner-rail chrome and to read as an opaque left shell panel; that opacity obligation now explicitly covers every destination element under the tray's painted bounds, so no page text, control, or artwork remains legible through the tray surface. (2) **The tray box is bounded by the visible shell.** The tray's own height is the shell area it occupies, not a full viewport height applied from an offset origin, so the tray element never extends past the viewport's bottom edge. (3) **The first destination row's hit area clears the rail band.** DEC-135 already gives each menu row a left inset that clears the corner rail's icon zone; that inset now governs the row's **interactive** bounds as well as its visual ones, so the Menu trigger's hit band (DEC-137's `5.5rem x 3.5rem` cap) and the first destination row no longer claim the same pixels. DEC-135's full-bleed row presentation and edge-to-edge separator rules are unchanged — no row moves down — and the Menu trigger stays interactive so the user can close the tray (DEC-140). Menu↔History mutual exclusivity, outside-click-to-close, focus trap/restore, Escape-to-close, reduced-motion behavior, and tray contents are unchanged.
- Status: confirmed
- Context: The 2026-08-05 Playwright MCP sweep found the tray at `background-color: rgba(24, 24, 27, 0.95)` with `backdrop-filter: none` and no scrim element (`scrimPresent: false`); ten destination-content elements measured inside the tray footprint and stayed legible through it, with the tray's "Send feedback" row visually colliding with Trade Balancer's "Side A $0.00 · Side B $0.00 · USD only" price line. The same sweep measured the tray element at 256x844 from y=45 (bottom 889 against an 844px viewport) on mobile and 256x900 from y=57 (bottom 957 against 900) on desktop, and measured the Menu trigger overlapping the first destination row by 88px horizontally at desktop and 32px vertically at mobile. The `ConversationHistoryDrawer` at the same viewports renders opaque over a dimming scrim and is the in-app reference for correct behavior.
- Impact:
  - the open tray surface is opaque (or backed by a scrim sufficient to make it so) across its full painted bounds on every destination
  - the tray element's measured bottom does not exceed the viewport bottom at any supported viewport
  - the Menu trigger no longer overlaps the first destination row's interactive area; both keep their NFR-001 touch targets
  - Life Tracker and Trade Balancer (Menu-only rail) and the DEC-140 History-occlusion behavior must not regress
  - presentation/interaction only — no change to the destination registry, Theme controls, History persistence, `AskAiRequest`, Zod schemas, prompt assembly, providers, or backend routes
- Related requirements:
  - REQ-122
  - REQ-115
  - REQ-113
  - REQ-114
  - NFR-001
  - DEC-140
  - DEC-133
  - DEC-135
  - DEC-137
  - DEC-134
- Notes:
  - reference pattern is the existing history drawer's opaque-surface-plus-scrim treatment; this decision does not require adopting its width or animation
  - clause (3) corrects interactive bounds only; it does not move rows, change DEC-135's full-bleed row geometry, or alter DEC-137's rail cap
  - non-goals: redesigning tray contents, the Theme section, the rail's rest-state visual language, or History drawer geometry
