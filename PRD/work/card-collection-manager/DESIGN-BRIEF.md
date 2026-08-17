# Card Collection Manager — Design Brief

## Status

Refined autonomously under `graph-run is controlling` (run `graph-20260817-110500`, node 3 `define`). The approval pause required by `thejudge-refinement` was replaced by the conservative assumption ladder in `PRD/instructions/preparation-contract.md`; every material assumption and its evidence is recorded under **Material assumptions** below. No question met the three-condition genuine-decision-blocker test.

## Outcome

A player can keep a durable local record of the physical cards they own. They open the Card Collection destination, scan a stack of cards, fix any printing the scanner got wrong, and commit the whole batch into one named list — a folder, a deck, or a box. The collection overview shows, at a glance, how their cards are spread across those lists and what the whole thing is worth. Because browser storage is not a safe home for a real collection, the app hands them a master backup file and reminds them to keep it current.

## Approved scope

### Destination and home

One new feature-portal destination registered in `PORTAL_DESTINATIONS` with a flat top-level path and a `React.lazy` boundary, exactly like the four shipped destinations. Its home offers **two** primary actions and nothing else: **Scan cards** and **View collection**.

### Overview

A pie of **card counts per list** (one color per list) with **total collection USD** centered inside it. Selecting a list opens it. Drawn with inline SVG/CSS — no charting dependency. Empty collection renders an explicit empty state pointing at the scan action.

### Batch scan and commit

Scanned cards accumulate into a review batch, each defaulting to the scanned printing (DEC-070). The user corrects wrong printings in the review UI via the shipped `PrintingPicker`, then commits the **whole batch to exactly one list** — existing, or created and labelled at commit time — after which the batch clears. A further batch may target an existing list. Abandoning discards.

### Lists and entries

A list is a single type with a user-chosen name and an **inert** `folder` / `deck` / `box` label. Entries carry printing, quantity, foil, and snapshot price; they support printing change, quantity, foil toggle, and removal. Duplicates within a list are allowed.

### Durability

Two tiers. A schema-versioned, field-validated `localStorage` working copy so returning players are never forced to re-import. A user-owned JSON **master backup file** as the durable source of truth, offered after every batch commit with a plain beta warning. Import **replaces** the working copy behind explicit confirmation naming the counts being replaced.

## Material assumptions and their evidence

Each row records what was uncertain, what was chosen, and the ladder rung that settled it.

| # | Question | Resolution | Rung | Evidence |
|---|---|---|---|---|
| 1 | Where does the feature live in the app? | A registered feature-portal destination with a flat top-level URL and its own `React.lazy` boundary | 1 — PRD sections | DEC-095/DEC-135/DEC-157, REQ-140; `apps/frontend/src/components/portal/destinationRegistry.tsx` `PORTAL_DESTINATIONS` entry shape |
| 2 | Build new pricing, or reuse the Trade Balancer's? | Reuse unconditionally — the IDEA's "prefer … when timing allows" was written when these were *planned*; they are now **shipped** | 2 — tested behavior | `system-map.md` "Trade balancer" status **shipped**; `apps/frontend/src/lib/trade/{loadCardPrices,pricing}.ts`, `components/trade/PrintingPicker.tsx` exist with tests; `technical-design-rules.md` reuse-before-creating rule |
| 3 | Price data source? | The committed `cardPrintingPrices.json` snapshot via the shipped lazy loader; no live API | 1 — PRD sections | DEC-088, NFR-013; artifact present at `apps/frontend/public/data/cardPrintingPrices.json`; IDEA non-goal "no live price API" |
| 4 | Totals formula and missing-price treatment? | Reuse the shipped pure selectors (`Σ qty × (foil ? usdFoil : usd)`, missing → $0 + caution triangle) rather than restating them | 2 — tested behavior | `lib/trade/pricing.ts` `entryUnitPrice`/`entryContribution`/`sideTotal`/`formatUsd`; DEC-087 missing-price convention |
| 5 | What happens to a scanned card with **no price**? | It is still collected, at $0 with the caution indicator — **diverging** from Trade Balancer, which drops it | 4 — smallest reversible scope + 5 — preserve user data | `components/trade/useTradeScan.ts` `SCAN_UNPRICED_CARD_COPY` drops unpriced cards because it is a *value comparator*; a collection is an *inventory record*, so dropping would silently lose the user's card. Recorded explicitly in DEC-161/REQ-148 as a deliberate divergence |
| 6 | Storage mechanism for the working copy? | `localStorage` under a namespaced `thejudge.collection.*` key, validate-or-default on read, schema-versioned | 3 — established local patterns | DEC-103 (`thejudge.lifeTracker.state`), DEC-124; `lib/lifeTracker/persistence.ts` per-field validation helpers |
| 7 | The IDEA's "cookie/flag so users aren't forced to re-import" | **No cookie.** The presence of a valid stored working copy *is* the flag | 6 — no new mechanism without authoritative scope | A cookie would be a second, weaker store (size-capped, sent on requests) for a question `localStorage` already answers; no cookie exists anywhere in the repo today |
| 8 | Import semantics — replace or merge? | **Replace**, behind explicit confirmation naming current list/card counts | 1 — captured request | IDEA: "support import to **restore** the working copy". Flagged as the most destructive operation in scope, hence the mandatory confirmation |
| 9 | Are prices stored in the backup file? | **No** — entries store printing ids and are re-priced from the snapshot on load | 4 — smallest reversible scope | Storing prices would freeze stale values into a long-lived backup; printing ids are already the artifact's index key (`loadCardPrices.ts` `getPrintingPrice`) |
| 10 | Cap on collection size (cf. history's 20-entry prune)? | **No cap.** Quota failure surfaces an explicit error directing the user to export | 5 — preserve user data | DEC-124 prunes *conversations*, which are disposable; pruning an inventory would silently delete owned cards |
| 11 | Do folder/deck/box labels carry behavior? | **No** — labels are presentation only | 1 — PRD sections | IDEA non-goal "no special deck/box rules"; DEC-013 forbids legality/capacity/rules-engine behavior |
| 12 | Charting library for the pie? | None — inline SVG/CSS only | 6 — no new dependency without authoritative scope | `technical-design-rules.md` Allowed Design Direction lists no visualization dependency; a pie is expressible in plain SVG/`conic-gradient` |
| 13 | Import/export placement (flagged open in the IDEA) | Under the Collection overview, not the two-action home | 4 — smallest reversible scope | Keeps REQ-146's "exactly two primary actions" home intact; placement changes no behavior or contract, so it does not meet the blocker test |
| 14 | Does the collection integrate with other features? | **No** cross-feature seeding in v1 (no In-Depth zones, no Trade Balancer hand-off) | 6 — no new integration without authoritative scope | IDEA non-goal "not a replacement for MTG Assistant zones"; IDEA is otherwise silent, so the conservative read is no integration |
| 15 | Scan card universe | The scan map / card metadata universe, **not** the price-artifact-synthesized universe the Trade Balancer uses | 3 — established local patterns | `useTradeScan.ts` synthesizes its metadata list *from the price artifact* because its universe is priced cards; a collection must be able to hold an unpriced card (see #5), so it follows the main scan path's universe instead |

## Non-goals

Carried from the IDEA and confirmed against product truth:

- no cloud, account, or multi-device sync
- no marketplace or transaction handling
- no special deck/box rules — no size limits, commander legality, or capacity
- not a replacement for MTG Assistant zones
- no live price API, no runtime price fetch, no runtime sync
- no charting or visualization dependency
- no backend, endpoint, contract, prompt, or rulings change of any kind
- no per-label behavior of any kind
- no cross-feature seeding in v1

## Product-truth references

Written by this refinement:

- `PRD/sections/decisions/card-collection.md` — **DEC-161** (the feature), **DEC-162** (durability model), plus both router index rows in `PRD/sections/decisions.md`
- `PRD/sections/functional-requirements.md` — **REQ-146** destination/home, **REQ-147** overview pie + total, **REQ-148** batch scan/commit, **REQ-149** browser working copy, **REQ-150** master backup export/restore, **REQ-151** list and entry editing
- `PRD/sections/user-flows.md` — **FLOW-019** scan a batch into a list, **FLOW-020** back up and restore
- `PRD/sections/non-functional-requirements.md` — **NFR-015** data footprint and durability honesty
- `PRD/sections/goals-and-non-goals.md` — narrowed the saved-sessions non-goal to admit this feature; added the planned capability
- `PRD/sections/screen-layout.md` — four new rows (feature home, overview, list detail, scan batch review)
- `PRD/sections/system-map.md` — new **Card collection manager** entry, status `planned`

Depended upon, unchanged:

- DEC-087 / DEC-088 — Trade Balancer pricing model and printing-price artifact
- DEC-050 / DEC-053 / DEC-070 — scanning, oracle-level identity, printing-level art provenance
- DEC-095 / DEC-135 / DEC-157 — feature portal, registry order, routing
- DEC-103 / DEC-124 — browser-local persistence precedent
- DEC-010 / DEC-013 — one product endpoint, no rules-engine behavior

## Reuse map (binding — do not fork)

| Need | Existing module |
|---|---|
| Price artifact load + indexes | `apps/frontend/src/lib/trade/loadCardPrices.ts` |
| Pricing selectors and USD formatting | `apps/frontend/src/lib/trade/pricing.ts` |
| Printing correction UI | `apps/frontend/src/components/trade/PrintingPicker.tsx` |
| Scan capture, camera surface, resolver | `apps/frontend/src/hooks/useScanCapture.ts`, `components/ScanCameraSurface.tsx`, `lib/scan/{resolveScanCandidates,loadScanMap}.ts` |
| Per-surface scan adapter pattern | `apps/frontend/src/components/trade/useTradeScan.ts` |
| Validate-or-default persistence pattern | `apps/frontend/src/lib/lifeTracker/persistence.ts` |
| Card image presentation | `apps/frontend/src/components/CardPresentation.tsx` |
| Destination registration | `apps/frontend/src/components/portal/destinationRegistry.tsx` |

`pricing.ts`'s selectors are typed against `TradeEntry`. Generalize their input to a shared priced-entry shape (printing + foil + quantity) that `TradeEntry` remains assignable to, so both features share one definition — a widening with no behavior change to the Trade Balancer, not a copy.

## Verification focus

- totals and per-list counts recompute correctly across add / remove / quantity / foil / printing change
- an unpriced card survives a scan-commit round trip and renders $0 with the caution indicator
- malformed, partial, and wrong-version stored data degrade to a clean empty collection without throwing
- export → clear storage → import restores the same lists, labels, quantities, and foil flags
- import of a wrong-shaped file leaves the working copy untouched
- entries re-price from the snapshot rather than from the backup file
- the destination adds no startup cost for users who never open it
- live verification at 390×844: the centered total stays legible inside the pie and no page scroll appears on the home or overview

## Open gate (blocks this run, not this brief)

This brief is complete and needs no human product decision. The run itself is blocked on a **mechanical precondition**, recorded in `GRAPH-RUN.md`: the stated autonomous base `origin/feature/collection-manager` does not exist, so this refinement could not be committed. See that ledger for the evidence and the resume command.
