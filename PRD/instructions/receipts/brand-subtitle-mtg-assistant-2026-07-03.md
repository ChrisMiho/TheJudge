# Receipt — brand-subtitle-mtg-assistant

- Date: 2026-07-03
- Slug: brand-subtitle-mtg-assistant
- Status: shipped

## Summary

Renamed the product label **Stack Assistant** to **MTG Assistant** across the
shipped UI brand subtitle under `TheJudge`, frontend tests that assert that
string, and live PRD truth (sections, decisions, work-package docs). Historical
receipts were left unchanged.

## Actions taken

- [x] Updated `StagedStepHeader` brand subtitle from `Stack Assistant` to
      `MTG Assistant`
- [x] Updated frontend tests that assert presence/absence of the subtitle
- [x] Promoted the rename through PRD sections, decisions, and
      `PRD/work/card-trade-balancer/` (brand block, mode/nav destination, and
      flow references)
- [x] Left prior receipts under `PRD/instructions/receipts/` untouched
- [x] Wrote this receipt

## Files created

- `PRD/instructions/receipts/brand-subtitle-mtg-assistant-2026-07-03.md`

## Files updated

- `apps/frontend/src/components/StagedStepHeader.tsx` — brand subtitle copy
- `apps/frontend/src/components/StagedStepHeader.test.tsx`
- `apps/frontend/src/App.answered-state.test.tsx`
- `apps/frontend/src/App.interaction-flows.test.tsx`
- `PRD/sections/overview.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/user-flows.md`
- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/system-map.md`
- `PRD/sections/decisions.md`
- `PRD/sections/decisions/personalization.md`
- `PRD/sections/decisions/trade-balancer.md`
- `PRD/work/card-trade-balancer/README.md`
- `PRD/work/card-trade-balancer/DESIGN-BRIEF.md`
- `PRD/work/card-trade-balancer/GAMEPLAN.md`
- `PRD/work/card-trade-balancer/slice-b-navigation-menu.md`

## Verification

```
rg -n "Stack Assistant" apps/frontend/src/
  (no matches)

rg -n "Stack Assistant" PRD/sections PRD/work
  (no matches)

rg -n "MTG Assistant" apps/frontend/src/components/StagedStepHeader.tsx
  23:        <p className="text-sm text-zinc-300">MTG Assistant</p>
```
