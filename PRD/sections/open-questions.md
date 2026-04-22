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
