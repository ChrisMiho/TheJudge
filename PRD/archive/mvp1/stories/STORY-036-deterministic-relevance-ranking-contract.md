# STORY-036 - Deterministic Relevance Ranking Contract

- title: Add deterministic suggestion ranking so both flows return the same ordered results for the same query.
- user value: As a player, the most likely match appears first consistently.
- scope:
  - define rank order for suggestions: exact match > prefix match > substring match > typo-distance tie-break
  - implement deterministic tie-break behavior independent of metadata source order
  - add targeted unit test coverage for ranking and tie-break scenarios
- acceptance criteria:
  - equal queries against the same card set yield stable ordered top-3 results
  - typo tolerance remains available after ranking changes
  - no-match and threshold behavior remain unchanged
- execution mode: parallel-ready
- dependencies:
  - REQ-002
  - DEC-012
  - NFR-002, NFR-005
- exclusions:
  - no external search service introduction
  - no fuzzy-search engine replacement beyond current MVP complexity
