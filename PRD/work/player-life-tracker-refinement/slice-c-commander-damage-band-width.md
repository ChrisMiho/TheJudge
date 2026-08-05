# Slice C — Commander-damage band width +20%

## Status: done

## Goal

Widen `CommanderDamageCell`'s +/− tap bands by 20% (REQ-112), from 44px to
≈53px. Matrix layout and the always-visible −/+ interaction are unchanged.

## Requirements

1. `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
   (`:227-245`, the local `CommanderDamageCell` component) — replace
   `min-h-11` with `min-h-[53px]` on both the decrease button (`:231`) and
   the increase button (`:245`) (44px × 1.2 = 52.8, rounded to a whole
   pixel: 53px). No other class on these two buttons changes.
2. Do not touch `PlayerLifeCard`'s life bands — that's slice B.
3. Do not touch the shared `CounterControl` component (named/custom counter
   tiles) — this slice is scoped to `CommanderDamageCell` only.

## Acceptance criteria

- [ ] Both `CommanderDamageCell` bands are `min-h-[53px]`.
- [ ] Tapping a band still calls the passed `onIncrement`/`onDecrement`
      exactly as before; increasing still reduces the target's life via the
      existing `setCommanderDamage` state-layer behavior (unchanged, not
      touched by this slice) — no interaction/behavior regression, sizing
      only.
- [ ] `CounterPanel.test.tsx` still passes; if no test currently asserts the
      exact band-height class, add one case (matrix decrease/increase band
      each have `min-h-[53px]`) so a future regression is caught.
- [ ] `npm --workspace apps/frontend run typecheck` clean.

## Verification

```bash
cd apps/frontend
npx vitest run CounterPanel
npx eslint src/components/portal/life-tracker/CounterPanel.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.test.tsx`
