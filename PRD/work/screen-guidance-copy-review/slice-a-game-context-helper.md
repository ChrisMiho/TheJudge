# Slice A — Game-context "Players in game" helper

## Status: planned

## Goal

Enhance the game-context "Players in game" helper line so it names the `▾`
expander control's purpose while keeping the 20/40 defaults in one concise line.

## Requirements

1. In `apps/frontend/src/App.tsx`, replace the helper text at the
   `text-xs text-zinc-400` `<p>` under the "Players in game" label
   (currently line 356):
   - Before: `2 players start at 20 life. 3+ players default to 40 life.`
   - After: `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`
   - Copy exactly, including `▾` (U+25BE) and the em dash `—` (U+2014).
2. Text-only change: do not touch the `▾`/`▸` expander markup, its `aria-label`,
   `aria-expanded`, or toggle behavior (REQ-069); do not change any other line.
3. Add/extend a test in `apps/frontend/src/App.game-setup-zones.test.tsx`
   asserting the new string renders on the game-context screen and the old
   string is absent.

## Acceptance criteria

- [ ] Game-context helper renders exactly `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`
- [ ] The string `2 players start at 20 life. 3+ players default to 40 life.` no longer appears anywhere in `apps/frontend/src/`.
- [ ] Test asserts new string present and old string absent on the game-context screen.
- [ ] Expander control semantics (REQ-069) unchanged — no markup/aria/behavior diff.

## Verification

```bash
grep -n "Tap ▾ to set names and life totals" apps/frontend/src/App.tsx
grep -rn "2 players start at 20 life" apps/frontend/src/   # expect no matches
npm --workspace apps/frontend run test -- src/App.game-setup-zones.test.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/App.game-setup-zones.test.tsx`
