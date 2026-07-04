# GAMEPLAN — card-trade-balancer

Standalone, frontend-only, ephemeral Card Trade Balancer: two sides, each a card list; per-side USD total and the live difference. New top-level nav menu switches between MTG Assistant and Trade Balancer. Powered by a new committed, lazy-loaded printing-level price artifact. No backend / endpoint / contract change.

Source of truth: `DESIGN-BRIEF.md`, REQ-064–067, NFR-013, FLOW-009/010, DEC-087/088/089.

## Architecture

Three additive layers, none of which touch the Decrypt-Stack core loop, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any endpoint:

1. **Data layer (Slice A)** — a new build script emits `apps/frontend/public/data/cardPrintingPrices.json` from the local Scryfall bulk source (`apps/frontend/data/scryfall/default-cards.json`), one entry per paper printing with `usd`/`usd_foil` + set/collector/image, plus a snapshot date. A lazy loader (`loadCardPrices.ts`, mirroring `loadScanMap.ts`) fetches it only when the Trade Balancer first opens.
2. **Chrome layer (Slice B)** — a `NavMenu` in the top-right header (non-overlapping with `ThemeControl`), plus an `appMode` view switch in `App.tsx` that mounts either the existing MTG Assistant flow or the Trade Balancer while preserving each mode's in-session state.
3. **Feature layer (Slices C, D)** — the Trade Balancer view: two sides, entry model (printing + foil + quantity), a pure pricing engine, manual-search printing picker (C), and scan input with the scanned printing as the default (D).

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
- `apps/frontend/src/components/NavMenu.tsx` — top-right navigation menu.
- `apps/frontend/src/components/trade/TradeBalancer.tsx`, `TradeSide.tsx`, `TradeEntryRow.tsx`, `PrintingPicker.tsx`.
- Co-located `*.test.ts(x)` for each.

## Files touched (existing)

- `apps/frontend/src/App.tsx` — `appMode` state + view switch + header `NavMenu` mount.
- `package.json` — add `build-card-prices.mjs` to `data:build`.
- `.gitignore` — no change expected (raw bulk already ignored; the trimmed artifact is committed).

## Reuse (before creating)

- `apps/frontend/src/lib/scan/loadScanMap.ts` — lazy-load pattern for `loadCardPrices.ts`.
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts` + scanned-printing provenance (DEC-070) — scan input default printing (Slice D).
- `apps/frontend/src/lib/search.ts` — manual name lookup (Slice C).
- `apps/frontend/src/components/ThemeControl.tsx` + the `fixed right-3 top-3` header region in `App.tsx` — nav placement without overlapping the palette control.
- `scripts/build-card-scan-map.mjs` — streaming Scryfall reader + `shouldIncludeScanPrinting` filter for the price build.
- `apps/frontend/src/components/ScanCameraSurface.tsx` — scan surface for Slice D.

## Dependency waves

| Wave | Slices | Rationale |
| --- | --- | --- |
| 1 | A, B | No cross-deps; data layer and chrome layer are independent. |
| 2 | C | Needs A (price loader) mounted at B's Trade Balancer slot. |
| 3 | D | Extends C's entry-add path with scan input; carries ship gates. |

## Verification checklist

- [ ] `npm run data:build` regenerates `cardPrintingPrices.json`; artifact has printing-id keys, `byOracleId` index, and a `snapshotDate` (Slice A).
- [ ] `loadCardPrices` fetches once, caches, and surfaces a load failure the view can handle (Slice A).
- [ ] Pricing selectors match `Σ qty × (foil ? usd_foil : usd)`, $0-on-missing, and difference direction (Slice C).
- [ ] Nav menu is reachable, non-overlapping with `ThemeControl`, and preserves each mode's in-session state (Slice B).
- [ ] Manual search → printing pick → add → foil/qty/remove updates totals + difference live (Slice C).
- [ ] Scan input defaults to the scanned printing and the printing is changeable (Slice D).
- [ ] `npm run quality:check` green for touched areas; contract-frozen (no backend/API/prompt diff).
- [ ] Final slice: PRD promotion + ship gates.
</content>
</invoke>
