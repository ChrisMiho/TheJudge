# DESIGN BRIEF — trade-balancer-first-card-ux

- Package: `PRD/work/trade-balancer-first-card-ux/`
- Status: refined (proposal only — nothing in `PRD/sections/` is edited here)
- Proposal: `GATE-QUESTIONS.md`, ten blocks, all amendments to existing IDs and
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

Ten blocks in `GATE-QUESTIONS.md`, every one an amendment in place — the
decision log is retired and no new IDs are minted.

| Block | Why it is in the set |
| --- | --- |
| `REQ-064` | the mount-time warm-up call is new balancer behavior, and REQ-064's constraint currently describes the balancer's only backend traffic |
| `REQ-065` | manual-search add path, foil default, picker presentation |
| `REQ-066` | printing order becomes part of the artifact contract |
| `FLOW-009` | step 2's manual-search branch and the foil edge case |
| `FLOW-025` | the fetch now happens on suggestion tap, and its failure path |
| `PRD/sections/trade-balancer/README.md` | the current-state feature spec's add-a-card, foil, contract-posture and measured-bounds text |
| `PRD/sections/screen-layout.md` | the Trade Balancer row gains the picker's containment rule |
| `PRD/sections/system-map.md` | the Trade balancer summary says "added immediately … the fetch's first result"; the artifact-build entry gains the order |
| `PRD/sections/integrations-and-data.md` | "its only backend traffic is the read-only price route" becomes false, and the wire order becomes contract |
| `PRD/sections/trade-balancer/data/cardPrintingPrices.md` | the artifact's `byOracleId` shape gains its ordering rule |

The amendment set was enumerated by grepping `PRD/sections/` for every live
assertion about printing defaults, the picker, the foil default and the
balancer's backend traffic — not from memory. The four beyond the intake's list
(`REQ-064`, `system-map.md`, `integrations-and-data.md`,
`data/cardPrintingPrices.md`) came out of that grep.

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
