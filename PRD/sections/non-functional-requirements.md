# non-functional-requirements.md

### NFR-001
- Title: Mobile-first responsiveness
- Description: The UI must be designed primarily for phone use during gameplay.
- Constraints:
  - touch-friendly controls
  - simple layout
  - minimal navigation depth
  - responsive presentation adapts automatically through mobile-first CSS, fluid values, and structural media queries; users do not choose a layout profile
  - one semantic component tree serves mobile and desktop; no UA sniffing, JavaScript device-mode selection, or duplicate platform trees

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
  - focused conversation motion (DEC-118 / REQ-098) reuses the shared CSS vocabulary, animates only newly entering content, preserves a scrolled-up reader's position, and becomes effectively immediate under reduced motion
- Dependencies:
  - DEC-079
  - DEC-031
  - DEC-041
  - NFR-001
  - NFR-002
  - DEC-118
  - REQ-098

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
- Title: Lightweight theme personalization and automatic responsive presentation
- Description: Color-profile personalization and automatic responsive presentation must preserve mobile usability, readable contrast for the curated profiles, and the lightweight frontend architecture without asking users to configure device spacing.
- Constraints:
  - palette selection must not add backend services, product-facing endpoints, account systems, or server-side storage
  - palette application uses lightweight CSS/token plumbing and basic React state; responsive presentation uses CSS rather than a stored React/JavaScript viewport mode
  - no layout-density/device-profile control, layout persistence, UA sniffing, or separate mobile/desktop component trees
  - themed and automatically responsive controls must remain readable and touch-friendly across supported viewports
  - palette persistence must degrade gracefully when browser storage is unavailable; the retired density key is ignored and never required for app load
  - re-themed surfaces and semantic states (DEC-068 / REQ-046) must keep readable contrast across all six curated DEC-119/REQ-099 profiles; each fixed profile's `accent-contrast` must clear at least 4.5:1 against both `accent` and `accent-strong`, and consumers must reuse the existing accent tokens rather than adding token roles or duplicated color constants
  - arbitrary custom Colorless RGB is deliberately exempt from the curated-profile contrast guarantee: it is applied unchanged with no warning, validation, rejection, or correction; the fixed Colorless gray profile remains inside the quality gate
  - restrained ambient accents (DEC-081 / REQ-060) apply only to REQ-060's closed minimum surface inventory, including DEC-118's context trigger/sheet/drawer and shared composer/workspace replacement surfaces, and must define resting, enhanced hover/focus, and selected/current intensity once through shared semantic styling
  - card-identity rings remain independent from the selected palette, and scanner convergence/lock/confirmation motion remains unchanged
  - fluid responsive rules must not shrink body/supporting text below existing `text-sm` / `text-xs` or applicable primary controls below 44px touch targets
  - the adaptive context surface is a bottom sheet below `768px` and right-side drawer at `768px+`; both preserve keyboard/focus accessibility and do not require a different component tree
- Dependencies:
  - DEC-066
  - DEC-068
  - DEC-081
  - DEC-119
  - DEC-117
  - DEC-118
  - REQ-044
  - REQ-046
  - REQ-060
  - REQ-099
  - REQ-096
  - REQ-097
  - REQ-098
  - NFR-001
  - NFR-004
  - NFR-006
  - NFR-005
- Notes:
  - palette personalization should add delight without slowing the live-table interaction loop; viewport-appropriate spacing is automatic product behavior, not personalization
  - the fixed White/Blue/Black/Red/Green/Colorless profiles are polished product UI; only user-supplied Colorless RGB is permitted to produce poor contrast

### NFR-012
- Title: Test-suite hygiene and CI efficiency
- Description: The Vitest test suite (~1500 cases across ~170 source test files, of which ~1227 cases / 124 files are frontend) and its CI gate should stay fast to run and easy to navigate as they grow, without weakening any coverage or regression protection. The frontend file count rose 115 → 124 under DEC-155's assertion-preserving splits; the case count is unchanged.
- Constraints:
  - every test executes exactly once per CI run across all jobs: coverage-mode execution is the single canonical regression + coverage gate, and the redundant standalone `test` step stays out of the aggregate (DEC-086, wording generalized by DEC-155 so sharding — where a job runs one shard rather than the whole suite — satisfies rather than violates the no-duplicate-execution rule)
  - `npm run quality:check` remains the single canonical local pre-PR command and gains no CI-only fast mode; CI may decompose its sub-checks into concurrent jobs, but the developer-facing command is unchanged (DEC-155)
  - CI parallelism is the sanctioned lever for wall time: static checks, backend coverage, and sharded frontend coverage run as concurrent jobs, and sharded coverage is merged before thresholds are evaluated so thresholds apply once to merged totals (DEC-155)
  - coverage runs on every CI run, not only on `main`; wall time is reduced by parallelism and by removing fixed overhead, never by narrowing when the coverage gate applies (DEC-155)
  - the jsdom test environment is scoped per-file to the tests that need a DOM; blanket directory- or file-extension rules are prohibited because DOM-dependent tests exist under otherwise DOM-free paths (DEC-155)
  - the CI gate is not duplicated: `Deploy AWS` depends on the gate jobs rather than re-running `quality:check`, and PR runs cancel superseded in-progress runs while the `main` deploy path is never cancelled mid-flight (DEC-155)
  - when CI runs `quality:check`'s sub-scripts individually, an automated guard must assert the CI job set covers every sub-script in the aggregate, so the canonical local command and the CI decomposition cannot drift apart (DEC-155)
  - `npm test` and `npm run test:coverage` remain available for fast local iteration; workspace- and file-level targeting during development is preserved
  - no coverage threshold is lowered — frontend `lines: 45`; backend `lines: 45` plus `src/prompt/** lines: 60` and `src/validation/** lines: 60` stay at or above current values
  - the eval golden regression gate (`test:eval`, NFR-009) is unchanged; no prompt/eval golden update is bypassed to hit a timing target
  - no test is deleted purely to reduce runtime, and no product behavior changes as part of hygiene work
  - test-file reorganization (splitting oversized files, extracting shared fixtures/setup, grouping related suites) preserves existing assertions and case count — it is a test refactor only
- Dependencies:
  - NFR-005
  - NFR-009
  - DEC-086
  - DEC-155
- Notes:
  - DEC-086's deferral of workspace parallelism and vitest sharding is discharged by DEC-155, which supplies the CI-runner-core data it waited on (the public-repo `ubuntu-latest` runner is 4-vCPU)
  - shard-count scaling rule, measured on run `31134177316`: gate wall ≈ `45s + (1.32 × T) / N`, where `T` is total frontend test seconds and `N` is the shard count. The 45s constant is fixed overhead sharding cannot cross (~17s shard setup + 23s `coverage-merge` + scheduling), of which ~34s is `checkout + setup-node + npm ci` paid twice. The practical trigger is `N ≥ frontend_cases / 440`: 3 shards hold to ~1330 cases, 4 to ~1770, 5 to ~2650. At the measured 1227 cases / 183s the gate is 1m58s against a 2m00s target — roughly 100 additional frontend cases exhaust 3 shards, so the next growth increment needs a 4th
  - raising the shard count is a one-line matrix change and cannot affect correctness, because `coverage-merge` applies thresholds once to merged blobs regardless of `N`; sharding is the correct lever only while test execution dominates the 45s floor. Past roughly 6 shards the sanctioned next lever is running only affected tests (scales with change size, not suite size), not an unbounded shard count
  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 6 this workflow uses. Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2 — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
  - measured cost drivers are fixed overhead rather than case count: v8 coverage instrumentation adds ~86% test CPU (4.6x on tight numeric loops such as `src/lib/scan/**`), and a global jsdom environment charges every frontend test file ~0.47s CPU
  - splitting an oversized test file remains an assertion- and case-count-preserving refactor; under DEC-155 it also lowers the slowest-shard floor, since a single long file bounds how much sharding can help

### NFR-013
- Title: Trade-price data footprint and freshness
- Description: The printing-level price artifact (REQ-066) must not cost users who never open the Trade Balancer, and its static-snapshot nature must be honest and clearly bounded.
- Constraints:
  - the price artifact is lazy-loaded only when the Trade Balancer is first opened; app startup and the MTG Assistant flow are unaffected for users who never open it (mirrors the NFR-010 scan-artifact posture)
  - prices are a static build-time snapshot: no runtime price fetch, no runtime sync, and no automated/scheduled refresh; the committed snapshot is refreshed only through the human-approved data pipeline (`data:refresh` then `data:build`)
  - the artifact records a snapshot date, and the UI may surface it so users understand prices are point-in-time, not live
  - artifact size, lazy-load time, and lookup latency should stay within a mobile-friendly budget; loading and pricing must not block or jank the trade UI
  - USD-only price fields (`usd`, `usd_foil`); no live market integration
- Dependencies:
  - DEC-087
  - DEC-088
  - REQ-066
  - NFR-001
  - NFR-004
  - NFR-010
- Notes:
  - the trade balancer is an optional top-level feature; like scanning, its data budget is scoped to users who actually use it

### NFR-014
- Title: Route-level code splitting and initial-payload posture
- Description: With destinations addressable as routes (DEC-157 / REQ-140), the frontend's initial payload must scale with what a user actually opens rather than with the size of the whole suite, and must keep doing so as destinations are added.
- Constraints:
  - each registered destination is behind a `React.lazy` boundary, so a visitor who opens one destination does not download the code of destinations they never open
  - code shared by more than one destination is grouped into an explicit `manualChunks` chunk rather than duplicated per destination chunk or hoisted into the common entry chunk
  - `manualChunks` uses the **function form** (`(id) => ...`). The object form maps a chunk name to explicit module ids and does not accept path patterns, so a directory glob written there fails the build
  - the scan surface is the known shared case, and it is **larger than `src/lib/scan/**`**: `src/hooks/useScanCapture.ts` is imported by Quick Question, In-Depth, and the trade destination, and `src/components/ScanCameraSurface.tsx` by Quick Question and trade. Chunk membership is determined by measured import-graph reachability from more than one destination, not by directory name — a group scoped to `src/lib/scan/**` alone leaves the heavier shared scan UI and capture-hook layer duplicated or hoisted
  - `react`, `react-dom`, `react/jsx-runtime` (a distinct module id emitted by the automatic JSX transform), and `react-router` are grouped into a `vendor` chunk so framework code caches independently of feature code
  - adding a destination must not require touching the chunking configuration for the common case — route-level splitting follows from the registry entry, not from per-feature build config
  - this is a **code**-splitting posture only; it neither replaces nor weakens the existing data-artifact lazy loads (`cardhashes.bin` on first scan, NFR-010; `cardPrintingPrices.json` on first Trade Balancer open, NFR-013)
  - the `Suspense` fallback must not flash on every destination switch: keep-alive mounting (DEC-095, preserved by DEC-157) means a destination suspends only on first visit
  - route/lazy work must not lower any coverage threshold or delete a test to hit a timing target (NFR-012)
- Dependencies:
  - DEC-157
  - REQ-140
  - NFR-010
  - NFR-012
  - NFR-013
- Notes:
  - route boundaries additionally give the test suite natural split lines, which matters against NFR-012's measured headroom: at 1227 frontend cases the 3-shard gate runs 1m58s against a 2m00s target, and roughly 100 additional cases exhaust 3 shards. Net-new route tests that cross that line are handled by the sanctioned one-line shard-matrix bump, not by trimming tests.

### NFR-015
- Title: Collection data footprint and durability honesty
- Description: The collection manager must not cost users who never open it, and its browser-local storage must be presented honestly as non-durable relative to the user's own master file.
- Constraints:
  - the destination is lazily loaded, and the printing-price and scan artifacts it reuses stay lazy-loaded on first use — users who never open the collection pay no startup cost (mirrors the NFR-010 and NFR-013 posture)
  - the browser working copy is single-device and frontend-only; it is never presented as a guaranteed-durable store, and the export prompt states plainly that browser storage can be cleared
  - reading, writing, and re-pricing the collection must not block or jank the UI; validation on read must not throw on malformed stored data
  - a storage-quota failure must surface explicitly rather than silently dropping the user's cards
  - prices displayed are the committed static snapshot; no runtime price fetch and no runtime sync (NFR-013)
- Dependencies:
  - DEC-161
  - DEC-162
  - NFR-010
  - NFR-013
  - REQ-149
  - REQ-150
- Notes:
  - the collection is an optional top-level feature; like scanning and the trade balancer, its data budget is scoped to users who actually use it
