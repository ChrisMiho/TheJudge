# Slice C — Answered workspace fill + Start Over chrome

## Status: planned

## Goal

Make the shared answered conversation workspace fill available height when the thread is short, keep Start Over reachable in the first desktop viewport, and make Start Over visually smaller on mobile to reduce accidental taps — REQ-109 / DEC-131, extending DEC-127's fill intent to the short-content case.

## Requirements

1. `ConversationWorkspace.tsx` / `ConversationThread.tsx` / `index.css`: when the answered thread's content is short, the workspace/thread surface must still fill the available vertical chat area on both mobile and desktop — no large empty dead band below a short card (`issues/4.png`). `.conversation-workspace` (`index.css:266-271`) currently has no height-filling rule; `.conversation-thread` (`index.css:260-264`) is capped at `clamp(28rem, 70dvh, 44rem)` with no minimum-fill behavior for short content.
2. On desktop, Start Over must remain reachable within the first viewport without being clipped by excess chrome height (`issues/4.png`'s companion desktop complaint: workspace too tall, Start Over pushed out of view).
3. On narrow/mobile viewports, Start Over must use a visually smaller/less-dominant treatment than the current control (`ConversationWorkspace.tsx:86-94`, plain button with no width or size distinction from other controls) while still meeting the ≥44×44px touch-target floor (NFR-001).
4. Both In-Depth Question and Quick Question must inherit the same treatment automatically since both consume the shared `ConversationWorkspace` — do not fork per-flow styling.
5. Scope is the answered workspace only. Pre-submit staged-screen lower-half fill is explicitly out of scope (owned elsewhere). Presentation/layout only — no contract, provider, or prompt changes; no change to DEC-118's auto-scroll threshold, New response control, or DEC-127's message-turn contrast treatment.

## Acceptance criteria

- [ ] A short answered thread (e.g. one question/answer pair) fills the available vertical chat area on both mobile (~390×844) and desktop, with no large empty band below the card.
- [ ] On a standard desktop viewport (e.g. 1280×800), Start Over is visible and clickable without scrolling, even with a short thread.
- [ ] On ~390×844, Start Over renders visibly smaller/less dominant than before (not full-width-large) while measuring at least 44×44px.
- [ ] The same fill and Start Over sizing behavior appears on both In-Depth Question and Quick Question's answered views.
- [ ] No change to auto-scroll-near-bottom threshold, New response control appearance/behavior, or message bubble contrast treatment (DEC-118/DEC-127 untouched).
- [ ] `npm --workspace apps/frontend run typecheck` and `npm --workspace apps/frontend run lint` pass.

## Verification

```bash
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run lint
npm --workspace apps/frontend run test -- ConversationWorkspace ConversationThread
```

Manual check: run the app, answer one question on In-Depth Question, view at desktop width (confirm Start Over visible without scrolling, no empty dead band) and at ~390×844 (confirm Start Over is visually smaller, still tappable, thread fills the surface). Repeat on Quick Question.

## Files touched

- `apps/frontend/src/components/ConversationWorkspace.tsx`
- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/index.css`
