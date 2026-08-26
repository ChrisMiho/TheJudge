# Feedback & Bug Report — current-state feature spec

- Status: draft, derived, non-authoritative view. On any conflict, the cited
  `DEC`/`REQ`/`FLOW` wins — `PRD/sections/decisions.md` stays precedence #1
  and Read-First #1. Correct this file against those sources, not the other
  way around.
- Backed by: DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001,
  NFR-006

## What it is

A one-tap way for a player to report a bug or send feedback without leaving
what they were doing. From the feature-portal menu they pick **Send feedback**,
a modal opens over the current screen, and they choose a category (Bug /
Suggestion / Other), type a message, and optionally leave a reply email. The
report is delivered to the owner's inbox, and it carries a disclosed snapshot
of what the app was doing — the screen, the in-progress game, the typed
question, the conversation so far — so the owner can actually reproduce the
problem. Everything happens in the browser: there is no backend route, no
account, and no server-side storage.

## How it works

### Entry point

- Built: **Send feedback** is a feature-portal **action entry**, not a
  destination. Selecting it runs a handler that opens the feedback modal and
  closes the menu; it does not switch the active view or reset any mode's
  in-session state. The entry sits in the same portal menu as the destinations
  and obeys the same non-overlap bounds and touch sizing. (DEC-104, REQ-086)
- Built: the action-entry kind is an additive amendment to the destination
  registry (DEC-095). v1 registers exactly one action entry — Send feedback;
  the destination list is unchanged. (DEC-104, REQ-086)

### The feedback modal

- Built: the modal opens over the current screen, so the user keeps their
  place — no view switch, no reload, no loss of in-progress state. (REQ-087,
  FLOW-014)
- Built: capture fields are a category select (Bug / Suggestion / Other), a
  required freeform message, and an optional reply email (blank = anonymous).
  (DEC-105, REQ-087)
- Built: validation is inline — submit is blocked until the message is
  non-empty after trim; when a reply email is present it must be a valid email
  format. (REQ-087, FLOW-014)
- Built: the modal is accessible and theme-aware — focus is trapped inside it,
  Esc closes it, focus is restored to the portal trigger on close, and its
  open/close motion is CSS-only and reduced-motion-aware. It is touch-friendly
  on mobile. (REQ-087, NFR-001, NFR-006)

### App-state snapshot and disclosure

- Built: each report attaches a snapshot of current app state — screen/step,
  in-progress game context and typed question, zones/cards/enrichment,
  conversation history (if any), provider mode (mock/live), active portal
  destination, and environment (user-agent, viewport, route, timestamp,
  build/version). (DEC-105, REQ-088)
- Built: the snapshot is disclosed to the user before submit — a one-line
  notice that current app state is attached, plus an expandable
  human-readable summary showing exactly what is included. The summary shows
  the same content that is serialized for delivery. (REQ-087, REQ-088,
  FLOW-014)
- Built: the modal reads app state only through a lazy `getFeedbackContext()`
  callback the app shell supplies, built by a pure builder; the modal never
  reaches into flow internals, and building or sending the snapshot never
  mutates app state. (DEC-105, REQ-087, REQ-088)

### Delivery

- Built: submit POSTs a JSON payload to `https://formspree.io/f/<id>`, where
  `<id>` is a public, non-secret form id read from
  `VITE_FEEDBACK_FORMSPREE_ID`. The snapshot rides as one JSON-stringified
  field alongside category, message, and reply email, so the report is
  actionable and reproducible. (DEC-105, REQ-088)
- Built: delivery is frontend-only — it adds no backend route, no SES, no
  secret, and changes no existing contract or product-facing endpoint. The
  form id is configuration, committed to `.env.example` and shipped in the
  client bundle. (DEC-105, REQ-088)
- Built: the submit lifecycle is idle → sending → success acknowledgement or
  inline error. Success, network error, and rate-limit resolve distinctly and
  surface inline; on error the draft is preserved so the user can retry.
  (REQ-087, REQ-088, FLOW-014)

### Graceful no-op when unconfigured

- Built: when `VITE_FEEDBACK_FORMSPREE_ID` is empty or unset (the local/mock
  baseline), submit is disabled/no-op with an explanatory hint and never
  throws or crashes dev. The feature ships complete in this state; the owner's
  out-of-band Formspree setup and id handoff — not further engineering — is
  what turns delivery on. (DEC-105, REQ-088)

## Measured bounds

This feature carries no pixel-measured bounds; its fixed constraints are the
capture set and the delivery shape.

- Category set: exactly Bug / Suggestion / Other. Message required (non-empty
  after trim); reply email optional but, when present, must be valid email
  format. (DEC-105, REQ-087)
- Delivery endpoint: `https://formspree.io/f/<id>`, `<id>` =
  `VITE_FEEDBACK_FORMSPREE_ID`, treated as public non-secret configuration; the
  snapshot travels as a single JSON-stringified field. (REQ-088)
- Live delivery confirmed 2026-08-05: form id `xdenozlb`, local and production
  build env configured, live-send smoke (modal submit through inbox delivery)
  verified end to end. (DEC-105)

## Rejected alternatives and deferred scope

- **Ad-hoc emails from the user's own mail client — closed door.** The feature
  exists because that path does not scale, depends on the user's mail client,
  and arrives with no structure or reproduction context. In-product delivery
  with an attached snapshot replaced it. (DEC-105)
- **A standalone header affordance outside the portal registry — closed
  door.** DEC-104 rejected special-casing feedback with its own chrome and
  instead generalized the registry to admit handler-backed action entries, so
  feedback ships no chrome of its own. (DEC-104)
- **A destination view instead of a modal — closed door.** Feedback opens a
  modal over the current screen so the user does not lose their place
  mid-flow; it is deliberately not a view switch. (DEC-104, DEC-105)
- **A backend route / SES / server-side delivery — closed door.** The product
  is backend-minimal (one product endpoint, DEC-010; no auth/account systems),
  so a third-party form backend with a public form id was chosen precisely to
  avoid a new route, a secret, or a contract change. (DEC-105)
- **Deferred, not cut (v1 non-goals):** screenshots / file uploads,
  persistence, auth, in-app report history, and analytics. Screenshots and
  file uploads are a named deferred extension, not an open question. (DEC-105,
  REQ-087, REQ-088)

## Where it lives

Frontend components and feedback-local logic live under
`apps/frontend/src/components/feedback/` (`FeedbackModal.tsx`), the
form-state/validation hook `apps/frontend/src/hooks/useFeedbackForm.ts`
(consumed by `FeedbackModal.tsx`), and
`apps/frontend/src/lib/feedback/` (`buildFeedbackContext.ts`,
`FeedbackContextProvider.tsx`, `submitFeedback.ts`,
`summarizeFeedbackContext.ts`, `environment.ts`, `types.ts`); the app shell
registers the Send feedback action entry and hosts the modal in
`apps/frontend/src/App.tsx`, the action-entry union lives in
`apps/frontend/src/lib/portal/types.ts`, the portal menu renders it in
`apps/frontend/src/components/portal/FeaturePortalMenu.tsx`, and the form id is
resolved in `apps/frontend/src/lib/env.ts` (`resolveFeedbackFormspreeId`) from
`apps/frontend/.env.example`'s `VITE_FEEDBACK_FORMSPREE_ID`. See
`PRD/sections/system-map.md`'s `## Feedback & bug report` entry for the full
file list, and `PRD/sections/integrations-and-data.md`'s Feedback Delivery
Strategy for the delivery/payload detail.
