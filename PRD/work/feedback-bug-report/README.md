status: refined

# Feedback & Bug Report

Frontend-only user feedback + bug-report feature. Delivered via Formspree to the owner's inbox; no backend change.

## Shaped decisions (from brainstorming)

- **Destination:** Third-party form backend — **Formspree** (`https://formspree.io/f/<id>`), delivers email + dashboard entry. No backend route, no SES, no secret (public form ID).
- **Entry point:** A **"Send feedback" action item in the existing feature-portal dropdown menu** that opens a **modal over the current screen** (not a full portal view-switch), so the user keeps their place. Requires extending the portal registry to support an *action* entry alongside *destination* entries.
- **Capture set (v1):**
  - Category select — Bug / Suggestion / Other
  - Required freeform message
  - Optional reply email (blank = anonymous)
  - Silent, disclosed **app-state snapshot**: current screen/step, in-progress game context + typed question, zones/cards/enrichment, conversation history (if answered), provider mode (mock/live), active portal destination, environment (user-agent, viewport, route, timestamp, build/version)
- **Deferred:** screenshots/file uploads.

## Proposed components

- Portal action item (extend `apps/frontend/src/components/portal/` registry for non-destination actions)
- `FeedbackModal` — theme-aware, accessible (focus trap, Esc, CSS-only motion), overlays any screen
- `buildFeedbackContext()` — pure app-state snapshot builder
- `submitFeedback(payload)` — POSTs JSON to Formspree, handles success / network error / rate-limit; app-state snapshot rides as one JSON-stringified field
- `useFeedbackForm` — field state, validation (message required, email format if present), submit lifecycle
- Decoupling seam: app shell passes a lazy `getFeedbackContext()` callback to the modal so it never reaches into flow internals

## Config

- `VITE_FEEDBACK_FORMSPREE_ID` in `apps/frontend/.env.example` (public, not a secret); empty in local/mock → graceful no-op

## Non-goals (v1)

No backend route/contract change, no screenshots, no persistence, no auth, no in-app history, no analytics.

## Open items for refinement

- New DEC(s) for frontend-only Formspree feedback delivery + REQ(s) for the modal/capture behavior
- `user-flows.md` FLOW entry for open → fill → submit → success/error
- `system-map.md` catalog entry
- Portal registry extension: how action entries coexist with destination entries (`DEC-095`/`REQ-067` portal contract)
- Exact serialized payload shape for Formspree readability
