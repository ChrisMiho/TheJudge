# Slice 02 — Zone confirmation polish

## Status: complete

## Goal

Symmetrical zone checklist; block continue with zero zones.

## Requirements

- 2-column grid on `sm+` for 7 zone checkboxes
- Disable Continue when `selectedZones.length === 0` with inline hint
- Wire `canAdvance("zone-confirm", …)` from `flow.ts`

## Files

- `apps/frontend/src/components/ZoneConfirmStep.tsx`
- `apps/frontend/src/App.tsx`
