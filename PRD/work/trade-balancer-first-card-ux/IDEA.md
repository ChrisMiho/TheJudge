# IDEA — trade-balancer-first-card-ux

## Problem

In the Trade Balancer, tapping a search suggestion adds the card with
whatever printing the build happens to sort first (a Scryfall UUID sort),
not the printing the player wants — so cards routinely land on an obscure
random set, and 6.7% of the time on a foil-only printing that opens at
$0.00 with a caution warning. Long printing lists (Sol Ring 128 rows, basic
lands ~750) render inline and push the page to 10,000+ px tall, forcing
128 image requests on open. The first card of every session also prices in
~4.2 s because the pricing API only wakes up when the player adds their
first card, not when the screen opens.

## Outcome

A player picks the correct printing before the card is added (search path),
sees it priced correctly right away because foil mode auto-selects from
whichever of foil/non-foil actually has a price, browses long printing
lists inside a short scrollable, filterable box instead of an
ever-growing page, and gets a fast first price because the balancer pings
the API the moment the screen opens instead of waiting for the first add.

## Non-goals

- Scheduled keep-warm pings (infra change, owner decides separately).
- Lazy per-route backend init.
- Changing the scan path (`useTradeScan`) — it keeps adding with the
  scanned printing; "Change printing" still exists for corrections.
- New fields on `cardMetadata.json` or the price artifact (printing count
  shows in the picker header only, computed from the already-fetched list).

## Prior run

- `PRD/instructions/receipts/trade-balancer-price-slim-2026-09-08.md` — PR #212 shipped the fetch-on-add pricing model but, as a side effect, removed the pre-add printing picker and the "N printings" suggestion count this run restores.
- `PRD/instructions/receipts/trade-balancer-spec-2026-08-26.md` — wrote the current-state `PRD/sections/trade-balancer/README.md` and `data/cardPrintingPrices.md` this run amends in place (no new IDs).
- `PRD/instructions/receipts/card-trade-balancer-2026-08-03.md` — original Trade Balancer ship receipt; established REQ-064–066, NFR-013, FLOW-009 that this run amends.
- `PRD/instructions/receipts/compact-data-extracts-2026-09-09.md` — most recent change to the committed price artifact (per-record gzip to brotli blocks); this run's build-time printing-sort change touches the same artifact and must stay inside its 120 MB budget.
- `PRD/instructions/receipts/weekly-data-refresh-pr-2026-09-08.md` — shipped `npm run data:refresh-pr`, the path that will eventually rebuild the price artifact with this run's newest-first sort if the build worktree can't rebuild it directly.
