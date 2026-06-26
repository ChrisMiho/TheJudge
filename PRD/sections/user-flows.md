# user-flows.md

### FLOW-001
- Name: Capture game context, zones, and ask a question
- Trigger: User opens the app to understand an MTG rules or interaction question
- Preconditions:
  - app is loaded
  - local metadata is available
- Main Flow:
  1. Game setup: user sets player count (expandable panel for per-player display name and life), active player when known, and turn phase via dropdown; turn phase is required and defaults to **main_1**. Active player and downstream player selects show display names as `Player N (Name)` when set. Turn phase and active player appear in one merged panel; the cat-wizard hero image is hidden until the user clicks the brand title 10 times on this step (session-only reveal).
  2. Zone confirmation: app preselects likely zones from the turn phase; user adjusts the checklist; at least one zone is required to continue.
  3. Per-zone collection: for each selected zone, user may add card identities from local search; non-stack cards capture owner; stack cards are ordered bottom-to-top. Added cards appear in a compact 2-column tile grid (max 4 visible, scroll the rest). While scan is open, search and the card list are hidden; user exits scan to return to manual search.
  4. Enrichment: default card-by-card wizard (OK advances); optional **View all cards** for full-list edit with per-zone scroll cap (4 rows visible, scroll the rest); user may add caster, targets, notes, and mana spent where relevant.
  5. Submit: user enters an optional question, clicks **Decrypt Stack**, and the frontend sends `question` plus `gameContext` to the backend.
  6. Backend builds the prompt and returns a plain-text answer.
  7. Frontend displays the answer.
- Edge Cases:
  - if game-context values are missing/invalid, continue action is blocked
  - if zone confirmation has zero zones selected, continue action is blocked
  - if a selected zone has no cards, omit that zone key from `gameContext.zones`
  - if no selected zone contains at least one card, continue/submit is blocked until the user adds a card to a selected zone
  - if no matches are found, show **No matching card found**
  - if the question is blank after trimming, use a zone-aware fallback: **Resolve the stack** when the stack zone has cards; otherwise **Explain the interaction with the provided game state** when another selected zone has cards
  - if stack is selected but has no cards and another selected zone has cards, submit remains allowed; enrichment shows what will be sent before decrypting
  - if a display name is empty, whitespace-only, or matches the fixed player label, treat it as unset
  - if the stack has 10 cards, block additional adds
  - if the user changes phase after selecting zones, newly assumed zones are added and existing cards/enrichment are preserved
- Notes:
  - this is the primary core product flow with staged context capture
  - each staged step's header presents the active step name inline to the right of the `TheJudge` / `Stack Assistant` brand block in a single row (DEC-067, REQ-045); the answered-state conversation header stays a slim brand-only header with no step name
  - staged-flow screen compaction (DEC-076, REQ-056) and optional layout density (DEC-075, REQ-055, FLOW-008) are presentation-only and do not change this flow's logic or payloads

### FLOW-002
- Name: Inspect and remove cards from selected zones
- Trigger: User reviews cards while collecting zone context
- Preconditions:
  - at least one selected zone has a card
- Main Flow:
  1. User opens or views a selected zone's card list.
  2. App lists cards for that zone in a compact 2-column tile grid (max 4 visible, scroll the rest).
  3. Stack-zone cards are shown from bottom to top.
  4. Each tile shows card name, optional small thumbnail, stack position or owner label, and remove button.
  5. User removes one or more cards.
  6. Zone card count updates.
- Edge Cases:
  - if a thumbnail does not load, continue to show the row without it
  - if the last card is removed from a zone, that zone remains selected but is omitted from the request payload
- Notes:
  - manual reorder is out of scope for the core product
  - tile grid layout and scroll cap are presentation only (DEC-076, REQ-056)

### FLOW-003
- Name: Handle failed AI request
- Trigger: Backend request fails
- Preconditions:
  - user has submitted a valid `gameContext` and question
- Main Flow:
  1. Backend returns an error payload.
  2. Frontend shows the message **Miho is working on it**.
  3. Frontend keeps the existing game context, zone cards, enrichment, and question intact.
  4. Frontend keeps the previous successful response visible until a new one succeeds.
  5. Frontend shows a retry button.
  6. Retry button is placed on a 13-second cooldown.
- Edge Cases:
  - repeated failures should not wipe user-entered state
- Notes:
  - this flow is important for live table usability

### FLOW-004
- Name: Block duplicate stack card add
- Trigger: User attempts to add a card already present in the stack
- Preconditions:
  - the card is already in the stack
- Main Flow:
  1. User selects a card already present in the stack.
  2. User attempts to add it.
  3. UI blocks the add.
  4. UI shows a message that duplicate cards are not supported yet.
- Edge Cases:
  - this may reject some real gameplay scenarios
- Notes:
  - this is an intentional constraint only

### FLOW-005
- Name: Post-decrypt follow-up chat
- Trigger: User wants to clarify, question, or correct the assistant after a successful Decrypt Stack
- Preconditions:
  - first decrypt has succeeded and the conversation thread is showing
- Main Flow:
  1. User sees a compact frozen context summary above the conversation thread.
  2. User may expand the frozen context summary to inspect the full read-only game context.
  3. User reads the assistant's answer in the conversation thread.
  4. User types a follow-up in the chat composer (up to 300 characters) and clicks Send.
  5. Send button shows an inline processing animation; button is disabled.
  6. Frontend sends `{ question: followUpText, gameContext: frozen, conversationHistory: fullPriorExchange }` to `POST /api/ask-ai`.
  7. Backend inserts `CONVERSATION HISTORY` before `QUESTION` in the prompt and returns a plain-text answer.
  8. User bubble and then assistant bubble are appended to the thread.
  9. Send button is restored; user can send another follow-up.
- Edge Cases:
  - if the follow-up request fails, the error is shown and a retry button is presented; retry resubmits the failed follow-up with the same frozen context and history
  - if the user clicks start over, the conversation thread is cleared, enrichment editing is unfrozen, previously entered context is preserved, and the pre-decrypt enrichment state is restored
  - start over is not available while a request is in flight
  - if history chars exceed `MAX_CONVERSATION_HISTORY_CHARS` (6000), oldest turns are truncated before the prompt is assembled
  - when the backend is running in mock mode, the assistant bubble still appends in the same chat thread and its answer contains the exact assembled LLM-facing prompt for that submitted user message
- Notes:
  - game context, zones, cards, and enrichment are frozen for the duration of the conversation; follow-ups are text-only in v1
  - the initial user question (including fallback) is included in `conversationHistory` sent to the API but is not shown as a visible bubble in the thread
  - the answered-state screen keeps the top header slim and uses the frozen context summary as the setup for the conversation

### FLOW-006
- Name: Scan cards into a zone (optional batch input)
- Trigger: User taps **Scan** beside the search input while collecting cards for a selected zone
- Preconditions:
  - a zone is selected and open for collection (`FLOW-001` step 3)
  - the device has a usable camera and granted camera permission
  - the fingerprint library has loaded (lazy-loaded on first scan)
- Main Flow:
  1. Camera opens as its own screen with a card-shaped guide overlay and stays open for the session.
  2. The scanner auto-scans continuously; a manual capture button is always available. A live convergence indicator shows `searching`, then `locking` on a named card with a progress/confidence cue as evidence accumulates (DEC-057). While searching under poor conditions, the indicator surfaces a cause-aware hint derived from per-frame quality signals — e.g. "too much glare — tilt the card", "hold steady", "move closer" — to guide the user toward a lockable frame (DEC-062). Behind the scenes the query frame is conditioned (glare suppression, auto-contrast, white-balance) and the best frame in the window is preferred for hashing so a card locks without needing a perfect angle.
  3. Once one card is consistently the best over a short window with high confidence, it **locks in** and is **auto-added** to the current zone via the existing add path (owner via the sticky owner selector, duplicate-stack block, stack-size limit, `ZoneCardItem` output) — no Accept tap and no selecting from a list (DEC-056).
  4. A thumbs-up confirmation popup fades in and out and a short "ding" plays (on by default; a top-left mute toggle silences the sound only, not the popup); auto-scan immediately resumes for the next card and the scan review bubble shows the running count of cards added this session (DEC-058, DEC-057, DEC-061).
  5. To remove a wrong auto-add, the user taps the scanned-cards bubble in the top-right and removes the card in one tap (no confirmation) without leaving the camera (DEC-058).
  6. User repeats as needed, then taps **Exit scan** (top-right on the camera surface) to return to zone collection and pick another zone or move forward in the flow; normal staged-flow navigation/actions return only after scan closes.
- Edge Cases:
  - lock/convergence thresholds are tuned to lock readily on a clearly-leading card while retaining the runner-up margin guard; rare wrong auto-adds are acceptable because they are removable in one tap, and an ambiguous frame keeps searching rather than committing (DEC-059, DEC-058)
  - if no confident match, keep auto-scanning with manual capture available; manual search is reached by exiting scan — the in-scan low-confidence manual-search escalation prompt is not shown (DEC-076)
  - under glare/gloss, uneven or dim lighting, camera shake, or finger occlusion, the query is conditioned and the best frame is selected so the true card's hash distance drops below the lock gate; the gate itself is held (DEC-059 values) — robustness comes from a cleaner query, not a looser gate (DEC-062)
  - finger occlusion is treated as a frame-quality penalty (the scanner prefers an unoccluded frame); there is no masked/partial-region matching (DEC-062)
  - card-back detection is descoped from the shipped UX (no canonical reference asset); a scanned card back falls through to the normal low-confidence path (DEC-055)
  - if a scanned card would duplicate a card already in the stack, the existing duplicate block applies and a non-blocking notice is shown while scanning continues (`FLOW-004`, DEC-056)
  - if the stack already has 10 cards, additional adds are blocked (same as manual) with a non-blocking notice while scanning continues
  - if camera permission is denied or unavailable, fall back to manual search and surface the reason
  - stack cards are added in scan order, bottom-to-top; manual reorder remains out of scope (`FLOW-002`)
  - the preview and the added card's thumbnail show the **scanned printing's** art, not the oracle-level representative image, so the on-screen art matches the physical card; if the scanned printing has no image in the bridge, it falls back to the oracle-level image (DEC-070)
  - on hard captures (ornate/etched-foil/full-art printings, a card whose border barely contrasts the play surface, or a card **held up to the camera, tilted and finger-occluded, against a cluttered background**) the detector raises its recall to still lock the 4-corner outline; detection is **biased toward the on-screen card-shaped guide** the user aligns to, so background clutter outside the guide does not win selection, and the searching-state copy actively coaches the easy regime (fill the guide, flat contrasting surface, fingers off the edges); if it persistently cannot find a card, the scan surfaces a condition-aware nudge rather than a silent `no-card`, and manual search stays available — the stabilizer lock gate is unchanged so looser detection does not cause wrong auto-adds (DEC-072, DEC-073)
  - while the opt-in debug overlay is enabled, the **Capture** button additionally exports the exact failing camera frame for detector tuning; with the overlay off (default) this is invisible and Capture behaves normally (DEC-072, DEC-065)
  - the camera is opened in a higher-resolution capture mode (continuous autofocus where supported, graceful fallback) so the warp reads a sharper source and a card locks across a wider range of distances and lighting instead of only a narrow sweet spot; once a frame is good enough to lock the searching indicator shows a positive "good — hold steady" cue so the user can find and hold the lockable zone, and the matching recipe/bin/identify/lock boundary is unchanged (DEC-074)
  - scanner acquisition is validated against both the hard Mac-webcam baseline and a stand-assisted controlled setup when available; this is a QA/diagnostic matrix, not a different user mode, and failures should identify the blocking stage before more tuning is baked in (DEC-077)
- Notes:
  - scanning is an optional alternate input path (DEC-050); manual search remains the default and a permanent fallback
  - while scan is open, zone-collection search, the card list, and outer staged-flow navigation/action buttons are hidden; scan-local controls including **Capture** remain available, and **Exit scan** is the path back to manual search or normal flow navigation (DEC-076)
  - identification runs fully on-device with no network calls (DEC-051); art-only matching yields ranked candidates resolved to oracle-level `CardMetadataItem` (DEC-053), with the scanned printing's image carried as presentation only (DEC-070)

### FLOW-007
- Name: Choose and persist app theme palette
- Trigger: User wants to personalize the app's visual style
- Preconditions:
  - app is loaded
- Main Flow:
  1. User opens the global theme/settings affordance from the app chrome.
  2. App shows the predefined palette choices as named swatches, with the current palette indicated.
  3. User selects a palette.
  4. App immediately applies the selected palette to primary accent surfaces without leaving the current workflow step.
  5. App stores the selected palette for the browser.
  6. On later reloads, app restores the stored palette before or during initial render without resetting user workflow state.
- Edge Cases:
  - if the stored palette id is missing, corrupt, or unsupported, app falls back to the default blue palette
  - if browser storage is unavailable or write fails, the selected palette may apply for the current session but app continues normally
  - selecting the current palette is a no-op and does not close or reset the main gameplay workflow unless the implemented control naturally closes after selection
- Notes:
  - theme selection is frontend-only personalization and never changes submitted game context, prompt text, backend API behavior, or AI responses

### FLOW-008
- Name: Choose and persist layout density
- Trigger: User wants a tighter or roomier layout spacing
- Preconditions:
  - app is loaded
- Main Flow:
  1. User opens the global theme/settings affordance from the app chrome.
  2. App shows the Chunky / Slim density choices below the palette swatches, with the current density indicated.
  3. User selects a density.
  4. App immediately applies the selected density via `data-layout-density` on `document.documentElement` without leaving the current workflow step.
  5. App stores the selected density for the browser.
  6. On later reloads, app restores the stored density before or during initial render without resetting user workflow state.
- Edge Cases:
  - if the stored density value is missing, corrupt, or unsupported, app falls back to chunky
  - if browser storage is unavailable or write fails, the selected density may apply for the current session but app continues normally
  - selecting the current density is a no-op and does not close or reset the main gameplay workflow unless the implemented control naturally closes after selection
- Notes:
  - density selection is frontend-only personalization and never changes submitted game context, prompt text, backend API behavior, or AI responses
  - chunky is the default and must match pre-change spacing on reference screens (DEC-075, REQ-055)
