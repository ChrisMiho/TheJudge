# Slice 04 — Card owner at collection

## Status: complete

## Goal

Capture card owner for all non-stack zones when adding cards.

## Requirements

- `ZoneCardItem.owner?: PlayerLabel`
- Owner select on add (default: active player or Player 1)
- Show owner in zone card list rows
- Stack: no owner at collection (caster at enrichment)
- Backend: validation + prompt `owner:` line for non-stack zones

## Files

- `apps/frontend/src/types.ts`
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/backend/src/validation.ts`
- `apps/backend/src/promptContext.ts`
- `apps/backend/src/promptNormalization.ts`
