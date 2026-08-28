# Sweep finding — trade-balancer

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/trade-balancer.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 3

## DEC-087 — absorbed
The trade balancer's full impact list — printing-level entries with foil toggle and quantity, scan/manual-search input paths, duplicates allowed (stack cap/dup-block don't apply), missing-price $0-plus-caution-triangle treatment, USD-only scope, static snapshot pricing, ephemeral no-history/no-persistence posture, and the frontend-only/contract-frozen boundary — is all present, near-verbatim, in `PRD/sections/trade-balancer/README.md`'s "How it works" and "Measured bounds" sections.

## DEC-088 — absorbed
The printing-level price artifact's product-level substance (dedicated committed artifact distinct from `cardMetadata.json`/`cardScanMap.json`, static build-time snapshot, lazy-loaded only on first open, no runtime sync, refreshed only via the existing human-approved `data:refresh`/`data:build` pipeline) is stated directly in `trade-balancer/README.md`'s "Prices and freshness," "Measured bounds," and "Rejected alternatives" sections; the artifact's field-level schema and build-script mechanics are deferred to `data/cardPrintingPrices.md`, a sibling doc outside the 7 audited specs, but that doc is not needed to confirm the decision's product substance.

## DEC-089 — obsolete
DEC-089's mechanism (a top-right corner menu button kept visually distinct from a separate `ThemeControl` corner affordance, listing just MTG Assistant and Trade Balancer, with state preserved but nothing persisted across reload) has been fully superseded by the shipped navigation chrome in `PRD/sections/shared-chrome/README.md`: the nav is now a top-left corner rail (DEC-122) with palette folded into the tray's own Theme section (DEC-110, so no separate `ThemeControl` exists to stay distinct from), four destinations rather than two (Quick Question, In-Depth Question, Life Tracker, Trade Balancer — DEC-095/DEC-157), and the active destination *does* persist across reload via `sessionStorage` (DEC-111/DEC-157) — the opposite of DEC-089's "nothing persisted across reload" impact. Neither `shared-chrome/README.md` nor `trade-balancer/README.md` cites DEC-089 in its Backed-by list; the current spec's own "Rejected alternatives" section documents the supersession chain (DEC-121→DEC-122→DEC-133→DEC-137→DEC-150→DEC-157) that replaced it. Only the vaguest intent (a top-level way to reach Trade Balancer) survives, carried forward by DEC-095/DEC-157, not by DEC-089 itself.
