# STORY-040 - Lightweight Search Performance Guardrails

- title: Add lightweight responsiveness guardrails (debounce and/or pre-normalized index) for autocomplete loops.
- user value: As a player, suggestions stay responsive during live gameplay typing.
- scope:
  - introduce minimal performance controls compatible with MVP1 architecture
  - keep behavior deterministic and testable, including debounce timing and emitted suggestions
  - document constraints required to preserve static metadata strategy
- acceptance criteria:
  - interaction remains consistent with existing threshold and no-match behavior
  - responsiveness improves under representative metadata size
  - implementation does not violate static metadata/no-runtime-sync constraints
- execution mode: parallel-ready
- dependencies:
  - REQ-002
  - DEC-012
  - NFR-002, NFR-004, NFR-005
- exclusions:
  - no runtime metadata synchronization tooling
  - no separate search microservice or endpoint
