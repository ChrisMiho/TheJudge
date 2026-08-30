# system-map.md

Durable feature/subsystem catalog for the product. Answers "is it real / how does it behave / where does it live?" in one read, without re-deriving behavior from code (`DEC-044`).

## How to read this

Two levels: a subsystem is a `##` heading; features are `###` sub-entries grouped beneath their subsystem. Every entry records four fields:

- **Status** — `shipped` (code exists and is wired in), `planned` (decided/docs-only, no code under `apps/` yet), or `partial` (some features shipped, others planned). `shipped` is granted only once a lightweight promotion gate is met — code exists and a cleanup receipt records it shipped — enforced at cleanup time, not asserted ahead of it (`DEC-044`).
- **Summary** — one-line behavior statement.
- **Lives in** — coarse file/module location (a directory or 1–3 key files), never per-line.
- **Backed by** — the most directly relevant `DEC`/`REQ` IDs.

A subsystem may also carry an optional fifth field:

- **Details** — pointer to a deep behavior writeup under `PRD/sections/system-map/` for subsystems that warrant a one-read explanation of how they actually work (`DEC-048`). Present only when such a file exists; absent otherwise. The detail file never changes this catalog's shallow shape — it is the depth layer beneath it. Each detail file follows a fixed template: a `Backed by:` DEC/REQ line, then **How it works**, **Data flow**, **Where it lives** (coarse modules), one **Worked example**, and **Invariants / gotchas** (`DEC-048`). Coverage is by need, not exhaustive — a subsystem gets a detail file and this pointer only once one has actually been written.

This catalog is the only place the shipped-vs-planned signal lives. It does **not** override or restate `DEC`/`REQ` `Status:` lifecycle semantics (`confirmed`/`superseded`); those track decision history and are unchanged by anything here.

## Prompt assembly

- Status: shipped
- Summary: Builds the LLM prompt from game context, zones, phase guidance, MTG rules/rulings, and conversation history, within a token budget.
- Lives in: `apps/backend/src/prompt/` (`preparation.ts`, `context.ts`, `normalization.ts`, `mtgReference.ts`, `phaseGuidance.ts`)
- Backed by: DEC-021, DEC-025, DEC-042
- Details: `system-map/prompt-assembly.md`

### Context normalization

- Status: shipped
- Summary: Normalizes incoming game context and zone data into the canonical shape the prompt builder consumes.
- Lives in: `apps/backend/src/prompt/normalization.ts`, `context.ts`
- Backed by: DEC-021, DEC-025

### MTG reference block

- Status: shipped
- Summary: Injects curated MTG reference text (rules/rulings framing) into the prompt.
- Lives in: `apps/backend/src/prompt/mtgReference.ts`
- Backed by: DEC-030, DEC-032

### Phase / combat guidance block

- Status: shipped
- Summary: Phase- and combat-step reasoning hints injected per turn phase.
- Lives in: `apps/backend/src/prompt/phaseGuidance.ts`
- Backed by: DEC-036, DEC-037, REQ-024

### Budget & enrichment diagnostics

- Status: shipped
- Summary: Enforces the prompt token budget and emits an enrichment-debug sidecar for diagnostics.
- Lives in: `apps/backend/src/prompt/enrichmentDebug.ts`, `preparation.ts`
- Backed by: DEC-025, DEC-042

### `gameStateNotes` / `ADDITIONAL GAME STATE`

- Status: shipped
- Summary: Optional freeform global game-state note rendered as an `ADDITIONAL GAME STATE` prompt section between general context and phase guidance; decided and documented, no code under `apps/` yet.
- Lives in: (planned) `apps/backend/src/prompt/` + `GameContext` request shape
- Backed by: DEC-043, REQ-031

## Game rules retrieval

- Status: shipped
- Summary: Retrieves card rulings, a card-agnostic curated game-rules baseline, and relevance-scored supplemental rules text to ground prompt reasoning; System 2 (curated) and System 3 (supplemental) are tuned and measured together.
- Lives in: `apps/backend/src/cardRulings.ts`, `gameRules.ts`, `gameRulesTopicSelection.ts`, `gameRulesRetrieval.ts`
- Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032
- Details: `system-map/game-rules-retrieval.md`

### Card rulings

- Status: shipped
- Summary: Looks up per-card rulings for cards present in the game context.
- Lives in: `apps/backend/src/cardRulings.ts`
- Backed by: DEC-029

### Curated game rules (System 2)

- Status: shipped
- Summary: Selects an always-on core plus card-agnostic, game-state-gated conditional topics (`turnPhase`, `combatStep`, populated zones) per request, replacing the prior "all topics every request" baseline.
- Lives in: `apps/backend/src/gameRulesTopicSelection.ts`, `gameRules.ts`
- Backed by: DEC-030, DEC-045, REQ-022

### Supplemental retrieval (System 3)

- Status: shipped
- Summary: Scores up to 5 supplemental rule excerpts per request with IDF weighting, question/keyword boosts, and rule-id tie-break; deduplicated against the System 2 selection.
- Lives in: `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`
- Backed by: DEC-032, DEC-046

## Provider boundary

- Status: shipped
- Summary: Selects and constructs the ask-AI provider (mock vs OpenAI) behind a shared interface.
- Lives in: `apps/backend/src/providers/`
- Backed by: DEC-011, DEC-017, DEC-020, DEC-033

### Provider factory & selection

- Status: shipped
- Summary: Factory chooses mock or OpenAI provider based on configuration/credentials.
- Lives in: `apps/backend/src/providers/createAskAiProvider.ts`
- Backed by: DEC-011, DEC-017

### Mock provider

- Status: shipped
- Summary: Deterministic mock provider for local/dev and tests.
- Lives in: `apps/backend/src/providers/mockAskAiProvider.ts`, `apps/backend/src/mockAskAi.ts`
- Backed by: DEC-011

### OpenAI provider

- Status: shipped
- Summary: OpenAI Responses-API provider implementing the shared provider interface.
- Lives in: `apps/backend/src/providers/openAiResponsesProvider.ts`, `askAiProvider.ts`
- Backed by: DEC-020, DEC-033

## Backend API & validation

- Status: shipped
- Summary: Hosts `POST /api/ask-ai`, validates requests with Zod, applies the error taxonomy, and exposes health + logging.
- Lives in: `apps/backend/src/routes/askAi.ts`, `validation/askAiRequest.ts`, `errors.ts`
- Backed by: DEC-010, DEC-013, DEC-020, DEC-038, DEC-033, DEC-049

### `POST /api/ask-ai` route

- Status: shipped
- Summary: Primary ask-AI endpoint orchestrating validation, prompt assembly, and provider invocation.
- Lives in: `apps/backend/src/routes/askAi.ts`
- Backed by: DEC-010, DEC-038

### Request validation schemas

- Status: shipped
- Summary: Zod schemas validating the ask-AI request shape and constraints.
- Lives in: `apps/backend/src/validation/askAiRequest.ts`
- Backed by: DEC-013

### Error taxonomy

- Status: shipped
- Summary: Structured error types and mapping for consistent API error responses.
- Lives in: `apps/backend/src/errors.ts`
- Backed by: DEC-020

### Health route & logging

- Status: shipped
- Summary: Health-check route and request/response logging.
- Lives in: `apps/backend/src/routes/health.ts`, `apps/backend/src/logging.ts`
- Backed by: DEC-010

### Live response-size diagnostics

- Status: shipped
- Summary: Logs answer-size stats for successful live LLM provider responses without returning debug sidecars or changing prompt input.
- Lives in: `apps/backend/src/routes/askAi.ts`, `apps/backend/src/responseSizeDiagnostics.ts`, `apps/backend/src/app/createApp.ts`
- Backed by: DEC-049, REQ-033

## Frontend staged context flow

- Status: shipped
- Summary: Staged state machine that collects game context, phase/zone defaults, zone confirmation/collection, and enrichment, then builds the request payload under stack limits.
- Lives in: `apps/frontend/src/lib/contextFlow/`, `apps/frontend/src/components/`, `App.tsx`
- Backed by: DEC-021, DEC-023, DEC-024, DEC-028, DEC-034, DEC-035, DEC-037

### Flow state machine

- Status: shipped
- Summary: Drives step transitions across the staged context-collection flow.
- Lives in: `apps/frontend/src/lib/contextFlow/flow.ts`, `steps.ts`
- Backed by: DEC-021, DEC-023

### Phase zone defaults

- Status: shipped
- Summary: Derives default zones to collect based on the selected phase.
- Lives in: `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts`
- Backed by: DEC-037

### Zone confirm & collection steps

- Status: shipped
- Summary: UI steps to confirm relevant zones and collect cards per zone.
- Lives in: `apps/frontend/src/components/ZoneConfirmStep.tsx`, `ZoneCollectionStep.tsx`, `ZoneCardPicker.tsx`
- Backed by: DEC-024, DEC-028

### Enrichment step

- Status: shipped
- Summary: Optional enrichment step for additional per-card/context detail before submit.
- Lives in: `apps/frontend/src/components/EnrichmentStep.tsx`
- Backed by: DEC-034, DEC-035

### Shared card presentation

- Status: shipped
- Summary: Zone collection, expanded scan review, enrichment, and other suite card-image surfaces share a responsive image-first card presentation (DEC-078 as amended by DEC-151). Available images stay uncropped and aspect-preserving and size **relative to their host container** rather than to a fixed `max-h-32` cap (DEC-160), so all six card surfaces grow with the width their layout affords and respond to viewport; a host row may record a bounded cap where REQ-129's first-viewport Fit rule binds first. The corner control opens the shared portal-hosted detail overlay — a bottom sheet below `768px`, a side panel at `768px+`, sized to its own content rather than to the image's bounding box (DEC-158) — carrying descriptive fields including oracle text; missing or failed images enter metadata mode directly. In-Depth zone added cards use a horizontal left-to-right strip with region scroll. Complete card containers use stable WUBRG-ordered identity rings with a silver-gray fallback; Remove, ordering, enrichment, scan, and submission behavior remain unchanged.
- Lives in: `apps/frontend/src/components/CardPresentation.tsx`, `apps/frontend/src/lib/cardIdentityRing.ts`, consumers in `apps/frontend/src/components/{ZoneCardPicker,ScanReviewBubble,EnrichmentStep,CardSelectionPreview}.tsx`, ring and responsive scroll styling in `apps/frontend/src/index.css`
- Backed by: DEC-078, DEC-151, DEC-158, DEC-159, DEC-160, REQ-058, REQ-125, REQ-128, REQ-129, REQ-130, REQ-133, REQ-141, REQ-142, FLOW-001, FLOW-002, FLOW-006

### Per-instance zone-card identity

- Status: shipped
- Summary: Each `ZoneCardItem` carries a stable frontend-only `instanceId` assigned once at add time (via `buildZoneCardFromMetadata`), so duplicate non-stack cards are independently removable and independently editable. UI list keys, removal filters, and per-instance enrichment edits (`updateZoneCard`) key on `instanceId`; `cardId` stays the oracle identity for prompts, rulings, duplicate-stack logic, and scan oracle-bridge. `instanceId` is stripped at the single serialization boundary (`buildAskAiRequest`) so the backend `.strict()` payload schema is unchanged.
- Lives in: `apps/frontend/src/lib/zoneCards.ts` (generation + removal), `apps/frontend/src/lib/contextFlow/flow.ts` (strip), `apps/frontend/src/components/{ZoneCardPicker,ScanReviewBubble,ZoneCollectionStep,EnrichmentStep}.tsx`, `apps/frontend/src/hooks/{useScanCapture,useEnrichmentTargets}.ts`
- Backed by: DEC-082, REQ-061

### Stack limits

- Status: shipped
- Summary: Enforces stack-size limits on collected context before payload assembly.
- Lives in: `apps/frontend/src/lib/stackLimits.ts`
- Backed by: DEC-035

## Frontend personalization

- Status: shipped
- Summary: Global theme settings for six fixed Magic-inspired color profiles ordered White, Blue, Black, Red, Green, Colorless (Blue default), hosted as a palette-only **Theme** section in the feature-portal Menu, applied to frontend tokens, and persisted per browser. Colorless alone supports a remembered custom RGB override with Reset; retired former palette ids are deleted and fall back to Blue (DEC-119 / REQ-099). Palette reach extends beyond primary-accent surfaces to the page background end-stop (neutralized to slate, not palette-tinted), previously-fixed semantic green states, and the camera scanner UI. A restrained ambient-accent layer (DEC-081 / REQ-060) extends the palette across the four staged screens and the answered/conversation view: one shared semantic CSS contract (`.ambient-accent-surface` / `.ambient-accent-interactive` / `[data-accent-current="true"]`) defines resting, enhanced hover/focus, and selected/current intensities once from the four existing accent tokens, and only REQ-060's closed surface inventory opts in — static chrome, card-identity rings, and tuned scanner motion stay neutral/unchanged, and the inventory now includes the answered view's context trigger/sheet-drawer and docked composer/workspace in place of the retired frozen-context summary. The former Chunky/Slim layout-density control is retired (DEC-117); see **Automatic responsive presentation**. The game-context player disclosure uses 44×44px minimum controls, a prominent accessible expander, and conventional `−`/`+` stepper order.
- Lives in: `apps/frontend/src/lib/theme/` (palettes, themePrefs, applyPalette), `apps/frontend/src/hooks/useThemePalette.ts`, `apps/frontend/src/components/portal/{FeaturePortalMenu,ThemeSection}.tsx`, `apps/frontend/src/components/PageShell.tsx`, `apps/frontend/tailwind.config.ts`, `apps/frontend/src/index.css` (incl. the shared ambient-accent contract), plus surfaces in `App.tsx`, `EnrichmentStep.tsx`, `ZoneCollectionStep.tsx`, `ZoneCardPicker.tsx`, `ZoneConfirmStep.tsx`, `ScanCameraSurface.tsx`, `ScanReviewBubble.tsx`, `ConversationThread.tsx`, `ConversationWorkspace.tsx`, `AdaptiveContextDialog.tsx`
- Backed by: DEC-066, DEC-068, DEC-081, DEC-091, DEC-110, DEC-117, DEC-119, REQ-044, REQ-046, REQ-060, REQ-069, REQ-089, REQ-096, REQ-099, FLOW-007, NFR-011

### Theme palettes

- Status: shipped
- Summary: Six named profiles (White/Blue/Black/Red/Green/Colorless, Blue default) applied immediately on selection and persisted in browser storage (`thejudge.theme.paletteId`); Colorless may store a custom RGB under `thejudge.theme.colorlessCustomRgb` with Reset-to-default. Falls back safely when stored data is unavailable or unsupported; retired catalog ids are deleted and resolve to Blue. All six orbs render in one row; when Colorless is selected, the custom-color input and Reset control appear centered under that row (DEC-152 / REQ-131).
- Lives in: `apps/frontend/src/lib/theme/palettes.ts`, `apps/frontend/src/lib/theme/themePrefs.ts`, `apps/frontend/src/components/portal/ThemeSection.tsx`, accent CSS variables in `apps/frontend/src/index.css` + `apps/frontend/tailwind.config.ts`
- Backed by: DEC-066, DEC-110, DEC-119, DEC-152, REQ-044, REQ-089, REQ-099, REQ-131

## Automatic responsive presentation

- Status: shipped
- Summary: The former user-selected Desktop/Mobile layout-density preference (`data-layout-density`, `thejudge.theme.layoutDensity`, `useLayoutDensity`) is retired and replaced by automatic, mobile-first, fluid CSS presentation across one semantic component tree. `index.css` defines shared fluid spacing/gap tokens with `clamp()`; structural media queries are reserved for non-interpolating changes, with `768px` as the one structural boundary (the adaptive context sheet/drawer switch, see **Follow-up chat**). A pre-existing stored density value is left untouched and simply ignored — never read, migrated, or deleted. No user-agent, platform, pointer, or JavaScript viewport-mode selection is used anywhere in the participating surfaces (page shell/card, staged header, zone grid/tiles, enrichment lists, scan video/card preview, conversation workspace/thread). Touch targets stay at least 44px and body/supporting text does not shrink below `text-sm`/`text-xs`. **Layout:** per-screen purpose/size/fit intent for agents lives in `sections/screen-layout.md` (DEC-149 / REQ-126) — not in this catalog’s summaries.
- Lives in: `apps/frontend/src/index.css`; `apps/frontend/src/App.tsx` (no density wiring); `apps/frontend/src/components/portal/{FeaturePortalMenu,ThemeSection}.tsx` (palette-only Theme section)
- Backed by: DEC-117, DEC-110, DEC-149, REQ-096, REQ-056, REQ-089, REQ-126, NFR-001, NFR-011

## UI motion & feedback

- Status: shipped
- Summary: A broadened, app-wide decorative-motion and visual-feedback baseline across the full staged flow (game context, zone confirmation, zone collection, enrichment) and the answered/conversation view — micro-transitions, easing, hover/press/focus states, entrance/exit transitions, and add/remove/success/error state-change cues. CSS-based (no animation library), honors `prefers-reduced-motion`, performance-safe, and changes no behavior, contract, stack ordering, or scan-engine logic. Extends the existing functional wait-state motion (`AskAiWaitingPanel`, inline follow-up spinner); the scan camera convergence UI is excluded. The answered/conversation view's focused conversation motion (first-answer handoff, newly appended messages, adaptive context open/close, New response appearance) reuses this same shared transform/opacity token vocabulary, animates only newly entering content, and is effectively immediate under reduced motion (DEC-118 / REQ-098).
- Lives in: shared motion tokens/utilities in `apps/frontend/src/index.css`; staged-flow surfaces in `apps/frontend/src/App.tsx` and `apps/frontend/src/components/{StagedStepHeader,ZoneConfirmStep,ZoneCollectionStep,ZoneCardPicker,CardSelectionPreview,EnrichmentStep,CardPresentation}.tsx`; answered-view surfaces in `apps/frontend/src/components/{ConversationThread,ConversationWorkspace,AdaptiveContextDialog}.tsx`; reduced-motion detection in `apps/frontend/src/lib/motionPreference.ts`
- Backed by: DEC-079, DEC-118, REQ-059, REQ-098, NFR-006, FLOW-001, FLOW-002, FLOW-006

## Mock-mode banner

- Status: shipped
- Summary: Persistent, non-dismissible banner shown at the top of every screen when the app is built/run with the mock AI provider. The mock/live signal is build-time configuration-driven from the single `ASK_AI_PROVIDER` source of truth — `vite.config.ts` bridges `process.env.VITE_ASK_AI_PROVIDER ?? process.env.ASK_AI_PROVIDER` into the client as `import.meta.env.VITE_ASK_AI_PROVIDER`, and `env.ts` resolves it to the `isMockProvider` boolean (mirroring the `resolveDebugLoggingEnabled` pattern; never inferred from `DEV`/`MODE`/`NODE_ENV`/host/answer text, never throws on unknown values). `MockModeBanner` mounts once in `PageShell`, so it covers the empty/home state, all four staged steps, and the answered/conversation view; `PageShell` applies a conditional top-offset (`data-mock-banner`) so the fixed banner never obscures the header, and the banner sits below the feature-portal Menu's z-index. Static, high-contrast, CSS-only (no motion), presentation only — no backend endpoint, ask-AI contract, or mock-response-content change. **Known gap (REQ-123):** the offset guarantee currently holds only for destinations rendered through `PageShell`'s standard path; full-bleed destinations (Life Tracker, Trade Balancer) measured header controls covered by the fixed banner, and more than one banner node was mounted at once.
- Lives in: `apps/frontend/vite.config.ts` (define bridge), `apps/frontend/src/lib/env.ts` (`resolveIsMockProvider` + `isMockProvider`), `apps/frontend/src/components/MockModeBanner.tsx`, `apps/frontend/src/components/PageShell.tsx` (mount + offset), `apps/frontend/src/index.css` (`.mock-mode-banner` + `data-mock-banner` offset)
- Backed by: DEC-085, REQ-063, REQ-123, NFR-006, DEC-020, DEC-017

## Card search & metadata

- Status: shipped
- Summary: Runtime card metadata fetch, fuzzy autocomplete, and zone-card construction in the frontend.
- Lives in: `apps/frontend/src/lib/search.ts`, `lib/zoneCards.ts`
- Backed by: DEC-012, REQ-002, REQ-003

### Fuzzy autocomplete

- Status: shipped
- Summary: Keyboard-navigable fuzzy card-name autocomplete.
- Lives in: `apps/frontend/src/lib/search.ts`, `hooks/useAutocompleteSuggestions.ts`, `hooks/useAutocompleteKeyboard.ts`
- Backed by: REQ-002, REQ-003

### Zone-card construction

- Status: shipped
- Summary: Builds zone-card items from selected metadata for the context flow.
- Lives in: `apps/frontend/src/lib/zoneCards.ts`
- Backed by: DEC-012

## Card scanning

- Status: shipped
- Summary: Optional on-device camera scanner that identifies a Magic card by artwork (perceptual hash → ranked candidates), converges via a temporal lock-in control layer, and adds the locked card to a zone via the existing add path; frontend-only, zero network calls at scan time, no backend/API/prompt change. Card-back detection is descoped (no reference asset). Validated end-to-end on a laptop camera; formal NFR-010 device metrics not separately recorded.
- Lives in: `apps/frontend/src/lib/scan/` + camera/lock-in UI in `apps/frontend/src/components/{ScanCameraSurface,ZoneCardPicker,ZoneCollectionStep}.tsx` + `hooks/useScanCapture.ts`; build scripts under `scripts/`; artifacts under `apps/frontend/public/data/`
- Backed by: DEC-050, DEC-051, DEC-052, DEC-053, DEC-055, REQ-034, REQ-035, REQ-036, REQ-037, REQ-038, NFR-010

### Identification core

- Status: shipped
- Summary: Single authoritative TS perceptual-hash + matching module (DB reader, auto-levels, Region A pHash, two-orientation match, ranked candidates), validated byte-for-byte against regenerated golden vectors. Retains a dormant card-back rejection method (inactive until a `_card_back` reference is added — DEC-055).
- Lives in: `apps/frontend/src/lib/scan/{recipe,identify,dbformat,types}.ts`; golden vectors under `apps/frontend/src/lib/scan/__fixtures__/`
- Backed by: REQ-034, DEC-051, DEC-053

### Fingerprint library build

- Status: shipped
- Summary: Offline build that generates `cardhashes.bin` + manifest from Scryfall images using the same TS recipe; human-approved image download; lazy-loaded on first scan. Resumable by default (`data:scan-fingerprints`): uses the bin as memory, downloads only missing images to a transient path, hashes and discards them immediately, bounded per run by optional `--limit`/`--max-minutes` budgets with atomic checkpoint/resume, rate-limited (paced + `429`/`5xx` backoff) downloads, and a capped skip-list — so the full corpus is built over many short daily runs without retaining the ~100 GB image corpus or overloading Scryfall. A from-scratch rebuild is opt-in via `--fresh` and is non-destructive (writes a new file, never deletes/overwrites the live bin).
- Lives in: `scripts/build-card-hashes.mjs` + `apps/frontend/public/data/cardhashes.bin` + sidecar `cardhashSkiplist.json`
- Backed by: REQ-035, REQ-039, DEC-051, DEC-054, REQ-047, DEC-069
- Shipped (REQ-047 / DEC-069): corpus explicitly targets every paper gameplay printing with distinct artwork incl. non-English-only alt-art (keeps Default Cards as source — no `all-cards` switch); gameplay/corpus inclusion moved into a tested helper (`hashLibBuild.ts` `shouldIncludeScanPrinting`) so legitimate art is not silently dropped; coverage is now measurable without network via `data:scan-fingerprints --coverage-summary` / `--diagnose-id <id>` / `--diagnose-illustration-id <id>` (reports included/excluded, fingerprinted/parked/missing, and full-vs-partial corpus) plus manifest `targetCount`/`fingerprintedTargetCount`/`missingCount`/`parkedCount`/`corpusStatus`. Live corpus is `partial` under DEC-054 (97311/97323 fingerprinted at closeout); closing the remaining gap is a human-approved coverage-extending build, not a code change. Recipe, bin format, distance logic, and Region A stay frozen; Region-A language bleed would be a separate recipe/rebuild escalation, out of scope.

### Scan-to-metadata resolver

- Status: shipped
- Summary: Maps ranked printing-id candidates → oracle id → existing `CardMetadataItem`, collapsing duplicates by best distance and dropping unresolvable candidates.
- Lives in: `apps/frontend/src/lib/scan/resolveScanCandidates.ts` + `apps/frontend/public/data/cardScanMap.json`
- Backed by: REQ-036, DEC-053

### Camera capture & detector

- Status: shipped
- Summary: Live camera capture with card-shaped overlay; requests an ideal 1920x1080 environment-facing stream with graceful fallback and continuous focus when the opened track supports it, then detects and perspective-warps the card to the canonical image (detection runs on a downscaled frame, warps from full-res for steadier quads and higher effective FPS); continuous auto-scan plus manual tap fallback, paused on lock-in. Detector selection is clutter-resistant (centered card-likeness scoring rather than largest gate-passing quad anywhere) and biased toward the on-screen framing-guide reticle the user aligns to, with condition-aware coaching copy when no card is found.
- Lives in: `apps/frontend/src/lib/scan/detector.ts`, `apps/frontend/src/components/ScanCameraSurface.tsx`, `apps/frontend/src/hooks/useScanCapture.ts`; detector fixtures under `apps/frontend/src/lib/scan/__fixtures__/detector/`
- Backed by: REQ-037, DEC-052, DEC-055, DEC-072, DEC-073, DEC-074, REQ-050, REQ-051, REQ-052, REQ-053
- Detector robustness (shipped 2026-06-25, `scan-detector-foil-robustness`): the recall fixes for ornate/etched-foil and hand-held/cluttered/finger-occluded captures shipped — `findBestCardInEdges` now scores centered card-likeness instead of taking the largest quad anywhere, the multi-channel `median * 1.15` candidate cap was removed, and `detectCard({ guide })` biases (never hard-rejects) selection toward the reticle region; the searching-state copy coaches fill-the-guide / flat surface / fingers-off-edges. The two owner frames are committed real-frame fixtures (`__fixtures__/detector/real/`), and the eval harness reports synthetic vs. real distinctly with synthetic labelled necessary-but-not-sufficient. The Region A recipe/geometry, `CARDHSH1` bin, `identify.ts`, and the DEC-059 lock gate stayed frozen.
- Capture-quality closeout (shipped 2026-06-26, `scan-capture-quality`): the reassigned DEC-074 outcome gate is now shipped. `ScanCameraSurface` requests higher-resolution capture, the hook/surface expose the positive "Good — hold steady" in-zone cue, and `tuning.ts` uses the validated 3-frame best-frame window plus frame-quality calibration. Owner on-device evidence recorded a broader lock window and no new false auto-adds; the recipe, `CARDHSH1` bin, `identify.ts`, and DEC-059 lock gate stayed frozen. The evidence note did not capture the exact observed native resolution, but the capture path and graceful fallback are covered by automated constraints tests.

### Scan lock-in control layer

- Status: shipped
- Summary: Temporal stabilizer votes the top-1 oracle identity across a rolling window (confidence + margin gated) and emits `searching`/`locked`; on a confident lock the card auto-adds and auto-scan resumes hands-free (no Accept tap). Replaces the prior per-frame list churn. Convergence knobs are isolated in `tuning.ts`, including the outcome-validated 3-frame best-frame selector for capture-quality work. The stabilizer exposes an additive, pure progress signal (leader id + votes accumulated/needed, plus `bestDistance`/`runnerUpDistance`/`margin` on the `searching` state) that drives the `searching`/`locking`/`locked` indicator and the debug overlay, with no change to distance/confidence/margin logic. The current acquisition-tuning trial uses the easier convergence shape (`windowSize 13 / minVotes 3 / lockDistance 78`) while `marginMin 14` retains the runner-up distinctness guard; owner retest found lock is quick once identity votes exist, so remaining work moves upstream to acquisition diagnostics (DEC-077). One-tap removal remains the safety net.
- Lock-on outline (shipped 2026-06-30, `scan-lock-on-outline`): a positive alignment outline is drawn on the detected card in the viewfinder whenever the stabilizer is in the `locking` state, as an always-on affirmative "you're close — hold this angle" cue. Reuses the existing `locking` trigger (DEC-057) and the detector's 4-corner geometry already surfaced for the debug overlay (DEC-060) via the shared `ScanCardOutline` renderer — outline only, no new threshold, no debug metrics, no toggle, no match-logic/lock-gate change; degrades to the text indicator when corners are absent for a `locking` frame.
- Lives in: `apps/frontend/src/lib/scan/{stabilizer,tuning}.ts`, `apps/frontend/src/hooks/useScanCapture.ts`, `apps/frontend/src/components/{ScanCameraSurface,ScanCardOutline}.tsx`
- Backed by: REQ-037, REQ-038, REQ-040, REQ-062, DEC-055, DEC-056, DEC-057, DEC-059, DEC-062, DEC-074, DEC-077, DEC-083

### Scan UX in zone picker

- Status: shipped
- Summary: Hands-free scan entry point beside manual search: batch scan → confident lock → auto-add → resume loop with no Accept tap and no candidate-list pick. A live `searching`/`locking on: <name>`/`locked` indicator (replacing the raw status pill and `Camera: <status>` debug line) shows convergence, including a positive "Good — hold steady" cue when the current frame is good enough to lock but has not yet accumulated the votes. Each auto-add plays a CSS-only thumbs-up confirmation popup (NFR-006); a top-right scanned-cards review bubble lists this-session adds, shows the running count, and offers one-tap, no-confirmation removal of a wrong auto-add. Duplicate-stack/stack-limit blocks surface as non-blocking notices and scanning continues. Feeds the existing preview/add/owner/duplicate-block/stack-limit/removal flow unchanged. Manual tap-capture remains; manual search is reached via Exit scan — the in-scan low-confidence manual-search escalation prompt does not render (DEC-076). While scan is open, zone-collection search, card list, and outer staged-flow navigation/action buttons are hidden; scan-local controls including Capture remain available (DEC-076). Card-back prompt descoped (DEC-055). Audio "ding" confirmation is tracked separately under **Scan audio confirmation** (REQ-042 / DEC-061, shipped).
- Lives in: `apps/frontend/src/components/{ZoneCardPicker,ZoneCollectionStep,ScanReviewBubble}.tsx`, `apps/frontend/src/hooks/useScanCapture.ts`, `apps/frontend/src/index.css`
- Backed by: REQ-038, REQ-040, REQ-054, REQ-056, REQ-068, REQ-071, DEC-052, DEC-055, DEC-056, DEC-057, DEC-058, DEC-074, DEC-076, DEC-090, DEC-093
- Responsive scan-layout closeout (shipped 2026-07-03, `mobile-scan-layout`): the debug toggle is correctly centered; mute and Cardomancer attribution are anchored inside the alignment guide with separate non-overlapping bounds; `Exit scan` sits in a normal-flow row above the feed and outside the DEC-065 review-bubble region; and the camera frame uses a bounded dynamic-viewport height while preserving `object-cover`. The guide, lock outline, and debug overlay continue to scale with the shared frame wrapper. Scanner behavior and public contracts are unchanged.
- Desktop sizing/searching-label regression fix (shipped 2026-07-04, `scan-camera-desktop-sizing-regression`): the mobile-tuned `100dvh` clamp on the scan video now only applies below the `md:` breakpoint; at `md:` and above the video falls back to the pre-regression `aspect-[3/4]`-equivalent proportion-stable sizing (REQ-068's own desktop-fallback acceptance criterion). Separately, the generic `"Searching for a card…"` label no longer renders while `isSearching` (DEC-093/REQ-071) — the top-left indicator box shows only the active condition hint, detector nudge, or in-zone cue (or nothing), clearing the box-over-mute-toggle overlap that a real-device screenshot surfaced after the prior closeout shipped. `locking` and `camera-error` copy are unchanged; both fixes are presentation-only.

### Scan audio confirmation

- Status: shipped
- Summary: A short "ding" plays on each successful auto-add, on by default, with a top-left mute toggle on the scan screen; fired off the same monotonic `ScanAddConfirmation.id` event as the visual thumbs-up popup. Muting silences the sound only, never the popup. The mute preference persists across reloads via `localStorage` (first repo use, isolated in `lib/scan/audioPrefs.ts`). Played from the bundled `apps/frontend/public/assets/scanSuccess.wav`; no audio/animation library, no tone synthesis. Audio is functional confirmation, outside the NFR-006 animation carve-out. Frontend-only; no backend/API/prompt change. The audio half deferred out of DEC-057.
- Lives in: `apps/frontend/src/components/ScanCameraSurface.tsx`, `apps/frontend/src/lib/scan/audioPrefs.ts`; asset `apps/frontend/public/assets/scanSuccess.wav`
- Backed by: REQ-042, DEC-061

### Scanner debug overlay

- Status: shipped
- Summary: Opt-in, user-summoned diagnostic on the scan screen (toggle defaults off, resets each time the scanner is opened) that visualizes how the scanner perceives the current card. The toggle lives outside the top-right scanned-cards review/remove hit area so it cannot overlap or intercept the one-tap correction path. When enabled it draws a live outline of the detected card region (from the detector's full-res `corners`, surfaced additively from `detectCard` rather than discarded after warp, via the shared `ScanCardOutline` renderer also used by the lock-on outline) plus the art-crop read region on the feed, and text metrics: best/runner-up candidate + distances, margin, votes accumulated/needed, phase, and the active `lockDistance`/`marginMin` thresholds. Read-only from existing detector/stabilizer signals; if geometry can't be cheaply surfaced it degrades to text metrics. Distinct from the static alignment-template guide frame and from the always-on raw status leaks removed by DEC-057. Renders only when enabled (no scan-perf regression off). Built primarily to diagnose poor locks and calibrate the DEC-059 thresholds.
- Lives in: `apps/frontend/src/components/{ScanDebugOverlay,ScanCardOutline}.tsx` + toggle/threading in `apps/frontend/src/components/ScanCameraSurface.tsx`, `apps/frontend/src/hooks/useScanCapture.ts`, `apps/frontend/src/lib/scan/{stabilizer,detector}.ts`
- Backed by: REQ-041, DEC-060, DEC-065

### Scan acquisition diagnostics

- Status: shipped
- Summary: Diagnostic-first follow-up for scanner acquisition after the stabilizer was tuned to lock quickly once identity votes exist. Uses one scanner behavior path but validates it under two capture conditions: Mac-webcam baseline (hard, should be usable without repeated hunting) and stand-assisted controlled setup (ideal, should be fast and consistent). Extends debug evidence from capture through detector, frame selector, quality, identity distance/margin, and vote/no-vote reason before additional acquisition tuning is baked in.
- Lives in: `apps/frontend/src/components/{ScanCameraSurface,ScanDebugOverlay}.tsx`, `apps/frontend/src/hooks/useScanCapture.ts`, `apps/frontend/src/lib/scan/{detector,frameSelection,frameQuality,stabilizer,tuning}.ts`
- Backed by: DEC-077, REQ-057, DEC-060, DEC-062, DEC-072, DEC-073, DEC-074, NFR-010

### Scan robustness conditioning

- Status: shipped
- Summary: Makes the scan vote lock reliably under real-world conditions (glare/gloss, uneven/dim lighting, handheld shake, finger occlusion) by feeding the unchanged matching engine a cleaner, better-chosen query image — never by loosening the lock gate. Three query-only, frontend-only levers: (1) extended query frame conditioning beyond the black-point `autoLevels` stretch to full auto-contrast + specular/glare suppression + white-balance/color-cast normalization (DB images stay clean and un-conditioned, so parity-by-construction holds); (2) best-frame selection — per-frame quality scoring (sharpness, glare fraction, art-crop detail/occlusion) prefers the best frame in the stabilizer window and skips blurred/occluded frames, an additive pure signal with no distance/margin logic change and `marginMin` retained; (3) condition-aware feedback — the `searching` indicator gains cause hints ("too much glare — tilt", "hold steady", "move closer") and the debug overlay surfaces the new quality metrics. Finger occlusion is a frame-quality penalty only (no masked hashing). The recipe, `cardhashes.bin`, the DB build, the matching/distance logic, and the byte-exact parity gate are untouched; the lock gate stays at DEC-059 values. New thresholds isolated in `tuning.ts`, validated on a Mac-webcam device pass (qualitative owner acceptance; counted adverse capture-set table left optional).
- Lives in: `apps/frontend/src/lib/scan/identify.ts` + `tuning.ts` (query-only conditioning), new `apps/frontend/src/lib/scan/frameQuality.ts` + `frameSelection.ts` (pure frame-quality scoring + best-frame selection), `apps/frontend/src/hooks/useScanCapture.ts` (frame selection + condition-hint/quality view-models), `apps/frontend/src/components/{ScanCameraSurface,ScanDebugOverlay}.tsx` (searching hint + debug quality metrics). `recipe.ts`, `stabilizer.ts`, and `cardhashes.bin` are intentionally unchanged.
- Backed by: REQ-043, DEC-062

### Scan art fidelity

- Status: shipped
- Summary: A scanned card displays the specific printing's art that was physically scanned by separating printing-level image presentation from oracle-level identity. `cardScanMap.json` entry shape extended to `{ oracleId, name, imageUrl }` (build-time). At scan time, `resolveScanCandidatesRanked` carries the best-distance printing's `imageUrl` through to the locked candidate; `useScanCapture` surfaces it alongside the oracle-level `CardMetadataItem`; `buildZoneCardFromMetadata` writes it to `ZoneCardItem.imageUrl` for the auto-added card only. The scan preview (`ScanReviewBubble`) and the zone thumbnail both show scanned art. Graceful fallback to oracle-level `CardMetadataItem.imageUrl` when the printing image is absent. Oracle identity, prompt context, rulings, and all scan-engine boundaries are untouched.
- Lives in: `scripts/build-card-scan-map.mjs`; `apps/frontend/public/data/cardScanMap.json`; `apps/frontend/src/lib/scan/resolveScanCandidates.ts`; `apps/frontend/src/hooks/useScanCapture.ts`; `apps/frontend/src/components/{ScanReviewBubble,ZoneCollectionStep}.tsx`; `apps/frontend/src/lib/zoneCards.ts`
- Backed by: DEC-070, REQ-048, REQ-036, REQ-008, NFR-010

## Follow-up chat

- Status: shipped
- Summary: Submit orchestration that freezes context and carries conversation history, rendered through one shared chat-first `ConversationWorkspace` with retry/cooldown, a docked rounded-pill composer, an adaptive read-only context overlay, structured markdown assistant answers, and a browser-local resumable history drawer (always-on History rail on In-Depth/Quick Question, plus a single mid-flight **Draft** slot per destination). Both In-Depth Question and Quick Question consume the same workspace rather than maintaining separate answered-state assemblies. Short-thread fill, Start Over sizing/reachability, and growing pre-submit question fields are shipped (DEC-129–131 / REQ-107–110); the field's growth ceiling accounts for UI chrome below it (submit row, destination footer), not just the viewport bottom, so long input never pushes that chrome off-screen (DEC-131 amended / REQ-110 amended). Pre-submit composers (`EnrichmentStep`, `QuickLookupApp`) adopt `FollowUpComposer`'s field-width composition via a shared `ComposerSubmitButton` (DEC-146 / REQ-121). The initial submit control shows a visible **Send Request** label at every width (icon-only follow-up sends unchanged), and the Enrichment ready-state helper text points at it when the optional message is blank (DEC-153 / REQ-132). Mid-flight exits that open a saved conversation snapshot Draft first (DEC-138).
- Lives in: `apps/frontend/src/hooks/{useAskAiSubmitOrchestration,useAutoGrowTextarea}.ts`, `apps/frontend/src/components/{ConversationWorkspace,ConversationThread,ConversationHistoryDrawer,AdaptiveContextDialog,FrozenGameContextDetails,FollowUpComposer,ComposerSubmitButton,EnrichmentStep}.tsx`, `apps/frontend/src/components/portal/{MtgAssistantApp,quick-lookup/QuickLookupApp}.tsx`, `apps/frontend/src/lib/conversationHistory/persistence.ts`, `apps/frontend/src/lib/portal/leftEdgeDrawerContext.tsx`, `apps/frontend/src/index.css`
- Backed by: DEC-038, DEC-039, DEC-040, DEC-041, DEC-118, DEC-123, DEC-124, DEC-125, DEC-126, DEC-127, DEC-129, DEC-130, DEC-131, DEC-134, DEC-138, DEC-146, DEC-153, REQ-025, REQ-026, REQ-027, REQ-097, REQ-098, REQ-102, REQ-103, REQ-104, REQ-105, REQ-107, REQ-108, REQ-109, REQ-110, REQ-121, REQ-132, FLOW-016, FLOW-017

### Submit orchestration (context freeze + history)

- Status: shipped
- Summary: Freezes the game context on first submit and threads conversation history into follow-up requests. Exposes restore/save hooks used by browser-local conversation history persistence (auto-save after successful turns; resume restores frozen context, hidden initial question, and visible messages).
- Lives in: `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- Backed by: DEC-038, DEC-039, DEC-124

### Conversation thread UI

- Status: shipped
- Summary: Renders the multi-turn conversation as an accessible polite live log (`role="log"`, additions/text relevance, non-atomic updates) in a full-bleed workspace surface (taller height budget, no nested bordered panel). Short threads fill available workspace height; desktop Start Over stays reachable in the workspace chrome, and mobile Start Over is a compact control (DEC-131 / REQ-109). Assistant turns render as structured markdown (GFM; no raw HTML execution) with no bubble container; user turns are solid accent-colored right-aligned bubbles. Guarded auto-scroll follows new messages only when the reader is within 64px of the bottom (`scrollHeight - scrollTop - clientHeight`); a farther-up reader keeps their exact `scrollTop` and sees one New response control that scrolls to and focuses the newest assistant message (`tabIndex={-1}` on that message only) without touching the composer draft. Scroll behavior is `auto` under reduced motion. Message entrance styling is append-aware: only newly appended indices animate, so existing bubbles never replay entrance motion on unrelated renders. The follow-up composer is a single-row rounded-pill control.
- Lives in: `apps/frontend/src/components/{ConversationThread,ConversationWorkspace,FollowUpComposer}.tsx`, `apps/frontend/src/lib/motionPreference.ts`, `apps/frontend/src/index.css`
- Backed by: DEC-040, DEC-118, DEC-123, DEC-127, DEC-131, REQ-098, REQ-102, REQ-105, REQ-109, NFR-006

### Conversation history drawer

- Status: shipped
- Summary: Browser-local, single-device conversation history (capped at 20 completed entries, oldest pruned) auto-saves after each successful answer/follow-up. A left-edge, full-height history drawer at every viewport (DEC-134) lists mode-filtered completed entries as plain unboxed rows plus at most one **Draft** row per destination for mid-flight staging before first successful submit (DEC-130). Selecting a completed entry resumes frozen context, mode, and thread; selecting Draft restores pre-submit staging. Opening a completed entry from mid-flight staging snapshots Draft first (DEC-138). Draft also auto-hydrates mid-flight UI on destination mount (reload or Menu return) so staged work survives Menu leave. The History trigger is an always-on icon zone in the Menu corner rail on In-Depth Question and Quick Question (DEC-126 as amended by DEC-137 side-by-side zones; DEC-129), including empty history, pre-submit steps, and after Start Over, and must not overlap View Context. Mutually exclusive with the feature-portal Menu drawer via `LeftEdgeDrawerContext`. Each completed row exposes a delete control, distinct from select-to-resume, that confirms before removing the entry via `deleteHistoryEntry`; deleting the active completed conversation clears the workspace to its clean pre-answer state without re-saving the deleted thread, and the existing prune-at-20 behavior is preserved for remaining entries (Draft rows are not deletable via this control) (DEC-143). The drawer overlay also dismisses on outside/scrim click, in addition to Close and Escape, without closing on clicks inside the panel surface (DEC-142).
- Lives in: `apps/frontend/src/components/ConversationHistoryDrawer.tsx`, `apps/frontend/src/lib/conversationHistory/persistence.ts`, `apps/frontend/src/lib/portal/leftEdgeDrawerContext.tsx`, `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (rail History zone), `apps/frontend/src/index.css`
- Backed by: DEC-124, DEC-125, DEC-126, DEC-129, DEC-130, DEC-134, DEC-137, DEC-138, DEC-142, DEC-143, REQ-103, REQ-104, REQ-107, REQ-108, REQ-117, REQ-118, FLOW-016, FLOW-017, FLOW-018, DEC-103, NFR-001

### Adaptive context overlay

- Status: shipped
- Summary: Replaces the retired always-visible frozen-context summary. `ConversationWorkspace` renders an optional compact context trigger before the message log; activating it opens `AdaptiveContextDialog`, one semantic modal tree that CSS presents as a bottom sheet below `768px` and a right-side drawer at `768px+` (no JavaScript viewport-mode selection). The dialog has an accessible name, contains Tab/Shift+Tab focus, dismisses on Escape or its explicit close control, and restores focus to the trigger on close. In-Depth Question always supplies a phase + populated-zone-count trigger backed by `FrozenGameContextDetails`' full read-only setup/zone/card/enrichment detail; Quick Question supplies a card-name trigger reusing the existing read-only card presentation when a card is attached, and renders no trigger/container otherwise. The trigger no longer carries a compensating top clearance at all: the corner rail participates in layout (`position: relative`), so the header accounts for its 44px band and the shared `--layout-surface-gap` owns the spacing — measured 8px at 390x844 and 16px at 1440x900, with History↔View Context non-overlap (DEC-129) still holding (DEC-141 as amended by REQ-139). The retired rules were DEC-126's stacked-rail clamp and then DEC-141's `calc(2.75rem - var(--layout-panel-padding))` constant; do not reintroduce a rail-sized constant here. The dialog also dismisses on outside/scrim click, in addition to Close and Escape, without closing on clicks inside the panel surface (DEC-142). `CardSelectionPreview` (the Quick Question card-name trigger's content) tolerates missing/undefined `colors` / `supertypes` / `subtypes` and any other optional preview fields, falling back to the existing N/A-style empty handling instead of throwing, so opening View Context on a resumed lookup entry with incomplete frozen card metadata never white-screens the app (DEC-144).
- Lives in: `apps/frontend/src/components/{ConversationWorkspace,AdaptiveContextDialog,FrozenGameContextDetails,CardSelectionPreview}.tsx`
- Backed by: DEC-118, DEC-141, DEC-142, DEC-144, DEC-159, REQ-025, REQ-075, REQ-097, REQ-116, REQ-117, REQ-119, REQ-135, REQ-139, REQ-142

### Retry / cooldown

- Status: shipped
- Summary: Retry affordance with cooldown after failed or rate-limited submits.
- Lives in: `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- Backed by: DEC-041, REQ-027

## Decrypt waiting panel

- Status: shipped
- Summary: Waiting-panel UI showing staged elapsed-time messages while a request is in flight.
- Lives in: `apps/frontend/src/components/AskAiWaitingPanel.tsx`, `lib/askAiWaitStages.ts`
- Backed by: DEC-031, REQ-023

### Staged elapsed-time messages

- Status: shipped
- Summary: Time-based staged copy driven by an elapsed-wait timer.
- Lives in: `apps/frontend/src/lib/askAiWaitStages.ts`, `hooks/useElapsedWaitTimer.ts`
- Backed by: REQ-023

## Data pipeline

- Status: shipped
- Summary: Build scripts that refresh Scryfall + comprehensive-rules data and produce card metadata, card rulings, and game-rules artifacts, plus a prompt preview.
- Lives in: `scripts/` (`refresh-scryfall-data.mjs`, `build-card-metadata.mjs`, `build-card-rulings.mjs`, `build-game-rules.mjs`, `prompt-preview.mjs`)
- Backed by: DEC-012, DEC-029, DEC-030, DEC-032

### Scryfall + CR refresh

- Status: shipped
- Summary: Downloads/refreshes Scryfall data and comprehensive-rules source (network refresh is human-approved only).
- Lives in: `scripts/refresh-scryfall-data.mjs`
- Backed by: DEC-012

### Artifact builders

- Status: shipped
- Summary: Builds card-metadata, card-rulings, and game-rules artifacts consumed at runtime.
- Lives in: `scripts/build-card-metadata.mjs`, `build-card-rulings.mjs`, `build-game-rules.mjs`
- Backed by: DEC-029, DEC-030, DEC-032

### Standard-print bias

- Status: shipped
- Summary: `choosePreferredCard` in `build-card-metadata.mjs` biases the representative printing per oracle id toward a standard paper printing. An `isStandardPrinting` predicate demotes Secret Lair, promos, funny/joke sets, and special-frame treatments (borderless/extended/showcase) and applies after the metadata-quality score but before the most-recent tiebreak — so the selected representative is "most recent among standard prints." A special printing is chosen only when no standard printing exists for that oracle id. Affects `cardMetadata.json` only; runtime load, metadata format, and all other build artifacts unchanged.
- Lives in: `scripts/build-card-metadata.mjs` (`isStandardPrinting` predicate + tiebreak insertion in `choosePreferredCard`); `apps/frontend/public/data/cardMetadata.json` (regenerated artifact)
- Backed by: DEC-071, REQ-049, REQ-001, REQ-002

### Printing-price artifact build

- Status: shipped
- Summary: Offline build that emits the committed, printing-level USD price artifact from the Scryfall bulk source for the Trade Balancer — per printing `usd`/`usd_foil` plus set/collector/image, indexable by oracle and printing id, with a snapshot date; static snapshot, human-approved refresh, lazy-loaded on first Trade Balancer open.
- Lives in: `scripts/build-card-prices.mjs` → `apps/frontend/public/data/cardPrintingPrices.json` (wired into `npm run data:build`); lazy runtime loader `apps/frontend/src/lib/trade/loadCardPrices.ts`
- Backed by: DEC-088, REQ-066, NFR-013

### Commander Spellbook combo artifact build

- Status: shipped
- Summary: Human-approved offline refresh of reviewed `OK` Commander Spellbook variants/templates from upstream's public bulk export, plus deterministic build of compact combo detail and oracle/template indexes. Upstream renders camelCase on the wire, and fixtures are derived from real upstream responses so a rename fails the suite (DEC-162). `EXAMPLE` variants are rejected because upstream nulls their steps, prerequisites, mana, notes, and card state, though the bulk export publishes none. Per-ingredient card state is retained zone-scoped, alongside `mustBeCommander`. Query-backed templates expand through their authoritative Scryfall API URL; templates without an authoritative expansion remain unresolved. Each variant is gzipped as its own member and the index carries a byte-offset directory into the detail artifact, so a lookup decompresses one record rather than the corpus — 76.9 MB detail + 4.8 MB index committed over 106,182 real variants, well above a same-corpus single-stream estimate: per-record gzip forfeits the cross-record compression a shared stream gets almost free across repeated JSON keys, traded for bounded per-lookup memory (18 MB index-only heap vs. 254 MB holding the full detail catalog resident) rather than an optimization deferred (DEC-162). Both scripts parse the ~634 MB decompressed export as a stream, since it exceeds V8's maximum string length. Running the repository's `data:refresh` command is itself the explicit human approval REQ-093 requires — the combo download joins that chain alongside the existing Scryfall and Comprehensive Rules refreshes, with `--confirm-live-calls` kept on the standalone combo script for direct invocation. Raw responses stay gitignored, failed refreshes preserve valid committed artifacts, and runtime performs no external combo fetch.
- Lives in: `scripts/refresh-commander-spellbook-data.mjs` (wired into the `data:refresh` chain), `scripts/build-commander-spellbook-combos.mjs`, `scripts/lib/stream-json-array.mjs`, gitignored `apps/backend/data/commander-spellbook/`, committed `apps/backend/data/commanderSpellbookCombos.json.gz` and `apps/backend/data/commanderSpellbookComboIndex.json.gz`
- Backed by: DEC-116, DEC-162, REQ-093

### Prompt preview

- Status: shipped
- Summary: Renders an assembled prompt preview for inspection.
- Lives in: `scripts/prompt-preview.mjs`
- Backed by: DEC-025

## Eval harness

- Status: shipped
- Summary: Context-evaluation harness with fixtures, golden comparisons, and labeled retrieval-relevance checks over prompt assembly and retrieval.
- Lives in: `apps/backend/src/eval/`
- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032

### Context evaluation harness

- Status: shipped
- Summary: Runs prompt-assembly/retrieval evaluations against fixtures, including `system2-conditional-selection`, `system3-expected-recall`, and `system3-noise-excluded` relevance checks.
- Lives in: `apps/backend/src/eval/contextEvaluationHarness.ts`
- Backed by: DEC-025, DEC-047, REQ-032

### Fixtures & golden comparisons

- Status: shipped
- Summary: Fixture inputs and golden expectations for the eval harness, including labeled `expected` recall blocks for retrieval scenarios.
- Lives in: `apps/backend/src/eval/fixtures/`
- Backed by: DEC-030, DEC-032, DEC-047

### Retrieval relevance report

- Status: shipped
- Summary: Digestible before/after report (System 2 topics, System 3 top-5 with scores, recall hit/miss) for tuning review; shares scoring logic with the harness so report output cannot drift.
- Lives in: `scripts/retrieval-relevance-report.mjs`, `apps/backend/src/eval/contextEvaluationHarness.ts` (`buildRelevanceReport`)
- Backed by: DEC-047, REQ-032

## AWS production deployment

- Status: shipped
- Summary: Runs the live OpenAI-backed app on a low-cost AWS serverless stack using AWS-provided URLs, automated quality-gated deploys, backend-only secret loading, and explicit cost/scale guardrails.
- Lives in: `.github/workflows/quality-check.yml` (`deploy` job), `scripts/aws-{bootstrap,deploy}.sh`, `scripts/package-lambda.sh`, `apps/backend/src/lambda.ts`, `docs/aws/`
- Backed by: DEC-084, GOAL-003, NFR-003, NFR-004, REQ-165, REQ-166, NFR-017

### Serverless hosting

- Status: shipped
- Summary: Serves the static frontend from a private S3 origin through CloudFront and the backend from Lambda through a public Function URL, without a custom domain. The Lambda deploy artifact is staged in a private S3 bucket rather than uploaded inline, raising the effective package ceiling to Lambda's 250MB unzipped quota.
- Lives in: `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`, `apps/backend/src/lambda.ts`, `scripts/lambda-package-budget.test.mjs`
- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017

### Production secrets and deployment identity

- Status: shipped
- Summary: Loads the OpenAI key from an SSM SecureString once per Lambda container and deploys from GitHub through OIDC with no static AWS credentials.
- Lives in: `apps/backend/src/runtime/loadOpenAiKeyFromSsm.ts`, `.github/workflows/deploy-aws.yml`, `scripts/aws-bootstrap.sh`
- Backed by: DEC-020, DEC-084, NFR-003

### Deploy and cost guardrails

- Status: shipped
- Summary: Gates every main-branch deploy on `quality:check`, skips the deploy job on merges that touch no code-set path (with a `workflow_dispatch` manual override), caps Lambda concurrency when the account quota permits, retains the account limit as the fallback cap, and configures a low monthly AWS Budget alert.
- Lives in: `.github/workflows/quality-check.yml` (`changes` and `deploy` jobs), `scripts/aws-bootstrap.sh`
- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017

## Quick Lookup

- Status: shipped
- Summary: Unified short-form MTG Ask AI destination for a freeform rules question with an optional single card resolved by typed search or camera scan. It uses the additive `mode: "lookup"` branch on `POST /api/ask-ai`, always runs question-driven rules retrieval, layers in card metadata/rulings when a card is attached, omits staged-game sections, and reuses the shared `ConversationWorkspace` — message log, docked composer, retry, start-over, and (when a card is attached) an adaptive read-only card-context trigger/overlay. The pre-submit card label carries the guidance copy inline after an em dash. A collapsed, fully local six-topic "General rules topics" disclosure stays below the Question field; nested rows use accordion disclosure, and "Use this topic" locks a removable fixed-phrase pill that is composed client-side with optional free text into the existing `question` string. The visible counter, the textarea `maxLength`, and the submit gate all measure the **raw editable textarea**, never the composed string (REQ-091 as amended by REQ-134), so an empty field with a card or topic attached reads `0/300` and a full 300-character question stays submittable; the composed wire value may therefore exceed 300 by the prefix, and `questionSchema` accepts up to 600 characters to carry it. During the initial request, the Question form is replaced in place by the shared waiting panel while the Optional card and General rules topics sections remain available; an error restores the form, while success swaps to the shared conversation workspace.
- Lives in: `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`, `apps/frontend/src/components/portal/destinationRegistry.tsx`, `apps/frontend/src/components/{ConversationWorkspace,AdaptiveContextDialog}.tsx`, `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`, `apps/frontend/public/data/gameRulesCoreTopics.json`, `apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/prompt/`, `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/src/eval/fixtures/quick-lookup-*`, `scripts/build-game-rules.mjs`
- Backed by: DEC-106, DEC-107, DEC-108, DEC-112, DEC-113, DEC-114, DEC-118, REQ-072, REQ-073, REQ-074, REQ-075, REQ-079, REQ-091, REQ-092, REQ-097, REQ-098, FLOW-011

## Player Life Tracker

- Status: shipped
- Summary: A feature-portal destination providing a live full-table life/counter tracker for 2–8 players: rotated per-seat life cards with grid/list seat arrangements (list uses the row-based "turned ends" pattern), half-card life-adjustment zones oriented by seat rotation (DEC-136; superseding earlier edge bands), a per-opponent commander-damage matrix (always-visible `−`/`+` bands at ≈53px thickness), the full named-counter palette and custom counters, a full-height counter-panel overlay (DEC-139), commander damage always reducing life, a life ≤ 0 skull death cue (visual only, no elimination), an always-on game-wide day/night flip in the header (manual only, not seeded into In-Depth; no enable toggle), Game Setup with a Players `−`/`+` stepper (2–8), starting-life presets 20/25/30/40 plus Custom defaulting to 60, count-driven starting-life defaults matching In-Depth (2 → 20, 3+ → 40) until the user chooses starting life manually, an Edit-names disclosure, confirm-before-destroy Reset/New Game, and browser-local persistence across reload/phone-lock. Switching directly from the tracker into In-Depth Question one-way seeds the current roster (count, names, life, counters) into `GameContext` via additive optional per-player fields; edits in Assistant never write back to tracker state.
- Lives in: `apps/frontend/src/components/portal/life-tracker/` (`PlayerLifeTrackerApp`, `PlayerLifeCard`, `GameSetupPanel`, `CounterPanel`), `apps/frontend/src/lib/lifeTracker/` (state, persistence, counters, seat arrangement, seed adapter), `apps/frontend/src/lib/portal/seedContext.tsx`, `apps/frontend/src/components/portal/destinationRegistry.tsx`, `apps/frontend/src/App.tsx` (seed-provider handoff wiring), `apps/frontend/src/types.ts` + `apps/backend/src/{validation/askAiRequest.ts,prompt/context.ts,prompt/promptFormatting.ts}` (additive counter contract). In-Depth’s shared `PlayerRosterEditor` remains under Feature portal / MTG Assistant; the tracker does not mount it.
- Backed by: DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139, REQ-081, REQ-082, REQ-083, REQ-084, REQ-085, REQ-111, REQ-112, FLOW-013

## Commander Spellbook combo retrieval

- Status: shipped
- Summary: Backend-only, static Commander Spellbook prompt enrichment shared by In-Depth Question and Quick Question. Game mode automatically supplies only complete quantity-aware identity + compatible-zone matches unless narrow combo language explicitly permits labeled partial candidates; lookup mode requires both combo intent and an attached card. Selection is deterministic, capped at five, labels missing/wrong-zone/unresolved ingredients, surfaces each ingredient's card state for the zone its matched instance occupies, and preserves WotC sources as authority. No candidate is ever rendered as "complete" — full assignment renders as all pieces present with card state unverified, and the model is instructed to check that state against the board. No Known Combos UI, browser, contract change, new endpoint, or runtime upstream call.
- Lives in: `apps/backend/src/commanderSpellbook/` (`catalog.ts` lazy byte-range loader, `intent.ts`, `matcher.ts`, `zones.ts`, `formatting.ts`), `apps/backend/src/prompt/` integration (`preparation.ts`, `promptAssembly.ts`, `promptDiagnostics.ts`), `apps/backend/src/runtime/createConfiguredApp.ts`, `apps/backend/src/eval/fixtures/commander-spellbook-*`, `apps/backend/data/commanderSpellbookCombos.json.gz`, and `apps/backend/data/commanderSpellbookComboIndex.json.gz`; the opt-in answer-quality comparison lives in `scripts/compare-combo-answer-quality.mjs` (`--confirm-live-calls`, `COMBO_ENRICHMENT_ENABLED` backend config, curated scenarios referencing oracle ids that exist in the built corpus) writing to gitignored `output/combo-answer-quality/` (REQ-146)
- Backed by: DEC-116, DEC-161, DEC-162, REQ-093, REQ-094, REQ-095, REQ-146, FLOW-015

## Trade balancer

- Status: shipped
- Summary: Standalone, frontend-only, ephemeral two-sided card-value comparison. Each side is a list of card entries built via scan or manual search; each entry resolves to a specific printing (editable on scans, picked after name-match on manual search), with a foil toggle (non-foil ↔ `usd_foil`), a quantity/multiples, and one-tap removal. Side total = `Σ qty × (foil ? usdFoil : usd)`; the view shows each side's total and the live difference. Missing prices default to $0 with a distinct color + caution-triangle indicator. Scanning is per-side and one camera at a time; when the camera is unavailable the surface closes, manual search stays fully functional, and the reason is surfaced (DEC-050). Printing choice is a pricing/display concern only — it never reaches prompt context, rulings, or any request payload. The build-time snapshot is surfaced as date-level copy (`Prices as of 5 June 2026`) formatted from the artifact's ISO `snapshotDate`, never the raw timestamp, so it cannot read as a live quote; an unparseable value omits the line rather than printing raw artifact data (REQ-145).
- Lives in: `apps/frontend/src/lib/trade/` (`loadCardPrices.ts` lazy loader + indexes, `pricing.ts` pure selectors), `apps/frontend/src/components/trade/` (`TradeBalancer.tsx`, `TradeSide.tsx`, `TradeEntryRow.tsx`, `PrintingPicker.tsx`, `oracleSearch.ts`, `useTradeScan.ts`), `scripts/build-card-prices.mjs` (artifact build, wired into `npm run data:build`), and the committed printing-price artifact `apps/frontend/public/data/cardPrintingPrices.json`. Reuses the scan resolver (`lib/scan/resolveScanCandidates.ts`), the scan map (`lib/scan/loadScanMap.ts`), `ScanCameraSurface.tsx`, and manual search primitives from `lib/search.ts`. Registered as the `trade-balancer` destination in `apps/frontend/src/components/portal/destinationRegistry.tsx`; the former `TradeBalancerPlaceholder.tsx` was deleted once the registry pointed at the real view (it had been hidden from the menu on 2026-08-02 to avoid a coming-soon dead end, `receipts/adhoc-2026-08-02.md`).
- Backed by: DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, REQ-145, NFR-013, FLOW-009

## Feature portal (app navigation)

- Status: shipped
- Summary: **Layout:** shell/Menu/History size and fit bands → `sections/screen-layout.md` (DEC-149). First-class **feature-portal** package that owns top-level navigation chrome: a **top-left corner-rail** Menu trigger (radial-gradient fade, no border; interactive hit box matches painted affordance per DEC-137) opens a **full-height left tray** of the outer shell (`.page-card` or Life Tracker full-bleed) that slides in from the left edge (`translateX`), sized to the visible shell side on tall pages, with matching top- and bottom-left shell radii and optional quiet brand mark in unused lower space (DEC-122 as amended by DEC-133). The tray lists registered destinations plus the palette-only **Theme** section. Registered destinations: **In-Depth Question** (`mtg-assistant`), **Quick Question** (`quick-lookup`), **Trade Balancer** (`trade-balancer`), and **Life Tracker** (`player-life-tracker`); labels lead with each flow's depth/effort rather than internal naming for the ask destinations. **Send feedback** is registered as an action entry (DEC-104) that opens the feedback modal without changing the active destination. Frontend-only view switching preserves each mode's in-session **data** while the app stays loaded; In-Depth Question's synchronized secondary-player-details presentation state is the narrow exception and resets to collapsed when the destination becomes inactive or after an external in-depth seed (DEC-120 / REQ-100). The Theme section is palette-only; automatic responsive presentation replaced the former density control (DEC-117). On conversation-bearing destinations the rail splits into side-by-side Menu + History zones (DEC-126 as amended by DEC-137). While the tray is open, neither the Menu trigger nor the History zone is visible or hit-testable (`aria-hidden`, `tabIndex={-1}`, `visibility: hidden`, `pointer-events: none`); closing goes exclusively through outside click / Escape (DEC-150, amending DEC-140's "Menu stays interactive as the close control" clause). The brand block centers in the header row; step-name text renders as an in-flow `StepEyebrow` above each step's own content (not in header chrome). The active destination choice persists across reloads within the current browser tab via guarded `sessionStorage` (**narrowed by DEC-157**: the URL is now the source of truth and this `sessionStorage` path applies only to a bare `/`; see **Routing** below); each destination's staged/conversation/follow-up state still resets on reload (except browser-local saved conversation history per DEC-124), a new tab still opens on the first registered destination **when it opens a bare `/`** — a deep link overrides this by design (DEC-157) — and there is no backend/contract change. The rail portals through `PortalSlot` into each staged-flow header and the answered/conversation header; the open Menu drawer portals into `ShellBounds` (shell clip + sticky visible-bounds sizing). The viewport-fixed path remains a defensive top-left fallback for destinations without a header slot. The retired standalone top-right theme control and the superseded top-middle pill/dropdown (DEC-121 / REQ-101) no longer apply. The shared `PlayerRosterEditor`'s expanded secondary-details region renders as a direct sibling within its player row's own bordered card, so it stays aligned to that row at every width (DEC-128 / REQ-106).
- Lives in: `apps/frontend/src/components/portal/` (`FeaturePortalMenu.tsx`, `ThemeSection.tsx`, `PortalSlot.tsx`, `ShellBounds.tsx`, `DestinationOutlet.tsx`, `destinationRegistry.tsx`, `MtgAssistantApp.tsx`, `quick-lookup/QuickLookupApp.tsx`, `life-tracker/`, trade mount via registry), `apps/frontend/src/components/PageShell.tsx`, `apps/frontend/src/hooks/useActiveDestination.ts`, `apps/frontend/src/lib/portal/` (`types.ts`, `slotContext.tsx`, `activeDestinationPrefs.ts`, `leftEdgeDrawerContext.tsx`), `apps/frontend/src/components/PlayerRosterEditor.tsx` (shared roster + secondary disclosure), `apps/frontend/src/components/{StagedStepHeader,StepEyebrow,EnrichmentStep,BrandMark}.tsx` (header + eyebrow), `apps/frontend/src/App.tsx` (shell + theme, active-destination, feedback action entry), `apps/frontend/src/index.css` (`.portal-menu-rail` / drawer / `.page-shell-bleed` / `.portal-shell-bounds` / `.step-eyebrow`)
- Routing: under DEC-157 / REQ-140 the four registered destinations are addressable at flat top-level URLs (`/quick-lookup`, `/in-depth`, `/life-tracker`, `/trade-balancer`) via `react-router`, with the path declared on the registry entry. The **URL is the source of truth** for the active destination; DEC-111's `sessionStorage` value is retained only as the bare-`/` fallback, and an unknown path redirects to `/`. The router supplies location and history only — `DestinationOutlet`'s keep-alive mounting is unchanged, because `<Routes>`-style unmounting would break DEC-095's in-session state preservation. Each destination sits behind a `React.lazy` boundary with its **own** per-destination `Suspense` boundary (a single boundary around the outlet would blank already-loaded siblings), and `vite.config.ts` declares function-form `manualChunks` groups for the scan surface shared across the three scanning destinations — wider than `src/lib/scan/**`, including `hooks/useScanCapture.ts` and `components/ScanCameraSurface.tsx` — and for framework code (`react`, `react-dom`, `react/jsx-runtime`, `react-router`) (NFR-014). **Send feedback** remains a routeless action entry (DEC-104).
- Backed by: DEC-089, DEC-095, DEC-104, DEC-109, DEC-110, DEC-111, DEC-117, DEC-120, DEC-122, DEC-126, DEC-128, DEC-133, DEC-137, DEC-140, DEC-150, REQ-045, REQ-067, REQ-089, REQ-090, REQ-096, REQ-100, REQ-106, REQ-113, REQ-114, REQ-115, REQ-127, FLOW-001, FLOW-010, NFR-001, NFR-006, DEC-157, REQ-140, NFR-014

## Feedback & bug report

- Status: shipped
- Summary: Frontend-only feedback + bug-report feature. A **Send feedback** portal **action entry** (registry entry kind alongside destinations) opens an accessible modal over the current screen — category (Bug/Suggestion/Other), required message, optional reply email — plus a **disclosed app-state snapshot** (screen/step, game context + typed question, zones/cards/enrichment, conversation history, provider mode, active destination, environment) surfaced as a one-line disclosure + expandable summary. Delivered to the owner's inbox via **Formspree** with a **public form id** (`VITE_FEEDBACK_FORMSPREE_ID`); the snapshot rides as one JSON-stringified field. No backend route, no secret, no contract change; graceful no-op when no form id is configured. Live delivery confirmed 2026-08-05: Formspree form id `xdenozlb` in production use, local + production build env configured, live-send smoke (modal submit through inbox delivery) and on-device Trade Balancer scan smoke both verified. Deferred product features: screenshots/file uploads, persistence, auth, history, analytics.
- Lives in: `apps/frontend/src/lib/portal/types.ts` (action-entry union), `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`, `apps/frontend/src/App.tsx` (registers Send feedback + hosts modal), `apps/frontend/src/components/feedback/FeedbackModal.tsx`, `apps/frontend/src/hooks/useFeedbackForm.ts`, `apps/frontend/src/lib/feedback/` (`buildFeedbackContext.ts`, `FeedbackContextProvider.tsx`, `submitFeedback.ts`, `summarizeFeedbackContext.ts`, `environment.ts`, `types.ts`), `apps/frontend/src/lib/env.ts` (`resolveFeedbackFormspreeId`), `apps/frontend/.env.example` (`VITE_FEEDBACK_FORMSPREE_ID`)
- Backed by: DEC-105, DEC-104, REQ-086, REQ-087, REQ-088, FLOW-014, DEC-095, NFR-001, NFR-006

## PRD doc traceability (meta)

- Status: shipped
- Summary: The `system-map.md` catalog plus the promotion gate and commit convention that keep the truth layer reflecting shipped reality (the promotion gate applied to itself; catalog + guardrails shipped, cleanup receipt written 2026-06-18).
- Lives in: `PRD/sections/system-map.md`, `PRD/instructions/`
- Backed by: DEC-044

### Feature/subsystem catalog

- Status: shipped
- Summary: This catalog — the durable, single-read answer to "is it real / how / where".
- Lives in: `PRD/sections/system-map.md`
- Backed by: DEC-044
