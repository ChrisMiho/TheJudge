# Design Brief: card-trade-balancer

## Summary

A standalone, frontend-only, **ephemeral** Card Trade Balancer: two traders each build a list of cards; the app shows each side's total USD value and the live difference so a trade can be balanced at a glance. Reached as a destination registered in the `feature-portal` (which owns the nav chrome + mode switch); this package no longer builds nav chrome. No backend, endpoint, or contract change.

## Scope

- **Two-sided balancer** (Side A / Side B): each an ordered list of card entries; per-side total = `Σ qty × (foil ? usdFoil : usd)`; show each total and the difference (amount + which side is higher). (REQ-064, FLOW-009)
- **Card entry model** (REQ-065): each entry resolves to a **specific printing** (id, set, collector number, image, `usd`, `usd_foil`) and carries a **foil toggle** (default non-foil) and a **quantity ≥ 1**.
  - **Scan input:** the scanned printing (DEC-070 provenance) is the default; the user can **change the printing** if wrong.
  - **Manual search input** (permanent fallback, DEC-012): find the card by name, then **choose the correct printing** before adding.
  - **Duplicates/multiples allowed** on a side (stack duplicate-block and 10-card cap do not apply).
  - **Missing price** for the selected foil mode → contributes **$0**, price shown in a distinct color, plus a **caution-triangle** indicator.
- **Printing-level price artifact** (REQ-066, DEC-088): new committed, lazy-loaded artifact built offline from the Scryfall bulk source; per printing `usd`/`usd_foil` + set/collector/image; indexable by oracle id (picker) and printing id (scan); records a snapshot date; static snapshot, human-approved refresh only.
- **Portal destination** (depends on `feature-portal`; REQ-067, FLOW-010, DEC-095): the Trade Balancer registers as a destination in the `feature-portal` and mounts in its Trade Balancer slot. Nav chrome + the mode switch are **built by `feature-portal`, not here**; the portal is a prerequisite (ships first).

## Key decisions

- **DEC-087** — Card Trade Balancer feature: standalone, frontend-only, ephemeral; per-entry printing + foil toggle + quantity; scan or manual-search input; missing price → $0 + caution; USD only; **narrows** the pricing and printing-disambiguation non-goals (live/real-time price sync stays out); no `AskAiRequest`/prompt/endpoint change; scan identity stays oracle-level (DEC-053).
- **DEC-088** — Printing-level static price artifact built from Scryfall bulk; lazy-loaded; no runtime price fetch/sync; extends DEC-012 with a second static artifact.
- **DEC-095 (dependency, owned by `feature-portal`)** — top-level nav elevated into the feature-portal package: top-middle menu button + extensible destination registry; the balancer registers as a destination. Refines DEC-089. Not built in this package.

## Non-goals (this work)

- No live/real-time price sync, price history, or market integration (prices are a static build-time snapshot).
- No trade history/persistence, marketplace, or transaction handling.
- No automated "suggest cards to balance" logic.
- No change to scan identity/recipe/lock boundary, `cardMetadata.json`, `cardScanMap.json`, `AskAiRequest`, prompt assembly, the provider boundary, or any endpoint.
- EUR/tix/etched-foil pricing and card grading/condition are out of scope for v1.

## Requirements & flows

- REQ-064 — Two-sided trade balancer screen
- REQ-065 — Trade card entry: printing selection, foil toggle, quantity
- REQ-066 — Printing-level price data artifact
- NFR-013 — Trade-price data footprint and freshness
- FLOW-009 — Build a two-sided trade and read the balance
- REQ-067 / FLOW-010 (dependency, owned by `feature-portal`) — the balancer registers as a portal destination; the portal provides the nav + mode switch

## Reuse (before creating)

- Scan resolver `apps/frontend/src/lib/scan/resolveScanCandidates.ts` (REQ-036) + scanned-printing provenance (DEC-070) for scan input and the printing default.
- Manual card search `apps/frontend/src/lib/search.ts` (DEC-012, REQ-002/003) for name lookup.
- `feature-portal` destination registry + Trade Balancer mount slot (DEC-095, REQ-067) — register here instead of building nav chrome.
- Data pipeline (`scripts/`, `data:build`/`data:refresh`) and the committed-static-artifact + human-approved-download posture (DEC-012, DEC-054) for the price artifact.

## Open questions

None blocking. Build-time details (exact source bulk, filter/field set, artifact filename) are outcome-validated (DEC-071 precedent), not product open questions.
