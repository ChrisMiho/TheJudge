# open-questions.md

### Q-001
- Question: Should stack details rows render only the card name if both thumbnail availability and thumbnail load fail?
- Context: Thumbnails should be shown when available, but the UI must not depend on them.
- Why it matters: This affects the simplest possible fallback rendering path.
- Options under consideration:
  - always render name-only fallback
  - render name plus reserved thumbnail space
- Recommended next step: Default to name-only fallback if the image is unavailable or fails to load.

### Q-002
- Question: Should the Phase A mock response pretty-print the JSON payload with indentation or return it minified?
- Context: The mock response should help debug request shape for the eventual LLM prompt.
- Why it matters: Readability affects debugging usefulness.
- Options under consideration:
  - pretty-printed JSON string
  - minified JSON string
- Recommended next step: Use pretty-printed JSON string for MVP1 debugging.

### Q-003
- Question: Should the empty-state cat image be a static asset bundled with the frontend or a remote image?
- Context: The UI calls for a cat wearing a wizard hat in the empty state.
- Why it matters: This affects frontend asset handling and offline behavior.
- Options under consideration:
  - static bundled asset
  - remote URL
- Recommended next step: Use a static bundled asset for simplicity.

### Q-004
- Question: Should Comprehensive Rules retrieval be accepted as a separate prompt-enrichment path from the planned WotC Oracle rulings feature?
- Context: `PRD/work/card-wotc-rule-enrichment/` specifies card-specific WotC Oracle rulings from Scryfall, keyed by submitted `cardId` / `oracle_id`. The current experimental branch instead parses the official Comprehensive Rules TXT and retrieves relevant rule-number excerpts by keyword/rule-id scoring.
- Why it matters: These are complementary but distinct grounding sources. Treating the Comprehensive Rules work as the WotC rulings feature would miss the owner's intended Scryfall rulings pipeline and prompt format.
- Options under consideration:
  - accept Comprehensive Rules retrieval as a separate experimental backend prompt-enrichment feature
  - defer/remove Comprehensive Rules retrieval and implement only the planned WotC Oracle rulings feature
  - support both, with separate prompt sections and explicit budget caps
- Recommended next step: Ask the product owner whether Comprehensive Rules retrieval should coexist with the WotC Oracle rulings plan before promoting it into `decisions.md`.
