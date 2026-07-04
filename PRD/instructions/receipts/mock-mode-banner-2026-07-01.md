# Receipt — mock-mode-banner

- Date: 2026-07-01
- Slug: mock-mode-banner
- Status: shipped

## Summary

Persistent, non-dismissible mock-mode banner rendered on every frontend screen
when the app is built/run with the mock AI provider. Build-time
configuration-driven from the single `ASK_AI_PROVIDER` source of truth
(`vite.config.ts` → `import.meta.env.VITE_ASK_AI_PROVIDER` → `env.ts`
`isMockProvider`). Presentation only — no backend, contract, or
mock-response-content change. Authority: REQ-063, DEC-085.

## Actions taken

- [x] Verified Slice A acceptance criteria against code (vite bridge, resolver, export, unit tests)
- [x] Verified Slice B acceptance criteria against code (banner component, mount, offset, styles, component tests)
- [x] Confirmed REQ-063 and DEC-085 already promoted; no wording changes needed
- [x] Added `## Mock-mode banner` entry to `sections/system-map.md` (status `shipped`)
- [x] Wrote this receipt
- [x] Deleted `PRD/work/mock-mode-banner/`

## Files created

- `apps/frontend/src/components/MockModeBanner.tsx`
- `apps/frontend/src/components/MockModeBanner.test.tsx`
- `PRD/instructions/receipts/mock-mode-banner-2026-07-01.md`

## Files updated

- `apps/frontend/vite.config.ts` — `define` bridge for `import.meta.env.VITE_ASK_AI_PROVIDER`
- `apps/frontend/src/lib/env.ts` — `resolveIsMockProvider` + `isMockProvider` export
- `apps/frontend/src/lib/env.test.ts` — resolver unit tests
- `apps/frontend/src/components/PageShell.tsx` — single banner mount + conditional content offset
- `apps/frontend/src/index.css` — static high-contrast banner styles + `data-mock-banner` offset
- `PRD/sections/system-map.md` — added `Mock-mode banner` entry (`shipped`)

## Files deleted

- `PRD/work/mock-mode-banner/` (README.md, IDEA.md, DESIGN-BRIEF.md, GAMEPLAN.md, slice-a-config-signal.md, slice-b-banner-presentation.md)

## Verification

- `npm run test --workspace apps/frontend -- src/lib/env.test.ts src/components/MockModeBanner.test.tsx` → 14 passed (2 files)
- `npm --workspace apps/frontend run typecheck` → clean
- `eslint` on the six touched frontend files → clean (exit 0)
