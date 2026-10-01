# Slice F — manual evidence

2026-10-01 F5 — in the browser (dev server on ports 3106/5278, mock mode), at
390×844: navigated to `/quick-lookup`, patched `window.fetch` via
`page.evaluate` to delay only the `/api/ask-ai` call by 20s (mock mode
otherwise answers instantly, too fast to inspect live), typed a question, and
submitted. Confirmed `.wait-inscription-bubble`, `.wait-inscription-seal`,
`.wait-inscription-seal-ring`, and exactly two `.wait-inscription-mote`
elements render; the current threshold line carries `.wait-inscription-line-
ink` with `getComputedStyle(...).animationName` =
`"wait-inscription-ink-reveal, wait-inscription-ink-glow"` and a live
`clip-path: inset(0px 0% 0px 0px)` mid-reveal; the ring's computed
`animationName` is `wait-inscription-ring-spin`; no `canvas` element exists
anywhere under the bubble. `page.emulateMedia({ reducedMotion: "reduce" })`
then re-read the same four elements: every one's computed
`animationDuration` read `1e-05s` (the shared `0.01ms !important` rule) with
`animationIterationCount: 1` — all four still almost instantly, per REQ-023's
"under reduced motion each line appears whole and nothing drifts or turns."

Found and fixed during this pass: the bubble's "edge breathes" treatment
initially set `animation` directly on `.wait-inscription-bubble` — the same
element `.wait-stage-calm` / `.wait-stage-curious` / `.wait-stage-absurd`
already animate (the pre-existing functional pulse `reduced-motion.test.ts`
deliberately keeps exempt from reduced motion, since it is live progress
feedback, not decoration). Two rules setting the single `animation` shorthand
on one element don't merge — the later one in source order silently wins,
so the new breathe rule was quietly replacing the functional pulse instead of
both playing. Confirmed live before the fix: `getComputedStyle(bubble).
animationName` read `"wait-inscription-bubble-breathe"` only, never
`wait-calm`/`wait-curious`/`wait-absurd`. Fixed by moving the breathe
treatment onto a `::after` pseudo-element overlay (its own independent
`animation`), confirmed after the fix: the bubble's own `animationName` is
`wait-calm` (or `-curious`/`-absurd`) and its `::after`'s is
`wait-inscription-bubble-breathe` — both now play, and the `::after` rule
(not the bubble element) is what's listed in the reduced-motion block.

2026-10-01 F6 — documented decision: this slice touches only
`apps/frontend/src/components/AskAiWaitingPanel.tsx` (+ `.test.tsx`),
`apps/frontend/src/index.css`'s new `wait-inscription-*` rules, and
`apps/frontend/src/lib/askAiWaitStages.ts` (untouched — thresholds/copy stay).
It does not touch shared chrome, the token set (`--accent`/`--accent-soft`
etc. are read, not defined, here), or any file the REQ-202 Life Tracker
before/after pair exists to catch a regression in. No REQ-202 pair is
produced for this slice, matching the GAMEPLAN's explicit scope note.

2026-10-01 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). The dev-server instance (ports 3106/5278) was
started by this session as a tracked background task (`bv80bhfah`) and
stopped via `TaskStop`; `lsof -i :3106 -i :5278` empty after. Reviewable
capture: none (F6 above is the documented no-REQ-202-pair decision).
Disposable capture: none taken — the scenario was verified via
`page.evaluate`/`getComputedStyle` inspection, which captures the exact
computed animation state more precisely than a screenshot would. The
Playwright MCP server wrote its own console/snapshot logs to the launch
checkout's root `.playwright-mcp/` (its own cwd) during this slice's browser
pass; those were identified by today's timestamp (20-03 through 20-05) and
deleted after the pass, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
exactly ` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing
cap-raise edit).
