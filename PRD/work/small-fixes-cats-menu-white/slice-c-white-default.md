# Slice C — White is the default colour

## Status: planned

## Goal

A first-time visitor lands on White (first paint and settled page), and a
missing or broken saved colour falls back to White. Blue stays in the catalog,
unchanged.

## Requirements

1. `DEFAULT_PALETTE_ID` becomes `"white"` in `lib/theme/palettes.ts` (comment
   updated).
2. `tokens.css`: split `:root, [data-profile="blue"]` — Blue block keeps its six
   values; a separate `:root` block takes White's six values and stays before
   every `[data-profile="..."]` block. Shared surface block untouched.
3. `index.html` `theme-color` and placeholder favicon fill become #ede7d6
   (deliberate pre-script placeholder, pinned to the token layer by test).
4. `AmbientScene.tsx` three Blue fallbacks read `DEFAULT_PALETTE_ID`.
5. `src/test/appliedTheme.ts` reads `DEFAULT_PALETTE_ID`; default-pin tests
   updated (`palettes.test.ts` lines 76-80 whole test; `App.mtg-color-themes.test.tsx`
   title at line 171 says White).
6. Build applies its share of the accepted `PRD/sections/` amendments by
   intent, together with the code, in the same PR: the REQ-099, REQ-044 and
   FLOW-007 blocks of `GATE-QUESTIONS.md` (including the shared-chrome spec and
   system-map "Blue default" lines). Nothing ships from inside `PRD/work/`.

## Acceptance criteria

- [ ] C1. `palettes.test.ts` default test asserts `DEFAULT_PALETTE_ID` is `"white"` and the default palette name contains "white" (test).
- [ ] C2. First-paint test in `applyPalette.test.ts`: the `:root {` block of `tokens.css` equals the `[data-profile="white"]` block (same properties, same values); `index.html` `theme-color` and decoded favicon fill equal White's `--accent`; the Blue block still carries Blue's six values (test).
- [ ] C3. Order test: the offset of `:root {` precedes each of the six `[data-profile="<id>"] {` blocks (test).
- [ ] C4. `AmbientScene.test.tsx`: with no `data-profile` and reduced motion, the still-frame fingerprint equals White's and differs from Blue's; the per-colour golden test stays green (test).
- [ ] C5. `App.mtg-color-themes.test.tsx` fallback test says White and passes; `appliedTheme.ts` follows the constant.
- [ ] C6. Frontend test suite passes; `npm run quality:check` green for touched areas.
- [ ] C7. Live with fresh storage: first paint and settled page are White.
- [ ] C8. Live: pick Blue then Red in Theme; `getComputedStyle(document.documentElement)` reads `--accent` #0050d8 for Blue and #c10230 for Red, and after reload with each saved.
- [ ] C9. The REQ-099, REQ-044 and FLOW-007 amendments from `GATE-QUESTIONS.md` are applied to `PRD/sections/` in this PR.
- [ ] C10. Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/small-fixes-cats-menu-white/.playwright-mcp/`.
- [ ] C11. Whole-package check: slices A and B acceptance criteria are all true and the full ship list below is met.

## Verification

```bash
npm --workspace apps/frontend run test
npm run quality:check
```

## Files touched

- `apps/frontend/src/lib/theme/palettes.ts`, `palettes.test.ts`, `applyPalette.test.ts`
- `apps/frontend/src/styles/tokens.css`
- `apps/frontend/index.html`
- `apps/frontend/src/components/AmbientScene.tsx`, `AmbientScene.test.tsx`
- `apps/frontend/src/test/appliedTheme.ts`, `App.mtg-color-themes.test.tsx`
- `PRD/sections/` (REQ-099, REQ-044, FLOW-007 and the "Blue default" lines)

## PRD promotion checklist (executed in cleanup)

- [ ] REQ-203, REQ-207, REQ-099, REQ-044, FLOW-007, REQ-113 amendments present in `PRD/sections/` (applied by `build` with the code)
- [ ] Nothing durable left only in `PRD/work/small-fixes-cats-menu-white/`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/small-fixes-cats-menu-white/` ready to delete
