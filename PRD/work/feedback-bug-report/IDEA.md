# Feedback & Bug Report — IDEA

**Problem:** TheJudge has no way for users to report bugs or send feedback; the owner only imagined ad-hoc emails, which don't scale, depend on the user's mail client, and arrive with no structure or reproduction context.

**Outcome:** A frontend-only "Send feedback" action, reachable from the existing feature-portal menu, opens an accessible modal over the current screen. The user picks a category (Bug / Suggestion / Other), writes a message, optionally leaves a reply email, and submits. The report is delivered to the owner's inbox via **Formspree** (public form ID, no backend, no secret), with a silently-attached, disclosed snapshot of the current app state — screen/step, in-progress game context and typed question, zones/cards/enrichment, conversation history, provider mode, and environment (user-agent, viewport, route, timestamp, build) — so reports are actionable and reproducible.

**Non-goals (v1):** No backend route or contract change; no screenshots/file uploads (deferred); no persistence, auth, in-app history, or analytics. Local/mock mode with no configured form ID degrades gracefully (submit disabled/no-op), never crashing dev.
