# IDEA: Trade Balancer price artifact slim

**Problem.** The first time a player opens the Trade Balancer, the app
downloads and parses a single ~38 MB `cardPrintingPrices.json` file before the
screen is usable — a multi-second stall on mobile. This is a size/perf
problem, separate from the weekly price-freshness refresh.

**Outcome.** Slim the committed price artifact so the balancer opens fast.
Derive `imageUrl` from the printing `id` at runtime instead of storing it, and
reconstruct `name`/`setName` from data the app already loads, keeping the fix
entirely frontend-only (preserves the "frontend-only, no backend call"
posture). Only fall back to a backend per-card price lookup if the frontend
slim is measured and still isn't enough — that fallback is a real product-truth
reversal, not a silent implementation choice, and is refinement's call to
make, not this package's.

**Non-goals.** No change to player-facing behavior — scan/search a card, pick
its printing, per-printing USD prices, foil toggle, $0-plus-caution for
missing prices, ephemeral trade math all stay as-is. Not the weekly
data-freshness refresh (independent track, its own package). No backend move
by default — it is a conditional fallback, gated on the frontend-slim
measurement.

**Evidence.** Staged intake:
`PRD/work/trade-balancer-price-slim/intake/GRAPH-BRIEF-size.md` — a
self-contained, investigate-first brief with a measured field breakdown of
the 38 MB artifact (imageUrl 8.6 MB / 44% of value bytes and derivable from
`id`; setName 1.7 MB / 8%; name 1.5 MB / 7%) and a two-step design direction
(frontend slim first, backend lookup only if needed). The intake cites
`PRD/work/probe-trade-balancer-price-freshness/FINDINGS-size-and-backend.md`
for the full underlying measurement — that document is not opened here; only
its path is recorded as a citation. Intake is evidence, not authority: it
proposes findings and a slug but does not decide product truth — that is
refinement's job with the owner.

## Prior run

- `PRD/instructions/receipts/card-trade-balancer-2026-08-03.md` — built the
  price artifact and pricing lib now being slimmed (`scripts/build-card-prices.mjs`
  → `cardPrintingPrices.json`, `lib/trade/{loadCardPrices,pricing}.ts`).
- `PRD/instructions/receipts/trade-balancer-spec-2026-08-26.md` — receipt for
  the Trade Balancer feature-spec consolidation this package's PRD amendments
  will touch.
- `PRD/instructions/receipts/ui-review-2026-08-11.md` — added the Trade
  Balancer "Prices as of \<date\>" freshness row to `screen-layout.md`; same
  price-data ground.
- `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md`
  — TradeBalancer route code-splitting and chunk-load performance work;
  adjacent "opens fast" concern, different lever (bundle chunking, not data
  size).
- `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-17.md`
  — same route/code-splitting topic, a later pass.
- `PRD/instructions/receipts/feedback-delivery-onboarding-2026-08-05.md` —
  Trade Balancer scan smoke-test onboarding check; touches Trade Balancer
  runtime behavior but not the price artifact itself.
- `PRD/instructions/receipts/center-menu-tab-prominence-2026-08-04.md` —
  `TradeBalancer.tsx` header/UI change; unrelated to price data.
- `PRD/instructions/receipts/feature-portal-2026-07-04.md` — Trade Balancer
  portal-destination entry swap (placeholder → real component); unrelated to
  price data.
- `PRD/instructions/receipts/brand-subtitle-mtg-assistant-2026-07-03.md` —
  branding pass over `PRD/work/card-trade-balancer/`; unrelated to price data.
- `PRD/instructions/receipts/adhoc-2026-08-02.md` — removed/tracked the
  `trade-balancer` portal-destination entry; unrelated to price data.
