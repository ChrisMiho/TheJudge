# Slice C — Keep composer above the phone keyboard

## Status: planned

## Goal

On a phone the pinned question box floats above the on-screen keyboard when focused, on both Ask screens.

## Requirements

1. REQ-218 keyboard criterion: the pinned frame resolves its height against the visual viewport (`dvh` plus a `visualViewport` resize hook that sets a CSS variable), shared by both screens.
2. Hook is inert when `visualViewport` is unavailable (jsdom, old browsers) and cleans up its listeners.
3. No change to `ComposerPill` structure.

## Acceptance criteria

- [ ] A hook (or equivalent) tracks `visualViewport` height and exposes it to the fit frame; unit tests cover resize, absence of `visualViewport`, and listener cleanup
- [ ] Both Ask screens consume it; unit test or CSS assertion shows the frame height uses the visual-viewport value with a `100dvh` fallback
- [ ] Emulated focused phone viewport with a shrunken visual viewport (keyboard simulated): the send pill `bottom` stays within the visual viewport on both Ask screens (measured in browser)
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/anchor-ask-composer/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test
npm run typecheck
```

## Files touched

- `apps/frontend/src/hooks/useVisualViewportHeight.ts` (new)
- `apps/frontend/src/hooks/useVisualViewportHeight.test.ts` (new)
- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/index.css`
