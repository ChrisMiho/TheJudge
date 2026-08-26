# GAMEPLAN — trade-balancer-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What ships

Nothing new. This package's deliverables are already written and committed on
the autonomous base at `41118d5`: `PRD/sections/trade-balancer/README.md`
(162 lines, DEC-168 template — the behavior spec),
`PRD/sections/trade-balancer/data/cardPrintingPrices.md` (119 lines — the
corpus doc, this package's first `data/` subfile), and the one
`PRD/README.md` Section Inventory row for `sections/trade-balancer/`. The
define gate already walked and the owner already accepted all three, 2026-08-25.

This is the same shape as Phase A #2 (user-feedback-spec): refinement wrote
the whole spec at `define` because DEC-168 already existed, so there is
nothing left to author. It diverges from #2 in one way — this feature carries
a corpus, so #2's single-file "verify the spec" slice becomes "verify the
spec AND the corpus doc" here, since both were authored together and share
one review pass over the same cited sources. Both slices below are
verify-only: confirm the committed content is correct and complete against
its sources and the committed artifact, and prove the package's diff never
left its licensed scope.

## Architecture / data flow

Not applicable — no runtime component, no code path, no data flow change.
This is a documentation-verification task over already-committed
`PRD/sections/` content, including one read-only check of a committed JSON
data artifact (never a rebuild).

## Slices

| Slice | Scope | Dependency |
| --- | --- | --- |
| A | Verify `PRD/sections/trade-balancer/README.md` and `PRD/sections/trade-balancer/data/cardPrintingPrices.md` against their cited sources (DEC-087, DEC-088, REQ-064/065/066/145, FLOW-009, NFR-013, NFR-001; the `CardPrintingPrice` shape in `integrations-and-data.md`; the `system-map.md` and `screen-layout.md` entries) and the DEC-168 template; verify the corpus doc's measured figures against the committed artifact by reading it directly. Close any confirmed, sourced gap with a bounded additive correction only. | none |
| B | Verify the `PRD/README.md` Section Inventory row, then prove the whole package's diff since its fork point touched nothing outside the licensed set (no `apps/`, no existing DEC/REQ/FLOW/NFR body, no `system-map.md`/`screen-layout.md`/`integrations-and-data.md` edit). | none |

Parallel-ready: A checks the spec+corpus content against their sources and
the artifact; B checks the diff's shape and the nav row. Neither reads or
depends on the other's output.

## Known candidate findings for slice A

Map-out time checks over the committed files found two things worth
recording so the implementing agent does not re-derive them from scratch or
mistake one for a defect requiring correction:

1. **Corpus doc measured figures — verified, no gap.** The corpus doc's
   "Measured bounds (committed 2026-06-05 snapshot)" section was cross-read
   against `apps/frontend/public/data/cardPrintingPrices.json` directly (no
   rebuild): file size ≈38 MB (39,797,828 bytes on disk), `snapshotDate`
   `2026-06-05T22:21:13.248Z`, 95,895 `printings` entries, 32,638
   `byOracleId` entries, 16,225 entries with no `usd`, 38,691 with no
   `usdFoil`, 4,575 with neither — every one of these figures matches the
   corpus doc exactly. Slice A must still independently re-confirm this
   (never trust a map-out claim uncorroborated), but no correction is
   expected here.

2. **`CardPrintingPrice.id` vs `integrations-and-data.md`'s `printingId` —
   real discrepancy, but not in the trade-balancer files.** The corpus doc's
   artifact-shape table names the printing-id field `id` (matching the
   actual committed JSON's key name and the actual TypeScript interface in
   `apps/frontend/src/lib/trade/loadCardPrices.ts`, both confirmed at
   map-out time: `{ id, oracleId, name, set, setName, collectorNumber,
   imageUrl, usd, usdFoil }`). `PRD/sections/integrations-and-data.md`'s
   `### CardPrintingPrice` entry (line 74) instead names that field
   `printingId` — stale relative to the shipped artifact and code. The
   corpus doc is correct against the actual artifact/code; the mismatch is
   in `integrations-and-data.md`, which this package is boundaried from
   editing (it is not one of the two licensed trade-balancer files, and the
   boundary is explicit: no edit to `integrations-and-data.md`). Slice A
   must confirm this independently, record it as an observed, out-of-scope
   discrepancy, and make **no edit** to either trade-balancer file or to
   `integrations-and-data.md` over it.

No gap was found in **Where it lives**: every file the spec names under
`apps/frontend/src/components/trade/` (`TradeBalancer.tsx`, `TradeSide.tsx`,
`TradeEntryRow.tsx`, `PrintingPicker.tsx`, `oracleSearch.ts`,
`useTradeScan.ts`) and `apps/frontend/src/lib/trade/` (`loadCardPrices.ts`,
`pricing.ts`) exists in the tree and matches `system-map.md`'s `## Trade
balancer` `Lives in:` line; the `trade-balancer` destination registration in
`destinationRegistry.tsx` was confirmed present. Slice A still re-confirms
this directly — it is not exempted from the check, only pre-scouted as
low-risk.

## Verification checklist (package-level, restated from DESIGN-BRIEF)

- `PRD/sections/trade-balancer/README.md`'s `Backed by:` line names exactly
  DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, REQ-145, FLOW-009, NFR-013,
  NFR-001.
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md`'s `Backed by:`
  line names exactly DEC-088, REQ-066, NFR-013 (and the `CardPrintingPrice`
  shape in `integrations-and-data.md`).
- Every **How it works** bullet in the spec traces to its cited source's
  actual text; every measured figure in the corpus doc traces to the
  committed `cardPrintingPrices.json`, read directly.
- Every stable ID token present in either file (beyond the Backed-by set)
  resolves to a real, pre-existing ID in its home file — no minted ID.
- **Where it lives** in both files names every file `system-map.md` and the
  tree confirm belongs to the feature.
- `git diff` since the package's fork point (`f97881b`, confirmed at
  map-out time to equal `git merge-base HEAD origin/main`) shows no change
  under `apps/`, and no change to any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
  `system-map.md`, `screen-layout.md`, or `integrations-and-data.md`.
- `PRD/README.md` has exactly one Section Inventory row for
  `sections/trade-balancer/`.

## Runtime / browser risk

None. This package is documentation-only — no UI surface changes, nothing
browser-observable. No Playwright verification is required
(`PRD/instructions/runtime-process-hygiene.md`).

## Corpus checks this repo already runs

No `apps/` test suite applies. Verification uses `grep` / `git diff --stat`
/ `git diff` structural checks against the PRD markdown files and the source
files the spec cites, plus one direct, read-only inspection of the committed
`cardPrintingPrices.json` (Python's stdlib `json` module or `jq`, never
`npm run data:build`/`data:refresh`) — matching how the life-tracker-spec and
user-feedback-spec packages before it were verified, extended here only by
the corpus-artifact read since this is the first Phase A spec with a `data/`
file.

## Fork-point reference

This branch (`thejudge-auto/trade-balancer-spec`) forked from `origin/main`
at `f97881b` (Merge PR #109, the user-feedback-spec close). Confirmed at
map-out time: `git merge-base HEAD origin/main` resolves to `f97881b`, and
`git diff --stat f97881b..HEAD -- . ':!PRD/work'` touches exactly
`PRD/README.md` (+1 line), `PRD/sections/trade-balancer/README.md` (new, 162
lines), and `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (new,
119 lines) — nothing under `apps/`, nothing in any existing
`DEC`/`REQ`/`FLOW`/`NFR` body, `system-map.md`, `screen-layout.md`, or
`integrations-and-data.md`.

## Next step

`/thejudge-implement PRD/work/trade-balancer-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/trade-balancer-spec/ slice A` (Codex). Slice B
may run before, after, or alongside A — no ordering dependency.

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by this
skill.
