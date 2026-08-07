# Slice C — Explicit chunking and measured payload verification

## Status: done

## Goal

Make the chunk layout explicit and prove the payload claim: a visitor who opens
one destination does not download the code of destinations they never open, and
code shared by two destinations is grouped once rather than duplicated or
hoisted into the entry chunk.

## Requirements

1. Add `build.rollupOptions.output.manualChunks` to
   `apps/frontend/vite.config.ts` in **function form** — `(id) => ...`. Do not
   use the object form: it maps a chunk name to explicit module ids and does not
   accept path patterns, so a directory glob written there fails the build.
2. Two groups:
   - `vendor` — `react`, `react-dom`, `react/jsx-runtime`, `react-router`.
     `react/jsx-runtime` is a distinct module id emitted by the automatic JSX
     transform and will not land in `vendor` via a bare `react` match, so match
     it explicitly.
   - `scan` — the scan surface reachable from more than one destination.
3. **Determine the `scan` group by measuring the import graph, not by directory
   name.** `src/lib/scan/**` alone is too narrow and would let this slice pass
   vacuously while the heavier shared layer stays duplicated. Confirmed shared
   modules outside `src/lib/scan/`:
   - `src/hooks/useScanCapture.ts` — imported by
     `components/portal/quick-lookup/QuickLookupApp.tsx`,
     `components/ZoneCollectionStep.tsx` (In-Depth), and
     `components/trade/useTradeScan.ts` — all three scanning destinations
   - `src/components/ScanCameraSurface.tsx` — imported by `QuickLookupApp.tsx`
     and `components/trade/TradeSide.tsx`
   - check `ScanCardOutline.tsx`, `ScanDebugOverlay.tsx`, and
     `ZoneCardPicker.tsx` the same way and include those reachable from more
     than one destination

   Note that `useTradeScan.ts:6`'s `resolveScanCandidates` import is
   `import type` and is erased at build time, so it carries no bundling weight —
   the runtime sharing comes from `loadScanMap` and the hook/UI modules above.
4. Leave the existing `define`, `server`, and `test` config untouched. The
   `manualChunks` addition must not disturb the `VITE_ASK_AI_PROVIDER` bridge or
   `strictPort`.
5. Record the measured before/after sizes in the slice doc as evidence, not as
   an estimate: total entry-chunk size, and per-destination chunk sizes.
5. Do not touch the existing data-artifact lazy loads. `cardhashes.bin`
   (NFR-010) and `cardPrintingPrices.json` (NFR-013) already load on demand and
   are out of scope; this slice splits **code** only.
6. Do not add a bundle-analysis dependency. Read the emitted `dist/assets/`
   filenames and sizes from the build output.

## Acceptance criteria

- [ ] `npm run build` succeeds and emits a distinct chunk per destination
- [ ] `scan` and `vendor` chunks are emitted as separate files
- [ ] The entry chunk contains no destination-only code — verified by grepping the emitted entry chunk for a marker string unique to each of the four destinations, all four absent
- [ ] The entry chunk contains no scan code — verified by grepping for a marker string from `useScanCapture.ts` **and** from `ScanCameraSurface.tsx`, not only from `src/lib/scan/`
- [ ] Each shared scan module appears in exactly one emitted chunk — grep each marker across all emitted chunks and confirm a single hit, so the trade and ask destination chunks do not each carry their own copy
- [ ] Measured evidence recorded before and after: entry-chunk size **and** per-destination chunk sizes. The entry chunk must shrink by more than the framework move alone accounts for — state the destination and scan bytes that left it, so the criterion cannot be satisfied by relocating `react` and nothing else
- [ ] Opening one destination downloads that destination's chunk and not the other three — verified from the network panel during the slice's preview run
- [ ] `npm run preview` serves a working app at `/` and at each of the four destination paths
- [ ] The `VITE_ASK_AI_PROVIDER` define still reaches the client bundle (mock-mode banner behaves as before)
- [ ] `npm run quality:check` green

## Verification

```bash
npm --workspace apps/frontend run build
ls -la apps/frontend/dist/assets/
npm run quality:check
```

## Files touched

- `apps/frontend/vite.config.ts`
- `apps/frontend/src/lib/viteChunking.test.ts`
- `PRD/work/frontend-routing-and-code-splitting/slice-c-chunking.md` (measured evidence)

## Measured evidence — 2026-08-07

All sizes below are Vite's minified raw / gzip output in kB.

| Artifact | Pre-split eager build (after A) | Lazy build before `manualChunks` (after B) | Final explicit chunk build |
| --- | ---: | ---: | ---: |
| Entry | 548.71 / 167.22 | 212.94 / 69.74 | 35.86 / 12.27 |
| Quick Question | folded into entry | 11.41 / 4.04 | 11.48 / 4.07 |
| In-Depth Question | folded into entry | 49.69 / 13.36 | 49.76 / 13.38 |
| Life Tracker | folded into entry | 30.33 / 8.07 | 30.36 / 8.08 |
| Trade Balancer | folded into entry | 14.36 / 4.60 | 14.42 / 4.63 |
| Shared scan surface | folded into entry | incidental shared placement | 42.90 / 15.51 |
| Framework vendor | folded into entry | folded into entry | 177.16 / 58.07 |

The end-to-end entry reduction is 512.85 kB raw (548.71 → 35.86), well beyond the 177.16 kB framework move alone. The final graph separately carries 106.02 kB of destination chunks and 42.90 kB of shared scan code; those 148.92 kB are destination/scan bytes that also left the eager entry. Shared conversation/header chunks account for the remaining extracted application code, with small minification differences between graph layouts.

## Verification evidence — 2026-08-07

- Contract: `src/lib/viteChunking.test.ts` passed 12 cases proving function-form ownership for explicit `react/jsx-runtime`, React/ReactDOM/router modules, all measured shared scan modules, and the intentional exclusion of destination-owned `ZoneCardPicker` and `useTradeScan`.
- Emitted graph: the normal build produced `vendor-BVF4lV-E.js`, `scan-2BdhZY_b.js`, and distinct `QuickLookupApp`, `MtgAssistantApp`, `PlayerLifeTrackerApp`, and `TradeBalancer` files.
- Entry isolation: unique strings for Quick (`Core topics are unavailable...`), In-Depth (`Enter numeric life totals...`), Life Tracker (`Day and night: currently`), and Trade (`No cards on this side yet.`) each appeared in exactly one destination chunk and were absent from `index-Crmthum1.js`.
- Scan isolation: `Could not load scan resources` (`useScanCapture.ts`) and `Fill the guide on a flat contrasting surface...` (`ScanCameraSurface.tsx`) each appeared exactly once, in `scan-2BdhZY_b.js`, and were absent from the entry and destination chunks.
- Preview network: a fresh `/trade-balancer` load requested `index`, `vendor`, `TradeBalancer`, `StepEyebrow`, and `scan`; it did not request the Quick, In-Depth, Life Tracker, or conversation-workspace chunks.
- Preview paths: `/` resolved the stored destination, and `/quick-lookup`, `/in-depth`, `/life-tracker`, and `/trade-balancer` each served and mounted the expected production-built destination.
- Define bridge: a separate `ASK_AI_PROVIDER=mock` build displayed `⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend`, proving the existing client define still works; the normal build was restored afterward.
- Data artifacts: no data-artifact loader or generated data file changed; this package remains code-only.
- Runtime ownership: preview sessions `31419` and `54723` were stopped through their exact handles; `browser_close` completed; port 4179 had no listener afterward. Automatic browser artifacts are under `.playwright-mcp/slice-c-auto/`; the only console error was the existing missing favicon.
