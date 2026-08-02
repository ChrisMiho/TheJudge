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

### DEC-110
- Decision: `ThemeControl`'s palette-swatch and Chunky/Slim density picker retires as an independent fixed top-right corner control and folds into the feature-portal Menu dropdown as a **Theme** section, rendered below the destination list. This removes the top-right floating orb entirely, leaving the feature-portal Menu as the suite's one floating/attached chrome affordance (DEC-109). Palette values, persistence, fallback behavior, density values, and every surface that already consumes the palette tokens (DEC-066/068/075/078/081) are unchanged — only where the picker lives moves. This supersedes DEC-066/068/095's "`ThemeControl` stays at `fixed right-3 top-3`, top-right corner" placement clause; their token/persistence/reach content stays valid and unchanged.
- Status: confirmed
- Context: `ThemeControl`'s independent `fixed right-3 top-3 z-30` placement (DEC-066) competed with the staged-step header's step-name column, which had no reserved clearance for it — at mobile widths, once the step name wrapped to two lines it rendered directly under the orb (the reported bug). Rather than carve out clearance around a second floating control, removing the second control at its root and hosting theme selection inside the Menu that already exists leaves exactly one floating affordance in the header, eliminating the collision outright and reading as more consolidated and tidy. The existing action-entry pattern (DEC-104) already generalized the portal registry to host non-destination content, so a Theme section fits the same registry rather than inventing a new subsystem.
- Impact:
  - the palette-swatch grid and Chunky/Slim segmented control (currently `ThemeControl`'s dropdown body) render as a **Theme** section inside the feature-portal Menu dropdown, below the destination (and action-entry) list, separated by the same divider treatment the dropdown already uses
  - the standalone `fixed right-3 top-3` `ThemeControl` corner button is removed from the app root; no floating control remains at the top-right corner
  - palette selection, browser-local persistence, corrupt/missing-value fallback to the default palette, density selection and persistence, and every existing palette-token-consuming surface (DEC-066/068/075/078/081) are unchanged in behavior — only the picker's host/location changes
  - selecting a palette swatch keeps its existing immediate-apply behavior; the interaction details of whether the Menu closes on palette vs. density selection mirror `ThemeControl`'s current behavior and are preserved, not redesigned
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
  - NFR-001
  - NFR-006
- Notes:
  - supersedes only the placement clause of DEC-066/068/095 ("stays top-right corner" / "`ThemeControl` unchanged"); their palette-token, persistence, and reach content carries forward unchanged and stays resolvable under this new hosting
  - non-goals: changing palette values/tokens, changing density behavior, arbitrary color picker, per-component theme overrides, account-level/server-synced preferences

### DEC-111
- Decision: DEC-095/REQ-067/FLOW-010's "nothing is persisted across a page reload" clause is narrowly amended: the feature-portal's **active destination selection** now persists across a page refresh within the same browser tab, using `sessionStorage`. A refresh restores whichever destination the user was last viewing instead of always resetting to the first registered destination (`mtg-assistant`). This is the only change — the frontend-only view switch, in-session state preservation while the app stays loaded, the no-op on reselecting the current mode, and the extensible registry model (DEC-095) are all unchanged. Because `sessionStorage` does not carry across tabs, windows, or browser restarts, a brand-new tab with no prior activity still opens on the first registered destination — the existing new-session default is unchanged.
- Status: confirmed
- Context: `App.tsx` tracked the active destination in plain `useState`, defaulting to `PORTAL_DESTINATIONS[0].id` on every mount. A full page refresh always dropped the user back onto MTG Assistant even if they were mid-session on Quick Lookup, with no way to resume where they left off. DEC-095 had deliberately scoped out reload persistence for v1's simpler frontend-only view switch, but that blanket exclusion now costs users their place on refresh. Reusing the theme-palette/density preference pattern (`themePrefs.ts` / `layoutDensityPrefs.ts`: try/catch-guarded storage read, validated against known values, fallback to default) was the smallest fit, with `sessionStorage` chosen over that pattern's `localStorage` specifically so this reads as resuming a session rather than a durable cross-session preference, and so a brand-new tab still lands on the default destination.
- Impact:
  - the active destination id is read from `sessionStorage` on mount, validated against the currently registered `PORTAL_DESTINATIONS` ids; a missing, corrupted, or unregistered value falls back to `PORTAL_DESTINATIONS[0].id`, mirroring the existing theme-palette fallback behavior
  - selecting a destination (existing DEC-095 flow) additionally writes the selection to `sessionStorage`, guarded the same try/catch way as the theme/density prefs so storage failures never interfere with navigation
  - each destination's own in-session state (staged flow, conversation, follow-ups) still resets fresh on every reload, unchanged — only the choice of which destination screen mounts is restored
  - a brand-new tab/window with no prior activity in that tab opens on the first registered destination, unchanged from today
  - no URL-based routing is introduced; no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any backend route
- Related requirements:
  - REQ-090
  - REQ-067
  - DEC-095
- Notes:
  - supersedes only the "nothing is persisted across a page reload" clause of DEC-095/REQ-067/FLOW-010, scoped strictly to the active-destination choice; their registry, placement, and in-session state-preservation content is otherwise unchanged and stays resolvable
  - non-goals: persisting in-progress conversation/staged-context content across a refresh (stays ephemeral, `decisions/conversation-ux.md`), `localStorage`/cross-session durability, URL-based routing, changing the new-session default destination
