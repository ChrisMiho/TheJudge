# user-flows.md

### FLOW-001
- Name: Capture game context, zones, and ask a question
- Trigger: User opens the app to understand an MTG rules or interaction question
- Preconditions:
  - app is loaded
  - local metadata is available
- Main Flow:
  1. Game setup: user sets player count, active player when known, and turn phase via dropdown; turn phase is required and defaults to **main_1**. The expandable **Players in game** panel renders each active player as a compact card with display name and life visible. A secondary-details arrow on every player card controls one synchronized state: activating any arrow expands or collapses Poison, Energy, Experience, Commander damage, and named counters for all active players. Active player and downstream player selects show display names as `Player N (Name)` when set. Turn phase and active player appear in one merged panel; the cat-wizard hero image is hidden until the user clicks the brand title 10 times on this step (session-only reveal).
  2. Zone confirmation: app preselects likely zones from the turn phase; user adjusts the checklist; at least one zone is required to continue.
  3. Per-zone collection: for each selected zone, user may add card identities from local search; non-stack cards capture owner; stack cards are ordered bottom-to-top. Added cards appear in a horizontal left-to-right strip in add order with horizontal region scroll. An available uncropped card image sizes to the container its host affords (DEC-160) rather than to a fixed compact cap; a corner detail control opens a dismissible popup that fetches oracle/metadata on demand by oracle id (FLOW-024). If the image is unavailable, the fallback shows the locally available identity (the card name) directly, and opening the popup still fetches the detail. Remove and stack position remain available. Each complete tile has a restrained ring derived from the card's existing colors, with a light silver-gray treatment for colorless/missing colors. While scan is open, search and the card list are hidden; user exits scan to return to manual search.
  4. Enrichment: default card-by-card wizard (OK advances); optional **View all cards** for full-list edit with per-zone internal scrolling; user may add caster, targets, notes, and mana spent where relevant. In both modes, the same container-relative image + corner detail popup presentation appears above full-width enrichment fields (DEC-160); the popup's descriptive fields load on demand (FLOW-024). The complete image-bearing or fallback card row uses the same identity-ring treatment as zone collection.
  5. Submit: user enters an optional question, clicks **Send Request** on the initial decrypt control, and the frontend sends `question` plus `gameContext` to the backend.
  6. Backend builds the prompt and returns a plain-text answer.
  7. Frontend displays the answer in the shared chat-first conversation workspace; frozen game context is available through the adaptive read-only context trigger/sheet/drawer and follow-ups continue through FLOW-005.
- Edge Cases:
  - if game-context values are missing/invalid, continue action is blocked
  - if zone confirmation has zero zones selected, continue action is blocked
  - if a selected zone has no cards, omit that zone key from `gameContext.zones`
  - if no selected zone contains at least one card, continue/submit is blocked until the user adds a card to a selected zone
  - if no matches are found, show **No matching card found**
  - if the question is blank after trimming, use a zone-aware fallback: **Resolve the stack** when the stack zone has cards; otherwise **Explain the interaction with the provided game state** when another selected zone has cards
  - if stack is selected but has no cards and another selected zone has cards, submit remains allowed; enrichment shows what will be sent before decrypting
  - if a display name is empty, whitespace-only, or matches the fixed player label, treat it as unset
  - if an image URL is absent or fails, replace the image without a broken-image icon and without triggering a detail fetch; the fallback shows the locally available identity (the card name) and all workflow controls remain available. Descriptive detail is available only by opening the popup, which fetches it on demand (FLOW-024)
  - if card colors are empty, missing, or unrecognized, use the light silver-gray ring; card rendering and workflow behavior continue unchanged
  - if the stack has 10 cards, block additional adds
  - if the user changes phase after selecting zones, newly assumed zones are added and existing cards/enrichment are preserved
  - player secondary details default collapsed; every per-player arrow reflects and toggles the same all-player expanded state, so mixed open/closed player cards cannot occur
  - closing the outer player panel or leaving and returning to In-Depth Question resets secondary details collapsed without clearing player values or other in-progress flow state
  - on phone and desktop viewports, expanding secondary player details must not push cards or controls horizontally off-page, misalign the expand panel, or introduce document-level horizontal scroll (DEC-128, REQ-106)
  - returning to a staged step after leaving the destination and resizing the viewport must not leave the optional-question composer collapsed below one line or clipping typed content (DEC-131, REQ-110, REQ-120)
  - composer growth must not clip UI below the field or force page scroll from growth alone (REQ-110)
  - on narrow/mobile viewports, the card-detail view reached from zone search must keep its add action in the first viewport; the image is container-relative and bounded by the hosting row's recorded cap rather than a fixed compact size (DEC-160, REQ-125, REQ-128, REQ-129)
- Notes:
  - this is the primary core product flow with staged context capture
  - each staged step's header presents the active step name inline to the right of the `TheJudge` / `MTG Assistant` brand block in a single row (DEC-067, REQ-045); the answered-state conversation header stays a slim brand-only header with no step name and carries an inline feature-portal Menu slot (DEC-109, REQ-089)
  - staged-flow compaction (DEC-076, REQ-056) and automatic fluid responsive presentation (DEC-117, REQ-096) are presentation-only and do not change this flow's logic or payloads; users select no layout profile
  - compact synchronized player-secondary disclosure (DEC-120, REQ-100) changes only the visibility of existing player inputs; submitted game context is unchanged for unchanged values
  - player-details containment/alignment (DEC-128, REQ-106) is presentation-only and does not change disclosure semantics or payloads
  - desktop shell width (DEC-145, REQ-124), pre-submit composer composition (DEC-146 / DEC-153, REQ-121 / REQ-132), and card density (DEC-151, REQ-125 / REQ-128–130) are presentation-only and change no step logic or payload

### FLOW-002
- Name: Inspect and remove cards from selected zones
- Trigger: User reviews cards while collecting zone context
- Preconditions:
  - at least one selected zone has a card
- Main Flow:
  1. User opens or views a selected zone's card list.
  2. App lists cards for that zone in a horizontal left-to-right strip in add order; overflow scrolls horizontally inside the strip region.
  3. Stack-zone cards keep bottom-to-top ordering semantics.
  4. Each tile shows an uncropped card image that grows to the tile's own width (DEC-151 as amended by DEC-160; the tile itself does not widen). Image mode keeps Remove and stack position where applicable while hiding duplicated identity labels stacked under the art; a corner detail control opens a dismissible popup whose descriptive fields are fetched on demand by oracle id (FLOW-024). If the image is unavailable, the fallback shows the locally available identity — the card name only — directly, with no detail fetch triggered by image failure. The full tile has a thin ring derived from existing card colors: one semantic color, a stable multicolor gradient, or light silver-gray for colorless/missing colors.
  5. User removes one or more cards.
  6. Zone card count updates.
- Edge Cases:
  - if a card image URL is absent or fails to load, show no broken-image icon or empty image gap; replace it with the name-only fallback (the locally available card name, with no detail fetch on image failure) and keep the complete tile controls
  - if the last card is removed from a zone, that zone remains selected but is omitted from the request payload
- Notes:
  - manual reorder is out of scope for the core product
  - horizontal strip layout, container-relative image presentation, and detail popup are presentation only (DEC-076, DEC-078, DEC-151, DEC-160, REQ-056, REQ-058, REQ-128, REQ-130); tile images grow inside the existing `w-40` tile rather than widening the strip
  - each card is an independent instance keyed on its `instanceId`: when the same card appears more than once in a non-stack zone, removing or editing one copy targets only that copy and leaves its siblings intact (DEC-082, REQ-061)

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
  1. User enters the shared chat-first workspace with the assistant's first answer visible in the message log.
  2. User may open the compact Game context trigger to inspect the full frozen read-only context in a bottom sheet below `768px` or right-side drawer at `768px+`, then close it and return focus to the trigger.
  3. User reads the assistant's answer in the accessible conversation log.
  4. User types a follow-up in the chat composer (up to 300 characters) and clicks Send.
  5. Send button shows an inline processing animation; button is disabled.
  6. Frontend sends `{ question: followUpText, gameContext: frozen, conversationHistory: fullPriorExchange }` to `POST /api/ask-ai`.
  7. Backend inserts `CONVERSATION HISTORY` before `QUESTION` in the prompt and returns a plain-text answer.
  8. User bubble and then assistant bubble are appended to the log. If the reader was near the bottom, the newest message is followed; if the reader had scrolled up, their position is preserved and a New response control appears.
  9. Send button is restored; user can send another follow-up.
- Edge Cases:
  - if the follow-up request fails, the error is shown and a retry button is presented; retry resubmits the failed follow-up with the same frozen context and history
  - if the user clicks start over, the conversation thread is cleared, enrichment editing is unfrozen, previously entered context is preserved, and the pre-decrypt enrichment state is restored
  - start over is not available while a request is in flight
  - if history chars exceed `MAX_CONVERSATION_HISTORY_CHARS` (6000), oldest turns are truncated before the prompt is assembled
  - when the backend is running in mock mode, the assistant bubble still appends in the same chat thread and its answer contains the exact assembled LLM-facing prompt for that submitted user message
  - while the reader is farther than 64px from the bottom, incoming messages never force-scroll; activating New response scrolls to and places keyboard focus on the newest assistant message without clearing any composer draft
- Notes:
  - game context, zones, cards, and enrichment are frozen for the duration of the conversation; follow-ups are text-only in v1
  - the initial user question (including fallback) is included in `conversationHistory` sent to the API but is not shown as a visible bubble in the thread
  - the answered-state screen keeps the top header slim and uses the compact context trigger plus adaptive overlay so the message log remains primary (DEC-118, REQ-097, REQ-098)

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
  3. As the scanner enters the `locking` state (a confident leader accumulating votes), an affirmative outline is drawn on the detected card in the viewfinder as a positive "you're close — hold this angle" alignment cue; it clears if the scanner drops back to `searching` (DEC-083). Once one card is consistently the best over a short window with high confidence, it **locks in** and is **auto-added** to the current zone via the existing add path (owner via the sticky owner selector, duplicate-stack block, stack-size limit, `ZoneCardItem` output) — no Accept tap and no selecting from a list (DEC-056).
  4. A thumbs-up confirmation popup fades in and out and a short "ding" plays (on by default; a top-left mute toggle silences the sound only, not the popup); auto-scan immediately resumes for the next card and the scan review bubble shows the running count of cards added this session (DEC-058, DEC-057, DEC-061).
  5. To remove a wrong auto-add, the user taps the scanned-cards bubble in the top-right. Its viewport-capped 320px panel lists each card with the shared container-relative image + corner detail popup presentation and a persistent Remove control. An available uncropped image grows to its list-row width (DEC-160) without displacing the camera chrome; the corner control opens a popup whose descriptive fields are fetched on demand by oracle id (FLOW-024) when opened and the network allows, degrading gracefully offline; if the image is unavailable, the fallback shows the card name only, with no fetch triggered by image failure. Each complete entry has the same restrained identity ring used by zone collection and enrichment. Long sessions scroll inside the panel. The user removes the card in one tap (no confirmation) without leaving the camera (DEC-058, DEC-078, DEC-151).
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
  - if neither the selected printing image nor its oracle-level fallback can load, including while offline, the scan review entry shows the name-only fallback (the locally available card name) with no broken-image icon, no additional fetch triggered by the image failure, and no loss of the Remove control — the surface stays fully usable offline (DEC-078 preserved)
  - on hard captures (ornate/etched-foil/full-art printings, a card whose border barely contrasts the play surface, or a card **held up to the camera, tilted and finger-occluded, against a cluttered background**) the detector raises its recall to still lock the 4-corner outline; detection is **biased toward the on-screen card-shaped guide** the user aligns to, so background clutter outside the guide does not win selection, and the searching-state copy actively coaches the easy regime (fill the guide, flat contrasting surface, fingers off the edges); if it persistently cannot find a card, the scan surfaces a condition-aware nudge rather than a silent `no-card`, and manual search stays available — the stabilizer lock gate is unchanged so looser detection does not cause wrong auto-adds (DEC-072, DEC-073)
  - while the opt-in debug overlay is enabled, the **Capture** button additionally exports the exact failing camera frame for detector tuning; with the overlay off (default) this is invisible and Capture behaves normally (DEC-072, DEC-065)
  - the camera is opened in a higher-resolution capture mode (continuous autofocus where supported, graceful fallback) so the warp reads a sharper source and a card locks across a wider range of distances and lighting instead of only a narrow sweet spot; once a frame is good enough to lock the searching indicator shows a positive "good — hold steady" cue so the user can find and hold the lockable zone, and the matching recipe/bin/identify/lock boundary is unchanged (DEC-074)
  - scanner acquisition is validated against both the hard Mac-webcam baseline and a stand-assisted controlled setup when available; this is a QA/diagnostic matrix, not a different user mode, and failures should identify the blocking stage before more tuning is baked in (DEC-077)
- Notes:
  - scanning is an optional alternate input path (DEC-050); manual search remains the default and a permanent fallback
  - scan-review image sizing, panel layout, and identity ring are presentation only (DEC-078, REQ-058); the counter, removal, and scan loop behavior are unchanged
  - each auto-added card is an independent instance keyed on `instanceId`; scanning the same card twice into a non-stack zone yields two scan-review entries, and one-tap removal targets only the chosen instance (DEC-082, REQ-061)
  - while scan is open, zone-collection search, the card list, and outer staged-flow navigation/action buttons are hidden; scan-local controls including **Capture** remain available, and **Exit scan** is the path back to manual search or normal flow navigation (DEC-076)
  - identification runs fully on-device with no network calls (DEC-051); art-only matching yields ranked candidates resolved to oracle-level `CardMetadataItem` (DEC-053), with the scanned printing's image carried as presentation only (DEC-070)

### FLOW-007
- Name: Choose, customize, and persist app color profile
- Trigger: User wants to personalize the app's visual style
- Preconditions:
  - app is loaded
- Main Flow:
  1. User opens the feature-portal Menu and finds its palette-only **Theme** section.
  2. App shows White, Blue, Black, Red, Green, and Colorless in that order as named swatches, with the current profile indicated and Blue as the default.
  3. User selects a profile.
  4. App immediately applies the selected profile to primary accents and the restrained resting/hover/focus/current treatments on REQ-060's closed minimum surface inventory without leaving the current workflow step.
  5. If the user selects Colorless, the Theme section exposes an inline full-spectrum color input and `Reset to gray`.
  6. If the user chooses a custom color, app immediately applies the exact RGB without validation or contrast correction and remembers it independently; if the user selects Reset, app deletes only the custom value and restores fixed neutral gray.
  7. App stores the selected profile for the browser.
  8. On later reloads, app restores the selected profile and any remembered Colorless custom RGB before or during initial render without resetting user workflow state.
- Edge Cases:
  - if the stored profile id is missing or corrupt, app falls back to Blue; if it is Violet, Emerald, Amber, Rose, or otherwise unsupported, app deletes that selected-profile value and falls back to Blue
  - if a saved custom RGB is malformed, app deletes the custom value and uses fixed Colorless gray
  - if browser storage is unavailable or write fails, the selected profile/custom RGB may apply for the current session but app continues normally
  - selecting the current fixed profile is a no-op and does not close or reset the main gameplay workflow unless the implemented control naturally closes after selection
  - a low-contrast custom Colorless choice is applied as chosen; the app does not warn, reject, or repair it
- Notes:
  - theme selection is frontend-only personalization and never changes submitted game context, prompt text, backend API behavior, or AI responses
  - only REQ-060's closed minimum surface inventory uses the restrained ambient hierarchy from DEC-081; static chrome and the dominant page background remain neutral
  - DEC-119 / REQ-099 define the exact fixed token matrix and Colorless persistence/reset contract

### FLOW-008
- Name: Retired — choose and persist layout density
- Retired by DEC-117 / REQ-096. Responsive presentation is automatic and requires no replacement user flow.

### FLOW-009
- Name: Build a two-sided trade and read the balance
- Trigger: User opens the Trade Balancer from the top-level navigation menu (FLOW-010) to compare the value of two lists of cards
- Preconditions:
  - app is loaded
  - the printing-level price artifact loads on first open (lazy-loaded, REQ-066)
- Main Flow:
  1. The Trade Balancer opens with two sides (**Side A** and **Side B**), each an empty card list, and a running total per side plus the difference between them.
  2. For a side, the user adds a card by **scanning** or by **manual search**:
     - Scan: the existing engine identifies the card and the **scanned printing** becomes the entry's default printing; the user can change the printing if it is wrong (DEC-070, REQ-065).
     - Manual search: the user finds the card by name and then **chooses the correct printing** from that card's printing list; that printing's price applies (DEC-012, REQ-065).
  3. The added entry shows its printing (set/collector/image), its USD price, a **foil toggle** (non-foil ↔ `usd_foil`), and a **quantity** control; the same card may be added multiple times or carry a quantity ≥ 1.
  4. Each side total updates live as `Σ qty × (foil ? usdFoil : usd)`, and the difference between the two sides updates with an amount and which side is higher (or equal).
  5. The user adds cards to the other side the same way, adjusts foil/quantity, and removes entries as needed until the difference reflects the trade.
  6. The user reads the balance at a glance and returns to MTG Assistant via the navigation menu when done; trade state is not persisted.
- Edge Cases:
  - if the chosen printing has no price for the selected foil mode, the entry contributes **$0**, its price is shown in a distinct color, and a **caution-triangle** indicator marks it so the user knows the value is unknown (REQ-065)
  - the same card may appear more than once on a side; the stack duplicate-block (FLOW-004) and 10-card cap do not apply to trade sides (DEC-087)
  - toggling foil on an entry with no `usd_foil` (or off with no `usd`) applies the $0 + caution treatment for that mode
  - a scanned printing that resolves but is the wrong print is corrected by changing the printing on the entry, not by re-scanning
  - if scanning is unavailable (no camera/permission), manual search remains the full input path (DEC-050 fallback)
  - if the price artifact fails to load, the view surfaces the reason and entries show the $0 + caution treatment rather than a broken screen
- Notes:
  - the trade balancer is a standalone, frontend-only, ephemeral feature outside the Decrypt-Stack core loop; it makes no backend call and no `AskAiRequest`/prompt change (DEC-087)
  - printing selection is a pricing/display layer only and does not change scan oracle-level identity, prompt context, or rulings (DEC-053, DEC-087)
  - prices are a static build-time snapshot; the UI may show the snapshot date (DEC-088, NFR-013)

### FLOW-010
- Name: Switch destinations via the feature portal
- Trigger: User wants to move between the registered suite destinations or change the app palette
- Preconditions:
  - app is loaded
- Main Flow:
  1. User taps the icon-only portal Menu button in the **top-middle** of the current screen's header; it is the suite's only floating/attached app-chrome affordance.
  2. The Menu opens and lists the registered destinations — **In-Depth Question**, **Quick Question**, **Trade Balancer**, and **Life Tracker** — with the current destination indicated. It also shows the palette-only **Theme** section and any registered action entries (v1: **Send feedback**).
  3. User selects another destination.
  4. App switches the active view to the selected destination without leaving the app or reloading.
  5. To return, the user opens the same Menu and selects the other destination. Palette selection may also be changed in place without switching destinations.
- Edge Cases:
  - selecting the current mode is a no-op and does not reset in-progress state
  - switching destinations preserves each destination's in-session state while the app stays loaded (an in-progress In-Depth Question flow survives a trip to Quick Question and back), except that returning to In-Depth Question resets only its ephemeral player secondary-details disclosure to collapsed (DEC-120); the outer roster-disclosure state, player count, display names, life totals, counter values, current staged-flow step, and every other in-progress destination value remain preserved
  - refreshing the page restores whichever destination was last active in that browser tab (DEC-111, REQ-090); each destination's in-session state (staged flow, conversation, follow-ups) still resets fresh on refresh — only the choice of which destination screen mounts is persisted
  - a brand-new tab/window with no prior activity opens on the first registered destination, unchanged
  - the portal button and Menu must not overlap or intercept taps meant for the brand or step-name columns (DEC-095, DEC-109)
- Notes:
  - navigation is frontend-only chrome and never changes submitted game context, prompt text, backend API behavior, or AI responses (DEC-095, DEC-089)
  - In-Depth Question's staged data/flow and Quick Question's lookup behavior are unchanged by navigation apart from DEC-120's presentation-only reset exception
  - palette selection follows FLOW-007; layout density FLOW-008 is retired and responsive presentation is automatic (DEC-117 / REQ-096)

### FLOW-011
- Name: Ask a Quick Question with optional card context
- Trigger: User opens **Quick Question** from the feature portal (FLOW-010) to ask about a single card, or ask a freeform Magic rules question, without staging any game state
- Preconditions:
  - app is loaded
  - local card metadata and the committed core-topics browse data are available
  - for scan input: the device has a usable camera with permission and the fingerprint library loads on first scan (FLOW-006)
- Main Flow:
  1. User selects Quick Question from the feature portal; the app switches to the lookup view (frontend-only, no reload).
  2. The pre-submit view shows, top to bottom: an optional card-attach control (its "OPTIONAL CARD" label followed inline by the guidance copy "Add a card for context or ask any Magic related question.", dash-separated, DEC-113), the Question field, then a collapsed-by-default "General rules topics" outer disclosure. Its summary remains visible regardless of whether a card is attached or the Question field already has text; expanding it reveals a short list of core rules topics (the stack & priority, targeting, combat, layers) the user can read locally with no AI call.
  3. User optionally resolves one card either by typed autocomplete search (reusing REQ-001/REQ-002 behavior) or by scanning it with the existing camera scanner (FLOW-006 engine); the result is a single oracle-level card, shown with name, image when available, oracle text, and full metadata. The user may instead skip card input.
  4. After expanding the outer "General rules topics" disclosure, each topic row shows its title, a "Use this topic" button, and an expand/collapse toggle without needing to expand the row; expanding a row reveals that topic's rule numbers and excerpt and auto-collapses any other open topic (accordion). Tapping "Use this topic" locks that topic's phrase (`Tell me about {Topic}.`) into a non-editable pill next to the Question field's label (with its own remove control), smooth-scrolls the view to the Question field, and focuses the textarea; any text the user already typed in the textarea is preserved as optional supplementary context (REQ-091).
  5. User enters or continues a freeform question (subject to the same 300-character cap as the main flow, which measures the **raw editable textarea content** — the locked pill phrase and the silent card-name fallback are composed at submit time and do not consume that budget, REQ-091 as amended by REQ-134) and submits, with or without a card attached and with or without a locked topic pill.
  6. Frontend sends `{ mode: "lookup", question, card? }` to `POST /api/ask-ai`; `question` is the client-composed string (the locked pill phrase plus any supplementary textarea text, the textarea alone when no pill is locked and it has text, or — when no pill is locked and the textarea is empty but a card is attached — a silent `Tell me about {Card Name}.` fallback, per REQ-091); `card` is present only if one was attached; no `gameContext` is sent.
  7. Backend assembles one lookup-mode prompt: question-driven rules retrieval (MTG reference block, always-on core game-rules topics, System 3 supplemental) always runs; when a card is attached, per-card enrichment (WotC rulings, full metadata incl. oracle text, and a System 3 query extended with that card's name, type line, and keywords — not its oracle text, REQ-178) layers in; game-state-only sections are always omitted. Off-domain questions get the "confused rules lookup" persona response rather than a direct answer. Backend returns a plain-text answer.
  7a. While the request is in flight and no answer has arrived yet, the Question form is hidden and replaced in place by the waiting panel (live elapsed timer, escalating messages); the Optional card section and the General rules topics disclosure stay visible and interactive throughout (DEC-114).
  8. Frontend replaces the waiting/pre-submit view with the shared chat-first workspace (first visible bubble is the assistant answer; the initial question is not shown). When a card was attached, a compact card-context trigger opens its read-only presentation in a mobile bottom sheet or desktop right drawer; without a card, no context trigger renders.
  9. User may send text follow-ups from the reused composer; each follow-up sends `{ mode: "lookup", question, card: frozen (if one was attached), conversationHistory }` under the same conversation limits as the main flow.
  10. User may start over, which clears the thread, any locked topic pill, and returns to the pre-ask state — with the looked-up card preserved if one was attached; the collapsed outer "General rules topics" summary remains visible either way.
- Edge Cases:
  - if no pill is locked, the question is blank after trimming, and no card is attached, submit is blocked; if a card is attached in that same state, submit is enabled and the composed question silently falls back to `Tell me about {Card Name}.` (REQ-091); the collapsed outer "General rules topics" summary remains visible regardless (it is not a fallback state, per REQ-079)
  - AI failure reuses the main flow's failure handling (FLOW-003): the message **Miho is working on it**, preserved card/question/pill, retry with cooldown; the Question form reappears (waiting panel removed) alongside the error and retry affordance (DEC-114)
  - if the follow-up request fails, the error is shown and retry resubmits with the same frozen card (if any) and history (FLOW-005)
  - if history chars exceed the shared cap, oldest turns are truncated first (REQ-027)
  - in mock provider mode, the assistant bubble still appends in the same thread and its answer contains the exact assembled LLM-facing prompt for that submitted message
  - scan input inherits FLOW-006 behavior (permission fallback to manual search, scanned-printing art as presentation only); scan resolves to one card rather than adding into a zone
  - an off-domain question (with or without a card attached) gets the "confused rules lookup" persona response (DEC-108), not a direct answer
  - selecting a second topic before submitting swaps the locked pill without touching any text already typed in the textarea (REQ-091)
  - if a later answer arrives while the reader is farther than 64px from the bottom, the log preserves reading position and shows New response; activating it scrolls to and places keyboard focus on the newest assistant message without clearing any composer draft (REQ-098)
- Notes:
  - Quick Lookup carries no zones, stack, phase, or multi-card setup (DEC-107); it is not a full Comprehensive Rules browser and not official judge authority (canonical rule: `goals-and-non-goals.md` Scope Notes; retired index DEC-002 / DEC-013)
  - reuses existing search, scan, core-topics, and the shared conversation workspace; when a card is attached the conversation is frozen on it, otherwise there is no frozen context object; follow-ups are text-only in v1
  - shares the main flow's conversation and text limits; Quick Lookup defines no separate limit policy
  - no answer-seeded second-pass retrieval in v1 (deferred, tracked as Q-004); the model still surfaces relevant verbatim rules from the first-pass provided set
  - a future option to attach optional lightweight game context to the card branch is tracked as Q-003 and is out of v1 scope
  - the "General rules topics" section's placement, always-rendered collapsed outer summary, nested row-level accordion disclosure, and the "Use this topic" locked-pill mechanism were confirmed during quick-question-ui-refinement (DEC-112 / REQ-091)
  - during quick-lookup refinement this flow was rewritten to merge the prior separate Card Lookup flow (this ID) and Rules Lookup flow (former FLOW-012) into one; see FLOW-012
  - DEC-118 / REQ-097 / REQ-098 refine answered-state presentation and scrolling only; lookup request/prompt behavior is unchanged

### FLOW-012
- Name: Look up a rules concept and ask a question
- Merged into FLOW-011 (Look up a card or ask a rules question in Quick Lookup) during quick-lookup refinement, which unified Card Lookup and Rules Lookup into one feature-portal destination (DEC-107). See FLOW-011.

### FLOW-013
- Name: Track a game on the life tracker and hand off to MTG Assistant
- Trigger: User opens **Player Life Tracker** from the feature portal (FLOW-010) to track life and counters during a game
- Preconditions:
  - app is loaded
- Main Flow:
  1. User selects Player Life Tracker from the feature portal; the app switches to the tracker view (frontend-only, no reload).
  2. User opens Game Setup to set player count (2–8 via `−`/`+`) and a starting-life preset (20/25/30/40 or Custom defaulting to 60); changing count applies In-Depth defaults (2 → 20, 3+ → 40) unless starting life was already customized; each player card seeds to the starting life, arranged in full table orientation facing each seat. Names are edited via Game Setup’s Edit names disclosure.
  3. During play, users tap each card's `+`/`−` zones to adjust life (REQ-112); a card shows a skull when that player's life reaches ≤ 0 and clears it if life returns above 0.
  4. The tracker header always shows the game-wide day/night designation; tapping it flips day ↔ night (REQ-111 / DEC-132). The designation is manual only and is not seeded into In-Depth.
  5. Users open a player's counter panel to track the per-opponent commander-damage matrix (always-visible `−`/`+` bands per REQ-112) and named counters (poison, energy, exp, and the rest of the palette) plus any generic custom counter; incrementing opponent commander damage also decrements that player's life.
  6. Tracker state persists to browser-local storage, so a reload or phone-lock restores the in-progress game (DEC-103).
  7. When the user switches to MTG Assistant / In-Depth Question, the game-setup roster is seeded one-way from current tracker state (count, names, life, counters); day/night designation is not included; the user may edit before Decrypt.
  8. Returning to the tracker preserves its live state; an explicit reset / New Game returns counters to starting values (presentation preferences may survive New Game).
- Edge Cases:
  - the tracker's player count is constrained to 2–8, so the seeded roster always conforms to the game-context contract
  - counters left at zero or unset are omitted from the seeded `gameContext` payload (REQ-083)
  - a page reload mid-game restores tracker state rather than losing it (DEC-103)
  - the skull at life ≤ 0 is a visual death cue only; the player card remains and life can still be adjusted back up
  - old saves that still carry a removed `dayNightEnabled` flag load; the flag is ignored and the header control remains available
- Notes:
  - the tracker is a life/counter tracker, not a rules engine or board/zone tracker (canonical rule: `goals-and-non-goals.md` Scope Notes; retired index DEC-013); it does not replace the staged zone / Ask AI flow, only seeds player-facing context into it
  - deferred surfaces: game history, mana counter, dice & misc, per-player theming, saved profiles, reset-with-winner; Planechase / Archenemy / Bounty are out of scope
  - UI direction is driven by the reference photos under the refinement package's `references/`

### FLOW-014
- Name: Send feedback / report a bug
- Trigger: User opens the feature portal (FLOW-010) and selects the **Send feedback** action entry
- Preconditions:
  - app is loaded
- Main Flow:
  1. User opens the top-middle feature-portal menu and selects **Send feedback** (an action entry, DEC-104); the app opens the feedback modal over the current screen without switching the active destination or losing in-progress state.
  2. User picks a category (Bug / Suggestion / Other) and writes a message; the message is required.
  3. User optionally enters a reply email (blank = anonymous); if present, it must be a valid email format.
  4. The modal shows a one-line disclosure that current app state is attached and, on demand, an **expandable summary** of exactly what is included (screen/step, game context + typed question, zones/cards/enrichment, conversation history, provider mode, active destination, environment).
  5. User submits; the modal goes to a sending state and posts the report plus the JSON-stringified snapshot to Formspree.
  6. On success the modal shows an acknowledgement and can be dismissed; on error it shows an inline error and preserves the draft for retry.
- Edge Cases:
  - message empty (after trim) → submit is blocked with an inline message-required prompt
  - reply email present but malformed → submit is blocked with an inline format prompt
  - no Formspree form id configured (local/mock) → submit is disabled/no-op with an explanatory hint; dev never crashes
  - network error or rate-limit on submit → inline error, draft preserved, retry available
  - Esc or the close control dismisses the modal and restores focus to the portal trigger; the underlying screen state is unchanged
- Notes:
  - feedback is frontend-only chrome + delivery; it never changes submitted game context, prompt text, backend API behavior, or AI responses (DEC-105)
  - the snapshot is read-only and disclosed; screenshots/file uploads are out of v1 scope
  - the same expandable summary content is what is serialized and delivered (REQ-088)

### FLOW-015
- Name: Context-aware Commander Spellbook combo enrichment
- Trigger: User submits an In-Depth Question or Quick Question through the existing `POST /api/ask-ai` flow
- Preconditions:
  - the existing game or lookup request passes normal Ask AI validation
  - combo eligibility and artifact availability are evaluated by the backend and are not required for the base request to continue
- Main Flow:
  1. Backend normalizes the submitted question and deterministically checks for narrow explicit combo intent (REQ-094).
  2. For game mode without combo intent, the matcher considers only variants whose complete exact/template ingredient multiset can be assigned to distinct submitted card instances in compatible zones.
  3. For game mode with combo intent, the matcher keeps complete variants first and may add partial variants anchored to card names mentioned in the question; if no submitted card is named, submitted cards seed overlap matching.
  4. For lookup mode, the matcher proceeds only when combo intent is explicit and a card is attached, and considers variants containing that card as an exact ingredient or authoritative template match.
  5. The matcher annotates compatible present, wrong-zone, missing exact, matched-template, and unresolved-template ingredients, attaching to each the card state applicable to the zone its assigned instance actually occupies — the expected zone's state for wrong-zone and missing entries — plus `mustBeCommander`; it ranks deterministically and selects at most five variants (REQ-094).
  6. Prompt assembly inserts the labeled community-sourced combo section after rules/rulings enrichment and before conversation history plus the current question; a fully assigned candidate renders as all pieces present with card state explicitly unverified, never as "complete", and the model is instructed to check that state against the submitted board (REQ-095).
  7. The configured provider answers through the unchanged endpoint/response contract, using official card/rules sources as authority and calling out missing pieces for partial candidates.
- Edge Cases:
  - lookup question has combo language but no attached card → no combo retrieval; normal lookup answering continues
  - attached lookup card has no combo intent → no combo retrieval
  - game context contains only part of a combo and the question has no combo intent → no partial variant is supplied
  - contextual card matches a template but sits in an incompatible zone → marked wrong-zone, not satisfied for completeness
  - template has no authoritative expansion → marked unresolved and cannot complete automatic matching
  - fewer than the required quantity of a card/template match exists → remaining ingredient count is missing
  - combo artifacts are missing, empty, or malformed → combo enrichment is omitted with one diagnostic warning; the question still reaches the provider
- Notes:
  - this flow is prompt enrichment inside the existing Ask AI flows, not a new user-visible screen or API
  - "complete candidate" does not validate mana, commander designation, card state, legality, or prose prerequisites (DEC-116)

### FLOW-016
- Name: Resume a saved conversation from history
- Trigger: User opens the shared conversation workspace's history drawer and selects a saved conversation
- Preconditions:
  - at least one conversation has previously reached a successful answer and was auto-saved (REQ-103)
- Main Flow:
  1. User opens the history drawer from the shared conversation workspace.
  2. Drawer lists saved conversations most-recent-first, each showing flow, timestamp, and a preview of the first question.
  3. User selects an entry.
  4. If the currently active conversation has at least one successful answer, it is auto-saved to history first.
  5. The selected entry's frozen context (game context or attached card), mode, and full message thread load into the workspace, replacing the previously active conversation.
  6. The follow-up composer enables; the user can continue asking follow-ups under the same limits and frozen-context rules as a freshly-decrypted conversation.
  7. On the next successful follow-up in the resumed conversation, its history entry moves to most-recent in the list.
- Edge Cases:
  - selected entry's stored data is corrupted or fails validation → entry is dropped from the list without crashing the app
  - history list exceeds 20 entries → oldest entry is pruned automatically on the next save
  - user selects the same conversation that is already active → no-op, workspace state unchanged
  - user starts a brand-new conversation instead of resuming → existing Start Over / New conversation flow applies unchanged (DEC-040/REQ-029), with auto-save of the outgoing conversation per REQ-103; subsequent mid-flight staging after Start Over becomes/overwrites the Draft slot (REQ-108 / FLOW-017)
  - the feature-portal Menu drawer is already open when the user opens the history drawer (or vice versa) → the previously open drawer closes first, so only one left-edge drawer is ever open at a time (DEC-125)
  - History control is unavailable / missing after Start Over → defect; History must remain always visible on In-Depth Question and Quick Question (REQ-107 / DEC-129)
- Notes:
  - resumed frozen context stays read-only; no zone/card/enrichment editing is introduced (DEC-040 unchanged)
  - no backend, contract, or provider behavior changes; this is a frontend state-restoration flow only
  - Draft resume (pre-submit mid-flight) is FLOW-017, not this completed-conversation resume path

### FLOW-017
- Name: Preserve and resume mid-flight Draft across Menu leave and reload
- Trigger: User stages mid-flight work on In-Depth Question or Quick Question before first successful submit, then leaves via Menu, reloads, or opens History
- Preconditions:
  - user is on (or returning to) In-Depth Question or Quick Question
  - History rail is always visible on these destinations (REQ-107)
- Main Flow:
  1. User stages mid-flight state (typed question, optional card, zones/enrichment, current step — anything before first successful submit). The destination's single Draft slot is written/updated and appears in History as **Draft**.
  2. User may open Menu and navigate to another destination (or reload the page) without submitting; Draft remains browser-local.
  3. Returning to that destination via Menu, or reloading while that destination mounts, auto-hydrates mid-flight UI from Draft (DEC-103-style) so staged work is not lost.
  4. User may also open History from the corner rail (including from a pre-submit step) and select **Draft** or a completed conversation (FLOW-016).
  5. Selecting Draft restores that destination's mid-flight staged state so the user can continue toward submit.
  5a. Selecting a *completed* conversation from a pre-submit step snapshots the current staging to the Draft slot first, then lands on that conversation (DEC-134). The staged attempt is immediately recoverable as the **Draft** row in the same drawer; no confirmation or notice interrupts the transition (DEC-138).
  6. After Start Over from an answered conversation (completed auto-save per REQ-103), new mid-flight staging becomes/overwrites that destination's Draft (still one row). Start Over itself remains answered-only (REQ-029).
- Edge Cases:
  - empty completed history and no Draft → History still opens to an empty/zero-state list
  - Draft storage corrupt → Draft dropped; History still opens; destination mounts fresh
  - first successful submit while a Draft exists for the attempt → Draft cleared; conversation enters completed-history path
  - switching to Life Tracker / Trade Balancer → those destinations have no History zone; returning to In-Depth / Quick Question restores always-on History and auto-hydrates Draft if present
  - selecting a completed conversation with no meaningful staging present → no Draft written, matching Menu-leave's empty-staging behavior
  - selecting a completed conversation while an answered conversation is already active → no Draft to maintain; restore proceeds unchanged
- Notes:
  - one Draft per conversation-bearing destination; no unfinished backlog; no mid-flight Start Over invent (DEC-130)
  - pre-submit empty lower-half screen fill is out of scope for this flow
  - the three mid-flight exits — Menu leave, reload, and opening a saved conversation — are all Draft-covered and must behave identically in both conversation-bearing destinations (DEC-138)

### FLOW-018
- Name: Delete a saved conversation from history
- Trigger: User opens the History drawer and chooses to delete a completed conversation entry
- Preconditions:
  - at least one completed conversation exists in browser-local history (REQ-103)
  - user is on In-Depth Question or Quick Question (History rail available)
- Main Flow:
  1. User opens Conversation history from the corner rail.
  2. User activates delete on a completed entry (not Draft).
  3. App presents an explicit confirmation step naming that the entry will be removed.
  4. User confirms; app removes the entry from local storage and from the list.
  5. If the deleted entry was the active conversation, the workspace clears to the destination's clean pre-answer state without re-saving that thread; otherwise the active workspace is unchanged.
  6. User may close History via Close, Escape, or outside/scrim click (REQ-117).
- Edge Cases:
  - user cancels confirmation → entry remains; drawer stays open
  - last completed entry deleted → drawer shows empty/zero-state (and Draft row if present)
  - storage write fails → app does not crash; user can retry; existing guarded persistence pattern applies
  - Draft row → no delete-via-this-flow; Draft remains overwrite/clear per FLOW-017
- Notes:
  - frontend-only; no backend, accounts, or sync (DEC-143)
  - auto-prune at 20 completed entries remains for entries the user does not delete

### FLOW-020
- Name: Owner halts a graph run in flight
- Trigger: Owner decides a running autonomous graph run should stop before it reaches a terminal state
- Preconditions:
  - a graph run is live and holds `.worktrees/.graph-run.lock`
  - the run has written `PRD/work/<slug>/GRAPH-RUN.md` and is at or between nodes
- Main Flow:
  1. Owner creates `.worktrees/.graph-stop`.
  2. The current node finishes its work and returns to the driver.
  3. Before dispatching the next node, the graph driver finds the sentinel and stops advancing.
  4. The run writes its terminal state, records the halt and the node it halted at under `## Open gate` in `GRAPH-RUN.md`, sets the package `STATUS.*` marker, and updates the `PRD/work/STATUS.md` board row.
  5. The run deletes the concurrency lock and reports the terminal state, the branch, the PR URL if one exists, and the ledger path.
  6. Owner removes the sentinel and resumes later with `/graph-implement PRD/work/<slug>/`, which re-enters at the node the ledger records.
- Edge Cases:
  - sentinel created while no run is live → nothing happens; the next run refuses to start until it is removed, naming the sentinel
  - driver ignores its own check → the hook denies the next node dispatch, and the run cannot advance
  - run is inside a node that will not return → the owner still has Ctrl-C, which strands the lock; the reclaim command for a stale lock is already stated by `classifyLock()`
  - sentinel and a gate park coincide → the park wins, because it already carries the owner's question and resume command
- Notes:
  - the halt reuses the contract's `## Terminal states` table; no new state is added
  - mid-run steering via a `STEER.md` channel is deliberately not part of this flow — an instruction arriving mid-run needs `## Instruction ledger` treatment and is scoped as separate work

### FLOW-021
- Name: Owner reports a bug on shipped code
- Trigger: Owner notices something wrong in a feature that has already shipped and been cleaned up
- Preconditions:
  - the feature shipped, so `PRD/work/<slug>/` was deleted and a receipt exists under `PRD/instructions/receipts/`
  - no `active` package covers the same code, so `thejudge-amend` does not apply
  - no graph run holds `.worktrees/.graph-run.lock`, and `.worktrees/.graph-stop` does not exist
- Main Flow:
  1. Owner invokes `graph-kickoff` with a plain description of what is wrong. No branch name, no classification, no choice of orchestrator.
  2. The door proposes a slug from the description and derives the branch `thejudge-auto/<slug>`.
  3. Node 1 (`preflight`) takes the lock, resolves uncommitted work, and creates and pushes that branch.
  4. Node 2 (`shape`) receives the proposed slug, searches `PRD/instructions/receipts/` for slug and keyword matches, and writes `IDEA.md` with one `## Prior run` line per match.
  5. Node 3 (`define`) runs refinement, which reads those prior-run lines as input alongside `PRD/sections/`.
  6. The driver diffs `PRD/sections/`. A non-empty diff parks at `owner-action` with the complete diff and the new stable IDs; an empty diff advances straight to `gate-qc`.
  7. Owner answers the verdict slots in `GATE-QUESTIONS.md` in the docs PR and merges it; the `graph-implement` loop claims the spec, dispatches `graph-gate-review` to apply the verdicts, and continues.
  8. The run continues through `gate-qc`, `plan`, `build`, `review`, and `close` unattended in `.worktrees/implement-<slug>` (REQ-193), ends `COMPLETE` with the code PR `thejudge-auto/<slug>-work → main` open, and the owner's merge (`land`, node 9) puts the fix, the receipt, and the package's deletion on `main` in one step (REQ-194).
- Edge Cases:
  - description too thin to package → node 2 returns `NO ACTIONABLE PACKAGE`, the run ends at `BLOCKED` naming what it needs, and no package folder is created. The report names the `thejudge-auto/<slug>` branch node 1 already pushed, and the retry supplies an explicit `--branch` so it does not hit `graph-preflight`'s exit-code-2 collision with it
  - no receipt matches → no `## Prior run` section is written and the run continues without interruption
  - an irrelevant receipt matches → refinement reads it as input and discards it; the cost is a read, not a wrong decision
  - an `active` package already covers the same code → the owner uses `thejudge-amend` instead, so one branch touches those files rather than two
  - the derived branch name collides → `graph-preflight`'s existing exit-code-2 condition fires and the door reports it with the derived name
  - refinement changes no product truth → the `define` gate never parks, and the owner's only touches are merging the docs PR and then the code PR (`land`, node 9)
- Notes:
  - the owner never classifies the report as a bug. The same door and the same nodes handle an idea, an observation, and a defect
  - prior-run matches are input to refinement, never scope; scope is still decided at the `define` gate

### FLOW-022
- Name: Owner hands the door a context document
- Trigger: Owner has a generated or written markdown document — a handoff, an audit, a findings list — that should drive the next package
- Preconditions:
  - the document exists as a file, or the owner can paste its markdown in the same message
  - no graph run holds `.worktrees/.graph-run.lock`, and `.worktrees/.graph-stop` does not exist
- Main Flow:
  1. Owner invokes `graph-kickoff` with a short request and one or more file paths, or with markdown pasted in the same message.
  2. The door reads the intake material and proposes a slug, honoring a slug the material proposes ahead of deriving one from the request text.
  3. The door writes each intake item verbatim into `.worktrees/.graph-intake/<run-id>/` under the launch root before dispatching node 1 — an ignored path the kickoff worktree's nodes read by absolute path (REQ-191) — and records any document the material cites as a citation without fetching it.
  4. Node 1 (`preflight`) creates and pushes `thejudge-auto/<slug>`.
  5. Node 2 (`shape`) reads the staged intake and writes `IDEA.md`, adding `## Prior run` lines for any receipt matches. Once `thejudge-kickoff` has created `PRD/work/<slug>/`, node 2 copies the staged intake into `intake/`, commits it on the branch, and deletes the staging copy.
  6. Node 3 (`define`) runs refinement, which reads the full intake as evidence and decides nothing from it that the owner has not seen.
  7. The `define` gate parks on any resulting `PRD/sections/` diff, and the owner walks it one stable ID at a time.
  8. The run continues unattended through `close` (node 8), where `thejudge-cleanup` folds an `## Intake` section into the receipt naming each intake file and its stated origin, inside the code PR; the owner's merge (`land`, node 9) lands it (REQ-194).
- Edge Cases:
  - intake states a conclusion as settled → it is still evidence, and any product truth it produces parks at the `define` gate for the owner
  - intake cites a large source document → the citation is recorded and the source is not fetched
  - a supplied path does not exist or cannot be read → the door reports it before node 1 and does not start the run on partial material
  - intake is large → it is copied whole and read by node 2 within its existing tool-call cap; no size gate refuses it, and staging outside the working tree keeps it clear of node 1's file-count and changed-line thresholds
  - the handed-in source file is itself untracked → it exists only in the launch checkout, which the run never touches (REQ-191); the run reads the copy the door staged at launch instead
  - intake proposes a slug the owner disagrees with → `--branch` overrides the branch, and the owner amends the slug before resuming from the `define` gate
- Notes:
  - the failure this closes is recorded: `receipts/graph-run-boundary-enforcement-2026-08-20.md` states that its six findings came from an untracked document outside the repository that cleanup could neither update nor retire
  - copying rather than referencing is what makes the receipt's evidence chain resolvable after the working file is gone
  - the copy is staged outside the working tree and committed by node 2 rather than written into the package up front, because node 1 resolves the working tree before the branch exists and would carry the intake away with it
  - "evidence, not authority" is a contract rule, not an enforced one; the `define` gate is what catches an intake claim adopted wholesale

### FLOW-023
- Name: Ask a Quick Question about several cards with no game state
- Trigger: In Quick Question the player wants to ask how two or more specific cards interact, without staging a game
- Preconditions:
  - app is loaded
  - local card metadata and the committed core-topics browse data are available
  - for scan input: the device has a usable camera with permission and the fingerprint library loads on first scan (FLOW-006)
- Main Flow:
  1. User opens Quick Question from the feature portal; the app switches to the lookup view (frontend-only, no reload).
  2. The pre-submit view shows, top to bottom: the card-attach control — now able to hold more than one card — then the Question field, then the collapsed-by-default "General rules topics" disclosure.
  3. User adds each card they want to discuss by typed autocomplete search (REQ-001/REQ-002) or by camera scan (FLOW-006); each resolves to one oracle-level card, previewed then added, and each can be removed. Adds are capped at the stated bound (REQ-167).
  4. User types the question (or locks a topic pill, REQ-091) and submits; the request carries the list of attached cards and no game state.
  5. Backend assembles one lookup-mode prompt: per-card full metadata and per-card WotC rulings for every attached card, System 3 supplemental retrieval scored over the question plus each attached card's name, type line, and keywords — not its full oracle text (REQ-178) — and combo enrichment over the card set when explicit combo intent is present; game-state-only sections stay omitted (REQ-167 / DEC-107).
  6. The answer opens the shared chat-first workspace; the frozen context shows all attached cards; follow-ups are text-only with the card set frozen and send `{ mode: "lookup", question, cards: frozen, conversationHistory }`.
- Edge Cases:
  - no cards attached → identical to today's no-card lookup (FLOW-011)
  - exactly one card attached → identical to today's single-card lookup (FLOW-011)
  - user tries to add beyond the cap → the add is blocked with a stated limit, mirroring existing bounded-add patterns
  - an off-domain question → the tuned "confused rules lookup" persona (REQ-168 / DEC-108) still applies whether or not cards are attached
  - AI failure, follow-up failure, or history over the shared cap → same shared handling as FLOW-011 (FLOW-003 / FLOW-005 / REQ-027)
- Notes:
  - Supersedes FLOW-011's single-card constraint by allowing many cards; FLOW-011's no-card and single-card behaviors are unchanged special cases of this flow.
  - Carries no zones, phase, stack, or life — Quick Question explicitly drops game context, so this flow does **not** resolve Q-003 (lightweight game context on a card).

### FLOW-024
- Name: Fetch card detail on demand
- Trigger: a player opens a card's corner detail popup, or the Quick Lookup pre-submit card preview, for a card whose descriptive block is not local
- Preconditions:
  - the card's up-front fields (oracle id, name, imageUrl, colors) are local (REQ-174)
  - the card-detail endpoint `GET /api/cards/:oracleId` is available (REQ-175)
- Main Flow:
  1. Player activates the corner detail control on a card image, or opens the Quick Lookup card preview.
  2. The app fetches that card's descriptive block from `GET /api/cards/:oracleId` on demand (per card; cached for the session after first fetch), showing a brief loading state in the popup/preview (presentation constrained by `PRD/sections/screen-layout.md` — a quiet in-overlay state confined to the descriptive-content region, no branded splash, spinner takeover, progress bar, or motion beyond the existing CSS-motion rules (NFR-006), and no overlay resize or layout shift when the block resolves); the card name, image, and color ring (already local) render immediately.
  3. On success the popup/preview shows the descriptive block (oracle text, type line, mana cost/value, colors, sub/supertypes), identical to today's content.
- Edge Cases:
  - if the fetch fails, the popup/preview shows the locally available identity (name) and a retry affordance; no descriptive fields are invented
  - image failure does not trigger a detail fetch; the image-fail fallback shows the card name only (FLOW-001)
  - once a card's detail is fetched this session, reopening it resolves from the in-memory cache with no repeat request
- Notes:
  - the descriptive block is fetched on demand, never carried in the up-front list (REQ-174), and comes from the `GET /api/cards/:oracleId` endpoint, not a static artifact (D5); this is the read path REQ-128's popup uses
