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
- Notes:
  - **Product risk:** game-rules prompt enrichment (DEC-030, REQ-022) materially increases prompt size (~25–32k chars typical/worst case). This is an active risk to the 3-second AI latency target, not a temporary scope tradeoff. Monitor after ship; context-driven topic selection is the primary mitigation path if the risk materializes.

### NFR-003
- Title: Secure backend-only model access
- Description: AI provider credentials must never be exposed in the client.
- Constraints:
  - frontend must not call AI providers directly
  - backend owns model invocation

### NFR-004
- Title: Lightweight architecture
- Description: The core product should use the smallest reasonable architecture.
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
- Description: UI motion must stay lightweight in the core product.
- Constraints:
  - basic show/hide or simple transitions only
  - no animation-heavy polish work
  - CSS keyframe animations are permitted for functional loading and wait states (not decorative polish)

### NFR-007
- Title: Failure resilience
- Description: Errors should not destroy the user’s in-progress work.
- Constraints:
  - preserve game context, selected zones, cards, and enrichment on failure
  - preserve question on failure
  - preserve previous successful response until replaced

### NFR-008
- Title: Extensibility for future scanning support
- Description: The codebase should leave room for future card scanning without requiring the core product to implement it.
- Constraints:
  - no scanning implementation in the core product
  - card metadata organization should remain reusable

### NFR-009
- Title: Local prompt preview developer workflow
- Description: Developers must be able to materialize production-path prompts and API outcomes from representative fixtures without starting the frontend or calling live AI providers.
- Constraints:
  - root command `npm run prompt:preview` spawns backend in mock mode, POSTs fixtures through `POST /api/ask-ai`, writes gitignored artifacts, then shuts down
  - default run uses curated success fixtures: `full-context`, `cascade-keyword`, `state-based-actions`, `near-cap-stack`
  - `--all-fixtures` runs every eval fixture including expected error-path cases (e.g. `zero-cards`)
  - each fixture writes its own output directory under `output/prompt-preview/<fixture-id>/` with separate labeled files — no bundled multi-scenario response file
  - success fixtures write `request.json`, `meta.json`, `production.prompt.txt`, `context.json`, `diagnostics.json`, `enrichment.json`
  - error fixtures write `request.json`, `meta.json`, `api-error.json` (exact `askAiErrorSchema` body), and `response-headers.json`
  - multi-fixture runs continue through all fixtures and summarize outcomes in `manifest.json`
  - process exits non-zero only on orchestrator failure or fixture `failed` result (missing sidecars, parse error, network error) — captured `api_error` outcomes are not command failures
  - generated output is gitignored and not committed
  - eval golden CI (`test:eval`) remains the automated regression gate; prompt preview is for human review
- Dependencies:
  - DEC-033
  - DEC-010
  - DEC-020
- Notes:
  - enrichment debug collection runs only when `ASK_AI_PROVIDER=mock`
  - see `PRD/work/prompt-preview-command/DESIGN-BRIEF.md` for artifact shapes
