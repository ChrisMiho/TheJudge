# Design brief — Weekly local data-refresh-and-PR script

## What the player gets

The Trade Balancer stops showing stale card prices. Today the balancer prices a
trade from a committed snapshot dated 5 June 2026 — three months old — because
the only way to refresh it is a person running two commands by hand and then
committing and opening a pull request, and nobody has done that since June. This
adds a single local command the owner runs weekly: it refreshes the Magic-data
artifacts and, when anything changed, opens a pull request to `main`. Once the
owner merges and the site deploys, the balancer's `Prices as of <date>` line
moves forward on its own — that line already reads from the artifact's snapshot
date (REQ-145), so it updates for free.

The player-visible win is fresh trade prices. The mechanism refreshes the whole
committed data pipeline, so rulings and combo data ride the same weekly cadence.

## Scope

A new local, owner-invoked script (proposed `scripts/refresh-and-open-pr.mjs`,
wired as `npm run data:refresh-pr`) that:

1. Refuses to run on a dirty working tree, so it never sweeps unrelated changes
   into the commit.
2. Fetches `origin/main` and cuts a branch off it (proposed
   `chore/data-refresh-<YYYY-MM-DD>`).
3. Runs the existing refresh pipeline — `npm run data:refresh` (the human-approved
   Scryfall download) then `npm run data:build` (the build chain that re-emits
   `cardPrintingPrices.json` with a fresh snapshot date). It does not reimplement
   any download or transform.
4. If a committed artifact changed, stages and commits the changed artifacts with
   a dated message; if nothing changed, exits cleanly with no branch, commit, or
   PR.
5. Pushes the branch and opens a pull request to `main` via `gh pr create`,
   printing the PR URL. The owner reviews and merges; deploy follows the merge.

The script touches no runtime code and no provider boundary. It is build-time
tooling only.

## The one product decision (surfaced at the gate)

Full refresh vs. prices-only. Full refresh runs the existing
`data:refresh` → `data:build` pipeline and commits whatever committed artifacts
it changed (least new code, keeps every corpus fresh weekly). Prices-only would
download just `default_cards`, run only `build-card-prices.mjs`, and commit only
`cardPrintingPrices.json` (smaller git churn, since each refresh rewrites the
whole ~38 MB single-line JSON blob, but more new code and it silently stops
refreshing rulings/combos/rules on this cadence).

Resolved to **full refresh** by the assumption ladder (see below) and proposed
that way in `GATE-QUESTIONS.md` as `REQ-195`. The gate block names prices-only as
the alternative so the owner can edit the verdict to it. This is a product-truth
change (the standing refresh cadence), so it is surfaced at the gate rather than
decided silently.

## Material assumptions (assumption ladder, evidence recorded)

- **Full refresh over prices-only.** Ladder rung 1 (active PRD truth): DEC-088 /
  NFR-013 define refresh as the human-approved `data:refresh` → `data:build`
  pipeline, which is the full refresh; no requirement mandates a prices-only path.
  Rung 2 (existing tested behavior): `npm run data:refresh` and `npm run
  data:build` already exist and do the full download and build
  (`package.json` scripts, verified). Rung 3 (established patterns): the combo
  refresh joined this same chain (REQ-093, system-map printing-price and combo
  entries). Rung 4 (smallest new surface): wrapping the existing pipeline is the
  least new code; prices-only is a bespoke narrow path. Rung 5 (preserve
  behavior): full refresh keeps rulings/combos/rules fresh; prices-only would
  silently drop them from the cadence. All rungs point to full refresh, which is
  also the owner's stated recommendation. Not a genuine blocker (rung-1 truth
  answers it), but surfaced at the gate because it changes product truth.
- **Script and npm names.** `scripts/refresh-and-open-pr.mjs` and
  `npm run data:refresh-pr` (ladder rung 3, established repo naming: `scripts/*.mjs`
  wired as `data:*` npm scripts; verified neither name exists today). Reserved as
  proposed names; map-out/build finalize them.
- **Branch and commit naming.** `chore/data-refresh-<YYYY-MM-DD>` and a dated
  commit message (rung 3; conventional-commit `chore/` prefix used across the
  repo). Finalized at build.
- **PR opened via `gh pr create`.** Rung 2/3: `gh` is used elsewhere in this repo;
  the script fails clearly if `gh` is unauthenticated rather than half-completing.

## Decisions (not open — carried from the framing and PRD truth)

- **Local, owner-invoked — never CI cron.** The owner running the command locally
  is the human approval the upstream download requires (REQ-093 / DEC-162). No
  unattended CI network download is introduced.
- **Ends as a PR to `main`, never a direct push.** Trunk is reached only by a PR
  the owner merges; deploy happens from that merge.
- **No runtime sync added.** DEC-087 / DEC-088 / NFR-013 "no live fetch, no
  runtime sync, no scheduled runtime refresh" posture is unchanged — the running
  app still reads only the committed artifact.
- **Graceful degradation preserved.** A failed or missing upstream source keeps
  the prior committed artifact (already true of the underlying pipeline, REQ-066);
  the wrapper must not commit an empty or broken refresh.

## Non-goals

- No CI cron and no scheduled runtime refresh.
- No runtime price fetch or live sync.
- Slimming the ~38 MB price artifact or moving pricing to a backend endpoint —
  that reverses DEC-087 and is tracked separately.

## Product-truth references

- **Proposed new:** `REQ-195` — the weekly one-command local refresh-and-PR
  cadence (in `GATE-QUESTIONS.md`).
- **Amended to cite REQ-195:** `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
  (refresh cadence, keep the no-runtime-sync statement),
  `PRD/sections/trade-balancer/README.md` (freshness note),
  `PRD/sections/system-map.md` (`### Printing-price artifact build` entry lists the
  new script).
- **Unchanged truth relied on:** DEC-087, DEC-088, REQ-066, REQ-093, REQ-145,
  DEC-162, NFR-013.

## Verification intent (for map-out)

The change-detection path (a changed artifact opens a PR) and the no-op path
(nothing changed exits without a branch or PR) are the two behaviors that get
tests. The dirty-tree refusal and the `gh`-unauthenticated failure are guard
checks the script asserts. Runtime is untouched, so mock-default local dev is
unaffected.
