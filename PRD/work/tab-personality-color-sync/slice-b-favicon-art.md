# Slice B — Per-profile favicon

## Status: planned

## Goal

The tab icon shows the active profile's motif in the active accent and swaps when the profile changes.

## Requirements

1. New pure helper `apps/frontend/src/lib/theme/faviconArt.ts` exporting `buildFaviconHref(motif, accentHex)`: wraps `MOTIF_SYMBOLS[motif]` in a 100x100 SVG, replaces `currentColor` with `accentHex`, returns a `data:image/svg+xml` URI. Read-only reuse of `MOTIF_SYMBOLS`; no new art, no fetch, no CDN. (REQ-201)
2. `applyPalette` sets `link[rel="icon"]` `href` to `buildFaviconHref(palette.motif, accent)` on every call, creating the link if absent, never duplicating it. Custom Colorless uses the resolved custom accent. (REQ-099, REQ-219)
3. Static icon only: no animation, no timers. (NFR-006 not engaged)
4. Accent comes from `triplet(palette.accent)`; the helper holds no profile colour. (REQ-216)

## Acceptance criteria

- [ ] `faviconArt.test.ts` asserts, for each of the six motifs, the decoded SVG contains that motif's `MOTIF_SYMBOLS` paths and the accent hex, and contains no `currentColor`
- [ ] A test applies each of the six profiles and asserts exactly one `link[rel="icon"]` whose `href` decodes to that profile's motif drawn in that profile's accent; the six hrefs are pairwise distinct
- [ ] A test applies custom Colorless and asserts the favicon contains the resolved custom accent hex
- [ ] A test asserts the favicon `href` starts with `data:image/svg+xml` and contains no `http` URL
- [ ] `faviconArt.ts` and `applyPalette.ts` contain no `setInterval`/`setTimeout`/`requestAnimationFrame` and no profile hex literals
- [ ] `npm --workspace apps/frontend run test` and `npm run typecheck` pass

## Verification

```bash
npm --workspace apps/frontend run test -- faviconArt applyPalette
npm run typecheck
npm run lint
```

## Files touched

- `apps/frontend/src/lib/theme/faviconArt.ts` (new)
- `apps/frontend/src/lib/theme/faviconArt.test.ts` (new)
- `apps/frontend/src/lib/theme/applyPalette.ts`
- `apps/frontend/src/lib/theme/applyPalette.test.ts`
