# IDEA: frontend-routing-and-code-splitting

## Problem

The frontend has grown into six distinct function areas — `portal`, `trade`,
`scan`, `lifeTracker`, `feedback`, `conversationHistory` — with no router and no
code splitting. Views switch via state inside a 117-line `App.tsx`, so no
function area is addressable: there are no deep links, no shareable URLs, no
browser back/forward, and no way to land a user directly on a feature. There are
also no lazy boundaries — `React.lazy`, dynamic `import()`, and `manualChunks`
are all absent — so every visitor downloads every feature's code regardless of
what they open. Both constraints tighten as TheJudge grows from one validated
assistant loop into the planned multi-feature suite (`DEC-094`).

## Outcome

Function areas become addressable routes with lazy-loaded boundaries, so a URL
identifies a feature, the back button behaves, and initial payload scales with
what the user actually opens rather than with the size of the whole suite. Route
boundaries additionally give the test suite and CI natural split lines, which
matters because NFR-012 now records that the CI gate is at 1m58s against a
2m00s target with roughly 100 frontend cases of headroom before a fourth shard
is required.

## Non-goals

- No change to `POST /api/ask-ai` request/response shape, stack-order semantics,
  or any product behavior — this is navigation and bundling structure only
- Not a visual redesign; screen layout truth stays with `screen-layout.md`
  (DEC-149 / REQ-126) and is not renegotiated here
- Not a server-rendering or framework migration (no Next.js/Remix); the app
  stays React + Vite
- Not a state-management rewrite; `contextFlow` and existing hooks stay as they
  are unless a route boundary forces a minimal supporting change

## Evidence

Gathered during `ci-quality-check-runtime` slice E (2026-08-07):

- `apps/frontend/src`: 124 test files, 1227 cases; 107 `.tsx` + 125 `.ts` source
  files; runtime dependencies are only `react`, `react-dom`, `react-markdown`,
  `remark-gfm`
- no router dependency in `apps/frontend/package.json`
- no `React.lazy`, dynamic `import()`, `manualChunks`, or `rollupOptions` in
  `apps/frontend/vite.config.ts` or `src/`
- `src/App.tsx` is 117 lines and carries 17 sibling `App.*.test.tsx` files,
  indicating it is the single funnel for every function area
