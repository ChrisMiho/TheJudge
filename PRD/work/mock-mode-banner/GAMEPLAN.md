# GAMEPLAN — mock-mode-banner

## Objective

Render a persistent, non-dismissible banner at the top of every frontend screen
when the app is built/run with the mock AI provider. Presentation only — no
backend, contract, or mock-response-content change. Authority: **REQ-063**,
**DEC-084** (extends **DEC-020**, reuses **DEC-017**, honors **NFR-006**).

## Architecture / data flow

Single source of truth is the existing `ASK_AI_PROVIDER` env var. No second
frontend mode flag is introduced.

```
dev:mock / dev:openai script        package.json:11-12  (ASK_AI_PROVIDER=…)
  → scripts/dev.mjs spawns frontend with env: process.env   (confirmed line 16)
    → vite.config.ts `define` bridge
         import.meta.env.VITE_ASK_AI_PROVIDER =
           process.env.VITE_ASK_AI_PROVIDER ?? process.env.ASK_AI_PROVIDER ?? ""
      → env.ts resolveIsMockProvider(import.meta.env.VITE_ASK_AI_PROVIDER) → boolean
        → MockModeBanner renders iff isMockProvider === true
          → mounted once in PageShell.tsx (covers every screen)
```

Key facts confirmed against the code:

- `scripts/dev.mjs:16` passes `env: process.env` to the spawned frontend dev
  process, so `ASK_AI_PROVIDER` reaches vite's `process.env`. The `define`
  bridge is required because vite only auto-injects `VITE_`-prefixed vars from
  `.env` files, not from `process.env`.
- `vite.config.ts` currently has no `define` block — one is added.
- `env.ts` already exposes pure resolvers consumed via module-level constants
  (`resolveApiBaseUrl`, `resolveDebugLoggingEnabled`). The new resolver mirrors
  this shape exactly, and `env.test.ts` already unit-tests the pure resolvers.
- `PageShell.tsx` is the single global wrapper rendered by every branch in
  `App.tsx` (game-context/zone-confirm/zone-collection/enrichment/answered), so
  one mount covers the full flow plus the answered/conversation view.

## Resolver semantics (`resolveIsMockProvider`)

Pure function `(rawValue: string | undefined) => boolean`:

- trimmed, lower-cased value `"mock"` → `true`
- everything else → `false`: `"openai"`, empty string, `undefined`, and any
  unrecognized value (fail-safe: never claim mock unless explicitly configured)
- never reads `import.meta.env.DEV`, `MODE`, `NODE_ENV`, the deploy host, or the
  "MOCK RESPONSE" answer text
- does **not** throw on unknown values (unlike `resolveDebugLoggingEnabled`): an
  unrecognized provider must hide the banner, not crash the app

Module export: `export const isMockProvider = resolveIsMockProvider(import.meta.env.VITE_ASK_AI_PROVIDER);`

## Presentation / layout

- `MockModeBanner` returns `null` unless `isMockProvider`. When shown it renders
  a `position: fixed; top:0; left:0; right:0` full-width bar, centered copy:
  `⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend`.
- Static, high-contrast styling built from existing theme tokens
  (`--accent-*`, existing zinc surface colors in `index.css`). CSS-only, no
  keyframes, no animation library; nothing to gate behind `prefers-reduced-motion`
  because the banner has no motion (NFR-006 satisfied by construction).
- Non-dismissible: no close button, toggle, setting, or auto-hide. Use
  `role="status"` (informational, not an alert) so it is announced without
  being interruptive.
- **ThemeControl coexistence:** the `ThemeControl` wrapper in `App.tsx:583` is
  `fixed right-3 top-3 z-30`. Give the banner a z-index **below** 30 (e.g. a
  `z-20` token) so `ThemeControl` stays on top and fully clickable — the banner
  never obscures it. Banner copy is centered, so the top-right corner the theme
  button occupies is empty banner space. No `App.tsx` change required; verified
  by manual check.
- **Header offset:** `PageShell` applies a conditional top-offset class (extra
  `padding-top`) only when `isMockProvider`, so the fixed banner never covers the
  `StagedStepHeader`. Non-mock builds are a visual no-op (no banner, no offset).

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Build-time mock signal: `vite.config.ts` bridge + `env.ts` resolver/export + resolver unit tests | — |
| B | `MockModeBanner` component, `PageShell` mount + offset, styling, component tests | A |

Sequential: B imports `isMockProvider` from `env.ts`, which A creates. Stated
blocker — not parallelizable.

## Verification checklist

- [ ] `npm run test --workspace apps/frontend` green (resolver + banner tests)
- [ ] `npm run quality:check` green for touched areas
- [ ] `ASK_AI_PROVIDER=mock npm run dev` → banner visible on load, every screen
- [ ] `ASK_AI_PROVIDER=openai npm run dev:openai` → no banner anywhere
- [ ] Explicit `VITE_ASK_AI_PROVIDER` overrides `ASK_AI_PROVIDER`
- [ ] `ThemeControl` remains visible and clickable with banner present
- [ ] `StagedStepHeader` not obscured by the fixed banner on any screen
- [ ] No change to `AskAiRequest`, Zod schemas, backend routes, or mock content

## Out of scope (non-goals — DEC-084)

Backend health/status endpoint, any runtime provider-mode fetch, dismissibility,
a second frontend mode flag, and any banner in a production build unless mock
mode is explicitly configured at build time.
