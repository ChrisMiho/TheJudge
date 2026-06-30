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
