# Slice C — Delivery + config

## Status: done

## Goal

Implement `submitFeedback()` (Formspree POST), the `VITE_FEEDBACK_FORMSPREE_ID` config resolver, and
`.env.example` documentation — fully exercised with mocked `fetch`, never a live network call
(REQ-088, DEC-105).

## Requirements

1. `apps/frontend/src/lib/env.ts` — add `resolveFeedbackFormspreeId(rawValue: string | undefined):
   string | null`, following the existing resolver pattern in this file (pure, never throws on
   unrecognized/empty input; trims and returns `null` for empty/whitespace-only/unset). Export
   `feedbackFormspreeId = resolveFeedbackFormspreeId(import.meta.env.VITE_FEEDBACK_FORMSPREE_ID)`.
2. `apps/frontend/src/lib/feedback/submitFeedback.ts` — `submitFeedback(payload, options)`:
   - `payload: { category: "bug" | "suggestion" | "other"; message: string; email?: string; appState:
     string }` (matches the Feedback Delivery Strategy payload shape in `integrations-and-data.md`)
   - `options: { formspreeId: string | null; fetchImpl?: typeof fetch }`
   - returns `Promise<{ status: "success" | "network-error" | "rate-limit" | "unconfigured" }>`
   - when `formspreeId` is `null`, resolves `{ status: "unconfigured" }` immediately and performs
     zero `fetch` calls
   - otherwise POSTs JSON to `https://formspree.io/f/${formspreeId}` with `Accept: application/json`
     and `Content-Type: application/json` headers
   - `response.ok` → `{ status: "success" }`; HTTP 429 → `{ status: "rate-limit" }`; any other non-ok
     response or a rejected/thrown fetch → `{ status: "network-error" }`; the function itself never
     throws
3. `apps/frontend/.env.example` — add `VITE_FEEDBACK_FORMSPREE_ID=` with a comment noting it is
   public/non-secret configuration and empty means graceful no-op.

## Acceptance criteria

- [ ] `resolveFeedbackFormspreeId` returns `null` for unset/empty/whitespace-only input and the
      trimmed id otherwise; never throws for any string input
- [ ] `submitFeedback` with `formspreeId: null` resolves `{ status: "unconfigured" }` and the mocked
      `fetchImpl` is asserted to have zero calls
- [ ] `submitFeedback` with a configured id POSTs to `https://formspree.io/f/<id>` with a JSON body
      containing `category`, `message`, `email` (present only when supplied), and `appState` as a
      string; resolves `{ status: "success" }` when the mocked response is `ok`
- [ ] `submitFeedback` resolves `{ status: "rate-limit" }` on a mocked HTTP 429 response and
      `{ status: "network-error" }` on another non-ok response and on a rejected fetch promise
- [ ] `apps/frontend/.env.example` documents `VITE_FEEDBACK_FORMSPREE_ID`; no secret value committed
- [ ] `npm --workspace apps/frontend run typecheck` passes

## Verification

```bash
npm --workspace apps/frontend run test -- submitFeedback env
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/env.ts`
- `apps/frontend/src/lib/env.test.ts`
- `apps/frontend/src/lib/feedback/submitFeedback.ts`
- `apps/frontend/src/lib/feedback/submitFeedback.test.ts`
- `apps/frontend/.env.example`
