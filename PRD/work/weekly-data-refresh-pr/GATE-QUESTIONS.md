# Gate questions — weekly-data-refresh-pr

One proposed stable id: `REQ-195`. Answer the `- Verdict:` slot at the bottom of
its block.

## REQ-195 — a weekly one-command refresh that opens a pull request for you

**What this decides:** whether the standing way to un-stale the Trade Balancer's
prices is a single local command you run weekly that refreshes the data and
opens a pull request to `main` you merge — and whether that command refreshes
all the committed Magic data (full refresh) or only the card prices
(prices-only).

**In plain terms:** the balancer prices trades from a committed file, and today
that file is dated 5 June 2026 because the only way to refresh it is to run two
commands by hand and then commit and open a pull request yourself — nobody has
since June, so the price a player trusts to balance a trade is three months old.
This adds one command (`npm run data:refresh-pr`) that does all of it: it
refreshes the data through the same human-approved pipeline that exists today,
and if anything changed it cuts a branch off `main`, commits, pushes, and opens a
pull request for you to merge. Merging it and deploying moves the
`Prices as of <date>` line the player sees forward — that line already reads the
file's own snapshot date, so it updates on its own (REQ-145). Nothing about how
the running app works changes: there is still no live price lookup and no
background refresh — the app reads only the committed file (DEC-087 / DEC-088 /
NFR-013). Running the command locally is itself the human approval the upstream
download requires, so no automatic server job is introduced (REQ-093 / DEC-162).

The one choice inside this: **full refresh** (recommended) runs the existing
pipeline and commits whatever it changed — prices, rulings, combos, and rules all
stay fresh on the same weekly cadence, and it is the least new code. **Prices-only**
would download just the card data and commit only the price file — smaller git
history growth, because each refresh rewrites the whole ~38 MB price file, but it
is more new code and it quietly stops refreshing rulings and combos on this
cadence. The diff below is written for full refresh. To choose prices-only,
answer `edit` and say so.

**What happens if you say no:** the prices stay frozen at whatever the last
hand-run left — 5 June 2026 today — until someone runs the two-command pipeline
and opens a PR by hand again. No standing cadence exists.

### Complete diff

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ (append after REQ-194) @@
+### REQ-195
+- Title: Weekly one-command local data refresh that opens a pull request
+- Priority: medium
+- Description: A single local command the owner runs on a weekly cadence
+  refreshes the committed Magic-data artifacts through the existing
+  human-approved pipeline (`npm run data:refresh` then `npm run data:build`),
+  and when any committed artifact changed, cuts a branch off `origin/main`,
+  commits the refreshed artifacts, pushes, and opens a pull request to `main`
+  for the owner to merge. The runtime posture is unchanged: no live fetch, no
+  runtime sync, and no scheduled runtime refresh — the running app reads only
+  the committed artifact (DEC-087, DEC-088, NFR-013). The command is
+  owner-invoked and local, never a CI cron; the owner running it is the human
+  approval the upstream Scryfall/Comprehensive-Rules/combo download requires
+  (REQ-093, DEC-162). Merging the resulting pull request and deploying is what
+  moves the player-visible `Prices as of <date>` freshness line (REQ-145)
+  forward.
+- Acceptance Criteria:
+  - one npm script (proposed `data:refresh-pr`, running proposed
+    `scripts/refresh-and-open-pr.mjs`) runs the existing refresh-and-build
+    pipeline and reimplements no download or transform
+  - refuses to run on a dirty working tree, so unrelated changes are never
+    committed into the refresh
+  - fetches `origin/main` and creates a branch off it (proposed
+    `chore/data-refresh-<YYYY-MM-DD>`); never commits to or pushes `main`
+    directly
+  - when the refresh changed at least one committed artifact, stages and commits
+    the changed artifacts with a dated message, pushes the branch, and opens a
+    pull request to `main` via `gh pr create`, printing the PR URL
+  - when nothing changed, exits cleanly with no branch, no commit, and no PR
+  - preserves graceful degradation — a failed or missing upstream source keeps
+    the prior committed artifact (REQ-066) and the wrapper never commits an
+    empty or broken refresh
+  - fails clearly when `gh` is unauthenticated rather than half-completing
+- Constraints:
+  - local and owner-invoked only; no CI cron and no unattended network download
+    (the REQ-093 / DEC-162 human-approval posture is unchanged)
+  - touches no runtime code path and no provider boundary; mock-default local
+    dev is unaffected
+  - never pushes to `main`; trunk is reached only by a pull request the owner
+    merges
+  - introduces no runtime sync; the DEC-087 / DEC-088 / NFR-013 "no live fetch,
+    no scheduled refresh" posture stands
+- Dependencies:
+  - REQ-066 (the artifact build and its graceful degradation, wrapped here)
+  - REQ-093 (human-approved upstream download)
+  - REQ-145 (the freshness line that advances when the refresh merges)
+  - NFR-013 (static-snapshot, no-runtime-sync posture)
+- Notes:
+  - scope choice made at the gate: full refresh (run the existing
+    `data:refresh` → `data:build` pipeline and commit whatever committed
+    artifacts it changed — least new code, every corpus fresh weekly) vs.
+    prices-only (download only `default_cards`, run only
+    `build-card-prices.mjs`, commit only `cardPrintingPrices.json` — smaller git
+    churn, more new code, drops rulings/combos/rules from the cadence). Written
+    for full refresh
+  - `cardPrintingPrices.json` is ~38 MB single-line JSON committed whole each
+    refresh, so cadence and the prices-only option both bear on git-history size
+  - slimming the price artifact or moving pricing to a backend endpoint reverses
+    DEC-087 and is tracked separately, out of scope here
```

```diff
--- a/PRD/sections/trade-balancer/data/cardPrintingPrices.md
+++ b/PRD/sections/trade-balancer/data/cardPrintingPrices.md
@@ line 6-7 (Backed by) @@
-- Backed by: DEC-088, REQ-066, NFR-013 (and the `CardPrintingPrice` shape in
-  `integrations-and-data.md`)
+- Backed by: DEC-088, REQ-066, NFR-013, REQ-195 (and the `CardPrintingPrice`
+  shape in `integrations-and-data.md`)
@@ "Where it comes from and how it is built" — the static-snapshot bullet @@
-- **Static snapshot, no runtime sync:** the committed file is the only source at
-  runtime. There is no live price fetch, no runtime sync, and no scheduled
-  refresh. Refresh happens solely through the human-approved pipeline
-  (`data:refresh` → `data:build`) (DEC-088, NFR-013).
+- **Static snapshot, no runtime sync:** the committed file is the only source at
+  runtime. There is no live price fetch, no runtime sync, and no scheduled
+  runtime refresh. Refresh happens solely through the human-approved pipeline
+  (`data:refresh` → `data:build`); its standing cadence is a weekly one-command
+  local script the owner runs (`npm run data:refresh-pr`), which runs that
+  pipeline and, when an artifact changed, opens a pull request to `main` the
+  owner merges — the runtime still reads only the committed file (DEC-088,
+  NFR-013, REQ-195).
```

```diff
--- a/PRD/sections/trade-balancer/README.md
+++ b/PRD/sections/trade-balancer/README.md
@@ line 9 (Backed by) @@
-- Backed by: DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, REQ-145, FLOW-009,
-  NFR-013, NFR-001
+- Backed by: DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, REQ-145, REQ-195,
+  FLOW-009, NFR-013, NFR-001
@@ "Prices and freshness" — first bullet @@
-- Built: prices come from a committed, lazy-loaded printing price snapshot —
-  there is no live or real-time lookup and no runtime sync. The artifact is
-  documented in `data/cardPrintingPrices.md`. (DEC-088, REQ-066, NFR-013)
+- Built: prices come from a committed, lazy-loaded printing price snapshot —
+  there is no live or real-time lookup and no runtime sync. The snapshot is
+  refreshed on a weekly cadence by a one-command local script the owner runs
+  (`npm run data:refresh-pr`), which opens a pull request to `main`; merging it
+  and deploying moves the `Prices as of <date>` line forward. The frozen-contract
+  posture is unchanged — the runtime reads only the committed snapshot. The
+  artifact is documented in `data/cardPrintingPrices.md`. (DEC-088, REQ-066,
+  REQ-145, NFR-013, REQ-195)
```

```diff
--- a/PRD/sections/system-map.md
+++ b/PRD/sections/system-map.md
@@ ### Printing-price artifact build @@
-- Summary: Offline build that emits the committed, printing-level USD price artifact from the Scryfall bulk source for the Trade Balancer — per printing `usd`/`usd_foil` plus set/collector/image, indexable by oracle and printing id, with a snapshot date; static snapshot, human-approved refresh, lazy-loaded on first Trade Balancer open.
-- Lives in: `scripts/build-card-prices.mjs` → `apps/frontend/public/data/cardPrintingPrices.json` (wired into `npm run data:build`); lazy runtime loader `apps/frontend/src/lib/trade/loadCardPrices.ts`
-- Backed by: DEC-088, REQ-066, NFR-013
+- Summary: Offline build that emits the committed, printing-level USD price artifact from the Scryfall bulk source for the Trade Balancer — per printing `usd`/`usd_foil` plus set/collector/image, indexable by oracle and printing id, with a snapshot date; static snapshot, human-approved refresh with a weekly one-command refresh-and-PR cadence, lazy-loaded on first Trade Balancer open.
+- Lives in: `scripts/build-card-prices.mjs` → `apps/frontend/public/data/cardPrintingPrices.json` (wired into `npm run data:build`); weekly refresh-and-PR wrapper `scripts/refresh-and-open-pr.mjs` (wired as `npm run data:refresh-pr`, runs the `data:refresh` → `data:build` pipeline then opens a pull request to `main`); lazy runtime loader `apps/frontend/src/lib/trade/loadCardPrices.ts`
+- Backed by: DEC-088, REQ-066, NFR-013, REQ-195
```

- Verdict: accept
- Reason: Full refresh — keep every corpus (prices, rulings, combos, rules) current
  on one weekly cadence with the least new code; runtime posture unchanged. When
  the first refresh runs, all extracts should come up to date together, not just
  prices.

## Blocker questions

None. The full-vs-prices-only scope choice is resolved to full refresh by the
assumption ladder (active PRD truth: the existing `data:refresh` → `data:build`
pipeline is the full refresh; DEC-088 / NFR-013) and is surfaced in REQ-195 above
for the owner to confirm or flip — it does not block the run.
