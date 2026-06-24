# Scanning decisions

Camera card scanning: identification engine, fingerprint library, lock-in UX, and robustness tuning.

### DEC-050
- Decision: Camera card scanning is an optional, separately-scoped, frontend-only alternate input path into existing zone card fields — not a replacement for manual search and not part of the core product loop.
- Status: confirmed
- Context: `goals-and-non-goals.md` previously listed camera scanning as an Explicit Non-Goal and Intentional Constraint, and `NFR-008` framed it as future-only and not in the core product. A friend exported a proven, self-contained on-device art-identification engine (Cardomancer), making scanning feasible now as a convenience input. Typed-only card entry (`FLOW-001` step 3) is slow at a live table and discourages players from feeding a complete board before asking, weakening prompt context. This decision reframes scanning from out-of-scope to a scoped optional feature; it does not change the flow-validation core-product framing (`GOAL-001..003`).
- Impact:
  - scanning reuses the existing select → preview → add → owner → duplicate-block → stack-limit path and produces the same `ZoneCardItem` output as manual add
  - scanning is frontend-only and makes zero network calls at identification time
  - no change to `AskAiRequest`, `GameContext`, prompt assembly (`buildPromptContext`/`buildPromptText`), provider boundary, or any product-facing endpoint
  - manual card search remains the default input and a permanent fallback
  - supersedes the "camera scanning is out of scope" non-goal/constraint in `goals-and-non-goals.md`; realizes the `NFR-008` "leave room for future scanning" intent
  - shipped-vs-planned signal lives in `system-map.md` (entry starts `planned`)
- Related requirements:
  - REQ-034
  - REQ-035
  - REQ-036
  - REQ-037
  - REQ-038
  - NFR-010
- Notes:
  - art-only identification yields a ranked candidate list, not a definitive printing (DEC-053)
  - does not introduce duplicate-card support (inherits `FLOW-004` block) or manual reorder (`FLOW-002`)

### DEC-051
- Decision: The card-art perceptual-hash "recipe" (64×64 resize + DCT hash) is implemented once in TypeScript as the single authoritative module, used both on-device at scan time and by TheJudge's own offline build that generates the fingerprint library (`cardhashes.bin`); TheJudge owns and refreshes the library via the existing data pipeline.
- Status: confirmed
- Context: Perceptual-hash matching only works if the hasher and the database builder use an identical resize+hash, or distances silently shift and matching degrades with no error. The friend's reference built the database with PIL Lanczos. Rather than depend on a second image stack matching it (or on the friend re-exporting the library), TheJudge uses one TS implementation on both sides, making parity true by construction. This fits the repo "single authoritative definition / reuse before creating" rule and the "no runtime metadata sync" constraint.
- Impact:
  - one TS module owns resize + DCT perceptual hash; both the on-device scanner and the build step import it (no FE↔build duplication)
  - golden parity vectors are regenerated from the TS recipe and used as the byte-exact regression gate (REQ-034)
  - TheJudge generates `cardhashes.bin` + a manifest from Scryfall images during a build/refresh step; no dependence on an externally prebuilt database
  - identification never fetches Scryfall or card images at runtime; the library is a lazy-loaded static artifact (REQ-035, NFR-010)
  - card-image download for the build requires explicit human approval before the command runs (same policy as Scryfall/CR refresh)
  - supersedes the SOURCE-ANALYSIS "consume a prebuilt DB first" recommendation
- Related requirements:
  - REQ-034
  - REQ-035
  - NFR-010
- Notes:
  - canonical constants, parity gotchas, and DB format are in `PRD/work/cardomancer-card-detection-summary/SOURCE-ANALYSIS.md` and the friend's `SPEC.md`

### DEC-052
- Decision: The scanner opens a camera screen with continuous auto-scan plus an always-available manual tap-to-capture fallback, runs a batch accept-and-rescan loop per zone, and handles card backs and low-confidence results without leaving the camera or calling the backend.
- Status: confirmed
- Context: Scanning is meant to speed batch context capture at a live table. A single deliberate shot is reliable; continuous auto-scan is faster when it works; combining them gives speed with a reliable fallback. Unhappy paths must never strand the user, who can always fall back to manual search.
- Impact:
  - camera shows a card-shaped guide overlay; auto-scans continuously; a manual capture button is always available
  - on a candidate, the user taps Accept to add the card to the current zone via the existing add path; the camera immediately re-opens to scanning for the next card
  - a Back/Exit control closes the camera and returns to zone collection
  - a detected card back shows "Flip the card over" (not a generic no-match)
  - on low confidence, scanning continues and manual capture stays available; after a few consecutive low-confidence attempts a non-blocking prompt offers manual name entry (existing search) without stopping the scan
  - stack cards land in scan order, bottom-to-top; manual reorder remains out of scope (`FLOW-002`)
  - the "few attempts" count, detector area fractions, and confidence/card-back thresholds are calibration constants validated by outcome (detect-rate / top-1 accuracy), not product open questions
- Related requirements:
  - REQ-037
  - REQ-038
- Notes:
  - first implementation may land manual tap-capture before continuous auto-scan; the target experience is both (map-out sequences this)

### DEC-053
- Decision: Scan matches are art-level (printing-level) and resolve through `Scryfall printing id → oracle_id → existing CardMetadataItem`; the engine returns a ranked candidate list, duplicate oracle ids collapse to one candidate by best distance, and unresolvable candidates are dropped.
- Status: confirmed
- Context: Reprints share artwork, so an art hash identifies an illustration, not a single printing — several printings can match near-identically. TheJudge's gameplay/prompt identity is oracle-level (`CardMetadataItem.cardId` is the oracle id). A printing-level scan result must therefore be bridged to oracle-level metadata rather than forced into zone/prompt state as a printing id.
- Impact:
  - the engine output contract is a ranked candidate list (best first), not a single answer
  - a build-time printing-id → oracle-id bridge artifact maps each match to an oracle id, then to the committed `CardMetadataItem`
  - candidates with the same oracle id collapse to one, keyed by best (lowest) distance; candidates that do not resolve to committed metadata are dropped
  - resolved candidates feed the existing picker preview exactly like typed suggestions; downstream zone/prompt identity stays oracle-level and unchanged
  - the bridge artifact is static and committed (consistent with `cardMetadata.json`); identity resolution makes no runtime network call
- Related requirements:
  - REQ-034
  - REQ-036
- Notes:
  - printing-level identity is not pushed into `ZoneCardItem`, prompt context, or rulings lookup

### DEC-054
- Decision: The fingerprint-library build (`cardhashes.bin`) becomes resumable and budget-bounded by **default** ("bin-as-memory, hash-and-discard"): the no-flag run resumes from the existing bin and downloads only what is missing, so the full gameplay-card corpus can be fingerprinted across many short runs without ever retaining the full image corpus. A full from-scratch rebuild is opt-in via `--fresh` and is **non-destructive** — it writes a new file and never deletes or overwrites the live bin.
- Status: confirmed
- Context: `cardhashes.bin` is built from ~96k Scryfall printing PNGs (~100 GB). The original `build-card-hashes.mjs` path (`buildFromLocalImages`) rewrote the bin from scratch each run and was all-or-nothing — it threw on the first missing local PNG unless `--download`, never read the existing bin, and clobbered the previous artifact in place — so avoiding re-downloads forced retaining the whole corpus, and any rebuild risked destroying a known-good bin. The real production artifact was deferred in `cardomancer-card-detection-summary` Slice B (REQ-035) precisely because of the corpus-retention cost. Making the resumable, bin-as-memory path the default (it diffs against what is already fingerprinted, downloads only what is missing into a transient path, hashes, and discards immediately) lets the operator kick off one bounded command per morning until coverage is complete, and treating destruction as an explicit, non-destructive opt-in removes the "rebuild deletes my good file" hazard.
- Impact:
  - resumable bin-as-memory build is the **default** (no flag) on `scripts/build-card-hashes.mjs`; a cold start with no existing bin is simply the default running against an empty diff (no special flag needed for a brand-new build)
  - the default build uses the existing (or in-progress partial) `cardhashes.bin` as the record of already-fingerprinted entry ids: it diffs the filtered Scryfall printing ids against the bin, downloads only missing images to a **transient temp path** (never the retained cache dir), hashes each via the shared `recipe.ts` (`cropRegionA` + `phashRegionPacked`, DEC-051 parity preserved), and **deletes each image immediately** after hashing
  - `--fresh` builds from scratch, ignoring the existing bin's contents, and is **non-destructive**: it writes to a separate new output file (default a sibling such as `cardhashes.fresh.bin` + matching manifest) and never deletes or overwrites the live `cardhashes.bin`; it refuses to clobber an existing target file unless the operator explicitly directs it there (`--output <path>` and/or `--force`). Promotion of a fresh build to the live path is a deliberate manual step
  - crash safety: every bin/manifest write (default in-place checkpoint and `--fresh`) is atomic — written to a temp file and renamed into place — so a killed or interrupted run can never corrupt or truncate the live bin
  - two optional, independent, combinable per-run budgets: `--limit N` (stop after N newly fingerprinted entries) and `--max-minutes M` (stop after M wall-clock minutes, finishing the in-flight entry first); either alone, both together (first ceiling reached ends the run), or neither (run to completion). A clean stop always checkpoints before exit
  - checkpointing: a valid partial `cardhashes.bin` + `cardhashManifest.json` is rewritten every K newly hashed entries and on every clean budget-stop, so an interrupted or killed run resumes losslessly next run by diffing against the partial; entries are processed in a stable id order for deterministic, predictable progress
  - per-image downloads are paced for Scryfall politeness — a fixed inter-request delay (~50–100ms per Scryfall's API guideline, with a `--rate-ms` override) plus bounded retry-and-backoff on `429`/`5xx`/network errors honoring `Retry-After`, and the existing `User-Agent` header — so a multi-thousand-image run does not overload Scryfall or get the operator rate-limited; downloads stay sequential (no added concurrency)
  - per-image failure handling: a download/hash failure logs and skips (run continues); the printing stays missing and is retried on the next run, but a sidecar skip-list artifact (`apps/frontend/public/data/cardhashSkiplist.json`) tracks per-id attempt counts and **parks** a printing after N failed attempts so a permanently-bad image stops blocking daily progress; only permanent failures (`404`, decode/dimension errors) count toward parking, while transient failures (`429`/`5xx`/network with the retry budget exhausted) are left missing for the next run and do not increment the park counter; parked entries are reported in the run summary and a `--retry-parked` flag re-includes them
  - append-only merge (no pruning of printings removed from a newer bulk; a `--prune` flag is a separate later decision); unsupported `cardhashes.bin` versions are rejected before any rewrite; `<id>`, `<id>__back`, and `_card_back` are distinct diff entry ids
  - npm aliases: `data:scan-fingerprints` runs the default resumable build with a labeled banner ("Building card-scan fingerprint library (cardhashes.bin) — resume + extend") and a progress readout (start and end): total target (filtered gameplay printings), already fingerprinted, done this run, remaining, parked, rough ETA at the current run's rate; `data:scan-fingerprints:fresh` runs the non-destructive `--fresh` rebuild; the prior `data:scan-hashes` alias is reconciled (repointed to `data:scan-fingerprints` or retired) so one name does not mean two behaviors
  - run-it-yourself documentation is a shipped deliverable, not optional: the root `README.md` (under `## Useful Commands` and/or `## Operational References`) and the script `--help` must explain that the default (via `data:scan-fingerprints`) resumes and extends the existing bin and is the normal day-to-day path, that `--fresh` builds from scratch into a new file without touching the live bin, the two budget flags and their combination, the `--rate-ms` pacing and automatic `429`/`5xx` backoff, the resume/checkpoint and atomic-write safety, the skip-list/parking and `--retry-parked`, and the human-approval network posture
  - network posture is unchanged: every run downloads images, so each run is itself the explicit human approval (the operator running the command); no scheduled/automated/CI refresh job is added
  - no change to the shipped artifact format/size (`CARDHSH1` v1, ~14 MB), the runtime scanner, `loadHashDb.ts`, the shared `recipe.ts`, the `dbformat.ts` round-trip, or DEC-051 parity-by-construction; a future recipe/geometry change still forces a full re-download/re-hash
  - checkpoint cadence K, parking-attempt threshold N, and the rate-limit pace (inter-request delay + retry/backoff bounds) are outcome-validated calibration constants (DEC-052 precedent), not product open questions
- Related requirements:
  - REQ-035
  - REQ-039
  - NFR-010
- Notes:
  - extends REQ-035 / DEC-051 (the same TheJudge-owned library and single-recipe parity); does not supersede them
  - this is the maintainable path to actually produce and keep `cardhashes.bin` current after its Slice B deferral
  - related prior exploration: a Codex read-only feasibility pass confirmed `readDb`/`writeDb` round-trip losslessly and the build already hashes via the same `recipe.ts` as runtime

### DEC-055
- Decision: The live scanner converges via a temporal lock-in control layer rather than streaming a fresh ranked list every frame, and card-back detection is descoped from the shipped scan UX (no canonical card-back reference asset is available). This refines DEC-052's capture/batch UX; it does not supersede it.
- Status: confirmed
- Context: The first shipped scanner (`cardomancer-card-detection`) wholesale-replaced the candidate list every auto-scan frame with a near-random top-10, so it visibly "never honed in": the correct card surfaced only occasionally amid churn, and the only auto-accept path (`resolved.length === 1`) effectively never fired. Separately, card-back detection requires a canonical 745×1040 `card_back_reference.png` in the library; that asset does not exist, so `CardIdentifier.isCardBack()` always returned `{ isBack: false }` and the "Flip the card over" UX was inert dead code. Reporter validation on a laptop camera confirmed identification itself works; the defect was convergence/confidence gating around the engine, not the engine.
- Impact:
  - a pure, unit-tested temporal stabilizer votes the top-1 ORACLE identity across a short rolling window and emits `searching` / `locked`; a frame only votes when the best distance is within a tight confidence bound AND beats the runner-up by a margin, so noise dilutes rather than accumulates (`apps/frontend/src/lib/scan/stabilizer.ts`)
  - on lock, auto-scan pauses and the picker presents one confident card for one-tap Add, with Rescan to resume — preserving the DEC-052 accept → re-scan loop while ending the list churn
  - while searching, per-frame candidates are confidence-gated and capped (top 3) as a subdued hint rather than a flooding top-10; the degenerate single-candidate auto-accept is removed
  - detection runs on a downscaled frame and warps from full resolution, raising effective FPS (more votes) and steadying the quad with no engine/geometry/hash change
  - all convergence knobs (window size, vote count, lock distance, margin, surface distance, detect downscale) live in one file (`apps/frontend/src/lib/scan/tuning.ts`) so calibration is a single-file edit
  - card-back detection is removed from the scan-time path: the `isCardBack` hook state, the "Flip the card over" prompt, and the picker wiring + their tests are deleted. The engine method `CardIdentifier.isCardBack()` and the build-side `_card_back` / `hasCardBackReference` support remain in place but dormant, so the feature can be re-enabled by supplying the asset, re-running `data:scan-fingerprints`, and rewiring the UI
- Related requirements:
  - REQ-037
  - REQ-038
- Notes:
  - validated end-to-end on a laptop camera (detection + identification + single-card lock-in); formal NFR-010 device metrics were not separately recorded and some scan UX refinement remains as future work
  - lock-in tuning constants are outcome-validated calibration values (DEC-052 precedent), not product open questions
  - **Superseded in part (DEC-056):** the "one confident card is presented for one-tap Add with Rescan" lock behavior is replaced by auto-add on a high-confidence lock; the lock-in/convergence mechanism this decision introduces is unchanged and is the foundation DEC-056 builds on

### DEC-056
- Decision: A confident scan lock auto-adds the card to the current zone with no tap and immediately resumes scanning for the next card, replacing the one-tap Accept gate. Lock thresholds are tuned strict so that lock genuinely means "this is the card," and correctness is biased hard toward a false-negative (keep searching) over a false-positive (wrong auto-add).
- Status: confirmed
- Context: The shipped scanner (DEC-055) converges on the correct oracle identity but still requires the user to tap Accept on a presented card before it is added. At a live table the goal is to present card after card and have each one added hands-free. Reporter testing showed the engine does eventually lock the right card as it is brought closer to the camera, but interim frames can surface a wrong leader — so auto-add is only safe if the lock bar is high enough that a wrong card is essentially never auto-added.
- Impact:
  - scanning stays frontend-only with zero network calls at scan time; no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
  - on lock, the locked card is added via the existing add path (owner, duplicate-stack block, stack-size limit, `ZoneCardItem` output) and auto-scan immediately resumes for the next card; no Accept tap and no selecting from a candidate list
  - owner is supplied by the existing sticky `pendingOwner` selector (defaults to `activePlayer`, changeable in the scan screen); auto-add does not introduce a per-card owner prompt
  - the lock/auto-add threshold is tuned stricter than the DEC-055 first-pass values (stabilizer window, vote count, lock distance, runner-up margin in `apps/frontend/src/lib/scan/tuning.ts`); the product intent is to prefer continued searching over a wrong auto-add, validated by outcome (no wrong auto-adds on a representative capture set), not by bit-equality
  - when auto-add would hit the duplicate-stack block (`FLOW-004`) or the 10-card stack limit, a non-blocking notice is shown and scanning continues; the card is not silently dropped and the user is never stranded
  - manual fallbacks are preserved: manual tap-capture remains available, and after a few consecutive low-confidence frames the existing manual-search escalation still appears (DEC-052, DEC-055)
  - supersedes the "one confident card is presented for one-tap Add" behavior in DEC-052, DEC-055, FLOW-006, and REQ-038; Rescan as a discard-and-resume control is no longer needed because there is no pending-accept state (correction is handled by DEC-058)
- Related requirements:
  - REQ-038
  - REQ-040
  - NFR-010
- Notes:
  - refines DEC-052/DEC-055; it does not change the identification/hashing/distance accuracy logic, only the control-layer calibration constants and the accept gate
  - the strict lock thresholds remain outcome-validated calibration constants (DEC-052/DEC-055 precedent), not product open questions
  - **Superseded in part (DEC-059):** the "lock bar high enough that a wrong card is essentially never auto-added" strict-bar intent is rebalanced toward ease-of-lock with one-tap removal (DEC-058) as the safety net; the auto-add mechanism and hands-free model this decision introduces are unchanged

### DEC-057
- Decision: The scan screen shows a live three-state convergence indicator (`searching` -> `locking` -> `locked`) driven by an additive, pure progress signal from the stabilizer, replaces the selectable candidate list with a single non-selectable "locking on" indicator, removes the raw status-string leaks, and plays positive visual confirmation feedback (a thumbs-up popup that fades out) on each successful auto-add. Audio confirmation (a "ding" + mute toggle) is split out of this decision and realized separately by DEC-061 / REQ-042.
- Status: confirmed
- Context: The shipped scan UX surfaces a raw status pill (`Scanning`, `No card found`, `No match`, `captured`) and a debug `Camera: <status>` line, and renders a capped top-3 selectable candidate list while searching. With auto-add (DEC-056) the user no longer picks from a list, and the experience needs to communicate "how it is doing" while converging and confirm clearly when a card lands. The stabilizer currently emits only `searching`/`locked` with no visible progress toward lock.
- Impact:
  - the stabilizer gains a small additive, pure change to expose intermediate convergence progress (current leading oracle identity plus votes-accumulated / votes-needed); distance, confidence, and margin gating logic are unchanged
  - the scan UI shows a legible three-state cue: `searching` (no confident leader), `locking` on a named card with a progress/confidence indicator, and a momentary `locked` before auto-add fires
  - the capped top-3 selectable candidate list is replaced by a single non-selectable "locking on: <name>" indicator; the user does not select from a list
  - the raw status pill copy and the debug `Camera: <status>` line are replaced with legible user-facing state copy
  - on each successful auto-add a thumbs-up confirmation popup pops up and fades out; the popup fade is a functional CSS animation permitted under the NFR-006 carve-out and adds no animation library
  - audio confirmation (a "ding" on by default with a mute toggle on the scan screen) is out of scope here and realized separately by DEC-061 / REQ-042
  - no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
- Related requirements:
  - REQ-040
  - NFR-006
- Notes:
  - refines DEC-055's "while searching, candidates are confidence-gated and capped (top 3) as a subdued hint" — the hint becomes a single informational indicator, not a selectable list
  - NFR-006 governs the popup motion only; audio is functional confirmation feedback (not animation) and is scoped to DEC-061 / REQ-042

### DEC-058
- Decision: The scan screen shows a scanned-cards review control (a counter bubble in the top-right) that expands to list the cards added to the current zone during this scan session, each with a single-tap remove. Removal has no confirmation step.
- Status: confirmed
- Context: With auto-add (DEC-056) there is no manual Accept moment to catch a wrong card before it lands, so the user needs a low-friction way to remove a mistaken auto-add without leaving the camera. Minimizing taps is the dominant constraint for live-table use.
- Impact:
  - a counter bubble sits in the top-right of the scan screen; tapping it expands a list of the cards added to the current zone during this scan session
  - each listed card has a single remove button that removes it from the zone via the existing zone-card removal path; there is no confirmation prompt on removal
  - the control operates on the current zone's cards (the same `ZoneCardItem` list the zone collection already maintains); it does not introduce a separate scan-only data store
  - no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
- Related requirements:
  - REQ-040
- Notes:
  - the no-confirmation removal is a deliberate click-minimizing choice; revisit only if feedback shows accidental removals are a problem

### DEC-059
- Decision: Rebalance the auto-add lock gate toward ease-of-lock, treating one-tap removal (DEC-058) as the safety net rather than holding the lock bar high enough that a wrong card is essentially never auto-added.
- Status: confirmed
- Context: Device validation of DEC-056's strict gate produced zero wrong auto-adds but made locking impractical — held to a webcam with fingers near the card edges and a noisy background it required delicate holding and a long wait and often failed to lock at all. Because DEC-058 (one-tap, no-confirmation removal) shipped after DEC-056 was written, the cost of a wrong auto-add is now a single tap, which removes the justification for an extreme-strict bar.
- Impact:
  - the product intent shifts from "a wrong card is essentially never auto-added" to "lock readily on a clearly-leading card; a rare wrong auto-add is acceptable because it is removable in one tap (DEC-058)"
  - the loosening is applied to the attainability knobs in `apps/frontend/src/lib/scan/tuning.ts` (stabilizer window, vote count, lock distance); the runner-up distinctness/margin guard is retained as the primary false-lock protection — easier locks without inviting near-random wrong cards
  - the scan interaction is unchanged and stays fully hands-free: same stabilizer, same auto-add path, no manual confirm tap and no candidate-list pick
  - the tuning constants remain outcome-validated calibration (DEC-052/DEC-055 precedent), now validated against two outcomes — cards lock quickly and reliably in normal phone presentation, and remain lockable in the adverse webcam/fingers/noise case — with wrong auto-adds staying rare across both
  - manual tap-capture and the low-confidence manual-search escalation remain available (DEC-052, DEC-055, DEC-056)
  - no change to identification/hashing/distance accuracy logic, `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
- Related requirements:
  - REQ-040
  - NFR-010
- Notes:
  - supersedes in part DEC-056's "lock bar high enough that a wrong card is essentially never auto-added" intent; the auto-add mechanism, hands-free model, and the rest of DEC-056 are unchanged
  - validated by outcome on both intended and adverse capture conditions, not by bit-equality

### DEC-060
- Decision: The scan screen offers an optional, user-toggleable debug overlay (default off, reset each time the scanner is opened) that visualizes how the scanner is perceiving the current card — a live outline of the detected card region and the area it actually reads, plus the live match/convergence metrics — drawn read-only from existing detector/stabilizer signals.
- Status: confirmed
- Context: Tuning the lock gate (DEC-059) and diagnosing why locking is hard need visibility into what the scanner actually "sees." The shipped UX deliberately removed always-on raw status leaks (DEC-057) for legibility; this is the opposite — an opt-in diagnostic the user summons on purpose, so it does not reopen DEC-057. Today the only on-feed outline is a static alignment template, which shows where to place the card, not what the scanner is detecting or reading.
- Impact:
  - a debug toggle on the scan screen (default off) enables the overlay; the toggle state is ephemeral and resets to off each time the scanner is opened
  - the overlay surfaces, read-only from existing signals: the current best candidate and its distance, the distinct runner-up and its distance, the margin between them, votes accumulated / votes needed, the current phase, and the active `lockDistance`/`marginMin` thresholds for reference
  - the overlay draws a live geometry layer on the camera feed from the detector's computed card corners (`detectCardCorners`): the detected card boundary the scanner is tracking, plus a highlight of the region it actually reads/hashes (the art-crop region per the shared recipe) — so the user can see whether fingers or edges are clipping the read area; the static alignment template is unaffected
  - feasibility of surfacing the corners/crop geometry to the UI is confirmed at map-out; if any piece is not cheaply available, the overlay falls back to the text metrics above and records what wiring is needed rather than blocking the feature
  - rendering happens only while the overlay is enabled, preserving the NFR-010 scan performance budget; no animation library; no new data store
  - any extra field the stabilizer must expose for the overlay is an additive, pure change (DEC-057 precedent); no change to identification/hashing/distance accuracy logic, `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
- Related requirements:
  - REQ-041
  - NFR-010
- Notes:
  - distinct from the raw status-string leaks removed by DEC-057: this is an opt-in, user-summoned diagnostic, not an always-on leak
  - primarily a calibration/diagnostic aid supporting DEC-059's outcome validation

### DEC-061
- Decision: Each successful scan auto-add plays a short audio "ding", on by default, with a mute toggle on the scan screen; muting suppresses the sound only and never the visual thumbs-up confirmation. This realizes the audio half deferred out of DEC-057.
- Status: confirmed
- Context: DEC-057 specified both a visual thumbs-up popup and an audio "ding" on each hands-free auto-add (DEC-056), but split the audio half out (this decision) so the visual work could ship scoped. At a live table a player's eyes are on the cards, not the screen, so an audio cue confirms an add without requiring the user to watch the popup. The confirmation event already exists: the visual popup fires off the monotonic `ScanAddConfirmation.id` signal the scan hook emits on each auto-add.
- Impact:
  - scanning stays frontend-only with zero network calls at scan time; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly (`buildPromptContext`/`buildPromptText`), the provider boundary, or any product-facing endpoint
  - no change to the stabilizer, lock/convergence logic, the add path, or the visual thumbs-up popup (DEC-056, DEC-057)
  - the ding plays off the same monotonic `ScanAddConfirmation.id` auto-add event that drives the visual popup, so sound and popup fire together and a repeat add of the same card re-fires both
  - the sound is on by default; a mute toggle (speaker/mute icon) sits top-left on the scan screen, paired with the convergence status indicator, leaving the top-right cluster (scanned-cards review bubble + Debug toggle) unchanged
  - muting suppresses the audio only; the visual thumbs-up popup is unaffected by mute state
  - the mute preference persists across reloads via `localStorage` — the first `localStorage` use in the repo, isolated in a small dedicated helper (`apps/frontend/src/lib/scan/audioPrefs.ts`) with its own unit test; a corrupt/unavailable store falls back to the default (unmuted) and never throws
  - the sound is played from the bundled static asset `apps/frontend/public/assets/scanSuccess.wav` (served at `/assets/scanSuccess.wav`), a short 16-bit mono PCM WAV; no audio or animation library is added and no runtime tone synthesis is used
  - audio is functional confirmation feedback, not animation; it is explicitly outside the NFR-006 animation carve-out (which governs the popup motion only), so no carve-out and no library are required for the audio path
  - mobile browsers gate audio playback on a prior user gesture; entering the scanner is itself a tap, so the audio element is primed on scanner open and a failed/blocked play degrades silently — it never throws and never blocks or pauses scanning
- Related requirements:
  - REQ-040
  - REQ-042
- Notes:
  - completes the deferral in DEC-057; the visual half (popup, three-state indicator, list-to-indicator replacement) is unchanged
  - no volume control, no per-zone sound variation, and no device-silent-switch detection (not reliably available on the web platform; the in-app mute is the control)

### DEC-062
- Decision: Scan robustness under real-world capture conditions is achieved by feeding the existing, unchanged matching engine a cleaner, better-chosen query image — via extended query-only frame conditioning, best-frame selection in the stabilizer window, and condition-aware feedback — without changing the perceptual-hash recipe, the fingerprint library, the matching/distance logic, or the lock gate as the primary lever. This refines DEC-052/DEC-055/DEC-056/DEC-057/DEC-059/DEC-060; it supersedes none of them.
- Status: confirmed
- Context: The shipped scanner (DEC-055/DEC-056/DEC-059) detects and perspective-warps the card reliably, but the perceptual-hash vote often fails to lock under glare/gloss, uneven or dim lighting, handheld camera shake, and finger occlusion of card edges — the debug view shows the card detected while the vote never locks unless the card is held at a specific angle. The root cause is query-image corruption, not detection or the engine: the true card's mean per-channel Hamming distance stays above the stabilizer `lockDistance` (78, DEC-059), so votes never accumulate. The current query conditioning (`autoLevels`, query-only per DEC-051/REQ-034) only stretches the black point and does nothing for specular blowout, white-balance cast, or motion blur. Because `autoLevels` already runs query-only while the database is hashed from clean Scryfall images, query-side conditioning is the parity-safe place to intervene: the shared resize+DCT+hash recipe and `cardhashes.bin` are untouched, so robustness is added by construction without loosening correctness. Lowering the lock gate was considered and rejected as the primary lever: with one-tap removal (DEC-058) the cost of a wrong auto-add is low, but improving the true-match signal preserves correctness (the runner-up margin guard stays meaningful) instead of trading it away.
- Impact:
  - scanning stays frontend-only with zero network calls at scan time; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly (`buildPromptContext`/`buildPromptText`), the provider boundary, or any product-facing endpoint
  - **no change** to the shared resize+DCT+hash recipe (`recipe.ts` `cropRegionA`/`phashRegionPacked`), `cardhashes.bin`, the bridge/manifest artifacts, the DB build (REQ-035/REQ-039), the matching/orientation/distance logic (`identify.ts` Hamming + 0°/180° selection + ranking), or the byte-exact pHash and DB-load parity gates (REQ-034/DEC-051)
  - **lever 1 — query frame conditioning (query-only):** the query conditioning stage is extended beyond black-point stretch to (a) full auto-contrast (white **and** black point) so dim/low-contrast captures normalize toward the clean DB tonality, (b) specular/glare suppression on the warped art crop so a gloss patch cannot dominate the DCT low-frequency block, and (c) white-balance / color-cast normalization (e.g. gray-world) so warm/cool table lighting does not shift per-channel hashes; conditioning is applied to the query only — the DB stays clean and un-conditioned, so parity-by-construction is preserved
  - **lever 2 — best-frame selection (additive control layer):** each captured frame is scored for quality (sharpness / high-frequency energy, glare fraction, art-crop detail-vs-occlusion) and the best frame in the stabilizer window is preferred for hashing while motion-blurred or occluded frames are skipped or down-weighted so they do not waste votes or inject noise; this is an additive, pure signal (DEC-057 precedent) with **no change** to the stabilizer's distance/confidence/margin gating logic, and the `marginMin` runner-up guard remains the primary false-lock protection
  - **finger occlusion is handled as a frame-quality penalty only** (lever 2), never as masked or partial-region hashing — the comparison stays full-Region-A against full-Region-A DB hashes
  - **lever 3 — condition-aware feedback:** the `searching` state of the three-state indicator (DEC-057) gains a reason derived from the frame-quality signals (e.g. "too much glare — tilt the card", "hold steady", "move closer"); the opt-in debug overlay (DEC-060) additionally surfaces the new per-frame quality metrics (glare fraction, sharpness, frame-quality score) alongside the existing best/runner-up distance, margin, and votes
  - **lock gate held:** `lockDistance` and `marginMin` stay at their DEC-059 values; the gate is re-tuned only if outcome data demands it, and gate-loosening is explicitly not the primary robustness lever
  - the query-conditioning golden/eval fixtures (the end-to-end identify path and the auto-levels conditioning vectors) are regenerated for the intentional conditioning change; the byte-exact DB-load and canonical-image pHash parity vectors are unchanged
  - all new thresholds (glare fraction, sharpness floor, frame-quality score, conditioning parameters) are isolated in `apps/frontend/src/lib/scan/tuning.ts` (DEC-052/DEC-055/DEC-059 precedent) and validated by outcome — detect-then-lock rate and top-1 accuracy on a representative adverse capture set — not by bit-equality
  - card-back detection stays descoped (DEC-055); the webcam pipeline is not replaced and recognition stays client-side (no server-side path)
- Related requirements:
  - REQ-043
  - REQ-037
  - REQ-040
  - NFR-010
- Notes:
  - refines DEC-052/DEC-055/DEC-056/DEC-057/DEC-059/DEC-060; the identification/hashing/distance accuracy logic, the hands-free auto-add model, and the lock-in mechanism are unchanged — only the query signal feeding them and the searching-state copy change
  - the conditioning, frame-quality, and threshold values are outcome-validated calibration constants, not product open questions

