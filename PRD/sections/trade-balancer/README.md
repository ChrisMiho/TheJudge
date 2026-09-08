# Trade Balancer — current-state feature spec

- Status: current-state feature spec — precedence #1 and Read-First #1 for what
  this feature does today. Decision bodies are retired: `PRD/sections/decisions.md`
  is now precedence #2, a historical index that resolves a cited `DEC` ID to a
  one-line summary, no longer an override. The cited `REQ`/`FLOW` remain the
  granular backing; keep this file correct in step with them as behavior changes,
  editing in place — never by recording a new decision.
- Backed by: REQ-064, REQ-065, REQ-066, REQ-145, REQ-174, REQ-175, FLOW-009,
  FLOW-025, NFR-013, NFR-001
- Corpus: the printing price artifact the backend serves is documented
  separately in `data/cardPrintingPrices.md` — its contents are a `data/`
  concern and are not inlined here.

## What it is

A feature-portal destination where two traders each build a list of cards and
the app shows, at a glance, each side's total USD value and the difference
between the sides — so a trade can be balanced without doing the math by hand at
the table. A player adds a card to a side by scanning it or searching its name;
each card resolves to a specific printing carrying its own price, with a foil
toggle and a quantity. The screen opens with only the shared local card index
in hand; the moment a card is added, it fetches that one card's printings and
prices from the backend, prices from a committed snapshot (not a live quote),
and keeps no history — close it and the trade is gone. It sits outside the MTG
Assistant core loop and changes nothing about it or the AI answer path.

## How it works

### The two-sided screen

- Built: the view presents two sides — **Side A** and **Side B** — each an
  ordered list of card entries, each empty when the balancer opens. (REQ-064,
  FLOW-009)
- Built: each side shows a running **total** = `Σ qty × (foil ? usdFoil : usd)`
  across its entries, in USD, updating live as entries are added, removed,
  re-priced, foil-toggled, or quantity-changed. (REQ-064)
- Built: the view shows the **difference** between the two totals as an amount
  and indicates which side is higher, or that the sides are equal ("Even
  trade"). (REQ-064)
- Built: the trade state is **ephemeral** — no history, no persistence across
  reload, no marketplace or transaction handling, and no automated
  "suggest cards to balance" logic. (REQ-064)
- Built: reached as the `trade-balancer` feature-portal destination; the MTG
  Assistant start screen and flow are unaffected. The portal chrome and routing
  are owned at the feature-portal level (DEC-095 / REQ-067 / DEC-157), not by
  this feature. (REQ-064)

### Adding a card to a side

- Built: each entry carries a chosen **printing** (printing id, set, collector
  number, non-foil `usd`, foil `usd_foil`; the image derives from the printing
  id), a **foil** flag, and a **quantity** ≥ 1. (REQ-065)
- Built: **scan input** — the existing scan engine identifies the card and the
  scanned printing (its `Candidate.card_id`, DEC-070) becomes the entry's
  default printing once its price fetch resolves; the player can change the
  printing to any other printing of that card if the scanned print is wrong.
  Scanning is per-side and one camera at a time. (REQ-065, FLOW-009, FLOW-025)
- Built: **manual search input** — the player finds a card by name via the
  shared `cardMetadata` index (REQ-174) and adds it; the entry appears
  immediately, defaulting to whichever printing the on-add fetch returns first,
  with a brief loading state while it resolves. The player then **chooses the
  correct printing** via the same "Change printing" affordance a scanned entry
  uses, if the default isn't the one they want. Manual search is the permanent
  fallback and stays fully functional when the camera is unavailable — the
  surface closes and the reason is surfaced rather than breaking the screen.
  (REQ-065, FLOW-009, FLOW-025)
- Built: the **foil toggle** switches an entry's contribution between `usd` and
  `usd_foil`; the default is non-foil. (REQ-065)
- Built: **quantity / multiples** — the same card or printing may appear more
  than once on a side, via repeated adds and/or a per-entry quantity control;
  each unit counts toward the side total. A trade side is a value list, not the
  stack: the stack duplicate-block (REQ-009 / FLOW-004) and the 10-card cap
  (REQ-010) do **not** apply. (REQ-065, FLOW-009)
- Built: each entry can be **removed** from its side. (REQ-065)
- Built: printing selection is a **pricing/display layer only** — it is never
  pushed into prompt context, rulings lookup, or the Decrypt-Stack request
  payload, and it does not reopen the DEC-053 oracle-level scan-identity model.
  (REQ-065)

### Missing prices, and a failed price fetch

- Built: when the selected foil mode has no price for the chosen printing, the
  entry's contribution defaults to **$0**, still counts as $0 toward the side
  total, is rendered in a **distinct color** from priced entries, and carries a
  **caution-triangle** indicator so the player knows the value is unknown and
  the side total may be understated. The side total is not otherwise marked
  incomplete. (REQ-065, FLOW-009)
- Built: toggling foil on an entry that has no `usd_foil` (or off with no `usd`)
  applies the same $0 + caution treatment for that mode. (FLOW-009)
- Built: if a card's on-add price fetch fails outright (not a missing price,
  but a failed request), the entry degrades to the same $0-plus-caution
  treatment with a **retry** affordance, rather than a broken row; the failed
  result is not cached, so retrying re-fetches. (FLOW-025)

### Prices and freshness

- Built: prices come from a committed printing-price snapshot served by the
  backend on demand, one card at a time when it's added to a side, and cached
  for the rest of the session — there is no live or real-time lookup, no
  runtime sync, and no up-front bulk download. The artifact is documented in
  `data/cardPrintingPrices.md`. (REQ-066, REQ-175, NFR-013, FLOW-025)
- Built: the UI surfaces the snapshot date as **date-level copy**
  (`Prices as of 5 June 2026`), formatted from the response's ISO
  `snapshotDate` with no raw `T`, milliseconds, or `Z` suffix, so it cannot
  read as a live quote; an unparseable value omits the line rather than
  printing raw artifact data. Shown once at least one card's price fetch has
  resolved. (REQ-145)

### Contract posture

- Built: **contract-frozen on the AI answer path, with one read-only backend
  fetch of its own** — no change to `AskAiRequest`, Zod schemas, `GameContext`,
  prompt assembly, the provider boundary, or `POST /api/ask-ai`. The balancer's
  only backend traffic is the read-only price route
  `GET /api/cards/:oracleId/prices` (REQ-175), which the question/RAG flow
  never touches and which carries no rules text. (REQ-064, REQ-175)

## Measured bounds

- Currency scope: **USD only** (`usd` / `usd_foil`). EUR, tix, etched-foil, and
  card grading/condition are out of scope for v1. (REQ-064, REQ-065)
- Quantity: **≥ 1** per entry; duplicates allowed on a side. Side total =
  `Σ qty × (foil ? usdFoil : usd)`. (REQ-064)
- Price freshness line: date-level copy only, e.g. `Prices as of 5 June 2026`;
  stays on one line at 390×844 (`scrollWidth` 299 = `clientWidth`); an
  unparseable `snapshotDate` omits the line entirely. (REQ-145, `screen-layout.md`)
- Layout/fit: sides stack on phone and the entry lists region-scroll; totals and
  primary actions stay visible with no page scroll; desktop/tablet uses the
  shell width (92% / 48rem or destination equivalent) rather than unused
  ultra-wide bands, content-sized vertically. Mobile-first and touch-friendly.
  (`screen-layout.md`, NFR-001)
- Data footprint: no up-front price download — the balancer's only up-front
  frontend cost is the shared `cardMetadata` index (REQ-174), the same list
  MTG Assistant and Quick Lookup already load. A card's prices are fetched
  from the backend only on add; per-card fetch and pricing stay within a
  mobile-friendly budget (NFR-013). The committed backend snapshot's measured
  figures live in `data/cardPrintingPrices.md`.

## Rejected alternatives and deferred scope

- **Extending `cardMetadata.json` with a single price — closed door.** An
  earlier idea proposed one price on the oracle-level metadata artifact, but
  `cardMetadata.json` is oracle-level (one representative printing per oracle
  id, DEC-071) and cannot represent the price of a specific scanned or chosen
  printing, nor list a card's printings for the picker. A dedicated,
  printing-level price artifact carries this instead (REQ-066) — first as a
  frontend file, now backend-served on demand (REQ-175).
- **Overloading `cardScanMap.json` with pricing — closed door.** That artifact
  is already printing-level but scoped to the scan resolver and lazy-loaded
  only on first scan; adding prices would couple scan-identity resolution to
  trade pricing. A separate artifact/route keeps the concerns clean.
- **A single bulk frontend price download — retired, not merely closed.** The
  original design lazy-loaded one ~38 MB committed file on first Trade
  Balancer open. Measured against the live corpus, that stalled first open for
  seconds on mobile; REQ-066 moved pricing to the backend, fetched per card on
  add instead (FLOW-025).
- **Live / real-time price sync — closed door.** Pricing was narrowed into scope
  only as a static build-time snapshot (`no live/real-time price sync`); there is
  deliberately no runtime fetch or scheduled refresh. The on-demand backend read
  serves that same static snapshot from memory — it is not a live lookup.
  (NFR-013)
- **Printing disambiguation reaching gameplay identity — closed door.** The
  printing pick here is presentation/pricing only; scan identity stays
  oracle-level per DEC-053 and is not reopened.
- **Raw ISO timestamp in the freshness line — closed door.** The measured
  baseline `Prices as of 2026-06-05T22:21:13.248Z` implied live-quote precision;
  REQ-145 replaced it with date-level copy.
- **Consolidating to one backend map (rules + prices together) — deferred,
  future work.** The owner's preferred end-state is one backend file per card
  carrying both the rules block and its printings array, with each endpoint
  reading only the slice it needs. This run keeps two output files (unified
  build, separate committed artifacts and routes) so the RAG answer path's
  `cardDetailByOracleId.json` stays byte-for-byte untouched; the consolidation
  is a later, separately planned change.
- **Out of scope entirely (v1):** EUR / tix / etched-foil pricing, card
  grading/condition, trade history or persistence, a marketplace or transaction
  system, and automated balancing suggestions.

## Where it lives

Frontend view and trade-local logic live under
`apps/frontend/src/components/trade/` (`TradeBalancer.tsx`, `TradeSide.tsx`,
`TradeEntryRow.tsx`, `PrintingPicker.tsx`, `oracleSearch.ts`, `useTradeScan.ts`)
and `apps/frontend/src/lib/trade/` (`fetchCardPrintings.ts` per-session
fetch/cache module, `pricing.ts` pure selectors, unchanged); it reuses the
scan resolver and map from `apps/frontend/src/lib/scan/`, manual-search
primitives from `apps/frontend/src/lib/search.ts`, the shared `cardMetadata`
index (REQ-174) and image-derive helper `apps/frontend/src/lib/cardImage.ts`,
and registers as the `trade-balancer` destination in
`apps/frontend/src/components/portal/destinationRegistry.tsx`. The backend
loader and route live in `apps/backend/src/cardPrices.ts` and
`apps/backend/src/routes/cardPrices.ts`. The committed price artifact and its
build script are documented in `data/cardPrintingPrices.md`. See
`PRD/sections/system-map.md`'s `## Trade balancer` and
`### Printing-price artifact build` entries for the full file list, and
`PRD/sections/screen-layout.md`'s `#### Trade Balancer` row for the layout bands.
