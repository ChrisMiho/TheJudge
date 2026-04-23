# STORY-039 - Cross-Flow Parity Regression Suite

- title: Add parity tests asserting same-query equivalence between stack and battlefield suggestion behavior.
- user value: As a team, we can prevent drift between the two search experiences.
- scope:
  - add regression scenarios for ordered results, threshold, no-match copy, and selection behavior parity
  - encode cross-flow parity assertions in frontend test coverage
  - ensure tests fail on future divergence between stack and battlefield suggestion paths
- acceptance criteria:
  - same query in both contexts produces the same ordered suggestions
  - threshold and no-match behavior are parity-checked
  - CI catches regressions when one path drifts from the other
- execution mode: parallel-ready
- dependencies:
  - REQ-002
  - DEC-012
  - NFR-005
- exclusions:
  - no backend contract changes
  - no production logic changes beyond tests
