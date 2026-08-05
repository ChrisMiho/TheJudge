# Slice B — Life adjustment band width +40%

## Status: done

## Goal

Widen `PlayerLifeCard`'s life +/− tap bands by 40% (REQ-112), from 48px to
≈67px, in both orientations. Interaction model (tap-to-adjust, no hold, no
menu) is unchanged.

## Requirements

1. `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
   (`:109-114`) — in `decreaseBandClassName` and `increaseBandClassName`,
   replace every `h-12` with `h-[67px]` and every `w-12` with `w-[67px]`
   (48px × 1.4 = 67.2, rounded to a whole pixel: 67px). This applies to both
   the `isListLayout` branch (left/right bands, `w-*`) and the default
   branch (top/bottom bands, `h-*`). No other class on these two band
   strings changes.
2. Do not touch `CommanderDamageCell` (`CounterPanel.tsx`) — that's slice C.
3. Do not touch band placement logic (`isListLayout`, `isWideSeat`,
   rotation/container-query sizing) — only the thickness classes change.

## Acceptance criteria

- [ ] Both bands are `67px` thick in every layout branch (grid mode
      top/bottom, list-mode wide head/foot seats left/right, list-mode
      narrow pair seats top/bottom).
- [ ] Tapping a band still calls `onAdjustLife`/`onSetLife` exactly as
      before — no interaction/behavior regression, sizing only.
- [ ] `PlayerLifeCard.test.tsx`'s band-class assertions (grid top/bottom,
      list narrow-pair top/bottom, list wide-seat left/right) are updated to
      assert `h-[67px]`/`w-[67px]` in place of `h-12`/`w-12`.
- [ ] `npm --workspace apps/frontend run typecheck` clean.

## Verification

```bash
cd apps/frontend
npx vitest run PlayerLifeCard
npx eslint src/components/portal/life-tracker/PlayerLifeCard.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.test.tsx`
