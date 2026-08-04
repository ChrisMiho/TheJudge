---
status: active
---

# card-trade-balancer

Standalone, frontend-only, ephemeral two-sided trade balancer: build two card lists (scan or manual search), each entry a specific printing with foil toggle + quantity, and show each side's total USD value and the live diff so players can trade fairly. **Registers as a destination in the `feature-portal`** (which owns app navigation chrome) rather than shipping its own nav menu.

See `IDEA.md` for the original idea, `DESIGN-BRIEF.md` for the refined scope, and `GAMEPLAN.md` for architecture, data flow, and the verification checklist.

- Decisions: DEC-087 (feature), DEC-088 (printing-price artifact)
- Requirements: REQ-064, REQ-065, REQ-066, NFR-013
- Flows: FLOW-009
- Depends on: `feature-portal` (DEC-095, REQ-067, FLOW-010) — owns the nav chrome + mode switch; the balancer registers as a destination and mounts in the portal's Trade Balancer slot. Nav-menu ownership moved out of this package.

## Slices

| Slice | Objective | Depends on | Wave | Requirements |
| --- | --- | --- | --- | --- |
| [A](slice-a-price-artifact.md) | Printing-level price artifact + lazy loader | — | 1 | REQ-066, DEC-088, NFR-013 |
| [C](slice-c-balancer-core.md) | Balancer core: pricing engine + manual entry | A, `feature-portal` | 2 | REQ-064, REQ-065 (manual), FLOW-009 |
| [D](slice-d-scan-input.md) | Scan input for entries + ship | C | 3 | REQ-065 (scan), FLOW-009, DEC-070 |

**Status: A, C, D are `done`.** All implementation slices are complete; the package is ready for `thejudge-cleanup` (PRD promotion + receipt + delete `PRD/work/card-trade-balancer/`).

Slice A is parallel-ready. C needs A's price loader and the `feature-portal` Trade Balancer mount slot (nav chrome is built by `feature-portal`, not here). D extends C and carries PRD promotion + ship gates. (The former Slice B — nav menu + mode switch — was retired; that chrome now lives in `feature-portal`.)

## Implementation map

| Concern | Location |
| --- | --- |
| Price artifact build | `scripts/build-card-prices.mjs` → `apps/frontend/public/data/cardPrintingPrices.json` |
| Price lazy loader / indexes | `apps/frontend/src/lib/trade/loadCardPrices.ts` |
| Pricing engine (pure) | `apps/frontend/src/lib/trade/pricing.ts` |
| Trade Balancer view | `apps/frontend/src/components/trade/` (`TradeBalancer`, `TradeSide`, `TradeEntryRow`, `PrintingPicker`) |
| Navigation menu + mode switch | Owned by `feature-portal` (out of scope here); the balancer registers as a portal destination and mounts in the portal's Trade Balancer slot |
| Reuse | `lib/scan/loadScanMap.ts`, `lib/scan/resolveScanCandidates.ts`, `lib/search.ts`, `components/ScanCameraSurface.tsx`, `scripts/build-card-scan-map.mjs`, plus the `feature-portal` destination registry / mount slot |
</content>
