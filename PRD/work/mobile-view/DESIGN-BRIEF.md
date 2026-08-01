# Mobile View — Header Collision & Nav Hub Consolidation — DESIGN BRIEF

## Scope

Two mobile header bugs share one root cause — two independent `fixed`-position controls (`ThemeControl`'s palette/density corner button and the feature-portal Menu's floating fallback) compete for the same header space with no layout awareness of each other:

1. **Orb/header collision**: `ThemeControl` renders `fixed right-3 top-3`, completely outside the staged-step header's grid. At mobile widths the step-name column has no reserved clearance, so wrapped step-name text (e.g. "Game context") renders directly under it.
2. **Nav hub feels bolted-on**: the answered/conversation screen has no header slot, so the Menu control falls back to `fixed left-1/2 top-0` — glued to the raw viewport edge above the (narrower, padded) content card, staying pinned while the user scrolls a growing conversation.

Fix direction: consolidate down to **one** floating/attached chrome control instead of patching clearance around two. Theme/density selection folds into the feature-portal Menu; every destination screen (including the answered/conversation view) gets its own inline header slot so Menu always docks flush to its content card and scrolls away with the page, never floating fixed. The Menu trigger also drops its visible "Menu" label for an icon-only affordance.

## Decisions

- **DEC-109** (`decisions/navigation.md`) — the feature-portal Menu is the suite's one floating/attached chrome affordance; every destination screen renders an inline header slot so Menu always docks flush and never floats fixed by design (the code-level fixed fallback remains only as a defensive safety net for a hypothetical headerless destination); trigger becomes icon-only. Refines DEC-095.
- **DEC-110** (`decisions/navigation.md`) — `ThemeControl`'s palette/density picker retires as an independent top-right corner control and folds into the feature-portal Menu as a **Theme** section. Supersedes only DEC-066/068/095's "stays top-right corner" placement clause; palette tokens, persistence, fallback, and reach are unchanged.

## Requirements & flow

- **REQ-089** — Mobile header consolidation: retire the floating theme control, attach Menu everywhere, icon-only trigger.
- **FLOW-001** note updated: the answered-state header now also carries an inline Menu slot (still brand-only otherwise, no step name).

## Mockup

`mockup.html` in this folder — a static before/after phone-frame reference for the three changes below (orb/header collision, Theme-in-Menu dropdown, conversation-view docking), built from the current component code. Layout reference only, not pixel-final; open it directly in a browser during map-out/implement to confirm the intended structure before writing slices.

## Design direction (for map-out; not yet product truth)

- `EnrichmentStep`'s `isConversationActive` branch header (`<header><h1>TheJudge</h1></header>`) gets a `<PortalSlot />` added alongside the brand block, mirroring `StagedStepHeader`'s pattern, so it reuses the existing `.portal-slot-tab` flush-to-card treatment.
- Remove the standalone `<div className="fixed right-3 top-3 z-30"><ThemeControl .../></div>` from `App.tsx`; move `ThemeControl`'s palette-swatch grid + density toggle into `FeaturePortalMenu`'s dropdown as a "Theme" section below the destination list, reusing existing palette/density state, handlers, and persistence as-is.
- `FeaturePortalMenu`'s trigger button drops the `<span>Menu</span>` text node, keeps the `☰` glyph and existing `aria-label="Switch feature"`.
- Re-key `MockModeBanner`'s z-index comment/offset (currently "below ThemeControl's z-30") to reference the Menu's z-index instead.
- The `fixed left-1/2 top-0` fallback branch in `FeaturePortalMenu` stays in code as a defensive path but is not expected to trigger on any currently-shipped screen once every destination has a slot.

## Non-goals (v1)

Relocating Menu off top-middle on the 4 staged screens; removing the fixed-fallback code path entirely; redesigning the Menu dropdown's destination list or content beyond adding the Theme section; scroll-direction-aware show/hide behavior; changing palette values, tokens, or density behavior; a full IA overhaul of navigation; desktop layout changes (mobile-specific).

## Reused, unchanged

- `ThemeControl`'s palette tokens, browser-local persistence, corrupt/missing fallback, and density logic (DEC-066/068/075).
- Feature-portal registry, destinations, action entries, non-overlap discipline, CSS-only reduced-motion (DEC-095/DEC-104/NFR-006).
- `StagedStepHeader` grid and `.portal-slot-tab` flush-docking CSS — reused, not reinvented, for the conversation view's new header slot.
- No change to `AskAiRequest`, `GameContext`, prompt assembly, provider boundary, or `POST /api/ask-ai`.

## Open questions

None.
