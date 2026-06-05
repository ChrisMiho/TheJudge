# Slice B — CSS keyframe classes

## Status: done

## Goal

Add the three wait-stage keyframe animations to `index.css` so the waiting panel component can apply them via class names.

## Requirements

1. Add `@keyframes wait-calm`, `@keyframes wait-curious`, `@keyframes wait-absurd` to `index.css`.
2. Add utility classes `.wait-stage-calm`, `.wait-stage-curious`, `.wait-stage-absurd` that each apply their animation.
3. Animations are purely functional (NFR-006 carve-out) — no decorative polish.
4. `wait-calm`: gentle opacity pulse, period ~2.5s, subtle (opacity 0.75–1.0).
5. `wait-curious`: slightly faster pulse, period ~1.8s, same opacity range.
6. `wait-absurd`: playful scale-and-fade drift, period ~1.4s, scale 0.97–1.0 + opacity.
7. All animations loop infinitely and use `ease-in-out` easing.

## Files touched

- `apps/frontend/src/index.css` (edit — append after existing `.enrichment-card-enter` block)

## Tests

No automated test for CSS keyframes. Acceptance verified manually in the browser.

## Acceptance criteria

- [ ] Three `@keyframes` blocks present in `index.css`
- [ ] Three `.wait-stage-*` classes present, each referencing their keyframe
- [ ] `npm run lint` passes (CSS changes don't affect ESLint)
- [ ] Manual: applying each class to an element in devtools produces visible animation

## Verification

```bash
npm run lint
# Then manual devtools check in browser
```
