status: active

# Mobile View — Header Collision & Nav Hub Consolidation — GAMEPLAN

Two independent `fixed`-position header controls collide at mobile widths. The fix consolidates
down to **one** floating/attached chrome control (the feature-portal Menu) and gives every
destination screen its own inline header slot so Menu always docks flush and never floats fixed
on any currently-shipped screen.

Sources of truth: DEC-109/DEC-110 (`sections/decisions/navigation.md`), REQ-089
(`sections/functional-requirements.md`), FLOW-001 (`sections/user-flows.md`).

## Architecture

### Current shape (grounding)

- `App.tsx` renders a standalone `<div className="fixed right-3 top-3 z-30"><ThemeControl .../></div>`
  alongside `<FeaturePortalMenu>` — two independent fixed-position controls, no shared layout awareness.
- `ThemeControl.tsx` owns its own trigger button (`aria-label="Theme"`, swatch preview) plus a
  dropdown body (palette swatch grid + Chunky/Slim density toggle). Only consumer is `App.tsx`.
- `FeaturePortalMenu.tsx` owns the Menu trigger (`☰ Menu` text, `aria-label="Switch feature"`) and
  its destination-list dropdown. It portals its trigger into a `<PortalSlot />` registered by the
  active destination's header when one exists (`portal-slot-tab` flush-docking, `index.css`); with
  no registered slot it falls back to `fixed left-1/2 top-0 z-30`.
- `StagedStepHeader.tsx` (used by the 4 staged MTG Assistant steps) renders a 3-column grid
  (`grid-cols-[1fr_auto_1fr]`): brand block, `<PortalSlot />`, step name — this is the pattern that
  gives Menu its flush inline dock.
- `EnrichmentStep.tsx`'s `isConversationActive` branch renders its own minimal `<header><h1>TheJudge</h1></header>`
  with **no** `PortalSlot` — the only currently-shipped destination screen without one — so Menu
  falls back to the fixed pill there, pinned above a narrower, padded content card while the thread scrolls beneath it.
- `.mock-mode-banner` (`index.css`) is `z-index: 20` with a comment keying it "below ThemeControl's z-30".

### Target shape

1. **Theme-in-Menu consolidation** (Slice A, DEC-110). `ThemeControl`'s dropdown body (palette
   swatch grid + density toggle) is extracted into a standalone presentational piece and rendered
   as a **Theme** section inside `FeaturePortalMenu`'s dropdown, below the destination list and a
   divider. The standalone `fixed right-3 top-3` `ThemeControl` wrapper is removed from `App.tsx`
   entirely — no floating control remains at the top-right corner. `FeaturePortalMenu`'s trigger
   also drops its visible `Menu` text (icon-only, `☰` + unchanged `aria-label="Switch feature"`),
   since this is the same trigger markup already being touched. `ThemeControl.tsx` becomes dead code
   (no remaining consumer) and is deleted along with its test file. The `.mock-mode-banner` z-index
   comment is re-keyed to reference the Menu's z-index instead of the retired `ThemeControl`.
2. **Conversation-view Menu docking** (Slice B, DEC-109). `EnrichmentStep`'s `isConversationActive`
   branch header gains a `<PortalSlot />` alongside the brand block, mirroring `StagedStepHeader`'s
   grid pattern (brand | slot | empty spacer, for the same top-middle centering every other screen
   gets) — brand-only otherwise, no step name (FLOW-001). Once this slot exists, `FeaturePortalMenu`
   already prefers the inline slot path over its fixed fallback with zero changes to
   `FeaturePortalMenu.tsx` itself — the fallback becomes unreachable on any currently-shipped screen,
   but stays in code as the documented defensive net for a hypothetical headerless destination.

Both slices touch disjoint files and depend on nothing the other slice produces — parallel-ready.

## Data flow

```
App.tsx
  ├─ useThemePalette() / useLayoutDensity()  ──paletteId/density + setters──▶ FeaturePortalMenu
  │                                                                             (Theme section, Slice A)
  └─ FeaturePortalMenu(destinations, activeDestinationId, onSelect)
        ├─ children: DestinationOutlet → active destination's own view
        │     MTG Assistant staged steps → StagedStepHeader renders <PortalSlot />        (existing)
        │     MTG Assistant conversation view → EnrichmentStep renders <PortalSlot />     (Slice B, new)
        │     Trade / other headerless destinations → no slot, fixed fallback (unchanged, non-goal)
        └─ trigger portals into whichever <PortalSlot /> is currently registered & visible,
           else renders the fixed left-1/2 top-0 fallback (PortalSlotContext, unchanged)
```

No change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or
`POST /api/ask-ai` in either slice — presentation-only chrome consolidation.

## Slice dependency map

| Slice | Depends on |
| --- | --- |
| A — Theme-in-Menu consolidation + icon-only trigger | — |
| B — Conversation-view Menu docking | — |

A and B are both parallel-ready; neither blocks the other.

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` green (updated `FeaturePortalMenu.test.tsx`, new
      `ThemeSection.test.tsx`, `ThemeControl.test.tsx` removed, updated `EnrichmentStep`-area specs)
- [ ] `npm --workspace apps/frontend run typecheck` green
- [ ] No `fixed right-3 top-3` control remains anywhere in `apps/frontend/src`
- [ ] Opening the Menu on any staged step or the conversation view shows the same dropdown:
      destinations, divider, Theme section (palette swatches + Chunky/Slim toggle)
- [ ] Palette/density selection still persists via the existing `useThemePalette`/`useLayoutDensity`
      hooks and browser-local storage keys — unchanged behavior, only relocated host
- [ ] Menu trigger renders icon-only (`☰`) with no visible "Menu" text on every screen;
      `aria-label="Switch feature"` unchanged
- [ ] Conversation/answered view: Menu docks inline (`portal-slot-tab`, not `fixed`) and scrolls
      away with the page, verified via an `<App />`-level integration test reaching that view
- [ ] `ThemeControl.tsx` and `ThemeControl.test.tsx` deleted; no remaining references
- [ ] `.mock-mode-banner` z-index comment in `index.css` references the Menu, not `ThemeControl`
- [ ] `npm run quality:check` green for touched areas (final slice)
