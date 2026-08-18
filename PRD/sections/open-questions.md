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

### Q-003
- Question: Should Quick Lookup later accept optional lightweight game context (e.g. a few surrounding cards or a phase hint) on its `card` field in `mode: "lookup"`?
- Context: v1 Quick Lookup's card branch is deliberately single-card with no `gameContext` (DEC-107), which keeps the payload small and the non-goal clean. The user has expressed future interest in adding a small amount of surrounding game context to a card lookup. The DEC-106 `mode`-discriminated union was chosen specifically so this can be added to the `card` field additively — no new endpoint and no break to existing clients.
- Why it matters: Adding context changes what enrichment runs (some game-state-only sections become applicable again) and risks re-importing the game-flow complexity the lookup entry was meant to avoid. It deserves its own refinement rather than riding along with v1.
- Options under consideration:
  - Keep the card branch strictly single-card in v1 and revisit later (recommended)
  - Add an optional lightweight context field to the card branch now (larger scope; blurs the non-goal)
- Recommended next step: Ship single-card v1; open a dedicated refinement if/when contextual card lookup is prioritized. Do not expand the `card` field's payload without explicit confirmation.
- Notes: originally raised against Card Lookup (DEC-097, superseded); carried forward unchanged in substance to Quick Lookup (DEC-107) during quick-lookup refinement.

### Q-004
- Question: Should the answer-seeded second-pass rules retrieval (re-query the rule index using the model's first answer, append missed verbatim rules to the response) be shipped as its own dedicated feature?
- Context: DEC-100 originally specified this for rules-mode as part of rules-lookup. During quick-lookup refinement, the user asked to table it rather than carry it into Quick Lookup v1, expecting it will need its own tuning pass and preferring it get a dedicated feature rather than ride along with the card/rules destination merge.
- Why it matters: The mechanism (local re-query, dedup, append to `answer`) is fully specified and low-risk, but its retrieval-quality tuning is independent of Quick Lookup's scope; bundling it back in later without a decision would silently expand Quick Lookup's prompt-assembly behavior.
- Options under consideration:
  - Open a dedicated refinement for answer-seeded second-pass retrieval when prioritized, scoped as its own feature (recommended)
  - Drop the idea permanently and rely on the first-pass question-driven retrieval only
- Recommended next step: Do not add second-pass retrieval to Quick Lookup (DEC-107) without a new confirmed decision. Open a dedicated refinement if/when prioritized.

### Q-005
- Question: Is any of the leaked `card-collection-manager` refinement preserved on `rescue/fixture-leak-card-collection-20260817` worth keeping?
- Context: On 2026-08-17 a `graph-run` fixture rep escaped its isolated clone and ran `thejudge-refinement` against the live checkout (DEC-164 context). Before the leak was reverted, it wrote a `DESIGN-BRIEF.md` and `GRAPH-RUN.md` into `PRD/work/card-collection-manager/`, flipped that package's marker to `owner-action`, and edited eight `PRD/sections` files — adding DEC-161, DEC-162, REQ-146..151, NFR-015, FLOW-019, and a new `decisions/card-collection.md`. `PRD/sections/` was restored byte-identical and the package returned to `ideation`; the leaked work is preserved unmodified on the rescue branch. It is coherent, substantial, and was never reviewed.
- Why it matters: The content is product truth for a real backlog package, so discarding it may throw away usable refinement, while adopting it would promote work produced in a contaminated environment by a test run whose own isolation had already failed. Leaving it parked indefinitely keeps six PRD IDs occupied and the question open. Neither "it is garbage" nor "it is good" has been established.
- Options under consideration:
  - Review the branch as its own scoped pass, keeping only what survives, and re-refine `card-collection-manager` normally (recommended)
  - Discard the branch and re-refine `card-collection-manager` from `ideation` under the DEC-164 rig
  - Leave parked until `card-collection-manager` is prioritized
- Recommended next step: Keep it out of the DEC-164 hardening scope — that work is about enforcement, not product content. Rule on it when `card-collection-manager` is next picked up. Regardless of outcome, new IDs resume at DEC-165 / REQ-152 / NFR-016 so the rescue branch's IDs never collide.
