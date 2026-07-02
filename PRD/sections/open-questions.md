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

### Q-002
- Question: Should the scanner surface a progressive debug outline that intensifies as a card approaches a scan match (proximity-driven feedback), rather than a binary debug toggle?
- Context: Surfaced alongside the UI Polish & Subtle Effects idea but deliberately split out of it (DEC-079 scope excludes scan camera internals). The scanner today exposes an optional, user-toggleable debug overlay drawn read-only from detector/stabilizer signals (DEC-060), and a tuned convergence indicator (`searching → locking → locked`, DEC-057). Proximity-driven visualization touches the precision-sensitive scan stack (DEC-062/DEC-072/DEC-073).
- Why it matters: Could improve scanner legibility and "is it working" confidence, but couples a presentation idea to the matching/stabilizer signals and lock gate, which carry distinct product questions (false-positive risk, performance, whether it is debug-only or a shipped UX). It deserves its own refinement rather than riding along with decorative polish.
- Options under consideration:
  - Defer as a standalone future feature with its own refinement (recommended)
  - Fold a minimal version into the existing debug overlay (DEC-060) only
  - Promote to a shipped, always-on convergence affordance (largest scope)
- Recommended next step: Keep deferred; open a dedicated refinement if/when scanner-feedback work is prioritized. Do not add to the UI motion polish scope (REQ-059) without explicit confirmation.
