# Trade Balancer — current-state feature spec

- Status: draft, derived, non-authoritative view. On any conflict, the cited
  `DEC`/`REQ`/`FLOW` wins — `PRD/sections/decisions.md` stays precedence #1
  and Read-First #1. Correct this file against those sources, not the other
  way around.
- Backed by: DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, REQ-145, FLOW-009,
  NFR-013, NFR-001
- Corpus: the printing price artifact this feature loads is documented
  separately in `data/cardPrintingPrices.md` — its contents are a `data/`
  concern and are not inlined here.

## What it is

A feature-portal destination where two traders each build a list of cards and
the app shows, at a glance, each side's total USD value and the difference
between the sides — so a trade can be balanced without doing the math by hand at
the table. A player adds a card to a side by scanning it or searching its name;
each card resolves to a specific printing carrying its own price, with a foil
toggle and a quantity. The whole thing runs in the browser: it makes no backend
call, prices from a committed snapshot (not a live quote), and keeps no history
— close it and the trade is gone. It sits outside the MTG Assistant core loop
and changes nothing about it.

## How it works

### The two-sided screen

- Built: the view presents two sides — **Side A** and **Side B** — each an
  ordered list of card entries, each empty when the balancer opens. (DEC-087,
  REQ-064, FLOW-009)
- Built: each side shows a running **total** = `Σ qty × (foil ? usdFoil : usd)`
  across its entries, in USD, updating live as entries are added, removed,
  re-priced, foil-toggled, or quantity-changed. (REQ-064)
- Built: the view shows the **difference** between the two totals as an amount
  and indicates which side is higher, or that the sides are equal ("Even
  trade"). (REQ-064)
- Built: the trade state is **ephemeral** — no history, no persistence across
  reload, no marketplace or transaction handling, and no automated
  "suggest cards to balance" logic. (DEC-087, REQ-064)
- Built: reached as the `trade-balancer` feature-portal destination; the MTG
  Assistant start screen and flow are unaffected. The portal chrome and routing
  are owned at the feature-portal level (DEC-095 / REQ-067 / DEC-157), not by
  this feature. (DEC-087, REQ-064)

### Adding a card to a side

- Built: each entry carries a chosen **printing** (printing id, set, collector
  number, image, non-foil `usd`, foil `usd_foil`), a **foil** flag, and a
  **quantity** ≥ 1. (DEC-087, REQ-065)
- Built: **scan input** — the existing scan engine identifies the card and the
  scanned printing (its `Candidate.card_id`, DEC-070) becomes the entry's
  default printing; the player can change the printing to any other printing of
  that card if the scanned print is wrong. Scanning is per-side and one camera at
  a time. (DEC-087, REQ-065, FLOW-009)
- Built: **manual search input** — the player finds a card by name via the
  existing local search (DEC-012), then chooses the correct printing from that
  card's printing list before it is added; that printing's price applies. Manual
  search is the permanent fallback and stays fully functional when the camera is
  unavailable — the surface closes and the reason is surfaced rather than
  breaking the screen. (DEC-087, REQ-065, FLOW-009)
- Built: the **foil toggle** switches an entry's contribution between `usd` and
  `usd_foil`; the default is non-foil. (DEC-087, REQ-065)
- Built: **quantity / multiples** — the same card or printing may appear more
  than once on a side, via repeated adds and/or a per-entry quantity control;
  each unit counts toward the side total. A trade side is a value list, not the
  stack: the stack duplicate-block (REQ-009 / FLOW-004) and the 10-card cap
  (REQ-010) do **not** apply. (DEC-087, REQ-065, FLOW-009)
- Built: each entry can be **removed** from its side. (REQ-065)
- Built: printing selection is a **pricing/display layer only** — it is never
  pushed into prompt context, rulings lookup, or the Decrypt-Stack request
  payload, and it does not reopen the DEC-053 oracle-level scan-identity model.
  (DEC-087, REQ-065)

### Missing prices

- Built: when the selected foil mode has no price for the chosen printing, the
  entry's contribution defaults to **$0**, still counts as $0 toward the side
  total, is rendered in a **distinct color** from priced entries, and carries a
  **caution-triangle** indicator so the player knows the value is unknown and
  the side total may be understated. The side total is not otherwise marked
  incomplete. (DEC-087, REQ-065, FLOW-009)
- Built: toggling foil on an entry that has no `usd_foil` (or off with no `usd`)
  applies the same $0 + caution treatment for that mode. (FLOW-009)

### Prices and freshness

- Built: prices come from a committed, lazy-loaded printing price snapshot —
  there is no live or real-time lookup and no runtime sync. The artifact is
  documented in `data/cardPrintingPrices.md`. (DEC-088, REQ-066, NFR-013)
- Built: the UI surfaces the snapshot date as **date-level copy**
  (`Prices as of 5 June 2026`), formatted from the artifact's ISO `snapshotDate`
  with no raw `T`, milliseconds, or `Z` suffix, so it cannot read as a live
  quote; an unparseable value omits the line rather than printing raw artifact
  data. (REQ-145)

### Contract posture

- Built: **frontend-only and contract-frozen** — no change to `AskAiRequest`,
  Zod schemas, `GameContext`, prompt assembly, the provider boundary,
  `POST /api/ask-ai`, or any product-facing endpoint; the feature adds no backend
  route and no server-side state. (DEC-087, REQ-064)

## Measured bounds

- Currency scope: **USD only** (`usd` / `usd_foil`). EUR, tix, etched-foil, and
  card grading/condition are out of scope for v1. (DEC-087, REQ-064, REQ-065)
- Quantity: **≥ 1** per entry; duplicates allowed on a side. Side total =
  `Σ qty × (foil ? usdFoil : usd)`. (DEC-087, REQ-064)
- Price freshness line: date-level copy only, e.g. `Prices as of 5 June 2026`;
  stays on one line at 390×844 (`scrollWidth` 299 = `clientWidth`); an
  unparseable `snapshotDate` omits the line entirely. (REQ-145, `screen-layout.md`)
- Layout/fit: sides stack on phone and the entry lists region-scroll; totals and
  primary actions stay visible with no page scroll; desktop/tablet uses the
  shell width (92% / 48rem or destination equivalent) rather than unused
  ultra-wide bands, content-sized vertically. Mobile-first and touch-friendly.
  (`screen-layout.md`, NFR-001)
- Data footprint: the price artifact is lazy-loaded only on first open, so a user
  who never opens the balancer pays no startup cost; its size, load time, and
  lookup latency stay within a mobile-friendly budget (NFR-013). The committed
  snapshot's measured figures live in `data/cardPrintingPrices.md`.

## Rejected alternatives and deferred scope

- **Extending `cardMetadata.json` with a single price — closed door.** The IDEA
  proposed one price on the oracle-level metadata artifact, but `cardMetadata.json`
  is oracle-level (one representative printing per oracle id, DEC-071) and cannot
  represent the price of a specific scanned or chosen printing, nor list a card's
  printings for the picker. DEC-088 chose a dedicated printing-level artifact
  instead. (DEC-088)
- **Overloading `cardScanMap.json` with pricing — closed door.** That artifact is
  already printing-level but scoped to the scan resolver and lazy-loaded only on
  first scan; adding prices would couple scan-identity resolution to trade
  pricing. A separate artifact keeps the concerns clean. (DEC-088)
- **Live / real-time price sync — closed door.** Pricing was narrowed into scope
  only as a static build-time snapshot (`no live/real-time price sync`); there is
  deliberately no runtime fetch or scheduled refresh. (DEC-087, DEC-088, NFR-013)
- **Printing disambiguation reaching gameplay identity — closed door.** The
  printing pick here is presentation/pricing only; scan identity stays
  oracle-level per DEC-053 and is not reopened. (DEC-087)
- **Raw ISO timestamp in the freshness line — closed door.** The measured
  baseline `Prices as of 2026-06-05T22:21:13.248Z` implied live-quote precision;
  REQ-145 replaced it with date-level copy. (REQ-145)
- **Out of scope entirely (v1):** EUR / tix / etched-foil pricing, card
  grading/condition, trade history or persistence, a marketplace or transaction
  system, and automated balancing suggestions. (DEC-087)

## Where it lives

Frontend view and trade-local logic live under
`apps/frontend/src/components/trade/` (`TradeBalancer.tsx`, `TradeSide.tsx`,
`TradeEntryRow.tsx`, `PrintingPicker.tsx`, `oracleSearch.ts`, `useTradeScan.ts`)
and `apps/frontend/src/lib/trade/` (`loadCardPrices.ts` lazy loader + indexes,
`pricing.ts` pure selectors); it reuses the scan resolver and map from
`apps/frontend/src/lib/scan/` and manual-search primitives from
`apps/frontend/src/lib/search.ts`, and registers as the `trade-balancer`
destination in
`apps/frontend/src/components/portal/destinationRegistry.tsx`. The committed
price artifact and its build script are documented in `data/cardPrintingPrices.md`.
See `PRD/sections/system-map.md`'s `## Trade balancer` and
`### Printing-price artifact build` entries for the full file list, and
`PRD/sections/screen-layout.md`'s `#### Trade Balancer` row for the layout bands.
