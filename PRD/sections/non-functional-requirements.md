# non-functional-requirements.md

### NFR-001
- Title: Mobile-first responsiveness
- Description: The UI must be designed primarily for phone use during gameplay.
- Constraints:
  - touch-friendly controls
  - simple layout
  - minimal navigation depth

### NFR-002
- Title: Fast interaction loop
- Description: Core actions should feel immediate enough for live table use.
- Constraints:
  - card add flow under 5 seconds
  - Decrypt Stack flow under 20 seconds
  - normal AI latency target under 3 seconds

### NFR-003
- Title: Secure backend-only model access
- Description: Bedrock credentials must never be exposed in the client.
- Constraints:
  - frontend must not call Bedrock directly
  - backend owns model invocation

### NFR-004
- Title: Lightweight architecture
- Description: MVP1 should use the smallest reasonable architecture.
- Constraints:
  - one main product-facing backend endpoint
  - no microservices
  - no runtime metadata sync tooling

### NFR-005
- Title: Maintainable TypeScript codebase
- Description: Frontend and backend should be maintainable and easy to extend.
- Constraints:
  - separate routes, validation, services, and types
  - preserve stack-ordering logic consistently

### NFR-006
- Title: Minimal animation complexity
- Description: UI motion must stay lightweight in MVP1.
- Constraints:
  - basic show/hide or simple transitions only
  - no animation-heavy polish work

### NFR-007
- Title: Failure resilience
- Description: Errors should not destroy the user’s in-progress work.
- Constraints:
  - preserve stack on failure
  - preserve question on failure
  - preserve previous successful response until replaced

### NFR-008
- Title: Extensibility for future scanning support
- Description: The codebase should leave room for future card scanning without requiring MVP1 to implement it.
- Constraints:
  - no scanning implementation in MVP1
  - card metadata organization should remain reusable
