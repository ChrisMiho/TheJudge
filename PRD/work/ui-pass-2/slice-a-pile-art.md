# Slice A — Trade gold-pile art follows the direction-1 mockup

## Status: planned

## Goal

Redraw the tier art in TradePile.tsx to the mockup's drawing (rimmed coin stacks, curved mounds, two-tone faceted gem, goblet on tier 5, mockup palette) with tiers, glow/dim cue, transitions, props and aria-label unchanged.

## Requirements

1. REQ-215 (amended, accepted at the gate)
2. REQ-216 (pile colours stay a named exemption in TradePile.tsx)
3. REQ-207

**Product truth by intent:** the REQ-215 amendment in `GATE-QUESTIONS.md` (`## REQ-215`: the pile-art bullet plus the one Notes line) is applied to `PRD/sections/functional-requirements.md` in this slice, together with the code. Apply it exactly as the accepted diff reads; touch no other requirement.

Browser risk: yes (SVG art, two viewports). Compare against `docs/design/ui-reimagining/direction-1/trade-balancer.html` served locally. Dependencies: none (parallel-ready).

## Acceptance criteria

- [ ] A1: `TradePile.tsx` uses the mockup palette (`#e2b13c`, `#c9962c`, `#7a4f12`, `#d9a63a`, `#a855f7`, `#d8b4fe`, `#7e22ce`) and no longer uses the old `#f2c14e`/`#d4a017`/`#9b59b6` constants
- [ ] A2: Coins render as stacked cylinders with a rim rect, mounds as curved Bezier paths, the gem as a two-polygon faceted cut, and tier 5 carries a goblet (no straight-`points` triangle mound remains)
- [ ] A3: Tiers, props, `aria-label` text, `data-testid="trade-pile"`, richer-glows/lighter-dims cue and drop-in/lift-fade transitions are unchanged; existing trade tests pass
- [ ] A4: `PRD/sections/functional-requirements.md` REQ-215 pile-art bullet and Notes line match the accepted amendment in `GATE-QUESTIONS.md`; no other requirement edited
- [ ] A5: Visual: at desktop 1440x900 with Side A at tier 5 and Side B at tier 2, the app piles read as the mockup's art (rimmed stacks, rounded mounds, faceted gem, goblet) next to the direction-1 `trade-balancer.html` capture; still flat-shaded, bronze-edged, one gem on tiers 4-5 (manual)
- [ ] A6: Visual: at phone 390x844 the piles keep their box, do not clip, and the tier drop-in/lift-fade still plays (manual)
- [ ] A7: Browser closed, owned dev server stopped, ports released; captures written under `PRD/work/ui-pass-2/.playwright-mcp/` (manual)
- [ ] A8: Frontend typecheck and lint pass

## Verification

```bash
npm --workspace apps/frontend run test -- --run src/components/trade
npm --workspace apps/frontend run typecheck
npx eslint apps/frontend/src/components/trade/TradePile.tsx
```

## Files touched

- `apps/frontend/src/components/trade/TradePile.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx` (only if a test asserts old art)
- `PRD/sections/functional-requirements.md` (REQ-215, applied by intent)

Evidence for manual criteria: dated lines in `slice-a.evidence.md`.
