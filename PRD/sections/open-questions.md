# open-questions.md

### Q-001
- Question: How should the System 3 keyword vocabulary be derived and maintained long-term?
- Context: DEC-046 requires a committed static keyword vocabulary for strong oracle-keyword scoring in System 3. Initial implementation uses a manually curated list (`gameRulesKeywordVocabulary.json` or equivalent). Card metadata today does not carry Scryfall `keywords`; per-card keyword sets would require a data-pipeline change.
- Why it matters: Keyword boost is the primary mechanism for preserving retrieval quality when keyword-related topics move from System 2 to System 3. A weak or stale vocabulary degrades supplemental relevance for keyword-heavy interactions (deathtouch, trample, cascade, prowess, etc.).
- Options under consideration:
  - Manual curated list (initial approach — smallest change, fully explainable)
  - Scryfall per-card `keywords` added to the committed card-metadata pipeline and unioned at query time
  - Generated from CR keyword ability rules (702.x) during `build-game-rules.mjs`
- Recommended next step: Ship manual vocabulary in the first implementation slice; revisit after labeled-recall metrics show gaps. Do not block implementation on vocabulary derivation strategy.
