# UI presentation decisions

Frontend-only motion, transition, and visual-feedback polish that changes how the app *feels* without changing game context, API contracts, prompt assembly, stack-ordering semantics, scan-engine behavior, or any backend behavior. Distinct from `personalization.md` (user-selectable palette/density): these decisions set a global baseline motion vocabulary, not a user preference.

### DEC-079
- Decision: The app adopts a broadened, app-wide decorative-motion and visual-feedback baseline across the full staged flow (game context, zone confirmation, zone collection, enrichment) and the answered/conversation view. Motion is no longer limited to "basic show/hide or simple transitions"; rich micro-transitions, easing on state changes, entrance/exit transitions, and add/remove/success/error state-change cues are in scope. This intentionally broadens NFR-006 and the prior "animation-heavy UI" non-goal, bounded by the guardrails below. Scan camera surface internals are excluded.
- Status: confirmed
- Context: The flow-validation experience works but lands abruptly — transitions, state changes, and interactions feel mechanical rather than smooth and considered. The product owner chose broad motion freedom over a tightly-capped carve-out: the goal is for the app to feel polished and intentional, so decorative motion is now first-class rather than an exception reserved for functional wait states (DEC-031). Three prior PRD truths constrained this (NFR-006 "minimal animation complexity / not decorative polish", the `goals-and-non-goals.md` "animation-heavy UI" non-goal, and `technical-design-rules.md` "keep animations basic" / "flashy UI animation systems"); this decision amends all three consistently rather than working around them.
- Impact:
  - decorative motion is permitted app-wide across the four staged steps and the answered/conversation view: hover/press/focus micro-interactions, eased transitions on state changes, entrance/exit transitions, and visual cues for card add/remove, success, and error states
  - **CSS-based** implementation (transitions + keyframes); no animation library and no animation-framework migration are introduced by this decision — keeping the lightweight React + Vite + Tailwind stack intact (adopting a motion library would be a separate, explicit decision)
  - motion **honors `prefers-reduced-motion`**: decorative motion is reduced or disabled when the user/OS requests reduced motion; no decorative motion is essential to completing any flow
  - motion is **mobile-performance-safe**: prefer transform/opacity-driven animation, avoid layout-thrash and main-thread jank, and do not regress the live-table interaction loop (NFR-001 mobile-first, NFR-002 fast interaction loop, GOAL-002 lightweight)
  - the existing functional wait-state motion (DEC-031 `AskAiWaitingPanel`, DEC-041 inline follow-up spinner) is unchanged and remains valid; this decision extends rather than replaces it
  - **scan camera surface internals are out of scope** — `ScanCameraSurface` reticle/lock/convergence/thumbs-up feedback is precision-sensitive (DEC-057/DEC-062/DEC-072/DEC-073) and is not re-animated by this pass; the existing scanner UX motion stays as tuned
  - presentation only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, scan matching/stabilizer logic, stack-ordering semantics, or data-pipeline behavior
  - no new screens, no flow/step reordering, no renamed steps; this is polish over the existing flows (FLOW-001, FLOW-002, FLOW-006 and the answered view)
- Related requirements:
  - REQ-059
  - NFR-006
  - NFR-001
  - NFR-002
  - FLOW-001
  - FLOW-002
  - FLOW-006
  - DEC-031
  - DEC-041
- Notes:
  - approved approach: broad motion freedom (chosen over a tightly-capped decorative carve-out and over a no-NFR-change option)
  - guardrails retained deliberately so "broad" does not become "unbounded": CSS-only, reduced-motion-aware, performance-safe, no library/framework migration, no behavior change
  - non-goals: adopting a JS animation library/framework, motion that ignores `prefers-reduced-motion`, motion that regresses mobile performance or the live-table loop, re-animating the scan camera convergence UI, and the proximity-driven scan-outline idea (deferred — Q-002)

### DEC-085
- Decision: When the app is built/run with the mock AI provider, the frontend renders a persistent, non-dismissible mock-mode banner on every screen. The banner's mock/live signal is **build-time configuration-driven from the single existing `ASK_AI_PROVIDER` source of truth** — `vite.config.ts` surfaces `process.env.ASK_AI_PROVIDER` to the client as `import.meta.env.VITE_ASK_AI_PROVIDER`, and `env.ts` resolves it to a boolean exactly like the existing `resolveDebugLoggingEnabled` pattern. The banner is presentation only: no backend health endpoint, no change to the `POST /api/ask-ai` contract, and no change to mock-response content.
- Status: confirmed
- Context: Local development defaults to `ASK_AI_PROVIDER=mock`, but the frontend gives no visible indication — developers only discover mock mode when chat answers begin with "MOCK RESPONSE". The product owner wants an unmistakable environment indicator on all screens the moment the app loads in mock mode. Because the frontend is a static build and exposing a backend health endpoint is an explicit non-goal, the mock/live signal can only be decided at build/dev time; it must be explicit configuration, never a runtime heuristic. Keeping `ASK_AI_PROVIDER` as the sole switch avoids a second, drift-prone frontend flag (a duplicated cross-boundary constant is a defect per `technical-design-rules.md`) and extends DEC-020's "provider mode is explicit, never inferred from `NODE_ENV`/deploy target" discipline to the frontend.
- Impact:
  - the provider mode stays owned by the single `ASK_AI_PROVIDER` switch already set by the `dev:mock`/`dev:openai` scripts; no new mode switch and no duplicated frontend mode constant
  - `vite.config.ts` bridges `process.env.ASK_AI_PROVIDER` into the client bundle as `import.meta.env.VITE_ASK_AI_PROVIDER`; a directly-set `VITE_ASK_AI_PROVIDER` build var is honored as an explicit override for release builds
  - `env.ts` gains a single authoritative resolver (mirroring `resolveDebugLoggingEnabled`) exposing an `isMockProvider` boolean; the banner renders **iff** the resolved provider is `mock`
  - the signal is never inferred from `import.meta.env.DEV`, `MODE`, `NODE_ENV`, the deploy host, or the "MOCK RESPONSE" answer text
  - a single `MockModeBanner` component mounts once in `PageShell`, so it appears on all four staged steps (FLOW-001, FLOW-002, FLOW-006), the empty/home state, and the answered/conversation view without per-screen wiring; page content is offset so the fixed banner never obscures the header/`ThemeControl`
  - the banner is persistent and non-dismissible with no toggle/close control; copy: `⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend`
  - styling is a static, high-contrast, unmistakable treatment consistent with existing theme tokens; CSS-only and reduced-motion-safe (NFR-006); no decorative motion and no animation library are introduced
  - presentation only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection/boundary, backend routes, or mock-response content; no backend health/status endpoint is added
  - a production build shows the banner only when `ASK_AI_PROVIDER=mock` (or the explicit `VITE_ASK_AI_PROVIDER` override) is set at build time — never otherwise
- Related requirements:
  - REQ-063
  - DEC-020
  - DEC-017
  - NFR-006
  - FLOW-001
  - FLOW-002
  - FLOW-006
- Notes:
  - approved approach: single source of truth (`ASK_AI_PROVIDER`), chosen over a separate hand-set `VITE_MOCK_MODE` frontend flag
  - build-time-only by necessity: the static frontend cannot read runtime provider state without a backend endpoint, which is an explicit non-goal
  - non-goals: backend health/status endpoint, dismissible banner, changes to mock-response content, changes to the ask-AI contract, and any banner in a production build unless mock mode is explicitly configured at build time
