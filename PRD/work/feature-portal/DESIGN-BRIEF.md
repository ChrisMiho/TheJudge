# Design Brief: feature-portal

## Summary

A first-class **feature portal** that owns TheJudge's top-level navigation chrome. A single menu button in the **top-middle** of the header (filling the current header deadspace) opens a dropdown of destinations, backed by an **extensible destination registry** so suite features register as destinations rather than each inventing its own entry chrome. Switching destinations is a frontend-only view switch that preserves each mode's in-session state while the app stays loaded. Elevated out of `card-trade-balancer` (its planned nav-menu slice is retired); the portal ships first and the balancer depends on it. No backend, endpoint, or contract change.

## Scope

- **Top-middle menu button** (REQ-067, FLOW-010, DEC-095): a portal button centered in the header, distinct from and non-overlapping with the left brand block and the top-right `ThemeControl` (which stays at `fixed right-3 top-3`, DEC-066 unchanged). Opening it shows a dropdown listing destinations with the current mode indicated; the same menu is the path back. Dropdown affordance (not a persistent inline switcher) — DEC-089's interaction model, repositioned. Open/close motion is CSS-only and reduced-motion-aware (NFR-006).
- **Extensible destination registry** (DEC-095): each destination is an entry `{ id, label, current-view mount }`; a feature registers a destination entry instead of adding its own nav chrome, and adding a destination requires no portal redesign.
- **v1 destinations**: **MTG Assistant** (the existing Decrypt-Stack flow / start screen) and **Trade Balancer** (DEC-087). `card-lookup-qa` and `rules-lookup` register when they ship — no portal change beyond a registry entry.
- **Frontend-only mode switch** (DEC-095, DEC-089): each mode's in-session state is preserved while the app stays loaded (an in-progress MTG Assistant flow survives a round-trip); selecting the current mode is a no-op that does not reset state; nothing is persisted across a page reload.
- **Three non-overlapping header regions** (DEC-065 precedent): brand block (left), portal button (center), `ThemeControl` (right) have non-overlapping visual bounds and pointer hit areas at mobile and desktop sizes.

## Key decisions

- **DEC-095** — Elevate the top-level nav into a first-class feature-portal package: top-middle menu button (repositioned from DEC-089's top-right), extensible destination registry, features register as destinations; v1 = MTG Assistant + Trade Balancer; frontend-only, state-preserving, contract-frozen. **Refines DEC-089**; ownership moves out of `card-trade-balancer`.
- **DEC-089** — Original top-level nav menu / mode switch (frontend-only, state-preserving, contract-frozen). Carried forward unchanged in semantics; placement and ownership refined by DEC-095.
- **DEC-066** — `ThemeControl` palette control keeps the top-right corner, unchanged.
- **DEC-065** — Non-overlap precedent for corner/chrome controls (visual bounds + hit areas).

## Non-goals (this work)

- No per-feature entry points or competing navigation chrome; features only register as destinations.
- No backend routing, server-side navigation state, or endpoint/contract change (`AskAiRequest`, `GameContext`, prompt assembly, provider boundary, `POST /api/ask-ai` all unchanged).
- No persistence across page reload.
- No redesign of any destination's internals (MTG Assistant, Trade Balancer, or future lookup features).
- No change to `ThemeControl` placement or behavior.
- No persistent inline switcher / tab bar (dropdown affordance chosen).

## Requirements & flows

- REQ-067 — Feature portal — top-level app navigation
- FLOW-010 — Switch destinations via the feature portal
- NFR-001 — Mobile-first (touch-friendly, uncrowded header)
- NFR-006 — CSS-only, reduced-motion-aware decorative motion

## Reuse (before creating)

- Existing app chrome and header region in `apps/frontend/src/App.tsx` (`fixed right-3 top-3` `ThemeControl` mount) — place the portal button in the top-middle without overlapping the brand block or the palette control (DEC-065 non-overlap precedent).
- `apps/frontend/src/components/ThemeControl.tsx` / `PageShell.tsx` as the sibling chrome pattern.
- The `appMode` view-switch approach the retired `card-trade-balancer` Slice B sketched (mount destinations and toggle visibility to preserve in-session state) — realized here as the portal's registry-driven switch.

## Ownership move (card-trade-balancer)

The nav-menu build originated in `card-trade-balancer` as planned Slice B. That slice is retired: `card-trade-balancer` no longer builds nav chrome, no longer owns REQ-067/DEC-089, and instead **registers the Trade Balancer as a portal destination**, depending on `feature-portal` for its mount slot / mode switch. The portal is sequenced first (matches `suite-build-order`).

## Open questions

None blocking. Exact button styling, dropdown layout, and responsive breakpoints are outcome-validated presentation details, not product open questions.
