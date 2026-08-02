# system-map.md

Durable feature/subsystem catalog for the product. Answers "is it real / how does it behave / where does it live?" in one read, without re-deriving behavior from code (`DEC-044`).

## How to read this

Two levels: a subsystem is a `##` heading; features are `###` sub-entries grouped beneath their subsystem. Every entry records four fields:

- **Status** — `shipped` (code exists and is wired in), `planned` (decided/docs-only, no code under `apps/` yet), or `partial` (some features shipped, others planned).
- **Summary** — one-line behavior statement.
- **Lives in** — coarse file/module location (a directory or 1–3 key files), never per-line.
- **Backed by** — the most directly relevant `DEC`/`REQ` IDs.

A subsystem may also carry an optional fifth field:

- **Details** — pointer to a deep behavior writeup under `PRD/sections/system-map/` for subsystems that warrant a one-read explanation of how they actually work (`DEC-048`). Present only when such a file exists; absent otherwise. The detail file never changes this catalog's shallow shape — it is the depth layer beneath it.

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
- Summary: Zone collection, expanded scan review, and both enrichment modes share a responsive image-first card presentation. Available images are centered at 80% of the container width, retain their intrinsic aspect ratio, and toggle to complete locally carried metadata; missing or failed images enter metadata mode directly. Complete card containers use stable WUBRG-ordered identity rings with a silver-gray fallback, while existing Remove, ordering, enrichment, scan, and submission behavior remains unchanged.
- Lives in: `apps/frontend/src/components/CardPresentation.tsx`, `apps/frontend/src/lib/cardIdentityRing.ts`, consumers in `apps/frontend/src/components/{ZoneCardPicker,ScanReviewBubble,EnrichmentStep}.tsx`, ring and responsive scroll styling in `apps/frontend/src/index.css`
- Backed by: DEC-078, REQ-058, FLOW-001, FLOW-002, FLOW-006

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
- Summary: Global theme settings for predefined color palettes and optional Chunky / Slim layout density, hosted as a **Theme** section in the feature-portal Menu, applied to frontend tokens, and persisted per browser. Palette reach extends beyond primary-accent surfaces to the page background end-stop (neutralized to slate, not palette-tinted), previously-fixed semantic green states, and the camera scanner UI. A restrained ambient-accent layer (DEC-081 / REQ-060) extends the palette across the four staged screens and the answered/conversation view: one shared semantic CSS contract (`.ambient-accent-surface` / `.ambient-accent-interactive` / `[data-accent-current="true"]`) defines resting, enhanced hover/focus, and selected/current intensities once from the four existing accent tokens, and only REQ-060's closed surface inventory opts in — static chrome, card-identity rings, and tuned scanner motion stay neutral/unchanged. Layout density mirrors the palette pattern via `data-layout-density` and shared shell CSS classes for participating density surfaces; `ZoneConfirmStep` is excluded from slim-density visual changes and may use shared shell plumbing only as a rendered visual no-op. Staged-flow screen compaction reduces vertical scroll on game context, zone collection, enrichment list mode, and scan-focused chrome. The game-context player disclosure uses density-safe 44×44px minimum controls, a prominent accessible expander, and conventional `−`/`+` stepper order.
- Lives in: `apps/frontend/src/lib/theme/` (palettes, themePrefs, layoutDensityPrefs, applyPalette, applyLayoutDensity), `apps/frontend/src/hooks/useThemePalette.ts`, `apps/frontend/src/hooks/useLayoutDensity.ts`, `apps/frontend/src/components/portal/{FeaturePortalMenu,ThemeSection}.tsx`, `apps/frontend/src/components/PageShell.tsx`, `apps/frontend/tailwind.config.ts`, `apps/frontend/src/index.css` (incl. the shared ambient-accent contract), plus surfaces in `App.tsx`, `EnrichmentStep.tsx`, `ZoneCollectionStep.tsx`, `ZoneCardPicker.tsx`, `ZoneConfirmStep.tsx`, `ScanCameraSurface.tsx`, `ScanReviewBubble.tsx`, `ConversationThread.tsx`, `FrozenContextSummary.tsx`
- Backed by: DEC-066, DEC-068, DEC-075, DEC-076, DEC-081, DEC-091, DEC-110, REQ-044, REQ-046, REQ-055, REQ-056, REQ-060, REQ-069, REQ-089, FLOW-007, FLOW-008, NFR-011

### Theme palettes

- Status: shipped
- Summary: Named palette swatches including the default blue theme; selection applies immediately, persists in browser storage, and falls back safely when stored data is unavailable or unsupported.
- Lives in: `apps/frontend/src/lib/theme/palettes.ts`, `apps/frontend/src/lib/theme/themePrefs.ts`, `apps/frontend/src/components/portal/ThemeSection.tsx`, accent CSS variables in `apps/frontend/src/index.css` + `apps/frontend/tailwind.config.ts`
- Backed by: DEC-066, DEC-110, REQ-044, REQ-089

## UI motion & feedback

- Status: shipped
- Summary: A broadened, app-wide decorative-motion and visual-feedback baseline across the full staged flow (game context, zone confirmation, zone collection, enrichment) and the answered/conversation view — micro-transitions, easing, hover/press/focus states, entrance/exit transitions, and add/remove/success/error state-change cues. CSS-based (no animation library), honors `prefers-reduced-motion`, performance-safe, and changes no behavior, contract, stack ordering, or scan-engine logic. Extends the existing functional wait-state motion (`AskAiWaitingPanel`, inline follow-up spinner); the scan camera convergence UI is excluded.
- Lives in: shared motion tokens/utilities in `apps/frontend/src/index.css`; staged-flow surfaces in `apps/frontend/src/App.tsx` and `apps/frontend/src/components/{StagedStepHeader,ZoneConfirmStep,ZoneCollectionStep,ZoneCardPicker,CardSelectionPreview,EnrichmentStep,CardPresentation}.tsx`; answered-view surfaces in `apps/frontend/src/components/{ConversationThread,FrozenContextSummary}.tsx`
- Backed by: DEC-079, REQ-059, NFR-006, FLOW-001, FLOW-002, FLOW-006

## Mock-mode banner

- Status: shipped
- Summary: Persistent, non-dismissible banner shown at the top of every screen when the app is built/run with the mock AI provider. The mock/live signal is build-time configuration-driven from the single `ASK_AI_PROVIDER` source of truth — `vite.config.ts` bridges `process.env.VITE_ASK_AI_PROVIDER ?? process.env.ASK_AI_PROVIDER` into the client as `import.meta.env.VITE_ASK_AI_PROVIDER`, and `env.ts` resolves it to the `isMockProvider` boolean (mirroring the `resolveDebugLoggingEnabled` pattern; never inferred from `DEV`/`MODE`/`NODE_ENV`/host/answer text, never throws on unknown values). `MockModeBanner` mounts once in `PageShell`, so it covers the empty/home state, all four staged steps, and the answered/conversation view; `PageShell` applies a conditional top-offset (`data-mock-banner`) so the fixed banner never obscures the header, and the banner sits below the feature-portal Menu's z-index. Static, high-contrast, CSS-only (no motion), presentation only — no backend endpoint, ask-AI contract, or mock-response-content change.
- Lives in: `apps/frontend/vite.config.ts` (define bridge), `apps/frontend/src/lib/env.ts` (`resolveIsMockProvider` + `isMockProvider`), `apps/frontend/src/components/MockModeBanner.tsx`, `apps/frontend/src/components/PageShell.tsx` (mount + offset), `apps/frontend/src/index.css` (`.mock-mode-banner` + `data-mock-banner` offset)
- Backed by: DEC-085, REQ-063, NFR-006, DEC-020, DEC-017

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
- Summary: Submit orchestration that freezes context and carries conversation history, with a conversation thread UI and retry/cooldown.
- Lives in: `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`, `components/ConversationThread.tsx`
- Backed by: DEC-038, DEC-039, DEC-040, DEC-041, REQ-027

### Submit orchestration (context freeze + history)

- Status: shipped
- Summary: Freezes the game context on first submit and threads conversation history into follow-up requests.
- Lives in: `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- Backed by: DEC-038, DEC-039

### Conversation thread UI

- Status: shipped
- Summary: Renders the multi-turn conversation thread.
- Lives in: `apps/frontend/src/components/ConversationThread.tsx`
- Backed by: DEC-040

### Frozen context summary

- Status: shipped
- Summary: Read-only compact frozen game-context summary shown above the conversation thread in the answered state, with a disclosure that expands full setup, zone, card, and enrichment detail.
- Lives in: `apps/frontend/src/components/FrozenContextSummary.tsx`
- Backed by: REQ-025, DEC-040

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

- Status: planned
- Summary: Offline build that emits the committed, printing-level USD price artifact from the Scryfall bulk source for the Trade Balancer — per printing `usd`/`usd_foil` plus set/collector/image, indexable by oracle and printing id, with a snapshot date; static snapshot, human-approved refresh, lazy-loaded on first Trade Balancer open. Decided/docs-only, no code under `scripts/` yet.
- Lives in: (planned) new `scripts/build-card-printing-prices.mjs` (or equivalent) → `apps/frontend/public/data/cardPrintingPrices.json`
- Backed by: DEC-088, REQ-066, NFR-013

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
- Lives in: `.github/workflows/deploy-aws.yml`, `scripts/aws-{bootstrap,deploy}.sh`, `scripts/package-lambda.sh`, `apps/backend/src/lambda.ts`, `docs/aws/`
- Backed by: DEC-084, GOAL-003, NFR-003, NFR-004

### Serverless hosting

- Status: shipped
- Summary: Serves the static frontend from a private S3 origin through CloudFront and the backend from Lambda through a public Function URL, without a custom domain.
- Lives in: `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`, `apps/backend/src/lambda.ts`
- Backed by: DEC-084, NFR-004

### Production secrets and deployment identity

- Status: shipped
- Summary: Loads the OpenAI key from an SSM SecureString once per Lambda container and deploys from GitHub through OIDC with no static AWS credentials.
- Lives in: `apps/backend/src/runtime/loadOpenAiKeyFromSsm.ts`, `.github/workflows/deploy-aws.yml`, `scripts/aws-bootstrap.sh`
- Backed by: DEC-020, DEC-084, NFR-003

### Deploy and cost guardrails

- Status: shipped
- Summary: Gates every main-branch deploy on `quality:check`, caps Lambda concurrency when the account quota permits, retains the account limit as the fallback cap, and configures a low monthly AWS Budget alert.
- Lives in: `.github/workflows/deploy-aws.yml`, `scripts/aws-bootstrap.sh`
- Backed by: DEC-084, NFR-004

## Quick Lookup

- Status: shipped
- Summary: Unified short-form MTG Ask AI destination for a freeform rules question with an optional single card resolved by typed search or camera scan. It uses the additive `mode: "lookup"` branch on `POST /api/ask-ai`, always runs question-driven rules retrieval, layers in card metadata/rulings when a card is attached, omits staged-game sections, and reuses the shared conversation thread, follow-up, retry, and start-over behavior. The empty state includes a collapsed, fully local six-topic rules disclosure generated from the curated rules corpus.
- Lives in: `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`, `apps/frontend/src/components/portal/destinationRegistry.tsx`, `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`, `apps/frontend/public/data/gameRulesCoreTopics.json`, `apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/prompt/`, `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/src/eval/fixtures/quick-lookup-*`, `scripts/build-game-rules.mjs`
- Backed by: DEC-106, DEC-107, DEC-108, REQ-072, REQ-073, REQ-074, REQ-075, REQ-079, FLOW-011

## Trade balancer

- Status: planned
- Summary: Standalone, frontend-only, ephemeral two-sided card-value comparison. Each side is a list of card entries built via scan or manual search; each entry resolves to a specific printing (editable on scans, picked after name-match on manual search), with a foil toggle (non-foil ↔ `usd_foil`), a quantity/multiples, and one-tap removal. Side total = `Σ qty × (foil ? usdFoil : usd)`; the view shows each side's total and the live difference. Missing prices default to $0 with a distinct color + caution-triangle indicator. Decided/docs-only, no code under `apps/` yet.
- Lives in: (planned) new Trade Balancer view + entry model under `apps/frontend/src/`, reusing the scan resolver (`lib/scan/resolveScanCandidates.ts`) and manual search (`lib/search.ts`); consumes the printing-price artifact `apps/frontend/public/data/cardPrintingPrices.json`. The `feature-portal` mount slot exists (`apps/frontend/src/components/portal/TradeBalancerPlaceholder.tsx`), but as of 2026-08-02 it is not registered in `apps/frontend/src/components/portal/destinationRegistry.tsx` — the placeholder was hidden from the menu to avoid exposing a coming-soon dead end (`receipts/adhoc-2026-08-02.md`). Re-add a `trade-balancer` entry there, swapping the placeholder's render for the real view, when this feature ships.
- Backed by: DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, NFR-013, FLOW-009

## Feature portal (app navigation)

- Status: shipped
- Summary: First-class **feature-portal** package that owns top-level navigation chrome: one icon-only Menu button in the **top-middle** opens a dropdown of registered destinations plus the palette/density **Theme** section. Registered destinations: **In-Depth Question** (the `mtg-assistant` staged flow, formerly labeled "MTG Assistant") and **Quick Question** (the `quick-lookup` flow, formerly labeled "Quick Lookup"); labels relabeled 2026-08-02 to lead with each flow's depth/effort rather than internal naming (`receipts/adhoc-2026-08-02.md`) — destination ids and component names are unchanged. Trade Balancer is built as a coming-soon placeholder but, as of 2026-08-02, is not registered as a destination — hidden from the menu until the real feature ships. The Theme section's density control uses **Desktop / Mobile** labels (internal values unchanged: `"chunky"` / `"slim"`); Mobile is the default as of 2026-08-02 (was Desktop). Frontend-only view switch preserves each mode's in-session state; no persistence across reload and no backend/contract change. The button portals through `PortalSlot` into each staged-flow header and the answered/conversation header, hanging flush from `.page-card`'s top border and scrolling with the page; the viewport-fixed path remains a defensive fallback for destinations without a header slot, not for the answered/conversation view. The retired standalone top-right theme control no longer competes for mobile header space.
- Lives in: `apps/frontend/src/components/portal/` (`FeaturePortalMenu.tsx`, `ThemeSection.tsx`, `PortalSlot.tsx`, `DestinationOutlet.tsx`, `destinationRegistry.tsx`, `MtgAssistantApp.tsx`, `quick-lookup/QuickLookupApp.tsx`, `TradeBalancerPlaceholder.tsx`), `apps/frontend/src/lib/portal/` (`types.ts`, `slotContext.tsx`), `apps/frontend/src/components/{StagedStepHeader,EnrichmentStep}.tsx` (inline slots), `apps/frontend/src/App.tsx` (shell + theme state wiring), `apps/frontend/src/index.css` (motion + `.portal-slot-tab` positioning)
- Backed by: DEC-089, DEC-095, DEC-109, DEC-110, REQ-067, REQ-089, FLOW-001, FLOW-010, NFR-001

## Feedback & bug report

- Status: planned
- Summary: Frontend-only feedback + bug-report feature. A **Send feedback** portal **action entry** (a new registry entry kind alongside destinations) opens an accessible modal over the current screen — category (Bug/Suggestion/Other), required message, optional reply email — plus a **disclosed app-state snapshot** (screen/step, game context + typed question, zones/cards/enrichment, conversation history, provider mode, active destination, environment) surfaced as a one-line disclosure + expandable summary. Delivered to the owner's inbox via **Formspree** with a **public form id** (`VITE_FEEDBACK_FORMSPREE_ID`); the snapshot rides as one JSON-stringified field. No backend route, no secret, no contract change; graceful no-op when no form id is configured. Deferred: screenshots/file uploads, persistence, auth, history, analytics.
- Lives in: planned under `apps/frontend/src/components/portal/` (portal action-entry registry extension) and a new feedback module (`FeedbackModal`, `useFeedbackForm`, `buildFeedbackContext()`, `submitFeedback()`); `apps/frontend/.env.example` (`VITE_FEEDBACK_FORMSPREE_ID`) — no code under `apps/` yet
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
