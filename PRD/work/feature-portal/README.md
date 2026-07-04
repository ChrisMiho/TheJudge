---
status: active
---

# feature-portal

Top-middle feature portal (elevated from DEC-089, repositioned by DEC-095) — a header menu button backed by an extensible destination registry and a frontend-only mode switch so users can move between suite features without cluttering the UI. Owns app navigation chrome; features register as destinations rather than shipping their own menu.

- Decisions: DEC-095 (feature portal — top-middle, registry, ownership), refines DEC-089; DEC-066 / DEC-065 (ThemeControl placement + non-overlap precedent)
- Requirements: REQ-067
- Flows: FLOW-010
- NFRs: NFR-001, NFR-006
- See `DESIGN-BRIEF.md` for refined scope, `GAMEPLAN.md` for architecture + verification checklist.

## Slices

| Slice | Objective | Depends on | Requirements |
| --- | --- | --- | --- |
| [A](slice-a-registry-and-switch.md) | Destination registry + state-preserving mode switch (extract `MtgAssistantApp`, shell + `DestinationOutlet`) | — | REQ-067, FLOW-010, DEC-095 |
| [B](slice-b-portal-menu.md) | Top-middle portal button + dropdown chrome; ship (PRD promotion + ship gates) | A | REQ-067, FLOW-010, DEC-095, DEC-065, NFR-001, NFR-006 |

Sequential: B renders Slice A's registry and calls its `setActiveDestination`, so the button is inert without A (stated blocker in `GAMEPLAN.md`). B is the final slice and carries the PRD promotion checklist + ship gates.

**Status:** Slice A done (registry, `MtgAssistantApp` extraction, `DestinationOutlet` shipped and verified). Slice B done (`FeaturePortalMenu` shipped and verified) — since revised twice per user feedback: first into a flush "docked tab" with an accent-colored outline and a "Trade" rename, then again into an inline header slot (button portals into `StagedStepHeader` between the brand and step name on the staged-flow screens, falling back to the fixed tab on destinations without a header, e.g. Trade). See slice B's "Post-ship revision" notes. Verified visually at 375px and desktop widths via Playwright screenshots. Ready for `thejudge-cleanup`.

## Implementation map

| Concern | Location |
| --- | --- |
| Registry types | `apps/frontend/src/lib/portal/types.ts` |
| Destination registry (`PORTAL_DESTINATIONS`) | `apps/frontend/src/components/portal/destinationRegistry.tsx` |
| Extracted MTG Assistant flow | `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (from `App.tsx`) |
| Trade Balancer placeholder (swap point for `card-trade-balancer`) | `apps/frontend/src/components/portal/TradeBalancerPlaceholder.tsx` |
| State-preserving view switch | `apps/frontend/src/components/portal/DestinationOutlet.tsx` + shell state in `App.tsx` |
| Portal button + dropdown | `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` |
| Open/close motion | `apps/frontend/src/index.css` (reuses motion tokens + `prefers-reduced-motion` block) |
| Reuse | `components/ThemeControl.tsx` (sibling-chrome pattern), `components/PageShell.tsx`, existing `App.*.test.tsx` (regression) |

## Lookup suite sequence

Portal is the **first** package in the lookup-suite build order. Destinations that register here:

| Destination | Work package | Notes |
|---|---|---|
| MTG Assistant | (shipped) | Default / existing main flow |
| Card Trade Balancer | `card-trade-balancer` | Nav ownership moves from balancer slice B into this package |
| Card Lookup | `card-lookup-qa` | Lightweight Ask AI mode `"card"` |
| Rules Lookup | `rules-lookup` | Browse topics + Ask AI mode `"rules"` |

Suggested order after portal: Ask AI mode contract (`game` \| `card` \| `rules`) on existing `POST /api/ask-ai` → card-lookup UI → rules browse → rules ask.

See `IDEA.md` for the original idea. Refinement will align DEC-089 / REQ-067 / FLOW-010 and update `card-trade-balancer` so navigation ownership lives here.
