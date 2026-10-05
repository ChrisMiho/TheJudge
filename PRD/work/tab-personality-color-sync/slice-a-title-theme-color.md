# Slice A — Branded title and theme-color sync

## Status: done

## Goal

The tab title reads `TheJudge · MTG Assistant`, and the mobile browser bar tint always equals the active profile's accent.

## Requirements

1. `apps/frontend/index.html` `<title>` is exactly `TheJudge · MTG Assistant` (U+00B7). (REQ-219)
2. `index.html` adds `<meta name="theme-color" content="#0050d8">` (Blue default) and `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">` placeholder that slice B replaces at runtime. (REQ-219)
3. `applyPalette` sets the theme-color `content` to `triplet(palette.accent)` on every call, for all six profiles and custom Colorless (REQ-099), creating the meta if absent. No hex table in tab code. (REQ-216)
4. No manifest, no per-route title, no `document.title` assignment.

## Acceptance criteria

- [ ] An exact-string test asserts the `index.html` `<title>` equals `TheJudge · MTG Assistant`
- [ ] A test applies each of the six built-in profiles and asserts the theme-color `content` equals that profile's `tokens.css` `--accent` hex
- [ ] A test applies a custom Colorless palette (`resolveColorlessPalette`) and asserts theme-color equals the resolved custom accent hex
- [ ] A test asserts `applyPalette` creates the theme-color meta when absent and does not duplicate it on repeat calls
- [ ] `index.html` contains no manifest link and tab code contains no new per-profile hex table (grep over `applyPalette.ts` shows no `#` hex literals)
- [ ] `npm --workspace apps/frontend run test` passes

## Verification

```bash
npm --workspace apps/frontend run test -- applyPalette
npm --workspace apps/frontend run test
grep -n "<title>" apps/frontend/index.html
```

## Files touched

- `apps/frontend/index.html`
- `apps/frontend/src/lib/theme/applyPalette.ts`
- `apps/frontend/src/lib/theme/applyPalette.test.ts`
