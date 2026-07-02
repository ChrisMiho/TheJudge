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
  - **Product risk:** game-rules prompt enrichment (DEC-030, REQ-022) materially increases prompt size (~25–32k chars typical/worst case when all 23 curated topics shipped). This was an active risk to the 3-second AI latency target, not a temporary scope tradeoff.
  - **Mitigation (shipped):** context-driven System 2 topic selection (DEC-045) plus System 3 relevance scoring (DEC-046) shipped 2026-06-18, reducing baseline prompt size for phase-irrelevant requests (confirmed via golden line-count deltas: zero-cards −90 lines, simple-interaction −69, full-context −36). Live p50/p95 latency re-sampling under real traffic is still pending — open follow-up, not blocking ship. `MAX_PROMPT_CHAR_BUDGET` remains at `EFFECTIVELY_UNLIMITED_CHARS` (DEC-042); revisit cap values after latency/cost sampling.

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
- Title: Lightweight, performant UI motion
- Description: UI motion may be expressive and decorative app-wide (DEC-079), but must stay lightweight, performant, and accessible. Decorative micro-transitions, easing, entrance/exit transitions, and state-change cues are permitted across the full staged flow and answered/conversation view; motion must not become a heavyweight dependency-driven system or regress the live-table loop.
- Constraints:
  - decorative CSS motion (transitions and keyframe animations) is permitted across the full staged flow and answered view (DEC-079); it is no longer limited to functional loading/wait states
  - implementation stays CSS-based — no animation library or animation-framework migration without a separate confirmed decision
  - motion must honor `prefers-reduced-motion` (reduced or disabled decorative motion); no decorative motion is required to complete any flow
  - motion must be mobile-performance-safe (prefer transform/opacity, avoid layout thrash and main-thread jank) and must not regress NFR-001 (mobile-first) or NFR-002 (fast interaction loop)
  - scan camera surface convergence/lock/thumbs-up motion is excluded and stays as tuned (DEC-057, DEC-062, DEC-072, DEC-073)
  - existing functional wait-state motion (DEC-031, DEC-041) is unchanged
- Dependencies:
  - DEC-079
  - DEC-031
  - DEC-041
  - NFR-001
  - NFR-002

### NFR-007
- Title: Failure resilience
- Description: Errors should not destroy the user’s in-progress work.
- Constraints:
  - preserve game context, selected zones, cards, and enrichment on failure
  - preserve question on failure
  - preserve previous successful response until replaced

### NFR-008
- Title: Extensibility for future scanning support
- Description: The codebase should leave room for card scanning without requiring the core product loop to implement it.
- Constraints:
  - no scanning implementation inside the core product loop
  - card metadata organization should remain reusable
- Notes:
  - the "future scanning" intent is now realized as a scoped, optional, frontend-only feature outside the core loop (DEC-050); its performance budgets live in NFR-010

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
  - artifact shapes documented in `sections/integrations-and-data.md` § Delivery Strategy

### NFR-010
- Title: Card scanning performance and footprint
- Description: Optional card scanning must stay fast and lightweight on mobile and must not cost users who never scan.
- Constraints:
  - the fingerprint library and bridge artifacts are lazy-loaded only on first scan; app startup is unaffected for non-scanning users
  - identification should feel near-instant on a mid-range mobile device (target a fraction of a second per identify)
  - `cardhashes.bin` size, lazy-load time, memory use, and match latency are measured on a representative device and recorded as acceptance evidence
  - continuous auto-scan degrades gracefully (throttle / drop frames) rather than freezing the UI on slower devices
- Dependencies:
  - DEC-050
  - DEC-051
  - REQ-035
  - REQ-037
  - REQ-038
- Notes:
  - relates to NFR-001 (mobile-first) and NFR-002 (fast interaction loop); scanning is an optional input and does not change core-loop latency metrics

### NFR-011
- Title: Lightweight theme personalization
- Description: Theme and layout-density customization must preserve mobile usability, readable contrast, and the lightweight frontend architecture while adding browser-local personalization.
- Constraints:
  - theme and density selection must not add backend services, product-facing endpoints, account systems, or server-side storage
  - palette and density application should use lightweight CSS/token plumbing and basic React state only; no animation-heavy theme or density transitions or theming framework migration
  - themed and density-adjusted controls must remain readable and touch-friendly on mobile viewports
  - palette and density persistence must degrade gracefully when browser storage is unavailable
  - re-themed surfaces and semantic states (DEC-068 / REQ-046) must keep readable contrast across every palette, explicitly including amber and rose, and must reuse the existing accent tokens rather than adding token roles or duplicated color constants
  - restrained ambient accents (DEC-081 / REQ-060) apply only to REQ-060's closed minimum surface inventory and must define resting, enhanced hover/focus, and selected/current intensity once through shared semantic styling; hover must not be the sole carrier of state or meaning
  - card-identity rings remain independent from the selected palette, and scanner convergence/lock/confirmation motion remains unchanged
  - slim density must not shrink body text below existing `text-sm` / `text-xs` or primary control touch targets below `min-h-[2.75rem]` (DEC-075)
- Dependencies:
  - DEC-066
  - DEC-068
  - DEC-075
  - DEC-081
  - REQ-044
  - REQ-046
  - REQ-055
  - REQ-060
  - NFR-001
  - NFR-004
  - NFR-006
  - NFR-005
- Notes:
  - personalization should add delight without slowing the live-table interaction loop
