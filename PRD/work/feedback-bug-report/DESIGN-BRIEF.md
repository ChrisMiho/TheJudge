# Feedback & Bug Report — DESIGN BRIEF

## Scope

A frontend-only "Send feedback" feature reachable from the existing feature portal. A new portal **action entry** opens an accessible modal over the current screen; the user picks a category (Bug / Suggestion / Other), writes a required message, optionally leaves a reply email, and submits. The report is delivered to the owner's inbox via **Formspree** (public form id, no backend, no secret), with a **disclosed** app-state snapshot attached as one JSON-stringified field so reports are actionable and reproducible.

## Decisions

- **DEC-104** (`decisions/navigation.md`) — portal registry gains an **action entry** kind alongside destinations; an action entry invokes a handler (open the feedback modal) instead of switching the active view. Additive amendment to DEC-095/REQ-067.
- **DEC-105** (`decisions/feedback.md`) — Feedback & Bug Report: portal action → modal (category + required message + optional reply email) + disclosed app-state snapshot, delivered via Formspree public form id; frontend-only, graceful no-op when no form id is configured.

## Requirements & flow

- **REQ-086** — Feature-portal action entries (registry extension).
- **REQ-087** — Feedback modal and capture (fields, validation, disclosure line + expandable summary, a11y focus-trap/Esc/reduced-motion, submit lifecycle with draft preserved on error).
- **REQ-088** — Feedback delivery + app-state snapshot (Formspree POST, payload shape, `VITE_FEEDBACK_FORMSPREE_ID` config, graceful no-op).
- **FLOW-014** — Send feedback / report a bug (open → category → message → optional email → view attached state → submit → success/error).

## Section updates

- `integrations-and-data.md` — new **Feedback Delivery Strategy** section (Formspree, payload shape, public form id, `VITE_FEEDBACK_FORMSPREE_ID`, graceful degradation).
- `system-map.md` — new **Feedback & bug report** catalog entry (`planned`).

## Design direction (for map-out; not yet product truth)

- Extend the portal registry to a discriminated union: `{ kind: "destination", ... }` (unchanged) + `{ kind: "action", id, label, onSelect }`.
- `FeedbackModal` — theme-aware, accessible (focus trap, Esc, restore focus, CSS-only reduced-motion), overlays any screen.
- `buildFeedbackContext()` — pure app-state snapshot builder; the app shell passes a lazy `getFeedbackContext()` callback so the modal never reaches into flow internals.
- `submitFeedback(payload)` — POSTs JSON to Formspree; resolves success / network error / rate-limit; snapshot rides as one JSON-stringified field.
- `useFeedbackForm` — field state, validation (message required, email format if present), submit lifecycle.
- Config: `VITE_FEEDBACK_FORMSPREE_ID` in `apps/frontend/.env.example` (public, non-secret); empty in local/mock → graceful no-op.

## Non-goals (v1)

No backend route or contract change; no screenshots/file uploads (deferred); no persistence, auth, in-app history, or analytics. The app-state snapshot is read-only and never mutates app state.

## Reused, unchanged

- Feature portal (DEC-095 / REQ-067 / FLOW-010) — entry chrome; only extended to admit action entries.
- NFR-001 (mobile-first, touch-friendly), NFR-006 (CSS-only reduced-motion), DEC-065 (non-overlapping header controls), DEC-085 (mock-mode posture).
- No change to `AskAiRequest`, `GameContext`, prompt assembly, provider boundary, or `POST /api/ask-ai`.

## Open questions

None. Screenshots/file uploads are a stated deferred non-goal, not ambiguity.
