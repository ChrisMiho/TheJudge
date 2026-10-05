# Gameplan — tab-personality-color-sync (REQ-219)

The browser tab (Chrome/Firefox) wears TheJudge's mark in the active Magic colour, shows one branded title, and tints the mobile browser bar. Switch Theme and the tab re-skins with no reload. Nothing inside the app changes.

## Pinned values

- Exact title string: `TheJudge · MTG Assistant` (U+00B7 middle dot, single spaces). One fixed string, never per-profile, never per-route.
- theme-color `content` = active profile accent as `#rrggbb`.
- Favicon = SVG data URI: the profile's `MOTIF_SYMBOLS[motif]` drawn with `currentColor` replaced by the active accent hex, set as the `href` of the single `<link rel="icon" type="image/svg+xml">`.

## Architecture and data flow

`useThemePalette` already calls `applyPalette(palette)` on mount and on every change. `applyPalette` is the one apply point. After it sets `data-profile` and any custom `--accent*`, it computes `accent = triplet(palette.accent)` (built-ins and custom Colorless alike; `palettes.tokens.test.ts` already keeps `palettes.ts` equal to `tokens.css`, so no second hex table exists). Then it:

1. sets `meta[name="theme-color"]` `content` to `accent`;
2. sets `link[rel="icon"]` `href` to `buildFaviconHref(palette.motif, accent)`.

`buildFaviconHref` is a small pure helper in `apps/frontend/src/lib/theme/faviconArt.ts`. It reads `MOTIF_SYMBOLS` (read-only reuse), wraps it in an `<svg viewBox="0 0 100 100">` with a rounded badge background derived from the accent, replaces `currentColor`, and returns a `data:image/svg+xml,` URI. No fetch, no CDN. Motif cut-outs read `--disc`; the helper substitutes a fixed neutral for the badge fill (a structural constant, not a profile colour).

`index.html` ships the defaults (Blue-equivalent link, meta, title) so the tab is branded before JS runs; `applyPalette` overwrites them. If the tags are missing (tests), `applyPalette` creates them.

## Slices (sequential)

| Slice | Scope | Depends on |
| --- | --- | --- |
| A | `index.html` title, theme-color meta, icon link; `applyPalette` keeps theme-color equal to the active accent | none |
| B | `faviconArt.ts` helper; `applyPalette` swaps the favicon per profile and custom Colorless | A |
| C | Real-browser check across six profiles, PRD apply of REQ-219, ship gates | B |

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` green, incl. new exact-title, theme-color x6, favicon x6, custom Colorless tests
- [ ] `npm run quality:check` green
- [ ] Real browser: favicon, title, and mobile theme-color re-skin across all six profiles; captures under `PRD/work/tab-personality-color-sync/.playwright-mcp/`
- [ ] No manifest, no animation, no in-app change, no hard-coded per-profile hex in tab code
- [ ] REQ-219 applied to `PRD/sections/functional-requirements.md` and `shared-chrome/README.md` exactly per GATE-QUESTIONS.md
