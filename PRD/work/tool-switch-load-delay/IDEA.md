# tool-switch-load-delay

Owner request (verbatim): "why is there such a delay when i go from the question flow to the life tracker, over to the trade balancer, theres a few seconds of loading, is this something we could fix?"

Problem: a player moving from the question flow to the Life Tracker, then to the Trade Balancer, waits a few seconds on a "Loading…" screen each time a tool is opened for the first time.

Outcome: switching between tools feels instant, or the wait is explained and shortened to something the player does not notice.

Non-goals: no decision on the fix yet; no change to keeping visited tools mounted (REQ-067); no change to Trade Balancer price data.

## Prior run

- PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-17.md (each tool is its own lazy-loaded piece; Loading fallback; visited tools stay mounted)
- PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md (earlier receipt on the same routing and code-splitting ground)
- PRD/instructions/receipts/trade-balancer-first-card-ux-2026-09-10.md (health-check warm-up ping on Trade Balancer open; first-card price cold start)
- PRD/instructions/receipts/trade-balancer-price-slim-2026-09-08.md (Trade Balancer price data slimmed)
- PRD/instructions/receipts/compact-data-extracts-2026-09-09.md (data extract size and chunking)
- PRD/instructions/receipts/card-trade-balancer-2026-08-03.md (Trade Balancer origin)
- PRD/instructions/receipts/player-life-tracker-2026-08-03.md (Life Tracker origin)
