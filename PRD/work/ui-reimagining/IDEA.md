# IDEA — ui-reimagining

## Problem

A player opens the Menu, Quick Question, In-Depth Question, or Trade Balancer
and the app reads as a plain dark form, not a Magic tool — a UX-engineer
friend's verdict was "looks generic and AI-generated" (Life Tracker was the
one screen they said was fine). The chosen mana colour today only tints
accent buttons and the wordmark instead of carrying the whole surface. The
owner also named concrete friction: attached/zone cards run too large and
crowd the screen on Quick Question and In-Depth Question phone layouts,
In-Depth steps carry too many on-screen options at once, and Trade Balancer's
two sides stack awkwardly on phone instead of the desktop's clean side-by-side
layout.

## Outcome

Every in-scope screen (shared chrome, Quick Question, In-Depth Question,
Trade Balancer) reads as an arcane, premium, enchanting Magic tool: the
player's chosen mana colour drives the background wash, surface edges, focus
rings, the waiting panel, and the card-detail popup, not just accents. Motifs
are original (no Wizards of the Coast artwork), dark theme only this pass
with tokens ready for a light theme later, and the owner's friction rows are
fixed. Three clickable HTML mockup directions get built (first one early, so
the owner can correct course before the other two) and the owner approves one
before any app code changes.

## Non-goals

Life Tracker's screens and `lib/lifeTracker/` state stay pixel-identical —
every shared token it inherits gets pinned to today's value. Backend, Ask AI
prompts, scan detection, and price data are untouched. Step order and step
count stay as today; this is a visual pass, though controls may move within
a step. No official Wizards of the Coast mana-symbol artwork ships.

## Prior run

- `PRD/instructions/receipts/unified-mtg-color-themes-2026-08-03.md` — prior
  pass unifying mana-colour theming across the app; closest precedent to this
  ask's "colour carries the whole surface" goal.
- `PRD/instructions/receipts/color-profile-accent-theming-2026-06-30.md` —
  earlier accent-theming pass on the same colour-token system.
- `PRD/instructions/receipts/mtg-color-profile-refresh-2026-08-03.md` —
  palette refresh precedent.
- `PRD/instructions/receipts/palette-color-customization-expansion-2026-06-25.md`
  — palette customization precedent.
- `PRD/instructions/receipts/theme-color-customization-2026-06-24.md` —
  theme customization precedent.
- `PRD/instructions/receipts/theme-customization-expansion-2026-06-24.md` —
  theme customization precedent.
- `PRD/instructions/receipts/ui-review-2026-08-11.md` — a full-app UI review
  pass; closest process precedent to this probe-then-mockups approach.
- `PRD/instructions/receipts/ui-refinement-2026-08-02.md` — general prior UI
  refinement pass.
- `PRD/instructions/receipts/ui-compact-layout-refinement-2026-06-26.md` —
  prior layout-density refinement precedent.
- `PRD/instructions/receipts/ui-polish-subtle-effects-2026-06-29.md` — prior
  subtle-effects polish pass, relevant to E4's "subtle motion" answer.
- `PRD/instructions/receipts/ui-flare-chat-motion-2026-08-03.md` — prior
  UI-flare/motion pass on the answer chat surface.
- `PRD/instructions/receipts/excess-ui-2026-08-03.md` — prior UI-decluttering
  pass, relevant to the "too many options per step" friction row.
- `PRD/instructions/receipts/mobile-view-2026-08-02.md` — prior mobile-layout
  pass.
- `PRD/instructions/receipts/responsive-containment-and-density-2026-08-06.md`
  — layout density/containment precedent; `screen-layout.md`'s rulebook is
  authoritative and this redesign tunes rows in it, not around it.
- `PRD/instructions/receipts/adhoc-2026-08-02.md` — renamed and re-defaulted
  the theme section's layout-density labels (`ThemeSection.tsx`).
- `PRD/instructions/receipts/step-label-inline-header-2026-06-24.md` — prior
  shared-chrome header styling work.
- `PRD/instructions/receipts/center-menu-tab-prominence-2026-08-04.md` —
  prior Menu rail/tab styling work.
- `PRD/instructions/receipts/center-menu-tab-prominence-followup-2026-08-05.md`
  — follow-up on that Menu tab styling.
- `PRD/instructions/receipts/chrome-hit-areas-and-mid-flight-exits-2026-08-05.md`
  — prior shared-chrome hit-area/exit-flow work.
- `PRD/instructions/receipts/chrome-tray-conversation-history-ux-2026-08-05.md`
  — prior chrome tray / history-drawer UX work.
- `PRD/instructions/receipts/brand-subtitle-mtg-assistant-2026-07-03.md` —
  prior work on the brand wordmark/subtitle, relevant to slot C5.
- `PRD/instructions/receipts/assistant-chat-shell-2026-08-04.md` — built the
  answer-workspace chat shell that is now in scope for restyling.
- `PRD/instructions/receipts/assistant-chat-shell-followup-2026-08-05.md` —
  follow-up polish on that chat shell.
- `PRD/instructions/receipts/post-decrypt-follow-up-chat-2026-06-07.md` —
  earlier work on the same post-decrypt answer-chat surface.
- `PRD/instructions/receipts/ask-ai-wait-animation-2026-06-05.md` — the
  waiting-panel motion this redesign's "waiting-panel pulse" (E4) builds on.
- `PRD/instructions/receipts/quick-question-ui-refinement-2026-08-02.md` —
  prior Quick Question UI refinement pass, same flow now in scope.
- `PRD/instructions/receipts/game-context-controls-ergonomics-2026-07-03.md`
  — prior In-Depth zone-control layout/motion ergonomics pass, same friction
  area as owner friction row A3.
- `PRD/instructions/receipts/card-trade-balancer-2026-08-03.md` — the
  original Trade Balancer build; the UI now in scope for this redesign.
- `PRD/instructions/receipts/trade-balancer-first-card-ux-2026-09-10.md` —
  most recent Trade Balancer UX pass.
