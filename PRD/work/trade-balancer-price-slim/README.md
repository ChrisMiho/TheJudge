status: refined

# Trade Balancer price artifact slim

Slim the Trade Balancer's committed price artifact (`cardPrintingPrices.json`,
~38 MB) so the balancer opens fast, by deriving `imageUrl` from the printing
`id` and reconstructing `name`/`setName` at load time — frontend-only, with a
backend per-card price lookup only as a fallback if the frontend slim isn't
enough. See `IDEA.md` for problem/outcome/non-goals and the intake evidence
this package was seeded from.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/trade-balancer-price-slim
