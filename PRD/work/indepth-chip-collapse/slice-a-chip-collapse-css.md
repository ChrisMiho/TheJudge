# Slice A — In-depth chip collapse (CSS state rule)

## Status: planned

## Goal

The In-depth chip shows only its glyph while the Ask composer is engaged (textarea focused or box holds text), and shows the label at rest.

## Requirements

1. Extend `apps/frontend/src/styles/flow.css` (near line 281) with a state rule hiding `.q-box .deep .lbl` when the textarea is focused (`.q-box:has(textarea:focus)`) or the box is non-empty (`.q-box:not([data-fill="0"])`). Not a bare `.q-box:focus-within`.
2. Collapsed chip uses the same compact padding as the `<480px` glyph-only chip.
3. No change to `ComposerPill.tsx` structure, the `<480px` rule, or the chip's `aria-label`/`title`.
4. Scope to `.q-box` (Ask composer); the `followup` variant is unaffected.
5. Add a CSS-contract test in `apps/frontend/src/components/ComposerPill.test.tsx` (it already reads flow.css) asserting the rule keys on `textarea:focus`, uses `data-fill`, and contains no `.q-box:focus-within` collapse; plus a render test that the chip button keeps `aria-label="Add in-depth details"` and the `.lbl` stays `aria-hidden`.
6. Live-verify in a browser (Playwright), captures under `PRD/work/indepth-chip-collapse/.playwright-mcp/`.

## Acceptance criteria

- [ ] flow.css hides `.q-box .deep .lbl` on `.q-box:has(textarea:focus)` and on `.q-box:not([data-fill="0"])`, and contains no `.q-box:focus-within` rule touching `.lbl` (CSS-contract test passes)
- [ ] At 1440px, the label is hidden when the textarea is focused (computed `display: none`)
- [ ] At 1440px, the label is hidden when the box holds text, even after the textarea blurs
- [ ] At 1440px with an empty box and the textarea not focused, the label is visible while keyboard focus is on the chip, on the mic, and on the send button
- [ ] At 1440px, emptying the box and blurring the textarea restores the label
- [ ] At 390px the label is hidden in every state (rest, focused, holding text)
- [ ] The chip's accessible name is still "Add in-depth details" and `.lbl` stays `aria-hidden` (test passes)
- [ ] `ComposerPill.tsx` markup unchanged (`git diff --stat` shows no change to it)
- [ ] `npm run quality:check` is green
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/indepth-chip-collapse/.playwright-mcp/`

## Verification

```bash
npm run test --workspace apps/frontend -- ComposerPill
npm run quality:check
```

Browser: serve the frontend, check 1440x716 and 390x740 per the criteria, then `browser_close` and stop the server.

## Files touched

- `apps/frontend/src/styles/flow.css`
- `apps/frontend/src/components/ComposerPill.test.tsx`
