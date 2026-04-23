# STORY-037 - Keyboard Interaction Parity

- title: Add shared keyboard navigation behavior for autocomplete in both stack and battlefield contexts.
- user value: As a player, I can complete search quickly without leaving the keyboard.
- scope:
  - implement active-option state and key handling for `ArrowUp`, `ArrowDown`, `Enter`, and `Escape`
  - normalize focus and suggestion selection behavior across both contexts
  - add component/integration tests validating keyboard parity
- acceptance criteria:
  - both contexts support identical key-driven suggestion navigation
  - `Enter` selects the focused suggestion and `Escape` closes suggestions
  - mouse and keyboard interactions both preserve existing preview/add semantics
- execution mode: parallel-ready
- dependencies:
  - REQ-001, REQ-002
  - FLOW-001
  - NFR-001, NFR-002, NFR-005
- exclusions:
  - no major visual redesign
  - no animation-heavy behavior changes
