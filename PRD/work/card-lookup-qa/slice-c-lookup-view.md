# Slice C — Card Lookup entry, single-card input, and conversation (ship)

## Status: planned

## Goal

Ship the **Card Lookup** frontend view: registered as a feature-portal destination, with single-card input by typed search and camera scan, card presentation, a question field, and the shipped conversation chrome frozen on the single card — sending `mode: "card"` requests and reusing the main flow's conversation limits (REQ-073, REQ-075, FLOW-011).

## Requirements

1. Card Lookup registers as a feature-portal destination (DEC-095) and opens as a frontend-only view switch with no reload; it ships **no** navigation of its own.
2. The user resolves exactly one card by typed autocomplete search (REQ-001/002 behavior: suggestions at 3+ chars, **No matching card found** on no match) **or** by scanning with the existing camera scanner (FLOW-006 engine), each resolving to one `CardMetadataItem`.
3. The resolved card's name, image when available, oracle text, and full metadata are shown before the user submits; only one card is active — no zones, stack, phase, multi-card, or enrichment-editing controls. Printing-level scan identity stays presentation-only (DEC-053).
4. A freeform question field accepts up to the same cap as the main flow (REQ-011, 300 chars); submit is blocked until a card is resolved; blank-after-trim question applies the main flow's blank-question handling adapted to single-card context.
5. On first success, reuse the conversation thread, follow-up composer, inline Send-button processing, and start over (REQ-025–029). The frozen context is the single card (no `GameContext`); first visible bubble is the assistant answer; the initial question is in `conversationHistory` but not shown as a bubble.
6. Requests send `{ mode: "card", question, card }` (and follow-ups `{ mode: "card", question, card: frozen, conversationHistory }`) under the shared conversation/text limits (REQ-027); mock follow-ups append to the same thread; start over clears the thread and returns to the pre-ask state with the card preserved. AI/follow-up failure reuses the main flow's handling (**Miho is working on it**, retry with cooldown, preserved card + question).

## Acceptance criteria

- [ ] Card Lookup appears in the portal destination dropdown and opens as a view switch with no reload; selecting it does not reset other modes' state.
- [ ] Typing 3+ chars shows suggestions; selecting one resolves a single card; a no-match shows **No matching card found**.
- [ ] Scanning resolves to one `CardMetadataItem` (FLOW-006 behavior; scanned-printing art presentation-only) rather than adding into a zone.
- [ ] The resolved card's name, image, oracle text, and full metadata are shown before asking; submit is blocked with no card.
- [ ] First answer renders assistant-first in the reused `ConversationThread`; the initial question is not a visible bubble; the sent `conversationHistory` includes it.
- [ ] A follow-up appends a user bubble then assistant bubble and sends `{ mode: "card", question, card: frozen, conversationHistory }`; the Send button shows inline processing and is disabled in flight; the full waiting panel is not shown for follow-ups.
- [ ] Start over clears the thread and restores the pre-ask state with the looked-up card preserved; no history persists.
- [ ] With `ASK_AI_PROVIDER=mock`, the assistant bubble shows the assembled card-mode prompt and the thread stays visible exactly as for live responses.
- [ ] No zone/stack/phase/multi-card/enrichment-editing controls appear in Card Lookup.

## Verification

```bash
npm --workspace apps/frontend run test -- CardLookup
npm --workspace apps/frontend run test          # portal + conversation regressions stay green
npm --workspace apps/frontend run typecheck
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/destinationRegistry.tsx` — append a `card-lookup` destination `{ id, label: "Card Lookup", render: () => <CardLookupApp /> }`
- `apps/frontend/src/components/CardLookupApp.tsx` (new) + test — the lookup view: single-card input (search + scan), card presentation, question, conversation
- `apps/frontend/src/components/ZoneCardPicker.tsx` — factor its search/scan/`CardSelectionPreview` core into a reusable single-card input (drive in single-card mode) instead of forking a second surface; keep zone behavior intact
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` — generalize the frozen-context typing so card mode freezes the `card` reference and sends `{ mode: "card", ... }`; game mode unchanged
- `apps/frontend/src/lib/contextFlow/flow.ts` — add a card-mode payload builder / type alongside `buildAskAiRequest` (`ZoneAskAiPayload` gains a card variant or a sibling `CardAskAiPayload`)
- `apps/frontend/src/types.ts` — card reference + card-mode payload types mirroring Slice A
- a card-frozen summary (reuse `CardSelectionPreview`) in place of `FrozenContextSummary` for card mode

## Notes

- **Blocked on `feature-portal` (DEC-095) landing** — this slice appends to `PORTAL_DESTINATIONS` and mounts under `DestinationOutlet`. If the portal is not merged, coordinate before starting.
- Prefer generalizing the one orchestration hook over copying it; prefer factoring the picker's input core over a second search+scan surface.
- Depends on **Slice A** for the wire payload shape; a full mock-provider E2E also needs **Slice B**.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified (commands above run and green)
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged beyond the Slice A `mode` amendment; success `{ answer }` / error shapes unchanged
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/card-lookup-qa/` ready to delete

## PRD promotion checklist (executed by `thejudge-cleanup`)

- [ ] DEC-096 / DEC-097 in `PRD/sections/decisions/lookup-suite.md` and their router index lines in `PRD/sections/decisions.md` reflect shipped reality; no edits to `Status:` for the shipped/planned signal (doc-lifecycle system-map gate)
- [ ] `PRD/sections/system-map.md` Card Lookup entry flipped to `shipped` (product code wired + receipt written)
- [ ] REQ-072/073/074/075 and FLOW-011 remain accurate to what shipped; Q-003 stays open (optional lightweight game context out of v1)
- [ ] Cleanup receipt written at `PRD/instructions/receipts/card-lookup-qa-<YYYY-MM-DD>.md`; `PRD/work/card-lookup-qa/` deleted
