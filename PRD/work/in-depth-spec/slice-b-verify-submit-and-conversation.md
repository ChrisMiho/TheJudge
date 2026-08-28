# Slice B — Verify Submit, the wait/conversation, Measured bounds, Rejected alternatives, and frontend Where it lives

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm `PRD/sections/in-depth/README.md` (already written, 514 lines,
already committed) is complete and correct — for "Submit — Decrypt Stack",
"The wait, the answer, and the conversation", **Measured bounds**,
**Rejected alternatives and deferred scope**, and the frontend-facing
portion of **Where it lives**. This slice does not touch **What it is**,
the staged-flow bullet, Steps 1–4 (slice A owns those), **The full backend
path** section or the backend half of Where it lives (slice C owns those),
or the `PRD/README.md` row / diff-scope proof / header reconciliation
(slice D owns those). This slice verifies; it does not author. Close any
confirmed, sourced gap with a bounded additive correction only.

## Requirements

1. Read the cited sources before checking a line: `PRD/sections/decisions/conversation-ux.md`
   (DEC-031, DEC-038, DEC-039, DEC-040, DEC-041, DEC-118, DEC-123, DEC-124
   [background only — already marked "via shared chrome" in body, confirm
   that framing, do not re-derive it as a gap], DEC-127, DEC-131, DEC-146,
   DEC-153); `PRD/sections/decisions/game-context-model.md` (DEC-026,
   background — `ContextTarget`, cross-check against slice A's Step 4
   coverage rather than re-verifying); `PRD/sections/decisions/providers-and-contract.md`
   (DEC-096, DEC-106, background only — request-shape citations, the deep
   validation check is slice C's job); `PRD/sections/decisions/ui-presentation.md`
   (DEC-092, DEC-120, DEC-128, DEC-145 [background only — already marked
   "via shared chrome" in body], DEC-151, DEC-156, DEC-158, DEC-160);
   `PRD/sections/decisions/personalization.md` (DEC-076); `PRD/sections/decisions/combo-retrieval.md`
   (DEC-116, DEC-161, DEC-162, background only — these appear in Rejected
   alternatives' combo-wire-reader bullet; confirm the bullet's text matches
   the DEC, the code-level verification is slice C's job).  Confirm each
   home file at read time rather than trusting this list — it is a map-out
   pre-scout, not ground truth.
2. Read `PRD/sections/functional-requirements.md` for REQ-011, REQ-012,
   REQ-014, REQ-019, REQ-021, REQ-023, REQ-025, REQ-026, REQ-027, REQ-028,
   REQ-029, REQ-045, REQ-056, REQ-058, REQ-061, REQ-069, REQ-070, REQ-093,
   REQ-094, REQ-095, REQ-100, REQ-106, REQ-110, REQ-121, REQ-130, REQ-132,
   REQ-136, REQ-137, REQ-138, REQ-139, REQ-144. Read `PRD/sections/user-flows.md`
   FLOW-001, FLOW-003, FLOW-005 in full. Read `PRD/sections/non-functional-requirements.md`
   NFR-001. Read `PRD/sections/screen-layout.md`'s `#### In-Depth — Answered
   workspace` row.
3. Confirm "Submit — Decrypt Stack" against DEC-153/REQ-132/REQ-012 (visible
   label vs. accessible name), REQ-011/DEC-146/DEC-131/REQ-121/REQ-110
   (question field, zone-aware fallback, composer layout), REQ-012/REQ-019/
   DEC-096/DEC-106 (submit gating, request shape) — no invented capability,
   no dropped behavior.
4. Confirm "The wait, the answer, and the conversation" against DEC-031/
   REQ-023 (waiting panel thresholds), REQ-025/DEC-040/DEC-118 (workspace
   handoff, View Context trigger), REQ-026/REQ-028/DEC-039/DEC-040/DEC-041/
   DEC-118/DEC-123/DEC-127/FLOW-005 (frozen context, follow-up composer,
   markdown rendering), REQ-027/DEC-038/DEC-039/FLOW-005 (follow-up request
   shape, history assembly), REQ-029/DEC-040 (Start Over, roster
   preservation), DEC-014/REQ-014/FLOW-003 (failure handling) — no invented
   capability, no dropped behavior.
5. Confirm **Measured bounds** figures against their cited sources: stack
   cap (DEC-008/REQ-010), question-field cap (REQ-011/REQ-121), player-count
   range (REQ-015/REQ-069/REQ-070), turn-phase/combat-substep enums
   (DEC-022/DEC-034/DEC-037/REQ-015), v1 zone set (REQ-016/DEC-024/DEC-035),
   `gameStateNotes` cap (REQ-031/DEC-043), `conversationHistory` bounds
   (REQ-027), the flagged ambiguous `MAX_CONVERSATION_HISTORY_CHARS` bound
   (REQ-027/FLOW-005/DEC-042 — confirm the file states this as an explicit,
   flagged disagreement rather than silently resolving it, per this file's
   own precedence marker), retry cooldown (DEC-014/REQ-014), waiting-panel
   thresholds (DEC-031/REQ-023), auto-scroll threshold (DEC-118/REQ-025),
   supplemental-rules cap (DEC-046/REQ-022 — background only, deep retrieval
   verification is slice C's job), combo-variant cap (DEC-116/REQ-094/
   REQ-095 — background only, same caveat), enrichment view-all-cards row
   cap (DEC-076/REQ-056), zone-strip tile dimensions (DEC-151/DEC-160/
   REQ-130), game-context player-detail control dimensions (REQ-137/
   REQ-138/REQ-139/REQ-144, `screen-layout.md`), cat-wizard easter-egg
   trigger (DEC-076/REQ-056), layout/fit (DEC-145 via shared chrome/
   NFR-001).
6. Confirm **Rejected alternatives and deferred scope** matches its cited
   DECs' Context/Notes language exactly — every closed-door bullet, the
   "Deferred, not cut" bullet, and the "Not owned here" cross-boundary
   bullet — nothing invented, nothing omitted. Pay particular attention to
   the combo-retrieval closed-door bullet (DEC-162/REQ-093/REQ-094/REQ-095):
   confirm the DEC text matches (deep code verification of the combo
   corpus/retrieval behavior itself is slice C's job, not this slice's).
7. Confirm the frontend-facing portion of **Where it lives** — the full
   list: `apps/frontend/src/lib/contextFlow/` files (cross-check against
   slice A's file existence check, do not duplicate), `apps/frontend/src/components/`
   (`ZoneConfirmStep.tsx` through `AskAiWaitingPanel.tsx`),
   `apps/frontend/src/components/portal/MtgAssistantApp.tsx`, its
   `destinationRegistry.tsx` registration, `apps/frontend/src/lib/{stackLimits.ts,zoneCards.ts}`,
   the `buildAskAiRequest` boundary in `contextFlow/flow.ts`, and the shared
   `apps/frontend/src/components/{ConversationWorkspace,ConversationThread,AdaptiveContextDialog,FrozenGameContextDetails,FollowUpComposer}.tsx`
   plus `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` — against
   `system-map.md`'s relevant blocks and the actual repository tree
   (`find`/`ls`). Confirm `MtgAssistantApp` is actually registered in
   `destinationRegistry.tsx` (grep). Do not check the backend file list in
   this same paragraph — slice C owns that half.
8. Confirm no new stable ID token appears in the sections this slice owns
   that does not already resolve to a real, pre-existing ID in its home
   file.
9. Touch only `PRD/sections/in-depth/README.md`, and only for a bounded
   additive correction confined to the sections this slice owns (Submit,
   the wait/conversation subsection, Measured bounds, Rejected alternatives
   and deferred scope, the frontend half of Where it lives) — no edit to
   What it is, the staged-flow bullet, Steps 1–4, The full backend path, the
   backend half of Where it lives, the header, no other file, no DEC/REQ/
   FLOW/NFR body edit, no `system-map.md`/`screen-layout.md`/
   `open-questions.md`/`goals-and-non-goals.md` edit, no `apps/` change, no
   new decision.

## Acceptance criteria

- [ ] B1 — "Submit — Decrypt Stack" is confirmed traceable to DEC-153,
      REQ-132, REQ-012, REQ-011, DEC-146, DEC-131, REQ-121, REQ-110,
      REQ-019, DEC-096, DEC-106 — no invented capability, no dropped
      behavior.
- [ ] B2 — "The wait, the answer, and the conversation" is confirmed
      traceable to DEC-031, REQ-023, REQ-025, DEC-040, DEC-118, REQ-026,
      REQ-028, DEC-039, DEC-041, DEC-123, DEC-127, FLOW-005, REQ-027,
      DEC-038, REQ-029, DEC-014, REQ-014, FLOW-003 — no invented capability,
      no dropped behavior.
- [ ] B3 — **Measured bounds** figures are confirmed against their cited
      sources (requirement 5's full list), including the flagged, unresolved
      `MAX_CONVERSATION_HISTORY_CHARS` disagreement staying flagged rather
      than silently resolved.
- [ ] B4 — **Rejected alternatives and deferred scope** matches its cited
      DECs' Context/Notes language, with nothing invented or omitted.
- [ ] B5 — The frontend-facing portion of **Where it lives** names every
      file `system-map.md` and the actual repository tree confirm belongs
      to the feature; `MtgAssistantApp` is confirmed registered in
      `destinationRegistry.tsx`.
- [ ] B6 — No new (minted) stable ID token appears in the sections this
      slice owns — and this slice's diff touches only
      `PRD/sections/in-depth/README.md`, confined to the sections this
      slice owns, and only for bounded additive correction where genuinely
      needed — no `apps/` change, no edit to any existing DEC/REQ/FLOW/NFR
      body, no `system-map.md`/`screen-layout.md`/`open-questions.md`/
      `goals-and-non-goals.md` edit.

## Verification

```bash
grep -n "^### Submit\|^### The wait" PRD/sections/in-depth/README.md
sed -n '/^## Measured bounds/,/^## Rejected alternatives/p' PRD/sections/in-depth/README.md
sed -n '/^## Rejected alternatives/,/^## Where it lives/p' PRD/sections/in-depth/README.md
grep -n "^### DEC-031\b\|^### DEC-038\b\|^### DEC-039\b\|^### DEC-040\b\|^### DEC-041\b\|^### DEC-118\b\|^### DEC-123\b\|^### DEC-127\b\|^### DEC-131\b\|^### DEC-146\b\|^### DEC-153\b" PRD/sections/decisions/conversation-ux.md
grep -n "^### DEC-092\b\|^### DEC-120\b\|^### DEC-128\b\|^### DEC-151\b\|^### DEC-156\b\|^### DEC-158\b\|^### DEC-160\b" PRD/sections/decisions/ui-presentation.md
grep -n "^### DEC-116\b\|^### DEC-161\b\|^### DEC-162\b" PRD/sections/decisions/combo-retrieval.md
grep -n "^### REQ-011\b\|^### REQ-012\b\|^### REQ-014\b\|^### REQ-019\b\|^### REQ-021\b\|^### REQ-023\b\|^### REQ-025\b\|^### REQ-026\b\|^### REQ-027\b\|^### REQ-028\b\|^### REQ-029\b\|^### REQ-093\b\|^### REQ-094\b\|^### REQ-095\b\|^### REQ-106\b\|^### REQ-110\b\|^### REQ-121\b\|^### REQ-130\b\|^### REQ-132\b\|^### REQ-136\b\|^### REQ-137\b\|^### REQ-138\b\|^### REQ-139\b\|^### REQ-144\b" PRD/sections/functional-requirements.md
grep -n "^### FLOW-003\b\|^### FLOW-005\b" PRD/sections/user-flows.md
grep -n "^### NFR-001\b" PRD/sections/non-functional-requirements.md
grep -n "In-Depth" PRD/sections/screen-layout.md
find apps/frontend/src/components -maxdepth 1 -iname "AskAiWaitingPanel.tsx" -o -iname "ConversationWorkspace.tsx" -o -iname "ConversationThread.tsx" -o -iname "AdaptiveContextDialog.tsx" -o -iname "FrozenGameContextDetails.tsx" -o -iname "FollowUpComposer.tsx"
find apps/frontend/src -iname "MtgAssistantApp.tsx" -o -iname "stackLimits.ts" -o -iname "zoneCards.ts" -o -iname "useAskAiSubmitOrchestration.ts"
grep -n "MtgAssistantApp" apps/frontend/src/components/portal/destinationRegistry.tsx
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/in-depth/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/in-depth/README.md` (verify; bounded additive correction
  only if genuinely needed, confined to the sections this slice owns)
