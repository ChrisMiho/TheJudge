# DESIGN-BRIEF — mock-mode-banner

## Goal

Show a persistent, non-dismissible banner at the top of every frontend screen when the app is built/run with the mock AI provider, so developers immediately know they are on the simulated path rather than live OpenAI — without any backend, contract, or mock-response-content change.

## Scope

- New frontend-only `MockModeBanner`, mounted once in `PageShell` so it appears on the empty/home state, all four staged steps, and the answered/conversation view.
- Persistent and non-dismissible: no close button, toggle, setting, or auto-hide.
- Copy: `⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend`.
- Static, high-contrast styling from existing theme tokens; CSS-only and reduced-motion-safe (NFR-006); no animation library.

## Signal mechanism (single source of truth)

- `ASK_AI_PROVIDER` stays the sole mode switch (already set by the `dev:mock`/`dev:openai` scripts).
- `vite.config.ts` bridges `process.env.ASK_AI_PROVIDER` into the client bundle as `import.meta.env.VITE_ASK_AI_PROVIDER`; a directly-set `VITE_ASK_AI_PROVIDER` build var is honored as an explicit release-build override.
- `env.ts` resolves it to an `isMockProvider` boolean via a single authoritative resolver, mirroring the existing `resolveDebugLoggingEnabled` pattern.
- Banner renders **iff** the resolved provider is `mock`. Never inferred from `import.meta.env.DEV`, `MODE`, `NODE_ENV`, the deploy host, or the "MOCK RESPONSE" answer text.
- Build-time-only by necessity: a static frontend cannot read runtime provider state without a backend endpoint, which is an explicit non-goal.

## Decisions

- **DEC-084** (`sections/decisions/ui-presentation.md`) — persistent non-dismissible mock-mode banner; configuration-driven from the single `ASK_AI_PROVIDER` source of truth; presentation-only. Router index row added in `sections/decisions.md`.
- Extends **DEC-020**'s "provider mode is explicit, never inferred from `NODE_ENV`/deploy target" discipline to the frontend.
- Reuses the mock-provider debug intent behind **DEC-017** without changing mock-response content.

## Requirements

- **REQ-063** (`sections/functional-requirements.md`) — Mock-mode environment banner, with acceptance criteria and constraints.

## Non-goals

- No backend health/status endpoint or any runtime provider-mode fetch.
- Not dismissible.
- No change to mock-response content or the `POST /api/ask-ai` contract.
- No second, independently-maintained frontend mode flag that could drift from `ASK_AI_PROVIDER`.
- No banner in a production build unless mock mode is explicitly configured at build time.

## Key files (implementation reference)

- `apps/frontend/vite.config.ts` — `define` bridge for `VITE_ASK_AI_PROVIDER`.
- `apps/frontend/src/lib/env.ts` — new `isMockProvider` resolver (mirrors `resolveDebugLoggingEnabled`).
- `apps/frontend/src/components/PageShell.tsx` — single mount point; content offset for the fixed banner.
- `apps/frontend/src/components/MockModeBanner.tsx` — new component (+ unit test).

## Open questions

None — nothing genuinely ambiguous. Build-time-only signal and single-source-of-truth config were confirmed with the product owner.
