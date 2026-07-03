---
status: active
---

# card-trade-balancer

Standalone, frontend-only, ephemeral two-sided trade balancer: build two card lists (scan or manual search), each entry a specific printing with foil toggle + quantity, and show each side's total USD value and the live diff so players can trade fairly. Reached via a new top-level navigation menu that switches between it and the Stack Assistant flow.

See `IDEA.md` for the original idea, `DESIGN-BRIEF.md` for the refined scope, and `GAMEPLAN.md` for architecture, data flow, and the verification checklist.

- Decisions: DEC-086 (feature), DEC-087 (printing-price artifact), DEC-088 (navigation menu)
- Requirements: REQ-064, REQ-065, REQ-066, REQ-067, NFR-013
- Flows: FLOW-009, FLOW-010

## Slices

| Slice | Objective | Depends on | Wave | Requirements |
| --- | --- | --- | --- | --- |
| [A](slice-a-price-artifact.md) | Printing-level price artifact + lazy loader | — | 1 | REQ-066, DEC-087, NFR-013 |
| [B](slice-b-navigation-menu.md) | Top-level nav menu + mode switch | — | 1 | REQ-067, DEC-088, FLOW-010 |
| [C](slice-c-balancer-core.md) | Balancer core: pricing engine + manual entry | A, B | 2 | REQ-064, REQ-065 (manual), FLOW-009 |
| [D](slice-d-scan-input.md) | Scan input for entries + ship | C | 3 | REQ-065 (scan), FLOW-009, DEC-070 |

A and B are parallel-ready (no cross-deps). C needs A's price loader and B's mount slot. D extends C and carries PRD promotion + ship gates.

## Implementation map

| Concern | Location |
| --- | --- |
| Price artifact build | `scripts/build-card-prices.mjs` → `apps/frontend/public/data/cardPrintingPrices.json` |
| Price lazy loader / indexes | `apps/frontend/src/lib/trade/loadCardPrices.ts` |
| Pricing engine (pure) | `apps/frontend/src/lib/trade/pricing.ts` |
| Trade Balancer view | `apps/frontend/src/components/trade/` (`TradeBalancer`, `TradeSide`, `TradeEntryRow`, `PrintingPicker`) |
| Navigation menu + mode switch | `apps/frontend/src/components/NavMenu.tsx`, `apps/frontend/src/App.tsx` |
| Reuse | `lib/scan/loadScanMap.ts`, `lib/scan/resolveScanCandidates.ts`, `lib/search.ts`, `components/ThemeControl.tsx`, `components/ScanCameraSurface.tsx`, `scripts/build-card-scan-map.mjs` |
</content>
