# Slice E — Full-bleed conversation thread

## Status: done

## Goal

Make the conversation thread read as a chat surface instead of a boxed form
field (`DEC-127`): the thread fills substantially more of the workspace's
available height instead of being capped inside a nested bordered panel, the
composer becomes a docked rounded pill, and assistant/user turns get
stronger, clearly distinct visual contrast.

## Requirements

1. Raise `.conversation-thread`'s height budget from
   `clamp(18rem, 45dvh, 24rem)` to a substantially taller clamp (e.g.
   `clamp(28rem, 70dvh, 44rem)` — tune against real viewports during
   implementation; the requirement is "reads as the dominant surface," not an
   exact number) and drop its nested `rounded-2xl border ... bg-zinc-900/55`
   panel treatment so it stops reading as a second boxed card inside
   `.page-card`.
2. Do not touch `.page-shell`/`.page-card`'s layout model (document-flow,
   page-level scroll) or any other destination — this is scoped strictly to
   `ConversationThread.tsx`/`ConversationWorkspace.tsx` inside the
   conversation workspace, matching the brief's non-goal against redesigning
   the outer app shell.
3. Leave `ConversationThread.tsx`'s scroll/auto-scroll logic (near-bottom
   detection, reader-position preservation, the "New response" control,
   `role="log"`/`aria-live` wiring) completely untouched — this slice only
   changes the container's height/border and the message/bubble/composer
   presentation inside it.
4. Assistant messages drop their bubble container (`bg-zinc-800/80` +
   padding) for plain flowing text with no background. User messages become
   a solid, higher-contrast right-aligned bubble (drop the translucent
   `border border-accent-strong/30 bg-accent-strong/30` for an opaque or
   near-opaque fill, no border) so turns are clearly distinguishable from
   each other and from the surrounding surface at a glance.
5. `FollowUpComposer.tsx` becomes a single-row rounded-pill control (input
   and send control inline, `border-radius: 999px`-equivalent) instead of
   today's stacked label/textarea/full-width-button form. The send button
   becomes a circular icon control (SVG arrow, consistent with Slice D's new
   inline-SVG convention) instead of a text "Send" label. Keep "Follow-up
   question" as a visually-hidden (`sr-only`) accessible name rather than
   removing it, and keep the existing `MAX_QUESTION_CHARS` enforcement and
   disabled/submitting states unchanged — only the visual structure and the
   character counter's placement change.

## Acceptance criteria

- [ ] The conversation thread visibly fills most of the workspace's
      available height instead of a small fixed-height scroll box, with no
      nested border/background panel around it.
- [ ] Assistant messages render as plain text with no bubble background;
      user messages render as a solid, high-contrast bubble, right-aligned.
- [ ] The follow-up composer renders as a single-row rounded pill with an
      inline circular send control, not a bordered rectangular field with a
      separate full-width "Send" button.
- [ ] `MAX_QUESTION_CHARS` enforcement, the disabled/submitting states, and
      the accessible name for the follow-up input are unchanged from before
      this slice (verifiable via existing `FollowUpComposer` test
      assertions updated for the new markup, not new behavior).
- [ ] DEC-118's near-bottom auto-scroll threshold and "New response" control
      behave identically to before this slice (existing
      `ConversationThread.test.tsx` scroll-behavior cases still pass
      unmodified in behavior, only markup/selectors updated as needed).
- [ ] No visual or markup change to any other destination (Life Tracker,
      Trade Balancer), the outer app shell, header, or MOCK-mode banner.
- [ ] `npx vitest run src/components/ConversationThread.test.tsx src/components/FollowUpComposer.test.tsx` passes.

## Verification

```bash
cd apps/frontend && npx vitest run \
  src/components/ConversationThread.test.tsx \
  src/components/FollowUpComposer.test.tsx
cd apps/frontend && npm run quality:check
```

Manual (dev server, `npm run dev`): for both In-Depth Question and Quick
Question, start a conversation with a follow-up, confirm the thread fills
most of the visible height with no inner bordered box, assistant text has no
bubble, user turns are solid/high-contrast bubbles, and the composer renders
as a pill; confirm near-bottom auto-scroll and the "New response" control
after a delayed answer both behave exactly as before; confirm Life
Tracker/Trade Balancer and the outer shell are visually unchanged.

## Files touched

- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/components/FollowUpComposer.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/components/ConversationThread.test.tsx`
- `apps/frontend/src/components/FollowUpComposer.test.tsx`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/assistant-chat-shell/` ready to delete
