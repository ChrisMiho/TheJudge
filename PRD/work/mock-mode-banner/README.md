status: active

# mock-mode-banner

Show a persistent, non-dismissible top-of-screen banner on every frontend screen when the app is built/run in mock AI provider mode. The mock/live signal is build-time configuration-driven from the single `ASK_AI_PROVIDER` source of truth; presentation only.

## Source

- `IDEA.md` — original idea capture
- `DESIGN-BRIEF.md` — refined scope, signal mechanism, decisions
- `GAMEPLAN.md` — architecture, data flow, verification checklist

## Slices

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](slice-a-config-signal.md) | Build-time mock signal: `vite.config.ts` bridge + `env.ts` resolver/export + resolver unit tests | — | planned |
| [B](slice-b-banner-presentation.md) | `MockModeBanner` component, `PageShell` mount + offset, styling, component tests | A | planned |

Sequential: B imports `isMockProvider` from `env.ts` (created in A). Stated blocker — not parallelizable.

## Implementation map

- `apps/frontend/vite.config.ts` — `define` bridge for `import.meta.env.VITE_ASK_AI_PROVIDER` (Slice A)
- `apps/frontend/src/lib/env.ts` — `resolveIsMockProvider` + `isMockProvider` export (Slice A)
- `apps/frontend/src/lib/env.test.ts` — resolver unit tests (Slice A)
- `apps/frontend/src/components/MockModeBanner.tsx` (+ `.test.tsx`) — banner component (Slice B)
- `apps/frontend/src/components/PageShell.tsx` — single mount point + content offset (Slice B)
- `apps/frontend/src/index.css` — static high-contrast banner styles from existing tokens (Slice B)

## PRD truth

- REQ-063 — Mock-mode environment banner (`sections/functional-requirements.md`)
- DEC-084 — Configuration-driven mock-mode banner (`sections/decisions/ui-presentation.md`, indexed in `sections/decisions.md`)
