# GAMEPLAN — card-trade-balancer

Standalone, frontend-only, ephemeral Card Trade Balancer: two sides, each a card list; per-side USD total and the live difference. Registers as a destination in the `feature-portal` (which owns nav chrome + the mode switch). Powered by a new committed, lazy-loaded printing-level price artifact. No backend / endpoint / contract change.

Source of truth: `DESIGN-BRIEF.md`, REQ-064–066, NFR-013, FLOW-009, DEC-087/088. Nav chrome (REQ-067, FLOW-010, DEC-095) is owned by `feature-portal`; the balancer depends on it.

## Architecture

Two additive layers, none of which touch the Decrypt-Stack core loop, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any endpoint:

1. **Data layer (Slice A)** — a new build script emits `apps/frontend/public/data/cardPrintingPrices.json` from the local Scryfall bulk source (`apps/frontend/data/scryfall/default-cards.json`), one entry per paper printing with `usd`/`usd_foil` + set/collector/image, plus a snapshot date. A lazy loader (`loadCardPrices.ts`, mirroring `loadScanMap.ts`) fetches it only when the Trade Balancer first opens.
2. **Feature layer (Slices C, D)** — the Trade Balancer view: two sides, entry model (printing + foil + quantity), a pure pricing engine, manual-search printing picker (C), and scan input with the scanned printing as the default (D). The view is registered as a `feature-portal` destination and mounts in the portal's Trade Balancer slot; no nav chrome is built here.

> Nav chrome + the `appMode`/mode-switch layer are **owned by `feature-portal`** (DEC-095, elevated out of this package) and are a prerequisite for the feature layer, not built here.

### Data flow

```
default-cards.json ──build-card-prices.mjs──> cardPrintingPrices.json (committed)
                                                     │ lazy fetch on first open
                                                     ▼
manual search (search.ts) ─┐              loadCardPrices() ──> { printings[id], byOracleId }
scan (resolveScanCandidates)┼─> TradeEntry{printing,foil,qty} ──> pricing.ts selectors
                            │                                        │
                            ▼                                        ▼
                     PrintingPicker (list a card's printings)   sideTotal / difference / missing-price
```

- `sideTotal(entries) = Σ qty × (foil ? usd_foil : usd)`; a null selected-mode price contributes `$0` and is flagged (distinct color + caution triangle).
- `difference` = `{ amount: |A−B|, higher: 'A' | 'B' | 'equal' }`.
- Manual add resolves an oracle card by name (existing `search.ts`), then lists that card's printings via `byOracleId` for the picker. Scan resolves to the scanned printing id (`Candidate.card_id`, DEC-070) → default printing via `printings[id]`; the user can change it.
- Printing selection is a pricing/display layer only — never pushed into prompt context, rulings, or any request payload; DEC-053 oracle-level scan identity is unchanged.

## New files (planned)

- `scripts/build-card-prices.mjs` — artifact build (streaming reader modeled on `build-card-scan-map.mjs`).
- `apps/frontend/src/lib/trade/loadCardPrices.ts` — lazy loader + typed indexes (`printings`, `byOracleId`, `snapshotDate`).
- `apps/frontend/src/lib/trade/pricing.ts` — `TradeEntry`, `entryUnitPrice`, `entryContribution`, `entryHasMissingPrice`, `sideTotal`, `difference` (pure).
- `apps/frontend/src/components/trade/TradeBalancer.tsx`, `TradeSide.tsx`, `TradeEntryRow.tsx`, `PrintingPicker.tsx`.
- Co-located `*.test.ts(x)` for each.

> No `NavMenu.tsx` / `App.tsx` `appMode` changes here — that chrome is built by `feature-portal`. This package registers `TradeBalancer` as a portal destination.

## Files touched (existing)

- `package.json` — add `build-card-prices.mjs` to `data:build`.
- `feature-portal` destination registry — add the Trade Balancer destination entry (see `feature-portal` GAMEPLAN; the registry itself is built there).
- `.gitignore` — no change expected (raw bulk already ignored; the trimmed artifact is committed).

## Reuse (before creating)

- `apps/frontend/src/lib/scan/loadScanMap.ts` — lazy-load pattern for `loadCardPrices.ts`.
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts` + scanned-printing provenance (DEC-070) — scan input default printing (Slice D).
- `apps/frontend/src/lib/search.ts` — manual name lookup (Slice C).
- `feature-portal` destination registry + Trade Balancer mount slot — the balancer registers here instead of building its own nav chrome (DEC-095).
- `scripts/build-card-scan-map.mjs` — streaming Scryfall reader + `shouldIncludeScanPrinting` filter for the price build.
- `apps/frontend/src/components/ScanCameraSurface.tsx` — scan surface for Slice D.

## Dependency waves

| Wave | Slices | Rationale |
| --- | --- | --- |
| 1 | A | Data layer; no cross-deps. (Runs alongside `feature-portal`, a separate package.) |
| 2 | C | Needs A (price loader) and the `feature-portal` Trade Balancer mount slot (portal ships first). |
| 3 | D | Extends C's entry-add path with scan input; carries ship gates. |

> **Cross-package prerequisite:** `feature-portal` (DEC-095) must ship before Slice C so its destination registry / mount slot exists. See `suite-build-order` (portal is sequenced first).

## Verification checklist

- [ ] `npm run data:build` regenerates `cardPrintingPrices.json`; artifact has printing-id keys, `byOracleId` index, and a `snapshotDate` (Slice A).
- [ ] `loadCardPrices` fetches once, caches, and surfaces a load failure the view can handle (Slice A).
- [ ] Pricing selectors match `Σ qty × (foil ? usd_foil : usd)`, $0-on-missing, and difference direction (Slice C).
- [ ] Trade Balancer is reachable as a `feature-portal` destination and mounts in the portal's Trade Balancer slot (nav chrome verified in `feature-portal`, not here).
- [ ] Manual search → printing pick → add → foil/qty/remove updates totals + difference live (Slice C).
- [ ] Scan input defaults to the scanned printing and the printing is changeable (Slice D).
- [ ] `npm run quality:check` green for touched areas; contract-frozen (no backend/API/prompt diff).
- [ ] Final slice: PRD promotion + ship gates.
</content>
</invoke>
