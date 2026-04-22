# Definition of Done - Context Story Trio

## Applies To
- STORY-001 context contract and builder
- STORY-002 context normalization and guardrails
- STORY-003 context evaluation harness

## Tiny Shared DoD
- code is merged with passing backend test suite (`npm run test` in `apps/backend`)
- request/response contract for `POST /api/ask-ai` is unchanged
- stack ordering semantics remain unchanged end-to-end (`stack[0]` bottom, last item top)
- fallback question behavior remains `Resolve the stack` for blank trimmed input
- each story includes focused unit tests for its own logic
- no Bedrock SDK usage or provider-specific code is introduced yet

## Story-Specific Completion Checks
- STORY-001: one canonical context builder exists and route handlers no longer assemble context inline
- STORY-002: normalization and guardrail rules are deterministic and covered by tests
- STORY-003: fixture/golden-case harness catches ordering/guardrail regressions
