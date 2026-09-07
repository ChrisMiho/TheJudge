# Weekly data-refresh-and-PR script

## Problem

The Trade Balancer shows stale card prices because the only refresh path is a
human running `npm run data:refresh` → `data:build` and then hand-committing
and opening a PR — nobody has run it since 5 June, so the snapshot froze.

## Outcome

A one-command local script the owner runs weekly: it refreshes the Magic-data
artifacts (via the existing `data:refresh` pipeline), and if anything changed,
cuts a branch off `origin/main`, commits, pushes, and opens a PR to `main` for
the owner to merge.

## Non-goals

No CI cron and no runtime sync — the script is local and owner-invoked, same
as today's manual pipeline, just wrapped for one-command convenience plus PR
automation. Slimming the price artifact or moving pricing to a backend
endpoint is out of scope (tracked separately).

## Owner's framing (verbatim)

> A weekly one-command local script: refresh the data, cut a branch off
> origin/main, commit, push, open a PR you merge. Reuses the existing
> data:refresh pipeline; no runtime sync. Open choice for refinement: full
> refresh vs prices-only (I recommend full to start).

## Intake

Staged intake copied verbatim into `intake/GRAPH-BRIEF.md`. It cites further
evidence at `PRD/work/probe-trade-balancer-price-freshness/` (`FINDINGS-mechanism.md`,
`FINDINGS-size-and-backend.md`) — those citations are recorded as paths only;
not opened by this node. Intake is evidence, never authority: every product
decision it raises (including the full-vs-prices-only scope choice) is still
made at the define/refinement gate.

## Prior run

- `PRD/instructions/receipts/card-trade-balancer-2026-08-03.md` — original
  build of `scripts/build-card-prices.mjs` → `cardPrintingPrices.json` and the
  Trade Balancer's price-loading code.
- `PRD/instructions/receipts/trade-balancer-spec-2026-08-26.md` — authored
  `PRD/sections/trade-balancer/data/cardPrintingPrices.md`, the corpus doc this
  run's PRD amendment targets.
- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md` — added
  the combo download to `scripts/refresh-scryfall-data.mjs`, joining it to the
  `data:refresh` pipeline this run wraps.
