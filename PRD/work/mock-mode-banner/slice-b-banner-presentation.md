# Slice B — MockModeBanner component, mount, and styling

## Status: planned

## Goal

Render the persistent, non-dismissible mock-mode banner on every screen when
`isMockProvider` is true, mounted once in `PageShell`, with content offset so it
never obscures the header or `ThemeControl`.

## Depends on

Slice A — imports `isMockProvider` from `apps/frontend/src/lib/env.ts`.

## Requirements

1. New `apps/frontend/src/components/MockModeBanner.tsx`:
   - returns `null` when `isMockProvider` is `false`
   - when `true`, renders a fixed full-width top bar with centered copy exactly:
     `⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend`
   - `role="status"`; no close/toggle/setting/auto-hide control
   - static, high-contrast styling from existing theme tokens (`--accent-*` and
     existing zinc surfaces in `index.css`); CSS-only, no keyframes, no animation
     library; z-index below the `ThemeControl` wrapper's `z-30` so ThemeControl
     stays on top and clickable
2. Add banner styles to `apps/frontend/src/index.css` (e.g. `.mock-mode-banner`)
   using existing tokens; nothing motion-related, so no
   `prefers-reduced-motion` branch is required (NFR-006 satisfied by construction).
3. Mount `<MockModeBanner />` once in `apps/frontend/src/components/PageShell.tsx`
   and apply a conditional top-offset (extra `padding-top`, e.g. a
   `data-mock-banner="true"` attribute or class gated on `isMockProvider`) so the
   fixed banner never covers `StagedStepHeader`. Non-mock builds render no banner
   and no offset (visual no-op).
4. New `apps/frontend/src/components/MockModeBanner.test.tsx`:
   - mock resolution → banner renders with the exact copy and is non-dismissible
     (no button/close control present)
   - non-mock resolution → banner absent (component renders `null`)
   - mock the `isMockProvider` export (e.g. `vi.mock("../lib/env", …)`) to drive
     both branches without relying on build-time env

## Acceptance criteria

- [ ] With `isMockProvider === true`, banner renders fixed at the top with the
  exact approved copy; with `false`, nothing renders
- [ ] Banner is non-dismissible (no close/toggle control in the DOM) and
  persistent (no auto-hide logic)
- [ ] Mounted once in `PageShell`; appears on empty/home, all four staged steps
  (FLOW-001, FLOW-002, FLOW-006), and the answered/conversation view
- [ ] Page content is offset so `StagedStepHeader` is not obscured; `ThemeControl`
  stays visible and clickable (manual check with `dev:mock`)
- [ ] Styling is static/high-contrast from existing tokens; CSS-only, no
  animation library
- [ ] `npm run dev` (mock) shows the banner on load; `dev:openai` shows none
- [ ] Presentation only: no change to `AskAiRequest`, Zod schemas, `GameContext`,
  prompt assembly, provider boundary, backend routes, or mock-response content

## Verification

```bash
npm run test --workspace apps/frontend -- src/components/MockModeBanner.test.tsx
npm run quality:check
# manual: banner present on every screen and ThemeControl usable
ASK_AI_PROVIDER=mock npm run dev
# manual: no banner
ASK_AI_PROVIDER=openai npm run dev:openai
```

## Files touched

- `apps/frontend/src/components/MockModeBanner.tsx` (new)
- `apps/frontend/src/components/MockModeBanner.test.tsx` (new)
- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/index.css`

## PRD promotion checklist (executed in thejudge-cleanup)

- [ ] Flip the mock-mode-banner entry in `sections/system-map.md` to `shipped`
  (product code wired in + receipt written)
- [ ] Confirm REQ-063 and DEC-084 need no wording changes post-implementation
  (they are already `confirmed`; do not edit `Status:` for shipped-vs-planned)
- [ ] Write receipt at `PRD/instructions/receipts/mock-mode-banner-<YYYY-MM-DD>.md`
- [ ] Delete `PRD/work/mock-mode-banner/` entirely
- [ ] Update `PRD/README.md` only if navigation/read-order changed

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (presentation-only, per DEC-084)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/mock-mode-banner/` ready to delete
