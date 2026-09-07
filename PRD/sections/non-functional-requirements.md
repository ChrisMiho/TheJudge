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
  - cold-start model readiness — wall-clock time from backend process start to the first System 3 query embedding returning, with the model read from the packaged on-disk cache and no network call — is measured and recorded, and stays a small enough share of the 3-second answer target that a cold request still meets it
- Notes:
  - **Product risk:** game-rules prompt enrichment (DEC-030, REQ-022) materially increases prompt size (~25–32k chars typical/worst case when all 23 curated topics shipped). This was an active risk to the 3-second AI latency target, not a temporary scope tradeoff.
  - **Mitigation (shipped):** context-driven System 2 topic selection (DEC-045) plus System 3 relevance scoring (DEC-046) shipped 2026-06-18, reducing baseline prompt size for phase-irrelevant requests (confirmed via golden line-count deltas: zero-cards −90 lines, simple-interaction −69, full-context −36). Live p50/p95 latency re-sampling under real traffic is still pending — open follow-up, not blocking ship. `MAX_PROMPT_CHAR_BUDGET` remains at `EFFECTIVELY_UNLIMITED_CHARS` (DEC-042); revisit cap values after latency/cost sampling.
  - **Cold start with the bundled embedding model (REQ-181), measured 2026-09-05** on a local Darwin arm64 checkout with a warmed on-disk cache, one run: importing `@huggingface/transformers` 120.3 ms, building the quantised feature-extraction pipeline 57.4 ms, first query embedding 3.6 ms — cold-start model readiness 181.2 ms — plus 3.7 ms to parse the 5.65 MB rule-embeddings artifact (1.442 MB after REQ-183's int8 re-encoding — this figure predates that change) and 3.6 ms for the 2.04 MB rule index. Steady-state query embedding averaged 1.05 ms over 20 runs. So the semantic path adds roughly 185 ms to a cold process and about 1 ms per answer thereafter. AWS Lambda x86 with a cold filesystem is slower than this machine: the deployed figure is read from the function's own cold-start log line, and this local measurement bounds it rather than replacing it.

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
  - **Canonical rule — one main product-facing endpoint.** The core product
    exposes exactly one main product-facing backend endpoint (the answer
    endpoint `POST /api/ask-ai`), plus the single read-only card-detail
    retrieval route (`GET /api/cards/:oracleId`, REQ-175). Adding any further
    product-facing endpoint requires amending this constraint. This is the
    single authoritative statement of the one-endpoint rule; the homes below
    echo it and must be updated together (enumerate by grep before amending —
    see `instructions/writing-rules.md`, grep-before-amend):
    REQ-012, REQ-072, REQ-094, REQ-175, `goals-and-non-goals.md`, `overview.md`,
    `instructions/technical-design-rules.md`, `quick-lookup/README.md`,
    `in-depth/README.md`, `integrations-and-data.md`, `PRD/README.md`.
    Retired index row: DEC-010.
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

### NFR-016
- Title: Always-on hook enforcement stays invisible to ordinary sessions
- Description: The `PreToolUse` hook is committed to `.claude/settings.json` and therefore fires on every tool call in every session in this repository, not only during graph runs. It must cost ordinary work nothing measurable and must never deny a legitimate call.
- Constraints:
  - the hook adds no perceptible latency to a tool call — it is a local file-and-string check with no network, no repository scan, and no dependency install
  - a false deny in an ordinary session is a defect, not a tuning issue: the graph tier is inert without `.worktrees/.graph-run.lock`, and skill authoring, `CLAUDE.md` edits, and settings edits must all succeed with no lock present
  - a hook that cannot be proven to be firing is detected and refused, not worked around: a crashed, timed-out, or untrusted hook is caught by REQ-159's canary at run start and its per-node heartbeat, and the run ends at `BLOCKED` rather than advancing. `.claude/graph-profile.json` is not the fallback — the contract already directs treating an unverified profile as absent, and the profile binds only under the launch flag this decision removes reliance on
  - outside a graph run the same failure is a plain loss of enforcement, and the ordinary session is told rather than left to assume: a hook that errors reports it, and silence is never read as approval
  - the deny rules match path and command literals; a path assembled at runtime evades them, and that limit is stated in the contract rather than assumed away
  - the hook's own file and `.claude/settings.json` are in the protected set, so no run can weaken its own enforcement
  - project-level hooks require workspace trust; the first run in an untrusted checkout must surface that as a named condition rather than as a silent no-op
- Dependencies:
  - REQ-152
  - REQ-153
  - REQ-159
  - DEC-166
- Notes:
  - the failure mode that matters most is the quiet one — a hook that is present, trusted, and not actually firing reads exactly like a hook that is working

### NFR-017
- Title: Deploy artifact stays within the S3-path package quota
- Description: With the deploy on the S3-staged path (DEC-169/REQ-165), the binding limit becomes AWS's 250 MB unzipped deployment-package quota. A committed data artifact that would push the package past a deployable size must be caught before merge, not after a failed deploy on `main`.
- Constraints:
  - `scripts/lambda-package-budget.test.mjs` measures the unzipped on-disk package footprint (code + production `node_modules` + committed `apps/backend/data`) against the 250 MB quota, with a reserve, and fails when the tracked data would exceed the budget
  - the non-data reserve is sized from a measurement of the real packaged code and production dependencies, not left at a figure the package has outgrown. When a bundled embedding model ships (REQ-181) it lands in production dependencies, inside this reserve, so the reserve is re-measured in that same change and the test's failure message names the model as a contributor. The guardrail is re-based, never loosened to make a red test green — measured on 2026-09-05 (post-REQ-181), committed data was 118.1 MB against a 120 MB data budget (1.9 MB headroom), so the constrained side is the reserve, not the data budget. REQ-183 then re-encoded the rule-embedding vectors in a compact number format and the resulting figure is re-recorded here in that same change. Before REQ-181's model reserve was re-based, committed data was 111.9 MB against a 230 MB data budget (118 MB headroom) — see the Notes below for the full before/after
  - the base64/request-limit basis (`LAMBDA_REQUEST_LIMIT`, `BASE64_EXPANSION`, `ZIP_CEILING`) is removed with the direct-upload path it described; the test no longer models the ~50 MB direct-upload ceiling
  - the test runs in `test:scripts` / `quality:check` so an over-quota artifact fails on the pull request, not after the merge
  - the full combo corpus is the standing state (`MIN_VARIANT_POPULARITY` = 0, REQ-093); the failure message names the largest data contributors and points at the levers (reduce committed data, or as an emergency size valve raise `MIN_VARIANT_POPULARITY` to re-trim), consistent with the current test's guidance
- Dependencies:
  - DEC-169
  - REQ-165
  - REQ-093
  - REQ-181 (the bundled embedding model and committed rule-embeddings artifact this budget must accommodate)
  - REQ-183 (the compact vector encoding that relieved this budget)
- Notes:
  - the guardrail is repointed, never removed — a disarmed budget check is how the 2026-08-22 two-day deploy outage went unseen; the new basis simply matches the new real limit
  - the budget is measured against the full corpus (no popularity floor), so the headroom the test reports is the real headroom, not headroom over a trimmed baseline
  - re-measured 2026-09-05 for REQ-181: `onnxruntime-node` bundles all three platforms' native binaries directly in its published package (not npm `optionalDependencies`), so every install pulls ~283MB before pruning; `scripts/package-lambda.sh` prunes the two platforms the Lambda runtime (linux/x64) never loads before zipping. The re-measured real non-data footprint (pruned production `node_modules` + the warmed local-model cache, ~130 MB) raised the reserve from 20 MB to 130 MB, shrinking the data budget from 230 MB to 120 MB against the then-current ~117 MB tracked data
  - re-measured again 2026-09-05 once REQ-180's committed keyword data actually landed (`cardDetailByOracleId.json` rebuilt with real per-card Scryfall keywords) and the committed rule-embeddings artifact gained its `ruleIndexHash` field (REQ-181/E12): tracked data is now 118.1 MB against the 120 MB budget — 1.9 MB headroom, materially less than before. This is a real, measured constraint, not a comfortable margin; the next data-artifact growth must re-check it before merging
  - the 1.9 MB squeeze was relieved by re-encoding the rule-embedding vectors (REQ-183), not by trimming the combo corpus and not by moving the model to S3. Measured 2026-09-05: the vectors were `float32-base64` at 5.650 MB of the 118.095 MB tracked total, and an int8 encoding lands at about 1.442 MB, taking headroom from 1.905 MB to about 6.113 MB. The S3 alternative frees the 22.59 MB warmed model cache, which is gitignored and sits inside the 130 MB non-data reserve — so it relieves the unconstrained side of the split, not the data budget, and it adds a runtime external dependency at every cold start. Trimming `MIN_VARIANT_POPULARITY` stays the emergency valve it already is, because it removes combos players see in answers (REQ-093)
  - re-measured at build, 2026-09-05, after REQ-183 shipped: the committed rule-embeddings artifact is 1.442 MB (`int8-base64`, scale computed from the corpus's own largest component — a fixed scale assuming the theoretical ±1 unit-vector bound measurably regressed benchmark recall@5 and was not shipped). Tracked `apps/backend/data` is now 113.887 MB against the 120 MB budget — 6.113 MB headroom, matching the measured prediction exactly. `node --test scripts/lambda-package-budget.test.mjs` passes with the new artifact
  - the 130 MB non-data reserve was measured on macOS; on the linux/x64 CI runner, `onnxruntime-node`'s postinstall downloaded the CUDA runtime — which the Lambda CPU runtime never loads — and AWS rejected the resulting package as over 250 MB unzipped even though the budget test had passed. Fixed on `main` in PR #194: `scripts/package-lambda.sh` now sets `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` for the packaging install and measures the real unzipped package bytes with a per-entry breakdown, failing before upload when over quota. The 130 MB reserve figure itself is still to be re-measured on the CI runner, not a laptop

### NFR-018
- Title: Prompt and answer quality are validated against real worked rules solutions
- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by real-world hard rules questions that carry published worked solutions — the kind found in public rules-Q&A and judge resources — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The worked solutions are curated into a committed evaluation set and run through the existing eval harness; they are test data, never runtime retrieval. The same committed set is read a second way by the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's published worked solution — so this track now measures both halves: whether the right rule reached the prompt, and whether the answer built from it is correct.
- Constraints:
  - The worked-solutions set is committed evaluation data (fixtures) fed through the existing eval harness (REQ-032 / DEC-047); it never becomes runtime prompt context and adds no new runtime dependency or external call.
  - Specific sources and their licensing/attribution are resolved at implementation before any data is committed; only data licensed for this use is committed.
  - This is a quality/validation track that reports where the prompt fails hard cases and guides tuning; it is not a build-blocking gate unless the owner later promotes it (mirroring DEC-161's opt-in, non-gating stance on enrichment A/B). This applies unchanged to the answer half: an answer score is never asserted against a golden and never fails a build (REQ-188).
  - The retrieval half stays offline and makes no provider call. The answer half necessarily makes live provider calls, and is therefore explicitly invoked, confirmation-gated, and never scheduled or wired into any automated gate (REQ-188); the mock-first default is preserved, so a checkout with no key and no network still runs the retrieval half and the answer half's dry plan.
  - A case enters the set only with a published, citable correct answer; a hand-authored answer key is never ground truth (REQ-185).
- Dependencies:
  - REQ-032, DEC-047 (eval harness and labeled-outcome evaluation)
  - REQ-022, DEC-046 (retrieval the validation set exercises)
  - REQ-185 (the gold set this track's cases now serve as)
  - REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 (the answer-quality baseline built on that set)
- Notes:
  - Distinct from RAG/corpus retrieval: this external data validates and tunes the prompt; it is not injected into prompts. The mechanic-definition enrichment idea, which would inject a corpus into the prompt, remains deferred and is an explicit non-goal of the RAG retrieval gameplan (REQ-177 through REQ-181); see REQ-168's note for where it stands.
  - The RAG gameplan's own measurement work (REQ-177) commits an offline labelled question-to-rule benchmark. That benchmark and this worked-solutions set are complementary: the benchmark measures whether the right rule was retrieved, this set measures whether the assembled prompt resolves a hard case correctly.
  - Measured 2026-09-07 (build): the gold set grew from 6 to 18 committed cases (REQ-185) while this amendment landed. `npm run eval:worked-solutions` reports 14/18 retrieved at the System 3 top five, and the retrieval half of this track is therefore no longer fully saturated the way the original six cases were — the four misses (three tier-2 card-ruling cases and one tier-1 case) are recorded as a concrete tuning signal, never corrected to make the number look better, and never a build failure.

### NFR-019
- Title: First-load card-data payload target
- Description: With descriptive card fields fetched on demand (REQ-174), the up-front card-metadata artifact the frontend downloads on entry to MTG Assistant and Quick Lookup must be at least 40% smaller, gzipped, than the prior combined 16.4 MB artifact — a firm, testable pass/fail gate, not an estimate — and the build must record the before/after gzipped sizes as acceptance evidence.
- Constraints:
  - the build records before/after gzipped sizes and asserts the trimmed `cardMetadata.json` (up-front fields only) is at least 40% smaller (gzipped) than the prior combined artifact — a relative gate, so acceptance does not hinge on an estimated byte ceiling and stays correct as the Scryfall corpus grows; the measured slim size against the current 33,399-card corpus is ~2.2 MB gzipped (~48% reduction), so the ≥40% floor carries headroom for data-refresh drift while still failing on a first-load regression
  - this is a data-artifact target, distinct from and additive to the route-level code-splitting posture (NFR-014); it neither replaces nor weakens the existing lazy loads
  - the on-demand card-detail load is a per-card fetch from the `GET /api/cards/:oracleId` endpoint (REQ-175, FLOW-024), not an up-front download, and must not reintroduce a bulk up-front payload
- Dependencies:
  - REQ-174
  - REQ-175
  - NFR-014
  - FLOW-024
- Notes:
  - oracle text alone was 45.4% of the prior file; moving it plus type line, mana, and sub/supertypes off the up-front list is the bulk of the reduction
  - owner-recalibrated 2026-09-04: the original 80% figure was derived from raw-byte proportions but stamped onto a gzipped gate; the removed descriptive text compresses well while the kept `cardId`/`imageUrl` barely do, so raw size drops ~87% but gzipped drops only ~48.1% (4.25 MB → 2.20 MB, measured against the live 33,399-card corpus). The relative-gate shape is kept (robust to corpus growth); only the floor moved, to ≥40%, below the measured ~48% with headroom for data-refresh drift while still failing a real first-load regression
