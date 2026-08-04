# Slice D — FeedbackModal + form

## Status: done

## Goal

Build the accessible `FeedbackModal` and `useFeedbackForm` hook: category/message/email capture,
validation, the disclosure line + expandable human-readable summary, and the submit lifecycle wired
to `submitFeedback` — as a self-contained, isolation-testable component (REQ-087, FLOW-014,
NFR-001, NFR-006).

## Requirements

1. `apps/frontend/src/lib/feedback/summarizeFeedbackContext.ts` — pure
   `summarizeFeedbackContext(context: FeedbackContext): string[]` (or structured lines) producing the
   same human-readable content shown in the expandable summary and serialized to `appState` (REQ-087
   note: "the expandable summary shows the same content that REQ-088 serializes for delivery").
2. `apps/frontend/src/hooks/useFeedbackForm.ts` — field state for `category` (default `"bug"`),
   `message`, `email`; validation: submit blocked until `message.trim().length > 0`; when `email` is
   non-blank it must match a valid email format; inline validation messages. Submit lifecycle:
   `idle → sending → success` or `idle → sending → error` (draft fields preserved on error for
   retry). On submit, builds the payload (`category`, `message`, trimmed `email` or omitted,
   `appState: JSON.stringify(getFeedbackContext())`) and calls `submitFeedback`.
3. `apps/frontend/src/components/feedback/FeedbackModal.tsx` — props: `{ isOpen: boolean; onClose: ()
   => void; getFeedbackContext: () => FeedbackContext; formspreeId: string | null }`. Renders
   `role="dialog"` `aria-modal="true"` over the current screen; category select, required message
   textarea, optional email input; one-line disclosure always visible; expandable summary (collapsed
   by default) rendering `summarizeFeedbackContext(getFeedbackContext())`. Accessibility: focus
   trapped within the dialog while open, `Escape` closes it, focus restored to the element active
   before open (via a callback the parent supplies — parent-owned per the App-shell trigger,
   wired in Slice E), theme-aware styling consistent with existing zinc/accent tokens, touch-friendly
   sizing (`min-h-[2.75rem]` control targets, matching existing button conventions). Open/close motion
   is CSS-only, reusing the existing `motion-enter`/reduced-motion convention in `index.css` — no new
   JS animation.
4. When `formspreeId` is `null`, the submit control is disabled with an inline explanatory hint
   instead of invoking `submitFeedback`.

## Acceptance criteria

- [ ] Modal renders `role="dialog"`, `aria-modal="true"`, and labelled controls for category
      (Bug / Suggestion / Other), a required message field, and an optional reply email field
- [ ] Submit is blocked with an inline message when the message is empty after trim; blocked with an
      inline message when email is present but not a valid format; passes with a valid or blank email
- [ ] The one-line disclosure is always visible; expanding the summary shows
      `summarizeFeedbackContext()` output for the `FeedbackContext` returned by `getFeedbackContext()`
- [ ] Tab/Shift+Tab cycles focus only within the open dialog; `Escape` closes it
- [ ] Submit lifecycle: idle → sending → success acknowledgement (mocked `submitFeedback` resolves
      `success`), and separately idle → sending → inline error with category/message/email preserved
      (mocked `submitFeedback` resolves `network-error` or `rate-limit`)
- [ ] With `formspreeId: null`, the submit control is disabled with an explanatory hint and
      `submitFeedback` is never invoked
- [ ] `npm --workspace apps/frontend run typecheck` passes

## Verification

```bash
npm --workspace apps/frontend run test -- FeedbackModal useFeedbackForm summarizeFeedbackContext
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/feedback/summarizeFeedbackContext.ts`
- `apps/frontend/src/lib/feedback/summarizeFeedbackContext.test.ts`
- `apps/frontend/src/hooks/useFeedbackForm.ts`
- `apps/frontend/src/hooks/useFeedbackForm.test.ts`
- `apps/frontend/src/components/feedback/FeedbackModal.tsx`
- `apps/frontend/src/components/feedback/FeedbackModal.test.tsx`
