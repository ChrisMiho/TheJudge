# Graph-run brief — Trade Balancer: pick the printing first, fast first card, scrollable picker

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets

- Searching a card and tapping its name opens that card's printing list right there — sorted newest first, each row showing set, number, price, and a thumbnail — and the card is added with the printing the player taps. No more "it added something random, now find Change printing".
- A printing that only exists as foil (or only as non-foil) is priced correctly the moment it's chosen; the Foil toggle starts in whichever mode has a price instead of showing ⚠ $0.00.
- Long printing lists (Sol Ring 128, basic lands ~750) live in a scrollable box a few rows tall with a set-name filter, so Side B and the totals stay in reach. Thumbnails load as they scroll into view.
- The first card of a session prices in well under a second instead of ~4 s, because the API is woken up the moment the balancer opens, while the card list downloads and the player is still typing.

## Why (measured — do not re-derive)

Live site https://mtgjudge.gg on 2026-09-09, `main` at fb1d9cc (after #212 price-slim and #225 compact-data-extracts).

| Symptom | Measurement |
|---|---|
| First card slow | `GET /api/cards/:oracleId/prices` via the Lambda URL: **4.21 s cold**, 0.20 s and 0.17 s warm. On-page warm click→priced 262 ms. Cause: cold start (`lambda.ts` awaits SSM, then four artifacts are brotli-decoded synchronously). Local dev never shows it |
| Random default printing | Build sorts each card's printings by Scryfall UUID (`a.id.localeCompare(b.id)` in `scripts/build-card-detail-by-oracle-id.mjs`); the frontend takes `printings[0]`. Sol Ring lands on "Lorwyn Eclipsed Commander #57" |
| ⚠ $0.00 on a priced card | Entry always starts `foil:false`. **2,530 of 37,564 cards (6.7 %)** have a foil-only printing in slot 0, so they open at $0 + caution. Sol Ring: 23 foil-only of 128 |
| Picker unrolls the page | Sol Ring picker: 128 rows, **10,748 px** tall on an 844 px viewport, Side B pushed to y=11,500, **128 image requests** on open. Corpus max 771 printings (Mountain) |
| "Locally it showed total results" | True pre-#212: suggestions carried "N printings" and the picker opened **before** adding. #212 removed both when the bulk price file went away. Not a cloud-resources difference |

REQ-065 still reads "the user finds a card by name … then **chooses the correct printing** from that card's printing list **before it is added**". The code and the feature README drifted from it in #212; this run brings both back in line.

## Decisions already made — do not re-litigate

1. **Pick-before-add for manual search.** Tapping a suggestion fetches that card's printings (same cached route), shows the picker inline in place of the suggestions with a loading state, and the entry is added with the tapped printing. Scan keeps its current path (entry added with the scanned printing; "Change printing" stays for corrections on any row).
2. **Printing count shows in the picker header, not in the suggestion row.** The count is only known after the per-card fetch; growing `cardMetadata.json` with a per-card count is rejected (it is the shared index every destination downloads).
3. **Newest printing first is the order everywhere** (picker and any fallback default). Sort at **build time** by Scryfall `released_at` desc, then collector number; do **not** add a `releasedAt` field to the artifact or the wire — the wire order is the contract. Zero byte cost.
4. **Foil mode auto-selects from the printing's prices.** When an entry gets a printing (pick, scan resolve, change printing, retry): if `usd` is null and `usdFoil` is not, foil = on; if `usdFoil` is null and `usd` is not, foil = off; otherwise keep the player's current toggle (default off). The toggle stays free to move into a no-price mode ($0 + caution, unchanged).
5. **Picker is a region-scroll box** (about 5–6 rows tall, `max-height` ~40vh), rows use `loading="lazy"` images, the selected printing scrolls into view, and a set-name filter input appears when a card has more than 8 printings.
6. **Cold start is hidden, not eliminated.** When the Trade Balancer mounts, fire one `GET /api/health` alongside the `cardMetadata` fetch (fire-and-forget, no UI). This overlaps the ~4 s init with the ~1 s card-list download and the player's typing. A scheduled keep-warm ping is **out of scope** for this run (infra change in `aws-bootstrap.sh`; owner decides separately). Lazy per-route init in the backend is also out of scope.
7. **No new REQ/FLOW/DEC IDs required.** Amend REQ-065, REQ-066, FLOW-009, FLOW-025 and the feature README in place. The decision log is retired.

## Design direction (converged)

- `apps/frontend/src/components/trade/TradeSide.tsx`: restore a `pendingCard` state. Suggestion tap → `fetchCardPrintings(oracleId)` → picker inline with "Loading printings…" then the list; pick → `onAddByOracle(sideId, oracleId, name, printing.id)` (the existing `preferredPrintingId` seam already selects it on resolve, from cache). Cancel returns to the search box.
- `apps/frontend/src/components/trade/PrintingPicker.tsx`: header shows "N printings"; scroll region; lazy images; filter by set name/code when N > 8; keep `aria-current` on the selected row and scroll it into view on open.
- `apps/frontend/src/components/trade/TradeBalancer.tsx`: one pure helper `defaultFoilFor(printing, currentFoil)` applied wherever `printing` is set on an entry (`selectPrinting` resolve path, `handleChangePrinting`, retry). Mount-time warm-up call next to the existing `cardMetadata` fetch (use `apiBaseUrl` from `lib/env`).
- `apps/frontend/src/lib/trade/pricing.ts` stays pure and untouched unless the foil helper fits there better than in the component.
- `scripts/build-card-detail-by-oracle-id.mjs`: sort printings by `released_at` desc, then `collector_number` (numeric-aware), instead of by id. Rebuild `apps/backend/data/cardPrintingPricesByOracleId.json.br`; size must not grow (no new fields). Update the build's test to assert the order.
- Backend route and loader unchanged.
- Tests: `TradeBalancer.test.tsx` (pick-before-add, foil auto-select for foil-only and non-foil-only printings, warm-up call issued on mount), `PrintingPicker` (count header, filter, scroll container present), build script test (order). Keep `TradeBalancer.scan.test.tsx` green: scan path unchanged.

## Current-state PRD truth to amend

- `PRD/sections/trade-balancer/README.md` — "Adding a card to a side": manual search bullet (currently "defaulting to whichever printing the on-add fetch returns first … Change printing") becomes pick-before-add with the picker's count header and newest-first order; foil bullet gains the auto-select rule; a new "Measured bounds" line for the picker region-scroll (rows/height) and the mount-time warm-up; "Where it lives" unchanged.
- `PRD/sections/functional-requirements.md` **REQ-065** — keep the "chooses the correct printing … before it is added" bullet (it is already right); change "default is non-foil" to the auto-select rule; add the scroll/lazy-image/filter acceptance for the picker.
- `PRD/sections/functional-requirements.md` **REQ-066** — printings are emitted newest-first (`released_at` desc, then collector number); order is part of the artifact contract; no new per-printing field.
- `PRD/sections/user-flows.md` **FLOW-009** (line ~199 manual-search step) and **FLOW-025** (step 3 "the printing picker lists every printing" → the picker is shown before add for search; add the mount-time warm-up as a note; default-foil rule as an edge case).
- `PRD/sections/screen-layout.md` `#### Trade Balancer` row — the printing picker region-scrolls inside the side; page does not grow with printing count.
- `PRD/sections/system-map.md` `## Trade balancer` entry only if a file is added (none expected).

## Constraints (don't rediscover)

- Mock-default local dev must keep working: the warm-up call is fire-and-forget and must never surface an error or block search when the backend is down.
- The scan path (`useTradeScan`, `TradeBalancer.scan.test.tsx`) is not changed by this run; the scanned printing remains the default and stays changeable.
- Do not add fields to `cardMetadata.json` or to the price artifact; NFR-013's mobile-friendly budget and the Lambda budget test (`scripts/lambda-package-budget.test.mjs`) must stay green. The rebuilt price artifact should be byte-similar (same fields, new order).
- Rebuilding the artifact needs the local Scryfall bulk file; if `npm run data:build` cannot run in the build worktree, the sort change ships with its test and the artifact is rebuilt by the next `data:refresh-pr` — say so in the receipt.
- Keep-warm scheduling, lazy backend init, and `Cache-Control` on `/data/*` are named here as related follow-ups, not part of this run.
- Printing selection stays a pricing/display layer only (never reaches prompt context or any request payload).

## Evidence + reusable tooling

`PRD/work/probe-trade-balancer-first-card-ux/FINDINGS-live-observation.md` (numbers, repro steps, what was ruled out) and the four screenshots under that folder's `.playwright-mcp/`. Re-measure cold start with:

```
curl -s -o /dev/null -w "%{time_total}\n" https://24yhnhknx5sc24cvtb7szdz76q0uruif.lambda-url.us-east-1.on.aws/api/cards/4457ed35-7c10-48c8-9776-456485fdf070/prices
```

## What the graph run should produce

A DESIGN-BRIEF that takes the seven decisions above as settled; in-place amendments to REQ-065, REQ-066, FLOW-009, FLOW-025, the trade-balancer README, and the screen-layout row; and slices roughly along: (A) build-time newest-first order + artifact rebuild + test, (B) pick-before-add search flow, (C) foil auto-select helper, (D) scrollable/lazy/filterable picker, (E) mount-time API warm-up. Verify in the browser at 390×844 that the Sol Ring picker stays inside the viewport and that a foil-only printing prices on pick.

## How to hand this off

/graph-kickoff "Trade Balancer: pick the printing before adding, auto-select foil mode, scrollable printing picker, and wake the API on open so the first card prices fast" PRD/work/probe-trade-balancer-first-card-ux/GRAPH-BRIEF.md
