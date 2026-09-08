status: active

# Trade Balancer price artifact slim

Make the Trade Balancer open fast by moving pricing to the backend and deleting
the committed ~38 MB frontend price file (`cardPrintingPrices.json`). Prices are
served from a committed backend artifact on demand (one card at a time, cached
per session, mirroring the card-detail route), card identity comes from the slim
shared `cardMetadata` index, and player-facing behavior is unchanged. See
`DESIGN-BRIEF.md` for the reshaped design and `GATE-QUESTIONS.md` for the
proposed product-truth amendments.

> **Reshaped 2026-09-07.** This supersedes the earlier frontend-only slim
> (derive `imageUrl`, reconstruct `name`/`setName`, keep it frontend-only). The
> owner decided to move pricing to the backend instead; `IDEA.md` and the intake
> record the original framing.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS (build-half re-grade, run graph-20260907-235620, of the gate-finalized proposal — all ten verdicts accept, BLOCK-01 = A, nothing changed since the kickoff-half PASS; every load-bearing diff re-verified byte-for-byte against live PRD/sections and the cited code)
- Checked artifact: `PRD/work/trade-balancer-price-slim/DESIGN-BRIEF.md`
- Findings: none

## Slices

See `GAMEPLAN.md` for architecture, data flow, and the full verification
rollup. Safe sequential order for one agent: **A, B, C, D**.

| Slice | Title | Depends on | Status |
| --- | --- | --- | --- |
| [A](slice-a-backend-price-build-and-artifact.md) | Backend price build & artifact | — | done |
| [B](slice-b-backend-price-route.md) | Backend price route | A | done |
| [C](slice-c-shared-card-metadata-index.md) | Shared `cardMetadata` index | — (parallel-ready with A/B; must land before D) | done |
| [D](slice-d-frontend-balancer-flow-and-cleanup.md) | Frontend balancer flow & cleanup | A, B, C | planned |

## Implementation map

- **Backend build** — `scripts/build-card-detail-by-oracle-id.mjs` (extended);
  `scripts/build-card-prices.mjs` (retired); new artifact
  `apps/backend/data/cardPrintingPricesByOracleId.json`.
- **Backend route** — `apps/backend/src/cardPrices.ts` (new loader),
  `apps/backend/src/routes/cardPrices.ts` (new route), wired into
  `apps/backend/src/runtime/createConfiguredApp.ts` and
  `apps/backend/src/app/createApp.ts`.
- **Shared frontend index** — `scripts/build-card-metadata.mjs` (slims
  `imageUrl` → representative-printing id); new
  `apps/frontend/src/lib/cardImage.ts` (id → URL); consumers:
  `QuickLookupApp.tsx`, `MtgAssistantApp.tsx`, `CardPresentation.tsx`,
  `CardSelectionPreview.tsx`.
- **Frontend balancer flow** — new
  `apps/frontend/src/lib/trade/fetchCardPrintings.ts` replaces
  `apps/frontend/src/lib/trade/loadCardPrices.ts` (deleted); `oracleSearch.ts`
  and `useTradeScan.ts` re-pointed at `cardMetadata`; printing picker sourced
  from the fetched printings list; `apps/frontend/public/data/cardPrintingPrices.json`
  deleted.
- **Product truth** — REQ-064/065/066/174/175, FLOW-009, FLOW-025 (new),
  NFR-004/013/014 applied to `PRD/sections/` alongside their corresponding
  code slice (see `GAMEPLAN.md`'s product-truth table); never deferred to
  cleanup.
