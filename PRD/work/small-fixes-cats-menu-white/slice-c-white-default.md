# Slice C — White is the default colour

## Status: done

### Status notes (evidence, self-reported)

- C1, C5: `npx vitest run src/lib/theme src/components/AmbientScene.test.tsx src/App.mtg-color-themes.test.tsx` — 7 files, 112 tests passed (palettes.test default is white; mtg-color-themes title says White; `appliedTheme.ts` reads `DEFAULT_PALETTE_ID`).
- C2, C3: `applyPalette.test.ts` new "first paint follows the default (White)" block: `:root` equals White block, `index.html` theme-color and decoded favicon fill equal #ede7d6, Blue block keeps its six values, `:root` precedes all six profile blocks. Pass.
- C4: `AmbientScene.test.tsx` new test (no data-profile = White frame, not Blue's); 29 tests pass incl. golden.
- C6: `npm --workspace apps/frontend run test` — 150 files, 1615 tests; `npm run quality:check` exit 0 (scripts suite: tests 1059, pass 1059, fail 0).
- C7: live, fresh browser context: `--accent` #ede7d6, `data-profile` white, theme-color meta #ede7d6, nothing saved. Capture `.playwright-mcp/c-fresh-white-1440.png`. Retired saved id "emerald": falls back to White and the key is deleted. Note: the dev server injects CSS with script, so a no-script first-paint probe cannot run there; the first paint is guarded by the `:root` tests above.
- C8: picked Blue then Red in the Theme band: `--accent` #0050d8 / #c10230 after the pick and again after reload (saved ids blue, red).
- C9: REQ-099 (3 lines + note), REQ-044 (2 lines + note), FLOW-007 (2 lines + note), shared-chrome and system-map "Blue default" lines applied. `decisions.md` left as retired history.
- C10: browser closed, server stopped, port 5391 released.
- C11: slices A and B criteria all true (see their notes); ship gates below met. Durable PRD truth for all six slots is in `PRD/sections/`.

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
