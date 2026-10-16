# Gameplan — tool-switch-load-delay

Player outcome: after the first screen is up, every other tool opens at once, with no "Loading…" screen.

Product truth: `DESIGN-BRIEF.md` plus `GATE-QUESTIONS.md` Diffs 1-4 as finalized (NFR-014 `edit`, Q-014 `accept`). Build applies the diffs to `PRD/sections/` by intent, together with the code. Measurements: `evidence/measurements.md`.

## Architecture and data flow

1. Tier 1: the landing destination loads as today.
2. Tier 2: once it has rendered and the browser is idle, a background download calls `preload()` for every other registered destination.
3. Tier 3: after every tier-2 call is made, the shared card-list module starts the one `/data/cardMetadata.json` download. Quick Question, In-Depth and the Trade Balancer read from it; each keeps its own loading state, failure copy and index.
4. A failed download is silent and clears its cached promise; the tap retries.
5. The download never mounts a tool or sends the balancer health ping.

## Slices

| Slice | Title | Depends on | Diffs |
| --- | --- | --- | --- |
| A | Shared card list | none | 4 |
| B | Tiered background download | A | 1, 2, 3 |
| C | Live timing check and ship gates | A, B | promotion check |

Sequential: B calls A's load for tier 3; C measures the finished build.

## Verification checklist

- `npm --workspace apps/frontend run test`
- `npm run typecheck`
- `npm run quality:check` (no coverage threshold lowered, NFR-012)
- Slice C: production build plus `vite preview`, rAF-timed taps on Fast 4G / Slow 4G with CPU 4x; browser and server cleaned up per `PRD/instructions/runtime-process-hygiene.md`.

Non-goals: keep-alive mounting, card list size, Brotli, caching headers, price data, loading copy.
