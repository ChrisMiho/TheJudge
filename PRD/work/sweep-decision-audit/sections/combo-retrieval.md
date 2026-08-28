# Sweep finding — combo-retrieval
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/combo-retrieval.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 3

## DEC-116 — partial
Gating (complete-only in game mode without intent, partial+missing-piece callouts with explicit intent, lookup requires both intent and an attached card, 5-variant cap, no "complete" label, community-sourced attribution) is in `in-depth/README.md`'s "Combo enrichment" section and `quick-lookup/README.md`'s "Combo enrichment" section; missing is the build-time template-ingredient resolution behavior (templates expanded from upstream mappings or Scryfall, unresolved templates stay usable for explicit-question retrieval but can't satisfy automatic completion) — not stated in either spec.

## DEC-161 — absorbed
The opt-in, confirmation-gated, human-reviewed A/B against the live provider — never a golden, never in `quality:check`, never a build gate — is stated near-verbatim in `in-depth/README.md`'s "Combo enrichment (machinery consumed)" section, citing DEC-161 directly.

## DEC-162 — partial
The product-facing consequences (bulk export as source, upstream renders camelCase not snake_case, the paginated REST walk removed, "complete" forbidden as user-facing text) are captured in `in-depth/README.md`'s "Rejected alternatives" entry citing DEC-162; missing is the corpus-build/artifact-format substance — gzip-per-variant sizing tradeoff (76.9 MB detail + 4.8 MB index), the `data:refresh` chain constituting REQ-093's human approval, and the real-upstream-bytes fixture-verification approach — none of which appear in any of the 7 specs (both in-depth and quick-lookup explicitly delegate corpus-build internals to `system-map.md`, which is outside the scored set).
