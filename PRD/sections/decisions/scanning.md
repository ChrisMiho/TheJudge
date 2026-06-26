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
  - on low confidence, scanning continues and manual capture stays available; manual search is reached by exiting scan (DEC-076 refines this bullet — the in-scan low-confidence manual-search escalation prompt is removed)
  - stack cards land in scan order, bottom-to-top; manual reorder remains out of scope (`FLOW-002`)
  - the "few attempts" count, detector area fractions, and confidence/card-back thresholds are calibration constants validated by outcome (detect-rate / top-1 accuracy), not product open questions
- Related requirements:
  - REQ-037
  - REQ-038
- Notes:
  - first implementation may land manual tap-capture before continuous auto-scan; the target experience is both (map-out sequences this)
  - **Refined in part (DEC-076):** the in-scan low-confidence manual-search escalation prompt is removed; manual search is reached via **Exit scan** while the camera is open (DEC-050 fallback); manual tap-to-capture is unchanged

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
  - **Refined in part (DEC-076):** the in-scan low-confidence manual-search escalation prompt inherited from DEC-052 is removed; manual tap-to-capture and Exit scan to manual search remain

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
  - manual fallbacks are preserved: manual tap-capture remains available; manual search is reached by exiting scan — the in-scan low-confidence manual-search escalation prompt does not render (DEC-076 refines DEC-052/DEC-055)
  - supersedes the "one confident card is presented for one-tap Add" behavior in DEC-052, DEC-055, FLOW-006, and REQ-038; Rescan as a discard-and-resume control is no longer needed because there is no pending-accept state (correction is handled by DEC-058)
- Related requirements:
  - REQ-038
  - REQ-040
  - NFR-010
- Notes:
  - refines DEC-052/DEC-055; it does not change the identification/hashing/distance accuracy logic, only the control-layer calibration constants and the accept gate
  - the strict lock thresholds remain outcome-validated calibration constants (DEC-052/DEC-055 precedent), not product open questions
  - **Superseded in part (DEC-059):** the "lock bar high enough that a wrong card is essentially never auto-added" strict-bar intent is rebalanced toward ease-of-lock with one-tap removal (DEC-058) as the safety net; the auto-add mechanism and hands-free model this decision introduces are unchanged
  - **Refined in part (DEC-076):** the in-scan manual-search escalation prompt is removed; manual tap-to-capture and Exit scan to manual search remain

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
  - manual tap-capture remains available; manual search is reached by exiting scan (DEC-076); the in-scan low-confidence manual-search escalation prompt does not render
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
  - the sound is on by default; a mute toggle (speaker/mute icon) sits top-left on the scan screen, paired with the convergence status indicator; debug toggle placement is governed by DEC-065 and must not share the scanned-cards review/remove hit area
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

### DEC-065
- Decision: The scanned-cards review/remove control keeps the top-right scan-screen position; the debug overlay toggle must live in a separate non-overlapping scan control area so both controls remain independently tappable.
- Status: confirmed
- Context: DEC-058 intentionally makes the top-right scanned-cards bubble the fast correction path for wrong auto-adds. DEC-060 later added a debug toggle for scanner diagnostics, and DEC-061 described a shared top-right review-bubble/Debug cluster. In the shipped layout those controls can overlap on-screen, putting two clickable targets in the same region and making the one-tap remove safety net easy to misclick.
- Impact:
  - the top-right scan-screen region remains reserved for the scanned-cards review bubble and its expanded remove affordances (DEC-058)
  - the debug overlay toggle remains available, default-off, ephemeral, and behaviorally unchanged, but is moved to a separate scan control area outside the review/remove hit area
  - at mobile and desktop scan-screen sizes, the debug toggle, review bubble, expanded review panel, and per-card remove buttons must have non-overlapping visual bounds and pointer hit areas
  - the debug toggle may be grouped with other diagnostic or scan controls, but must not cover, sit under, or intercept taps meant for the review/remove control
  - this is a frontend scan-screen layout refinement only; no change to scanner behavior, overlay metrics, detector/stabilizer signals, `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
- Related requirements:
  - REQ-040
  - REQ-041
  - NFR-001
- Notes:
  - refines DEC-060's debug-toggle placement and supersedes only DEC-061's "top-right review-bubble/Debug cluster" placement phrase; all debug-overlay and audio behavior remains unchanged

### DEC-069
- Decision: The scan fingerprint corpus explicitly targets every paper **gameplay** printing that carries distinct artwork — including non-English-only printings (e.g. alternate-art Japanese cards) — and corpus coverage is made measurable rather than a silent miss. The build keeps Scryfall **Default Cards** (`default-cards.json`) as its source; the gameplay/corpus filter is audited so legitimate gameplay art is not dropped, and coverage diagnostics expose whether a given printing/illustration is fingerprinted and whether the corpus is fully built or still partial. This refines DEC-051/DEC-054 (the same TheJudge-owned library and incremental build) and is the **only** scan-robustness lever that may touch the data-build; it supersedes none of them and does not relax DEC-062's query-only posture.
- Status: confirmed
- Context: A real-world failure surfaced a Japanese-language card that could not be identified at all, alongside a glare-affected English card that struggled. Query-side robustness (DEC-062) is explicitly query-only and cannot help a card whose artwork is not in `cardhashes.bin`: if the printing was never fingerprinted, there is no entry to match against at any distance. `scripts/build-card-hashes.mjs` sources Scryfall Default Cards (one object per printing, English-preferred; a printing that exists only in a non-English language appears as that language's object), so Default Cards already covers every distinct *illustration*, and a standard non-English printing shares the English printing's art, which Region A reads language-agnostically. The plausible coverage gaps are therefore (a) the gameplay/corpus filter (`isGameplay`, `EXCLUDED_SET_TYPES`) silently excluding printings that carry distinct gameplay-relevant art, and (b) the DEC-054 incremental build being only partially complete — both currently invisible to the operator, who sees only "no match." The IDEA framed the data-build as a non-goal; that local non-goal is overridden here because coverage is the one robustness problem the query-only levers structurally cannot solve. Switching to the every-language `all-cards` bulk was considered and rejected: it is roughly 10× the corpus of mostly-duplicate art that collapses through the existing oracle bridge (DEC-053), so it adds build/retention cost with no distinct-art coverage gain.
- Impact:
  - the build keeps Default Cards (`default-cards.json`) as its source; no switch to the `all-cards` every-language bulk
  - the gameplay/corpus filter (`isGameplay`, `EXCLUDED_SET_TYPES`, layout/oversized/checklist exclusions) is audited and adjusted only as needed so paper gameplay printings carrying distinct artwork — including non-English-only alt-art printings — are included rather than silently dropped; any filter change is justified against the gameplay-card intent, not loosened wholesale
  - coverage is made observable: the build reports/surfaces whether a target printing or illustration is present in `cardhashes.bin` and distinguishes a fully-built corpus from a partial DEC-054 in-progress one, so a "no match" can be attributed to a coverage gap rather than guessed at; this reuses the existing manifest/skip-list artifacts and run summary rather than adding a new data store
  - **frozen boundaries:** no change to the shared resize+DCT+hash recipe (`recipe.ts` `cropRegionA`/`phashRegionPacked`), the `CARDHSH1` bin format, the matching/orientation/distance logic (`identify.ts`), the runtime scanner/lock gate, or the DEC-051/REQ-034 byte-exact parity gates; Region A stays frozen and is the language-agnostic illustration window, so standard non-English printings match their shared art by construction
  - **escalation, not silent absorption:** if diagnosis shows Region A bleeds into language-variant frame/text (so a shared-art non-English printing genuinely cannot match without a recipe/geometry change), that is a recipe + full DB-rebuild escalation and is explicitly **out of scope** for this story — it is flagged and recorded, never folded in silently
  - the human-approval network posture is unchanged: a coverage-extending build run downloads missing images and is itself the explicit approval (DEC-054); no scheduled/automated refresh is added
  - no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint; scanning stays frontend-only at scan time and the oracle-level identity model (DEC-053) is unchanged
  - glare/conditioning recalibration for the English-card failure is **not** part of this decision: it is execution-level calibration under DEC-062/REQ-043 (outcome-validated `tuning.ts` constants), carries no new product truth, and is recorded in the work DESIGN-BRIEF
- Related requirements:
  - REQ-047
  - REQ-035
  - REQ-039
  - NFR-010
- Notes:
  - overrides only the local "no data-build change" non-goal in this work's IDEA; it does not touch any committed non-goal in `goals-and-non-goals.md`
  - validated by outcome (the previously-unidentifiable Japanese card becomes identifiable once its art is fingerprinted), qualitative owner on-device acceptance, not by a counted table
  - corpus-coverage targeting and any filter adjustments are calibration validated against gameplay-card intent, not product open questions (DEC-052 precedent)

### DEC-070
- Decision: A scanned card displays the **specific printing's art that was scanned** by separating printing-level *image presentation* from oracle-level *identity*. The scanned printing's image flows into the scan preview and is persisted onto the added `ZoneCardItem.imageUrl`; `cardId`/oracle identity, prompt context, and rulings stay oracle-level and unchanged. This refines DEC-053/REQ-036 (which pushed only oracle-level metadata to the picker and kept printing-level identity out of `ZoneCardItem`) by carving out the image as presentation, not identity; it does not supersede DEC-053's oracle-level identity model.
- Status: confirmed
- Context: DEC-053 resolves an art match through `printing id → oracle_id → CardMetadataItem` and collapses duplicate oracle ids to one candidate by best distance, then feeds the picker "exactly like typed suggestions." Because `CardMetadataItem.imageUrl` is the build's single representative printing (most-recent/highest-quality per `choosePreferredCard`), the on-screen art after a scan is frequently a different printing than the physical card in front of the user — the reported defect. The scanned printing id is available at scan time (it is the best-distance engine `Candidate.card_id` for the locked oracle identity), and that printing's image URL is available at build time in `build-card-scan-map.mjs` from the same Scryfall printing object. So fidelity is achievable purely by carrying the printing image as presentation; identity stays oracle-level so prompt/rulings/duplicate-block/stack behavior are untouched. Critically, `imageUrl` is already omitted from LLM-facing prompt text (REQ-030), so displaying a different image has zero effect on the Ask AI contract — satisfying this work's IDEA non-goal.
- Impact:
  - the build-time bridge artifact `cardScanMap.json` gains a per-printing `imageUrl` (the scanned printing's Scryfall image), produced by `build-card-scan-map.mjs` from the same printing object it already reads; the entry shape becomes `{ oracleId, name, imageUrl }`
  - `resolveScanCandidatesRanked` (REQ-036) threads the best-distance printing's `imageUrl` through to the locked candidate so the scan capture hook can surface it alongside the resolved oracle-level `CardMetadataItem`
  - on auto-add (DEC-056), the scanned printing image is written to `ZoneCardItem.imageUrl` for that card only; the existing add path, owner, duplicate-stack block, stack-size limit, and the `ZoneCardItem` shape are otherwise unchanged, and the thumbnail in stack/zone details (REQ-008/DEC-018) then matches the scanned printing
  - graceful fallback: if a printing image is missing/empty in the bridge, the resolver falls back to the oracle-level `CardMetadataItem.imageUrl` so the card still previews and adds (DEC-053 drop/collapse behavior is otherwise unchanged)
  - oracle-level identity is unchanged: `cardId`, the duplicate-stack key, prompt context (`buildPromptContext`/`buildPromptText`), and rulings lookup remain keyed on the oracle id — printing-level data other than the display image is not pushed into `ZoneCardItem`, prompt, or rulings
  - scanning stays frontend-only with zero network calls at scan time; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
  - **frozen scan-engine boundaries:** no change to the shared resize+DCT+hash recipe (`recipe.ts`), `cardhashes.bin`, the matching/orientation/distance logic (`identify.ts`), the stabilizer/lock gate, or the byte-exact parity gates (REQ-034/DEC-051); this is presentation only and is explicitly **not** a scan-robustness lever (distinct from DEC-062/DEC-069)
  - cost: the lazy-loaded bridge file grows by one URL per printing; it loads only on first scan, so app startup is unaffected and the growth stays within the NFR-010 lazy-load posture
- Related requirements:
  - REQ-048
  - REQ-036
  - REQ-008
  - NFR-010
- Notes:
  - refines DEC-053/REQ-036; the oracle-level identity model, candidate collapse-by-best-distance, and drop-unresolvable behavior are unchanged — only a presentation image is added to the carried data
  - typed-search representative-printing selection is a separate concern handled by DEC-071; the scan path shows the scanned art directly and does not depend on the representative print

### DEC-072
- Decision: Real-world card **detection** robustness — finding and locking the 4-corner card outline before any matching runs — is achieved by raising detector recall in `detector.ts` (loosened/adaptive edge + contour gates, foil/glare-tolerant edge sourcing, and a low-contrast-border fallback detection path), while the downstream temporal stabilizer lock gate stays the precision guard against wrong auto-adds. It is validated by outcome against a committed detector fixture corpus — committed seed/generated synthetic fixtures with recorded provenance as the controllable backbone, plus downloaded/owner real-world photos and an optional debug-gated raw-frame export folded in. The ignored Scryfall card-image download cache may help select seeds, but it is not the reproducible fixture source of truth. The Region A perceptual-hash recipe geometry (`recipe.ts`) and the `CARDHSH1` bin format stay frozen; a fix that genuinely requires them is flagged-and-recorded as a separate escalation, never folded in. Refines DEC-052/DEC-055; complements DEC-062 (query-only conditioning) and DEC-069 (corpus coverage) as the third, detection-side robustness lever; supersedes none.
- Status: confirmed
- Context: Shipped query-side robustness (DEC-062) and corpus coverage (DEC-069) both run strictly downstream of detection and cannot help a card the detector never finds. Owner on-device validation (2026-06-25, receipt `scan-robustness-tuning-2026-06-25.md`) reproduced a hard `detectCard()` shape-lock failure on two physically different cards: an ornate/etched-foil full-art Japanese Strixhaven Mystical Archive `Akroma's Will` and a plain non-Japanese English card held centered — so the failure is language- and corpus-agnostic and the corpus already contains both cards (`included`+`fingerprinted`). `detectCard()` returns `null`, status goes `no-card`, and the warp→fingerprint→stabilizer pipeline never runs (`ScanCameraSurface.tsx:130-145`). Likely mechanisms: foil reflections inject spurious internal edges that fail `SOLIDITY_MIN 0.65`/`RECTANGULARITY_MIN 0.7`, and a low-contrast outer border against the play surface makes Canny (`CANNY_LO/HI 30/90`) miss the boundary, so no 4-corner contour passes the gates. Because a detected quad never auto-adds a card — the stabilizer's distance+margin vote (`lockDistance 78`/`marginMin 14`, DEC-059) is the precision guard — detector recall can be raised liberally first and tightened only if spurious warps actually appear; over-detection costs at most a wasted frame, not a wrong card. Evidence-based tuning was previously blocked because `ScanCameraSurface` had no way to export the exact failing frame; rather than depend on one device's frame (every camera differs), the evidence basis is a diverse fixture corpus.
- Impact:
  - detection robustness is pursued in `detector.ts` only, raising recall via: (a) loosened/adaptive Canny + solidity/rectangularity/aspect/area gates tuned against the fixture corpus; (b) foil/glare-tolerant edge sourcing so speculars and internal foil edges do not starve the outer-border contour; (c) a low-contrast-border fallback detection path (e.g. adaptive thresholding) that runs only when the primary pipeline finds nothing; (d) condition-aware feedback so a persistent `no-card` surfaces a user nudge instead of a silent failure
  - the temporal stabilizer lock gate (`lockDistance`/`marginMin`, DEC-059) is unchanged and remains the precision guard: loosening detection does not loosen the card-identity gate, so wrong auto-adds stay protected and one-tap removal (DEC-058) remains the safety net
  - evidence + validation: the outcome bar is **detect-then-lock on committed real on-device frames plus a fresh on-device pass**; the synthetic fixture corpus (committed fixture seeds and/or committed generated synthetic degradations — glare/specular, low-contrast border, perspective skew, foil-like highlights — with recorded provenance, plus downloaded real-world card-on-table photos) is necessary-but-not-sufficient and **must not be reported as completion** while the real-frame/on-device outcome is unmet. The 2026-06-25 implementation passed the synthetic corpus 5/5 yet still failed on-device precisely because the synthetic fixtures have uniform backgrounds and fully-visible cards and so cannot reproduce background clutter, finger occlusion, or the hand-held regime; before/after detect-then-lock rate across both the corpus and the real frames is recorded as acceptance evidence
  - **regression-aware tuning:** owner-confirmed (2026-06-25) that the hand-held "card held up to the camera" case used to work better and recent tuning degraded it, so recall work is regression-first — identify and loosen/revert the degrading change(s) (primary suspects: the `MAX_DETECT_DIMENSION` detection downscale washing out the thin outer border, and the multi-channel median-area filter rejecting the card under clutter) and record the regression — rather than only loosening blindly
  - **capture-framing guide prior:** detection is biased toward the on-screen card-shaped reticle the user aligns to (DEC-073/REQ-052) so off-guide background clutter stops competing for selection; this is the cheapest, highest-leverage recall lever and is pursued alongside threshold tuning
  - the raw-frame export reuses the existing scan **Capture** button rather than adding a control: while the opt-in debug overlay (DEC-060/REQ-041) is enabled, Capture additionally saves/downloads the exact frame it grabbed; with the overlay off (default) Capture behaves exactly as today and the normal scan flow is unchanged (DEC-065 no-clutter intent)
  - **frozen boundaries:** no change to the shared resize+DCT+hash recipe (`recipe.ts` `cropRegionA`/`phashRegionPacked`), the `CARDHSH1` bin format, `cardhashes.bin`, the bridge/manifest artifacts, the matching/orientation/distance logic (`identify.ts`), or the DEC-051/REQ-034 byte-exact pHash and DB-load parity gates; a perspective-warp from new corners feeds the same unchanged recipe
  - **escalation, not silent absorption:** if a real failing frame proves a card is unfindable without a Region A recipe/geometry or bin-format change (which forces a full DB re-download/re-hash), that is a separate recipe escalation, explicitly out of scope here — flagged and recorded, never folded in
  - scanning stays frontend-only with zero network calls at scan time; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
  - the fixture-corpus image downloads follow the existing human-approval network posture (the operator running the build/fetch is the approval); committed fixtures must have clear provenance, and the ignored `apps/frontend/data/scryfall/card-images/` cache is only a local input convenience, not a test or acceptance prerequisite
- Related requirements:
  - REQ-050
  - REQ-051
  - REQ-052
  - REQ-037
  - REQ-041
  - NFR-010
- Notes:
  - refines DEC-052/DEC-055 (the detect→warp stage they introduced); complements DEC-062 and DEC-069 as the detection-side lever the query-only and corpus levers structurally cannot cover; extended by DEC-073 (capture-framing guide prior)
  - all detector gate/threshold and fixture-degradation values are outcome-validated calibration constants (DEC-052/DEC-055/DEC-059 precedent), not product open questions
  - root-cause evidence preserved in `PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md`; "loosen first, tighten if too loose" is the explicit owner-directed tuning posture, applied regression-first per the 2026-06-25 re-test (the hand-held case degraded from a previously-working state)

### DEC-073
- Decision: The on-screen card-shaped framing guide (the `745/1040` reticle the scan surface already draws) is promoted from a passive visual hint into a **detection prior and an explicit capture instruction**. `detectCard()`/`detectCardCorners()` bias candidate selection toward the guide region — constraining the effective area-fraction/position window to the reticle and/or scoring candidates by overlap with it — so a gate-passing quad from background clutter (TV, shelf, picture frame) outside the guide no longer wins over the card the user is aligning inside it. In parallel, the searching-state guidance copy actively coaches the easy capture regime (fill the guide, flat contrasting surface, fingers off the edges). This is the cheapest, highest-leverage detection-recall lever: it converts "detect an arbitrary hand-held card against clutter" — hard in pure-JS CV — into "prefer the card the user is already framing." Extends DEC-072 (detection-side robustness) on the UI/affordance axis; complements DEC-057/DEC-062 (searching-state feedback) whose path the guidance copy reuses; changes no identity/lock gate (DEC-059) and no recipe/bin boundary.
- Status: confirmed
- Context: Owner re-validation (2026-06-25) of `scan-detector-foil-robustness` found that the failing case is a card held up to the camera, tilted, with fingers over the border, against a cluttered room background, and — critically — that **scanning improved markedly when the card was fitted to the on-screen guide**. The guide already exists (`ScanCameraSurface.tsx` renders a card-aspect reticle with a dimmed surround) but detection does not use it: `findBestCardInEdges` accepts the largest gate-passing quad anywhere in frame (`MIN_AREA_FRAC 0.05`/`MAX_AREA_FRAC 0.95`), so off-guide clutter competes on equal footing with the card. Aligning the detector's selection to the affordance the user is already using is both reliable and nearly free.
- Impact:
  - detection selection is biased to the guide region (area-fraction/position window and/or overlap scoring) rather than "largest quad anywhere"; the prior is derived from the same geometry the UI draws so the user's target and the detector's preference are identical
  - the guide prior biases but does not hard-reject: a slightly misaligned card still has a path to lock, so the prior raises recall without becoming a new gate
  - searching-state guidance copy becomes condition-aware and coaches the easy regime (fill the guide, flat contrasting surface, fingers off edges), reusing the DEC-057/DEC-062 feedback path; it stays non-blocking with manual search always available (DEC-050)
  - the stabilizer lock/identity gate (`lockDistance`/`marginMin`, DEC-059) is unchanged — the guide prior is a recall/selection lever only and does not loosen identity precision or increase wrong auto-adds; one-tap removal (DEC-058) remains the safety net
  - **frozen boundaries:** no change to `recipe.ts`, the `CARDHSH1` bin, `cardhashes.bin`, `identify.ts`, or the DEC-051/REQ-034 parity gates; scanning stays frontend-only with zero scan-time network calls and no new scan-screen control (DEC-065)
- Related requirements:
  - REQ-052
  - REQ-050
  - REQ-037
  - DEC-059
  - DEC-065
- Notes:
  - extends DEC-072; the guide prior (this decision) and the regression-aware threshold/edge tuning (DEC-072) are pursued together, not as alternatives

### DEC-074
- Decision: The scanner requests a **higher-resolution camera capture mode** (and continuous autofocus where the device supports it) instead of accepting the browser's unconstrained default, so the warp → Region A → hash → lock pipeline reads a sharper source image and cards lock across a wider range of distances and lighting rather than only a narrow sweet spot. `ScanCameraSurface` passes `MediaTrackConstraints` to `getUserMedia` (`width`/`height` `{ ideal: 1920/1080 }`, `facingMode { ideal: "environment" }`, continuous `focusMode` where available), always using `ideal` (never `exact`) so unsupported or locked-down devices degrade gracefully to whatever mode they can deliver. This is a **capture-quality lever upstream of the frozen matching boundary**: the perceptual-hash recipe (`recipe.ts`), the `CARDHSH1` bin, `cardhashes.bin`, the matching/orientation/distance logic (`identify.ts`), and the DEC-059 stabilizer lock gate are all unchanged. Complements DEC-062 (query-only conditioning), DEC-072/DEC-073 (detection-side recall); supersedes none.
- Status: confirmed
- Context: Owner re-test (2026-06-25) reported that scanning works only in a narrow band of distance and lighting — "a game of finding the right spot and holding still." Diagnosis traced this not to detection (which `detectCard()` already handles on the real frames per DEC-072/DEC-073) but to **capture quality**: every owner-exported frame, including the one captured at the distance that scanned well (`scan-frame-1782439377948.png` and the committed `real/` frames), is **640×480**, because `getUserMedia` is called with only `facingMode` and no resolution constraint, so the browser hands back its low default. With the card filling ~82% of frame height it is only ~390px tall natively and the warp **upscales it to the 1040px canonical height (~2.6×)** before hashing Region A; the captured frames' Region A quality scored 0.501/0.451 against the 0.45 accept threshold (`FRAME_QUALITY_ACCEPT_THRESHOLD`), i.e. right at the edge. Requesting a higher capture resolution feeds the same unchanged warp far more real pixels (card height ~885px at 1080p, cutting the Region A upscale toward ~1.2×), which widens the lockable distance/light window and lifts the borderline best-frame and quality signals (DEC-062) without touching any frozen surface. Because corner detection already runs on a frame downscaled to `MAX_DETECT_DIMENSION` (640) and warps from the full-resolution frame, the higher capture resolution adds no detection-stage cost; only the fixed-output warp samples a larger source.
- Impact:
  - `ScanCameraSurface.openCamera` requests a higher-resolution environment-facing stream via `MediaTrackConstraints` (`width`/`height` `{ ideal: 1920, ideal: 1080 }` or device best, continuous `focusMode` where supported), using `ideal` so a device that cannot honor it falls back to its best available mode rather than throwing; a denied/failed `getUserMedia` still surfaces the existing `camera-error` path
  - the hidden capture canvas already grabs at native `videoWidth`/`videoHeight`, so the larger stream flows into the warp with no other capture-path change; the live `<video>` preview keeps its existing CSS size and `object-cover`
  - **resolution ceiling and focus mode are outcome-validated calibration constants** (DEC-052/DEC-055/DEC-059 precedent), tunable if a device class shows perf/memory pressure — not product open questions; they live with the camera-open constraints, not in the frozen recipe
  - **best-frame + frame-quality recalibration (execution-level, not new product truth):** because the `FRAME_QUALITY_*` norms and `FRAME_SELECTOR_WINDOW_SIZE` (`tuning.ts`) were tuned at 640×480, they are recalibrated against the higher-resolution frames (notably `FRAME_QUALITY_SHARPNESS_NORM` and the accept threshold), and the best-frame window is retuned (`5 → 3`); this is outcome-validated `tuning.ts` calibration under DEC-062, recorded in the work DESIGN-BRIEF, and carries no new product truth
  - **positive in-zone capture cue (REQ-054):** once a frame's `qualityScore` clears the accept threshold but the card has not yet locked, the searching-state indicator shows a positive "good — hold steady" cue so the user knows when they have found the lockable zone instead of hunting blind; it reuses the existing DEC-057/DEC-062 searching-state feedback path, is non-blocking, and adds no new control
  - **frozen boundaries:** no change to the shared resize+DCT+hash recipe (`recipe.ts` `cropRegionA`/`phashRegionPacked`), the `CARDHSH1` bin format, `cardhashes.bin`, the bridge/manifest artifacts, `identify.ts` (Hamming + 0°/180° + ranking), the stabilizer/lock gate (`lockDistance`/`marginMin`, DEC-059), or the DEC-051/REQ-034 byte-exact pHash and DB-load parity gates; a higher-resolution source warps through the same unchanged recipe
  - **NFR-010 posture:** detection still runs on the `MAX_DETECT_DIMENSION`-downscaled frame (no detection slowdown); the added cost is the fixed-size warp sampling a larger source and a larger `getImageData` per scanned frame at the auto-scan cadence, which stays within the scan performance budget and is re-checked on-device
  - scanning stays frontend-only with zero scan-time network calls; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint
  - **escalation, not silent absorption:** if on-device data shows the higher resolution genuinely needs a recipe/geometry change to help (it should not — the warp is recipe-frozen), that is a separate recipe + full DB-rebuild escalation, flagged and recorded, never folded in (DEC-069/DEC-072 precedent)
- Related requirements:
  - REQ-053
  - REQ-054
  - REQ-037
  - NFR-010
- Notes:
  - low-light affordances (a torch/flash toggle, explicit exposure constraints) were considered and **deferred** this round to keep the lever to resolution + continuous autofocus with no new scan-screen control (DEC-065); a torch toggle remains a clean future extension
  - validated by outcome — a DB-registered card locks across a broader distance/light range than before with no new false auto-adds, and exported frames report native resolution above 640×480 — not by bit-equality (DEC-052/DEC-055/DEC-059/DEC-062 precedent)
  - complements DEC-062 (this sharpens the source the query conditioning and best-frame selection operate on) and DEC-072/DEC-073 (detection is already handled; this is the capture-quality layer feeding the matcher)

### DEC-077
- Decision: Scanner acquisition tuning proceeds **diagnostic-first** and is validated against a two-condition capture matrix: (1) a hard **Mac-webcam baseline** (built-in webcam, hand-held or lightly supported card, normal room lighting) that should be usable without repeated hunting, and (2) a **stand-assisted controlled setup** (fixed card/camera geometry, flat contrasting surface, stable lighting) that should be fast and highly consistent. These are validation conditions, not product modes: the scanner keeps one behavior path and one user flow. The next acquisition work instruments the capture → detector → frame selector → identify → stabilizer vote path before more threshold tuning, so remaining failures can be attributed to camera focus/resolution, detector quad quality, frame-selector choice, frame-quality gates/cues, identity confidence, or vote eligibility. The recipe/bin/identify boundary and the final lock precision guard (`lockDistance`/`marginMin`) stay frozen unless diagnostics prove a separate escalation is required.
- Status: confirmed
- Context: After the latest stabilizer tuning trial (`windowSize 13` / `minVotes 3`, with `lockDistance 78` and `marginMin 14` retained), owner retest found that scanning remained difficult to acquire but became quick once the card identified. That means the final temporal convergence layer is likely less of a bottleneck than the earlier path that produces the first reliable identity vote. Separately, a friend's scan success uses a webcam with a different physical setup, and the owner has access to a 3D-printed scan stand. Physical setup matters substantially for this pure-JS camera pipeline: fixed geometry removes motion, distance drift, perspective wobble, finger occlusion, focus hunting, and background clutter. But the product should not require special hardware to feel usable, so validation must distinguish the hard baseline from the ideal controlled case without creating two scanner modes.
- Impact:
  - acquisition diagnostics are promoted from ad hoc debugging into the next scanner tuning lever: for a live or exported frame sequence, the scanner should report native capture resolution / relevant track settings where available, detector corners/geometry, frame-quality score/reason, whether the selected frame is current or retained from the frame-selector window, best/runner-up identity distances and margin, stabilizer votes, and the concrete vote/no-vote reason
  - the Mac-webcam baseline is the minimum usability bar: with a DB-registered card reasonably filling the guide under normal room lighting, the scanner should reach a first reliable identity vote and lock without repeated distance/lighting hunting; if it cannot, diagnostics must show which stage is blocking acquisition
  - the stand-assisted controlled setup is the ideal validation bar: the same scanner path should lock quickly and consistently when geometry/lighting are controlled; if it does not, the failure is treated as a stronger signal that a pipeline stage is wrong rather than user/setup variability
  - tuning experiments after diagnostics must be reversible and stage-specific, such as fixing the missing continuous-focus request, temporarily simplifying frame selection to current-frame-only, or retrying detection at a higher `maxDetectDimension` only after a low-confidence 640px pass; experiments must record before/after evidence rather than silently baking in more constants
  - the final identity precision guard stays held: do not loosen `lockDistance` or `marginMin` as an acquisition shortcut without diagnostic evidence and an explicit follow-up decision; one-tap removal remains the safety net for rare wrong auto-adds, but not a reason to remove the distinct-runner-up guard
  - scan-stand support is a validation condition and operator recommendation, not a new hardware dependency, separate UI mode, or product requirement for normal use
  - **frozen boundaries:** no change to the shared resize+DCT+hash recipe (`recipe.ts`), the `CARDHSH1` bin format, `cardhashes.bin`, the scan map artifacts, or `identify.ts`; scanning remains frontend-only with zero scan-time network calls and no backend/API/prompt change
- Related requirements:
  - REQ-057
  - REQ-037
  - REQ-041
  - REQ-050
  - REQ-052
  - REQ-053
  - REQ-054
  - NFR-010
- Notes:
  - refines DEC-059/DEC-062/DEC-072/DEC-073/DEC-074 by separating "getting to a first reliable vote" from "converging once votes exist"
  - the two validation conditions are a boundary-setting device for refinement and QA, not two user-facing modes
