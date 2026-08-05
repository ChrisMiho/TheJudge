# Feedback & bug-report decisions

Frontend-only user feedback and bug reporting delivered to the owner's inbox via a
third-party form backend, with no backend route or contract change. Reached through
the feature portal as an action entry (DEC-104).

### DEC-105
- Decision: TheJudge ships a **Feedback & Bug Report** feature: a **"Send feedback"** portal **action entry** (DEC-104) opens an accessible **modal over the current screen** (the user keeps their place; no view switch). The modal captures a **category** (Bug / Suggestion / Other), a **required freeform message**, and an **optional reply email** (blank = anonymous). It attaches a **disclosed app-state snapshot** — current screen/step, in-progress game context and typed question, zones/cards/enrichment, conversation history (if any), provider mode, active portal destination, and environment (user-agent, viewport, route, timestamp, build/version) — surfaced to the user as a one-line disclosure plus an **expandable human-readable summary** of what is included. The report is delivered to the owner's inbox via **Formspree** using a **public form id** (no backend route, no SES, no secret); the snapshot rides as one JSON-stringified field so the report is actionable and reproducible. Delivery is **frontend-only**: it adds no backend route and changes no existing contract. When **no form id is configured** (local/mock), submit **degrades to a graceful no-op** (disabled/no-op) and never crashes dev. **Non-goals (v1):** no backend route or contract change, no screenshots/file uploads (deferred), no persistence, auth, in-app history, or analytics.
- Status: confirmed
- Context: TheJudge had no in-product way to report bugs or send feedback; the owner only imagined ad-hoc emails, which do not scale, depend on the user's mail client, and arrive with no structure or reproduction context. The product is deliberately backend-minimal (one product endpoint, DEC-010; no auth/account systems, technical-design-rules), so a delivery path that requires no new backend route, no secret, and no contract change is strongly preferred — a third-party form backend (Formspree) with a public form id satisfies this. Reports are only actionable if they carry reproduction context, so a silent-but-disclosed app-state snapshot is attached; because that snapshot can include the user's typed question and conversation content, the disclosure is explicit (a line plus an expandable summary) rather than hidden. Screenshots/file uploads add real capture and payload complexity and are deferred. The entry point reuses the feature portal (DEC-095) via the new action-entry kind (DEC-104) so feedback ships no chrome of its own; it opens a modal rather than a destination view so the user does not lose their place mid-flow.
- Impact:
  - a **Send feedback** action entry (DEC-104) is registered with the feature portal; selecting it opens the feedback modal over the current screen, no view switch and no reload
  - the modal is theme-aware and accessible: focus trap, Esc-to-close, restores focus on close, CSS-only reduced-motion open/close motion (NFR-006), touch-friendly on mobile (NFR-001)
  - capture set (v1): category select (Bug / Suggestion / Other), required message, optional reply email; message is required and, when a reply email is present, it must be a valid email format
  - the app-state snapshot is built by a pure builder from a lazy `getFeedbackContext()` callback the app shell supplies, so the modal never reaches into flow internals; the snapshot is JSON-stringified into a single Formspree field and mirrored to the user via the expandable summary
  - delivery posts to Formspree at `https://formspree.io/f/<id>`, where `<id>` is a **public, non-secret** form id read from `VITE_FEEDBACK_FORMSPREE_ID`; submit handles success, network error, and rate-limit with inline feedback, and preserves the draft on error for retry
  - when `VITE_FEEDBACK_FORMSPREE_ID` is empty/unset (local/mock baseline), submit is a graceful no-op (disabled with an explanatory hint) and never throws
  - chrome/delivery only: no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any product-facing endpoint; no backend route and no server-side state; the snapshot is read-only and never mutates app state
  - v1 excludes screenshots/file uploads, persistence, auth, in-app report history, and analytics
- Related requirements:
  - REQ-087
  - REQ-088
  - REQ-086
  - FLOW-014
  - NFR-001
  - NFR-006
- Notes:
  - depends on DEC-104 for the portal action-entry kind and on `feature-portal` (DEC-095) for entry chrome
  - Formspree public form id is configuration, not a secret; it may be committed to `.env.example` and shipped in the client bundle
  - the owner completes Formspree account/form creation directly on formspree.io (out-of-band; the recipient email is registered there, never in the codebase or a secret store) and supplies the resulting form id via `VITE_FEEDBACK_FORMSPREE_ID`; the feature ships complete in the graceful-no-op state without this, and the owner's id handoff — not further engineering — is what enables delivery
  - live delivery confirmed 2026-08-05: form id `xdenozlb`, local + production build env configured, live-send smoke (modal submit through inbox delivery) verified end to end
  - screenshots/file uploads are a deferred extension, not an open question
