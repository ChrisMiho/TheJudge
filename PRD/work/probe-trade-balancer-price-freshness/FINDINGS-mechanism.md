# Findings — why Trade Balancer prices are stale, and how to keep them fresh

## The player-facing problem

The Trade Balancer prices every card from one committed snapshot dated
`2026-06-05` and shows `Prices as of 5 June 2026`. MTG prices move daily, so at
3 months old the totals a player trusts to balance a trade are wrong — the exact
job the feature exists to do.

## Root cause: it's a process gap, not a bug

The staleness is not a defect in the code. It is the designed behavior with no
one performing the manual step that refreshes it.

- Prices load from a **static committed artifact**:
  `apps/frontend/public/data/cardPrintingPrices.json` (~38 MB, 95,895 printings).
  The runtime reads only this file — by explicit decision there is **no live
  fetch, no runtime sync, no scheduled refresh** (DEC-087, DEC-088, NFR-013).
- The only refresh path is human-run and manual:
  `npm run data:refresh` (`scripts/refresh-scryfall-data.mjs`) downloads the
  Scryfall bulk `default-cards.json`, then runs `npm run data:build`, which runs
  `scripts/build-card-prices.mjs` to re-emit the artifact with a fresh
  `snapshotDate`. Someone then commits the churn and opens a PR.
- Running `data:refresh` **is** the human approval for the Scryfall download
  (REQ-093 / DEC-162). Nothing runs it on a schedule. It has simply not been run
  since June, so the snapshot froze there.

## What the refresh actually does (cost of automating it)

`data:refresh` is coarse. It re-downloads default-cards + rulings + the WotC
Comprehensive Rules + Commander Spellbook combos, then `data:build` rebuilds
**every** data artifact — metadata, rulings, rule embeddings, prices, combos —
not just prices. So the naive "just automate data:refresh" rebuilds far more
than the price file.

- The price artifact is written as single-line minified JSON
  (`JSON.stringify(artifact)`, no spacing), so a refresh is effectively a
  whole-file replacement. Git stores a fresh ~38 MB blob every time it changes —
  cadence drives history growth (monthly ≈ 12 × ~38 MB/year of blob history).
- A narrower path exists: download only `default-cards.json` and run only
  `node scripts/build-card-prices.mjs`, committing only
  `cardPrintingPrices.json`. This is the cheapest refresh that fixes the feature
  without touching embeddings, rulings, or combos.

## The two real directions

**A — Automate the offline rebuild (stays inside the frozen architecture).**
A scheduled CI job (GitHub Actions cron; the repo already has
`.github/workflows/quality-check.yml` and OIDC/deploy plumbing) runs the refresh
on a cadence, then opens a PR the owner merges. This keeps every closed-door
decision intact — still a static committed snapshot, still no runtime sync — and
only removes the "a human has to remember" failure mode. Merge stays human, so
a bad Scryfall day never auto-ships.

- Scope choice: prices-only refresh (cheapest, sharpest) vs. full `data:refresh`
  (keeps all corpora fresh in one job, more churn).
- Cadence choice: weekly keeps prices within a week; monthly halves churn but
  tolerates up to a month of drift. Recommend weekly, prices-only.

**B — Live / near-live pricing (reopens closed doors).** Fetch prices at runtime
from Scryfall or a price API per printing. This directly contradicts DEC-087
("frontend-only, no backend call, no live quote"), DEC-088, and NFR-013, needs a
backend proxy (Scryfall rate limits + CORS), and is a much larger reshape.
Scryfall itself distributes prices via the **daily bulk file** and asks
integrators not to poll per-card prices — so even "live" MTG pricing is really a
once-a-day bulk, which Direction A already delivers. Not recommended.

## Recommendation

Direction A, prices-only, weekly, auto-PR. It is the lightest change that
actually makes the freshness reliable, keeps the feature's frozen contract, and
keeps the human in the loop at merge. The freshness copy in the UI
(`Prices as of <date>`, REQ-145) already reflects `snapshotDate`, so it updates
for free with each merged refresh.

## Constraints a build must respect

- Do not add any runtime price fetch or runtime sync — NFR-013 / DEC-087 /
  DEC-088 forbid it. This is a build-time refresh only.
- Scryfall bulk download is human-approved (REQ-093 / DEC-162). A scheduled CI
  job needs the owner's explicit blessing as the standing approval, and should
  degrade gracefully (the build already keeps the prior artifact on a failed or
  missing source).
- Merge to `main` stays a human PR merge — never auto-commit to main.
- The refreshed artifact is large; prefer the prices-only path to keep git
  history growth bounded, and consider whether the ~38 MB committed file should
  move toward a lighter delivery later (out of scope for the freshness fix).
