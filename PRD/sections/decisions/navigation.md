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
