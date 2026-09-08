# Gameplan — weekly data-refresh-and-PR script

## What the player gets

Trade Balancer prices stop being three months stale. The owner runs one
command weekly; when the Magic-data pipeline changed anything, the command
opens a pull request the owner merges, and the balancer's `Prices as of <date>`
line moves forward on its own once that PR is live (REQ-145).

## Architecture

One new file, `scripts/refresh-and-open-pr.mjs`, following this repo's
established script shape (`graph-preflight.mjs`, `refresh-commander-spellbook-data.mjs`):
pure, unit-testable functions with every external effect — git, gh, and the
`data:refresh`/`data:build` pipeline itself — passed in as an injectable
function, plus a thin `main()` gated behind `import.meta.url === invokedPath`
that wires the real `execFileSync`/`spawnSync` in. This is what lets the whole
script be verified by `node --test` without ever touching the network, git
remote, or GitHub — the same shape `graph-preflight.test.mjs` and
`refresh-commander-spellbook-data.test.mjs` already prove out in this repo, and
the only way to verify this script at all: **no slice may run the real
`npm run data:refresh` or `npm run data:refresh-pr`** — that is a live Scryfall
network call gated on human approval (REQ-093/DEC-162) and is also denied
outright while a graph run holds the lock. Verification is unit tests over the
injectable pieces plus static file checks, never a live invocation.

Sequence the real script performs (Slice A/B):

1. Refuse on a dirty working tree (`git status --porcelain` non-empty).
2. Fetch `origin` and cut `chore/data-refresh-<YYYY-MM-DD>` off `origin/main`.
3. Run `npm run data:refresh` then `npm run data:build` through the injectable
   pipeline runner, in that order, aborting on either's non-zero exit.
4. Diff the explicit list of committed data artifacts data:build writes
   (below) against `origin/main`. If none changed, exit 0 with no branch, no
   commit, no push, no PR (Slice B) — the branch already cut in step 2 is
   deleted locally so nothing dangling is left on disk (a local-only branch;
   nothing was pushed yet, so no remote cleanup is needed).
5. If at least one changed, `git add` those explicit paths only (never `-A`),
   commit with a dated message, `git push origin <branch>` (never force), then
   `gh pr create --base main --head <branch>` and print the returned URL.
6. `gh` failing (unauthenticated, missing) after a real change was committed
   and pushed fails the script clearly (non-zero exit, the `gh` error surfaced)
   rather than silently swallowing it — the branch and commit still exist
   locally/remotely for the owner to open the PR by hand.

Explicit committed-artifact path list (every path `npm run data:build`'s seven
steps write, verified against each build script's `outputPath`/`indexPath`/
`DEFAULT_OUTPUT` today — `git ls-files` confirms all nine are already
tracked):

```
apps/frontend/public/data/cardMetadata.json
apps/backend/data/cardDetailByOracleId.json
apps/backend/data/cardRulingsByOracleId.json
apps/backend/data/gameRulesByTopic.json
apps/backend/data/gameRulesRuleIndex.json
apps/backend/data/gameRulesTokenStats.json
apps/frontend/public/data/gameRulesCoreTopics.json
apps/backend/data/gameRulesRuleEmbeddings.json
apps/frontend/public/data/cardPrintingPrices.json
apps/backend/data/commanderSpellbookCombos.json.gz
apps/backend/data/commanderSpellbookComboIndex.json.gz
```

(`apps/backend/data/gameRulesTopicManifest.json` is an input to
`build-game-rules.mjs`, not an output — excluded. `cardScanMap.json`,
`cardhashManifest.json`, `cardhashSkiplist.json`, `cardhashes.bin` belong to the
separate `data:scan-*` pipeline, not `data:build` — excluded.)

## Data flow

`npm run data:refresh-pr` (Slice C) → `refresh-and-open-pr.mjs main()` →
dirty-tree check → branch cut → `data:refresh` → `data:build` (unchanged
existing pipeline, reimplemented by neither this script nor its tests) →
change detection over the explicit path list → commit/push/PR or clean exit →
prints the PR URL or "no changes; nothing to refresh."

## Slices

| Slice | Title | Depends on | Parallel-ready |
| --- | --- | --- | --- |
| A | Refresh-and-PR script core (branch, pipeline, commit, push, PR) | none | — |
| B | Change-detection and no-op path | A (same file) | sequential after A |
| C | npm script wiring | A | sequential after A (needs the script's filename) |
| D | Promote REQ-195 into PRD/sections, together with the code | A, B, C | sequential last — documents the shipped shape |

Sequential is stated because all four slices touch or depend on the same new
file (`scripts/refresh-and-open-pr.mjs`) or its final behavior; a single agent
implements them in order A → B → C → D.

## Verification checklist

- `npm run test:scripts` (runs `node --test scripts/*.test.mjs`, which
  picks up the new `scripts/refresh-and-open-pr.test.mjs` by glob) — green.
- `npm run quality:check` green for touched areas (final slice).
- No slice invokes `npm run data:refresh`, `npm run data:build`, or
  `npm run data:refresh-pr` for real — every check is a unit test over an
  injected fake or a static read of `package.json` / `PRD/sections/*`.
- `git status --porcelain` after each slice shows only the intended files.

## Runtime/browser risk

None. This is a build-time Node CLI script with no UI surface; no Playwright
verification is required per `PRD/instructions/runtime-process-hygiene.md`.

## PRD promotion (applied at build, Slice D — not deferred to cleanup)

Under graph control this package's implementation node applies the approved
`GATE-QUESTIONS.md` diff to `PRD/sections/` itself, together with the code, per
`PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`).
Slice D carries that promotion:

- `PRD/sections/functional-requirements.md` — append `### REQ-195` after
  `### REQ-194` (currently the file's last entry, line 4577).
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — amend the
  `Backed by` line and the static-snapshot bullet.
- `PRD/sections/trade-balancer/README.md` — amend the `Backed by` line and the
  first "Prices and freshness" bullet.
- `PRD/sections/system-map.md` — amend the `Printing-price artifact build`
  entry's `Summary`, `Lives in`, and `Backed by` lines (its `Status: shipped`
  line is untouched — the base artifact-build capability already shipped; this
  slice only extends the entry).

Apply **by intent** against current-state truth (re-derive, do not blind-paste
the frozen `GATE-QUESTIONS.md` patch) — if slice A/C's actual script or npm
script name differs from the proposed `scripts/refresh-and-open-pr.mjs` /
`data:refresh-pr`, the PRD edits use the real names, not the proposed ones.
`thejudge-cleanup` (`close`) still owns the `system-map.md` shipped/receipt
gate check and the eventual promotion-confirmation step; this slice's job is
to write the truth, not to flip a status field the diff does not touch.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/weekly-data-refresh-pr/` ready to delete
