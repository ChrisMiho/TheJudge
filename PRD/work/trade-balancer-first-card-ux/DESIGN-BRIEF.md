# DESIGN BRIEF — trade-balancer-first-card-ux

- Package: `PRD/work/trade-balancer-first-card-ux/`
- Status: refined (proposal only — nothing in `PRD/sections/` is edited here)
- Proposal: `GATE-QUESTIONS.md`, twelve blocks, all amendments to existing IDs and
  existing files. **No new `REQ`/`FLOW`/`DEC` IDs are reserved.**

## What the player gets

Four changes to the Trade Balancer, all on the "add my first card" path.

1. **Pick the printing before the card is added.** Tapping a search suggestion
   opens that card's printing list right there — newest set first, each row with
   set, collector number, both prices and a thumbnail — and the card is added
   with the printing the player taps. Today the card is added first with
   whatever printing sorts first, and the player has to hunt for "Change
   printing" to fix it.
2. **A printing that only exists as foil prices correctly on the spot.** The
   foil toggle starts in whichever mode actually has a price, instead of opening
   at `$0.00` with a caution triangle on a card that has a perfectly good foil
   price.
3. **Long printing lists stay inside a box.** Sol Ring's 128 printings scroll
   inside a short region with a set-name filter, instead of unrolling the page to
   ten thousand pixels and pushing Side B off the bottom.
4. **The first card prices fast.** The balancer pings the backend the moment the
   screen opens, so the server's cold start overlaps the card-list download and
   the player's typing instead of landing on the first add.

## Scope

In scope:

- Manual-search add path: fetch printings on suggestion tap, show the picker in
  place of the suggestion list, add with the tapped printing.
- A pure foil-mode helper applied everywhere an entry receives a printing (pick,
  scan resolve, change printing, retry).
- Printing picker presentation: `N printings` count header, scroll region,
  lazy-loaded row images, set filter above a threshold, selected row scrolled
  into view.
- Build-time printing order: newest release first, then collector number.
- One fire-and-forget `GET /api/health` call when the balancer mounts.
- The `PRD/sections/` amendments in `GATE-QUESTIONS.md`.

Out of scope (from `IDEA.md`, unchanged here):

- Scheduled keep-warm pings or any `aws-bootstrap.sh` / infrastructure change.
- Lazy per-route backend initialization.
- The scan add path (`useTradeScan`) — the scanned printing stays the default
  and stays changeable.
- Any new field on `cardMetadata.json` or on the committed price artifact.
- `Cache-Control` on `/data/*`.

## Verified against the code in this worktree

Every claim the intake brief carries that this design leans on was re-checked
here, in this worktree, before it was adopted.

| Claim | Verified | Where |
| --- | --- | --- |
| Printings are emitted in Scryfall-UUID order | yes | `scripts/build-card-detail-by-oracle-id.mjs:219` — `[...state.printingsByOracleId.get(oracleId)].sort((a, b) => a.id.localeCompare(b.id))` |
| The build does not capture a release date | yes | `buildPriceEntry` (same file, ~line 95-105) emits `id`, `set`, `setName`, `collectorNumber`, `usd`, `usdFoil` only |
| Search adds the card immediately, no pre-add picker | yes | `apps/frontend/src/components/trade/TradeSide.tsx:62` `addByOracle` calls `onAddByOracle` straight from the suggestion button |
| The frontend takes `printings[0]` as the default | yes | `apps/frontend/src/components/trade/TradeBalancer.tsx:81` `selectPrinting` returns `preferred ?? printings[0]` |
| A new entry always starts non-foil | yes | `TradeBalancer.tsx:215` — `foil: false` on every add |
| A `preferredPrintingId` seam already exists | yes | `handleAddByOracle(sideId, oracleId, name, preferredPrintingId?)`, `TradeBalancer.tsx:201-225`; the scan path already uses it |
| The picker renders every printing inline, eagerly | yes | `apps/frontend/src/components/trade/PrintingPicker.tsx:49-85` — a plain `<ul>`, no scroll container, no `loading="lazy"`, no filter, no count |
| Printings are cached per session | yes | `apps/frontend/src/lib/trade/fetchCardPrintings.ts` — module-level `Map` keyed by oracle id, with `peekCardPrintings` for a cache read |
| `GET /api/health` already exists | yes | `apps/backend/src/routes/health.ts:4`; documented as an optional endpoint in `PRD/sections/integrations-and-data.md:158` |
| `apiBaseUrl` is the frontend's backend origin | yes | `apps/frontend/src/lib/env.ts` exports `apiBaseUrl` |
| `PRD` still requires pick-before-add for search | yes | `PRD/sections/functional-requirements.md:1486` and `PRD/sections/user-flows.md:199` both say the player chooses the printing **before it is added** — the code drifted from this in PR #212 |

Live-site measurements (4.21 s cold price call, 6.7% of cards opening on a
foil-only printing, the 10,748 px Sol Ring picker, 128 image requests) are cited
from the probe, not re-derived here:
`PRD/work/probe-trade-balancer-first-card-ux/FINDINGS-live-observation.md` and
its `.playwright-mcp/` screenshots. Per the graph contract those documents are
recorded as citations only and were not opened.

## Design

### Pick before add (search path)

`TradeSide` gains a `pendingCard` state. Tapping a suggestion calls
`fetchCardPrintings(oracleId)` (already cached per session) and swaps the
suggestion list for the picker: `Loading printings…` first, then the list.
Picking calls the existing `onAddByOracle(sideId, oracleId, name, printing.id)`
— the `preferredPrintingId` seam already selects that printing when the fetch
resolves, and it resolves from cache, so the entry appears already priced.
Cancel returns to the search box with the query intact.

If the pre-add fetch fails or returns no printings, the picker does not trap the
player: the card is added the way it is added today — immediately, in the
`$0`-plus-caution state with the existing retry affordance. Manual search stays
the permanent fallback path it is required to be.

The scan path is untouched: `useTradeScan` still calls `handleAddByOracle` with
the scanned printing id, and "Change printing" still corrects it.

### Foil mode follows the printing

One pure helper in `apps/frontend/src/lib/trade/pricing.ts` (where the other
pure selectors live):

- non-foil price missing, foil price present → foil on
- foil price missing, non-foil price present → foil off
- otherwise → keep the entry's current toggle (a new entry starts off)

Applied wherever an entry receives a printing: the fetch-resolve path in
`loadPricingForEntry`, `handleChangePrinting`, and retry. The player can still
toggle into a mode with no price — that stays `$0` plus the caution triangle,
unchanged.

### The picker becomes a box

`PrintingPicker` gains: an `N printings` count in its header (computed from the
list it already has — nothing is added to any artifact), a scroll region capped
at about `40vh` and about five to six rows, `loading="lazy"` on row images, a
set-name/set-code filter input shown when a card has more than eight printings,
and `scrollIntoView` on the row carrying `aria-current` when it opens.

### Newest printing first

`scripts/build-card-detail-by-oracle-id.mjs` sorts each card's printings by
Scryfall `released_at` descending, then collector number (numeric-aware
ascending), then printing id as a final deterministic tiebreak. `released_at` is
read during ingest and used as a sort key only — it is **not** emitted, so the
artifact's fields, its size, and the wire response are unchanged. Order is the
contract; there is no new field to read.

### Warm-up on open

When `TradeBalancer` mounts it issues one fire-and-forget `GET` to
`<apiBaseUrl>/api/health` (the origin `lib/env.ts` already exports) next to the
existing `cardMetadata` fetch, result discarded, errors swallowed,
no UI and no state. It never blocks or fails search, so mock-default local dev
with no backend is unaffected.

## Assumptions

Resolved with the conservative assumption ladder in
`PRD/instructions/preparation-contract.md` (`## Conservative assumption ladder`).
Rung 1 is active `PRD/sections/` truth, 2 tested behavior and public contracts,
3 local code patterns, 4 smallest reversible scope, 5 preserve user-visible
behavior, 6 no new dependency/endpoint/data contract.

| # | Assumption | Rung | Evidence |
| --- | --- | --- | --- |
| A1 | Pick-before-add for manual search is a restoration, not a new behavior | 1 | `functional-requirements.md:1486` ("chooses the correct printing … before it is added") and `user-flows.md:199` already say it; `TradeSide.tsx:62` does not |
| A2 | The count header is computed from the fetched list; no artifact or index field is added | 6 | `fetchCardPrintings.ts` already returns the whole list; `cardMetadata.json` is the shared index every destination downloads (REQ-174) |
| A3 | Newest-first is a build-time sort with no new emitted field | 6 | `build-card-detail-by-oracle-id.mjs:219` already sorts; `buildPriceEntry` fixes the emitted field set; REQ-066 constrains the artifact's fields, not its order |
| A4 | Missing/unparseable `released_at` sorts last; printing id is the final tiebreak | 5 | a committed artifact must rebuild byte-identically from the same source — an unstable sort would churn the diff every refresh |
| A5 | The foil helper lives in `lib/trade/pricing.ts` | 3 | that module is already the home of the pure price selectors (`sideTotal`, `difference`, `formatUsd`); the component holds only state |
| A6 | Foil auto-select never overrides a toggle the player already moved | 5 | preserves current user-visible behavior: only the *initial* mode for a printing changes |
| A7 | A failed pre-add printings fetch falls back to today's add-then-degrade path | 5 | REQ-065's constraint that manual search "stays fully functional" as the permanent fallback; the existing retry affordance is already built (`TradeBalancer.tsx:227-231`) |
| A8 | The warm-up call adds no endpoint | 6 | `/api/health` already exists (`apps/backend/src/routes/health.ts:4`; `integrations-and-data.md:158`); REQ-063's constraint forbids *adding* a health endpoint and a runtime provider-mode fetch — this is neither |
| A9 | The picker's scroll cap (~40vh, ~5-6 rows) and filter threshold (>8 printings) are design choices, not measured requirements | 4 | `screen-layout.md`'s Trade Balancer row already requires "entry lists region-scroll" and "no page scroll for totals/primary actions"; the numbers are the smallest change that satisfies it and are surfaced for the owner in the screen-layout gate block |
| A10 | The committed price artifact is **not** rebuilt in the build worktree | 4 | the Scryfall bulk source `apps/frontend/data/scryfall/default-cards.json` is gitignored and exists only in the owner's main checkout — it is absent from this worktree. The sort ships with its unit test; the served order changes when the owner's next `npm run data:refresh-pr` (REQ-195) rebuilds the artifact. Until then the picker still works, because the player picks the printing rather than accepting a default |
| A11 | The scan path is unchanged | 5 | `TradeBalancer.scan.test.tsx` is the tested contract; the scanned printing stays the default |

## Product-truth changes proposed

Twelve blocks in `GATE-QUESTIONS.md`, every one an amendment in place — the
decision log is retired and no new IDs are minted.

| Block | Why it is in the set |
| --- | --- |
| `REQ-064` | the mount-time warm-up call is new balancer behavior, and REQ-064's constraint currently describes the balancer's only backend traffic |
| `REQ-065` | manual-search add path, foil default, picker presentation |
| `REQ-066` | printing order becomes part of the artifact contract |
| `FLOW-009` | step 2's manual-search branch and the foil edge case |
| `FLOW-025` | the fetch now happens on suggestion tap, and its failure path |
| `PRD/sections/trade-balancer/README.md` | the current-state feature spec's add-a-card, foil, retry, freshness, contract-posture, measured-bounds and retired-alternative text — every sentence that names when the fetch runs |
| `PRD/sections/screen-layout.md` | the Trade Balancer row gains the picker's containment rule |
| `PRD/sections/system-map.md` | the Trade balancer summary says "added immediately … the fetch's first result"; the artifact-build entry gains the order |
| `PRD/sections/integrations-and-data.md` | "its only backend traffic is the read-only price route" becomes false, the price endpoint's Purpose bullet still says "on-add fetch", and the wire order becomes contract |
| `PRD/sections/trade-balancer/data/cardPrintingPrices.md` | the artifact's `byOracleId` shape gains its ordering rule, and its Runtime posture still says the fetch happens "only when that card is added to a side" |
| `PRD/sections/overview.md` | the product summary says prices are fetched "only when a card is added" and that the balancer's fetch is its only backend traffic |
| `PRD/sections/non-functional-requirements.md` | NFR-013 repeats the "only when that card is added" timing, puts the loading state on the entry row, and counts the free-tier cost |

### How the amendment set was enumerated — line by line

Attempt 2 enumerated at **file** level: it re-read only the seven files that had
no block and trusted the ten that did. Two live sentences inside blocked files
survived that (`cardPrintingPrices.md:126-127`, `integrations-and-data.md:154`),
which is what quality-check attempt 2 failed on. Attempt 3 replaces the method:
every matching **line** in `PRD/sections/` is listed below and disposed of
individually, whether or not its file already carried a block.

The sweep (2026-09-09, refinement attempt 3) ran in two passes:

```bash
# pass 1 — the five topics this change touches
grep -rniE 'on-add|on add|only when .{0,30}added|when a card is added|when that card is added|when the card is added|added to a (trade )?side|printings\[0\]|first printing|first result|newest|non-foil|foil|picker|change printing|health|warm|wake|cold start|scroll|fetch' PRD/sections/
# pass 2 — every file that names the feature at all, read at each hit
grep -ric 'trade balancer|trade-balancer|trade side|balancer' PRD/sections/ | grep -v ':0$'
```

Pass 2 returned 14 files. Every hit in all 14 is a row below.

**Disposition — one row per matched line.** "Amended in block X" means a diff
hunk in `GATE-QUESTIONS.md` block X removes or rewrites that exact line;
verified by script against the live text (54 removed lines, 0 mismatches).

| `file:line` | Current wording (abbreviated) | Disposition |
| --- | --- | --- |
| `overview.md:13` | balancer named in a feature list | not contradicted — no claim about traffic, printing, foil, or picker |
| `overview.md:43` | "made only when a card is added" | amended in block `PRD/sections/overview.md` |
| `functional-requirements.md:175` | one-endpoint rule, two read-only retrieval routes | not contradicted — the warm-up adds no endpoint; `GET /api/health` already exists as a non-product endpoint |
| `functional-requirements.md:1456` | REQ-064 description, two-sided screen | not contradicted — no traffic or timing claim |
| `functional-requirements.md:1464` | trade state is ephemeral | not contradicted — kept as context in the REQ-064 hunk |
| `functional-requirements.md:1466` | "prices cards only through a read-only backend price fetch" | amended in block `REQ-064` |
| `functional-requirements.md:1482` | REQ-065 description, entry resolves to a printing | not contradicted — still true |
| `functional-requirements.md:1485` | scan input, scanned printing is the default | not contradicted — the scan path is unchanged (A11) |
| `functional-requirements.md:1486` | "then **chooses the correct printing** … before it is added" | amended in block `REQ-065` |
| `functional-requirements.md:1487` | "default is non-foil" | amended in block `REQ-065` |
| `functional-requirements.md:1491` | "fetched from the backend when the card is added" | amended in block `REQ-065` |
| `functional-requirements.md:1512` | REQ-066 artifact field set | not contradicted — kept as context; the field set is unchanged |
| `functional-requirements.md:1515` | "the manual picker lists every printing of a card" | amended in block `REQ-066` |
| `functional-requirements.md:1697` | two read-only retrieval routes permitted | not contradicted — same reason as `:175` |
| `functional-requirements.md:4023` | REQ-174 `cardMetadata` reads | not contradicted — the index and its uses are unchanged |
| `functional-requirements.md:4051-4052` | REQ-175 price companion route shape | not contradicted — the request and response shapes are unchanged |
| `user-flows.md:194` | "prices are fetched from the backend when it is added" | amended in block `FLOW-009` |
| `user-flows.md:196` | FLOW-009 step 1, the screen opens | amended in block `FLOW-009` (gains the warm-up ping) |
| `user-flows.md:198` | scan branch of step 2 | not contradicted — the scan path is unchanged (A11) |
| `user-flows.md:199` | manual-search branch, "chooses the correct printing" | amended in block `FLOW-009` |
| `user-flows.md:200` | "On add, the balancer fetches that card's printings" | amended in block `FLOW-009` |
| `user-flows.md:201` | added entry shows printing, price, foil toggle, quantity | not contradicted — states no default or timing |
| `user-flows.md:206` | missing-price $0 + caution edge case | not contradicted — kept as context; the treatment is unchanged |
| `user-flows.md:211` | failed price fetch degrades with retry | not contradicted — states no fetch moment; the pre-add failure case is added beside it |
| `user-flows.md:213` | "makes a read-only backend price fetch … but no `AskAiRequest`/prompt change" | not contradicted — this is a no-prompt-change claim, not an only-traffic claim; the AI path stays frozen |
| `user-flows.md:549` | FLOW-025 trigger, "a player adds a card to a trade side" | amended in block `FLOW-025` |
| `user-flows.md:554` | "showing a brief in-place loading state on the entry" | amended in block `FLOW-025` |
| `user-flows.md:555` | response carries printings and snapshot date | not contradicted — kept as context; the wire response is unchanged |
| `user-flows.md:556` | "On success the entry shows its chosen printing … the printing picker lists every printing" | amended in block `FLOW-025` |
| `user-flows.md:558` | failed fetch degrades, not cached | not contradicted — kept as context; the pre-add case is added below it |
| `user-flows.md:560` | null-price printing kept at $0 | not contradicted — unchanged |
| `non-functional-requirements.md:207` | "fetched from the backend only when that card is added" | amended in block `PRD/sections/non-functional-requirements.md` |
| `non-functional-requirements.md:208-209` | static snapshot, "no runtime price fetch" | not contradicted — the warm-up is not a price fetch and makes no external call |
| `non-functional-requirements.md:211` | "shows a brief in-place loading state" | amended in block `PRD/sections/non-functional-requirements.md` |
| `non-functional-requirements.md:212` | USD-only fields | not contradicted — unchanged |
| `non-functional-requirements.md:223` | free-tier posture, per-card invocation count | amended in block `PRD/sections/non-functional-requirements.md` |
| `integrations-and-data.md:77` | price route served from a committed artifact, no runtime network call | not contradicted — states no fetch moment and no exclusivity |
| `integrations-and-data.md:154` | "back the Trade Balancer's **on-add** fetch, cached per session" | amended in block `PRD/sections/integrations-and-data.md` (**added attempt 3** — quality-check finding 2) |
| `integrations-and-data.md:155` | `CardPrintingPrice` field list | not contradicted — kept as context; the field set is unchanged |
| `integrations-and-data.md:156` | third product-facing endpoint | not contradicted — the warm-up adds no endpoint |
| `integrations-and-data.md:158-161` | `GET /api/health` purpose list | amended in block `PRD/sections/integrations-and-data.md` (addition; the balancer joins the caller list) |
| `integrations-and-data.md:316` | "its only backend traffic is the read-only price route" | amended in block `PRD/sections/integrations-and-data.md` |
| `integrations-and-data.md:319` | per-printing artifact fields, "for the manual picker" | amended in block `PRD/sections/integrations-and-data.md` |
| `integrations-and-data.md:321` | static snapshot, no runtime price fetch | not contradicted — same reason as NFR-013's `:208-209` |
| `integrations-and-data.md:322` | "fetched from the backend only when that card is added to a trade side" | amended in block `PRD/sections/integrations-and-data.md` |
| `integrations-and-data.md:325` | input reuses scan resolver and manual search; printing is display-only | not contradicted — unchanged |
| `system-map.md:451` | printing-price artifact build summary | amended in block `PRD/sections/system-map.md` |
| `system-map.md:556` | "added immediately and priced by a read-only backend fetch on add … the fetch's first result" | amended in block `PRD/sections/system-map.md` |
| `system-map.md:557` | balancer file list (`PrintingPicker.tsx` etc.) | not contradicted — a file list, no behavior claim |
| `screen-layout.md:217` | Phone row, "lists region-scroll" | not contradicted — kept as context; the picker rule lands on the Fit row and a new row |
| `screen-layout.md:219` | Fit row, "entry lists region-scroll" | amended in block `PRD/sections/screen-layout.md` |
| `screen-layout.md:220` | price-freshness row | not contradicted — unchanged |
| `screen-layout.md:221` | Notes row, `DEC-087, DEC-145, REQ-145` | amended in block `PRD/sections/screen-layout.md` |
| `trade-balancer/README.md:23-24` | "the moment a card is added, it fetches that one card's printings" | amended in block `PRD/sections/trade-balancer/README.md` |
| `trade-balancer/README.md:53-56` | scan input, scanned printing is the default | not contradicted — the scan path is unchanged (A11) |
| `trade-balancer/README.md:60-62` | "defaulting to whichever printing the on-add fetch returns first" | amended in block `PRD/sections/trade-balancer/README.md` |
| `trade-balancer/README.md:68-69` | "the default is non-foil" | amended in block `PRD/sections/trade-balancer/README.md` |
| `trade-balancer/README.md:83-90` | missing-price and foil-toggle $0 + caution | not contradicted — the treatment is unchanged |
| `trade-balancer/README.md:91-94` | "if a card's **on-add** price fetch fails outright" | amended in block `PRD/sections/trade-balancer/README.md` (**added attempt 3**) |
| `trade-balancer/README.md:99` | "one card at a time when it's added to a side" | amended in block `PRD/sections/trade-balancer/README.md` (**added attempt 3**) |
| `trade-balancer/README.md:107-111` | snapshot date as date-level copy | not contradicted — REQ-145 behavior is unchanged |
| `trade-balancer/README.md:116-118` | "only backend traffic is the read-only price route" | amended in block `PRD/sections/trade-balancer/README.md` |
| `trade-balancer/README.md:125-136` | currency, quantity, freshness line, layout bounds | not contradicted — unchanged; the picker and warm-up bounds are added beneath them |
| `trade-balancer/README.md:140` | "fetched from the backend only on add" | amended in block `PRD/sections/trade-balancer/README.md` (**added attempt 3**) |
| `trade-balancer/README.md:160-161` | retired bulk-download alternative, "fetched per card on add instead" | amended in block `PRD/sections/trade-balancer/README.md` (**added attempt 3**) |
| `trade-balancer/README.md:162-166` | live/real-time price sync closed door | not contradicted — the warm-up is not a price lookup and makes no external call |
| `trade-balancer/data/cardPrintingPrices.md:53` | "no live price fetch, no runtime sync, no scheduled refresh" | not contradicted — same reason as above |
| `trade-balancer/data/cardPrintingPrices.md:84-87` | `byOracleId` artifact shape | amended in block `PRD/sections/trade-balancer/data/cardPrintingPrices.md` |
| `trade-balancer/data/cardPrintingPrices.md:104-105` | USD-only fields, trade entry shape | not contradicted — unchanged |
| `trade-balancer/data/cardPrintingPrices.md:116-118` | price coverage counts | not contradicted — measured figures, unchanged |
| `trade-balancer/data/cardPrintingPrices.md:126-127` | "fetched **only when that card is added to a side**, cached per session" | amended in block `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (**added attempt 3** — quality-check finding 1) |
| `goals-and-non-goals.md:76` | endpoint non-goal | not contradicted — the warm-up adds no endpoint and reuses the existing health check |
| `goals-and-non-goals.md:78` | pricing and printing picker in scope for the balancer | not contradicted — already in scope |
| `goals-and-non-goals.md:79` | live price sync / marketplace non-goals | not contradicted — none is added |
| `scan/README.md:235-243` | scan as one of two ways to add to a trade side | not contradicted — the scan path is unchanged (A11) |
| `scan/data/cardScanMap.md:41` | notes the balancer's corpus/behavior split | not contradicted — a comparison to this artifact's own split, no balancer behavior claim |
| `shared-chrome/README.md:65` | "presentation only — no backend health endpoint" | not contradicted — this constrains where the **mock-mode banner** reads its signal (build-time `ASK_AI_PROVIDER`, never a health probe), not whether any feature may call `GET /api/health` |
| `shared-chrome/README.md:56, 72, 136, 372, 408` | balancer chrome, rails, routing | not contradicted — the picker scrolls inside the destination body; containment lands on the `screen-layout.md` row |
| `decisions.md:128-129` | DEC-087 / DEC-088 rows | not contradicted — a retired historical index; decision bodies are never amended and no new `DEC` is minted |

Counts: **79 rows — 35 amended in a block, 44 not contradicted.** Six of the 35
were added in attempt 3: `integrations-and-data.md:154` (finding 2),
`cardPrintingPrices.md:126-127` (finding 1), and four the widened grep turned up
in a file that already had a block — `trade-balancer/README.md:91-94`, `:99`,
`:140`, `:160-161`. The block count is unchanged at twelve; the six new hunks
extend blocks that already existed.

## Slice sketch (for map-out)

- **A — build order.** Sort printings newest-first in
  `build-card-detail-by-oracle-id.mjs`; unit test asserts the order and that the
  emitted field set is unchanged. No artifact rebuild in the worktree (A10);
  the receipt says so.
- **B — foil auto-select.** Pure helper in `lib/trade/pricing.ts` plus its unit
  tests; wire it into the three places an entry receives a printing.
- **C — pick before add.** `pendingCard` in `TradeSide`, picker in place of the
  suggestion list, add with the tapped printing, cancel and failure fallback.
- **D — picker as a box.** Count header, scroll region, lazy images, filter
  above eight printings, selected row scrolled into view.
- **E — warm-up on mount.** One fire-and-forget health call, tested to be
  issued on mount and to swallow failure.

Verification: `npm test` in `apps/frontend` and the build-script test;
`TradeBalancer.scan.test.tsx` must stay green; browser check at 390x844 that the
Sol Ring picker stays inside the viewport and that a foil-only printing prices
on pick.

## Non-goals restated

No scheduled keep-warm, no lazy backend route init, no scan-path change, no new
artifact or index fields, no change to `AskAiRequest`, prompt assembly, or the
answer path. Printing choice stays a pricing and display concern only.
