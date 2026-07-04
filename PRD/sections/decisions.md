# decisions.md

This is the **decisions router** — precedence #1 and Read-First #1 in every
workflow. Decision bodies no longer live in this file; they live verbatim in
the per-domain files under `sections/decisions/`. This file holds only the
precedence/lifecycle preamble below and the DEC-ID index table.

## How to resolve a DEC

1. Find the DEC-ID in the index table below.
2. Open the named domain file under `sections/decisions/`.
3. Read the full body there (`### DEC-XXX` through its `Notes:`).

Cross-references to a DEC-ID elsewhere in the PRD (e.g. "supersedes DEC-022")
stay as plain `DEC-XXX` text; resolve them the same way, via this index.

## Lifecycle

- New decisions land in their domain file under `sections/decisions/` and get
  one new row in the index table below.
- Fully-superseded decision bodies trim to a one-line tombstone, kept in their
  domain file so the ID stays resolvable; they are not deleted.
- Deep "how the code behaves" detail belongs in `system-map/` detail files
  (DEC-044 / DEC-048), not in a decision's `Impact:` block.

See `instructions/doc-lifecycle.md` for the authoritative lifecycle rule.

## Index

| DEC-ID | Domain file | Decision |
|---|---|---|
| DEC-001 | `decisions/framing.md` | The core product is a rules assistant that helps players navigate MTG rules, not an official judge or deterministic rules engine. (Label updated by DEC-080.) |
| DEC-002 | `decisions/framing.md` | The product is an assistant, not an authoritative judge. |
| DEC-003 | `decisions/game-context-model.md` | The selected-cards-only capture model is superseded by the approved `GameContext` model. |
| DEC-004 | `decisions/capture-and-stack.md` | Stack ordering is bottom-to-top in the array, with `stack[0]` as bottom and the last item as top. |
| DEC-005 | `decisions/capture-and-stack.md` | The newest added card is appended to the end of the array and becomes the top of the stack. |
| DEC-006 | `decisions/capture-and-stack.md` | If `stack.length === 0`, the add button text is **Begin stackening!**; otherwise it is **Add to Stack**. |
| DEC-007 | `decisions/capture-and-stack.md` | Duplicate stack cards are blocked as an intentional constraint. |
| DEC-008 | `decisions/capture-and-stack.md` | The stack is capped at 10 cards in the core product. |
| DEC-009 | `decisions/capture-and-stack.md` | Blank questions fall back to **Resolve the stack** in request-building logic. |
| DEC-010 | `decisions/providers-and-contract.md` | The core product uses one main product-facing backend endpoint. |
| DEC-011 | `decisions/providers-and-contract.md` | The old staged provider rollout is superseded by explicit provider modes. |
| DEC-012 | `decisions/providers-and-contract.md` | The core product uses a static prebuilt metadata file committed with the app. |
| DEC-013 | `decisions/framing.md` | The backend must not implement legality validation, deterministic rules simulation, board-state logic, or format enforcement in the core product. |
| DEC-014 | `decisions/providers-and-contract.md` | AI failures preserve stack, question, and previous successful response, and expose a retry button with a 13-second cooldown. |
| DEC-015 | `decisions/capture-and-stack.md` | The empty-state search input should say **Type to begin** before the user types. |
| DEC-016 | `decisions/providers-and-contract.md` | AI failure copy should use the phrase **Miho is working on it**. |
| DEC-017 | `decisions/providers-and-contract.md` | Mock provider responses should return the outbound request payload as a debug-friendly JSON-formatted string inside the `answer` field. |
| DEC-018 | `decisions/capture-and-stack.md` | Stack details should show thumbnails when available, but continue to work without them. |
| DEC-019 | `decisions/game-context-model.md` | Structured context beyond stack/question is approved for flow validation. |
| DEC-020 | `decisions/providers-and-contract.md` | Live answer generation uses an explicit backend provider flag with OpenAI behind the existing provider interface; HTTP contracts stay frozen across provider swaps. |
| DEC-021 | `decisions/game-context-model.md` | `GameContext` is the parent model for prompt-facing game state. |
| DEC-022 | `decisions/game-context-model.md` | Turn phase uses the v1 enum `untap`, `upkeep`, `draw`, `main_1`, `combat`, `main_2`, `end_step`, `cleanup`, and `stack_resolving`. |
| DEC-023 | `decisions/game-context-model.md` | Zone confirmation is user-controlled and seeded by phase defaults. |
| DEC-024 | `decisions/game-context-model.md` | Submit requires at least one card in at least one selected zone, and empty zones are omitted from the request payload. |
| DEC-025 | `decisions/prompt-assembly.md` | Every AI prompt includes the MTG reference block and a merged zone scope sentence. |
| DEC-026 | `decisions/game-context-model.md` | `ContextTarget` replaces `StackTarget`. |
| DEC-027 | `decisions/game-context-model.md` | Optional player display names are UI- and prompt-facing labels layered over fixed `PlayerLabel` identity. |
| DEC-028 | `decisions/capture-and-stack.md` | Blank-question fallback is zone-aware. |
| DEC-029 | `decisions/rules-retrieval.md` | Published WotC Oracle rulings may enrich backend prompts for submitted cards without changing the product API or UI. |
| DEC-030 | `decisions/rules-retrieval.md` | Backend prompts include a curated library of verbatim WotC Comprehensive Rules excerpts on every request, without changing the product API or UI. |
| DEC-031 | `decisions/conversation-ux.md` | Decrypt wait UX uses a pure frontend animated panel with CSS-only motion, a live elapsed timer, and threshold-based escalating messages. |
| DEC-032 | `decisions/rules-retrieval.md` | Backend prompts include up to 5 supplemental WotC Comprehensive Rules excerpts per request, dynamically retrieved from a committed rule index artifact, deduplicated against the curated baseline manifest. |
| DEC-033 | `decisions/providers-and-contract.md` | The mock provider may return optional debug sidecar fields on `POST /api/ask-ai` success responses; the OpenAI provider and frontend contract remain `{ answer }` only. |
| DEC-034 | `decisions/game-context-model.md` | `stack_resolving` is removed from the `TurnPhase` enum; the default turn phase on the game setup screen is `main_1`. |
| DEC-035 | `decisions/game-context-model.md` | Phase zone defaults are trimmed to 2 zones per phase; empty phase-defaulted zones are excluded from the payload and LLM context. |
| DEC-036 | `decisions/prompt-assembly.md` | Every backend prompt includes a `PHASE GUIDANCE` block positioned between `GENERAL GAME CONTEXT` and the zone sections, with phase-specific and combat-sub-step-specific reasoning instructions. |
| DEC-037 | `decisions/game-context-model.md` | `combatStep` is an optional structured field on `GameContext`; a combat sub-step selector appears inline in the frontend when `turnPhase === "combat"` and defaults to `declare_blockers`. |
| DEC-038 | `decisions/conversation-ux.md` | `POST /api/ask-ai` may accept an optional `conversationHistory` field on follow-up turns; success and error response shapes remain unchanged. |
| DEC-039 | `decisions/conversation-ux.md` | Follow-up conversation history is client-side ephemeral only; no server-side session store, no persistence across page reloads. |
| DEC-040 | `decisions/conversation-ux.md` | Game context is frozen after the first successful decrypt for the duration of the in-session conversation; follow-up turns are text-only in v1. |
| DEC-041 | `decisions/conversation-ux.md` | Follow-up submit UX is inline within the chat composer; `AskAiWaitingPanel` is not shown for follow-up turns. |
| DEC-042 | `decisions/prompt-assembly.md` | Backend prompt assembly must include full card metadata (including oracle text) for every submitted card in every populated zone, not only stack items. Empty oracle text renders as `(none) — no oracle text recorded for this card`. Prompt-size and truncation constants are raised to effectively unlimited test values via a shared `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` constant; diagnostic and enforcement infrastructure is preserved. |
| DEC-043 | `decisions/game-context-model.md` | `gameStateNotes` is a single freeform optional string on `GameContext`, not structured sub-fields per feedback category. |
| DEC-044 | `decisions/doc-process.md` | Adopt a durable feature/subsystem catalog at `sections/system-map.md` so the truth layer states what is built, how it behaves at a glance, and where it lives — without re-deriving behavior from code. |
| DEC-045 | `decisions/rules-retrieval.md` | System 2 curated game-rules baseline uses an always-on core plus card-agnostic game-state-gated topic expansion, replacing inclusion of all curated topics on every request. |
| DEC-046 | `decisions/rules-retrieval.md` | System 3 supplemental rule retrieval uses relevance-aware lexical scoring with IDF weighting, question boost, keyword boost, and an improved tie-break, replacing DEC-032's flat +1-per-shared-word formula. |
| DEC-047 | `decisions/rules-retrieval.md` | The eval harness verifies game-rules retrieval relevance using labeled expected outcomes for System 2 topic selection and System 3 supplemental rule recall. |
| DEC-048 | `decisions/doc-process.md` | The deep per-subsystem behavior layer deferred by DEC-044 lives as separate detail files under `PRD/sections/system-map/`, one file per catalog subsystem, each linked from the catalog by an optional `Details:` field and written to a fixed lightweight template. |
| DEC-049 | `decisions/providers-and-contract.md` | Live LLM response-size diagnostics are log-only statistics computed from the returned answer text; they are not prompt input, product answer text, frontend UI, or response sidecars. |
| DEC-050 | `decisions/scanning.md` | Camera card scanning is an optional, separately-scoped, frontend-only alternate input path into existing zone card fields — not a replacement for manual search and not part of the core product loop. |
| DEC-051 | `decisions/scanning.md` | The card-art perceptual-hash "recipe" (64×64 resize + DCT hash) is implemented once in TypeScript as the single authoritative module, used both on-device at scan time and by TheJudge's own offline build that generates the fingerprint library (`cardhashes.bin`); TheJudge owns and refreshes the library via the existing data pipeline. |
| DEC-052 | `decisions/scanning.md` | The scanner opens a camera screen with continuous auto-scan plus an always-available manual tap-to-capture fallback, runs a batch accept-and-rescan loop per zone, and handles card backs and low-confidence results without leaving the camera or calling the backend. |
| DEC-053 | `decisions/scanning.md` | Scan matches are art-level (printing-level) and resolve through `Scryfall printing id → oracle_id → existing CardMetadataItem`; the engine returns a ranked candidate list, duplicate oracle ids collapse to one candidate by best distance, and unresolvable candidates are dropped. |
| DEC-054 | `decisions/scanning.md` | The fingerprint-library build (`cardhashes.bin`) becomes resumable and budget-bounded by **default** ("bin-as-memory, hash-and-discard"): the no-flag run resumes from the existing bin and downloads only what is missing, so the full gameplay-card corpus can be fingerprinted across many short runs without ever retaining the full image corpus. A full from-scratch rebuild is opt-in via `--fresh` and is **non-destructive** — it writes a new file and never deletes or overwrites the live bin. |
| DEC-055 | `decisions/scanning.md` | The live scanner converges via a temporal lock-in control layer rather than streaming a fresh ranked list every frame, and card-back detection is descoped from the shipped scan UX (no canonical card-back reference asset is available). This refines DEC-052's capture/batch UX; it does not supersede it. |
| DEC-056 | `decisions/scanning.md` | A confident scan lock auto-adds the card to the current zone with no tap and immediately resumes scanning for the next card, replacing the one-tap Accept gate. Lock thresholds are tuned strict so that lock genuinely means "this is the card," and correctness is biased hard toward a false-negative (keep searching) over a false-positive (wrong auto-add). |
| DEC-057 | `decisions/scanning.md` | The scan screen shows a live three-state convergence indicator (`searching` -> `locking` -> `locked`) driven by an additive, pure progress signal from the stabilizer, replaces the selectable candidate list with a single non-selectable "locking on" indicator, removes the raw status-string leaks, and plays positive visual confirmation feedback (a thumbs-up popup that fades out) on each successful auto-add. Audio confirmation (a "ding" + mute toggle) is split out of this decision and realized separately by DEC-061 / REQ-042. |
| DEC-058 | `decisions/scanning.md` | The scan screen shows a scanned-cards review control (a counter bubble in the top-right) that expands to list the cards added to the current zone during this scan session, each with a single-tap remove. Removal has no confirmation step. |
| DEC-059 | `decisions/scanning.md` | Rebalance the auto-add lock gate toward ease-of-lock, treating one-tap removal (DEC-058) as the safety net rather than holding the lock bar high enough that a wrong card is essentially never auto-added. |
| DEC-060 | `decisions/scanning.md` | The scan screen offers an optional, user-toggleable debug overlay (default off, reset each time the scanner is opened) that visualizes how the scanner is perceiving the current card — a live outline of the detected card region and the area it actually reads, plus the live match/convergence metrics — drawn read-only from existing detector/stabilizer signals. |
| DEC-061 | `decisions/scanning.md` | Each successful scan auto-add plays a short audio "ding", on by default, with a mute toggle on the scan screen; muting suppresses the sound only and never the visual thumbs-up confirmation. This realizes the audio half deferred out of DEC-057. |
| DEC-062 | `decisions/scanning.md` | Scan robustness under real-world capture conditions is achieved by feeding the existing, unchanged matching engine a cleaner, better-chosen query image — via extended query-only frame conditioning, best-frame selection in the stabilizer window, and condition-aware feedback — without changing the perceptual-hash recipe, the fingerprint library, the matching/distance logic, or the lock gate as the primary lever. This refines DEC-052/DEC-055/DEC-056/DEC-057/DEC-059/DEC-060; it supersedes none of them. |
| DEC-063 | `decisions/doc-process.md` | `PRD/sections/decisions.md` is split into a thin router/index plus per-domain decision files under `PRD/sections/decisions/`, organized by topic/subsystem (not by flow stage). The router keeps the `decisions.md` path and the precedence/lifecycle preamble, plus a `DEC-ID → domain file → one-line summary` table; decision bodies move verbatim into nine topic files. DEC-IDs stay globally unique and resolvable across files. |
| DEC-064 | `decisions/doc-process.md` | TheJudge workflow skills use shared, user-tunable output-verbosity guidance so session responses can be lean, standard, or detailed without changing the work each skill performs. |
| DEC-065 | `decisions/scanning.md` | The scanned-cards review/remove control keeps the top-right scan-screen position; the debug overlay toggle must live in a separate non-overlapping scan control area so both controls remain independently tappable. |
| DEC-066 | `decisions/personalization.md` | Theme customization uses a global frontend-only palette control with predefined swatches and browser-local persistence. |
| DEC-067 | `decisions/personalization.md` | Staged data-collection screens present the active step name inline to the right of the brand block as a single header row, not stacked below it. |
| DEC-068 | `decisions/personalization.md` | DEC-066's single-color palette is broadened in reach — remaining accent surfaces, semantic green states, and the scanner UI adopt the existing palette tokens; the page background is neutralized to slate, not palette-tinted. Refines DEC-066. |
| DEC-069 | `decisions/scanning.md` | The scan fingerprint corpus targets every paper gameplay printing with distinct artwork (including non-English-only alt-art), keeps Scryfall Default Cards as the source, audits the gameplay filter so legitimate art is not dropped, and makes coverage measurable; the only scan-robustness lever that may touch the data-build. Refines DEC-051/DEC-054. |
| DEC-070 | `decisions/scanning.md` | A scanned card displays the specific printing's art that was scanned by carrying the printing-level image as presentation only into the scan preview and the added `ZoneCardItem`, while oracle-level identity, prompt, and rulings stay unchanged. Refines DEC-053/REQ-036. |
| DEC-071 | `decisions/providers-and-contract.md` | The card-metadata build biases the representative printing per oracle id toward a standard paper printing (demoting Secret Lair, promos, funny sets, and special-frame treatments) before the most-recent tiebreak, for the typed-search path only. Refines DEC-012. |
| DEC-072 | `decisions/scanning.md` | Real-world detector robustness raises `detector.ts` recall **regression-first** (identify/revert the recent change that degraded the previously-working hand-held case, plus loosened/adaptive gates, foil-tolerant edge sourcing, clutter-resistant selection, low-contrast-border fallback) with the stabilizer lock gate as the precision guard, validated by detect-then-lock on **committed real on-device frames + on-device** (synthetic fixtures are necessary-not-sufficient); the Region A recipe and `CARDHSH1` bin stay frozen. Refines DEC-052/DEC-055; complements DEC-062/DEC-069; extended by DEC-073. |
| DEC-073 | `decisions/scanning.md` | The on-screen card-shaped framing guide becomes a detection prior (selection biased toward the reticle region the user aligns to, so off-guide background clutter stops competing) plus condition-aware capture guidance (fill the guide, flat surface, fingers off edges); recall/selection lever only, no identity-gate or recipe/bin change. Extends DEC-072; complements DEC-057/DEC-062. |
| DEC-074 | `decisions/scanning.md` | The scanner requests a higher-resolution camera capture mode (+ continuous autofocus, graceful `ideal` fallback) instead of the unconstrained 640×480 default, so the warp reads a sharper source and cards lock across a wider distance/light range; capture-quality lever upstream of the frozen recipe/bin/identify/lock boundary, with a positive in-zone "hold steady" cue and `tuning.ts` recalibration. Complements DEC-062/DEC-072/DEC-073. |
| DEC-075 | `decisions/personalization.md` | Layout density customization uses a global Chunky / Slim control in the theme panel with browser-local persistence; chunky is the default and a visual no-op versus pre-change spacing. |
| DEC-076 | `decisions/personalization.md` | Staged-flow presentation compaction: game-context layout, zone card grid, enrichment list scroll cap, and scan-focused zone-collection chrome; zone confirmation excluded. |
| DEC-077 | `decisions/scanning.md` | Scanner acquisition tuning is diagnostic-first and validated against two capture conditions — Mac-webcam baseline and stand-assisted controlled setup — while preserving one scanner behavior path and the frozen matching/lock precision boundary. |
| DEC-078 | `decisions/personalization.md` | Card containers in zone collection, scan review, and enrichment use responsive image-first presentation, on-demand local metadata, and restrained rings derived from existing card colors. |
| DEC-079 | `decisions/ui-presentation.md` | The app adopts a broadened, app-wide decorative-motion and visual-feedback baseline across the full staged flow and answered view (CSS-only, reduced-motion-aware, performance-safe, no library), excluding scan camera internals; amends NFR-006 and the "animation-heavy UI" non-goal. |
| DEC-080 | `decisions/framing.md` | Retire the "flow-validation" product label for a "rules assistant" framing and update lifecycle status from validating to refining toward a first production deployment; preserves DEC-001/002/013 scope guardrails and replaces GOAL-003. |
| DEC-081 | `decisions/personalization.md` | REQ-060's closed minimum surface inventory uses restrained theme-palette accents at rest and stronger accents on hover/focus/current states, while all other static chrome, card-identity rings, and tuned scanner motion retain their existing treatment. |
| DEC-082 | `decisions/capture-and-stack.md` | Each `ZoneCardItem` carries a stable frontend-only `instanceId` assigned at add time; UI keys, removal, and per-instance enrichment edits key on `instanceId` so duplicate non-stack cards are independently removable/editable, while `cardId` stays the oracle identity and `instanceId` is stripped before the request so the backend contract is unchanged. |
| DEC-083 | `decisions/scanning.md` | While scanning, an always-on positive alignment outline is drawn on the detected card whenever the stabilizer is in the `locking` state, reusing the detector's 4-corner geometry (DEC-060) and the existing `locking` trigger (DEC-057) — outline only, no new threshold, no debug metrics, no toggle, no match-logic change. Refines DEC-057. |
| DEC-084 | `decisions/deployment.md` | Production uses an AWS serverless deployment on AWS-provided URLs, with live OpenAI credentials loaded from SSM, quality-gated GitHub OIDC deploys, and explicit cost/scale guardrails. |
