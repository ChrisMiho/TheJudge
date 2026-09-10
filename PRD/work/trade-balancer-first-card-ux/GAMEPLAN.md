# GAMEPLAN: trade-balancer-first-card-ux

## What the player gets (recap)

Four changes to the Trade Balancer's "add my first card" path:

1. Pick the printing before the card lands on the side (manual search).
2. A foil-only printing prices correctly the moment it is picked, instead of
   opening at $0.00 with a caution triangle.
3. A long printing list (Sol Ring: 128 rows) scrolls inside a short box with a
   set filter, instead of unrolling the page.
4. The first card of a session prices fast, because the balancer wakes the
   backend the moment the screen opens instead of on the first add.

## Architecture

All work is in the frontend Trade Balancer (`apps/frontend/src/components/trade/`,
`apps/frontend/src/lib/trade/`) and the printing-price build script
(`scripts/build-card-detail-by-oracle-id.mjs`). No new endpoint, no new
artifact field, no backend route change beyond calling the health route that
already exists.

- **Build-time order** (`build-card-detail-by-oracle-id.mjs`): each card's
  `printings` array sorts newest release first. `released_at` is read during
  ingest as a sort key only — never emitted on the artifact.
- **Foil selection** (`lib/trade/pricing.ts`): one pure helper,
  `defaultFoilForPrinting(printing)`, called everywhere an entry receives a
  printing — pick-before-add, scan resolve, change printing, retry.
- **Pick before add** (`TradeSide.tsx`): a `pendingCard` state swaps the
  suggestion list for `PrintingPicker` on suggestion tap; picking calls the
  existing `onAddByOracle(sideId, oracleId, name, printing.id)` seam. A failed
  or empty pre-add fetch falls back to today's add-then-degrade path.
- **Picker as a box** (`PrintingPicker.tsx`): count header, `~40vh` scroll
  region, `loading="lazy"` row images, a set filter above eight printings,
  `scrollIntoView` on the selected row.
- **Warm-up on mount** (`TradeBalancer.tsx`): one fire-and-forget
  `GET <apiBaseUrl>/api/health` beside the existing `cardMetadata` fetch,
  result discarded, errors swallowed.

## Durable-truth sequencing (why blocks land where they do)

Contract point 1 requires the slice that ships a behaviour to apply the
matching `GATE-QUESTIONS.md` block(s) in the same slice, re-derived against
current `PRD/sections/` truth — never a blind replay of the finalized diff.
Several of the twelve blocks bundle hunks that describe more than one of the
five behaviours above (e.g. REQ-065 covers foil, pick-before-add, and the
picker box in one block; the `trade-balancer/README.md` block covers all
five). Writing such a block's full text before every behaviour it describes
has shipped would assert product truth the code doesn't yet have — the
opposite of what the contract is for.

So each block is assigned whole to the **last** slice among the behaviours
its hunks touch, in build order A → B → C → D → E. By the time that slice
lands, every behaviour the block's diff describes is already shipped in this
worktree, so the amendment is a re-derivation of present fact, not a forecast.
Slice B (foil) ships no block on its own — every block that mentions foil
also mentions pick-before-add and/or the picker, so its truth rides on C or D.
Slice E, which ships last and is also the smallest code change (one
fire-and-forget call), does the heaviest PRD sweep: eight blocks whose text
only becomes fully accurate once warm-up, the picker box, pick-before-add,
and foil auto-select all exist together.

| Block | Behaviours it names | Lands in |
| --- | --- | --- |
| `REQ-066` | build order | **A** |
| `PRD/sections/trade-balancer/data/cardPrintingPrices.md` | build order, fetch timing | **C** |
| `REQ-065` | foil, pick-before-add, picker box | **D** |
| `PRD/sections/screen-layout.md` | picker box | **D** |
| `REQ-064` | warm-up | **E** |
| `FLOW-009` | foil, pick-before-add, warm-up | **E** |
| `FLOW-025` | foil, picker box, warm-up | **E** |
| `PRD/sections/trade-balancer/README.md` | all five | **E** |
| `PRD/sections/system-map.md` | build order, all five (summary) | **E** |
| `PRD/sections/integrations-and-data.md` | build order, fetch timing, warm-up | **E** |
| `PRD/sections/overview.md` | fetch timing, warm-up | **E** |
| `PRD/sections/non-functional-requirements.md` | fetch timing, warm-up | **E** |

All twelve are accounted for; none is left for cleanup. Cleanup only verifies
the applied text is present and writes the receipt (`doc-lifecycle.md`).

## Data flow (after this work)

1. `TradeBalancer` mounts → fires `GET /api/health` (discarded) and the
   `cardMetadata` fetch, in parallel.
2. Player types in a side's search box → taps a suggestion → `TradeSide`
   calls `fetchCardPrintings(oracleId)` (already-cached module) and renders
   `PrintingPicker` in place of the suggestion list.
3. Player taps a printing row → `TradeSide` calls
   `onAddByOracle(sideId, oracleId, name, printing.id)` → `TradeBalancer`
   adds the entry with that printing already resolved from cache (no second
   request) → the entry's foil mode is set by `defaultFoilForPrinting`.
4. Scan path is unchanged: `useTradeScan` → `handleAddByOracle` with the
   scanned printing id → same foil helper applies on resolve.
5. "Change printing" and retry also route through the same foil helper.

## Verification checklist (whole package)

- [ ] `npm test` in `apps/frontend` green, including
      `TradeBalancer.scan.test.tsx` (A11: scan path untouched).
- [ ] `npm run test:scripts` green (build-script sort unit test).
- [ ] `node --test scripts/lambda-package-budget.test.mjs` passes (artifact
      field set and size unaffected by the sort).
- [ ] `npm run quality:check` green for touched areas.
- [ ] Browser check at 390×844: Sol Ring's picker stays inside the viewport
      with Side B reachable; a foil-only printing prices on pick, not at $0.
- [ ] All twelve `GATE-QUESTIONS.md` blocks applied to `PRD/sections/`,
      matching the table above.

## Slices

| Slice | Objective | GATE-QUESTIONS blocks applied | Depends on | Parallel? |
| --- | --- | --- | --- | --- |
| A | Build-time newest-first printing order | `REQ-066` | — | start here |
| B | Foil mode auto-selects from the printing's prices | — | — | parallel with A |
| C | Pick the printing before the card is added (search path) | `trade-balancer/data/cardPrintingPrices.md` | A (order), B (foil on pick) | after A, B |
| D | Printing picker becomes a scrollable, filterable box | `REQ-065`, `screen-layout.md` | A, B, C | after C |
| E | Warm-up ping on mount + remaining PRD-truth sweep + ship gates | `REQ-064`, `FLOW-009`, `FLOW-025`, `trade-balancer/README.md`, `system-map.md`, `integrations-and-data.md`, `overview.md`, `non-functional-requirements.md` | A, B, C, D | last |

Single-agent order: A → B → C → D → E (each slice's PRD-truth block depends
on prior slices' code, so this is not reorderable despite A/B being
independently code-parallel).

## Non-goals (from brief, restated)

No scheduled keep-warm ping, no lazy per-route backend init, no scan-path
change (`useTradeScan` untouched), no new field on `cardMetadata.json` or the
committed price artifact, no `Cache-Control` change, no rebuild of the
committed price artifact in this worktree (A10 — the Scryfall bulk source is
absent here; the sort ships with its unit test and the served order changes
at the owner's next `data:refresh-pr`).

## Handoff

This GAMEPLAN and its slice docs are handed back to `graph-implement` (the
build half of the graph run `graph-20260909-213550`). The implementation node
runs in this same worktree, on this same branch
(`thejudge-auto/trade-balancer-first-card-ux-work`), and opens the code PR
`thejudge-auto/trade-balancer-first-card-ux-work → main` — `graph is
controlling`, so no `$thejudge-implement-all` invocation here; the driver
dispatches implementation per the graph contract.
