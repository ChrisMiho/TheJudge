# Graph-run brief — Weekly local data-refresh script that opens a PR to main

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets

The Trade Balancer stops showing stale prices. Today it reads a committed
snapshot dated **5 June 2026** — three months old — so the side totals a player
trusts to balance a trade are wrong. This gives the owner a **single local
command** to refresh the underlying Magic data every week; each run ends as a PR
to `main` that, once merged and deployed, moves the balancer's
`Prices as of <date>` line forward. The freshness copy already reflects the
artifact's `snapshotDate` (REQ-145), so it updates for free with each merged
refresh.

Scope note: the refresh rebuilds all committed Magic-data corpora (prices,
rulings, combos, rules), so rulings and combo data stay fresh on the same
cadence — the player-visible win is trade prices, but the mechanism is the whole
data pipeline.

## Why (measured — do not re-derive)

The staleness is a **process gap, not a bug**. The prices load from a static
committed artifact and — by explicit design (DEC-087, DEC-088, NFR-013) — there
is no runtime sync and no scheduled refresh. The only refresh path is a human
running `npm run data:refresh` → `npm run data:build`, then committing and
opening a PR. Nobody has run it since 5 June, so the snapshot froze there.

- Stale artifact: `apps/frontend/public/data/cardPrintingPrices.json`,
  `snapshotDate` `2026-06-05T22:21:13.248Z`, ~38 MB, 95,895 printings.
- Existing refresh tooling that already works and needs only to be wrapped:
  - `npm run data:refresh` → `scripts/refresh-scryfall-data.mjs`: downloads the
    Scryfall `default_cards` + `rulings` bulk, the WotC Comprehensive Rules, and
    the Commander Spellbook combos, then runs `data:build`. It degrades
    gracefully — a failed or missing source keeps the prior committed artifact.
  - `npm run data:build` → runs `scripts/build-card-prices.mjs` (among others),
    which re-emits `cardPrintingPrices.json` with a fresh `snapshotDate` resolved
    from the Scryfall bulk `updated_at`.
- The human-approval requirement for the Scryfall download (REQ-093 / DEC-162) is
  satisfied by the owner **running the script locally** — the same "invoking the
  refresh is the approval" rule already in force. No CI network-download gate is
  introduced.

## Decisions already made — do not re-litigate

- **A local, owner-invoked script — not a CI cron.** The owner runs one command
  weekly; the script does the work and ends in a PR. (Owner directive.)
- **Ends as a PR to `main`, never a direct push to main.** The script creates a
  new branch off `origin/main`, commits the refreshed artifacts, pushes the
  branch, and opens a PR the owner merges; deploy happens from that merge. This
  matches the repo's "trunk is reached only by a PR the owner merges" rule.
- **Reuse the existing pipeline.** Wrap `npm run data:refresh` (which already
  does download → `data:build`); do not reimplement downloading or transforms.
- **No runtime sync is added.** This is the same build-time, human-approved
  offline pipeline, wrapped for one-command convenience plus PR automation. The
  DEC-087 / DEC-088 / NFR-013 "no live fetch, no runtime sync" posture is
  unchanged — the runtime still reads only the committed artifact.
- **Out of scope for this run:** slimming the price artifact and any move of
  pricing to a backend endpoint. That is a separate, larger reshape that reverses
  DEC-087 and is tracked as its own investigation
  (`PRD/work/probe-trade-balancer-price-freshness/FINDINGS-size-and-backend.md`).
  Do not fold it in here.

## Design direction (converged)

A new root script (e.g. `scripts/refresh-and-open-pr.mjs`, wired as a new
`npm run data:refresh-pr` or similar) that:

1. Verifies a clean working tree (refuse if dirty, to avoid committing unrelated
   changes) and fetches `origin/main`.
2. Creates a branch off `origin/main`, e.g.
   `chore/data-refresh-<YYYY-MM-DD>`.
3. Runs `npm run data:refresh` (download → `data:build`) — the existing,
   graceful-degradation pipeline.
4. If refreshed artifacts changed, stages and commits them with a dated message;
   if nothing changed, exits cleanly without a branch/PR (nothing to ship).
5. Pushes the branch and opens a PR to `main` via `gh pr create` with a body
   summarizing the new `snapshotDate` and which corpora changed.
6. Prints the PR URL. The owner reviews and merges; deploy follows the merge.

Open decision for refinement (recommend the default): **full `data:refresh`**
(reuses existing tooling, keeps every corpus fresh weekly) vs. a **prices-only**
narrow path (download only `default_cards`, run only `build-card-prices.mjs`,
commit only `cardPrintingPrices.json` — smaller git churn since each refresh
rewrites the whole ~38 MB minified file). Recommendation: start with full
`data:refresh` for minimal new code; note prices-only as a churn-reduction
follow-up.

Guardrails the script must honor:
- Never push to `main`; only a feature branch + PR.
- Refuse to run on a dirty tree.
- Exit without a PR when no artifact changed.
- Preserve graceful degradation — a failed Scryfall download keeps the prior
  artifact (already true in the underlying script); the wrapper must not commit
  an empty or broken refresh.

## Current-state PRD truth to amend

- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — the "Where it comes
  from and how it is built" section currently says refresh happens "solely
  through the human-approved pipeline (`data:refresh` → `data:build`)." Add the
  weekly one-command refresh-and-PR script as the standing cadence for that human
  pipeline. Keep the "no runtime sync / no scheduled runtime refresh" statement —
  it is still true.
- `PRD/sections/trade-balancer/README.md` — the "Prices and freshness" bullet may
  note the weekly refresh cadence without changing the frozen-contract posture.
- `PRD/sections/system-map.md` — the `### Printing-price artifact build` entry
  should list the new script alongside `build-card-prices.mjs`.
- The decision log is retired — do **not** author a new `DEC`. Amend the specs in
  place. Naming these files here is not editing them; refinement/graph-kickoff
  own the write.

## Constraints (don't rediscover)

- Mock-default local dev must be unaffected — this is a data-build/CI-adjacent
  script, it touches no runtime code path and no provider boundary.
- The refreshed `cardPrintingPrices.json` is ~38 MB minified single-line JSON, so
  every refresh is a whole-file blob in git history — a reason cadence matters
  and prices-only is the lighter long-term path.
- Scryfall bulk download is human-approved (REQ-093 / DEC-162); the owner running
  the local script is that approval. Do not wire the download into unattended CI.
- `gh` CLI is available and used elsewhere in this repo; the script should fail
  clearly if `gh` is not authenticated rather than half-completing.

## Evidence + reusable tooling

Full findings and the traced mechanism:
`PRD/work/probe-trade-balancer-price-freshness/` — `FINDINGS-mechanism.md` (why
it is stale, the refresh pipeline) and `FINDINGS-size-and-backend.md` (the
separate size/backend thread, explicitly out of scope here). Existing tooling to
reuse: `scripts/refresh-scryfall-data.mjs`, `scripts/build-card-prices.mjs`,
`npm run data:refresh`, `npm run data:build`.

## What the graph run should produce

A DESIGN-BRIEF for the weekly local refresh-and-PR script, the small PRD
amendments named above (corpus doc + feature spec freshness note + system-map
entry), and the slices that implement the script (working-tree guard, branch
off `origin/main`, run `data:refresh`, change-detection, commit, push, `gh pr
create`, and tests for the change-detection and no-op paths). The
full-vs-prices-only scope decision is the one open question for refinement;
everything else above is settled.

## How to hand this off

/graph-kickoff "Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh" PRD/work/probe-trade-balancer-price-freshness/GRAPH-BRIEF.md
