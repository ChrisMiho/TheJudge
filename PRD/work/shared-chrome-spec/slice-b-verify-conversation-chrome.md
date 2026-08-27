# Slice B — Verify the spec's conversation/overlay-chrome content against its cited sources

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm `PRD/sections/shared-chrome/README.md` (already written, committed
in `0445150`, 442 lines) is complete and correct for the conversation/
overlay half of the file: the conversation-chrome portion of the header
(`Status:`/`Backed by:`), the last four **How it works** subsections
(shared answered-conversation workspace; conversation history drawer; View
Context / adaptive-context overlay; card detail popup + shared close
control), the conversation-chrome portion of **Measured bounds** and
**Rejected alternatives and deferred scope**, and the conversation-chrome
portion of **Where it lives** — against the cited sources and the DEC-168
template. This slice does not touch the structural-chrome subsections
(slice A owns those: shell/banner, routing/load fallback, Menu rail/tray,
Theme, Shared layout language), the two scope-boundary bullets in Rejected
alternatives, or the `PRD/README.md` row / diff-scope proof (slice C owns
those). This slice verifies; it does not author. Close any confirmed,
sourced gap with a bounded additive correction only.

## Requirements

1. Read the cited sources before checking a line:
   `PRD/sections/decisions/conversation-ux.md` (DEC-118, DEC-123, DEC-124,
   DEC-125, DEC-126, DEC-127, DEC-129, DEC-130, DEC-131, DEC-134, DEC-138,
   DEC-141, DEC-142, DEC-143, DEC-144, DEC-146, DEC-153);
   `PRD/sections/decisions/ui-presentation.md` (DEC-151, DEC-156, DEC-158,
   DEC-159, DEC-160). Confirm each home file at read time rather than
   trusting this list — it is a map-out pre-scout, not ground truth.
2. Read `PRD/sections/functional-requirements.md` for REQ-067, REQ-115,
   REQ-116, REQ-117, REQ-118, REQ-119, REQ-126, REQ-128, REQ-135, REQ-141,
   REQ-142. Read `PRD/sections/non-functional-requirements.md` for NFR-001,
   NFR-006. Read `PRD/sections/user-flows.md` FLOW-010, FLOW-016, FLOW-017,
   FLOW-018 in full. Read `PRD/sections/system-map.md`'s `## Follow-up
   chat` block and any adjacent card-presentation/detail-popup entries.
   Read `PRD/sections/screen-layout.md`'s `### Shared chrome` row group for
   the drawer/overlay/popup rows.
3. Confirm the conversation/overlay half of the header: every conversation-
   drawer-overlay and popup/close-control ID in the `Backed by:` line
   (DEC-118, DEC-123, DEC-124, DEC-125, DEC-126, DEC-127, DEC-129, DEC-130,
   DEC-131, DEC-134, DEC-138, DEC-141, DEC-142, DEC-143, DEC-144, DEC-146,
   DEC-151, DEC-153, DEC-156, DEC-158, DEC-159, DEC-160, REQ-067, REQ-115,
   REQ-116, REQ-117, REQ-118, REQ-119, REQ-126, REQ-128, REQ-135, REQ-141,
   REQ-142, FLOW-010, FLOW-016, FLOW-017, FLOW-018, NFR-001, NFR-006)
   resolves to a real, pre-existing ID in its home file. Do not check the
   navigation/structural ID subset in this pass — slice A owns that half of
   the same `Backed by:` line.
4. Confirm the last four **How it works** subsection headings appear, in
   order, following the first four (slice A confirms the full ordered list
   of eight; this slice re-confirms only that its own four are unchanged
   and correctly placed).
5. Confirm each of the last four **How it works** subsections against its
   cited sources, with no invented capability and no omission of a stated
   behavior:
   - **The shared answered-conversation workspace** — DEC-118/DEC-127 (one
     shared `ConversationWorkspace`, scrollable log as the dominant surface,
     docked pill composer, stable workspace rows for retry/error/Start
     Over/context trigger/New-response), DEC-123/DEC-118/DEC-127/NFR-006
     (sanitized structured-markdown assistant turns vs. solid-bubble user
     turns, unchanged `{ answer }` wire contract, 64px near-bottom
     auto-scroll threshold, `auto` motion under reduced motion),
     DEC-131/DEC-127/NFR-001 (short-thread fill, desktop/mobile Start Over
     reachability, 44px touch floor), DEC-141/REQ-116/DEC-129 (View Context
     top clearance matching the post-DEC-137 rail footprint, shared
     `--layout-surface-gap`, History↔View Context non-overlap).
   - **Conversation history drawer** — DEC-124/FLOW-016/DEC-103-precedent
     (auto-save on first successful answer, browser-local single-device
     list, 20-entry cap with oldest-pruned, stored fields, guarded
     try/catch reads, select-to-restore), DEC-126/DEC-129/DEC-134/DEC-125/
     FLOW-016 (History-zone entry point, always present including empty/
     pre-submit/post-Start-Over states, must not overlap View Context,
     left-edge full-height drawer, `LeftEdgeDrawerContext` mutual
     exclusivity with the Menu tray, In-Depth staged-step-to-answered-
     workspace landing), DEC-130/DEC-138/FLOW-017 (one Draft slot per
     destination, distinct drawer row, auto-hydrate on mount, first-submit
     clears Draft, not counted toward the 20-cap, silent Draft snapshot
     before opening a saved conversation), DEC-143/REQ-118/FLOW-018
     (per-row delete control distinct from select-to-resume, confirm
     before removing, active-conversation-delete clears to clean state, cap
     preserved, Draft rows not deletable via this control).
   - **View Context / adaptive-context overlay** — DEC-118/DEC-141
     (compact View Context trigger before the message log,
     `AdaptiveContextDialog` as one semantic modal tree presenting as a
     bottom sheet below `768px` / right drawer at `768px+`, accessible
     name, Tab trap, Escape/close dismissal, focus restore, In-Depth's
     phase+zone-count trigger vs. Quick Question's card-name trigger),
     DEC-142/REQ-117/REQ-135 (shared outside-click dismissal across View
     Context/History drawer/Menu tray, no dismissal on inside-panel
     clicks), DEC-144/REQ-119 (`CardSelectionPreview` tolerates missing/
     undefined optional fields without throwing, persistence prefers the
     full `CardMetadataItem` shape).
   - **Card detail popup (suite-wide) and the shared close control** —
     DEC-151/DEC-158/REQ-128 (corner control opens a dismissible popup with
     oracle text and locally carried fields, no new fetch, portal into the
     `AdaptiveContextDialog` overlay family sized to its own content, one
     shared component across all six card surfaces), DEC-156/DEC-160/
     DEC-151/REQ-141 (shared `CardPresentation` renders only a Remove-card
     control, container-relative image sizing, shell-column legibility
     floor vs. zone-strip tile width, REQ-129's no-scroll/first-viewport
     ceiling), DEC-159/DEC-156/REQ-142 (one shared overlay close-control
     component across View Context/history drawer/card popup/feedback modal/
     Life Tracker's counter and game-setup panels, theme-derived color,
     44px touch floor).
6. Confirm the conversation-chrome portion of **Measured bounds** against
   its cited sources: history drawer width + 20-entry cap + Draft-row
   exclusion, View Context overlay (≥25% scrim / ≤75dvh, frozen-card
   sizing), answered-workspace top clearance (`--layout-surface-gap`
   figures, retired rail-sized constant, 64px auto-scroll threshold), card
   detail popup (bottom sheet/side panel, content-sized, superseded
   92×128px/356px/37px geometry), and the shared card image bullet
   (container-relative sizing, ~300px floor at 390×844, `w-40`/160px zone
   tile, REQ-129 ceiling) — do not check the structural bullets in this
   pass, only confirm this portion does not contradict slice A's portion.
7. Confirm the conversation-chrome portion of **Rejected alternatives and
   deferred scope** matches its cited DECs' Context/Notes language exactly:
   the full-width in-body history trigger / per-flow answered-state
   assemblies closed door (DEC-126, DEC-125, DEC-118), the bordered-panel
   `max-h-96` chat thread / fixed-viewport composer closed door (DEC-127,
   DEC-131), the card-detail-popup-bound-to-image's-box closed door
   (DEC-158, DEC-151), and the fixed `max-h-32` shared-card-image cap
   closed door (DEC-160, DEC-151) — nothing invented, nothing omitted. Do
   not check the two scope-boundary bullets (deferred/out-of-scope;
   per-feature surfaces) — slice C owns those.
8. Confirm the conversation-chrome portion of **Where it lives** — the
   shared conversation chrome in
   `apps/frontend/src/components/{ConversationWorkspace,ConversationThread,
   ConversationHistoryDrawer,AdaptiveContextDialog,
   FrozenGameContextDetails,FollowUpComposer,ComposerSubmitButton,
   CardSelectionPreview}.tsx`,
   `apps/frontend/src/hooks/{useAskAiSubmitOrchestration,
   useAutoGrowTextarea}.ts`,
   `apps/frontend/src/lib/conversationHistory/persistence.ts`, the shared
   card presentation and detail popup
   (`apps/frontend/src/components/{CardPresentation,CardDetailPopup}.tsx`),
   the shared overlay close control's adoption across
   `FeedbackModal.tsx` and Life Tracker's `CounterPanel`/`GameSetupModal`,
   and the conversation/drawer CSS classes (drawer classes,
   `--layout-surface-gap` in `apps/frontend/src/index.css`) — against
   `system-map.md`'s `## Follow-up chat` block and the actual repository
   tree. Confirm each named file exists (`find`/`ls`). Do not check the
   structural-chrome file list in this same pass — slice A owns that half.
9. Confirm no new stable ID token (a `DEC-`, `REQ-`, `FLOW-`, `NFR-`, or
   `Q-` token followed by digits) appears anywhere in the file that does
   not already resolve to a real, pre-existing ID in its home file.
10. Touch only `PRD/sections/shared-chrome/README.md`, and only for a
    bounded additive correction confined to the sections this slice owns
    (conversation half of the header, the last four How it works
    subsections, the conversation-chrome portions of Measured bounds and
    Rejected alternatives, the conversation-chrome portion of Where it
    lives) — no edit to the structural subsections or Shared layout
    language, no edit to the two scope-boundary bullets, no other file, no
    DEC/REQ/FLOW/NFR body edit, no `system-map.md`/`screen-layout.md`/
    `open-questions.md`/`goals-and-non-goals.md` edit, no `apps/` change, no
    new decision.

## Acceptance criteria

- [ ] B1 — Every conversation-drawer-overlay and popup/close-control ID in
      `Backed by:` (the 39-ID subset listed in requirement 3) resolves to a
      real, pre-existing ID in its home file.
- [ ] B2 — The last four **How it works** subsection headings appear, in
      order, following the first four.
- [ ] B3 — Each of the last four **How it works** subsections is confirmed
      traceable to its cited sources' actual text (requirement 5's
      per-subsection list) — no invented capability, no dropped behavior.
- [ ] B4 — The conversation-chrome portion of **Measured bounds** (drawer
      width/cap, View Context, workspace clearance, card popup, shared card
      image) is confirmed against its cited sources and does not contradict
      slice A's portion.
- [ ] B5 — The conversation-chrome portion of **Rejected alternatives and
      deferred scope** (the four closed-door bullets in requirement 7)
      matches its cited DECs' Context/Notes language, with nothing invented
      or omitted.
- [ ] B6 — The conversation-chrome portion of **Where it lives** names
      every file `system-map.md`'s `## Follow-up chat` block and the actual
      repository tree confirm belongs to shared chrome; each named file is
      confirmed to exist.
- [ ] B7 — No new (minted) stable ID token appears in the file — every ID
      token present resolves to a real, pre-existing ID in its home file —
      and this slice's diff touches only
      `PRD/sections/shared-chrome/README.md`, confined to the sections this
      slice owns, and only for bounded additive correction where genuinely
      needed — no `apps/` change, no edit to any existing DEC/REQ/FLOW/NFR
      body, no `system-map.md`/`screen-layout.md`/`open-questions.md`/
      `goals-and-non-goals.md` edit.

## Verification

```bash
grep -nE "Backed by:|^## |^### " PRD/sections/shared-chrome/README.md
grep -n "^### DEC-118\|^### DEC-123\|^### DEC-124\|^### DEC-125\|^### DEC-126\|^### DEC-127\|^### DEC-129\|^### DEC-130\|^### DEC-131\|^### DEC-134\|^### DEC-138\|^### DEC-141\|^### DEC-142\|^### DEC-143\|^### DEC-144\|^### DEC-146\|^### DEC-153" PRD/sections/decisions/conversation-ux.md
grep -n "^### DEC-151\|^### DEC-156\|^### DEC-158\|^### DEC-159\|^### DEC-160" PRD/sections/decisions/ui-presentation.md
grep -n "^### REQ-067\|^### REQ-115\|^### REQ-116\|^### REQ-117\|^### REQ-118\|^### REQ-119\|^### REQ-126\|^### REQ-128\|^### REQ-135\|^### REQ-141\|^### REQ-142" PRD/sections/functional-requirements.md
grep -n "^### NFR-001\|^### NFR-006" PRD/sections/non-functional-requirements.md
grep -n "^### FLOW-010\|^### FLOW-016\|^### FLOW-017\|^### FLOW-018" PRD/sections/user-flows.md
grep -n "^## Follow-up chat" PRD/sections/system-map.md
grep -n "Shared chrome" PRD/sections/screen-layout.md
find apps/frontend/src/components -maxdepth 1 -name "Conversation*.tsx" -o -maxdepth 1 -name "AdaptiveContextDialog.tsx" -o -maxdepth 1 -name "FrozenGameContextDetails.tsx" -o -maxdepth 1 -name "FollowUpComposer.tsx" -o -maxdepth 1 -name "ComposerSubmitButton.tsx" -o -maxdepth 1 -name "CardSelectionPreview.tsx" -o -maxdepth 1 -name "CardPresentation.tsx" -o -maxdepth 1 -name "CardDetailPopup.tsx" -o -maxdepth 1 -name "FeedbackModal.tsx"
find apps/frontend/src/hooks -maxdepth 1 -name "useAskAiSubmitOrchestration.ts" -o -maxdepth 1 -name "useAutoGrowTextarea.ts"
ls apps/frontend/src/lib/conversationHistory/persistence.ts
grep -n "layout-surface-gap" apps/frontend/src/index.css
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/shared-chrome/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/shared-chrome/README.md` (verify; bounded additive
  correction only if genuinely needed, confined to the sections this slice
  owns)
